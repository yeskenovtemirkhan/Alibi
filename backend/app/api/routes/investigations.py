from typing import Annotated

from fastapi import APIRouter, Body, HTTPException, Path, status

from app.api.deps import DbSession, Model
from app.schemas.investigation import ScenarioOut, VerifyIn
from app.services import engine
from app.services.investigations import get_scenario

router = APIRouter(prefix="/investigations", tags=["investigations"])

Reference = Annotated[str, Path(max_length=32, examples=["ATX-7842"], description="Transaction reference")]


def _scenario(db: DbSession, model: Model, reference: str) -> ScenarioOut:
    scenario = get_scenario(db, model, reference)
    if scenario is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"No investigation for {reference}")
    return scenario


@router.get("/{reference}", response_model=ScenarioOut, responses={404: {"description": "Unknown transaction, or never investigated"}})
def get_investigation(reference: Reference, db: DbSession, model: Model) -> ScenarioOut:
    """Latest investigation of a transaction (the frontend routes by transaction id)."""
    return _scenario(db, model, reference)


@router.post("/{reference}/run", response_model=ScenarioOut, status_code=status.HTTP_201_CREATED,
             responses={404: {"description": "Unknown transaction"}})
def run_investigation(reference: Reference, db: DbSession, model: Model) -> ScenarioOut:
    """Real model score → evidence from PostgreSQL → bounded risk update → expected-cost decision."""
    try:
        engine.run(db, model, reference)
    except LookupError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Transaction {reference} not found") from None
    return _scenario(db, model, reference)


@router.post("/{reference}/verify", response_model=ScenarioOut,
             responses={404: {"description": "Never investigated"}, 409: {"description": "Not waiting for verification"}})
def verify_investigation(reference: Reference, db: DbSession, model: Model, body: Annotated[VerifyIn | None, Body()] = None) -> ScenarioOut:
    try:
        engine.verify(db, reference, body.result if body else None)
    except LookupError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"No investigation for {reference}") from None
    except engine.EngineError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, str(e)) from None
    return _scenario(db, model, reference)
