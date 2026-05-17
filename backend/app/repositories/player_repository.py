from __future__ import annotations

import logging
import re
from typing import Any, Optional

import pandas as pd

from app.config import ODI_DATASET, PLAYER_FEATURES_DATASET, T20_DATASET
from app.database.mongodb import get_players_collection, is_mongodb_available
from app.utils.preprocessing import build_player_dataset, build_recent_match_trends, load_datasets
from app.utils.valuation import display_role, normalize_role

logger = logging.getLogger(__name__)

TEAM_BY_PLAYER = {
    "Virat Kohli": "India",
    "Jasprit Bumrah": "India",
    "Rashid Khan": "Afghanistan",
    "Travis Head": "Australia",
    "Hardik Pandya": "India",
    "Babar Azam": "Pakistan",
    "Shaheen Afridi": "Pakistan",
    "Jos Buttler": "England",
}


def _mongo_id_to_string(document: dict[str, Any]) -> dict[str, Any]:
    document = dict(document)
    if "_id" in document:
        document["id"] = str(document.pop("_id"))
    return document


def _query_from_filters(
    team: Optional[str] = None,
    role: Optional[str] = None,
    min_value: Optional[float] = None,
) -> dict[str, Any]:
    query: dict[str, Any] = {}
    if team:
        query["team"] = {"$regex": f"^{re.escape(team)}$", "$options": "i"}
    if role:
        query["role"] = normalize_role(role)
    if min_value is not None:
        query["predicted_value"] = {"$gte": float(min_value)}
    return query


def find_players(
    team: Optional[str] = None,
    role: Optional[str] = None,
    min_value: Optional[float] = None,
) -> list[dict[str, Any]]:
    if is_mongodb_available():
        collection = get_players_collection()
        docs = collection.find(_query_from_filters(team, role, min_value)).sort("predicted_value", -1)
        return [_mongo_id_to_string(doc) for doc in docs]

    players = load_players_from_local_dataset()
    if team:
        players = [p for p in players if p["team"].lower() == team.lower()]
    if role:
        normalized_role = normalize_role(role)
        players = [p for p in players if p["role"] == normalized_role]
    if min_value is not None:
        players = [p for p in players if p["predicted_value"] >= float(min_value)]
    return sorted(players, key=lambda p: p["predicted_value"], reverse=True)


def find_player(identifier: str) -> Optional[dict[str, Any]]:
    if is_mongodb_available():
        collection = get_players_collection()
        query = {
            "$or": [
                {"player_name": {"$regex": f"^{re.escape(identifier)}$", "$options": "i"}},
                {"id": identifier},
            ]
        }
        document = collection.find_one(query)
        return _mongo_id_to_string(document) if document else None

    identifier_lower = identifier.lower()
    for player in load_players_from_local_dataset():
        if player.get("id") == identifier or player["player_name"].lower() == identifier_lower:
            return player
    return None


def upsert_players(players: list[dict[str, Any]]) -> int:
    collection = get_players_collection()
    for player in players:
        collection.update_one(
            {"player_name": player["player_name"]},
            {"$set": player},
            upsert=True,
        )
    return len(players)


def upsert_player(player: dict[str, Any]) -> dict[str, Any]:
    if is_mongodb_available():
        collection = get_players_collection()
        collection.update_one(
            {"player_name": player["player_name"]},
            {"$set": player},
            upsert=True,
        )
        saved = collection.find_one({"player_name": player["player_name"]})
        return _mongo_id_to_string(saved) if saved else player

    players = [p for p in load_players_from_local_dataset() if p["player_name"].lower() != player["player_name"].lower()]
    players.append({**player, "id": str(len(players) + 1)})
    _write_local_players(players)
    return players[-1]


def _write_local_players(players: list[dict[str, Any]]) -> None:
    rows = []
    for player in players:
        recent_form = player.get("recent_form", [])
        recent_form_avg = (
            sum(float(value) for value in recent_form) / len(recent_form)
            if recent_form
            else float(player.get("recent_form_avg", 0))
        )
        rows.append(
            {
                "player_name": player["player_name"],
                "team": player.get("team", "Free Agent"),
                "nationality": player.get("nationality", player.get("team", "Unknown")),
                "matches": player.get("matches", 1),
                "runs": player.get("runs", 0),
                "avg": player.get("avg", 0),
                "strike_rate": player.get("strike_rate", 0),
                "wickets": player.get("wickets", 0),
                "economy": player.get("economy", 0),
                "recent_form": recent_form_avg,
                "recent_form_values": ",".join(str(round(float(value), 2)) for value in recent_form),
                "consistency": player.get("consistency", 0),
                "form_trend": player.get("form_trend", 0),
                "role": player.get("role", "batsman"),
                "value": player.get("predicted_value", 0),
                "actual_value": player.get("actual_value", 0),
            }
        )
    pd.DataFrame(rows).to_csv(PLAYER_FEATURES_DATASET, index=False)


