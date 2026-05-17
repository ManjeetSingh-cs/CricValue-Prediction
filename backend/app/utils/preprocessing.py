from __future__ import annotations

from pathlib import Path
from typing import Iterable

import numpy as np
import pandas as pd

from app.config import TARGET_WEIGHTS
from app.utils.valuation import calculate_role_based_value, infer_role_from_stats


REQUIRED_COLUMNS = {
    "player_name",
    "match_date",
    "format",
    "runs",
    "balls_faced",
    "outs",
    "wickets",
    "runs_conceded",
    "overs_bowled",
}


def load_datasets(csv_paths: Iterable[Path]) -> pd.DataFrame:
    frames = []
    for path in csv_paths:
        if not path.exists():
            raise FileNotFoundError(f"Dataset not found: {path}")
        frame = pd.read_csv(path)
        missing = REQUIRED_COLUMNS.difference(frame.columns)
        if missing:
            raise ValueError(f"{path.name} is missing columns: {sorted(missing)}")
        frames.append(frame)

    if not frames:
        raise ValueError("At least one dataset path is required")

    return pd.concat(frames, ignore_index=True)


def clean_match_data(df: pd.DataFrame) -> pd.DataFrame:
    cleaned = df.copy()
    cleaned["player_name"] = cleaned["player_name"].astype(str).str.strip()
    cleaned["format"] = cleaned["format"].astype(str).str.upper().str.strip()
    cleaned["match_date"] = pd.to_datetime(cleaned["match_date"], errors="coerce")

    numeric_columns = [
        "runs",
        "balls_faced",
        "outs",
        "wickets",
        "runs_conceded",
        "overs_bowled",
    ]
    for column in numeric_columns:
        cleaned[column] = pd.to_numeric(cleaned[column], errors="coerce").fillna(0)
        cleaned[column] = cleaned[column].clip(lower=0)

    cleaned = cleaned.dropna(subset=["player_name", "match_date"])
    cleaned = cleaned[cleaned["player_name"] != ""]
    cleaned = cleaned.drop_duplicates()
    return cleaned.sort_values(["player_name", "match_date"]).reset_index(drop=True)


def _last_five_average(values: pd.Series) -> float:
    return float(values.tail(5).mean()) if not values.empty else 0.0


def _trend(values: pd.Series) -> float:
    recent = values.tail(5).to_numpy(dtype=float)
    if len(recent) < 2:
        return 0.0
    x_axis = np.arange(len(recent))
    return float(np.polyfit(x_axis, recent, deg=1)[0])


def aggregate_player_features(match_df: pd.DataFrame) -> pd.DataFrame:
    rows = []
    for player_name, group in match_df.groupby("player_name", sort=True):
        group = group.sort_values("match_date")
        balls = float(group["balls_faced"].sum())
        outs = float(group["outs"].sum())
        overs = float(group["overs_bowled"].sum())
        runs = float(group["runs"].sum())
        wickets = float(group["wickets"].sum())

        rows.append(
            {
                "player_name": player_name,
                "matches": int(group.shape[0]),
                "runs": round(runs, 2),
                "avg": round(runs / outs, 2) if outs > 0 else round(runs, 2),
                "strike_rate": round((runs / balls) * 100, 2) if balls > 0 else 0.0,
                "wickets": int(wickets),
                "economy": round(group["runs_conceded"].sum() / overs, 2) if overs > 0 else 0.0,
                "recent_form": round(_last_five_average(group["runs"]), 2),
                "consistency": round(float(group["runs"].std(ddof=0)), 2)
                if group.shape[0] > 1
                else 0.0,
                "form_trend": round(_trend(group["runs"]), 2),
            }
        )

    return pd.DataFrame(rows)


def create_synthetic_target(
    player_df: pd.DataFrame,
    weights: dict[str, float] | None = None,
) -> pd.DataFrame:
    """Create a configurable valuation score.

    Default formula:
        value = runs * 0.30
              + wickets * 0.40
              + strike_rate * 0.20
              + recent_form * 0.08
              - consistency * 0.02

    The synthetic target is useful for bootstrapping the pipeline until real auction
    prices, contracts, or scouting labels are available.
    """
    weights = weights or TARGET_WEIGHTS
    df = player_df.copy()
    df["legacy_value"] = (
        df["runs"] * weights["runs"]
        + df["wickets"] * weights["wickets"]
        + df["strike_rate"] * weights["strike_rate"]
        + df["recent_form"] * weights["recent_form"]
        - df["consistency"] * weights["consistency_penalty"]
    )
    df["role"] = df.apply(infer_role_from_stats, axis=1)
    df["value"] = df.apply(lambda row: calculate_role_based_value(row, row["role"]), axis=1)
    market_factor = 0.84 + ((df.index % 5) * 0.07)
    df["actual_value"] = (df["value"] * market_factor).round(2)
    df["value"] = df["value"].clip(lower=0).round(2)
    return df


def build_player_dataset(csv_paths: Iterable[Path]) -> pd.DataFrame:
    raw = load_datasets(csv_paths)
    cleaned = clean_match_data(raw)
    features = aggregate_player_features(cleaned)
    return create_synthetic_target(features)


def build_recent_match_trends(match_df: pd.DataFrame) -> dict[str, list[dict[str, float | str]]]:
    trends: dict[str, list[dict[str, float | str]]] = {}
    cleaned = clean_match_data(match_df)
    for player_name, group in cleaned.groupby("player_name"):
        recent = group.sort_values("match_date").tail(8)
        trends[player_name] = [
            {
                "date": row.match_date.strftime("%Y-%m-%d"),
                "score": float(row.runs + (row.wickets * 12)),
            }
            for row in recent.itertuples(index=False)
        ]
    return trends
