"""ALIBI Investigation Engine (hackathon MVP).

1. Initial risk p0 = the REAL LightGBM score for the transaction (scored now if it never was).
2. Evidence: deterministic checks against PostgreSQL (travel bookings, airport purchase, device trust, merchant history,
   VPN). Each item has a direction (supports "legit" or "fraud") and a trust level.
3. Risk update in log-odds space:  logit(p1) = logit(p0) + clip(Σ ±w(trust), -EVIDENCE_CAP, +EVIDENCE_CAP)
   Bounded so no pile of weak evidence can swing the score arbitrarily.
4. Decision = cheapest expected cost (configurable below):
     APPROVE: p · amount                       (fraud we let through)
     BLOCK:   (1 − p) · amount · BLOCK_FRICTION (good customer we block)
     VERIFY:  VERIFY_COST + p · amount · VERIFY_LEAK   (only once, only if the customer has a trusted device)
   Plus one rule: never block a customer with an enrolled trusted device before asking them (verify-before-block).
5. Trusted-device verification: confirmed → −VERIFY_WEIGHT log-odds and decide again without the VERIFY option;
   rejected → +VERIFY_WEIGHT and always BLOCK (the account owner explicitly said "not me").
"""
import math
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.db.models import Decision, Device, Evidence, Investigation, Merchant, ModelPrediction, Transaction, VerificationEvent
from app.ml.features import CustomerState
from app.ml.model import FraudModel
from app.services.analyze import _as_tx, history
from app.services.presenters import country_name

TRUST_WEIGHT = {"HIGH": 1.2, "MEDIUM": 0.7, "LOW": 0.35}  # log-odds per evidence item
EVIDENCE_CAP = 4.0
VERIFY_WEIGHT = 3.0
BLOCK_FRICTION = 0.25   # cost of wrongly blocking, as a share of the amount (churn, support, lost sale)
VERIFY_COST = 1_500.0   # ₸ per push confirmation (friction + ops)
VERIFY_LEAK = 0.10      # share of fraud that could still slip through a verification step
TRAVEL_WINDOW = timedelta(days=30)
AIRPORT_WINDOW = timedelta(days=3)
P_MIN = 0.001


class EngineError(Exception):
    """Raised for requests that don't fit the investigation's current state (mapped to HTTP 409)."""


@dataclass(frozen=True)
class Found:
    name: str
    source: str
    trust: str
    direction: str  # "legit" | "fraud"
    detail: str


def logit(p: float) -> float:
    p = min(max(p, 1e-6), 1 - 1e-6)
    return math.log(p / (1 - p))


def sigmoid(x: float) -> float:
    return 1 / (1 + math.exp(-x))


def bounded(p: float) -> float:
    """Reported final risk stays within [0.1%, 99.9%]: the engine never claims certainty."""
    return min(max(p, P_MIN), 1 - P_MIN)


def decide(p: float, amount: float, *, can_verify: bool) -> tuple[str, dict[str, float]]:
    costs = {"APPROVE": p * amount, "BLOCK": (1 - p) * amount * BLOCK_FRICTION}
    if can_verify:
        costs["VERIFY"] = VERIFY_COST + p * amount * VERIFY_LEAK
    choice = min(costs, key=costs.get)
    if choice == "BLOCK" and can_verify:
        choice = "VERIFY"  # verify-before-block
    return choice, {k: round(v, 2) for k, v in costs.items()}


def _prior(db: Session, customer_id, before: datetime, window: timedelta):
    return db.scalars(
        select(Transaction).join(Merchant).where(
            Transaction.customer_id == customer_id, Transaction.occurred_at < before, Transaction.occurred_at >= before - window
        ).options(joinedload(Transaction.merchant))
    ).all()


