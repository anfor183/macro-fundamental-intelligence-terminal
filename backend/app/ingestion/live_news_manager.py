"""Live Macro News Ingestion Manager from Verified Free Public RSS Feeds.

Fetches real-time press releases and news wires from Central Banks (Fed, ECB, BoE)
and major financial media (Yahoo Finance, MarketWatch), applies automated deduplication,
statement classification, and macro impact scoring without requiring paid subscriptions.
"""

import logging
import re
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import httpx
import feedparser
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.intelligence import NewsEvent, NewsSource
from backend.app.processing.deduplicator import generate_content_hash, generate_cluster_id

logger = logging.getLogger(__name__)

# Verified public RSS feeds with institutional tiers
LIVE_RSS_FEEDS = [
    {
        "name": "Federal Reserve (Monetary Policy)",
        "url": "https://www.federalreserve.gov/feeds/press_monetary.xml",
        "tier": 1,
        "reliability": 98.0,
        "default_category": "monetary_policy",
    },
    {
        "name": "European Central Bank",
        "url": "https://www.ecb.europa.eu/rss/press.html",
        "tier": 1,
        "reliability": 98.0,
        "default_category": "monetary_policy",
    },
    {
        "name": "Bank of England",
        "url": "https://www.bankofengland.co.uk/rss/news",
        "tier": 1,
        "reliability": 98.0,
        "default_category": "monetary_policy",
    },
    {
        "name": "Yahoo Finance News",
        "url": "https://finance.yahoo.com/news/rssindex",
        "tier": 2,
        "reliability": 88.0,
        "default_category": "growth",
    },
    {
        "name": "MarketWatch Top Stories",
        "url": "https://feeds.content.dowjones.io/public/rss/mw_topstories",
        "tier": 2,
        "reliability": 88.0,
        "default_category": "growth",
    },
]


def strip_html_tags(text: str) -> str:
    """Clean HTML tags and formatting from RSS feed descriptions."""
    if not text:
        return ""
    clean = re.compile(r"<.*?>")
    return re.sub(clean, "", text).strip()


def classify_macro_news(title: str, summary: str, default_category: str) -> Dict[str, Any]:
    """
    Classifies a headline into macro category, sentiment direction,
    statement type, and estimated impact score.
    """
    combined = f"{title} {summary}".lower()

    # Determine category
    category = default_category
    if any(k in combined for k in ["inflation", "cpi", "pce", "price pressures", "deflation"]):
        category = "inflation"
    elif any(k in combined for k in ["rate hike", "rate cut", "fomc", "ecb", "boe", "boj", "interest rate", "quantitative"]):
        category = "monetary_policy"
    elif any(k in combined for k in ["jobless", "unemployment", "payroll", "wage growth", "labor market", "hiring"]):
        category = "labor"
    elif any(k in combined for k in ["gdp", "recession", "growth", "manufacturing", "pmi", "expansion"]):
        category = "growth"
    elif any(k in combined for k in ["yield", "treasury", "bond", "curve inversion"]):
        category = "yields"
    elif any(k in combined for k in ["oil", "crude", "energy", "opec", "gasoline", "brent"]):
        category = "commodities"
    elif any(k in combined for k in ["war", "sanctions", "conflict", "geopolitical", "tariff", "trade war"]):
        category = "geopolitics"

    # Direction (bullish / bearish / neutral)
    direction = "neutral"
    impact_score = 50.0

    hawkish_keywords = ["hike", "hawkish", "accelerat", "surge", "beat", "higher", "jump", "tighten", "hot"]
    dovish_keywords = ["cut", "dovish", "slow", "cool", "miss", "lower", "ease", "drop", "slump", "fall"]

    hawk_count = sum(1 for w in hawkish_keywords if w in combined)
    dove_count = sum(1 for w in dovish_keywords if w in combined)

    if hawk_count > dove_count:
        direction = "bullish"
        impact_score = min(90.0, 50.0 + (hawk_count * 10.0))
    elif dove_count > hawk_count:
        direction = "bearish"
        impact_score = max(20.0, 50.0 - (dove_count * 10.0))

    # Statement type
    statement_type = "FACT"
    if any(w in combined for w in ["expect", "forecast", "predict", "analyst", "project"]):
        statement_type = "FORECAST"
    elif any(w in combined for w in ["opinion", "view", "believes", "considers", "editorial"]):
        statement_type = "ANALYST OPINION"

    return {
        "macro_category": category,
        "direction": direction,
        "impact_score": impact_score,
        "statement_type": statement_type,
    }


