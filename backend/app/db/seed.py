"""Deterministic demo seed.

Same input → same rows, every run: UUIDs are uuid5 of stable references, timestamps hang off a fixed anchor,
and randomness comes from per-customer seeded generators. Mirrors the frontend's flagship pair:
ATX-7842 (legitimate traveller) and ATX-7843 (account takeover). The seed holds only facts (transactions, devices,
travel bookings); risk scores come from the real model and decisions from the investigation engine.
"""
import random
import statistics
import uuid
from collections import Counter
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.models import (
    Customer, CustomerProfile, Decision, Device, Evidence, FraudLabel, Investigation, Merchant, ModelPrediction,
    Transaction, VerificationEvent,
)

NAMESPACE = uuid.UUID("5f0c1a2e-7b3d-4c8e-9a61-a11b1a1b1000")
ALMATY = timezone(timedelta(hours=5))
# Matches the frontend demo's "today" (DEMO_TODAY = 2026-09-21), 10:24 local time.
ANCHOR = datetime(2026, 9, 21, 10, 24, tzinfo=ALMATY)
HISTORY_DAYS = 90

# Children first so a reseed can clear everything without violating foreign keys.
SEED_TABLES = (
    "decisions", "verification_events", "evidence", "investigations", "model_predictions", "fraud_labels",
    "transactions", "customer_profiles", "devices", "merchants", "customers",
)


def sid(kind: str, ref: str) -> uuid.UUID:
    return uuid.uuid5(NAMESPACE, f"{kind}:{ref}")


def money(v: float) -> Decimal:
    return Decimal(str(round(v / 50) * 50)).quantize(Decimal("0.01"))


@dataclass(frozen=True)
class M:
    ref: str
    name: str
    mcc: str
    category: str
    country: str
    city: str


MERCHANTS = [
    M("MER-MAGNUM", "Magnum", "5411", "grocery", "KZ", "Almaty"),
    M("MER-SMALL", "Small", "5411", "grocery", "KZ", "Astana"),
    M("MER-TECHNODOM", "Technodom", "5732", "electronics", "KZ", "Almaty"),
    M("MER-SULPAK", "Sulpak", "5732", "electronics", "KZ", "Astana"),
    M("MER-YANDEXGO", "Yandex Go", "4121", "transit", "KZ", "Almaty"),
    M("MER-WOLT", "Wolt", "5812", "food_delivery", "KZ", "Almaty"),
    M("MER-COFFEEBOOM", "Coffee BOOM", "5814", "cafe", "KZ", "Astana"),
    M("MER-AIRASTANA", "Air Astana", "4511", "airline", "KZ", "Almaty"),
    M("MER-ALA-DUTYFREE", "Almaty Airport Duty Free", "5309", "airport_retail", "KZ", "Almaty"),
    M("MER-APPLE-SG", "Apple Store", "5732", "electronics", "SG", "Singapore"),
    M("MER-MBS", "Marina Bay Sands", "7011", "hotel", "SG", "Singapore"),
    M("MER-TRENDYOL", "Trendyol", "5311", "marketplace", "TR", "Istanbul"),
]
MERCHANT_BY_REF = {m.ref: m for m in MERCHANTS}


@dataclass(frozen=True)
class C:
    ref: str
    name: str
    email: str
    city: str
    segment: str
    typical_amount: float
    active_hours: tuple[int, int]
    tx_count: int
    merchants: tuple[str, ...]
    devices: tuple[tuple[str, str, str, bool], ...]  # (fingerprint, label, os, trusted)


CUSTOMERS = [
    C("CUST-0123", "Aruzhan Bekova", "aruzhan.bekova@example.kz", "Almaty", "premium", 18000, (8, 22), 42,
      ("MER-MAGNUM", "MER-YANDEXGO", "MER-WOLT", "MER-TECHNODOM"),
      (("fp-0123-s23", "Galaxy S23", "Android 14", True),)),
    C("CUST-0204", "Daniyar Omarov", "daniyar.omarov@example.kz", "Astana", "retail", 22000, (9, 21), 36,
      ("MER-SMALL", "MER-COFFEEBOOM", "MER-SULPAK", "MER-TRENDYOL"),
      (("fp-0204-ip14", "iPhone 14", "iOS 18", True),)),
    C("CUST-0456", "Madina Serikova", "madina.serikova@example.kz", "Almaty", "retail", 12500, (7, 20), 30,
      ("MER-MAGNUM", "MER-YANDEXGO", "MER-WOLT"),
      (("fp-0456-a54", "Galaxy A54", "Android 14", True),)),
    C("CUST-0789", "Timur Akhmetov", "timur.akhmetov@example.kz", "Almaty", "business", 64000, (9, 19), 28,
      ("MER-TECHNODOM", "MER-AIRASTANA", "MER-WOLT", "MER-MAGNUM"),
      (("fp-0789-mbp", "MacBook Safari", "macOS 15", True), ("fp-0789-ip15", "iPhone 15", "iOS 18", True))),
    C("CUST-0310", "Askar Zhumabekov", "askar.zhumabekov@example.kz", "Almaty", "retail", 9500, (8, 21), 38,
      ("MER-MAGNUM", "MER-YANDEXGO", "MER-WOLT"),
      (("fp-0310-ip14", "iPhone 14", "iOS 18", True),)),
    C("CUST-0305", "Dana Ismailova", "dana.ismailova@example.kz", "Astana", "retail", 14000, (9, 22), 33,
      ("MER-SMALL", "MER-COFFEEBOOM", "MER-SULPAK"),
      (("fp-0305-s22", "Galaxy S22", "Android 14", True),)),
    C("CUST-0321", "Ainur Kassymova", "ainur.kassymova@example.kz", "Astana", "retail", 9000, (10, 23), 34,
      ("MER-SMALL", "MER-COFFEEBOOM", "MER-TRENDYOL"),
      (("fp-0321-p7", "Pixel 7", "Android 15", True),)),
]