def gather_evidence(db: Session, t: Transaction) -> list[Found]:
    ev: list[Found] = []
    customer, where = t.customer, country_name(t.country)
    abroad = t.country != customer.home_country
    recent = _prior(db, t.customer_id, t.occurred_at, TRAVEL_WINDOW)

    if abroad:
        flights = [p for p in recent if p.merchant.category == "airline" and p.metadata_.get("destination_country") == t.country]
        hotels = [p for p in recent if p.merchant.category == "hotel" and p.merchant.country == t.country]
        for f in flights[:1]:
            days = (t.occurred_at - f.occurred_at).days
            ev.append(Found(f"Flight to {where}", "Travel History", "HIGH", "legit",
                            f"{f.merchant.name} ticket ({f.metadata_.get('route', 'route n/a')}) bought {days} days earlier with the same card."))
        for h in hotels[:1]:
            nights = h.metadata_.get("nights")
            ev.append(Found("Hotel booking", "Card Transactions", "HIGH", "legit",
                            f"{h.merchant.name}, {where}{f': {nights}-night stay' if nights else ''} paid with the same card."))
        if not flights and not hotels:
            ev.append(Found("No travel history", "Travel History", "HIGH", "fraud",
                            f"No flight or hotel activity for {where} in the last 30 days."))
        airport = [p for p in recent if p.merchant.category == "airport_retail" and t.occurred_at - p.occurred_at <= AIRPORT_WINDOW]
        for a in airport[:1]:
            hours = (t.occurred_at - a.occurred_at).total_seconds() / 3600
            ev.append(Found("Previous airport transaction", "Transaction History", "MEDIUM", "legit",
                            f"{a.merchant.name}, {a.city}, {hours:.0f} hours earlier."))

    device: Device | None = t.device
    if device is not None and device.is_trusted:
        ev.append(Found("Trusted device", "Device Graph", "HIGH", "legit", f"{device.label} is enrolled in the customer's mobile banking."))
    else:
        ev.append(Found("Unknown device", "Device Graph", "HIGH", "fraud",
                        f"{device.label if device else 'Device'} was never used on this account before."))

    paid_before = any(p.merchant_id == t.merchant_id for p in _prior(db, t.customer_id, t.occurred_at, timedelta(days=90)))
    if paid_before:
        ev.append(Found("Known merchant", "Transaction History", "MEDIUM", "legit", f"The customer has paid {t.merchant.name} before."))

    if t.is_vpn:
        flagged = bool(t.metadata_.get("exit_node_flagged"))
        ev.append(Found("Suspicious VPN" if flagged else "VPN connection", "Network Intelligence", "HIGH" if flagged else "MEDIUM", "fraud",
                        "Exit node flagged in prior fraud cases." if flagged else "Connection comes through a VPN."))
    return ev


def ensure_prediction(db: Session, model: FraudModel, t: Transaction) -> ModelPrediction:
    """Latest real model prediction for the transaction; scores it now (history before the transaction) if needed."""
    pred = db.scalars(select(ModelPrediction).where(ModelPrediction.transaction_id == t.id)
                      .order_by(ModelPrediction.created_at.desc()).limit(1)).first()
    if pred is not None:
        return pred
    feats = CustomerState.from_history(history(db, t.customer_id, t.occurred_at)).features(_as_tx(t))
    ex = model.explain(feats)
    pred = ModelPrediction(transaction_id=t.id, model_name=model.name, model_version=model.version, score=round(ex.score, 5),
                           threshold=round(model.threshold, 5), features=feats, shap_values=ex.shap)
    db.add(pred)
    db.flush()
    return pred


def _reason(outcome: str, ev: list[Found], verification: str | None, p: float) -> str:
    legit = [e.name.lower() for e in ev if e.direction == "legit"]
    fraud = [e.name.lower() for e in ev if e.direction == "fraud"]
    if outcome == "APPROVED":
        if verification == "confirmed":
            why = f"Supporting evidence ({', '.join(legit)})" if legit else "The evidence"
            return why + " and the customer confirmed on their trusted device."
        return f"Low risk, consistent with the customer's history ({', '.join(legit)})." if legit else "Low risk."
    if outcome == "BLOCKED":
        why = f"No evidence supports the anomaly ({', '.join(fraud)})" if fraud else "Risk stayed high"
        return why + (", and the account owner rejected it on their trusted device." if verification == "rejected" else ".")
    if p >= 0.5:
        return "Strong fraud signals. Before blocking, ALIBI asks the account owner to confirm on their trusted device."
    return "Evidence explains most of the risk. ALIBI asks the account owner to confirm on their trusted device."


def _t(db: Session, reference: str) -> Transaction:
    t = db.scalars(select(Transaction).where(Transaction.reference == reference)
                   .options(joinedload(Transaction.customer), joinedload(Transaction.device), joinedload(Transaction.merchant))).one_or_none()
    if t is None:
        raise LookupError(reference)
    return t


