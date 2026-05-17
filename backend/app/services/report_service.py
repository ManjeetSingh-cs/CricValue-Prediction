from __future__ import annotations

import os
from datetime import datetime
from io import BytesIO

os.environ.setdefault("MPLCONFIGDIR", "/private/tmp/matplotlib")

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages

from app.repositories.player_repository import find_players, to_frontend_player
from app.services.analytics_service import analyze_player, get_best_xi, get_undervalued_players


def generate_global_report_pdf() -> BytesIO:
    players = [to_frontend_player(player) for player in find_players()]
    top_players = sorted(players, key=lambda player: player["predictedValue"], reverse=True)[:8]
    undervalued = get_undervalued_players()[:8]
    overvalued = [
        player for player in players if player["predictedValue"] < player.get("actualValue", player["predictedValue"])
    ][:8]

    output = BytesIO()
    with PdfPages(output) as pdf:
        _cover_page(pdf, players, top_players, undervalued)
        _valuation_chart_page(pdf, top_players)
        _market_intelligence_page(pdf, top_players, undervalued, overvalued)
        _risk_page(pdf, top_players)
        _strategy_page(pdf, top_players, undervalued)

    output.seek(0)
    return output


def _cover_page(pdf: PdfPages, players: list[dict], top_players: list[dict], undervalued: list[dict]) -> None:
    fig = plt.figure(figsize=(11, 8.5), facecolor="#07111f")
    fig.text(0.07, 0.85, "CricValue AI", color="#e5edff", fontsize=34, weight="bold")
    fig.text(0.07, 0.79, "Global Cricket Auction Intelligence Report", color="#8fb4ff", fontsize=18)
    fig.text(0.07, 0.73, datetime.utcnow().strftime("Generated %d %b %Y UTC"), color="#94a3b8", fontsize=10)

    market_cap = sum(player["predictedValue"] for player in players)
    avg_value = market_cap / len(players) if players else 0
    lines = [
        f"Tracked players: {len(players)}",
        f"Predicted market cap: INR {market_cap:,.1f}M",
        f"Average player value: INR {avg_value:,.1f}M",
        f"Best XI value: INR {get_best_xi()['total_value']:,.1f}M",
        f"Detected undervalued assets: {len(undervalued)}",
        f"Top asset: {top_players[0]['name'] if top_players else 'N/A'}",
    ]
    for idx, line in enumerate(lines):
        fig.text(0.09, 0.62 - idx * 0.055, line, color="#dbeafe", fontsize=14)

    fig.text(
        0.07,
        0.16,
        "Executive AI Summary: Batting strike-rate premiums remain strong, but the best auction alpha is concentrated in players whose model value exceeds observed market value with stable recent form.",
        color="#cbd5e1",
        fontsize=12,
        wrap=True,
    )
    pdf.savefig(fig, bbox_inches="tight")
    plt.close(fig)


def _valuation_chart_page(pdf: PdfPages, top_players: list[dict]) -> None:
    fig, ax = plt.subplots(figsize=(11, 8.5), facecolor="#07111f")
    ax.set_facecolor("#0f172a")
    names = [player["name"] for player in top_players]
    values = [player["predictedValue"] for player in top_players]
    ax.barh(names, values, color="#6366f1")
    ax.invert_yaxis()
    ax.set_title("Top Predicted Player Valuations", color="#e5edff", fontsize=18, weight="bold")
    ax.set_xlabel("Predicted value (INR M)", color="#cbd5e1")
    ax.tick_params(colors="#cbd5e1")
    for spine in ax.spines.values():
        spine.set_color("#1e293b")
    pdf.savefig(fig, bbox_inches="tight")
    plt.close(fig)


