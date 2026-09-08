"""Intelligence models: Sources, Normalized News Events, Institutional Research, and Provenance."""

from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class NewsSource(Base):
    __tablename__ = "news_sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False) # e.g. "Federal Reserve", "BLS", "Reuters", "Bloomberg", "Goldman Sachs"
    domain = Column(String(100), nullable=True)
    tier = Column(Integer, default=2) # 1: Official Primary, 2: Major Reputable, 3: Professional Secondary, 4: Specialist, 5: Unverified
    reliability_score = Column(Float, default=85.0) # 0 to 100
    source_type = Column(String(50), default="media") # official, central_bank, media, institutional, specialist
    feed_url = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    last_fetch_time = Column(DateTime, nullable=True)
    error_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=utc_now)

    events = relationship("NewsEvent", back_populates="source_rel")


class NewsEvent(Base):
    __tablename__ = "news_events"

    id = Column(Integer, primary_key=True, index=True)
    event_cluster_id = Column(String(64), index=True, nullable=False) # Deduplication cluster ID
    content_hash = Column(String(64), index=True, nullable=False) # SHA-256 of normalized title & content
    source_id = Column(Integer, ForeignKey("news_sources.id"), nullable=True)
    source_name = Column(String(100), nullable=False)
    source_tier = Column(Integer, default=2)
    source_reliability = Column(Float, default=85.0)
    source_url = Column(String(500), nullable=True)

    title = Column(String(300), nullable=False)
    summary = Column(Text, nullable=False)
    statement_type = Column(String(30), default="FACT") # FACT, ANALYST OPINION, FORECAST, MARKET EXPECTATION

    published_at = Column(DateTime, nullable=False, index=True)
    retrieved_at = Column(DateTime, default=utc_now)

    macro_category = Column(String(50), nullable=False, index=True) # monetary_policy, inflation, labor, growth, geopolitics, commodities, yields
    direction = Column(String(20), default="neutral") # bullish, bearish, neutral, mixed
    impact_score = Column(Float, default=50.0) # 0 to 100
    confidence = Column(Float, default=80.0) # 0 to 100
    time_horizon = Column(String(30), default="short-term") # intraday, short-term (1-3d), weekly (1-2w), medium-term (1-3m)

    is_duplicate = Column(Boolean, default=False)
    duplicate_count = Column(Integer, default=1)
    
    affected_currencies = Column(JSON, default=list) # e.g. ["USD", "EUR"]
    affected_assets = Column(JSON, default=list) # e.g. ["EURUSD", "SPX", "XAUUSD"]

    is_simulated = Column(Boolean, default=False) # True if from synthetic/demo scenario
    meta_info = Column(JSON, default=dict)

    source_rel = relationship("NewsSource", back_populates="events")


class InstitutionalView(Base):
    __tablename__ = "institutional_views"

    id = Column(Integer, primary_key=True, index=True)
    institution_name = Column(String(100), nullable=False, index=True) # Goldman Sachs, JPMorgan, Morgan Stanley, UBS, etc.
    title = Column(String(300), nullable=False)
    summary = Column(Text, nullable=False)
    view_type = Column(String(30), default="ANALYST OPINION") # FACT, ANALYST OPINION, FORECAST, MARKET EXPECTATION
    asset_symbol = Column(String(20), nullable=False, index=True)
    stance = Column(String(20), nullable=False) # Bullish, Bearish, Neutral
    target_horizon = Column(String(50), default="1-3 Months")
    published_at = Column(DateTime, nullable=False)
    source_url = Column(String(500), nullable=True)
    reliability_tier = Column(Integer, default=2)
    created_at = Column(DateTime, default=utc_now)


class ProvenanceRecord(Base):
    __tablename__ = "provenance_records"

    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(String(64), index=True, nullable=False) # unique ID for specific claim or driver
    asset_symbol = Column(String(20), nullable=False, index=True)
    claim_text = Column(Text, nullable=False)
    claim_category = Column(String(50), nullable=False)
    source_name = Column(String(100), nullable=False)
    source_url = Column(String(500), nullable=True)
    source_tier = Column(Integer, default=2)
    source_reliability = Column(Float, default=85.0)
    published_at = Column(DateTime, nullable=False)
    statement_type = Column(String(30), default="FACT") # FACT, ANALYST OPINION, FORECAST, MARKET EXPECTATION
    recorded_at = Column(DateTime, default=utc_now)