def _has_trusted_device(db: Session, customer_id) -> bool:
    return db.scalar(select(Device.id).where(Device.customer_id == customer_id, Device.is_trusted).limit(1)) is not None


def _decide_and_record(db: Session, t: Transaction, inv: Investigation, p: float, ev: list[Found], *, can_verify: bool,
                       verification: str | None, now: datetime) -> None:
    choice, _ = decide(p, float(t.amount), can_verify=can_verify)
    if verification == "rejected":
        choice = "BLOCK"
    outcome = {"APPROVE": "APPROVED", "BLOCK": "BLOCKED", "VERIFY": "VERIFY"}[choice]
    risk = Decimal(str(round(bounded(p) * 100, 2)))
    inv.final_risk = risk
    inv.status = "awaiting_verification" if outcome == "VERIFY" else "closed"
    inv.completed_at = None if outcome == "VERIFY" else now
    inv.summary = _reason(outcome, ev, verification, p)
    t.status = {"VERIFY": "investigating", "BLOCKED": "blocked", "APPROVED": "verified" if verification == "confirmed" else "approved"}[outcome]
    db.add(Decision(investigation_id=inv.id, transaction_id=t.id, outcome=outcome, final_risk=risk, reason=inv.summary,
                    decided_by="system", decided_at=now))


def run(db: Session, model: FraudModel, reference: str) -> None:
    t = _t(db, reference)
    now = datetime.now(timezone.utc)
    pred = ensure_prediction(db, model, t)
    p0 = float(pred.score)
    inv = Investigation(transaction_id=t.id, prediction_id=pred.id, status="running", initial_risk=Decimal(str(round(p0 * 100, 2))), started_at=now)
    db.add(inv)
    db.flush()

    found = gather_evidence(db, t)
    raw = sum(TRUST_WEIGHT[e.trust] * (-1 if e.direction == "legit" else 1) for e in found)
    scale = min(1.0, EVIDENCE_CAP / abs(raw)) if raw else 1.0  # bound the total shift, keep proportions
    x, prev = logit(p0), p0
    for i, e in enumerate(found, start=1):
        w = TRUST_WEIGHT[e.trust] * (-1 if e.direction == "legit" else 1) * scale
        x += w
        p = sigmoid(x)
        db.add(Evidence(investigation_id=inv.id, position=i, name=e.name, source=e.source, trust=e.trust,
                        impact=Decimal(str(round((p - prev) * 100, 2))), detail=e.detail, found_at=now,
                        metadata_={"direction": e.direction, "log_odds": round(w, 4)}))
        prev = p

    _decide_and_record(db, t, inv, sigmoid(x), found, can_verify=_has_trusted_device(db, t.customer_id), verification=None, now=now)
    db.commit()


def verify(db: Session, reference: str, result: str | None) -> str:
    """Trusted-device verification. Without an explicit result the demo is deterministic: the real owner confirms only
    when the transaction came from one of their trusted devices."""
    t = _t(db, reference)
    inv = db.scalars(select(Investigation).where(Investigation.transaction_id == t.id)
                     .order_by(Investigation.started_at.desc()).limit(1)).first()
    if inv is None:
        raise LookupError(reference)
    if inv.status != "awaiting_verification":
        raise EngineError(f"Investigation of {reference} is not waiting for verification (status: {inv.status})")
    result = result or ("confirmed" if t.device is not None and t.device.is_trusted else "rejected")
    now = datetime.now(timezone.utc)
    db.add(VerificationEvent(investigation_id=inv.id, method="push", status="confirmed" if result == "confirmed" else "failed",
                             label="Trusted-device verification", requested_at=now, responded_at=now,
                             metadata_={"kind": "trusted_device", "result": result}))
    x = logit(float(inv.final_risk) / 100) + (-VERIFY_WEIGHT if result == "confirmed" else VERIFY_WEIGHT)
    ev = [Found(e.name, e.source, e.trust, e.metadata_.get("direction", "fraud"), e.detail)
          for e in db.scalars(select(Evidence).where(Evidence.investigation_id == inv.id).order_by(Evidence.position))]
    _decide_and_record(db, t, inv, sigmoid(x), ev, can_verify=False, verification=result, now=now)
    db.commit()
    return result
