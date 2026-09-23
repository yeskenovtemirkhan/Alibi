from typing import Literal

from app.schemas.common import CamelModel
from app.schemas.transaction import TransactionOut


class Kpi(CamelModel):
    key: str
    label: str
    value: float
    prefix: str | None = None
    suffix: str | None = None
    decimals: int | None = None
    delta: str
    delta_good: bool
    spark: list[float]


class FlowData(CamelModel):
    total: int
    suspicious: int
    investigated: int
    approved: int
    verified: int
    blocked: int


class DistBucket(CamelModel):
    range: str
    count: int
    tone: Literal["low", "mid", "high"]


class TrendPoint(CamelModel):
    label: str
    transactions: int
    fraud_rate: float


class RegionPoint(CamelModel):
    region: str
    attempts: int
    x: float
    y: float


class Prevented(CamelModel):
    value: float  # ₸ millions
    delta: str


class DashboardOverview(CamelModel):
    """Mirrors `DashboardOverview` in the frontend. `trends` keys are "7D", "30D", "90D"."""

    as_of: str  # the day the overview is computed for (YYYY-MM-DD)
    kpis: list[Kpi]
    flow: FlowData
    distribution: list[DistBucket]
    trends: dict[Literal["7D", "30D", "90D"], list[TrendPoint]]
    regions: list[RegionPoint]
    recent: list[TransactionOut]
    prevented: Prevented
