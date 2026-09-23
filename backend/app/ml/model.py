"""Loads the trained LightGBM model once and explains every prediction with SHAP TreeExplainer."""
import json
import math
import warnings
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

import lightgbm as lgb
import numpy as np
import shap

from app.ml.features import FEATURES

DEFAULT_DIR = Path(__file__).resolve().parents[2] / "artifacts"


@dataclass(frozen=True)
class Explained:
    score: float                     # fraud probability 0..1
    base_score: float                # model's probability for an "average" transaction (SHAP expected value)
    shap: dict[str, float]           # per-feature contribution in log-odds; base + sum == model margin
    impact_pts: dict[str, float]     # same contributions rescaled to risk percentage points (sum == risk - base risk)


class FraudModel:
    def __init__(self, directory: Path = DEFAULT_DIR):
        self.meta = json.loads((directory / "metadata.json").read_text(encoding="utf-8"))
        if self.meta["features"] != FEATURES:
            raise RuntimeError("Model was trained on a different feature list; retrain with `python -m app.ml.train`.")
        self.booster = lgb.Booster(model_file=str(directory / "model.txt"))
        self.explainer = shap.TreeExplainer(self.booster)
        self.threshold = float(self.meta["threshold"])
        self.version = self.meta["model_version"]
        self.name = self.meta["model_name"]

    def explain(self, features: dict[str, float]) -> Explained:
        x = np.array([[features[f] for f in FEATURES]], dtype=float)
        score = float(self.booster.predict(x)[0])
        with warnings.catch_warnings():
            # Informational only: SHAP notes LightGBM binary output may be a list; the reshape handles both forms.
            warnings.filterwarnings("ignore", message="LightGBM binary classifier with TreeExplainer")
            contrib = np.asarray(self.explainer.shap_values(x)).reshape(-1)[-len(FEATURES):]
        base_margin = float(np.asarray(self.explainer.expected_value).reshape(-1)[-1])
        base_score = 1 / (1 + math.exp(-base_margin))
        shap_map = {f: float(v) for f, v in zip(FEATURES, contrib)}
        # SHAP is additive in log-odds. For the UI we spread (risk − base risk) across features in the same proportions.
        total = float(contrib.sum())
        k = (score - base_score) * 100 / total if abs(total) > 1e-9 else 0.0
        return Explained(score, base_score, shap_map, {f: v * k for f, v in shap_map.items()})


@lru_cache
def get_model() -> FraudModel:
    return FraudModel()
