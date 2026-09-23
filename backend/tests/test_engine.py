"""Investigation Engine end-to-end through the API, with the real model."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Decision, Investigation, ModelPrediction, Transaction
from app.db.seed import run_seed
from app.ml.features import CustomerState
from app.ml.model import get_model
from app.services.analyze import _as_tx, history
from app.services.engine import EVIDENCE_CAP, decide, logit


@pytest.fixture
def api(client: TestClient, db: Session) -> TestClient:
    run_seed(db)
    return client


def model_risk(db: Session, reference: str) -> float:
    t = db.scalars(select(Transaction).where(Transaction.reference == reference)).one()
    f = CustomerState.from_history(history(db, t.customer_id, t.occurred_at)).features(_as_tx(t))
    return round(get_model().explain(f).score * 100, 2)


def test_scenario_a_legit_traveler_is_approved(api: TestClient, db: Session) -> None:
    run = api.post("/investigations/ATX-7842/run")
    assert run.status_code == 201, run.text
    s = run.json()
    assert s["initialRisk"] == model_risk(db, "ATX-7842")  # straight from LightGBM, not hardcoded
    assert (s["decision"], s["status"], s["verification"]["outcome"]) == ("VERIFY", "awaiting_verification", "pending")
    assert {e["name"] for e in s["evidence"]} >= {"Flight to Singapore", "Hotel booking", "Trusted device"}
    assert all(e["direction"] == "legit" and e["impact"] < 0 for e in s["evidence"])
    assert s["finalRisk"] < s["initialRisk"]
    assert s["factors"] and all(f["impact"] > 0 for f in s["factors"])

    v = api.post("/investigations/ATX-7842/verify").json()
    assert (v["decision"], v["status"], v["verification"]["outcome"]) == ("APPROVED", "closed", "confirmed")
    assert v["finalRisk"] == 0.1  # bounded: never claims certainty
    assert api.get("/investigations/ATX-7842").json()["decision"] == "APPROVED"
    assert db.scalars(select(Transaction.status).where(Transaction.reference == "ATX-7842")).one() == "verified"


def test_scenario_b_account_takeover_is_blocked(api: TestClient, db: Session) -> None:
    s = api.post("/investigations/ATX-7843/run").json()
    assert s["initialRisk"] == model_risk(db, "ATX-7843")
    assert s["decision"] == "VERIFY"  # verify-before-block: the owner has a trusted phone
    assert {e["name"] for e in s["evidence"]} == {"No travel history", "Unknown device", "Suspicious VPN"}
    assert all(e["direction"] == "fraud" and e["impact"] > 0 for e in s["evidence"])

    v = api.post("/investigations/ATX-7843/verify").json()
    assert (v["decision"], v["verification"]["outcome"]) == ("BLOCKED", "failed")
    assert v["finalRisk"] == 99.9
    assert db.scalars(select(Transaction.status).where(Transaction.reference == "ATX-7843")).one() == "blocked"


def test_everything_is_persisted(api: TestClient, db: Session) -> None:
    for ref in ("ATX-7842", "ATX-7843"):
        api.post(f"/investigations/{ref}/run")
        api.post(f"/investigations/{ref}/verify")
    preds = db.scalars(select(ModelPrediction)).all()
    assert {p.model_name for p in preds} == {"alibi-lgbm"} and len(preds) == 2
    invs = db.scalars(select(Investigation)).all()
    assert len(invs) == 2 and all(i.status == "closed" and i.prediction_id for i in invs)
    outcomes = db.scalars(select(Decision.outcome).order_by(Decision.decided_at)).all()
    assert sorted(outcomes) == ["APPROVED", "BLOCKED", "VERIFY", "VERIFY"]  # interim VERIFY + final, per scenario


def test_explicit_verification_result_overrides_demo_default(api: TestClient) -> None:
    api.post("/investigations/ATX-7842/run")
    v = api.post("/investigations/ATX-7842/verify", json={"method": "trusted_device", "result": "rejected"}).json()
    assert v["decision"] == "BLOCKED"


def test_state_errors(api: TestClient) -> None:
    assert api.post("/investigations/ATX-0000/run").status_code == 404
    assert api.post("/investigations/ATX-7842/verify").status_code == 404  # not investigated yet
    assert api.get("/investigations/ATX-7842").status_code == 404
    api.post("/investigations/ATX-7842/run")
    assert api.post("/investigations/ATX-7842/verify").status_code == 200
    assert api.post("/investigations/ATX-7842/verify").status_code == 409  # already decided
    assert api.post("/investigations/ATX-7842/verify", json={"result": "maybe"}).status_code == 422


def test_rerun_reuses_the_real_prediction(api: TestClient, db: Session) -> None:
    a = api.post("/investigations/ATX-7843/run").json()
    b = api.post("/investigations/ATX-7843/run").json()
    assert a["initialRisk"] == b["initialRisk"] and a["key"] != b["key"]
    assert len(db.scalars(select(ModelPrediction)).all()) == 1


def test_decision_rules() -> None:
    assert decide(0.001, 10_000, can_verify=False)[0] == "APPROVE"
    assert decide(0.95, 650_000, can_verify=False)[0] == "BLOCK"
    assert decide(0.95, 650_000, can_verify=True)[0] == "VERIFY"   # verify-before-block
    assert decide(0.30, 650_000, can_verify=True)[0] == "VERIFY"   # uncertain, expensive
    assert decide(0.30, 2_000, can_verify=False)[0] == "BLOCK"     # break-even is p = BLOCK_FRICTION / (1 + BLOCK_FRICTION) = 0.2
    assert decide(0.05, 2_000, can_verify=True)[0] == "APPROVE"    # low risk, cheap: not worth the verification friction
    assert logit(0.5) == 0 and EVIDENCE_CAP == 4.0


def test_low_risk_purchase_evidence_never_raises_risk(api: TestClient) -> None:
    body = {"user": "U•••310", "amount": 8500, "country": "Kazakhstan", "merchant": "Magnum", "device": "Trusted iPhone 14",
            "vpn": False, "occurredAt": "2026-09-22T12:00:00+05:00"}
    ref = api.post("/transactions/analyze", json=body).json()["transaction"]["id"]
    s = api.post(f"/investigations/{ref}/run").json()
    assert s["decision"] == "APPROVED" and s["verification"] is None
    assert all(e["impact"] <= 0 for e in s["evidence"] if e["direction"] == "legit")
    assert s["reason"].startswith("Low risk")