ATTACKER_DEVICE = ("fp-0204-attacker", "Unrecognized Android", "Android 11", False)
# Aruzhan's new phone: first seen at Almaty airport 2 days before the purchase, enrolled in mobile banking there.
TRAVEL_DEVICE = ("fp-0123-ip15", "iPhone 15 Pro", "iOS 18", True)


def _rng(ref: str) -> random.Random:
    return random.Random(int("".join(ch for ch in ref if ch.isdigit())) * 7919)


def _history(c: C, customer_id: uuid.UUID, device_ids: list[uuid.UUID], start_no: int) -> list[Transaction]:
    rng = _rng(c.ref)
    out: list[Transaction] = []
    for _ in range(c.tx_count):
        day = rng.randint(3, HISTORY_DAYS)  # nothing in the last 2 days: those are the flagship stories
        hour = rng.randint(*c.active_hours)
        occurred = (ANCHOR - timedelta(days=day)).replace(hour=hour, minute=rng.randint(0, 59))
        m = MERCHANT_BY_REF[rng.choice(c.merchants)]
        amount = money(max(900.0, rng.lognormvariate(0, 0.55) * c.typical_amount))
        out.append(Transaction(
            customer_id=customer_id, device_id=rng.choice(device_ids), merchant_id=sid("merchant", m.ref),
            amount=amount, currency="KZT", country=m.country, city=m.city,
            channel="online" if m.category in ("marketplace", "food_delivery") else "card_present",
            ip_address=None, is_vpn=False, status="approved", occurred_at=occurred,
        ))
    out.sort(key=lambda t: t.occurred_at)
    for i, t in enumerate(out):
        t.reference = f"ATX-{start_no + i}"
        t.id = sid("transaction", t.reference)
    return out


def _profile(c: C, customer_id: uuid.UUID, txs: list[Transaction], merchants: dict[uuid.UUID, M]) -> CustomerProfile:
    amounts = [float(t.amount) for t in txs]
    hours = sorted(t.occurred_at.astimezone(ALMATY).hour for t in txs)
    categories = Counter(merchants[t.merchant_id].category for t in txs)
    return CustomerProfile(
        customer_id=customer_id,
        avg_amount=Decimal(str(round(statistics.fmean(amounts), 2))),
        median_amount=Decimal(str(round(statistics.median(amounts), 2))),
        max_amount=Decimal(str(max(amounts))),
        tx_count_90d=len(txs),
        usual_countries=sorted({t.country for t in txs}),
        usual_merchant_categories=[k for k, _ in categories.most_common(3)],
        active_hour_start=hours[0],
        active_hour_end=hours[-1],
        trusted_device_count=sum(1 for d in c.devices if d[3]),
        last_transaction_at=txs[-1].occurred_at,
        computed_at=ANCHOR - timedelta(hours=1),
    )


def build_seed() -> list[object]:
    """Returns every ORM object to insert, in dependency order. Pure: no DB access."""
    rows: list[object] = []
    merchants = {sid("merchant", m.ref): m for m in MERCHANTS}
    rows += [Merchant(id=i, external_ref=m.ref, name=m.name, mcc=m.mcc, category=m.category, country=m.country, city=m.city)
             for i, m in merchants.items()]

    tx_no = 5000
    txs_by_customer: dict[str, list[Transaction]] = {}
    for c in CUSTOMERS:
        cid = sid("customer", c.ref)
        rows.append(Customer(id=cid, external_ref=c.ref, full_name=c.name, email=c.email, phone=None, home_country="KZ",
                             home_city=c.city, segment=c.segment, customer_since=ANCHOR - timedelta(days=900)))
        dev_ids = []
        for fp, label, os_name, trusted in c.devices:
            did = sid("device", fp)
            dev_ids.append(did)
            rows.append(Device(id=did, customer_id=cid, fingerprint=fp, label=label, device_type="desktop" if "Mac" in label else "mobile",
                               os=os_name, is_trusted=trusted, first_seen_at=ANCHOR - timedelta(days=400), last_seen_at=ANCHOR - timedelta(days=3)))
        txs = _history(c, cid, dev_ids, tx_no)
        tx_no += len(txs)
        txs_by_customer[c.ref] = txs
        rows += txs
        rows.append(_profile(c, cid, txs, merchants))

    rows += _flagship_legit()
    rows += _flagship_fraud()
    return rows


