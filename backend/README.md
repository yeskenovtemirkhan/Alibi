# ALIBI backend

FastAPI + PostgreSQL + SQLAlchemy 2 + Alembic + Pydantic v2 + LightGBM + SHAP.

## ML (hackathon MVP)

- `python -m app.ml.train` generates a reproducible synthetic dataset (112,181 transactions, seed 42: normal spending,
  legit anomalies such as travel, large purchases and new phones, and fraud: account takeover, VPN + new device,
  impossible travel, high velocity), trains ONE LightGBM model (split by customer, 70/15/15), and saves
  `artifacts/model.txt` + `artifacts/metadata.json` (features, threshold, metrics) + `artifacts/dataset.csv.gz`.
- Features (`app/ml/features.py`, the same code for training and serving): amount, amount vs customer average, new country,
  new device, VPN, merchant seen, transactions in the last hour, hours since previous transaction, travel speed.
- Test metrics (unseen customers): precision 0.952, recall 0.844, PR-AUC 0.932, ROC-AUC 0.990, FPR 0.054%.
- `POST /transactions/analyze`: customer history from Postgres → features → LightGBM → SHAP TreeExplainer → stored prediction.

## Investigation engine (`app/services/engine.py`)

Initial risk = the real model score. Evidence comes from Postgres (flight/hotel bookings, airport purchase, trusted device,
known merchant, VPN), each item with source, trust and direction. Risk is updated in log-odds (±1.2 / 0.7 / 0.35 per
HIGH / MEDIUM / LOW item, total capped at ±4). The decision is APPROVE / VERIFY / BLOCK by expected cost, with
verify-before-block for customers who have a trusted device. Trusted-device verification: confirmed → −3 log-odds and
decide again; rejected → BLOCK.

Demo scenarios (seeded context only; scores and decisions are computed live):
A = `ATX-7842` legit traveler → model 31.0% → APPROVED after confirmation. B = `ATX-7843` account takeover → model 89.8% →
BLOCKED after rejection. `python scripts/smoke.py [base_url]` runs health, analyze and both scenarios.

```
app/
  main.py            FastAPI app, CORS, routers
  core/config.py     settings from .env (DATABASE_URL, CORS_ORIGINS, APP_ENV, TEST_DATABASE_URL)
  api/               routes (GET /health) + dependencies
  db/                Base, session, models (11 tables), deterministic seed
  schemas/           Pydantic response models
  services/          business logic (health check)
  seed.py            `python -m app.seed`
alembic/             migrations (0001_initial_schema)
tests/               pytest against a real *_test Postgres database
```

## Tables

customers · devices · merchants · transactions · customer_profiles · model_predictions · investigations · evidence ·
verification_events · decisions · fraud_labels. UUID primary keys, FKs with explicit ON DELETE rules, created/updated
timestamps, CHECK constraints for statuses, indexes for the queries the frontend will make. JSONB only for
flexible payloads: `transactions.metadata`, `model_predictions.features` / `shap_values`, `evidence.metadata`,
`verification_events.metadata`.

## Run locally (Windows / PowerShell)

Requires Python 3.12 and PostgreSQL 16 on `localhost:5433` (user/password `alibi`, databases `alibi` and `alibi_test`).

**Option A: Docker**

```
docker compose up -d
```

**Option B: no Docker** (uses PostgreSQL binaries from the `pgserver` pip package)

```
.venv\Scripts\python -m pip install pgserver
$bin = ".venv\Lib\site-packages\pgserver\pginstall\bin"
& "$bin\initdb.exe" -D .pgdata -U alibi --pwprompt --auth=scram-sha-256 -E UTF8 --locale=C   # password: alibi
Add-Content .pgdata\postgresql.conf "port = 5433`nlisten_addresses = 'localhost'`nunix_socket_directories = ''"
& "$bin\pg_ctl.exe" -D .pgdata -l .pgdata\server.log start
& "$bin\psql.exe" -h localhost -p 5433 -U alibi -d postgres -c "CREATE DATABASE alibi;" -c "CREATE DATABASE alibi_test;"
```

**Then**

```
py -3.12 -m venv .venv            # or: uv venv --python 3.12 .venv
.venv\Scripts\python -m pip install -r requirements-dev.txt
copy .env.example .env
.venv\Scripts\alembic upgrade head
.venv\Scripts\python -m app.seed
.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
.venv\Scripts\python -m pytest
```

- http://localhost:8000/health returns 200 when the API and Postgres are up, and 503 (`database.error: "unreachable"`) when Postgres is down.
- http://localhost:8000/docs has the OpenAPI UI (disabled when `APP_ENV=production`).

The seed truncates and reloads the seeded tables, so it's safe to re-run. It refuses to run with `APP_ENV=production`.
Tests migrate the `alibi_test` database down and up, and refuse to run against any database not named `*_test`.

## API

Responses use camelCase and match the frontend types in `src/types/index.ts`, so `NEXT_PUBLIC_DATA_MODE=api` can use them.

| Endpoint | Frontend type | Notes |
|---|---|---|
| `GET /health` | — | 200 when API and Postgres are up, 503 otherwise |
| `GET /transactions?limit=&offset=` | `Transaction[]` | newest first; `risk` is `null` until a model has scored the transaction |
| `GET /transactions/{reference}` | `Transaction` | e.g. `ATX-7842`; 404 if unknown |
| `POST /transactions/analyze` | — | real LightGBM + SHAP; stores the transaction and prediction |
| `POST /investigations/{reference}/run` | `Scenario` | runs the engine (scores with the model first if needed) |
| `POST /investigations/{reference}/verify` | `Scenario` | trusted-device result `{"result": "confirmed" | "rejected"}` (omit for the deterministic demo outcome) |
| `GET /investigations/{reference}` | `Scenario` | latest investigation: SHAP factors, context, evidence (with `direction`), verification, decision. 404 if never investigated |
| `GET /analytics/overview?as_of=YYYY-MM-DD` | `DashboardOverview` (+ `asOf`) | computed from stored rows; defaults to the latest transaction's day |

Not built (out of scope): `GET /model/metrics`, `POST /policy/replay`, `POST /waitlist`. The frontend's Analytics page stays a
labeled simulation, and the waitlist doesn't store emails.
