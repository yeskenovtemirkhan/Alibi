"""python -m app.ml.train — generate the dataset, train ONE LightGBM model, evaluate, save artifacts.

Split is by customer (70/15/15) so no customer's history leaks between train and test.
The decision threshold is picked on validation (max F1); reported metrics are on the untouched test set.
"""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import lightgbm as lgb
import numpy as np
from sklearn.metrics import average_precision_score, confusion_matrix, precision_recall_curve, roc_auc_score

from app.ml.dataset import generate
from app.ml.features import FEATURES

ARTIFACTS = Path(__file__).resolve().parents[2] / "artifacts"
SEED = 42
PARAMS = {
    "objective": "binary", "learning_rate": 0.05, "num_leaves": 31, "min_data_in_leaf": 40,
    "feature_fraction": 0.9, "bagging_fraction": 0.9, "bagging_freq": 1, "lambda_l2": 1.0,
    "seed": SEED, "deterministic": True, "force_row_wise": True, "verbose": -1,
}


def split_by_customer(customers: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    ids = np.unique(customers)
    np.random.default_rng(SEED).shuffle(ids)
    n = len(ids)
    train_ids, val_ids = set(ids[: int(n * 0.70)]), set(ids[int(n * 0.70): int(n * 0.85)])
    in_train = np.isin(customers, list(train_ids))
    in_val = np.isin(customers, list(val_ids))
    return in_train, in_val, ~(in_train | in_val)


def metrics_at(y: np.ndarray, p: np.ndarray, threshold: float) -> dict:
    pred = (p >= threshold).astype(int)
    tn, fp, fn, tp = confusion_matrix(y, pred, labels=[0, 1]).ravel()
    return {
        "precision": round(tp / (tp + fp), 4) if tp + fp else 0.0,
        "recall": round(tp / (tp + fn), 4) if tp + fn else 0.0,
        "fpr": round(fp / (fp + tn), 5) if fp + tn else 0.0,
        "pr_auc": round(float(average_precision_score(y, p)), 4),
        "roc_auc": round(float(roc_auc_score(y, p)), 4),
        "confusion": {"tp": int(tp), "fp": int(fp), "tn": int(tn), "fn": int(fn)},
        "rows": int(len(y)), "fraud_rows": int(y.sum()),
    }


def main(out: Path = ARTIFACTS) -> dict:
    df = generate(seed=SEED)
    X, y = df[FEATURES].to_numpy(dtype=float), df["label"].to_numpy()
    tr, va, te = split_by_customer(df["customer"].to_numpy())

    booster = lgb.train(
        PARAMS, lgb.Dataset(X[tr], y[tr], feature_name=FEATURES), num_boost_round=2000,
        valid_sets=[lgb.Dataset(X[va], y[va], feature_name=FEATURES)],
        callbacks=[lgb.early_stopping(50, verbose=False)],
    )
    p_val, p_test = booster.predict(X[va]), booster.predict(X[te])

    prec, rec, thr = precision_recall_curve(y[va], p_val)
    f1 = 2 * prec[:-1] * rec[:-1] / np.clip(prec[:-1] + rec[:-1], 1e-9, None)
    threshold = float(thr[int(np.argmax(f1))])

    out.mkdir(parents=True, exist_ok=True)
    booster.save_model(str(out / "model.txt"))
    df.to_csv(out / "dataset.csv.gz", index=False, compression="gzip")
    gain = booster.feature_importance("gain")
    meta = {
        "model_name": "alibi-lgbm",
        "model_version": "1.0.0",
        "trained_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "features": FEATURES,
        "threshold": round(threshold, 6),
        "best_iteration": booster.best_iteration,
        "params": PARAMS,
        "dataset": {
            "generator": "app.ml.dataset.generate", "seed": SEED, "rows": int(len(df)), "customers": int(df["customer"].nunique()),
            "fraud_rate": round(float(y.mean()), 5), "scenarios": df["scenario"].value_counts().to_dict(),
            "split": {"train": int(tr.sum()), "validation": int(va.sum()), "test": int(te.sum()), "by": "customer"},
        },
        "metrics": {"validation": metrics_at(y[va], p_val, threshold), "test": metrics_at(y[te], p_test, threshold)},
        "feature_importance_gain": {f: round(float(g), 1) for f, g in sorted(zip(FEATURES, gain), key=lambda x: -x[1])},
    }
    (out / "metadata.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    return meta


if __name__ == "__main__":
    m = main()
    t = m["metrics"]["test"]
    print(f"rows={m['dataset']['rows']} fraud_rate={m['dataset']['fraud_rate']:.2%} iterations={m['best_iteration']} threshold={m['threshold']:.4f}")
    print(f"TEST precision={t['precision']} recall={t['recall']} pr_auc={t['pr_auc']} roc_auc={t['roc_auc']} fpr={t['fpr']} {t['confusion']}")
    sys.exit(0)
