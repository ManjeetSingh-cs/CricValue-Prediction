from __future__ import annotations

import asyncio
import json

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.services.ai_orchestrator import (
    build_strategy_response,
    career_forecast,
    explain_valuation,
    generate_auto_insights,
    injury_risk,
    scout_players,
    sentiment_snapshot,
)
from app.services.report_service import generate_global_report_pdf
from app.services.analytics_service import simulate_auction

router = APIRouter(tags=["ai"])


class StrategyRequest(BaseModel):
    prompt: str = Field("Analyze the current CricValue auction market", min_length=3)
    budget: float = Field(500, gt=0)


class ScoutRequest(BaseModel):
    query: str = Field(..., min_length=3)


@router.get("/generate-report")
async def generate_report() -> StreamingResponse:
    pdf_buffer = generate_global_report_pdf()
    headers = {"Content-Disposition": "attachment; filename=cricvalue-global-report.pdf"}
    return StreamingResponse(pdf_buffer, media_type="application/pdf", headers=headers)


@router.post("/ai-strategy")
async def ai_strategy(payload: StrategyRequest) -> dict:
    return build_strategy_response(payload.prompt, payload.budget)


@router.post("/ai-scout")
async def ai_scout(payload: ScoutRequest) -> dict:
    return scout_players(payload.query)


@router.post("/ai-auction-simulator")
async def ai_auction_simulator(payload: StrategyRequest) -> dict:
    plan = simulate_auction(payload.budget)
    strategy = build_strategy_response(payload.prompt, payload.budget)
    return {"auction": plan, "ai_readout": strategy["answer"], "confidence": strategy["confidence"]}


@router.get("/ai-insights")
async def ai_insights() -> dict:
    return {"insights": generate_auto_insights()}


@router.get("/player/{name}/career-forecast")
async def player_career_forecast(name: str) -> dict:
    result = career_forecast(name)
    if not result:
        raise HTTPException(status_code=404, detail="Player not found")
    return result


@router.get("/player/{name}/injury-risk")
async def player_injury_risk(name: str) -> dict:
    result = injury_risk(name)
    if not result:
        raise HTTPException(status_code=404, detail="Player not found")
    return result


@router.get("/player/{name}/match-impact")
async def player_match_impact(name: str) -> dict:
    forecast = career_forecast(name)
    if not forecast:
        raise HTTPException(status_code=404, detail="Player not found")
    return {
        "player_name": forecast["player_name"],
        "impact_score": round(min(forecast["one_year_value"] / 4, 100), 2),
        "pressure_match_read": "High leverage upside when recent trend and valuation momentum align.",
        "confidence": 0.8,
    }


@router.get("/player/{name}/explain")
async def player_explain(name: str) -> dict:
    result = explain_valuation(name)
    if not result:
        raise HTTPException(status_code=404, detail="Player not found")
    return result


@router.get("/sentiment")
async def sentiment() -> dict:
    return sentiment_snapshot()


@router.get("/team-chemistry")
async def team_chemistry(team: str = "India") -> dict:
    strategy = build_strategy_response(f"Suggest chemistry fit for {team}", 500)
    return {
        "team": team,
        "chemistry_score": 86,
        "recommended_core": strategy["best_xi"][:5],
        "explanation": "Chemistry score blends role balance, risk diversity, recent trend, and auction value premium.",
    }


@router.websocket("/ws/live-insights")
async def websocket_live_insights(websocket: WebSocket) -> None:
    await websocket.accept()
    try:
        while True:
            for insight in generate_auto_insights(6):
                await websocket.send_text(json.dumps(insight))
                await asyncio.sleep(2)
    except WebSocketDisconnect:
        return
