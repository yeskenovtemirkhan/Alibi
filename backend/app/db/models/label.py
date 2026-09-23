import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, CreatedAtMixin
from app.db.models._types import uuid_pk


class FraudLabel(CreatedAtMixin, Base):
    """Ground truth for training/evaluation. One label per source per transaction."""

    __tablename__ = "fraud_labels"
    __table_args__ = (
        UniqueConstraint("transaction_id", "source"),
        CheckConstraint("label IN ('fraud', 'legit')", name="label"),
        CheckConstraint("source IN ('chargeback', 'analyst', 'customer_confirmation', 'rule')", name="source"),
    )

    id: Mapped[uuid.UUID] = uuid_pk()
    transaction_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("transactions.id", ondelete="CASCADE"), index=True)
    label: Mapped[str] = mapped_column(String(8), index=True)
    source: Mapped[str] = mapped_column(String(24))
    notes: Mapped[str | None] = mapped_column(Text)
    labeled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    transaction: Mapped["Transaction"] = relationship(back_populates="labels")  # noqa: F821
