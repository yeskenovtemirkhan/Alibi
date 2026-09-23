import uuid

from sqlalchemy import Uuid, text
from sqlalchemy.orm import Mapped, mapped_column


def uuid_pk() -> Mapped[uuid.UUID]:
    """UUID primary key generated in Python (deterministic seeds can pass their own) with a DB-side fallback."""
    return mapped_column(Uuid, primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()"))
