from __future__ import annotations

from app.repositories.player_repository import find_player, find_players, to_frontend_player


def get_best_xi() -> dict:
    players = [to_frontend_player(player) for player in find_players()]
    best_players = sorted(players, key=lambda player: player["predictedValue"], reverse=True)[:11]
    return {
        "players": best_players,
        "total_value": round(sum(player["predictedValue"] for player in best_players), 2),
    }


def simulate_auction(budget: float, max_players: int = 11) -> dict:
    selected = []
    spent = 0.0
    raw_players = sorted(
        find_players(),
        key=lambda player: (
            player.get("predicted_value", 0) - player.get("actual_value", 0),
            player.get("predicted_value", 0),
        ),
        reverse=True,
    )

    role_counts = {"batsman": 0, "bowler": 0, "allrounder": 0}
    for raw_player in raw_players:
        price = float(raw_player.get("actual_value", raw_player.get("predicted_value", 0)))
        role = raw_player.get("role", "batsman")
        if spent + price > budget or len(selected) >= max_players:
            continue
        if role_counts.get(role, 0) >= 5 and len(selected) < max_players - 2:
            continue
        selected.append(to_frontend_player(raw_player))
        spent += price
        role_counts[role] = role_counts.get(role, 0) + 1

    return {
        "budget": round(float(budget), 2),
        "total_spent": round(spent, 2),
        "remaining_budget": round(float(budget) - spent, 2),
        "suggested_team": selected,
    }


def get_undervalued_players() -> list[dict]:
    undervalued = [
        player
        for player in find_players()
        if float(player.get("predicted_value", 0)) > float(player.get("actual_value", 0))
    ]
    return [to_frontend_player(player) for player in undervalued]


def compare_players(player_one: str, player_two: str) -> dict | None:
    first = find_player(player_one)
    second = find_player(player_two)
    if not first or not second:
        return None

    first_view = to_frontend_player(first)
    second_view = to_frontend_player(second)
    deltas = {
        "runs": round(first_view["stats"]["batting"]["runs"] - second_view["stats"]["batting"]["runs"], 2),
        "avg": round(first_view["stats"]["batting"]["average"] - second_view["stats"]["batting"]["average"], 2),
        "strike_rate": round(
            first_view["stats"]["batting"]["strikeRate"] - second_view["stats"]["batting"]["strikeRate"],
            2,
        ),
        "wickets": round(first_view["stats"]["bowling"]["wickets"] - second_view["stats"]["bowling"]["wickets"], 2),
        "economy": round(first_view["stats"]["bowling"]["economy"] - second_view["stats"]["bowling"]["economy"], 2),
        "predicted_value": round(first_view["predictedValue"] - second_view["predictedValue"], 2),
    }
    winner = first_view["name"] if first_view["predictedValue"] >= second_view["predictedValue"] else second_view["name"]
    return {"players": [first_view, second_view], "winner": winner, "deltas": deltas}


def analyze_player(identifier: str) -> dict | None:
    raw_player = find_player(identifier)
    if not raw_player:
        return None

    player = to_frontend_player(raw_player)
    batting = player["stats"]["batting"]
    bowling = player["stats"]["bowling"]
    recent_form = player["recentForm"]
    consistency = player["consistency"]
    trend_slope = player["formTrend"]

    strengths = []
    weaknesses = []

    if batting["strikeRate"] >= 145:
        strengths.append("Explosive scoring rate")
    elif batting["strikeRate"] < 105 and batting["runs"] > 100:
        weaknesses.append("Strike rate limits scoring acceleration")

    if batting["average"] >= 40:
        strengths.append("Reliable batting average")
    elif batting["average"] < 20 and batting["runs"] > 100:
        weaknesses.append("Low batting average")

    if bowling["wickets"] >= max(8, batting["matches"]):
        strengths.append("Consistent wicket-taking impact")
    elif player["role"] in {"Bowler", "All-rounder"} and bowling["wickets"] < 5:
        weaknesses.append("Limited wicket output")

    if 0 < bowling["economy"] <= 7:
        strengths.append("Controls run rate well")
    elif bowling["economy"] > 9:
        weaknesses.append("Expensive economy rate")

    if trend_slope > 4:
        strengths.append("Recent form is improving")
    elif trend_slope < -4:
        weaknesses.append("Recent form is declining")

    if consistency <= 18 and len(recent_form) >= 3:
        strengths.append("Stable recent performances")
    elif consistency >= 35:
        weaknesses.append("High performance volatility")

    if not strengths:
        strengths.append("Balanced baseline profile")
    if not weaknesses:
        weaknesses.append("No major weakness detected")

    performance_score = _performance_score(player)
    risk_level = _risk_level(consistency, trend_slope, player["predictedValue"], player.get("actualValue", 0))
    recent_trend = "improving" if trend_slope > 2 else "declining" if trend_slope < -2 else "stable"

    return {
        "player_name": player["name"],
        "performance_score": performance_score,
        "strengths": strengths[:4],
        "weaknesses": weaknesses[:4],
        "recent_trend": recent_trend,
        "risk_level": risk_level,
        "trend_slope": round(float(trend_slope), 2),
    }


def _performance_score(player: dict) -> float:
    batting = player["stats"]["batting"]
    bowling = player["stats"]["bowling"]
    value_score = min(player["predictedValue"] / 350, 1) * 30
    batting_score = min(batting["average"] / 60, 1) * 20 + min(batting["strikeRate"] / 180, 1) * 20
    bowling_score = min(bowling["wickets"] / 25, 1) * 15
    economy_score = ((10 - bowling["economy"]) / 10) * 10 if bowling["economy"] > 0 else 5
    trend_score = max(min(player["formTrend"], 10), -10) + 10
    total = value_score + batting_score + bowling_score + economy_score + min(trend_score, 10)
    return round(max(min(total, 100), 0), 2)


def _risk_level(consistency: float, trend_slope: float, predicted_value: float, actual_value: float) -> str:
    premium = predicted_value - actual_value
    if consistency >= 40 or trend_slope < -8 or premium < -25:
        return "high"
    if consistency >= 25 or trend_slope < -2 or premium < 0:
        return "medium"
    return "low"
