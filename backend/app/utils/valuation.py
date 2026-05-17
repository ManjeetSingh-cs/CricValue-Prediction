from __future__ import annotations

from typing import Mapping

import pandas as pd

from app.config import ROLE_VALUATION_CONFIG


ROLE_LABELS = {
    "batsman": "Batsman",
    "bowler": "Bowler",
    "allrounder": "All-rounder",
    "all-rounder": "All-rounder",
    "all rounder": "All-rounder",
}


def normalize_role(role: str) -> str:
    normalized = str(role or "").strip().lower().replace("_", "-")
    if normalized in {"all-rounder", "all rounder", "allrounder"}:
        return "allrounder"
    if normalized in {"bowler", "bowl"}:
        return "bowler"
    return "batsman"


def display_role(role: str) -> str:
    return ROLE_LABELS.get(normalize_role(role), "Batsman")


def infer_role_from_stats(row: Mapping[str, float] | pd.Series) -> str:
    runs = float(row.get("runs", 0))
    wickets = float(row.get("wickets", 0))
    matches = max(float(row.get("matches", 0)), 1)

    if runs >= 200 and wickets >= 8:
        return "allrounder"
    if wickets >= matches * 0.8 and runs < 350:
        return "bowler"
    return "batsman"


def calculate_role_based_value(
    row: Mapping[str, float] | pd.Series,
    role: str | None = None,
    config: dict[str, dict[str, float]] | None = None,
) -> float:
    """Return a configurable cricket valuation score by player role.

    Batsman:
        runs * 0.5 + strike_rate * 0.3 + avg * 0.12 + recent_form * 0.08

    Bowler:
        wickets * 0.6 + (1 / economy) * 100 * 0.4 + matches * 0.08

    All-rounder:
        weighted combination of the batting and bowling components.
    """
    config = config or ROLE_VALUATION_CONFIG
    role = normalize_role(role or str(row.get("role", "")) or infer_role_from_stats(row))

    runs = float(row.get("runs", 0))
    avg = float(row.get("avg", 0))
    strike_rate = float(row.get("strike_rate", 0))
    wickets = float(row.get("wickets", 0))
    economy = float(row.get("economy", 0))
    matches = float(row.get("matches", 0))
    recent_form = float(row.get("recent_form", 0))
    consistency = float(row.get("consistency", 0))
    economy_inverse = (1 / economy) * 100 if economy > 0 else 0

    batting = (
        runs * config["batsman"]["runs"]
        + strike_rate * config["batsman"]["strike_rate"]
        + avg * config["batsman"]["avg"]
        + recent_form * config["batsman"]["recent_form"]
    )
    bowling = (
        wickets * config["bowler"]["wickets"]
        + economy_inverse * config["bowler"]["economy_inverse"]
        + matches * config["bowler"]["matches"]
        + recent_form * config["bowler"]["recent_form"]
    )

    if role == "bowler":
        value = bowling
    elif role == "allrounder":
        value = (
            batting * config["allrounder"]["batting_component"]
            + bowling * config["allrounder"]["bowling_component"]
            + recent_form * config["allrounder"]["recent_form"]
            - consistency * config["allrounder"]["consistency_penalty"]
        )
    else:
        value = batting

    return round(max(float(value), 0), 2)
