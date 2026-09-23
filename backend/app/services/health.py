import time

from sqlalchemy import Engine, text
from sqlalchemy.exc import OperationalError, SQLAlchemyError

from app.core.config import Settings
from app.ml.features import FEATURES
from app.ml.model import get_model
from app.schemas.health import AppHealth, DatabaseHealth, HealthResponse, ModelHealth


def check_database(engine: Engine) -> DatabaseHealth:
    """Opens a real connection and runs a query, so a dead or misconfigured Postgres shows up as an error."""
    started = time.perf_counter()
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            has_alembic = conn.execute(text("SELECT to_regclass('public.alembic_version') IS NOT NULL")).scalar()
            revision = conn.execute(text("SELECT version_num FROM alembic_version")).scalar() if has_alembic else None
    except OperationalError:
        # A stable category, never the driver message: connection strings and hostnames stay out of a public endpoint.
        return DatabaseHealth(status="error", error="unreachable")
    except SQLAlchemyError:
        return DatabaseHealth(status="error", error="query_failed")
    return DatabaseHealth(status="ok", latency_ms=round((time.perf_counter() - started) * 1000, 2), revision=revision)


def check_model() -> ModelHealth:
    """Loads (or reuses) the LightGBM model + SHAP explainer and runs one real prediction."""
    try:
        m = get_model()
        m.explain(dict.fromkeys(FEATURES, 0.0))
    except Exception as exc:  # noqa: BLE001 — any load/predict failure means the model is not usable
        return ModelHealth(status="error", error=type(exc).__name__)
    return ModelHealth(status="ok", name=m.name, version=m.version, features=len(FEATURES))


def build_health(settings: Settings, engine: Engine) -> HealthResponse:
    db, model = check_database(engine), check_model()
    return HealthResponse(
        status="ok" if db.status == "ok" and model.status == "ok" else "degraded",
        app=AppHealth(status="ok", name=settings.app_name, version=settings.app_version, env=settings.app_env),
        database=db,
        model=model,
    )
