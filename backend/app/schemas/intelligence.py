"""Pydantic schemas for intelligence, news events, provenance, and calendar."""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class NewsSourceOut(BaseModel):
    id: int
    name: str
    domain: Optional[str] = None
    tier: int
    reliability_score: float
    source_type: str
    is_active: bool
    last_fetch_time: Optional[datetime] = None
    error_count: int

    class Config:
        from_attributes = True


class NewsEventOut(BaseModel):
    id: int
    event_cluster_id: str
    source_name: str
    source_tier: int
    source_reliability: float
    source_url: Optional[str] = None
    title: str
    summary: str
    statement_type: str # FACT, ANALYST OPINION, FORECAST, MARKET EXPECTATION
    published_at: datetime
    macro_category: str
    direction: str
    impact_score: float
    confidence: float
    time_horizon: str
    duplicate_count: int
    affected_assets: List[str] = Field(default_factory=list)
    affected_currencies: List[str] = Field(default_factory=list)
    is_simulated: bool = False

    class Config:
        from_attributes = True


class InstitutionalViewOut(BaseModel):
    id: int
    institution_name: str
    title: str
    summary: str
    view_type: str
    asset_symbol: str
    stance: str
    target_horizon: str
    published_at: datetime
    source_url: Optional[str] = None
    reliability_tier: int

    class Config:
        from_attributes = True


class ProvenanceRecordOut(BaseModel):
    id: int
    claim_id: str
    asset_symbol: str
    claim_text: str
    claim_category: str
    source_name: str
    source_url: Optional[str] = None
    source_tier: int
    source_reliability: float
    published_at: datetime
    statement_type: str

    class Config:
        from_attributes = True


class EconomicReleaseOut(BaseModel):
    id: int
    indicator_code: str
    indicator_name: str
    country: str
    currency: str
    category: str
    importance: str
    event_time: datetime
    period: Optional[str] = None
    actual: Optional[float] = None
    consensus: Optional[float] = None
    previous: Optional[float] = None
    revised_previous: Optional[float] = None
    surprise: Optional[float] = None
    surprise_zscore: Optional[float] = None
    policy_implication: Optional[str] = None
    unit: str = "%"
    source_url: Optional[str] = None


class MacroRegimeOut(BaseModel):
    primary_regime: str
    active_regimes: List[str]
    risk_sentiment: str # RISK_ON, RISK_OFF, NEUTRAL
    liquidity_cycle: str # EXPANDING, CONTRACTING, NEUTRAL
    growth_cycle: str # EXPANSION, SLOWDOWN, RECESSION
    inflation_cycle: str # INFLATIONARY, DISINFLATIONARY, STAGFLATIONARY
    summary: str
    key_drivers: List[str]
    timestamp: datetime
