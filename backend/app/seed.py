"""python -m app.seed [--if-empty] — load the deterministic demo dataset into DATABASE_URL.

Without flags the seeded tables are truncated and reloaded (refused when APP_ENV=production).
--if-empty only seeds a database with no customers yet, so it is safe on every deploy/restart.
"""
import sys

from sqlalchemy import func, select

from app.core.config import get_settings
from app.db.models import Customer
from app.db.seed import run_seed
from app.db.session import SessionLocal


def main(argv: list[str]) -> int:
    if_empty = "--if-empty" in argv
    with SessionLocal() as db:
        if if_empty and db.scalar(select(func.count()).select_from(Customer)):
            print("Seed skipped: database already has data.")
            return 0
        if not if_empty and get_settings().app_env == "production":
            print("Refusing to reseed: APP_ENV=production (a reseed truncates tables). Use --if-empty.", file=sys.stderr)
            return 1
        counts = run_seed(db)
    width = max(map(len, counts))
    for table, n in counts.items():
        print(f"{table:<{width}}  {n}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
