"""Scoring, Bias, Snapshots, Alerts, and Audit models."""

from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class MacroScore(Base):
    __tablename__ = "macro_scores"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False)
    timestamp = Column(DateTime, default=utc_now, index=True)

    tactical_score = Column(Float, nullable=False) # -100 to +100
    weekly_score = Column(Float, nullable=False)   # -100 to +100
    confidence = Column(Float, default=75.0)       # 0 to 100

    # JSON breakdown of factor contributions:
    # { "monetary_policy": {"score": 45.0, "weight": 0.20, "contribution": 9.0}, ... }
    factor_breakdown = Column(JSON, default=dict)
    weight_breakdown = Column(JSON, default=dict)
    regime_tags = Column(JSON, default=list) # ["DISINFLATIONARY", "RISK_ON"]

    asset = relationship("Asset", back_populates="scores")


class BiasSnapshot(Base):
    __tablename__ = "bias_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False)
    timestamp = Column(DateTime, default=utc_now, index=True)

    # Bias categories: STRONG BULLISH, BULLISH, MILD BULLISH, NEUTRAL, MILD BEARISH, BEARISH, STRONG BEARISH
    tactical_bias = Column(String(30), nullable=False)
    weekly_bias = Column(String(30), nullable=False)
    score = Column(Float, nullable=False)
    weekly_score = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)

    primary_driver = Column(String(255), nullable=True)
    secondary_driver = Column(String(255), nullable=True)

    bullish_factors = Column(JSON, default=list)
    bearish_factors = Column(JSON, default=list)
    conflicting_factors = Column(JSON, default=list)
    invalidation_conditions = Column(JSON, default=list)

    scenario_bull = Column(JSON, default=dict)
    scenario_base = Column(JSON, default=dict)
    scenario_bear = Column(JSON, default=dict)

    data_quality = Column(JSON, default=dict) # {"status": "HEALTHY"|"WARNING", "completeness": 92.0, "stale_factors": []}

    asset = relationship("Asset", back_populates="bias_snapshots")


class BiasChange(Base):
    __tablename__ = "bias_changes"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False)
    timestamp = Column(DateTime, default=utc_now, index=True)

    previous_bias = Column(String(30), nullable=False)
    new_bias = Column(String(30), nullable=False)
    previous_score = Column(Float, nullable=False)
    new_score = Column(Float, nullable=False)

    primary_driver = Column(String(255), nullable=False)
    secondary_driver = Column(String(255), nullable=True)
    confidence = Column(Float, default=80.0)
    trigger_event_id = Column(Integer, nullable=True)

    asset = relationship("Asset", back_populates="bias_changes")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    asset_symbol = Column(String(20), index=True, nullable=True)
    timestamp = Column(DateTime, default=utc_now, index=True)
    alert_type = Column(String(50), nullable=False) # BIAS_CHANGE, HIGH_IMPACT_RELEASE, REGIME_CHANGE, CONFLICT_WARNING, STALE_DATA
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String(20), default="INFO") # INFO, WARNING, CRITICAL
    is_read = Column(Boolean, default=False)
    meta_info = Column(JSON, default=dict)


class SystemHealth(Base):
    __tablename__ = "system_health"

    id = Column(Integer, primary_key=True, index=True)
    component = Column(String(100), unique=True, nullable=False) # Ingestion, Scoring, Database, AI Service, Feed Parser
    status = Column(String(30), default="HEALTHY") # HEALTHY, DEGRADED, DOWN
    latency_ms = Column(Float, default=0.0)
    message = Column(String(255), nullable=True)
    error_rate_pct = Column(Float, default=0.0)
    last_check = Column(DateTime, default=utc_now, onupdate=utc_now)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=utc_now, index=True)
    actor = Column(String(100), default="system")
    action = Column(String(100), nullable=False) # OVERRIDE_WEIGHT, OVERRIDE_BIAS, DISABLE_SOURCE
    target_type = Column(String(50), nullable=False)
    target_id = Column(String(50), nullable=False)
    previous_value = Column(JSON, nullable=True)
    new_value = Column(JSON, nullable=True)
    reason = Column(Text, nullable=True)
