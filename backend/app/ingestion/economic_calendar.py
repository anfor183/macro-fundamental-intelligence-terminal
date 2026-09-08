"""Economic Calendar Ingestion and Schedule Provider."""

from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any


class EconomicCalendarProvider:
    """Provides upcoming and historical economic releases with consensus and expected volatility."""

    def get_upcoming_events(self, days_ahead: int = 7) -> List[Dict[str, Any]]:
        """Return upcoming high-impact scheduled economic releases."""
        now = datetime.now(timezone.utc)
        events = [
            {
                "id": "cal_1",
                "country": "United States",
                "currency": "USD",
                "event": "US Core CPI MoM & YoY",
                "category": "inflation",
                "event_time": now + timedelta(days=1, hours=2),
                "consensus": "0.3%",
                "previous": "0.3%",
                "importance": "Critical",
                "expected_volatility": "High",
                "affected_assets": ["EURUSD", "USDJPY", "XAUUSD", "SPX"],
                "sensitivity": "Beat > 0.3% strengthens USD, weighs on Gold/Equities; Miss < 0.2% weakens USD, boosts Gold."
            },
            {
                "id": "cal_2",
                "country": "Eurozone",
                "currency": "EUR",
                "event": "ECB Monetary Policy Decision & Press Conference",
                "category": "monetary_policy",
                "event_time": now + timedelta(days=2, hours=4),
                "consensus": "2.75% (-25bps)",
                "previous": "3.00%",
                "importance": "Critical",
                "expected_volatility": "High",
                "affected_assets": ["EURUSD", "EURGBP", "EURJPY", "DAX"],
                "sensitivity": "Hawkish guidance or 25bps cut strengthens EUR; 50bps cut or growth downgrades weakens EUR."
            },
            {
                "id": "cal_3",
                "country": "United States",
                "currency": "USD",
                "event": "US Nonfarm Payrolls & Unemployment Rate",
                "category": "labor",
                "event_time": now + timedelta(days=3, hours=5),
                "consensus": "160K / 4.1%",
                "previous": "142K / 4.2%",
                "importance": "Critical",
                "expected_volatility": "High",
                "affected_assets": ["EURUSD", "USDJPY", "XAUUSD", "SPX"],
                "sensitivity": "NFP < 120K escalates Fed easing odds; NFP > 190K delays rate cuts."
            },
            {
                "id": "cal_4",
                "country": "Japan",
                "currency": "JPY",
                "event": "Bank of Japan Interest Rate Decision",
                "category": "monetary_policy",
                "event_time": now + timedelta(days=4, hours=1),
                "consensus": "0.50% (Hold)",
                "previous": "0.50%",
                "importance": "High",
                "expected_volatility": "High",
                "affected_assets": ["USDJPY", "EURJPY", "GBPJPY", "N225"],
                "sensitivity": "Hawkish comments on future hikes strengthens JPY; Dovish delay weakens JPY."
            },
            {
                "id": "cal_5",
                "country": "United States",
                "currency": "USD",
                "event": "EIA Crude Oil Stockpiles",
                "category": "commodities",
                "event_time": now + timedelta(days=1, hours=7),
                "consensus": "-1.5M bbl",
                "previous": "-3.2M bbl",
                "importance": "Medium",
                "expected_volatility": "Medium",
                "affected_assets": ["CL", "BZ", "USDCAD"],
                "sensitivity": "Inventory draw > 2M supports WTI; Build > 2M weakens WTI."
            },
            {
                "id": "cal_6",
                "country": "United Kingdom",
                "currency": "GBP",
                "event": "UK GDP MoM & Industrial Output",
                "category": "growth",
                "event_time": now + timedelta(days=2, hours=1),
                "consensus": "0.2%",
                "previous": "0.0%",
                "importance": "High",
                "expected_volatility": "Medium",
                "affected_assets": ["GBPUSD", "EURGBP", "GBPJPY", "FTSE"],
                "sensitivity": "Positive print supports GBP and delays BoE cuts."
            },
            {
                "id": "cal_7",
                "country": "Australia",
                "currency": "AUD",
                "event": "RBA Monetary Policy Meeting Minutes",
                "category": "monetary_policy",
                "event_time": now + timedelta(days=5, hours=0),
                "consensus": "Neutral Stance",
                "previous": "4.10%",
                "importance": "Medium",
                "expected_volatility": "Medium",
                "affected_assets": ["AUDUSD", "AUDJPY", "EURAUD"],
                "sensitivity": "Focus on domestic wage inflation and Chinese demand risks."
            },
        ]
        return events
