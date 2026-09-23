from typing import Literal

from app.schemas.common import CamelModel
from app.schemas.transaction import TxCore


class RiskFactor(CamelModel):
    label: str
    impact: float


class ContextRow(CamelModel):
    label: str
    normal: str
    now: str


class EvidenceOut(CamelModel):
    id: str
    name: str
    source: str
    trust: Literal["HIGH", "MEDIUM", "LOW"]
    impact: float  # risk points this item moved the score (negative lowers risk)
    detail: str
    direction: Literal["legit", "fraud"]  # which hypothesis the evidence supports


class VerificationOut(CamelModel):
    label: str
    method: str
    outcome: Literal["confirmed", "failed", "pending"]
    result_label: str


class ScenarioOut(CamelModel):
    """Mirrors `Scenario` in the frontend: everything the Investigation screen plays back."""

    key: str
    title: str
    status: Literal["open", "running", "awaiting_verification", "closed"]
    tx: TxCore
    initial_risk: float
    factors: list[RiskFactor]
    context: list[ContextRow]
    evidence: list[EvidenceOut]
    verification: VerificationOut | None
    final_risk: float
    decision: Literal["APPROVED", "BLOCKED", "VERIFY"]
    reason: str


class VerifyIn(CamelModel):
    """Trusted-device verification result. Omit `result` to use the deterministic demo outcome."""

    method: Literal["trusted_device"] = "trusted_device"
    result: Literal["confirmed", "rejected"] | None = None
