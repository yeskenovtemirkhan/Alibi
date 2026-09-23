from fastapi.testclient import TestClient

from app.api.deps import get_engine
from app.db.session import make_engine
from app.main import app


def test_health_ok_checks_real_database(client: TestClient) -> None:
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["app"] == {"status": "ok", "name": "ALIBI API", "version": "0.1.0", "env": body["app"]["env"]}
    assert body["database"]["status"] == "ok"
    assert body["database"]["revision"] == "0001"
    assert body["database"]["latency_ms"] >= 0
    assert body["model"] == {"status": "ok", "name": "alibi-lgbm", "version": "1.0.0", "features": 9, "error": None}


def test_health_reports_database_outage_as_503() -> None:
    # Nothing listens on port 1: the connection genuinely fails, no mocking of the check itself.
    dead = make_engine("postgresql+psycopg://alibi:alibi@127.0.0.1:1/alibi_test")
    app.dependency_overrides[get_engine] = lambda: dead
    try:
        with TestClient(app) as c:
            r = c.get("/health")
    finally:
        app.dependency_overrides.clear()
        dead.dispose()
    assert r.status_code == 503
    body = r.json()
    assert body["status"] == "degraded"
    assert body["app"]["status"] == "ok"
    assert body["database"]["status"] == "error"
    assert body["database"]["error"] == "unreachable"
    assert "127.0.0.1" not in r.text and "alibi:alibi" not in r.text  # no connection details leaked


def test_cors_allows_frontend_origin_only(client: TestClient) -> None:
    ok = client.get("/health", headers={"Origin": "http://localhost:3000"})
    assert ok.headers.get("access-control-allow-origin") == "http://localhost:3000"
    other = client.get("/health", headers={"Origin": "https://evil.example"})
    assert "access-control-allow-origin" not in other.headers
