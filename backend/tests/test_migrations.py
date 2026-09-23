from alembic import command
from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from alembic.script import ScriptDirectory
from sqlalchemy import Engine, inspect

from app.db.base import Base
from tests.conftest import alembic_config

TABLES = {
    "customers", "devices", "merchants", "transactions", "customer_profiles", "model_predictions",
    "investigations", "evidence", "verification_events", "decisions", "fraud_labels",
}


def test_all_tables_created(engine: Engine) -> None:
    assert TABLES <= set(inspect(engine).get_table_names())


def test_database_is_at_head_and_matches_models(engine: Engine, test_url: str) -> None:
    head = ScriptDirectory.from_config(alembic_config(test_url)).get_current_head()
    with engine.connect() as conn:
        ctx = MigrationContext.configure(conn, opts={"compare_type": True})
        assert ctx.get_current_revision() == head
        # Same check as `alembic check`: models and migrations have not drifted apart.
        assert compare_metadata(ctx, Base.metadata) == []


def test_foreign_keys(engine: Engine) -> None:
    insp = inspect(engine)

    def fks(table: str) -> set[tuple[str, str, str | None]]:
        return {(fk["constrained_columns"][0], fk["referred_table"], fk["options"].get("ondelete")) for fk in insp.get_foreign_keys(table)}

    assert fks("transactions") == {("customer_id", "customers", "RESTRICT"), ("device_id", "devices", "SET NULL"), ("merchant_id", "merchants", "RESTRICT")}
    assert fks("devices") == {("customer_id", "customers", "CASCADE")}
    assert fks("customer_profiles") == {("customer_id", "customers", "CASCADE")}
    assert fks("model_predictions") == {("transaction_id", "transactions", "CASCADE")}
    assert fks("investigations") == {("transaction_id", "transactions", "CASCADE"), ("prediction_id", "model_predictions", "SET NULL")}
    assert fks("evidence") == {("investigation_id", "investigations", "CASCADE")}
    assert fks("verification_events") == {("investigation_id", "investigations", "CASCADE")}
    assert fks("decisions") == {("investigation_id", "investigations", "CASCADE"), ("transaction_id", "transactions", "CASCADE")}
    assert fks("fraud_labels") == {("transaction_id", "transactions", "CASCADE")}
    assert insp.get_pk_constraint("customer_profiles")["constrained_columns"] == ["customer_id"]


def test_query_indexes_exist(engine: Engine) -> None:
    insp = inspect(engine)
    idx = {i["name"] for t in TABLES for i in insp.get_indexes(t)}
    for name in (
        "ix_transactions_customer_id_occurred_at", "ix_transactions_status_occurred_at", "ix_transactions_occurred_at",
        "ix_transactions_merchant_id", "ix_transactions_device_id", "ix_model_predictions_transaction_id_created_at",
        "ix_investigations_transaction_id", "ix_decisions_transaction_id", "ix_fraud_labels_transaction_id",
    ):
        assert name in idx, name


def test_jsonb_only_for_flexible_data(engine: Engine) -> None:
    insp = inspect(engine)
    jsonb = {(t, c["name"]) for t in TABLES for c in insp.get_columns(t) if c["type"].__class__.__name__ == "JSONB"}
    assert jsonb == {
        ("transactions", "metadata"), ("model_predictions", "features"), ("model_predictions", "shap_values"),
        ("evidence", "metadata"), ("verification_events", "metadata"),
    }


def test_downgrade_and_upgrade_roundtrip(engine: Engine, test_url: str) -> None:
    cfg = alembic_config(test_url)
    command.downgrade(cfg, "base")
    assert not (TABLES & set(inspect(engine).get_table_names()))
    command.upgrade(cfg, "head")
    assert TABLES <= set(inspect(engine).get_table_names())
