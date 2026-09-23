from typing import Annotated

from fastapi import APIRouter, HTTPException, Path, Query, status

from app.api.deps import DbSession, Model
from app.schemas.analyze import AnalyzeIn, AnalyzeOut
from app.schemas.transaction import TransactionOut
from app.services import transactions as svc
from app.services.analyze import BadInput, analyze

router = APIRouter(prefix="/transactions", tags=["transactions"])

Reference = Annotated[str, Path(max_length=32, examples=["ATX-7842"])]


@router.post("/analyze", response_model=AnalyzeOut, status_code=status.HTTP_201_CREATED)
def analyze_transaction(body: AnalyzeIn, db: DbSession, model: Model) -> AnalyzeOut:
    """Score a transaction with the real LightGBM model, explain it with SHAP, and store both.
    `POST /transactions/analyze` in src/services/simulator.service.ts."""
    try:
        return analyze(db, model, body)
    except BadInput as e:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, str(e)) from None


@router.get("", response_model=list[TransactionOut])
def list_transactions(
    db: DbSession,
    limit: Annotated[int, Query(ge=1, le=1000)] = 500,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> list[TransactionOut]:
    """Newest first. `GET /transactions` in src/services/transactions.service.ts."""
    return svc.list_transactions(db, limit=limit, offset=offset)


@router.get("/{reference}", response_model=TransactionOut, responses={404: {"description": "Unknown transaction"}})
def get_transaction(reference: Reference, db: DbSession) -> TransactionOut:
    tx = svc.get_transaction(db, reference)
    if tx is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Transaction {reference} not found")
    return tx
