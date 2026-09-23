"""GET /analytics/overview. Every number is derived from stored rows; nothing is simulated.

Data volumes in this project are small, so rows for the 90-day window are loaded once and aggregated in Python,
which keeps the day-bucketing (Kazakhstan local time) in one obvious place. Move to SQL GROUP BYs when volumes grow.
"""
from collections import Counter
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models import Decision, FraudLabel, ModelPrediction, Transaction
from app.schemas.dashboard import DashboardOverview, DistBucket, FlowData, Kpi, Prevented, RegionPoint, TrendPoint
from app.services.presenters import LOCAL_TZ, local
from app.services.transactions import list_transactions

# Same regions and map positions (0–1 of the map width/height) as the frontend's Fraud Map.
REGIONS = {
    "Kazakhstan": (0.686, 0.29), "East Asia": (0.819, 0.377), "Europe": (0.528, 0.274),
    "Middle East": (0.633, 0.425), "North America": (0.222, 0.342), "Southeast Asia": (0.792, 0.548),
}
COUNTRY_REGION = {
    "KZ": "Kazakhstan", "CN": "East Asia", "JP": "East Asia", "KR": "East Asia", "GB": "Europe", "DE": "Europe", "NL": "Europe",
    "TR": "Europe", "GE": "Europe", "AE": "Middle East", "US": "North America", "SG": "Southeast Asia",
}
BUCKETS = [("0–20", 0, 20, "low"), ("20–40", 20, 40, "low"), ("40–60", 40, 60, "mid"), ("60–80", 60, 80, "high"), ("80–100", 80, 101, "high")]
OUTCOME_FLOW = {"APPROVED": "approved", "VERIFY": "verified", "BLOCKED": "blocked"}


@dataclass
class Row:
    id: object
    day: date
    amount: Decimal
    country: str
    status: str
    score: float | None  # latest model score as a percentage
    threshold: float | None
    outcome: str | None  # latest decision
    label: str | None  # "fraud" / "legit"


def is_blocked(r: Row) -> bool:
    return r.outcome == "BLOCKED" or r.status == "blocked"


def day_start(d: date) -> datetime:
    return datetime.combine(d, time.min, tzinfo=LOCAL_TZ)


def latest_day(db: Session) -> date | None:
    last = db.scalar(select(func.max(Transaction.occurred_at)))
    return local(last).date() if last else None


def _rows(db: Session, start: datetime, end: datetime) -> list[Row]:
    txs = db.execute(
        select(Transaction.id, Transaction.occurred_at, Transaction.amount, Transaction.country, Transaction.status)
        .where(Transaction.occurred_at >= start, Transaction.occurred_at < end)
    ).all()
    ids = [t.id for t in txs]
    preds = {
        r.transaction_id: r for r in db.execute(
            select(ModelPrediction.transaction_id, ModelPrediction.score, ModelPrediction.threshold)
            .where(ModelPrediction.transaction_id.in_(ids))
            .distinct(ModelPrediction.transaction_id)
            .order_by(ModelPrediction.transaction_id, ModelPrediction.created_at.desc())
        )
    }
    outcomes = dict(db.execute(
        select(Decision.transaction_id, Decision.outcome).where(Decision.transaction_id.in_(ids))
        .distinct(Decision.transaction_id).order_by(Decision.transaction_id, Decision.decided_at.desc())
    ).tuples().all())
    # Chargeback/analyst labels beat automated ones; any "fraud" label marks the transaction as fraud.
    labels: dict = {}
    for tx_id, label in db.execute(select(FraudLabel.transaction_id, FraudLabel.label).where(FraudLabel.transaction_id.in_(ids))):
        labels[tx_id] = "fraud" if "fraud" in (label, labels.get(tx_id)) else label
    return [
        Row(t.id, local(t.occurred_at).date(), t.amount, t.country, t.status,
            float(preds[t.id].score) * 100 if t.id in preds else None,
            float(preds[t.id].threshold) * 100 if t.id in preds else None,
            outcomes.get(t.id), labels.get(t.id))
        for t in txs
    ]


def _pct_change(now: float, before: float, unit: str) -> tuple[str, bool]:
    if before == 0:
        return (f"up from 0 {unit}" if now else f"no change {unit}", True)
    change = (now - before) / before * 100
    return f"{abs(change):.0f}% {'up' if change >= 0 else 'down'} {unit}", change >= 0


def _rate(numer: int, denom: int) -> float:
    return round(numer / denom * 100, 1) if denom else 0.0


