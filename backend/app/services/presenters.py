"""Turns database rows into the display values the frontend shows (names, masked ids, local times)."""
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from app.db.models import Transaction

# Kazakhstan uses a single UTC+5 zone. A fixed offset avoids depending on the OS tz database (missing on Windows).
LOCAL_TZ = timezone(timedelta(hours=5))

COUNTRY_NAMES = {
    "KZ": "Kazakhstan", "SG": "Singapore", "AE": "UAE", "TR": "Turkey", "GB": "UK", "US": "USA",
    "DE": "Germany", "GE": "Georgia", "NL": "Netherlands", "CN": "China", "JP": "Japan", "KR": "South Korea",
}

# Frontend TxStatus has no "received": a transaction that hasn't been decided yet is shown as under investigation.
STATUS_LABELS = {
    "received": "Investigating", "investigating": "Investigating", "verified": "Verified",
    "approved": "Approved", "blocked": "Blocked",
}


def country_name(code: str) -> str:
    return COUNTRY_NAMES.get(code, code)


def mask_customer(external_ref: str) -> str:
    return "U•••" + external_ref[-3:]


def local(dt: datetime) -> datetime:
    return dt.astimezone(LOCAL_TZ)


def local_time(dt: datetime) -> str:
    return local(dt).strftime("%I:%M %p")


def fmt_kzt(amount: Decimal | float) -> str:
    return f"₸{round(float(amount)):,}"


def risk_pct(score: Decimal | None) -> float | None:
    return None if score is None else round(float(score) * 100, 1)


def tx_core(t: Transaction) -> dict:
    return {
        "id": t.reference,
        "amount": float(t.amount),
        "country": country_name(t.country),
        "city": t.city,
        "merchant": t.merchant.name,
        "device": t.device.label if t.device else "Unknown device",
        "vpn": t.is_vpn,
        "user": mask_customer(t.customer.external_ref),
        "time": local_time(t.occurred_at),
    }
