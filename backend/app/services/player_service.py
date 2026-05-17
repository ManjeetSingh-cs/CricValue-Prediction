from __future__ import annotations

from typing import Optional

from app.repositories.player_repository import (
    find_player,
    find_players,
    to_feature_row,
    to_frontend_player,
    upsert_player,
)
from app.schemas import PlayerCreateRequest
from app.services.prediction_service import predict_from_features
from app.utils.valuation import normalize_role


def get_all_players(
    team: Optional[str] = None,
    role: Optional[str] = None,
    min_value: Optional[float] = None,
) -> list[dict]:
    return [to_frontend_player(player) for player in find_players(team, role, min_value)]


def get_player_by_name_or_id(identifier: str) -> dict | None:
    player = find_player(identifier)
    return to_frontend_player(player) if player else None


def get_raw_player(identifier: str) -> dict | None:
    return find_player(identifier)


def get_feature_row_for_player(identifier: str) -> dict | None:
    player = find_player(identifier)
    return to_feature_row(player) if player else None


def create_player(payload: PlayerCreateRequest) -> dict:
    document = _create_payload_to_document(payload)
    prediction = predict_from_features(
        {
            "matches": document["matches"],
            "runs": document["runs"],
            "avg": document["avg"],
            "strike_rate": document["strike_rate"],
            "wickets": document["wickets"],
            "economy": document["economy"],
            "recent_form": document["recent_form_avg"],
            "consistency": document["consistency"],
            "form_trend": document["form_trend"],
        }
    )
    document["predicted_value"] = prediction["predicted_value"]
    saved = upsert_player(document)
    return to_frontend_player(saved)


def _create_payload_to_document(payload: PlayerCreateRequest) -> dict:
    stats = payload.stats or {}
    batting = stats.get("batting", {}) if isinstance(stats, dict) else {}
    bowling = stats.get("bowling", {}) if isinstance(stats, dict) else {}
    recent_form = [float(value) for value in payload.recentForm[-5:]] or [0.0]

    runs = float(payload.runs if payload.runs is not None else batting.get("totalRuns", batting.get("runs", 0)))
    avg = float(payload.avg if payload.avg is not None else batting.get("average", 0))
    strike_rate = float(payload.strike_rate if payload.strike_rate is not None else batting.get("strikeRate", 0))
    wickets = int(payload.wickets if payload.wickets is not None else bowling.get("wickets", 0))
    economy = float(payload.economy if payload.economy is not None else bowling.get("economy", 0))
    consistency = _stddev(recent_form)
    form_trend = _slope(recent_form)

    performance_trend = [
        {"date": f"M{idx + 1}", "score": round(float(score), 2)}
        for idx, score in enumerate(recent_form)
    ]

    return {
        "player_name": payload.name.strip(),
        "team": payload.team.strip(),
        "role": normalize_role(payload.role),
        "nationality": payload.nationality.strip() or "Unknown",
        "runs": runs,
        "avg": avg,
        "strike_rate": strike_rate,
        "wickets": wickets,
        "economy": economy,
        "matches": max(int(payload.matches), len(recent_form)),
        "recent_form": recent_form,
        "recent_form_avg": round(sum(recent_form) / len(recent_form), 2),
        "consistency": consistency,
        "form_trend": form_trend,
        "predicted_value": float(payload.predictedValue or 0),
        "actual_value": round(float(payload.currentValue), 2),
        "performance_trend": performance_trend,
    }


def _stddev(values: list[float]) -> float:
    if len(values) < 2:
        return 0.0
    mean = sum(values) / len(values)
    variance = sum((value - mean) ** 2 for value in values) / len(values)
    return round(variance ** 0.5, 2)


def _slope(values: list[float]) -> float:
    if len(values) < 2:
        return 0.0
    n = len(values)
    x_mean = (n - 1) / 2
    y_mean = sum(values) / n
    numerator = sum((idx - x_mean) * (value - y_mean) for idx, value in enumerate(values))
    denominator = sum((idx - x_mean) ** 2 for idx in range(n))
    return round(numerator / denominator, 2) if denominator else 0.0
