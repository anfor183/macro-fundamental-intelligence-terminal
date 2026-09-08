"""Unit tests for the Expectation-vs-Actual and Surprise Engine."""

import pytest
from backend.app.processing.surprise_engine import calculate_surprise


def test_upside_cpi_surprise():
    """Test upside inflation surprise produces hawkish policy implication and positive score."""
    res = calculate_surprise(
        actual=3.4,
        consensus=3.1,
        previous=3.0,
        historical_std_dev=0.2,
        category="inflation",
        higher_is_hawkish=True,
    )
    assert res["surprise"] == 0.3
    assert res["surprise_zscore"] == 1.5
    assert res["policy_implication"] == "Hawkish Beat"
    assert res["impact_score"] > 0.0
    assert not res["is_mixed_trend"]


def test_downside_cpi_surprise():
    """Test downside inflation surprise produces dovish policy implication and negative score."""
    res = calculate_surprise(
        actual=2.7,
        consensus=3.0,
        previous=3.2,
        historical_std_dev=0.25,
        category="inflation",
        higher_is_hawkish=True,
    )
    assert res["surprise"] == -0.3
    assert res["surprise_zscore"] == -1.2
    assert res["policy_implication"] == "Dovish Miss"
    assert res["impact_score"] < 0.0


def test_mixed_trend_detection():
    """Test mixed signal where actual < consensus (dovish surprise) but actual > previous (rising trend)."""
    res = calculate_surprise(
        actual=3.2,
        consensus=3.4,
        previous=3.0, # Inflation still rising vs last month
        historical_std_dev=0.2,
        category="inflation",
        higher_is_hawkish=True,
    )
    assert res["surprise"] == -0.2
    assert res["momentum"] == 0.2
    assert res["is_mixed_trend"] is True
    assert "mixed" in res["summary"].lower()


def test_in_line_release():
    """Test in-line release within 0.3 sigma results in neutral impact."""
    res = calculate_surprise(
        actual=2.51,
        consensus=2.50,
        previous=2.50,
        historical_std_dev=0.2,
    )
    assert abs(res["surprise_zscore"]) < 0.3
    assert res["policy_implication"] == "In-Line"
    assert res["impact_score"] == 0.0
