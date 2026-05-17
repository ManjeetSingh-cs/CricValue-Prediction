from __future__ import annotations

import logging
from functools import lru_cache

import joblib

from app.config import MODEL_PATH

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def load_model_bundle() -> dict:
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Model file not found at {MODEL_PATH}. Run: python backend/scripts/train_model.py"
        )
    logger.info("Loading ML model from %s", MODEL_PATH)
    return joblib.load(MODEL_PATH)
