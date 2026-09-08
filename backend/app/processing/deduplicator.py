"""Deduplication and Event Clustering Engine."""

import hashlib
import re
from typing import Tuple, Optional


def normalize_text(text: str) -> str:
    """Normalize text for consistent hashing and entity matching."""
    if not text:
        return ""
    # Lowercase, strip punctuation and excessive whitespace
    cleaned = re.sub(r"[^\w\s]", " ", text.lower())
    return " ".join(cleaned.split())


def generate_content_hash(title: str, summary: str) -> str:
    """Compute deterministic SHA-256 hash of article content."""
    normalized = f"{normalize_text(title)}|{normalize_text(summary[:200])}"
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def generate_cluster_id(title: str, category: str, date_str: str) -> str:
    """Generate semantic cluster ID to group duplicate reporting of the same event.
    
    Example: 25 articles covering 'Fed cuts rates by 25bps' on 2026-09-08
    will share the same cluster ID: 'cluster_monetary_policy_fed_rates_2026-09-08'.
    """
    norm_title = normalize_text(title)
    
    # Extract key anchor keywords
    keywords = []
    if "cpi" in norm_title or "inflation" in norm_title:
        keywords.append("cpi_inflation")
    elif "fed" in norm_title or "fomc" in norm_title or "powell" in norm_title:
        keywords.append("fed_policy")
    elif "ecb" in norm_title or "lagarde" in norm_title:
        keywords.append("ecb_policy")
    elif "boj" in norm_title or "ueda" in norm_title:
        keywords.append("boj_policy")
    elif "boe" in norm_title or "bailey" in norm_title:
        keywords.append("boe_policy")
    elif "payroll" in norm_title or "nfp" in norm_title or "jobs" in norm_title or "unemployment" in norm_title:
        keywords.append("us_labor")
    elif "opec" in norm_title or "crude" in norm_title or "oil" in norm_title:
        keywords.append("opec_energy")
    elif "gold" in norm_title or "bullion" in norm_title:
        keywords.append("gold_precious")
    elif "gdp" in norm_title or "growth" in norm_title or "pmi" in norm_title:
        keywords.append("growth_macro")
    else:
        # Fallback to first 3 words of normalized title
        words = norm_title.split()[:3]
        keywords.append("_".join(words) if words else "macro_event")

    cluster_key = f"{category}_{'_'.join(keywords)}_{date_str}"
    return f"cluster_{hashlib.md5(cluster_key.encode('utf-8')).hexdigest()[:16]}"
