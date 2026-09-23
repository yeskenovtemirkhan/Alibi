"""End-to-end smoke test against a running backend (local or production).

    python scripts/smoke.py                       # http://localhost:8000
    python scripts/smoke.py https://api.example   # production

Runs: /health → /transactions/analyze → scenario A (legit traveler) → scenario B (account takeover).
Investigation runs create new rows; it does not reseed or delete anything.
"""
import sys

import httpx

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000").rstrip("/")


def main() -> int:
    ok = True
    with httpx.Client(base_url=BASE, timeout=60) as c:
        h = c.get("/health")
        print(f"health            {h.status_code} {h.json()}")
        ok &= h.status_code == 200

        a = c.post("/transactions/analyze", json={"user": "U•••456", "amount": 700000, "country": "Singapore",
                                                  "merchant": "Apple Store", "device": "Unrecognized Android", "vpn": True})
        body = a.json()
        print(f"analyze           {a.status_code} risk={body.get('risk')} model={body.get('model')} "
              f"top={[f['label'] for f in body.get('factors', [])[:3]]}")
        ok &= a.status_code == 201

        for ref, expected in (("ATX-7842", "APPROVED"), ("ATX-7843", "BLOCKED")):
            s = c.post(f"/investigations/{ref}/run").json()
            initial = s["initialRisk"]
            if s.get("status") == "awaiting_verification":
                s = c.post(f"/investigations/{ref}/verify").json()
            verdict = "PASS" if s["decision"] == expected else "FAIL"
            ok &= verdict == "PASS"
            print(f"{ref}          {verdict} initial={initial}% final={s['finalRisk']}% decision={s['decision']} "
                  f"verification={(s.get('verification') or {}).get('outcome')}")
    print("SMOKE:", "PASS" if ok else "FAIL")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
