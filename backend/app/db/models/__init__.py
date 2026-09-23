"""Import every model so Base.metadata is complete for Alembic and the app."""
from app.db.models.customer import Customer, CustomerProfile, Device
from app.db.models.investigation import Decision, Evidence, Investigation, VerificationEvent
from app.db.models.label import FraudLabel
from app.db.models.merchant import Merchant
from app.db.models.prediction import ModelPrediction
from app.db.models.transaction import TX_STATUSES, Transaction

__all__ = [
    "Customer", "CustomerProfile", "Decision", "Device", "Evidence", "FraudLabel", "Investigation",
    "Merchant", "ModelPrediction", "TX_STATUSES", "Transaction", "VerificationEvent",
]
