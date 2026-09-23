from collections.abc import Iterator

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings


def make_engine(url: str | None = None) -> Engine:
    # pool_pre_ping: survive Postgres restarts; short connect timeout so /health fails fast instead of hanging.
    return create_engine(url or get_settings().database_url, pool_pre_ping=True, connect_args={"connect_timeout": 3})


engine = make_engine()
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
