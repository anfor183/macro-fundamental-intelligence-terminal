"""Live Economic Calendar Ingestion and Real-Time Surprise Engine.

Fetches free public economic releases from ForexFactory's weekly calendar feed,
parses forecasts and actuals, runs surprise z-score analysis, and maps exposures
to global currencies and assets without requiring paid subscriptions.
"""

import logging
import re
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.entities import EconomicIndicator, EconomicRelease
from backend.app.processing.surprise_engine import calculate_surprise
from backend.app.processing.exposure_mapper import map_event_to_assets

logger = logging.getLogger(__name__)

FOREX_FACTORY_CALENDAR_URL = "https://nfs.faireconomy.media/ff_calendar_thisweek.json"


def parse_numeric_release(val_str: Optional[str]) -> Optional[float]:
    """Parse economic release values containing %, K, M, B suffixes into floats."""
    if not val_str or not isinstance(val_str, str):
        return None

    cleaned = val_str.strip().replace(",", "").replace("%", "")
    multiplier = 1.0

    if cleaned.endswith("K") or cleaned.endswith("k"):
        multiplier = 1.0
        cleaned = cleaned[:-1]
    elif cleaned.endswith("M") or cleaned.endswith("m"):
        multiplier = 1000.0
        cleaned = cleaned[:-1]
    elif cleaned.endswith("B") or cleaned.endswith("b"):
        multiplier = 1000000.0
        cleaned = cleaned[:-1]

    try:
        return float(cleaned) * multiplier
    except (ValueError, TypeError):
        return None


def categorize_event(title: str) -> str:
    """Categorize economic release by event title."""
    t = title.lower()
    if any(w in t for w in ["cpi", "pce", "ppi", "inflation", "price index"]):
        return "inflation"
    elif any(w in t for w in ["employment", "payrolls", "unemployment", "job", "labor", "adp"]):
        return "labor"
    elif any(w in t for w in ["rate decision", "fomc", "ecb", "boe", "boj", "cash rate", "monetary policy"]):
        return "monetary_policy"
    elif any(w in t for w in ["gdp", "growth", "manufacturing", "pmi", "industrial production", "retail sales"]):
        return "growth"
    elif any(w in t for w in ["crude", "oil", "petroleum", "gas", "eia"]):
        return "commodities"
    elif any(w in t for w in ["trade balance", "current account", "exports", "imports"]):
        return "trade"
    return "general"


def is_higher_hawkish(category: str, title: str) -> bool:
    """Determine if a higher reading is hawkish (positive for currency) or dovish."""
    t = title.lower()
    if "unemployment rate" in t or "jobless claims" in t:
        return False
    return True


