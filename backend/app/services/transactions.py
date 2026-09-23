from collections.abc import Sequence
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Select, select
from sqlalchemy.orm import Session, joinedload

from app.db.models import ModelPrediction, Transaction
from app.schemas.transaction import TransactionOut
from app.services.presenters import STATUS_LABELS, local, risk_pct, tx_core


def latest_scores(db: Session, tx_ids: Sequence) -> dict:
    """transaction_id → score of its most recent prediction (one query, DISTINCT ON)."""
    if not tx_ids:
        return {}
    q = (
        select(ModelPrediction.transaction_id, ModelPrediction.score)
        .where(ModelPrediction.transaction_id.in_(tx_ids))
        .distinct(ModelPrediction.transaction_id)
        .order_by(ModelPrediction.transaction_id, ModelPrediction.created_at.desc())
    )
    return dict(db.execute(q).tuples().all())


def _with_relations(q: Select) -> Select:
    return q.options(joinedload(Transaction.customer), joinedload(Transaction.merchant), joinedload(Transaction.device))


def to_out(t: Transaction, score: Decimal | None) -> TransactionOut:
    return TransactionOut(**tx_core(t), risk=risk_pct(score), status=STATUS_LABELS[t.status], date=local(t.occurred_at).date().isoformat())


def list_transactions(db: Session, *, limit: int, offset: int = 0, until: datetime | None = None) -> list[TransactionOut]:
    q = _with_relations(select(Transaction)).order_by(Transaction.occurred_at.desc(), Transaction.reference.desc())
    if until is not None:
        q = q.where(Transaction.occurred_at < until)
    rows = db.scalars(q.limit(limit).offset(offset)).all()
    scores = latest_scores(db, [t.id for t in rows])
    return [to_out(t, scores.get(t.id)) for t in rows]


def get_transaction(db: Session, reference: str) -> TransactionOut | None:
    t = db.scalars(_with_relations(select(Transaction)).where(Transaction.reference == reference)).one_or_none()
    if t is None:
        return None
    return to_out(t, latest_scores(db, [t.id]).get(t.id))
