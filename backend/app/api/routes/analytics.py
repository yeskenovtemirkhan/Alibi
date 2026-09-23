from datetime import date
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps import DbSession
from app.schemas.dashboard import DashboardOverview
from app.services.dashboard import build_overview

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/overview", response_model=DashboardOverview, response_model_exclude_none=True, responses={404: {"description": "No transactions yet"}})
def overview(
    db: DbSession,
    as_of: Annotated[date | None, Query(description="Day to compute for (YYYY-MM-DD). Defaults to the latest transaction's day.")] = None,
) -> DashboardOverview:
    """Dashboard data. `GET /analytics/overview` in src/services/dashboard.service.ts."""
    result = build_overview(db, as_of)
    if result is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No transactions yet")
    return result
