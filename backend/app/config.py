from pathlib import Path
import os


BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data"
MODEL_DIR = BASE_DIR / "app" / "models"

T20_DATASET = DATA_DIR / "sample_t20_matches.csv"
ODI_DATASET = DATA_DIR / "sample_odi_matches.csv"
PLAYER_FEATURES_DATASET = DATA_DIR / "player_features.csv"

MODEL_PATH = MODEL_DIR / "ml_model.pkl"
METRICS_PATH = MODEL_DIR / "model_metrics.json"

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "cricvalue_db")
MONGODB_PLAYERS_COLLECTION = os.getenv("MONGODB_PLAYERS_COLLECTION", "players")
MONGODB_TIMEOUT_MS = int(os.getenv("MONGODB_TIMEOUT_MS", "1500"))

FEATURE_COLUMNS = [
    "matches",
    "runs",
    "avg",
    "strike_rate",
    "wickets",
    "economy",
    "recent_form",
    "consistency",
    "form_trend",
]

TARGET_WEIGHTS = {
    "runs": 0.30,
    "wickets": 0.40,
    "strike_rate": 0.20,
    "recent_form": 0.08,
    "consistency_penalty": 0.02,
}

ROLE_VALUATION_CONFIG = {
    "batsman": {
        "runs": 0.50,
        "strike_rate": 0.30,
        "avg": 0.12,
        "recent_form": 0.08,
    },
    "bowler": {
        "wickets": 0.60,
        "economy_inverse": 0.40,
        "matches": 0.08,
        "recent_form": 0.04,
    },
    "allrounder": {
        "batting_component": 0.48,
        "bowling_component": 0.42,
        "recent_form": 0.06,
        "consistency_penalty": 0.04,
    },
}