def _market_intelligence_page(
    pdf: PdfPages,
    top_players: list[dict],
    undervalued: list[dict],
    overvalued: list[dict],
) -> None:
    fig = plt.figure(figsize=(11, 8.5), facecolor="#07111f")
    fig.text(0.07, 0.88, "Market Intelligence", color="#e5edff", fontsize=24, weight="bold")
    sections = [
        ("Top predicted players", [f"{p['name']} - INR {p['predictedValue']}M" for p in top_players[:5]]),
        ("Undervalued players", [f"{p['name']} - model premium INR {p['predictedValue'] - p.get('actualValue', 0):.1f}M" for p in undervalued[:5]]),
        ("Overvalued players", [f"{p['name']} - market premium INR {p.get('actualValue', 0) - p['predictedValue']:.1f}M" for p in overvalued[:5]] or ["No major overvaluation detected"]),
        ("NLP sentiment", ["Model sentiment: Aggressive", "Narrative: all-rounders with improving recent form draw the strongest auction confidence."]),
    ]
    y = 0.79
    for title, items in sections:
        fig.text(0.08, y, title, color="#93c5fd", fontsize=14, weight="bold")
        y -= 0.04
        for item in items:
            fig.text(0.1, y, f"- {item}", color="#cbd5e1", fontsize=11)
            y -= 0.035
        y -= 0.035
    pdf.savefig(fig, bbox_inches="tight")
    plt.close(fig)


def _risk_page(pdf: PdfPages, top_players: list[dict]) -> None:
    fig = plt.figure(figsize=(11, 8.5), facecolor="#07111f")
    fig.text(0.07, 0.88, "Player Risk Analysis", color="#e5edff", fontsize=24, weight="bold")
    y = 0.78
    for player in top_players[:6]:
        analysis = analyze_player(player["name"])
        if not analysis:
            continue
        fig.text(0.08, y, f"{player['name']} - {analysis['risk_level'].upper()} RISK", color="#bfdbfe", fontsize=13, weight="bold")
        fig.text(0.1, y - 0.035, f"Score {analysis['performance_score']} | Trend {analysis['recent_trend']} | Slope {analysis['trend_slope']}", color="#cbd5e1", fontsize=10)
        fig.text(0.1, y - 0.07, "Strengths: " + ", ".join(analysis["strengths"]), color="#bbf7d0", fontsize=10)
        fig.text(0.1, y - 0.105, "Watch: " + ", ".join(analysis["weaknesses"]), color="#fecdd3", fontsize=10)
        y -= 0.14
    pdf.savefig(fig, bbox_inches="tight")
    plt.close(fig)


def _strategy_page(pdf: PdfPages, top_players: list[dict], undervalued: list[dict]) -> None:
    fig = plt.figure(figsize=(11, 8.5), facecolor="#07111f")
    fig.text(0.07, 0.88, "AI Auction Intelligence", color="#e5edff", fontsize=24, weight="bold")
    recommendations = [
        "Allocate 45-55% of budget to proven top-order batting assets with high strike-rate elasticity.",
        "Reserve 20-25% for undervalued bowling/all-rounder profiles where model premium is positive.",
        "Avoid overpaying for volatile players with declining trend slope unless role scarcity is extreme.",
        "Build the first XI around two high-confidence anchors, one powerplay wicket-taker, and one flexible all-rounder.",
        "Use late-auction capital for players with low actual value but strong recent-form slope.",
    ]
    y = 0.78
    for item in recommendations:
        fig.text(0.09, y, f"- {item}", color="#cbd5e1", fontsize=12, wrap=True)
        y -= 0.065
    fig.text(0.07, 0.34, "Priority watchlist", color="#93c5fd", fontsize=16, weight="bold")
    watchlist = undervalued[:4] or top_players[:4]
    for idx, player in enumerate(watchlist):
        fig.text(0.09, 0.28 - idx * 0.05, f"{idx + 1}. {player['name']} - INR {player['predictedValue']}M", color="#dbeafe", fontsize=12)
    pdf.savefig(fig, bbox_inches="tight")
    plt.close(fig)