def build_overview(db: Session, as_of: date | None = None) -> DashboardOverview | None:
    as_of = as_of or latest_day(db)
    if as_of is None:
        return None
    end = day_start(as_of + timedelta(days=1))
    rows = _rows(db, day_start(as_of - timedelta(days=89)), end)
    days = [as_of - timedelta(days=i) for i in range(89, -1, -1)]
    per_day = Counter(r.day for r in rows)
    fraud_per_day = Counter(r.day for r in rows if r.label == "fraud")
    blocked_per_day = Counter(r.day for r in rows if is_blocked(r))

    def between(lo: int, hi: int) -> list[Row]:
        """Rows from (as_of - hi days, as_of - lo days], e.g. between(0, 7) is the last 7 days incl. today."""
        return [r for r in rows if as_of - timedelta(days=hi) < r.day <= as_of - timedelta(days=lo)]

    last7, prev7, last30 = between(0, 7), between(7, 14), between(0, 30)
    blocked = lambda rs: [r for r in rs if is_blocked(r)]  # noqa: E731

    tx_delta, tx_good = _pct_change(per_day[as_of], per_day[as_of - timedelta(days=1)], "vs previous day")
    prev_delta, prev_good = _pct_change(len(blocked(last7)), len(blocked(prev7)), "vs previous 7 days")
    legit = [r for r in rows if r.label == "legit"]
    fraud = [r for r in rows if r.label == "fraud"]
    fpr = _rate(len(blocked(legit)), len(legit))  # legit transactions we blocked
    recall = _rate(len(blocked(fraud)), len(fraud))  # fraud we caught
    spark_days = days[-10:]
    kpis = [
        Kpi(key="tx", label="Transactions analyzed", value=per_day[as_of], delta=tx_delta, delta_good=tx_good,
            spark=[per_day[d] for d in spark_days]),
        Kpi(key="prevented", label="Fraud prevented", value=len(blocked(last7)), delta=prev_delta, delta_good=prev_good,
            spark=[blocked_per_day[d] for d in spark_days]),
        Kpi(key="fpr", label="False positive rate", value=fpr, suffix="%", decimals=1,
            delta=f"{len(legit)} labeled legit" if legit else "No labeled data yet", delta_good=fpr <= 5, spark=[fpr] * 10),
        Kpi(key="recall", label="Model recall", value=recall, suffix="%", decimals=1,
            delta=f"{len(fraud)} labeled fraud" if fraud else "No labeled data yet", delta_good=recall >= 90, spark=[recall] * 10),
    ]

    flow_counts = Counter(OUTCOME_FLOW[r.outcome] for r in last30 if r.outcome)
    flow = FlowData(
        total=len(last30),
        # Flagged by the model, or investigated anyway (the flow can never show more investigated than suspicious).
        suspicious=sum(1 for r in last30 if (r.score is not None and r.threshold is not None and r.score >= r.threshold) or r.outcome),
        investigated=sum(1 for r in last30 if r.outcome),
        approved=flow_counts["approved"], verified=flow_counts["verified"], blocked=flow_counts["blocked"],
    )

    scored = [r.score for r in last30 if r.score is not None]
    distribution = [DistBucket(range=name, count=sum(1 for s in scored if lo <= s < hi), tone=tone) for name, lo, hi, tone in BUCKETS]

    def trend(n: int) -> list[TrendPoint]:
        return [TrendPoint(label=d.strftime("%b %d").replace(" 0", " "), transactions=per_day[d],
                           fraud_rate=round(fraud_per_day[d] / per_day[d] * 100, 2) if per_day[d] else 0.0)
                for d in days[-n:]]

    attempts = Counter(COUNTRY_REGION.get(r.country) for r in last30 if r.label == "fraud" or is_blocked(r))
    regions = [RegionPoint(region=name, attempts=n, x=REGIONS[name][0], y=REGIONS[name][1])
               for name, n in attempts.most_common() if name in REGIONS]

    recent = [t for t in list_transactions(db, limit=200, until=end) if t.risk is not None and t.risk >= 60][:7]

    blocked_sum = lambda rs: float(sum(r.amount for r in blocked(rs))) / 1_000_000  # noqa: E731
    now_m, before_m = blocked_sum(last7), blocked_sum(prev7)
    # The UI renders this as "+{delta}", so it must read naturally after a plus sign.
    p_delta = f"{(now_m - before_m) / before_m * 100:.0f}% vs previous 7 days" if before_m else "₸0 the previous 7 days" if now_m else "0% vs previous 7 days"

    return DashboardOverview(
        as_of=as_of.isoformat(), kpis=kpis, flow=flow, distribution=distribution,
        trends={"7D": trend(7), "30D": trend(30), "90D": trend(90)},
        regions=regions, recent=recent, prevented=Prevented(value=round(now_m, 2), delta=p_delta),
    )
