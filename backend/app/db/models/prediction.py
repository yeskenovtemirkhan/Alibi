import uuid
from decimal import Decimal
from typing import Any

from sqlalchemy import CheckConstraint, ForeignKey, Index, Numeric, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, CreatedAtMixin
from app.db.models._types import uuid_pk


class ModelPrediction(CreatedAtMixin, Base):
    """One scoring run of a model on a transaction. Immutable: rescoring inserts a new row."""

    __tablename__ = "model_predictions"
    __table_args__ = (
        CheckConstraint("score >= 0 AND score <= 1", name="score_range"),
        CheckConstraint("threshold >= 0 AND threshold <= 1", name="threshold_range"),
        Index("ix_model_predictions_transaction_id_created_at", "transaction_id", "created_at"),
        Index("ix_model_predictions_model_name_model_version", "model_name", "model_version"),
    )

    id: Mapped[uuid.UUID] = uuid_pk()
    transaction_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("transactions.id", ondelete="CASCADE"))
    model_name: Mapped[str] = mapped_column(String(64))
    model_version: Mapped[str] = mapped_column(String(32))
    score: Mapped[Decimal] = mapped_column(Numeric(6, 5))
    threshold: Mapped[Decimal] = mapped_column(Numeric(6, 5))
    # Flexible by nature: feature vectors and per-feature SHAP contributions change with every model version.
    features: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict, server_default="{}")
    shap_values: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict, server_default="{}")

    transaction: Mapped["Transaction"] = relationship(back_populates="predictions")  # noqa: F821
