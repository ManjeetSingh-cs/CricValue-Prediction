from __future__ import annotations

import numpy as np
import pandas as pd

from app.config import FEATURE_COLUMNS
from app.schemas import PredictionRequest
from app.services.model_loader import load_model_bundle


def predict_from_features(payload: PredictionRequest | dict) -> dict:
    data = payload.model_dump() if hasattr(payload, "model_dump") else dict(payload)
    row = {feature: float(data.get(feature, 0)) for feature in FEATURE_COLUMNS}
    features = pd.DataFrame([row], columns=FEATURE_COLUMNS)

    bundle = load_model_bundle()
    prediction = float(bundle["model"].predict(features)[0])
    confidence = _confidence_score(row, bundle)

    return {
        "predicted_value": round(max(prediction, 0), 2),
        "predictedValue": round(max(prediction, 0), 2),
        "confidence": confidence,
        "model_name": bundle.get("model_name", "unknown"),
        "reasoning": (
            "Valuation is based on aggregate batting, bowling, recent form, "
            "consistency, and trend features."
        ),
    }


def _confidence_score(row: dict[str, float], bundle: dict) -> float:
    metrics = bundle.get("metrics", {})
    r2 = float(metrics.get("r2", 0.75))
    activity_boost = min(row.get("matches", 0) / 20, 1) * 0.12
    volatility_penalty = min(row.get("consistency", 0) / 100, 0.2)
    confidence = np.clip(0.72 + activity_boost + (r2 * 0.12) - volatility_penalty, 0.45, 0.95)
    return round(float(confidence), 2)
