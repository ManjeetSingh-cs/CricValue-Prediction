from fastapi import APIRouter, HTTPException

from app.schemas import (
    AuctionRequest,
    AuctionResponse,
    BestXIResponse,
    CompareRequest,
    ComparisonResponse,
    PlayerResponse,
)
from app.services.analytics_service import (
    compare_players,
    get_best_xi,
    get_undervalued_players,
    simulate_auction,
)

router = APIRouter(tags=["analytics"])


@router.get("/best-xi", response_model=BestXIResponse)
def best_xi() -> dict:
    return get_best_xi()


@router.post("/auction", response_model=AuctionResponse)
def auction(payload: AuctionRequest) -> dict:
    return simulate_auction(payload.budget, payload.max_players)


@router.get("/undervalued", response_model=list[PlayerResponse])
def undervalued() -> list[dict]:
    return get_undervalued_players()


@router.post("/compare", response_model=ComparisonResponse)
def compare(payload: CompareRequest) -> dict:
    result = compare_players(payload.player_one, payload.player_two)
    if not result:
        raise HTTPException(status_code=404, detail="One or both players were not found")
    return result
