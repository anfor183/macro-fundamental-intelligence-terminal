"""Entity models: Assets, Currencies, Central Banks, Indicators, and Releases."""

from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class CentralBank(Base):
    __tablename__ = "central_banks"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, index=True, nullable=False) # e.g. FED, ECB, BOJ, BOE
    name = Column(String(100), nullable=False)
    country = Column(String(50), nullable=False)
    currency = Column(String(10), nullable=False)
    current_rate = Column(Float, default=0.0)
    previous_rate = Column(Float, default=0.0)
    expected_next_rate = Column(Float, default=0.0)
    guidance_stance = Column(String(50), default="Neutral") # Hawkish, Dovish, Neutral
    balance_sheet_policy = Column(String(50), default="Neutral") # QT, QE, Neutral
    next_meeting_date = Column(DateTime, nullable=True)
    last_statement_summary = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    currencies = relationship("Currency", back_populates="central_bank")


class Currency(Base):
    __tablename__ = "currencies"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(10), unique=True, index=True, nullable=False) # USD, EUR, GBP, JPY, etc.
    name = Column(String(50), nullable=False)
    central_bank_id = Column(Integer, ForeignKey("central_banks.id"), nullable=True)
    current_score = Column(Float, default=0.0) # -100 to +100
    weekly_score = Column(Float, default=0.0)
    policy_direction = Column(String(50), default="Neutral") # Tightening, Easing, Paused
    growth_direction = Column(String(50), default="Stable") # Accelerating, Stable, Slowing
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    central_bank = relationship("CentralBank", back_populates="currencies")


class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), unique=True, index=True, nullable=False) # e.g. EURUSD, XAUUSD, SPX, CL
    name = Column(String(100), nullable=False)
    asset_class = Column(String(30), nullable=False, index=True) # forex, index, metal, commodity
    base_currency = Column(String(10), nullable=True) # EUR
    quote_currency = Column(String(10), nullable=True) # USD
    is_active = Column(Boolean, default=True)
    current_price = Column(Float, default=0.0)
    daily_change_pct = Column(Float, default=0.0)
    meta_info = Column(JSON, default=dict)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    scores = relationship("MacroScore", back_populates="asset", cascade="all, delete-orphan")
    bias_snapshots = relationship("BiasSnapshot", back_populates="asset", cascade="all, delete-orphan")
    bias_changes = relationship("BiasChange", back_populates="asset", cascade="all, delete-orphan")


class EconomicIndicator(Base):
    __tablename__ = "economic_indicators"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False) # e.g. US_CPI_YOY, US_NFP, EZ_PMI_MFG
    name = Column(String(150), nullable=False)
    country = Column(String(50), nullable=False)
    currency = Column(String(10), nullable=False)
    category = Column(String(50), nullable=False, index=True) # inflation, labor, growth, consumer, trade, fiscal
    importance = Column(String(20), default="Medium") # Critical, High, Medium, Low
    default_half_life_days = Column(Float, default=7.0)
    unit = Column(String(20), default="%")
    historical_std_dev = Column(Float, default=0.2) # Used for surprise z-score calculation

    releases = relationship("EconomicRelease", back_populates="indicator", cascade="all, delete-orphan")


class EconomicRelease(Base):
    __tablename__ = "economic_releases"

    id = Column(Integer, primary_key=True, index=True)
    indicator_id = Column(Integer, ForeignKey("economic_indicators.id"), nullable=False)
    event_time = Column(DateTime, nullable=False, index=True)
    period = Column(String(30), nullable=True) # e.g. Jan 2026, Q4 2025
    actual = Column(Float, nullable=True)
    consensus = Column(Float, nullable=True)
    previous = Column(Float, nullable=True)
    revised_previous = Column(Float, nullable=True)
    surprise = Column(Float, nullable=True) # actual - consensus
    surprise_zscore = Column(Float, nullable=True) # (actual - consensus) / std_dev
    policy_implication = Column(String(50), nullable=True) # Hawkish, Dovish, Neutral, Mixed
    is_revised = Column(Boolean, default=False)
    source_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=utc_now)

    indicator = relationship("EconomicIndicator", back_populates="releases")
