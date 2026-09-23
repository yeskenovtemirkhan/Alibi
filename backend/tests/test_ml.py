"""Real model, real inference: no mocks of LightGBM or SHAP."""
import math
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import ModelPrediction, Transaction
from app.db.seed import run_seed
from app.ml.dataset import generate
from app.ml.features import FEATURES, CustomerState, Tx
from app.ml.model import get_model
from app.services.analyze import normalize_device

NOW = "2026-09-22T12:00:00+05:00"


@pytest.fixture
def api(client: TestClient, db: Session) -> TestClient:
    run_seed(db)
    return client


def test_model_artifacts_and_real_metrics() -> None:
    m = get_model()
    meta = m.meta
    assert meta["features"] == FEATURES
    assert meta["dataset"]["rows"] >= 100_000
    t = meta["metrics"]["test"]
    for k in ("precision", "recall", "pr_auc", "fpr"):
        assert k in t
    assert t["pr_auc"] > 0.8 and t["recall"] > 0.7 and t["fpr"] < 0.01
    assert 0 < m.threshold < 1


def test_dataset_is_reproducible() -> None:
    a, b = generate(n_customers=40, seed=7), generate(n_customers=40, seed=7)
    assert a.equals(b)
    assert set(a["label"].unique()) <= {0, 1}


def test_shap_is_additive_and_scores_vary() -> None:
    m = get_model()
    normal = m.explain({"amount": 9000, "amount_ratio": 0.9, "new_country": 0, "new_device": 0, "vpn": 0, "merchant_seen": 1,
                        "velocity_1h": 0, "hours_since_prev": 20, "travel_speed_kmh": 0})
    ato = m.explain({"amount": 650000, "amount_ratio": 36, "new_country": 1, "new_device": 1, "vpn": 1, "merchant_seen": 0,
                     "velocity_1h": 0, "hours_since_prev": 30, "travel_speed_kmh": 200})
    assert normal.score < 0.05 < 0.5 < ato.score
    for e in (normal, ato):
        base = math.log(e.base_score / (1 - e.base_score))
        assert base + sum(e.shap.values()) == pytest.approx(math.log(e.score / (1 - e.score)), abs=1e-6)
        assert sum(e.impact_pts.values()) == pytest.approx((e.score - e.base_score) * 100, abs=1e-6)


def test_feature_state_replay_matches_incremental() -> None:
    t0 = datetime(2026, 9, 1, 10, tzinfo=timezone.utc)
    hist = [Tx(t0 + timedelta(minutes=20 * i), 1000 + i, "KZ", "d1", f"m{i % 2}", False, 43.2, 76.9) for i in range(5)]
    replayed = CustomerState.from_history(hist)
    live = CustomerState()
    for tx in hist:
        live.features(tx)
        live.update(tx)
    nxt = Tx(t0 + timedelta(minutes=95), 50_000, "SG", "d2", "m9", True, 1.35, 103.8)
    f = replayed.features(nxt)
    assert f == live.features(nxt)
    assert (f["new_country"], f["new_device"], f["merchant_seen"], f["vpn"]) == (1.0, 1.0, 0.0, 1.0)
    assert f["velocity_1h"] == 3  # transactions at +40, +60 and +80 min are within the hour before +95
    assert f["travel_speed_kmh"] > 900  # Almaty → Singapore in 15 minutes


def test_normalize_simulator_device_labels() -> None:
    assert normalize_device("Trusted iPhone 14") == "iPhone 14"
    assert normalize_device("iPhone 15 Pro (first seen today)") == "iPhone 15 Pro"


def test_analyze_runs_real_inference_and_persists(api: TestClient, db: Session) -> None:
    body = {"user": "U•••204", "amount": 650000, "country": "Singapore", "merchant": "Apple Store",
            "device": "Unrecognized Android", "vpn": True, "occurredAt": NOW}
    r = api.post("/transactions/analyze", json=body)
    assert r.status_code == 201, r.text
    out = r.json()
    assert 0 <= out["risk"] <= 100 and out["model"] == {"name": "alibi-lgbm", "version": "1.0.0"}
    assert len(out["factors"]) == 5 and set(out["features"]) == set(FEATURES)
    assert out["transaction"]["user"] == "U•••204" and out["transaction"]["risk"] == pytest.approx(out["risk"], abs=0.05)

    pred = db.scalars(select(ModelPrediction).where(ModelPrediction.id == out["predictionId"])).one()
    assert pred.model_name == "alibi-lgbm" and float(pred.score) * 100 == pytest.approx(out["risk"], abs=0.01)
    assert set(pred.shap_values) == set(FEATURES)
    tx = db.scalars(select(Transaction).where(Transaction.reference == out["transaction"]["id"])).one()
    assert tx.status == ("investigating" if out["flagged"] else "approved")


def test_analyze_distinguishes_normal_from_takeover(api: TestClient) -> None:
    normal = api.post("/transactions/analyze", json={"user": "U•••456", "amount": 11000, "country": "Kazakhstan",
                                                     "merchant": "Magnum", "device": "Galaxy A54", "vpn": False, "occurredAt": NOW}).json()
    takeover = api.post("/transactions/analyze", json={"user": "U•••456", "amount": 700000, "country": "Singapore",
                                                       "merchant": "Apple Store", "device": "Unrecognized Android", "vpn": True,
                                                       "occurredAt": NOW}).json()
    assert normal["features"]["new_device"] == 0 and normal["features"]["merchant_seen"] == 1
    assert takeover["features"]["new_device"] == 1 and takeover["features"]["new_country"] == 1
    assert normal["risk"] < 10 < 50 < takeover["risk"]
    assert not normal["flagged"] and takeover["flagged"]


def test_analyze_unknown_customer_and_bad_input(api: TestClient) -> None:
    r = api.post("/transactions/analyze", json={"user": "Brand New Person", "amount": 5000, "country": "KZ", "merchant": "Magnum",
                                               "device": "Pixel 8", "vpn": False, "occurredAt": NOW})
    assert r.status_code == 201
    assert r.json()["features"]["hours_since_prev"] == 720  # no history
    assert api.post("/transactions/analyze", json={"user": "x", "amount": -5, "country": "KZ", "merchant": "m", "device": "d"}).status_code == 422
    bad_country = api.post("/transactions/analyze", json={"user": "x", "amount": 5, "country": "Atlantis", "merchant": "m", "device": "d"})
    assert bad_country.status_code == 422 and "Unknown country" in bad_country.text
