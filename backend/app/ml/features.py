"""Behavioral features. ONE implementation used by both dataset generation and live inference (no train/serve skew).

A CustomerState is built by replaying a customer's past transactions in time order; `features(tx)` describes the
next transaction relative to that history, and `update(tx)` adds it to the history.
"""
from collections import deque
from dataclasses import dataclass, field
from datetime import datetime, timedelta

from app.ml.geo import haversine_km

FEATURES = [
    "amount",             # transaction amount, ₸
    "amount_ratio",       # amount / customer's average amount so far
    "new_country",        # 1 if the customer never transacted in this country
    "new_device",         # 1 if the device was never used by this customer
    "vpn",                # 1 if the connection is behind a VPN
    "merchant_seen",      # 1 if the customer paid this merchant before
    "velocity_1h",        # customer's transactions in the previous hour
    "hours_since_prev",   # hours since the customer's previous transaction (capped)
    "travel_speed_kmh",   # distance from previous transaction / time between them (impossible travel)
]

POPULATION_TYPICAL_AMOUNT = 20_000.0  # used when a customer has no history yet
MAX_GAP_HOURS = 720.0
MAX_SPEED_KMH = 5_000.0


@dataclass(frozen=True)
class Tx:
    ts: datetime
    amount: float
    country: str
    device: str
    merchant: str
    vpn: bool
    lat: float
    lon: float


@dataclass
class CustomerState:
    total: float = 0.0
    count: int = 0
    countries: set[str] = field(default_factory=set)
    devices: set[str] = field(default_factory=set)
    merchants: set[str] = field(default_factory=set)
    recent: deque = field(default_factory=deque)  # timestamps within the last hour
    last: Tx | None = None

    def features(self, tx: Tx) -> dict[str, float]:
        while self.recent and tx.ts - self.recent[0] > timedelta(hours=1):
            self.recent.popleft()
        if self.last is None:
            gap, speed = MAX_GAP_HOURS, 0.0
        else:
            gap = min(MAX_GAP_HOURS, max(0.0, (tx.ts - self.last.ts).total_seconds() / 3600))
            km = haversine_km((self.last.lat, self.last.lon), (tx.lat, tx.lon))
            speed = min(MAX_SPEED_KMH, km / max(gap, 0.05))
        avg = self.total / self.count if self.count else POPULATION_TYPICAL_AMOUNT
        return {
            "amount": tx.amount,
            "amount_ratio": tx.amount / max(avg, 1.0),
            "new_country": float(tx.country not in self.countries),
            "new_device": float(tx.device not in self.devices),
            "vpn": float(tx.vpn),
            "merchant_seen": float(tx.merchant in self.merchants),
            "velocity_1h": float(len(self.recent)),
            "hours_since_prev": gap,
            "travel_speed_kmh": speed,
        }

    def update(self, tx: Tx) -> None:
        self.total += tx.amount
        self.count += 1
        self.countries.add(tx.country)
        self.devices.add(tx.device)
        self.merchants.add(tx.merchant)
        self.recent.append(tx.ts)
        self.last = tx

    @classmethod
    def from_history(cls, history: list[Tx]) -> "CustomerState":
        s = cls()
        for tx in sorted(history, key=lambda t: t.ts):
            s.features(tx)  # keeps the 1-hour window in sync exactly as during generation
            s.update(tx)
        return s
