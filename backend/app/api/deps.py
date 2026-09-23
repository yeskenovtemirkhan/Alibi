from collections.abc import Iterator
from typing import Annotated

from fastapi import Depends
from sqlalchemy import Engine
from sqlalchemy.orm import Session

from app.db.session import engine
from app.ml.model import FraudModel, get_model


def get_engine() -> Engine:
    """Overridable in tests (e.g. to point at the test database or simulate an outage)."""
    return engine


def get_db(eng: Annotated[Engine, Depends(get_engine)]) -> Iterator[Session]:
    with Session(eng, autoflush=False, expire_on_commit=False) as db:
        yield db


DbSession = Annotated[Session, Depends(get_db)]
Model = Annotated[FraudModel, Depends(get_model)]
