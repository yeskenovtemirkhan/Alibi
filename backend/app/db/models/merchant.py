import uuid

from sqlalchemy import CHAR, CheckConstraint, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin
from app.db.models._types import uuid_pk


class Merchant(TimestampMixin, Base):
    __tablename__ = "merchants"
    __table_args__ = (CheckConstraint("mcc ~ '^[0-9]{4}$'", name="mcc_format"),)

    id: Mapped[uuid.UUID] = uuid_pk()
    external_ref: Mapped[str] = mapped_column(String(32), unique=True)
    name: Mapped[str] = mapped_column(String(120))
    mcc: Mapped[str] = mapped_column(CHAR(4))
    category: Mapped[str] = mapped_column(String(40), index=True)
    country: Mapped[str] = mapped_column(CHAR(2))
    city: Mapped[str] = mapped_column(String(80))
