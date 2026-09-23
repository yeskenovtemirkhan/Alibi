import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import CHAR, Boolean, CheckConstraint, DateTime, ForeignKey, Index, Numeric, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.db.models._types import uuid_pk

# Mirrors the frontend's TxStatus plus the pre-investigation state.
TX_STATUSES = ("received", "investigating", "verified", "approved", "blocked")


class Transaction(TimestampMixin, Base):
    __tablename__ = "transactions"
    __table_args__ = (
        CheckConstraint("amount > 0", name="amount_positive"),
        CheckConstraint("status IN ('received', 'investigating', 'verified', 'approved', 'blocked')", name="status"),
        CheckConstraint("channel IN ('card_present', 'online', 'transfer')", name="channel"),
        Index("ix_transactions_customer_id_occurred_at", "customer_id", "occurred_at"),
        Index("ix_transactions_status_occurred_at", "status", "occurred_at"),
    )

    id: Mapped[uuid.UUID] = uuid_pk()
    reference: Mapped[str] = mapped_column(String(32), unique=True)  # "ATX-7842", what the UI shows
    customer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("customers.id", ondelete="RESTRICT"))
    device_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("devices.id", ondelete="SET NULL"), index=True)
    merchant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("merchants.id", ondelete="RESTRICT"), index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    currency: Mapped[str] = mapped_column(CHAR(3), default="KZT", server_default="KZT")
    country: Mapped[str] = mapped_column(CHAR(2))
    city: Mapped[str] = mapped_column(String(80))
    channel: Mapped[str] = mapped_column(String(16), default="card_present", server_default="card_present")
    ip_address: Mapped[str | None] = mapped_column(String(45))
    is_vpn: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    status: Mapped[str] = mapped_column(String(16), default="received", server_default="received")
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    # Raw, source-specific fields (acquirer payload, 3DS info…) that don't deserve their own columns.
    metadata_: Mapped[dict[str, Any]] = mapped_column("metadata", JSONB, default=dict, server_default="{}")

    customer: Mapped["Customer"] = relationship(back_populates="transactions")  # noqa: F821
    device: Mapped["Device | None"] = relationship()  # noqa: F821
    merchant: Mapped["Merchant"] = relationship()  # noqa: F821
    predictions: Mapped[list["ModelPrediction"]] = relationship(back_populates="transaction", cascade="all, delete-orphan")  # noqa: F821
    investigations: Mapped[list["Investigation"]] = relationship(back_populates="transaction", cascade="all, delete-orphan")  # noqa: F821
    labels: Mapped[list["FraudLabel"]] = relationship(back_populates="transaction", cascade="all, delete-orphan")  # noqa: F821
