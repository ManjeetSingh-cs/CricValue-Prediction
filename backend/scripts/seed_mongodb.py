from __future__ import annotations

import logging
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[2]
BACKEND_DIR = ROOT_DIR / "backend"
sys.path.append(str(BACKEND_DIR))

from app.config import FEATURE_COLUMNS, ODI_DATASET, PLAYER_FEATURES_DATASET, T20_DATASET  # noqa: E402
from app.database.mongodb import get_players_collection  # noqa: E402
from app.repositories.player_repository import load_players_from_local_dataset, upsert_players  # noqa: E402
from app.services.prediction_service import predict_from_features  # noqa: E402
from app.utils.preprocessing import build_player_dataset  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


def main() -> None:
    dataset = build_player_dataset([T20_DATASET, ODI_DATASET])
    PLAYER_FEATURES_DATASET.parent.mkdir(parents=True, exist_ok=True)
    dataset.to_csv(PLAYER_FEATURES_DATASET, index=False)

    players = load_players_from_local_dataset()
    for player in players:
        features = {
            "matches": player["matches"],
            "runs": player["runs"],
            "avg": player["avg"],
            "strike_rate": player["strike_rate"],
            "wickets": player["wickets"],
            "economy": player["economy"],
            "recent_form": player["recent_form_avg"],
            "consistency": player["consistency"],
            "form_trend": player["form_trend"],
        }
        features = {feature: features.get(feature, 0) for feature in FEATURE_COLUMNS}
        try:
            player["predicted_value"] = predict_from_features(features)["predicted_value"]
        except Exception as exc:
            logger.warning("Using role-based value for %s; model unavailable: %s", player["player_name"], exc)

    get_players_collection()
    inserted = upsert_players(players)
    logger.info("Seeded %s players into MongoDB database cricvalue_db.players", inserted)


if __name__ == "__main__":
    main()
