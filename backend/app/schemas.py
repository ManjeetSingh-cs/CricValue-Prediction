from __future__ import annotations

from typing import Optional, Union

from pydantic import BaseModel, Field


class BattingStats(BaseModel):
    matches: int
    runs: float
    average: float
    strikeRate: float
    highest: int = 0


class BowlingStats(BaseModel):
    matches: int
    wickets: int
    economy: float
    average: float = 0
    best: str = "0/0"


class PlayerStats(BaseModel):
    batting: BattingStats
    bowling: BowlingStats


class TrendPoint(BaseModel):
    date: str
    value: Optional[float] = None
    score: Optional[float] = None


class PlayerResponse(BaseModel):
    id: str
    name: str
    team: str = "FA"
    role: str
    nationality: str = "Unknown"
    stats: PlayerStats
    recentForm: list[float]
    predictedValue: float
    actualValue: float = 0
    valuationTrend: list[TrendPoint]
    performanceTrend: list[TrendPoint]
    consistency: float
    formTrend: float


class PredictionRequest(BaseModel):
    runs: float = Field(..., ge=0)
    avg: float = Field(..., ge=0)
    strike_rate: float = Field(..., ge=0, le=400)
    wickets: float = Field(..., ge=0)
    economy: float = Field(..., ge=0, le=30)
    matches: float = Field(1, ge=0)
    recent_form: float = Field(0, ge=0)
    consistency: float = Field(0, ge=0)
    form_trend: float = 0


class PlayerPredictionRequest(BaseModel):
    playerId: Optional[str] = None
    player_name: Optional[str] = None


class PredictionResponse(BaseModel):
    predicted_value: float
    predictedValue: float
    confidence: float
    model_name: str
    reasoning: str


class ChartResponse(BaseModel):
    player_name: str
    performance_trend: list[dict[str, Union[float, str]]]
    valuation_trend: list[dict[str, Union[float, str]]]


class PlayerCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=80)
    team: str = Field(..., min_length=1, max_length=80)
    role: str = Field(..., min_length=3, max_length=30)
    nationality: str = Field("Unknown", max_length=80)
    currentValue: float = Field(0, ge=0)
    predictedValue: Optional[float] = Field(default=None, ge=0)
    matches: int = Field(1, ge=1)
    runs: Optional[float] = Field(default=None, ge=0)
    avg: Optional[float] = Field(default=None, ge=0)
    strike_rate: Optional[float] = Field(default=None, ge=0, le=400)
    wickets: Optional[int] = Field(default=None, ge=0)
    economy: Optional[float] = Field(default=None, ge=0, le=30)
    stats: Optional[dict] = None
    recentForm: list[float] = Field(default_factory=list)


class PlayerCreateResponse(BaseModel):
    success: bool
    message: str
    player: PlayerResponse


class TrendResponse(BaseModel):
    player_name: str
    last_5_matches: list[dict[str, Union[float, str]]]
    trend_slope: float


class PlayerAnalysisResponse(BaseModel):
    player_name: str
    performance_score: float
    strengths: list[str]
    weaknesses: list[str]
    recent_trend: str
    risk_level: str
    trend_slope: float


class AuctionRequest(BaseModel):
    budget: float = Field(..., gt=0)
    max_players: int = Field(11, ge=1, le=15)


class CompareRequest(BaseModel):
    player_one: str
    player_two: str


class BestXIResponse(BaseModel):
    players: list[PlayerResponse]
    total_value: float


class AuctionResponse(BaseModel):
    budget: float
    total_spent: float
    remaining_budget: float
    suggested_team: list[PlayerResponse]


class ComparisonResponse(BaseModel):
    players: list[PlayerResponse]
    winner: str
    deltas: dict[str, float]
