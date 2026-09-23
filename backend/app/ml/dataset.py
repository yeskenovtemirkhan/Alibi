"""Reproducible synthetic transaction dataset (same seed → identical rows).

Each customer gets a home city, a spending level, devices and favourite merchants, then ~90 days of activity:
  normal spending;
  legitimate anomalies (label 0): travel abroad, large purchase, new phone, quick bursts of small payments,
    habitual VPN users;
  fraud (label 1): account takeover, VPN + new device, impossible travel (cloned card), high-velocity bursts,
    plus a few "quiet" frauds that look normal (so the model can't be perfect).
Features come from app.ml.features.CustomerState, the same code the API uses.
"""
import math
import random
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

import pandas as pd

from app.ml.features import FEATURES, CustomerState, Tx
from app.ml.geo import CITIES

END = datetime(2026, 9, 21, tzinfo=timezone(timedelta(hours=5)))
DAYS = 90
HOME_CITIES = [("Almaty", 0.45), ("Astana", 0.30), ("Shymkent", 0.10), ("Karaganda", 0.08), ("Aktobe", 0.07)]
ABROAD = ["Singapore", "Dubai", "Istanbul", "London", "New York", "Berlin", "Tbilisi", "Amsterdam", "Seoul", "Beijing", "Tokyo"]
MERCHANTS_PER_CITY = 40


@dataclass
class Event:
    ts: datetime
    amount: float
    city: str
    device: str
    merchant: str
    vpn: bool
    label: int
    scenario: str


def _amount(rng: random.Random, base: float) -> float:
    return max(500.0, round(base / 50) * 50)


