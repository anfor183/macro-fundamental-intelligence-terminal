"""Unit tests for deterministic bias thresholds, confidence calculations, and conflict detection."""

from backend.app.core.constants import score_to_bias
from backend.app.engine.confidence_engine import calculate_confidence_and_conflicts


def test_score_to_bias_threshold_bands():
    assert score_to_bias(85.0) == "STRONG BULLISH"
    assert score_to_bias(52.0) == "BULLISH"
    assert score_to_bias(25.0) == "MILD BULLISH"
    assert score_to_bias(0.0) == "NEUTRAL"
    assert score_to_bias(-10.0) == "NEUTRAL"
    assert score_to_bias(-25.0) == "MILD BEARISH"
    assert score_to_bias(-55.0) == "BEARISH"
    assert score_to_bias(-80.0) == "STRONG BEARISH"


def test_conflict_detection_penalizes_confidence():
    """Verify that opposing high-conviction forces (Hawkish Fed vs Labor deterioration)
    penalize the model's confidence and flag a warning.
    """
    # Scenario without conflict
    healthy_factors = {
        "monetary_policy": {"score": 40.0},
        "labor": {"score": 35.0},
        "growth": {"score": 30.0},
        "inflation": {"score": 25.0},
    }
    healthy_conf = calculate_confidence_and_conflicts(healthy_factors)
    assert len(healthy_conf["conflicting_factors"]) == 0
    assert healthy_conf["data_status"] == "HEALTHY"

    # Scenario with severe conflict: Hawkish central bank (+60) vs collapsing labor (-60)
    conflicted_factors = {
        "monetary_policy": {"score": 60.0},
        "labor": {"score": -60.0},
        "growth": {"score": 10.0},
        "inflation": {"score": 30.0},
    }
    conflicted_conf = calculate_confidence_and_conflicts(conflicted_factors)
    assert len(conflicted_conf["conflicting_factors"]) > 0
    assert conflicted_conf["confidence"] < healthy_conf["confidence"]
    assert conflicted_conf["data_status"] == "WARNING"


def test_insufficient_data_produces_warning():
    """Insufficient source coverage must produce an INSUFFICIENT_DATA status."""
    res = calculate_confidence_and_conflicts(
        factor_breakdown={},
        source_count=0,
        data_completeness_pct=25.0
    )
    assert res["data_status"] == "INSUFFICIENT_DATA"
    assert "insufficient" in res["status_message"].lower()
