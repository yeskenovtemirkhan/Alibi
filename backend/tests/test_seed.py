from decimal import Decimal

import pytest
from sqlalchemy import func, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.models import Customer, CustomerProfile, Decision, Investigation, Merchant, Transaction
from app.db.seed import build_seed, run_seed

EXPECTED = {
    "customers": 7, "merchants": 12, "devices": 10, "customer_profiles": 7, "transactions": 246,
    # Scores and decisions are never seeded: they come from the model and the engine at run time.
    "model_predictions": 0, "investigations": 0, "evidence": 0, "verification_events": 0, "decisions": 0, "fraud_labels": 2,
}


@pytest.fixture
def seeded(db: Session) -> Session:
    run_seed(db)
    return db


def test_seed_counts(db: Session) -> None:
    assert run_seed(db) == EXPECTED


def test_seed_is_deterministic_and_idempotent(db: Session) -> None:
    a, b = build_seed(), build_seed()
    assert [(type(r).__name__, r.id if hasattr(r, "id") else r.customer_id) for r in a] == \
           [(type(r).__name__, r.id if hasattr(r, "id") else r.customer_id) for r in b]

    snapshot = "SELECT md5(string_agg(reference || amount::text || occurred_at::text || status, ',' ORDER BY reference)) FROM transactions"
    run_seed(db)
    first = db.execute(text(snapshot)).scalar_one()
    assert run_seed(db) == EXPECTED  # second run: no duplicates, no FK errors
    assert db.execute(text(snapshot)).scalar_one() == first


def test_flagship_pair_is_context_only(seeded: Session) -> None:
    rows = {t.reference: t for t in seeded.scalars(select(Transaction).where(Transaction.reference.in_(["ATX-7842", "ATX-7843"])))}
    legit, fraud = rows["ATX-7842"], rows["ATX-7843"]
    assert legit.amount == fraud.amount == Decimal("650000.00") and legit.merchant_id == fraud.merchant_id
    assert (legit.status, fraud.status) == ("received", "received")
    assert (legit.is_vpn, fraud.is_vpn) == (False, True)
    assert legit.device is not None and legit.device.is_trusted is True
    assert fraud.device is not None and fraud.device.is_trusted is False
    assert seeded.scalar(select(func.count()).select_from(Investigation)) == 0
    assert seeded.scalar(select(func.count()).select_from(Decision)) == 0
    # The travel context the engine will find for scenario A:
    flight = seeded.scalars(select(Transaction).where(Transaction.reference == "ATX-7801")).one()
    assert flight.metadata_["destination_country"] == "SG"


def test_profiles_are_computed_from_history(seeded: Session) -> None:
    for customer in seeded.scalars(select(Customer)):
        profile = seeded.get(CustomerProfile, customer.id)
        assert profile is not None
        # Baseline = history before the flagship stories (the flagship refs are ATX-78xx).
        hist = select(Transaction).where(Transaction.customer_id == customer.id, ~Transaction.reference.like("ATX-78%"))
        count = seeded.scalar(select(func.count()).select_from(hist.subquery()))
        avg = seeded.scalar(select(func.round(func.avg(Transaction.amount), 2)).where(Transaction.customer_id == customer.id, ~Transaction.reference.like("ATX-78%")))
        assert profile.tx_count_90d == count
        assert profile.avg_amount == avg
        assert profile.usual_countries and all(len(c) == 2 for c in profile.usual_countries)
    home = seeded.scalars(select(Customer).where(Customer.external_ref == "CUST-0123")).one()
    assert "SG" not in seeded.get(CustomerProfile, home.id).usual_countries  # Singapore is genuinely new for this customer


def test_constraints_reject_bad_data(seeded: Session) -> None:
    tx = seeded.scalars(select(Transaction).limit(1)).one()
    merchant = seeded.scalars(select(Merchant).limit(1)).one()
    bad = [
        Transaction(reference="ATX-BAD-1", customer_id=tx.customer_id, merchant_id=merchant.id, amount=Decimal("-5"),
                    country="KZ", city="Almaty", occurred_at=tx.occurred_at),
        Transaction(reference="ATX-BAD-2", customer_id=tx.customer_id, merchant_id=merchant.id, amount=Decimal("5"),
                    country="KZ", city="Almaty", occurred_at=tx.occurred_at, status="lost"),
        Transaction(reference=tx.reference, customer_id=tx.customer_id, merchant_id=merchant.id, amount=Decimal("5"),
                    country="KZ", city="Almaty", occurred_at=tx.occurred_at),
    ]
    for row in bad:
        seeded.add(row)
        with pytest.raises(IntegrityError):
            seeded.flush()
        seeded.rollback()


def test_restrict_prevents_deleting_customer_with_transactions(seeded: Session) -> None:
    customer = seeded.scalars(select(Customer).where(Customer.external_ref == "CUST-0456")).one()
    with pytest.raises(IntegrityError):
        seeded.execute(text("DELETE FROM customers WHERE id = :id"), {"id": customer.id})
    seeded.rollback()