def _tx(ref: str, customer: str, device_fp: str, merchant: str, amount: int, when: datetime, *, status: str, vpn: bool = False,
        channel: str = "card_present", ip: str | None = None, metadata: dict | None = None,
        country: str | None = None, city: str | None = None) -> Transaction:
    m = MERCHANT_BY_REF[merchant]
    return Transaction(id=sid("transaction", ref), reference=ref, customer_id=sid("customer", customer), device_id=sid("device", device_fp),
                       merchant_id=sid("merchant", merchant), amount=Decimal(amount).quantize(Decimal("0.01")), currency="KZT",
                       country=country or m.country, city=city or m.city, channel=channel, ip_address=ip, is_vpn=vpn, status=status,
                       occurred_at=when, metadata_=metadata or {})


def _label(ref: str, tx: Transaction, fraud: bool) -> FraudLabel:
    """Ground truth that arrives after the fact (customer confirmation / chargeback). Never used for scoring."""
    return FraudLabel(id=sid("label", ref), transaction_id=tx.id, label="fraud" if fraud else "legit",
                      source="chargeback" if fraud else "customer_confirmation", labeled_at=ANCHOR + timedelta(days=1))


def _flagship_legit() -> list[object]:
    """Scenario A: Aruzhan flies Almaty → Singapore and buys a laptop there on a phone she enrolled that morning.
    Only context is seeded. Risk, investigation and decision are produced by the model + engine at run time."""
    c = "CUST-0123"
    fp, label, os_name, trusted = TRAVEL_DEVICE
    phone = Device(id=sid("device", fp), customer_id=sid("customer", c), fingerprint=fp, label=label, device_type="mobile",
                   os=os_name, is_trusted=trusted, first_seen_at=ANCHOR - timedelta(hours=3), last_seen_at=ANCHOR)
    flight = _tx("ATX-7801", c, "fp-0123-s23", "MER-AIRASTANA", 286000, ANCHOR - timedelta(days=2, hours=20), status="approved", channel="online",
                 metadata={"route": "ALA-SIN", "destination_country": "SG", "booking_ref": "KC-9F21"})
    # Booked online from Almaty: the card was used in KZ, the hotel itself is in Singapore.
    hotel = _tx("ATX-7802", c, "fp-0123-s23", "MER-MBS", 412000, ANCHOR - timedelta(days=2, hours=19), status="approved", channel="online",
                metadata={"nights": 3, "check_in": "2026-09-20"}, country="KZ", city="Almaty")
    airport = _tx("ATX-7803", c, "fp-0123-s23", "MER-ALA-DUTYFREE", 24500, ANCHOR - timedelta(days=1, hours=22), status="approved")
    main = _tx("ATX-7842", c, fp, "MER-APPLE-SG", 650000, ANCHOR, status="received", ip="203.0.113.24")
    return [phone, flight, hotel, airport, main, _label("ATX-7842", main, fraud=False)]


def _flagship_fraud() -> list[object]:
    """Scenario B: Daniyar's account is taken over; same purchase from an unknown phone behind a VPN."""
    fp, label, os_name, trusted = ATTACKER_DEVICE
    attacker = Device(id=sid("device", fp), customer_id=sid("customer", "CUST-0204"), fingerprint=fp, label=label, device_type="mobile",
                      os=os_name, is_trusted=trusted, first_seen_at=ANCHOR - timedelta(minutes=6), last_seen_at=ANCHOR)
    main = _tx("ATX-7843", "CUST-0204", fp, "MER-APPLE-SG", 650000, ANCHOR + timedelta(minutes=1), status="received", vpn=True,
               ip="198.51.100.77", metadata={"vpn_provider": "commercial", "exit_node_flagged": True})
    return [attacker, main, _label("ATX-7843", main, fraud=True)]


def run_seed(db: Session) -> dict[str, int]:
    """Clears the seeded tables and inserts the dataset in one transaction. Safe to run repeatedly."""
    db.execute(text(f"TRUNCATE {', '.join(SEED_TABLES)} RESTART IDENTITY"))
    rows = build_seed()
    # Flush per type in dependency order (build_seed keeps parents first, but profiles/devices interleave).
    for model in (Merchant, Customer, Device, Transaction, CustomerProfile, ModelPrediction, Investigation, Evidence,
                  VerificationEvent, Decision, FraudLabel):
        db.add_all([r for r in rows if type(r) is model])
        db.flush()
    db.commit()
    return {t: db.execute(text(f"SELECT count(*) FROM {t}")).scalar_one() for t in reversed(SEED_TABLES)}
