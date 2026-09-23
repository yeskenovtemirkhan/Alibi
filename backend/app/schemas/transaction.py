from typing import Literal

from app.schemas.common import CamelModel

TxStatus = Literal["Blocked", "Investigating", "Verified", "Approved"]


class TxCore(CamelModel):
    """Mirrors `TxCore` in the frontend."""

    id: str  # transaction reference, e.g. "ATX-7842"
    amount: float
    country: str  # display name, e.g. "Singapore"
    city: str
    merchant: str
    device: str
    vpn: bool
    user: str  # masked customer reference, e.g. "U•••123"
    time: str  # local time, e.g. "10:24 AM"


class TransactionOut(TxCore):
    """Mirrors `Transaction` in the frontend. `risk` is null until a model has scored the transaction."""

    risk: float | None
    status: TxStatus
    date: str  # local date, YYYY-MM-DD