def _customer_events(cid: int, rng: random.Random) -> list[Event]:
    home = rng.choices([c for c, _ in HOME_CITIES], [w for _, w in HOME_CITIES])[0]
    typical = min(120_000.0, max(3_000.0, math.exp(rng.gauss(math.log(15_000), 0.6))))
    devices = [f"d{cid}-0"] + ([f"d{cid}-1"] if rng.random() < 0.35 else [])
    home_merchants = [f"{home}-m{i}" for i in range(MERCHANTS_PER_CITY)]
    favourites = rng.sample(home_merchants, rng.randint(5, 9))
    vpn_user = rng.random() < 0.06
    start_hour, end_hour = rng.choice([(7, 21), (8, 23), (9, 20), (10, 23)])
    start = END - timedelta(days=DAYS)

    def at(day: float, hour: int | None = None) -> datetime:
        h = hour if hour is not None else rng.randint(start_hour, end_hour)
        return (start + timedelta(days=int(day))).replace(hour=h, minute=rng.randint(0, 59), second=rng.randint(0, 59))

    def device() -> str:
        return devices[0] if len(devices) == 1 or rng.random() < 0.8 else devices[1]

    ev: list[Event] = []
    for _ in range(max(8, int(rng.gauss(36, 10)))):
        merchant = rng.choice(favourites) if rng.random() < 0.85 else rng.choice(home_merchants)
        ev.append(Event(at(rng.uniform(0, DAYS)), _amount(rng, typical * rng.lognormvariate(0, 0.6)), home, device(), merchant,
                        vpn_user and rng.random() < 0.5, 0, "normal"))

    # --- legitimate anomalies ---
    if rng.random() < 0.18:  # trip abroad: flight bought at home, then spending at the destination
        dest, t0 = rng.choice(ABROAD), rng.uniform(25, DAYS - 7)
        ev.append(Event(at(t0 - rng.uniform(2, 20)), _amount(rng, rng.uniform(150_000, 450_000)), home, device(),
                        f"{home}-airline", False, 0, "travel"))
        new_phone = f"d{cid}-travel" if rng.random() < 0.2 else None
        for k in range(rng.randint(3, 8)):
            big = rng.random() < 0.35
            amount = typical * (rng.uniform(10, 40) if big else rng.lognormvariate(0.5, 0.6))
            ev.append(Event(at(t0 + 1 + k * rng.uniform(0.3, 1.2)), _amount(rng, amount), dest, new_phone or device(),
                            f"{dest}-m{rng.randint(0, MERCHANTS_PER_CITY - 1)}", rng.random() < 0.15, 0, "travel"))
    if rng.random() < 0.15:  # large planned purchase at home
        ev.append(Event(at(rng.uniform(0, DAYS)), _amount(rng, typical * rng.uniform(8, 30)), home, device(),
                        rng.choice(home_merchants), False, 0, "large_purchase"))
    if rng.random() < 0.12:  # switched to a new phone
        t_switch, new = rng.uniform(10, DAYS - 5), f"d{cid}-new"
        for e in ev:
            if e.ts > at(t_switch, 0) and e.scenario == "normal" and rng.random() < 0.8:
                e.device = new
                if rng.random() < 0.02:
                    e.scenario = "new_device"
    if rng.random() < 0.05:  # a quick burst of taxi/coffee payments
        t = at(rng.uniform(0, DAYS))
        for k in range(rng.randint(4, 7)):
            ev.append(Event(t + timedelta(minutes=k * rng.uniform(3, 9)), _amount(rng, rng.uniform(800, 4000)), home, device(),
                            rng.choice(favourites), False, 0, "legit_burst"))

    # --- fraud ---
    if rng.random() < 0.09:
        for _ in range(rng.choice([1, 1, 2])):
            kind = rng.choices(["ato", "vpn_new_device", "impossible_travel", "velocity", "quiet"], [0.33, 0.24, 0.18, 0.18, 0.07])[0]
            t = at(rng.uniform(5, DAYS))
            attacker = f"atk-{cid}-{rng.randint(0, 999)}"
            if kind == "ato":
                city = rng.choice(ABROAD) if rng.random() < 0.6 else home
                for k in range(rng.randint(1, 3)):
                    amount = max(typical * rng.uniform(8, 40), rng.uniform(120_000, 900_000))
                    ev.append(Event(t + timedelta(minutes=k * rng.uniform(2, 12)), _amount(rng, amount), city, attacker,
                                    f"{city}-m{rng.randint(0, MERCHANTS_PER_CITY - 1)}", rng.random() < 0.8, 1, kind))
            elif kind == "vpn_new_device":
                for k in range(rng.randint(1, 2)):
                    ev.append(Event(t + timedelta(minutes=k * rng.uniform(3, 20)), _amount(rng, typical * rng.uniform(3, 12)), home,
                                    attacker, rng.choice(home_merchants), True, 1, kind))
            elif kind == "impossible_travel":  # cloned card used far away shortly after a genuine payment
                genuine = rng.choice([e for e in ev if e.label == 0])
                city = rng.choice(ABROAD)
                ev.append(Event(genuine.ts + timedelta(hours=rng.uniform(0.3, 3)), _amount(rng, typical * rng.uniform(2, 15)), city,
                                attacker if rng.random() < 0.5 else genuine.device, f"{city}-m{rng.randint(0, 9)}", False, 1, kind))
            elif kind == "velocity":
                dev, vpn = (attacker if rng.random() < 0.6 else device()), rng.random() < 0.5
                for k in range(rng.randint(6, 14)):
                    ev.append(Event(t + timedelta(minutes=k * rng.uniform(1, 4)), _amount(rng, rng.uniform(15_000, 60_000)), home, dev,
                                    "giftcards-online", vpn, 1, kind))
            else:  # quiet fraud: looks like a normal purchase
                ev.append(Event(t, _amount(rng, typical * rng.uniform(1, 3)), home, device(), rng.choice(favourites), False, 1, kind))
    return ev


def generate(n_customers: int = 3000, seed: int = 42) -> pd.DataFrame:
    rng = random.Random(seed)
    rows = []
    for cid in range(n_customers):
        state = CustomerState()
        for e in sorted(_customer_events(cid, rng), key=lambda e: e.ts):
            country, lat, lon = CITIES[e.city]
            tx = Tx(e.ts, e.amount, country, e.device, e.merchant, e.vpn, lat, lon)
            rows.append({"customer": cid, "ts": e.ts, **state.features(tx), "label": e.label, "scenario": e.scenario})
            state.update(tx)
    df = pd.DataFrame(rows)
    return df[["customer", "ts", *FEATURES, "label", "scenario"]]
