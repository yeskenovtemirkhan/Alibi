from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.db.models import CustomerProfile, Device, Investigation, Transaction
from app.ml.model import FraudModel
from app.schemas.investigation import ContextRow, EvidenceOut, RiskFactor, ScenarioOut, VerificationOut
from app.schemas.transaction import TxCore
from app.services.analyze import factor_label
from app.services.presenters import country_name, fmt_kzt, tx_core

TOP_FACTORS = 4
TITLES = {"APPROVED": "Legitimate activity", "BLOCKED": "Suspected fraud", "VERIFY": "Awaiting verification"}
METHOD = "Push confirmation to enrolled device"
PENDING = VerificationOut(label="Trusted-device verification", method=METHOD, outcome="pending", result_label="Waiting for response")


def _factors(inv: Investigation, model: FraudModel) -> list[RiskFactor]:
    """Top risk-increasing SHAP contributions of the prediction that started this investigation, in risk points."""
    p = inv.prediction
    if p is None or not p.shap_values:
        return []
    base = model.explain(p.features).base_score  # same model version → same expected value
    total = sum(p.shap_values.values())
    k = (float(p.score) - base) * 100 / total if abs(total) > 1e-9 else 0.0
    up = sorted(((f, v) for f, v in p.shap_values.items() if v > 0), key=lambda x: -x[1])[:TOP_FACTORS]
    return [RiskFactor(label=factor_label(f, p.features), impact=round(v * k, 1)) for f, v in up]


def _usual_device(db: Session, t: Transaction) -> str | None:
    q = (
        select(Device.label)
        .join(Transaction, Transaction.device_id == Device.id)
        .where(Transaction.customer_id == t.customer_id, Transaction.id != t.id, Transaction.occurred_at < t.occurred_at)
        .group_by(Device.label)
        .order_by(func.count().desc(), Device.label)
        .limit(1)
    )
    return db.scalar(q)


def _context(db: Session, t: Transaction) -> list[ContextRow]:
    profile = db.get(CustomerProfile, t.customer_id)
    c = t.customer
    here = t.city if t.city == country_name(t.country) else f"{t.city}, {t.country}"
    rows = [ContextRow(label="Usual location", normal=f"{c.home_city}, {c.home_country}", now=here)]
    if profile is not None:
        rows.insert(0, ContextRow(label="Typical amount", normal=fmt_kzt(profile.median_amount), now=fmt_kzt(t.amount)))
    if (usual := _usual_device(db, t)) is not None:
        rows.append(ContextRow(label="Usual device", normal=usual, now=t.device.label if t.device else "Unknown device"))
    if profile is not None and profile.usual_merchant_categories:
        usual_cats = ", ".join(c.replace("_", " ") for c in profile.usual_merchant_categories).capitalize()
        rows.append(ContextRow(label="Usual merchants", normal=usual_cats, now=t.merchant.name))
    if t.is_vpn:
        used_before = db.scalar(select(func.count()).where(Transaction.customer_id == t.customer_id, Transaction.id != t.id, Transaction.is_vpn))
        provider = str(t.metadata_.get("vpn_provider", "")).capitalize()
        rows.append(ContextRow(label="Network", normal="VPN seen before" if used_before else "No VPN", now=f"{provider} VPN".strip()))
    return rows


def get_scenario(db: Session, model: FraudModel, reference: str) -> ScenarioOut | None:
    t = db.scalars(
        select(Transaction)
        .where(Transaction.reference == reference)
        .options(joinedload(Transaction.customer), joinedload(Transaction.merchant), joinedload(Transaction.device))
    ).one_or_none()
    if t is None:
        return None
    inv = db.scalars(
        select(Investigation)
        .where(Investigation.transaction_id == t.id)
        .order_by(Investigation.started_at.desc(), Investigation.created_at.desc())
        .options(selectinload(Investigation.evidence), selectinload(Investigation.verification_events),
                 selectinload(Investigation.decisions), joinedload(Investigation.prediction))
        .limit(1)
    ).one_or_none()
    if inv is None or not inv.decisions:
        return None

    decision = max(inv.decisions, key=lambda d: (d.decided_at, d.created_at))
    verification = PENDING if inv.status == "awaiting_verification" else None
    if inv.verification_events:
        v = max(inv.verification_events, key=lambda e: e.requested_at)
        ok = v.status == "confirmed"
        verification = VerificationOut(label=v.label, method=METHOD, outcome="confirmed" if ok else "failed",
                                       result_label="Trusted device confirmed" if ok else "Owner rejected the transaction")

    return ScenarioOut(
        key=str(inv.id),
        title=TITLES[decision.outcome],
        status=inv.status,
        tx=TxCore(**tx_core(t)),
        initial_risk=float(inv.initial_risk),
        factors=_factors(inv, model),
        context=_context(db, t),
        evidence=[EvidenceOut(id=f"e{e.position}", name=e.name, source=e.source, trust=e.trust, impact=float(e.impact), detail=e.detail,
                              direction=e.metadata_.get("direction", "fraud" if e.impact > 0 else "legit"))
                  for e in inv.evidence],
        verification=verification,
        final_risk=float(decision.final_risk),
        decision=decision.outcome,
        reason=decision.reason,
    )