class LiveNewsManager:
    """Ingests and processes real-time news from verified free RSS feeds."""

    @classmethod
    async def fetch_feed_items(cls, feed_config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Fetch items from a single RSS feed."""
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) MacroIntelligenceTerminal/1.0"
        }
        try:
            async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
                resp = await client.get(feed_config["url"], headers=headers)
                resp.raise_for_status()
                parsed = feedparser.parse(resp.text)

                now = datetime.now(timezone.utc)
                items = []

                for entry in parsed.entries[:15]: # Process up to 15 latest entries per feed
                    title = entry.get("title", "").strip()
                    if not title:
                        continue

                    summary = strip_html_tags(entry.get("summary", entry.get("description", "")))
                    link = entry.get("link", "")

                    pub_time = now
                    if hasattr(entry, "published_parsed") and entry.published_parsed:
                        try:
                            pub_time = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)
                        except Exception:
                            pub_time = now

                    items.append({
                        "title": title,
                        "summary": summary[:600] if summary else title,
                        "link": link,
                        "published_at": pub_time,
                        "source_name": feed_config["name"],
                        "source_tier": feed_config["tier"],
                        "source_reliability": feed_config["reliability"],
                        "default_category": feed_config["default_category"],
                    })
                return items
        except Exception as exc:
            logger.warning(f"Error fetching live RSS feed {feed_config['name']}: {exc}")
            return []

    @classmethod
    async def sync_live_news(cls, session: AsyncSession) -> Dict[str, Any]:
        """
        Fetches all live RSS feeds, deduplicates against database,
        classifies macro impact, and persists new news events.
        """
        now = datetime.now(timezone.utc)
        total_fetched = 0
        new_inserted = 0
        duplicates_skipped = 0

        # Load existing hashes to prevent duplicate writes
        result = await session.execute(select(NewsEvent.content_hash))
        existing_hashes = set(result.scalars().all())

        # Fetch all feeds concurrently in parallel
        import asyncio
        feed_results = await asyncio.gather(
            *[cls.fetch_feed_items(feed_cfg) for feed_cfg in LIVE_RSS_FEEDS],
            return_exceptions=True
        )

        for feed_items in feed_results:
            if isinstance(feed_items, Exception) or not isinstance(feed_items, list):
                continue
            total_fetched += len(feed_items)

            for item in feed_items:
                c_hash = generate_content_hash(item["title"], item["summary"])
                if c_hash in existing_hashes:
                    duplicates_skipped += 1
                    continue

                classification = classify_macro_news(
                    item["title"],
                    item["summary"],
                    item["default_category"]
                )

                cluster_id = generate_cluster_id(
                    item["title"],
                    classification["macro_category"],
                    item["published_at"].strftime("%Y-%m-%d"),
                )

                news_event = NewsEvent(
                    event_cluster_id=cluster_id,
                    content_hash=c_hash,
                    source_name=item["source_name"],
                    source_tier=item["source_tier"],
                    source_reliability=item["source_reliability"],
                    source_url=item["link"],
                    title=item["title"],
                    summary=item["summary"],
                    statement_type=classification["statement_type"],
                    published_at=item["published_at"],
                    retrieved_at=now,
                    macro_category=classification["macro_category"],
                    direction=classification["direction"],
                    impact_score=classification["impact_score"],
                    confidence=item["source_reliability"],
                    time_horizon="short-term",
                    is_duplicate=False,
                    duplicate_count=1,
                )

                session.add(news_event)
                existing_hashes.add(c_hash)
                new_inserted += 1

        await session.commit()
        logger.info(
            f"Live News Sync: {new_inserted} new events inserted, "
            f"{duplicates_skipped} duplicates filtered out of {total_fetched} total."
        )

        return {
            "status": "SUCCESS",
            "total_fetched": total_fetched,
            "new_inserted": new_inserted,
            "duplicates_filtered": duplicates_skipped,
        }
