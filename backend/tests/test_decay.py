"""Unit tests for exponential time decay and stale data detection."""

from datetime import datetime, timezone, timedelta
from backend.app.processing.decay_engine import calculate_decay


def test_immediate_decay_multiplier():
    now = datetime.now(timezone.utc)
    res = calculate_decay(initial_impact=80.0, published_at=now, category="monetary_policy", now=now)
    assert res["current_impact"] == 80.0
    assert res["decay_multiplier"] == 1.0
    assert not res["is_stale"]


def test_half_life_decay():
    """At t = half-life, impact should be roughly half."""
    now = datetime.now(timezone.utc)
    # Monetary policy half life is 21 days
    published_at = now - timedelta(days=21)
    res = calculate_decay(initial_impact=100.0, published_at=published_at, category="monetary_policy", now=now)
    assert 48.0 <= res["current_impact"] <= 52.0
    assert not res["is_stale"]


def test_stale_detection():
    """Events older than 2x half-life are flagged as stale."""
    now = datetime.now(timezone.utc)
    published_at = now - timedelta(days=45) # > 2 * 21 days
    res = calculate_decay(initial_impact=80.0, published_at=published_at, category="monetary_policy", now=now)
    assert res["is_stale"] is True
