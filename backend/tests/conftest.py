from collections.abc import Iterator
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import Engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session

from app.api.deps import get_engine
from app.core.config import get_settings
from app.db.session import make_engine
from app.main import app

BACKEND_DIR = Path(__file__).resolve().parents[1]


def _test_url() -> str:
    s = get_settings()
    url = s.test_database_url
    if not url:
        pytest.exit("TEST_DATABASE_URL is not set (see .env.example).", returncode=2)
    # Tests truncate and drop tables: refuse anything that isn't clearly a throwaway test database.
    name = make_url(url).database or ""
    if url == s.database_url or not name.endswith("_test"):
        pytest.exit(f"Refusing to run tests against database {name!r}: TEST_DATABASE_URL must name a *_test database.", returncode=2)
    return url


def alembic_config(url: str) -> Config:
    cfg = Config(str(BACKEND_DIR / "alembic.ini"))
    cfg.set_main_option("script_location", str(BACKEND_DIR / "alembic"))
    cfg.attributes["database_url"] = url
    return cfg


@pytest.fixture(scope="session")
def test_url() -> str:
    return _test_url()


@pytest.fixture(scope="session")
def engine(test_url: str) -> Iterator[Engine]:
    # Start every run from an empty schema and apply the real migrations: this is what tests the migrations.
    cfg = alembic_config(test_url)
    command.downgrade(cfg, "base")
    command.upgrade(cfg, "head")
    eng = make_engine(test_url)
    yield eng
    eng.dispose()


@pytest.fixture
def db(engine: Engine) -> Iterator[Session]:
    with Session(engine, expire_on_commit=False) as session:
        yield session


@pytest.fixture
def client(engine: Engine) -> Iterator[TestClient]:
    app.dependency_overrides[get_engine] = lambda: engine
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
