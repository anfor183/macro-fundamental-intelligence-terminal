"""Pydantic schemas for historical backtesting and model calibration."""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class BacktestRequest(BaseModel):
    asset_symbol: str = "EURUSD"
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    holding_period_days: int = 5 # evaluation window for fundamental bias follow-through
    threshold_filter: float = 40.0 # only trade on strong/moderate signals


class BacktestMetrics(BaseModel):
    asset_symbol: str
    total_signals: int
    bullish_signals: int
    bearish_signals: int
    neutral_periods: int
    directional_accuracy_pct: float # Hit rate: did price move in direction of macro bias over holding period?
    avg_gain_pct: float
    avg_loss_pct: float
    win_loss_ratio: float
    max_drawdown_pct: float
    bias_persistence_half_life_days: float
    regime_breakdown: Dict[str, float] = Field(default_factory=dict)
    disclaimer: str = "Backtest metrics reflect historical macro bias alignment, not a guaranteed trading strategy."


class CalibrationWeight(BaseModel):
    category: str
    current_weight: float
    suggested_weight: float
    t_stat: float
    p_value: float
