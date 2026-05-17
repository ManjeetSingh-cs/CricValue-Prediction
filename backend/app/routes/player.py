from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.schemas import (
    ChartResponse,
    PlayerAnalysisResponse,
    PlayerCreateRequest,
    PlayerCreateResponse,
    PlayerResponse,
    TrendResponse,
)
from app.services.player_service import create_player, get_all_players, get_player_by_name_or_id
from app.services.analytics_service import analyze_player

router = APIRouter(tags=["players"])


@router.get("/players", response_model=list[PlayerResponse])
def list_players(
    team: Optional[str] = None,
    role: Optional[str] = None,
    min_value: Optional[float] = Query(default=None, ge=0),
) -> list[dict]:
    return get_all_players(team=team, role=role, min_value=min_value)


@router.post("/players", response_model=PlayerCreateResponse, status_code=201)
def register_player(payload: PlayerCreateRequest) -> dict:
    player = create_player(payload)
    return {
        "success": True,
        "message": "Player registered and valuation predicted successfully",
        "player": player,
    }


@router.get("/player/{name}", response_model=PlayerResponse)
def get_player(name: str) -> dict:
    player = get_player_by_name_or_id(name)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player


@router.get("/player/{name}/charts", response_model=ChartResponse)
def get_player_charts(name: str) -> dict:
    player = get_player_by_name_or_id(name)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return {
        "player_name": player["name"],
        "performance_trend": player["performanceTrend"],
        "valuation_trend": player["valuationTrend"],
    }


@router.get("/player/{name}/trend", response_model=TrendResponse)
def get_player_trend(name: str) -> dict:
    player = get_player_by_name_or_id(name)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    last_5 = player["performanceTrend"][-5:]
    return {
        "player_name": player["name"],
        "last_5_matches": last_5,
        "trend_slope": player["formTrend"],
    }


@router.get("/player/{name}/analysis", response_model=PlayerAnalysisResponse)
def get_player_analysis(name: str) -> dict:
    analysis = analyze_player(name)
    if not analysis:
        raise HTTPException(status_code=404, detail="Player not found")
    return analysis
