"""Pydantic schemas for scoring, biases, scenarios, and factor waterfalls."""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class FactorContribution(BaseModel):
    category: str
    label: str
    raw_score: float      # -100 to +100
    weight: float         # 0.0 to 1.0
    contribution: float   # raw_score * weight
    status: str           # "BULLISH", "BEARISH", "NEUTRAL"
    recent_catalyst: Optional[str] = None
    source_count: int = 1


class ScenarioItem(BaseModel):
    title: str
    probability: float   # 0.0 to 1.0 (approximate scenario probability based on evidence)
    description: str
    implications: str
    triggers: List[str] = Field(default_factory=list)


class InvalidationCondition(BaseModel):
    id: str
    condition: str
    likelihood: str      # "Low", "Medium", "High"
    impact_if_triggered: str # "Flips to Bearish", "Reduces to Neutral"
    metric_to_watch: str


class DataQualityReport(BaseModel):
    status: str          # "HEALTHY", "WARNING", "INSUFFICIENT_DATA"
    completeness_pct: float
    stale_factors: List[str] = Field(default_factory=list)
    conflicting_signals: List[str] = Field(default_factory=list)
    disclaimer: str = "Fundamental bias is an analytical output, not a guarantee of future market direction."


class BiasSnapshotOut(BaseModel):
    symbol: str
    name: str
    asset_class: str
    current_price: float
    daily_change_pct: float
    timestamp: datetime

    tactical_bias: str   # STRONG BULLISH, BULLISH, MILD BULLISH, NEUTRAL, MILD BEARISH, BEARISH, STRONG BEARISH
    weekly_bias: str
    score: float         # -100 to +100
    weekly_score: float
    confidence: float    # 0 to 100%

    primary_driver: str
    secondary_driver: Optional[str] = None

    bullish_factors: List[str] = Field(default_factory=list)
    bearish_factors: List[str] = Field(default_factory=list)
    conflicting_factors: List[str] = Field(default_factory=list)
    invalidation_conditions: List[InvalidationCondition] = Field(default_factory=list)

    factor_breakdown: List[FactorContribution] = Field(default_factory=list)
    regimes: List[str] = Field(default_factory=list)

    scenario_bull: Optional[ScenarioItem] = None
    scenario_base: Optional[ScenarioItem] = None
    scenario_bear: Optional[ScenarioItem] = None

    data_quality: DataQualityReport


class BiasChangeOut(BaseModel):
    id: int
    asset_symbol: str
    timestamp: datetime
    previous_bias: str
    new_bias: str
    previous_score: float
    new_score: float
    primary_driver: str
    secondary_driver: Optional[str] = None
    confidence: float
