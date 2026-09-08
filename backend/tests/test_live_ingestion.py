"""Unit tests for the Live Data Ingestion Engine (Yahoo Finance, ForexFactory, RSS feeds, Orchestrator)."""

import pytest
from datetime import datetime, timezone

from backend.app.ingestion.live_market_data import (
    YFINANCE_TICKER_MAP,
    REVERSE_TICKER_MAP,
    LiveMarketDataCollector,
)
from backend.app.ingestion.live_calendar import (
    parse_numeric_release,
    categorize_event,
    is_higher_hawkish,
    LiveEconomicCalendarIngestor,
)
from backend.app.ingestion.live_news_manager import (
    strip_html_tags,
    classify_macro_news,
    LIVE_RSS_FEEDS,
)
from backend.app.engine.live_orchestrator import LiveOrchestrator


class TestNumericParsing:
    """Test parsing of economic numbers with suffixes."""

    def test_percentage_parsing(self):
        assert parse_numeric_release("3.2%") == 3.2
        assert parse_numeric_release("-0.5%") == -0.5

    def test_thousands_suffix(self):
        assert parse_numeric_release("160K") == 160.0
        assert parse_numeric_release("25.5k") == 25.5

    def test_millions_suffix(self):
        assert parse_numeric_release("1.5M") == 1500.0
        assert parse_numeric_release("-3.2M") == -3200.0

    def test_invalid_and_none(self):
        assert parse_numeric_release("") is None
        assert parse_numeric_release(None) is None
        assert parse_numeric_release("N/A") is None


class TestEventCategorization:
    """Test categorization and hawkish/dovish direction logic."""

    def test_inflation_detection(self):
        assert categorize_event("Core CPI MoM") == "inflation"
        assert categorize_event("PCE Price Index YoY") == "inflation"
        assert is_higher_hawkish("inflation", "Core CPI MoM") is True

    def test_labor_detection(self):
        assert categorize_event("Non-Farm Employment Change") == "labor"
        assert categorize_event("Unemployment Rate") == "labor"
        assert is_higher_hawkish("labor", "Unemployment Rate") is False
        assert is_higher_hawkish("labor", "Non-Farm Payrolls") is True

    def test_monetary_policy_detection(self):
        assert categorize_event("FOMC Rate Decision") == "monetary_policy"
        assert categorize_event("ECB Monetary Policy Statement") == "monetary_policy"

    def test_commodities_detection(self):
        assert categorize_event("EIA Crude Oil Stockpiles") == "commodities"


class TestNewsClassification:
    """Test text classification and sentiment direction."""

    def test_strip_html(self):
        html = "<p>Federal Reserve <b>holds</b> rates steady. <a href='#'>Read more</a></p>"
        cleaned = strip_html_tags(html)
        assert "<p>" not in cleaned
        assert "<b>" not in cleaned
        assert "Federal Reserve holds rates steady." in cleaned

    def test_hawkish_classification(self):
        title = "Fed prepares to hike rates as inflation accelerates"
        summary = "Hot wage growth and sticky price pressures force tightening."
        res = classify_macro_news(title, summary, "general")
        assert res["macro_category"] in ("monetary_policy", "inflation")
        assert res["direction"] == "bullish"
        assert res["impact_score"] >= 60.0

    def test_dovish_classification(self):
        title = "Central bank poised to cut interest rates amid cooling labor market"
        summary = "Job growth slowed sharply and unemployment surged."
        res = classify_macro_news(title, summary, "general")
        assert res["direction"] == "bearish"
        assert res["impact_score"] <= 40.0

    def test_forecast_statement_type(self):
        title = "Economists expect inflation to moderate next quarter"
        res = classify_macro_news(title, "", "general")
        assert res["statement_type"] == "FORECAST"


class TestLiveMarketDataMapping:
    """Test ticker mappings for cross-asset universe."""

    def test_major_assets_present(self):
        expected_symbols = ["EURUSD", "USDJPY", "GBPUSD", "SPX", "NDX", "XAUUSD", "CL", "US10Y"]
        for sym in expected_symbols:
            assert sym in YFINANCE_TICKER_MAP
            ticker = YFINANCE_TICKER_MAP[sym]
            assert REVERSE_TICKER_MAP[ticker] == sym


class TestLiveOrchestratorStatus:
    """Test orchestrator lifecycle and status reporting."""

    def test_status_structure(self):
        orch = LiveOrchestrator()
        st = orch.get_status()
        assert "is_active" in st
        assert st["is_active"] is False
        assert st["status"] == "IDLE"
        assert "cost" in st
        assert "providers_monitored" in st
        assert st["providers_monitored"] >= 5
        assert "last_price_sync" in st
        assert "total_price_updates" in st
