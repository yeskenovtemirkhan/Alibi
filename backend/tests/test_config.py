from app.core.config import Settings


def test_cors_origins_from_comma_separated_env(monkeypatch) -> None:
    monkeypatch.setenv("CORS_ORIGINS", "http://localhost:3000, https://alibi.example/ ,")
    assert Settings(_env_file=None).cors_origins == ["http://localhost:3000", "https://alibi.example"]


def test_database_url_normalized_to_psycopg(monkeypatch) -> None:
    monkeypatch.setenv("DATABASE_URL", "postgresql://u:p@db:5432/alibi")
    assert Settings(_env_file=None).database_url == "postgresql+psycopg://u:p@db:5432/alibi"
    monkeypatch.setenv("DATABASE_URL", "postgres://u:p@db:5432/alibi")
    assert Settings(_env_file=None).database_url == "postgresql+psycopg://u:p@db:5432/alibi"


def test_app_env_validated(monkeypatch) -> None:
    import pytest
    from pydantic import ValidationError

    monkeypatch.setenv("APP_ENV", "prod-ish")
    with pytest.raises(ValidationError):
        Settings(_env_file=None)
