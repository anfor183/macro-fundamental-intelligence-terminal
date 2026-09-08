"""Pydantic schemas for assets and currencies."""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class CentralBankOut(BaseModel):
    id: int
    code: str
    name: str
    country: str
    currency: str
    current_rate: float
    previous_rate: float
    expected_next_rate: float
    guidance_stance: str
    balance_sheet_policy: str
    next_meeting_date: Optional[datetime] = None
    last_statement_summary: Optional[str] = None
    updated_at: datetime

    class Config:
        from_attributes = True


class CurrencyOut(BaseModel):
    id: int
    code: str
    name: str
    current_score: float
    weekly_score: float
    policy_direction: str
    growth_direction: str
    central_bank: Optional[CentralBankOut] = None
    updated_at: datetime

    class Config:
        from_attributes = True


class AssetBase(BaseModel):
    symbol: str
    name: str
    asset_class: str
    base_currency: Optional[str] = None
    quote_currency: Optional[str] = None
    current_price: float = 0.0
    daily_change_pct: float = 0.0


class AssetOut(AssetBase):
    id: int
    is_active: bool
    updated_at: datetime

    class Config:
        from_attributes = True


class CurrencyMatrixItem(BaseModel):
    currency: str
    absolute_score: float
    weekly_score: float
    rank: int
    policy_stance: str
    growth_stance: str
    relative_scores: Dict[str, float] = Field(default_factory=dict)


class ForexRankingItem(BaseModel):
    rank: int
    symbol: str
    bias: str
    tactical_score: float
    weekly_score: float
    confidence: float
    conviction_score: float # abs(tactical_score) * (confidence / 100)
    primary_driver: str
    base_currency_score: float
    quote_currency_score: float
    yield_differential_driver: float
