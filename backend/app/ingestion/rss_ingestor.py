"""Live RSS and Public Feed Ingestion Adapter."""

import logging
import re
from datetime import datetime, timezone
from typing import List, Dict, Any
import httpx
import feedparser

from backend.app.ingestion.base import BaseIngestor
from backend.app.processing.deduplicator import generate_content_hash, generate_cluster_id

logger = logging.getLogger(__name__)


def strip_html(text: str) -> str:
    """Strip HTML markup from feed descriptions."""
    if not text:
        return ""
    clean = re.compile("<.*?>")
    return re.sub(clean, "", text).strip()


class RSSFeedIngestor(BaseIngestor):
    """Ingests news and releases from public RSS feeds."""

    def __init__(self, source_name: str, feed_url: str, tier: int = 2, reliability: float = 85.0):
        super().__init__(name=f"RSS-{source_name}", timeout_seconds=8.0)
        self.source_name = source_name
        self.feed_url = feed_url
        self.tier = tier
        self.reliability = reliability

    async def fetch_latest(self) -> List[Dict[str, Any]]:
        """Fetch and parse feed entries."""
        if self.is_circuit_open():
            logger.warning(f"[{self.name}] Skipping fetch: circuit breaker open.")
            return []

        items = []
        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds, follow_redirects=True) as client:
                headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) MacroFundamentalEngine/1.0"}
                resp = await client.get(self.feed_url, headers=headers)
                resp.raise_for_status()

            parsed = feedparser.parse(resp.text)
            now = datetime.now(timezone.utc)

            for entry in parsed.entries[:10]: # Process top 10 latest entries
                title = entry.get("title", "").strip()
                summary = strip_html(entry.get("summary", entry.get("description", "")))
                url = entry.get("link", "")
                
                # Parse publication time or fallback to now
                pub_time = now
                if hasattr(entry, "published_parsed") and entry.published_parsed:
                    try:
                        pub_time = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)
                    except Exception:
                        pub_time = now

                content_hash = generate_content_hash(title, summary)
                cluster_id = generate_cluster_id(title, "macro_news", pub_time.strftime("%Y-%m-%d"))

                items.append({
                    "title": title,
                    "summary": summary[:500] if summary else title,
                    "source_name": self.source_name,
                    "source_tier": self.tier,
                    "source_reliability": self.reliability,
                    "source_url": url,
                    "published_at": pub_time,
                    "content_hash": content_hash,
                    "event_cluster_id": cluster_id,
                    "macro_category": "macro_news",
                    "statement_type": "FACT",
                    "is_simulated": False,
                })

            self.record_success()
            return items

        except Exception as exc:
            self.record_failure(exc)
            return []
