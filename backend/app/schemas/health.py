from typing import Literal

from pydantic import BaseModel


class AppHealth(BaseModel):
    status: Literal["ok"]
    name: str
    version: str
    env: str


class DatabaseHealth(BaseModel):
    status: Literal["ok", "error"]
    latency_ms: float | None = None
    # Current Alembic revision; None means migrations were never run.
    revision: str | None = None
    error: str | None = None


class ModelHealth(BaseModel):
    status: Literal["ok", "error"]
    name: str | None = None
    version: str | None = None
    features: int | None = None
    error: str | None = None


class HealthResponse(BaseModel):
    status: Literal["ok", "degraded"]
    app: AppHealth
    database: DatabaseHealth
    model: ModelHealth
