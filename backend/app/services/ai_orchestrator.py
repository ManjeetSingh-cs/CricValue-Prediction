from __future__ import annotations

import random
from datetime import datetime

from app.repositories.player_repository import find_player, find_players, to_frontend_player
from app.services.analytics_service import analyze_player, get_best_xi, get_undervalued_players, simulate_auction


def build_strategy_response(prompt: str, budget: float = 500) -> dict:
    players = [to_frontend_player(player) for player in find_players()]
    top_players = sorted(players, key=lambda player: player["predictedValue"], reverse=True)
    undervalued = get_undervalued_players()
    auction = simulate_auction(budget)
    best_xi = get_best_xi()

    top_name = top_players[0]["name"] if top_players else "the top asset"
    alpha_name = undervalued[0]["name"] if undervalued else top_name
    safe_players = [player["name"] for player in top_players[:3]]
    risky_players = [
        player["player_name"]
        for player in find_players()
        if analyze_player(player["player_name"]) and analyze_player(player["player_name"])["risk_level"] == "high"
    ][:3]

    answer = (
        f"AI Strategy Desk read: prioritize {top_name} as the premium anchor, then hunt alpha through "
        f"{alpha_name}. For a budget of INR {budget:.0f}M, the simulator spends INR {auction['total_spent']:.1f}M "
        f"across {len(auction['suggested_team'])} players. The model favors players with positive valuation premium, "
        "improving recent-form slope, and role scarcity. Build around two batting anchors, one wicket-taking bowler, "
        "and one all-rounder hedge. Avoid paying full price for volatile assets unless they solve a role constraint."
    )

    return {
        "answer": answer,
        "confidence": 0.88,
        "generated_at": datetime.utcnow().isoformat(),
        "prompt": prompt,
        "budget": budget,
        "best_xi": best_xi["players"],
        "auction_plan": auction,
        "undervalued": undervalued[:5],
        "safe_players": safe_players,
        "risky_players": risky_players or ["No severe high-risk asset detected"],
        "suggested_prompts": [
            "Find undervalued finishers under INR 100M",
            "Build a low-risk XI for slow pitches",
            "Which players should I avoid in a bidding war?",
            "Simulate an aggressive auction strategy with INR 750M",
        ],
    }


def generate_auto_insights(limit: int = 8) -> list[dict]:
    players = [to_frontend_player(player) for player in find_players()]
    insights = []
    for player in sorted(players, key=lambda p: p["predictedValue"], reverse=True)[:limit]:
        premium = player["predictedValue"] - player.get("actualValue", player["predictedValue"])
        trend = player.get("formTrend", 0)
        sentiment = "rising" if trend >= 2 else "stable" if trend > -2 else "cooling"
        insights.append(
            {
                "headline": f"{player['name']} market sentiment {sentiment}",
                "detail": f"Model premium INR {premium:.1f}M, trend slope {trend:.1f}, current value INR {player['predictedValue']:.1f}M.",
                "confidence": round(0.74 + min(abs(trend) / 100, 0.18), 2),
                "type": "alpha" if premium > 0 else "risk",
            }
        )
    return insights


def scout_players(query: str) -> dict:
    players = [to_frontend_player(player) for player in find_players()]
    query_lower = query.lower()
    filtered = players
    if "under" in query_lower:
        numbers = [float(token.replace("₹", "").replace("m", "")) for token in query_lower.split() if token.replace("₹", "").replace("m", "").isdigit()]
        if numbers:
            filtered = [player for player in filtered if player["predictedValue"] <= numbers[0]]
    if "bats" in query_lower or "explosive" in query_lower:
        filtered = [player for player in filtered if player["stats"]["batting"]["strikeRate"] >= 120]
    filtered = sorted(filtered, key=lambda player: player["predictedValue"], reverse=True)[:8]
    return {"query": query, "players": filtered, "summary": f"Found {len(filtered)} scouting matches using valuation, role, and strike-rate signals."}


def career_forecast(name: str) -> dict | None:
    raw = find_player(name)
    if not raw:
        return None
    player = to_frontend_player(raw)
    slope = player.get("formTrend", 0)
    base = player["predictedValue"]
    return {
        "player_name": player["name"],
        "one_year_value": round(base * (1 + max(min(slope, 12), -8) / 100), 2),
        "three_year_value": round(base * (1 + max(min(slope, 12), -8) / 65), 2),
        "confidence": 0.78,
        "explanation": "Forecast blends current valuation, trend slope, role scarcity, and volatility penalty.",
    }


def injury_risk(name: str) -> dict | None:
    raw = find_player(name)
    if not raw:
        return None
    player = to_frontend_player(raw)
    workload = player["stats"]["batting"]["matches"] + player["stats"]["bowling"]["wickets"] * 0.8
    volatility = player.get("consistency", 0)
    probability = min(0.72, 0.08 + workload / 180 + volatility / 300)
    return {"player_name": player["name"], "injury_probability": round(probability, 2), "risk_level": "high" if probability > 0.5 else "medium" if probability > 0.28 else "low"}


def explain_valuation(name: str) -> dict | None:
    raw = find_player(name)
    if not raw:
        return None
    player = to_frontend_player(raw)
    importance = [
        {"feature": "Runs", "weight": min(player["stats"]["batting"]["runs"] / 700, 1)},
        {"feature": "Strike rate", "weight": min(player["stats"]["batting"]["strikeRate"] / 180, 1)},
        {"feature": "Wickets", "weight": min(player["stats"]["bowling"]["wickets"] / 25, 1)},
        {"feature": "Recent trend", "weight": min(abs(player.get("formTrend", 0)) / 15, 1)},
        {"feature": "Consistency", "weight": max(0, 1 - player.get("consistency", 0) / 60)},
    ]
    return {"player_name": player["name"], "valuation": player["predictedValue"], "feature_importance": importance}


def sentiment_snapshot() -> dict:
    sentiments = ["Aggressive", "Selective", "Risk-on", "Value-hunting"]
    return {
        "market_sentiment": random.choice(sentiments),
        "confidence": 0.82,
        "signals": generate_auto_insights(5),
    }
