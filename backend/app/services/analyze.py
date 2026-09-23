"""POST /transactions/analyze: resolve → history → features → LightGBM → SHAP → persist."""
import re
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.db.models import Customer, Device, Merchant, ModelPrediction, Transaction
from app.ml.features import CustomerState, Tx
from app.ml.geo import CAPITALS, coords
from app.ml.model import FraudModel
from app.schemas.analyze import AnalyzeIn, AnalyzeOut, Factor, ModelInfo
from app.services.presenters import COUNTRY_NAMES, fmt_kzt
from app.services.transactions import to_out

HISTORY_DAYS = 90
TOP_FACTORS = 5
CODE_BY_NAME = {name.casefold(): code for code, name in COUNTRY_NAMES.items()}


class BadInput(ValueError):
    pass


def country_code(value: str) -> str:
    v = value.strip()
    if len(v) == 2 and v.upper() in COUNTRY_NAMES:
        return v.upper()
    code = CODE_BY_NAME.get(v.casefold())
    if code is None:
        raise BadInput(f"Unknown country: {value}")
    return code


def normalize_device(label: str) -> str:
    """Simulator labels like "Trusted iPhone 14" or "iPhone 15 Pro (first seen today)" → "iPhone 14" / "iPhone 15 Pro"."""
    label = re.sub(r"\s*\(.*?\)\s*", " ", label).strip()
    return re.sub(r"^trusted\s+", "", label, flags=re.I).strip() or label


def _next_ref(db: Session, prefix: str, table_col) -> int:
    nums = db.scalars(select(table_col).where(table_col.like(f"{prefix}%"))).all()
    return max((int(n[len(prefix):]) for n in nums if n[len(prefix):].isdigit()), default=0) + 1


def resolve_customer(db: Session, user: str, country: str, now: datetime) -> Customer:
    user = user.strip()
    if found := db.scalars(select(Customer).where(Customer.external_ref == user.upper())).one_or_none():
        return found
    digits = "".join(re.findall(r"\d+", user))
    if digits:
        matches = db.scalars(select(Customer).where(Customer.external_ref.like(f"%{digits}"))).all()
        if len(matches) == 1:
            return matches[0]
    # Unknown customer: create one with no history (every signal will be "new").
    ref = f"SIM-{_next_ref(db, 'SIM-', Customer.external_ref):04d}"
    c = Customer(external_ref=ref, full_name=user[:120], home_country="KZ", home_city="Almaty", customer_since=now)
    db.add(c)
    db.flush()
    return c


def resolve_merchant(db: Session, name: str, country: str, city: str) -> Merchant:
    q = select(Merchant).where(func.lower(Merchant.name) == name.strip().lower()).order_by((Merchant.country == country).desc())
    if found := db.scalars(q.limit(1)).first():
        return found
    slug = re.sub(r"[^A-Z0-9]+", "-", name.upper()).strip("-")[:16] or "MERCHANT"
    m = Merchant(external_ref=f"MER-{slug}-{uuid.uuid4().hex[:6].upper()}", name=name.strip()[:120], mcc="5999",
                 category="other", country=country, city=city)
    db.add(m)
    db.flush()
    return m


def resolve_device(db: Session, customer: Customer, label: str, now: datetime) -> Device:
    clean = normalize_device(label)
    for d in db.scalars(select(Device).where(Device.customer_id == customer.id)):
        if d.label.casefold() == clean.casefold():
            d.last_seen_at = now
            return d
    kind = "emulator" if "emulat" in clean.lower() else "desktop" if re.search(r"mac|windows|desktop", clean, re.I) else "mobile"
    d = Device(customer_id=customer.id, fingerprint=f"fp-sim-{uuid.uuid4().hex[:12]}", label=clean[:80], device_type=kind,
               is_trusted=False, first_seen_at=now, last_seen_at=now)
    db.add(d)
    db.flush()
    return d


