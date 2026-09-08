"""Time Decay Engine for Macro Events and Releases."""

import math
from datetime import datetime, timezone
from typing import Dict, Any
from backend.app.core.constants import CATEGORY_HALF_LIVES


def calculate_decay(
    initial_impact: float,
    published_at: datetime,
    category: str = "monetary_policy",
    now: datetime = None,
) -> Dict[str, Any]:
    """Calculate exponential decay of a macro event based on category half-life."""
    if now is None:
        now = datetime.now(timezone.utc)

    # Ensure UTC timezone awareness
    if published_at.tzinfo is None:
        published_at = published_at.replace(tzinfo=timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)

    delta_seconds = max(0.0, (now - published_at).total_seconds())
    delta_days = delta_seconds / 86400.0

    half_life_days = CATEGORY_HALF_LIVES.get(category, 14.0)
    decay_constant = math.log(2) / half_life_days

    decay_multiplier = math.exp(-decay_constant * delta_days)
    current_impact = round(initial_impact * decay_multiplier, 2)

    # Stale if older than 2 full half-lives or beyond 60 days
    is_stale = delta_days > (2.0 * half_life_days) or delta_days > 60.0

    return {
        "initial_impact": initial_impact,
        "current_impact": current_impact,
        "decay_multiplier": round(decay_multiplier, 4),
        "age_days": round(delta_days, 2),
        "half_life_days": half_life_days,
        "is_stale": is_stale,
    }
