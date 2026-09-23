import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import CHAR, Boolean, CheckConstraint, DateTime, ForeignKey, Integer, Numeric, SmallInteger, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.db.models._types import uuid_pk


class Customer(TimestampMixin, Base):
    __tablename__ = "customers"
    __table_args__ = (CheckConstraint("segment IN ('retail', 'premium', 'business')", name="segment"),)

    id: Mapped[uuid.UUID] = uuid_pk()
    external_ref: Mapped[str] = mapped_column(String(32), unique=True)
    full_name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str | None] = mapped_column(String(254), unique=True)
    phone: Mapped[str | None] = mapped_column(String(32))
    home_country: Mapped[str] = mapped_column(CHAR(2))
    home_city: Mapped[str] = mapped_column(String(80))
    segment: Mapped[str] = mapped_column(String(16), default="retail", server_default="retail")
    customer_since: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    devices: Mapped[list["Device"]] = relationship(back_populates="customer", cascade="all, delete-orphan")
    profile: Mapped["CustomerProfile | None"] = relationship(back_populates="customer", cascade="all, delete-orphan", uselist=False)
    transactions: Mapped[list["Transaction"]] = relationship(back_populates="customer")  # noqa: F821


class Device(TimestampMixin, Base):
    __tablename__ = "devices"
    __table_args__ = (
        UniqueConstraint("customer_id", "fingerprint"),
        CheckConstraint("device_type IN ('mobile', 'tablet', 'desktop', 'emulator', 'unknown')", name="device_type"),
    )

    id: Mapped[uuid.UUID] = uuid_pk()
    customer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("customers.id", ondelete="CASCADE"), index=True)
    fingerprint: Mapped[str] = mapped_column(String(64))
    label: Mapped[str] = mapped_column(String(80))
    device_type: Mapped[str] = mapped_column(String(16))
    os: Mapped[str | None] = mapped_column(String(40))
    is_trusted: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    first_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    customer: Mapped[Customer] = relationship(back_populates="devices")


class CustomerProfile(TimestampMixin, Base):
    """Behavioral baseline per customer (1:1). Recomputed from transaction history; read by investigations."""

    __tablename__ = "customer_profiles"
    __table_args__ = (
        CheckConstraint("active_hour_start BETWEEN 0 AND 23 AND active_hour_end BETWEEN 0 AND 23", name="active_hours"),
        CheckConstraint("tx_count_90d >= 0", name="tx_count_non_negative"),
    )

    customer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("customers.id", ondelete="CASCADE"), primary_key=True)
    avg_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    median_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    max_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    tx_count_90d: Mapped[int] = mapped_column(Integer)
    usual_countries: Mapped[list[str]] = mapped_column(ARRAY(CHAR(2)))
    usual_merchant_categories: Mapped[list[str]] = mapped_column(ARRAY(String(40)))
    active_hour_start: Mapped[int] = mapped_column(SmallInteger)
    active_hour_end: Mapped[int] = mapped_column(SmallInteger)
    trusted_device_count: Mapped[int] = mapped_column(Integer)
    last_transaction_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    customer: Mapped[Customer] = relationship(back_populates="profile")