def _as_tx(t: Transaction) -> Tx:
    lat, lon = coords(t.city, t.country)
    return Tx(t.occurred_at, float(t.amount), t.country, str(t.device_id), str(t.merchant_id), t.is_vpn, lat, lon)


def history(db: Session, customer_id: uuid.UUID, before: datetime) -> list[Tx]:
    rows = db.scalars(
        select(Transaction).where(
            Transaction.customer_id == customer_id,
            Transaction.occurred_at < before,
            Transaction.occurred_at >= before - timedelta(days=HISTORY_DAYS),
        ).order_by(Transaction.occurred_at)
    ).all()
    return [_as_tx(t) for t in rows]


def factor_label(feature: str, f: dict[str, float]) -> str:
    v = f[feature]
    return {
        "amount": f"Amount {fmt_kzt(v)}",
        "amount_ratio": f"Amount {v:.0f}× above normal" if v >= 2 else f"Amount {v:.1f}× the usual" if v >= 1 else "Amount below usual",
        "new_country": "New country" if v else "Known country",
        "new_device": "New device" if v else "Known device",
        "vpn": "VPN connection" if v else "No VPN",
        "merchant_seen": "Known merchant" if v else "Unusual merchant",
        "velocity_1h": f"{int(v)} transactions in the last hour",
        "hours_since_prev": "No previous transactions" if v >= 720 else f"{v:.1f} h since previous transaction",
        "travel_speed_kmh": f"Impossible travel (~{v:,.0f} km/h)" if v > 900 else "Plausible travel" if v > 0 else "Same location",
    }[feature]


def analyze(db: Session, model: FraudModel, body: AnalyzeIn) -> AnalyzeOut:
    now = body.occurred_at or datetime.now(timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    country = country_code(body.country)
    customer = resolve_customer(db, body.user, country, now)
    city = body.city or (customer.home_city if country == customer.home_country else CAPITALS.get(country, country))
    merchant = resolve_merchant(db, body.merchant, country, city)
    device = resolve_device(db, customer, body.device, now)

    state = CustomerState.from_history(history(db, customer.id, now))
    lat, lon = coords(city, country)
    feats = state.features(Tx(now, float(body.amount), country, str(device.id), str(merchant.id), body.vpn, lat, lon))
    ex = model.explain(feats)
    flagged = ex.score >= model.threshold

    tx = Transaction(
        reference=f"ATX-{_next_ref(db, 'ATX-', Transaction.reference)}", customer_id=customer.id, device_id=device.id,
        merchant_id=merchant.id, amount=round(body.amount, 2), currency="KZT", country=country, city=city,
        channel="online" if body.vpn else "card_present", is_vpn=body.vpn,
        status="investigating" if flagged else "approved", occurred_at=now, metadata_={"source": "analyze_api"},
    )
    db.add(tx)
    db.flush()
    pred = ModelPrediction(transaction_id=tx.id, model_name=model.name, model_version=model.version,
                           score=round(ex.score, 5), threshold=round(model.threshold, 5), features=feats, shap_values=ex.shap)
    db.add(pred)
    db.commit()

    tx = db.scalars(select(Transaction).where(Transaction.id == tx.id)
                    .options(joinedload(Transaction.customer), joinedload(Transaction.merchant), joinedload(Transaction.device))).one()
    top = sorted(ex.shap, key=lambda k: abs(ex.shap[k]), reverse=True)[:TOP_FACTORS]
    return AnalyzeOut(
        prediction_id=str(pred.id),
        transaction=to_out(tx, pred.score),
        risk=round(ex.score * 100, 2),
        base_risk=round(ex.base_score * 100, 2),
        threshold=round(model.threshold * 100, 2),
        flagged=flagged,
        model=ModelInfo(name=model.name, version=model.version),
        factors=[Factor(feature=k, label=factor_label(k, feats), value=round(feats[k], 4), shap=round(ex.shap[k], 4),
                        impact=round(ex.impact_pts[k], 2)) for k in top],
        features={k: round(v, 4) for k, v in feats.items()},
    )
