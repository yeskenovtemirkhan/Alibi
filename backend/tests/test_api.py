"""The read API the frontend will call in NEXT_PUBLIC_DATA_MODE=api. Shapes must match src/types/index.ts."""
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.seed import run_seed

TX_KEYS = {"id", "amount", "country", "city", "merchant", "device", "vpn", "user", "time", "risk", "status", "date"}
SCENARIO_KEYS = {"key", "title", "status", "tx", "initialRisk", "factors", "context", "evidence", "verification", "finalRisk", "decision", "reason"}
OVERVIEW_KEYS = {"asOf", "kpis", "flow", "distribution", "trends", "regions", "recent", "prevented"}


@pytest.fixture
def api(client: TestClient, db: Session) -> Iterator[TestClient]:
    """Seed, then play both demo scenarios through the engine exactly like the demo does."""
    run_seed(db)
    for ref in ("ATX-7842", "ATX-7843"):
        assert client.post(f"/investigations/{ref}/run").status_code == 201
        assert client.post(f"/investigations/{ref}/verify").status_code == 200
    yield client


# --- transactions ---

def test_list_transactions_newest_first_with_frontend_shape(api: TestClient) -> None:
    r = api.get("/transactions")
    assert r.status_code == 200
    rows = r.json()
    assert len(rows) == 246
    assert all(set(t) == TX_KEYS for t in rows)
    assert [t["id"] for t in rows[:2]] == ["ATX-7843", "ATX-7842"]
    dates = [t["date"] for t in rows]
    assert dates == sorted(dates, reverse=True)
    assert {t["status"] for t in rows} <= {"Blocked", "Investigating", "Verified", "Approved"}


def test_transaction_fields_are_display_ready(api: TestClient) -> None:
    t = api.get("/transactions/ATX-7843").json()
    assert t == {
        "id": "ATX-7843", "amount": 650000.0, "country": "Singapore", "city": "Singapore", "merchant": "Apple Store",
        "device": "Unrecognized Android", "vpn": True, "user": "U•••204", "time": "10:25 AM", "risk": t["risk"],
        "status": "Blocked", "date": "2026-09-21",
    }
    assert 50 < t["risk"] < 100  # real model score


def test_unscored_transactions_have_null_risk(api: TestClient) -> None:
    rows = api.get("/transactions").json()
    scored = {t["id"] for t in rows if t["risk"] is not None}
    assert scored == {"ATX-7842", "ATX-7843"}  # only these have model predictions; nothing is invented


def test_transactions_pagination_and_validation(api: TestClient) -> None:
    page1 = api.get("/transactions", params={"limit": 5}).json()
    page2 = api.get("/transactions", params={"limit": 5, "offset": 5}).json()
    assert len(page1) == len(page2) == 5
    assert not {t["id"] for t in page1} & {t["id"] for t in page2}
    assert api.get("/transactions", params={"limit": 0}).status_code == 422
    assert api.get("/transactions", params={"limit": 5000}).status_code == 422


def test_unknown_transaction_is_404(api: TestClient) -> None:
    r = api.get("/transactions/ATX-0000")
    assert r.status_code == 404
    assert r.json() == {"detail": "Transaction ATX-0000 not found"}


# --- investigations (full flow in test_engine.py) ---

def test_investigation_shape_and_context(api: TestClient) -> None:
    s = api.get("/investigations/ATX-7842").json()
    assert set(s) == SCENARIO_KEYS and "risk" not in s["tx"]
    assert set(s["evidence"][0]) == {"id", "name", "source", "trust", "impact", "detail", "direction"}
    context = {c["label"]: (c["normal"], c["now"]) for c in s["context"]}
    assert context["Usual location"] == ("Almaty, KZ", "Singapore")
    assert context["Usual device"] == ("Galaxy S23", "iPhone 15 Pro")
    assert context["Typical amount"][1] == "₸650,000"
    b = {c["label"]: (c["normal"], c["now"]) for c in api.get("/investigations/ATX-7843").json()["context"]}
    assert b["Network"] == ("No VPN", "Commercial VPN") and b["Usual device"] == ("iPhone 14", "Unrecognized Android")


def test_investigation_404s(api: TestClient) -> None:
    assert api.get("/investigations/ATX-0000").status_code == 404  # unknown transaction
    assert api.get("/investigations/ATX-5000").status_code == 404  # real transaction, never investigated


# --- dashboard ---

def test_overview_defaults_to_latest_day_and_is_consistent(api: TestClient) -> None:
    r = api.get("/analytics/overview")
    assert r.status_code == 200
    o = r.json()
    assert set(o) == OVERVIEW_KEYS
    assert o["asOf"] == "2026-09-21"
    kpis = {k["key"]: k for k in o["kpis"]}
    assert list(kpis) == ["tx", "prevented", "fpr", "recall"]
    assert kpis["tx"]["value"] == 2  # ATX-7842 and ATX-7843
    assert kpis["prevented"]["value"] == 1
    assert (kpis["recall"]["value"], kpis["fpr"]["value"]) == (100.0, 0.0)
    assert all(len(k["spark"]) == 10 for k in o["kpis"])

    f = o["flow"]
    assert f["investigated"] == f["approved"] + f["verified"] + f["blocked"] == 2
    assert f["total"] >= f["suspicious"] >= f["investigated"]
    assert sum(b["count"] for b in o["distribution"]) == 2  # the two model-scored transactions
    assert {k: len(v) for k, v in o["trends"].items()} == {"7D": 7, "30D": 30, "90D": 90}
    assert o["trends"]["7D"][-1] == {"label": "Sep 21", "transactions": 2, "fraudRate": 50.0}
    assert o["trends"]["7D"][-2]["transactions"] == 0
    assert o["regions"] == [{"region": "Southeast Asia", "attempts": 1, "x": 0.792, "y": 0.548}]
    assert [t["id"] for t in o["recent"]] == ["ATX-7843"]  # only B's real score is >= 60
    assert o["prevented"] == {"value": 0.65, "delta": "₸0 the previous 7 days"}


def test_overview_for_a_quiet_past_day(api: TestClient) -> None:
    o = api.get("/analytics/overview", params={"as_of": "2026-09-20"}).json()
    assert o["asOf"] == "2026-09-20"
    assert o["recent"] == []  # nothing scored on or before that day
    assert o["flow"]["investigated"] == 0


def test_overview_validation_and_empty_db(api: TestClient, db: Session) -> None:
    assert api.get("/analytics/overview", params={"as_of": "2026-13-01"}).status_code == 422
    db.execute(text("TRUNCATE transactions CASCADE"))
    db.commit()
    assert api.get("/analytics/overview").status_code == 404


def test_openapi_lists_frontend_paths(api: TestClient) -> None:
    paths = set(api.get("/openapi.json").json()["paths"])
    assert {"/health", "/transactions", "/transactions/{reference}", "/investigations/{reference}", "/analytics/overview"} <= paths
