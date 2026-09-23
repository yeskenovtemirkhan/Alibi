from datetime import datetime

from pydantic import Field

from app.schemas.common import CamelModel
from app.schemas.transaction import TransactionOut


class AnalyzeIn(CamelModel):
    """Superset of the frontend's `SimulatorInput`: {user, amount, country, merchant, device, vpn}."""

    user: str = Field(min_length=1, max_length=40, examples=["U•••123"], description="CUST-0123, U•••123, or a new name")
    amount: float = Field(gt=0, le=1_000_000_000)
    country: str = Field(min_length=2, max_length=40, examples=["Singapore"], description="name or ISO-2 code")
    merchant: str = Field(min_length=1, max_length=120)
    device: str = Field(min_length=1, max_length=80)
    vpn: bool = False
    city: str | None = Field(default=None, max_length=80)
    occurred_at: datetime | None = None


class Factor(CamelModel):
    feature: str
    label: str
    value: float
    shap: float    # log-odds contribution
    impact: float  # risk percentage points (signed)


class ModelInfo(CamelModel):
    name: str
    version: str


class AnalyzeOut(CamelModel):
    prediction_id: str
    transaction: TransactionOut
    risk: float        # 0..100
    base_risk: float   # 0..100, risk of an average transaction
    threshold: float   # 0..100
    flagged: bool      # risk >= threshold → needs investigation
    model: ModelInfo
    factors: list[Factor]  # top contributions by |SHAP|
    features: dict[str, float]