class LiveEconomicCalendarIngestor:
    """Ingests live economic calendar from free online endpoints and generates surprise metrics."""

    _calendar_cache: List[Dict[str, Any]] = []
    _cache_timestamp: Optional[datetime] = None
    CACHE_TTL_SECONDS: int = 900  # 15 minutes

    @classmethod
    async def fetch_calendar_data(cls) -> List[Dict[str, Any]]:
        """Fetch weekly calendar from ForexFactory public JSON endpoint with TTL caching and fallback."""
        now = datetime.now(timezone.utc)
        if cls._calendar_cache and cls._cache_timestamp:
            elapsed = (now - cls._cache_timestamp).total_seconds()
            if elapsed < cls.CACHE_TTL_SECONDS:
                logger.debug(f"Returning {len(cls._calendar_cache)} cached calendar events ({int(elapsed)}s old).")
                return cls._calendar_cache

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        try:
            async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
                resp = await client.get(FOREX_FACTORY_CALENDAR_URL, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    if isinstance(data, list) and data:
                        cls._calendar_cache = data
                        cls._cache_timestamp = now
                        logger.info(f"Refreshed live calendar: {len(data)} events cached.")
                        return data
                elif resp.status_code == 429:
                    logger.warning("ForexFactory 429 rate limit hit, using cached/fallback calendar.")
        except Exception as exc:
            logger.warning(f"Failed to fetch live ForexFactory calendar: {exc}")

        # If we have cached events, use them
        if cls._calendar_cache:
            return cls._calendar_cache

        # Fallback to default high-impact schedule if initial request was rate-limited
        from backend.app.ingestion.economic_calendar import EconomicCalendarProvider
        provider = EconomicCalendarProvider()
        fallback_events = provider.get_upcoming_events(days_ahead=7)
        converted = []
        for ev in fallback_events:
            converted.append({
                "title": ev["event"],
                "country": ev["currency"],
                "date": ev["event_time"].isoformat(),
                "impact": ev["importance"],
                "forecast": ev.get("consensus", ""),
                "previous": ev.get("previous", ""),
                "actual": None,
            })
        cls._calendar_cache = converted
        cls._cache_timestamp = now
        return converted

    @classmethod
    async def sync_calendar_releases(cls, session: AsyncSession) -> Dict[str, Any]:
        """
        Fetches live calendar releases, matches indicators, calculates surprise z-scores
        for completed prints, and updates database records.
        """
        raw_events = await cls.fetch_calendar_data()
        if not raw_events:
            return {"status": "EMPTY_OR_FAILED", "synced_count": 0, "surprises_calculated": 0}

        now = datetime.now(timezone.utc)
        synced_count = 0
        surprises_calculated = 0
        processed_exposures = []

        # Load existing indicators from DB
        result = await session.execute(select(EconomicIndicator))
        indicators = {ind.code: ind for ind in result.scalars().all()}

        for item in raw_events:
            title = item.get("title", "").strip()
            country_currency = item.get("country", "").strip().upper() # e.g. USD, EUR, GBP
            date_str = item.get("date", "")
            impact = item.get("impact", "Medium")
            actual_str = item.get("actual")
            forecast_str = item.get("forecast")
            previous_str = item.get("previous")

            if not title or not country_currency:
                continue

            # Parse event time
            event_time = now
            if date_str:
                try:
                    event_time = datetime.fromisoformat(date_str)
                    if event_time.tzinfo is None:
                        event_time = event_time.replace(tzinfo=timezone.utc)
                except Exception:
                    event_time = now

            category = categorize_event(title)
            actual = parse_numeric_release(actual_str)
            forecast = parse_numeric_release(forecast_str)
            previous = parse_numeric_release(previous_str)

            # Generate standard code
            code_clean = re.sub(r"[^A-Za-z0-9]+", "_", f"{country_currency}_{title[:24]}").upper()

            # Ensure Indicator exists in DB or create it
            indicator = indicators.get(code_clean)
            if not indicator:
                indicator = EconomicIndicator(
                    code=code_clean,
                    name=title,
                    country=country_currency,
                    currency=country_currency,
                    category=category,
                    importance=impact if impact in ["Critical", "High", "Medium", "Low"] else "Medium",
                    unit="%",
                    historical_std_dev=0.25,
                )
                session.add(indicator)
                await session.flush()
                indicators[code_clean] = indicator

            # Check if release already stored for this event_time
            rel_query = await session.execute(
                select(EconomicRelease).where(
                    EconomicRelease.indicator_id == indicator.id,
                    EconomicRelease.event_time == event_time
                ).limit(1)
            )
            existing_release = rel_query.scalars().first()

            # Calculate surprise if actual printed
            surprise_metrics = None
            if actual is not None:
                higher_hawkish = is_higher_hawkish(category, title)
                surprise_metrics = calculate_surprise(
                    actual=actual,
                    consensus=forecast,
                    previous=previous,
                    historical_std_dev=indicator.historical_std_dev,
                    category=category,
                    higher_is_hawkish=higher_hawkish,
                )
                surprises_calculated += 1

                # Map exposure
                if surprise_metrics and surprise_metrics.get("impact_score"):
                    imp = surprise_metrics["impact_score"]
                    exposure = map_event_to_assets(
                        category=category,
                        primary_currency=country_currency,
                        direction="bullish" if imp >= 0 else "bearish",
                        impact_score=abs(imp),
                    )
                    processed_exposures.append(exposure)

            if existing_release:
                # Update existing
                existing_release.actual = actual
                existing_release.consensus = forecast
                existing_release.previous = previous
                if surprise_metrics:
                    existing_release.surprise = surprise_metrics.get("surprise")
                    existing_release.surprise_zscore = surprise_metrics.get("surprise_zscore")
                    existing_release.policy_implication = surprise_metrics.get("policy_implication")
            else:
                # Insert new release record
                new_release = EconomicRelease(
                    indicator_id=indicator.id,
                    event_time=event_time,
                    period=event_time.strftime("%b %Y"),
                    actual=actual,
                    consensus=forecast,
                    previous=previous,
                    surprise=surprise_metrics.get("surprise") if surprise_metrics else None,
                    surprise_zscore=surprise_metrics.get("surprise_zscore") if surprise_metrics else None,
                    policy_implication=surprise_metrics.get("policy_implication") if surprise_metrics else None,
                )
                session.add(new_release)

            synced_count += 1

        await session.commit()
        logger.info(
            f"Synced {synced_count} economic calendar releases "
            f"({surprises_calculated} printed with actuals) from ForexFactory."
        )

        return {
            "status": "SUCCESS",
            "synced_count": synced_count,
            "surprises_calculated": surprises_calculated,
            "exposures_generated": len(processed_exposures),
        }

    @classmethod
    async def get_upcoming_calendar_events(cls) -> List[Dict[str, Any]]:
        """Return live upcoming economic releases parsed from the real live ForexFactory feed."""
        raw_events = await cls.fetch_calendar_data()
        country_names = {
            "USD": "United States",
            "EUR": "Eurozone",
            "GBP": "United Kingdom",
            "JPY": "Japan",
            "AUD": "Australia",
            "CAD": "Canada",
            "CHF": "Switzerland",
            "NZD": "New Zealand",
            "CNY": "China",
        }
        currency_assets = {
            "USD": ["EURUSD", "USDJPY", "GBPUSD", "SPX", "XAUUSD"],
            "EUR": ["EURUSD", "EURGBP", "EURJPY"],
            "GBP": ["GBPUSD", "EURGBP", "GBPJPY"],
            "JPY": ["USDJPY", "EURJPY", "GBPJPY"],
            "AUD": ["AUDUSD", "AUDJPY"],
            "CAD": ["USDCAD", "CADJPY"],
            "CHF": ["USDCHF", "EURCHF"],
            "NZD": ["NZDUSD", "AUDNZD"],
        }
        events = []
        for idx, item in enumerate(raw_events):
            cc = item.get("country", "").strip().upper()
            title = item.get("title", "").strip()
            impact = item.get("impact", "Medium")
            if impact not in ["High", "Medium", "Low", "Critical"]:
                impact = "Medium"
            category = categorize_event(title)
            assets = currency_assets.get(cc, ["EURUSD", "USDJPY"])

            if category == "inflation":
                sens = f"Higher {cc} print reinforces rate hawkishness; miss accelerates easing."
            elif category == "labor":
                sens = f"Strong employment prints support {cc} yields; contraction weakens currency."
            elif category == "monetary_policy":
                sens = f"Central bank guidance and rate decision drive immediate cross-market repricing."
            else:
                sens = f"Economic print influences {cc} growth and relative monetary momentum."

            events.append({
                "id": f"ff_{idx}_{cc}",
                "country": country_names.get(cc, cc),
                "currency": cc,
                "event": title,
                "category": category,
                "event_time": item.get("date", datetime.now(timezone.utc).isoformat()),
                "consensus": item.get("forecast") or "N/A",
                "previous": item.get("previous") or "N/A",
                "importance": impact,
                "expected_volatility": "High" if impact == "High" else "Medium" if impact == "Medium" else "Low",
                "affected_assets": assets,
                "sensitivity": sens,
            })
        return events

