from functools import lru_cache
from typing import Annotated, Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "ALIBI API"
    app_version: str = "0.1.0"
    app_env: Literal["local", "test", "staging", "production"] = "local"
    database_url: str = "postgresql+psycopg://alibi:alibi@localhost:5433/alibi"
    # NoDecode: read "a,b" from .env as a plain string and split it ourselves instead of expecting JSON.
    cors_origins: Annotated[list[str], NoDecode] = ["http://localhost:3000"]
    # Only read by pytest; must point at a throwaway *_test database.
    test_database_url: str | None = None

    @field_validator("cors_origins", mode="before")
    @classmethod
    def split_origins(cls, v: object) -> object:
        if isinstance(v, str):
            return [o.strip().rstrip("/") for o in v.split(",") if o.strip()]
        return v

    @field_validator("database_url", "test_database_url")
    @classmethod
    def require_psycopg(cls, v: str | None) -> str | None:
        if v is None:
            return v
        # Accept the common "postgresql://" form but always use the psycopg 3 driver.
        if v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+psycopg://", 1)
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql+psycopg://", 1)
        return v


@lru_cache
def get_settings() -> Settings:
    return Settings()
