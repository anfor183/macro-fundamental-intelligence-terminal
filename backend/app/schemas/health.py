"""Pydantic schemas for system health and monitoring."""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class ComponentHealth(BaseModel):
    component: str
    status: str # HEALTHY, DEGRADED, DOWN
    latency_ms: float
    error_rate_pct: float
    message: Optional[str] = None
    last_check: datetime


class SystemHealthResponse(BaseModel):
    overall_status: str
    timestamp: datetime
    active_sources_count: int
    total_events_processed: int
    cache_connected: bool
    ai_service_available: bool
    data_freshness_seconds: int
    components: List[ComponentHealth] = Field(default_factory=list)
    recent_errors: List[str] = Field(default_factory=list)
