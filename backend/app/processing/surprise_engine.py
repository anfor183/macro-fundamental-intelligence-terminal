"""Expectation-vs-Actual and Surprise Engine."""

from typing import Dict, Any, Optional


def calculate_surprise(
    actual: Optional[float],
    consensus: Optional[float],
    previous: Optional[float],
    historical_std_dev: float = 0.25,
    category: str = "inflation",
    higher_is_hawkish: bool = True,
) -> Dict[str, Any]:
    """Calculate economic surprise, z-score, trend momentum, and policy implication.
    
    Distinguishes:
    - Surprise: Actual vs Consensus
    - Momentum: Actual vs Previous
    - Policy Implication: Hawkish vs Dovish vs Stagflationary
    """
    if actual is None:
        return {
            "surprise": None,
            "surprise_zscore": None,
            "momentum": None,
            "policy_implication": "Pending Release",
            "impact_score": 0.0,
            "summary": "Economic data release pending."
        }

    # If consensus is not available, compare against previous
    if consensus is None:
        consensus = previous if previous is not None else actual

    surprise = round(actual - consensus, 4)
    std_dev = max(0.01, historical_std_dev)
    z_score = round(surprise / std_dev, 2)
    momentum = round(actual - previous, 4) if previous is not None else 0.0

    # Policy implication evaluation
    if abs(z_score) < 0.3:
        policy_implication = "In-Line"
        impact_score = 0.0
        summary = f"Actual ({actual}) came in line with consensus ({consensus}). Minimal policy repricing."
    elif z_score >= 0.3:
        if higher_is_hawkish:
            policy_implication = "Hawkish Beat"
            impact_score = min(100.0, round(z_score * 30.0, 1))
            summary = f"Actual ({actual}) beat consensus ({consensus}) by +{surprise} (+{z_score}σ). Hawkish policy repricing."
        else:
            # e.g., Unemployment rate higher is dovish
            policy_implication = "Dovish Softening"
            impact_score = max(-100.0, round(-z_score * 30.0, 1))
            summary = f"Actual ({actual}) rose above consensus ({consensus}) (+{z_score}σ). Dovish policy repricing."
    else:
        if higher_is_hawkish:
            policy_implication = "Dovish Miss"
            impact_score = max(-100.0, round(z_score * 30.0, 1))
            summary = f"Actual ({actual}) missed consensus ({consensus}) by {surprise} ({z_score}σ). Dovish policy repricing."
        else:
            policy_implication = "Hawkish Tightening"
            impact_score = min(100.0, round(-z_score * 30.0, 1))
            summary = f"Actual ({actual}) dropped below consensus ({consensus}) ({z_score}σ). Hawkish policy repricing."

    # Nuance: Check if surprise conflicts with trend momentum
    # Example: Actual (3.2%) < Consensus (3.4%), but Previous was 3.0% (Inflation still rising YoY)
    is_mixed_trend = False
    if surprise < 0 and momentum > 0 and category == "inflation":
        is_mixed_trend = True
        summary += f" Note: Mixed signal — Disinflationary surprise vs forecast, but momentum remains positive vs prior month ({previous})."

    return {
        "surprise": surprise,
        "surprise_zscore": z_score,
        "momentum": momentum,
        "is_mixed_trend": is_mixed_trend,
        "policy_implication": policy_implication,
        "impact_score": impact_score, # -100 to +100
        "summary": summary
    }
