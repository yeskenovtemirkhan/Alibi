import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Numeric, SmallInteger, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, CreatedAtMixin, TimestampMixin
from app.db.models._types import uuid_pk


class Investigation(TimestampMixin, Base):
    __tablename__ = "investigations"
    __table_args__ = (
        CheckConstraint("status IN ('open', 'running', 'awaiting_verification', 'closed')", name="status"),
        CheckConstraint("initial_risk BETWEEN 0 AND 100", name="initial_risk_range"),
        CheckConstraint("final_risk IS NULL OR final_risk BETWEEN 0 AND 100", name="final_risk_range"),
    )

    id: Mapped[uuid.UUID] = uuid_pk()
    transaction_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("transactions.id", ondelete="CASCADE"), index=True)
    prediction_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("model_predictions.id", ondelete="SET NULL"), index=True)
    status: Mapped[str] = mapped_column(String(24), default="open", server_default="open", index=True)
    initial_risk: Mapped[Decimal] = mapped_column(Numeric(5, 2))
    final_risk: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    summary: Mapped[str | None] = mapped_column(Text)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    transaction: Mapped["Transaction"] = relationship(back_populates="investigations")  # noqa: F821
    prediction: Mapped["ModelPrediction | None"] = relationship()  # noqa: F821
    evidence: Mapped[list["Evidence"]] = relationship(back_populates="investigation", cascade="all, delete-orphan", order_by="Evidence.position")
    verification_events: Mapped[list["VerificationEvent"]] = relationship(back_populates="investigation", cascade="all, delete-orphan")
    decisions: Mapped[list["Decision"]] = relationship(back_populates="investigation", cascade="all, delete-orphan")


class Evidence(CreatedAtMixin, Base):
    __tablename__ = "evidence"
    __table_args__ = (
        UniqueConstraint("investigation_id", "position"),
        CheckConstraint("trust IN ('HIGH', 'MEDIUM', 'LOW')", name="trust"),
        CheckConstraint("impact BETWEEN -100 AND 100", name="impact_range"),
    )

    id: Mapped[uuid.UUID] = uuid_pk()
    investigation_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("investigations.id", ondelete="CASCADE"))
    position: Mapped[int] = mapped_column(SmallInteger)  # order in which ALIBI found it
    name: Mapped[str] = mapped_column(String(120))
    source: Mapped[str] = mapped_column(String(80))
    trust: Mapped[str] = mapped_column(String(8))
    impact: Mapped[Decimal] = mapped_column(Numeric(5, 2))  # percentage points; negative lowers risk
    detail: Mapped[str] = mapped_column(Text)
    # Source-specific payload (booking reference, geo match radius…).
    metadata_: Mapped[dict[str, Any]] = mapped_column("metadata", JSONB, default=dict, server_default="{}")
    found_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    investigation: Mapped[Investigation] = relationship(back_populates="evidence")


class VerificationEvent(CreatedAtMixin, Base):
    __tablename__ = "verification_events"
    __table_args__ = (
        CheckConstraint("method IN ('push', 'sms', 'call', 'biometric')", name="method"),
        CheckConstraint("status IN ('sent', 'confirmed', 'failed', 'expired')", name="status"),
    )

    id: Mapped[uuid.UUID] = uuid_pk()
    investigation_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("investigations.id", ondelete="CASCADE"), index=True)
    method: Mapped[str] = mapped_column(String(16))
    status: Mapped[str] = mapped_column(String(16))
    label: Mapped[str] = mapped_column(String(120))
    requested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    responded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    metadata_: Mapped[dict[str, Any]] = mapped_column("metadata", JSONB, default=dict, server_default="{}")

    investigation: Mapped[Investigation] = relationship(back_populates="verification_events")


class Decision(CreatedAtMixin, Base):
    __tablename__ = "decisions"
    __table_args__ = (
        CheckConstraint("outcome IN ('APPROVED', 'BLOCKED', 'VERIFY')", name="outcome"),
        CheckConstraint("decided_by IN ('system', 'analyst')", name="decided_by"),
        CheckConstraint("final_risk BETWEEN 0 AND 100", name="final_risk_range"),
    )

    id: Mapped[uuid.UUID] = uuid_pk()
    investigation_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("investigations.id", ondelete="CASCADE"), index=True)
    # Denormalized for fast "latest decision per transaction" lookups.
    transaction_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("transactions.id", ondelete="CASCADE"), index=True)
    outcome: Mapped[str] = mapped_column(String(8))
    final_risk: Mapped[Decimal] = mapped_column(Numeric(5, 2))
    reason: Mapped[str] = mapped_column(Text)
    decided_by: Mapped[str] = mapped_column(String(8), default="system", server_default="system")
    analyst_name: Mapped[str | None] = mapped_column(String(120))
    decided_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    investigation: Mapped[Investigation] = relationship(back_populates="decisions")
