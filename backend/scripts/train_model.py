from __future__ import annotations

import json
import logging
import sys
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

ROOT_DIR = Path(__file__).resolve().parents[2]
BACKEND_DIR = ROOT_DIR / "backend"
sys.path.append(str(BACKEND_DIR))

from app.config import (  # noqa: E402
    FEATURE_COLUMNS,
    METRICS_PATH,
    MODEL_PATH,
    ODI_DATASET,
    PLAYER_FEATURES_DATASET,
    ROLE_VALUATION_CONFIG,
    T20_DATASET,
)
from app.utils.preprocessing import build_player_dataset  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

try:
    from xgboost import XGBRegressor
except ImportError:
    XGBRegressor = None


def build_models() -> dict[str, object]:
    models: dict[str, object] = {
        "linear_regression": Pipeline(
            steps=[
                ("scaler", StandardScaler()),
                ("model", LinearRegression()),
            ]
        ),
        "random_forest": RandomForestRegressor(
            n_estimators=250,
            max_depth=6,
            random_state=42,
        ),
    }

    if XGBRegressor is not None:
        models["xgboost"] = XGBRegressor(
            n_estimators=300,
            max_depth=4,
            learning_rate=0.05,
            subsample=0.9,
            colsample_bytree=0.9,
            objective="reg:squarederror",
            random_state=42,
        )
    else:
        models["gradient_boosting_fallback"] = GradientBoostingRegressor(random_state=42)

    return models


def evaluate_model(model: object, x_test: pd.DataFrame, y_test: pd.Series) -> dict[str, float]:
    predictions = model.predict(x_test)
    return {
        "rmse": round(float(mean_squared_error(y_test, predictions) ** 0.5), 4),
        "mae": round(float(mean_absolute_error(y_test, predictions)), 4),
        "r2": round(float(r2_score(y_test, predictions)), 4) if len(y_test) > 1 else 0.0,
    }


def main() -> None:
    dataset = build_player_dataset([T20_DATASET, ODI_DATASET])
    PLAYER_FEATURES_DATASET.parent.mkdir(parents=True, exist_ok=True)
    dataset.to_csv(PLAYER_FEATURES_DATASET, index=False)

    x = dataset[FEATURE_COLUMNS]
    y = dataset["value"]
    test_size = 0.25 if len(dataset) >= 8 else 0.4
    x_train, x_test, y_train, y_test = train_test_split(
        x,
        y,
        test_size=test_size,
        random_state=42,
    )

    leaderboard = {}
    trained_models = {}
    for name, model in build_models().items():
        logger.info("Training %s", name)
        model.fit(x_train, y_train)
        metrics = evaluate_model(model, x_test, y_test)
        leaderboard[name] = metrics
        trained_models[name] = model
        logger.info("%s metrics: %s", name, metrics)

    best_name = min(leaderboard, key=lambda name: leaderboard[name]["rmse"])
    bundle = {
        "model": trained_models[best_name],
        "model_name": best_name,
        "metrics": leaderboard[best_name],
        "leaderboard": leaderboard,
        "feature_columns": FEATURE_COLUMNS,
        "target": "role_based_predicted_value",
        "role_valuation_config": ROLE_VALUATION_CONFIG,
    }

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(bundle, MODEL_PATH)
    METRICS_PATH.write_text(json.dumps(bundle["leaderboard"], indent=2), encoding="utf-8")

    logger.info("Best model: %s", best_name)
    logger.info("Saved model to %s", MODEL_PATH)
    logger.info("Saved engineered dataset to %s", PLAYER_FEATURES_DATASET)


if __name__ == "__main__":
    main()
