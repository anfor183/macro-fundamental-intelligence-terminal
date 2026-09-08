"""Factor Scoring Engine."""

from typing import Dict, Any, List
from backend.app.core.constants import DEFAULT_WEIGHTS


def compute_weighted_macro_score(
    asset_class: str,
    factor_scores: Dict[str, float],
    custom_weights: Dict[str, float] = None,
) -> Dict[str, Any]:
    """Calculate the normalized weighted macro score (-100 to +100) from individual factor scores.
    
    Ensures weights sum to 1.0 and returns full factor contribution breakdown.
    """
    weights = custom_weights or DEFAULT_WEIGHTS.get(asset_class, DEFAULT_WEIGHTS["forex"])
    
    total_weight = sum(weights.values())
    if total_weight <= 0:
        total_weight = 1.0

    contributions = []
    total_score = 0.0

    for factor_name, weight in weights.items():
        normalized_weight = weight / total_weight
        raw_score = factor_scores.get(factor_name, 0.0)
        clamped_raw = max(-100.0, min(100.0, raw_score))
        contribution = round(clamped_raw * normalized_weight, 2)
        total_score += contribution

        status = "BULLISH" if clamped_raw >= 15.0 else ("BEARISH" if clamped_raw <= -15.0 else "NEUTRAL")
        
        contributions.append({
            "category": factor_name,
            "label": factor_name.replace("_", " ").title(),
            "raw_score": round(clamped_raw, 1),
            "weight": round(normalized_weight, 3),
            "contribution": contribution,
            "status": status,
        })

    final_score = max(-100.0, min(100.0, round(total_score, 1)))

    return {
        "final_score": final_score,
        "contributions": sorted(contributions, key=lambda x: abs(x["contribution"]), reverse=True),
        "weights_used": {k: round(v / total_weight, 3) for k, v in weights.items()}
    }