def load_players_from_local_dataset() -> list[dict[str, Any]]:
    if PLAYER_FEATURES_DATASET.exists():
        df = pd.read_csv(PLAYER_FEATURES_DATASET)
    else:
        df = build_player_dataset([T20_DATASET, ODI_DATASET])

    trends = build_recent_match_trends(load_datasets([T20_DATASET, ODI_DATASET]))
    players = []
    for idx, row in df.reset_index(drop=True).iterrows():
        player_name = str(row["player_name"])
        stored_recent = _parse_recent_form_values(str(row.get("recent_form_values", "")))
        recent_scores = [float(point["score"]) for point in trends.get(player_name, [])[-5:]] or stored_recent
        predicted_value = float(row.get("predicted_value", row.get("value", 0)))
        actual_value = float(row.get("actual_value", max(predicted_value * 0.92, 0)))
        players.append(
            {
                "id": str(idx + 1),
                "player_name": player_name,
                "team": str(row.get("team", TEAM_BY_PLAYER.get(player_name, "Free Agent"))),
                "nationality": str(row.get("nationality", row.get("team", TEAM_BY_PLAYER.get(player_name, "Unknown")))),
                "role": normalize_role(str(row.get("role", "batsman"))),
                "runs": float(row["runs"]),
                "avg": float(row["avg"]),
                "strike_rate": float(row["strike_rate"]),
                "wickets": int(row["wickets"]),
                "economy": float(row["economy"]),
                "matches": int(row["matches"]),
                "recent_form": recent_scores or [float(row.get("recent_form", 0))],
                "recent_form_avg": float(row.get("recent_form", 0)),
                "consistency": float(row.get("consistency", 0)),
                "form_trend": float(row.get("form_trend", 0)),
                "predicted_value": round(predicted_value, 2),
                "actual_value": round(actual_value, 2),
                "performance_trend": trends.get(player_name, []) or [
                    {"date": f"M{match_idx + 1}", "score": score}
                    for match_idx, score in enumerate(recent_scores[-5:])
                ],
            }
        )
    return players


def _parse_recent_form_values(value: str) -> list[float]:
    if not value or value == "nan":
        return []
    parsed = []
    for item in value.split(","):
        try:
            parsed.append(float(item))
        except ValueError:
            continue
    return parsed


def to_frontend_player(document: dict[str, Any]) -> dict[str, Any]:
    recent_form = [float(value) for value in document.get("recent_form", [])]
    predicted_value = round(float(document.get("predicted_value", 0)), 2)
    form_trend = float(document.get("form_trend", 0))
    baseline = max(predicted_value - (form_trend * 6), 0)
    return {
        "id": str(document.get("id") or document.get("player_name")),
        "name": document["player_name"],
        "team": document.get("team", "Free Agent"),
        "role": display_role(document.get("role", "batsman")),
        "nationality": document.get("nationality", document.get("team", "Unknown")),
        "stats": {
            "batting": {
                "matches": int(document.get("matches", 0)),
                "runs": float(document.get("runs", 0)),
                "average": float(document.get("avg", 0)),
                "strikeRate": float(document.get("strike_rate", 0)),
                "highest": int(max(recent_form) if recent_form else 0),
            },
            "bowling": {
                "matches": int(document.get("matches", 0)),
                "wickets": int(document.get("wickets", 0)),
                "economy": float(document.get("economy", 0)),
                "average": 0
                if int(document.get("wickets", 0)) == 0
                else round(float(document.get("runs", 0)) / int(document.get("wickets", 1)), 2),
                "best": document.get("best", "N/A"),
            },
        },
        "recentForm": recent_form,
        "predictedValue": predicted_value,
        "actualValue": round(float(document.get("actual_value", 0)), 2),
        "valuationTrend": [
            {"date": "T-3", "value": round(baseline * 0.92, 2)},
            {"date": "T-2", "value": round(baseline * 0.97, 2)},
            {"date": "T-1", "value": round((baseline + predicted_value) / 2, 2)},
            {"date": "Now", "value": predicted_value},
        ],
        "performanceTrend": document.get("performance_trend", []),
        "consistency": float(document.get("consistency", 0)),
        "formTrend": form_trend,
    }


def to_feature_row(document: dict[str, Any]) -> dict[str, float]:
    recent_form = document.get("recent_form", [])
    recent_form_avg = (
        sum(float(value) for value in recent_form) / len(recent_form)
        if recent_form
        else float(document.get("recent_form_avg", 0))
    )
    return {
        "matches": float(document.get("matches", 0)),
        "runs": float(document.get("runs", 0)),
        "avg": float(document.get("avg", 0)),
        "strike_rate": float(document.get("strike_rate", 0)),
        "wickets": float(document.get("wickets", 0)),
        "economy": float(document.get("economy", 0)),
        "recent_form": recent_form_avg,
        "consistency": float(document.get("consistency", 0)),
        "form_trend": float(document.get("form_trend", 0)),
    }
