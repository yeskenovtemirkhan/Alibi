from fastapi import APIRouter

from app.api.routes import analytics, health, investigations, transactions

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(transactions.router)
api_router.include_router(investigations.router)
api_router.include_router(analytics.router)
# Still demo-only in the frontend: POST /transactions/analyze, /investigations/{id}/run|verify, GET /model/metrics,
# POST /policy/replay, POST /waitlist. They need the ML pipeline (or product decisions) first.
