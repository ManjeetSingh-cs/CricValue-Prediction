from __future__ import annotations

from typing import Union

from fastapi import APIRouter, HTTPException

from app.schemas import PlayerPredictionRequest, PredictionRequest, PredictionResponse
from app.services.player_service import get_feature_row_for_player
from app.services.prediction_service import predict_from_features

router = APIRouter(tags=["predictions"])


@router.post("/predict", response_model=PredictionResponse)
def predict(payload: Union[PredictionRequest, PlayerPredictionRequest]) -> dict:
    if isinstance(payload, PlayerPredictionRequest):
        identifier = payload.playerId or payload.player_name
        if not identifier:
            raise HTTPException(status_code=422, detail="playerId or player_name is required")
        feature_row = get_feature_row_for_player(identifier)
        if not feature_row:
            raise HTTPException(status_code=404, detail="Player not found")
        return predict_from_features(feature_row)

    return predict_from_features(payload)
