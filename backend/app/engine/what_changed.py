"""'What Changed Today?' Delta Analysis Engine."""

from typing import Dict, Any, Optional, List
from backend.app.core.constants import score_to_bias


def analyze_what_changed(
    previous_snapshot: Dict[str, Any],
    current_snapshot: Dict[str, Any],
    trigger_event: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Calculate the exact delta between macro snapshots and identify the catalytic drivers."""
    prev_score = previous_snapshot.get("score", 0.0)
    curr_score = current_snapshot.get("score", 0.0)
    delta_score = round(curr_score - prev_score, 1)

    prev_bias = previous_snapshot.get("tactical_bias", score_to_bias(prev_score))
    curr_bias = current_snapshot.get("tactical_bias", score_to_bias(curr_score))
    bias_flipped = prev_bias != curr_bias

    # Find factor that moved the most
    prev_factors = previous_snapshot.get("factor_breakdown", {})
    curr_factors = current_snapshot.get("factor_breakdown", {})

    factor_deltas = []
    for cat, curr_val in curr_factors.items():
        curr_cat_score = curr_val.get("score", 0.0) if isinstance(curr_val, dict) else curr_val
        prev_cat_score = prev_factors.get(cat, {}).get("score", 0.0) if isinstance(prev_factors.get(cat), dict) else prev_factors.get(cat, 0.0)
        diff = round(curr_cat_score - prev_cat_score, 1)
        factor_deltas.append({"category": cat, "delta": diff, "abs_delta": abs(diff)})

    factor_deltas.sort(key=lambda x: x["abs_delta"], reverse=True)

    # Determine primary and secondary driver
    if trigger_event:
        primary_driver = trigger_event.get("title", "Breaking economic release")
        secondary_driver = f"Repricing across {factor_deltas[0]['category'].replace('_', ' ')} (+{factor_deltas[0]['delta']:+.1f})" if factor_deltas else "Yield spread adjustment"
    elif factor_deltas and factor_deltas[0]["abs_delta"] > 0:
        top_cat = factor_deltas[0]["category"].replace("_", " ").title()
        primary_driver = f"Material shift in {top_cat} ({factor_deltas[0]['delta']:+.1f} pts)"
        sec_cat = factor_deltas[1]["category"].replace("_", " ").title() if len(factor_deltas) > 1 else "Yield differential"
        secondary_driver = f"Secondary movement in {sec_cat}"
    else:
        primary_driver = "Routine time-decay of prior macro releases"
        secondary_driver = "Subtle inter-market yield curve flattening"

    # Generate explanatory narrative
    symbol = current_snapshot.get("symbol", "Asset")
    if bias_flipped:
        narrative = (
            f"{symbol} tactical bias shifted from {prev_bias} to {curr_bias}. "
            f"Net macro score moved from {prev_score:+.1f} to {curr_score:+.1f} ({delta_score:+.1f} pts). "
            f"The primary driver was {primary_driver.lower()}. {secondary_driver}."
        )
    else:
        narrative = (
            f"{symbol} maintained its {curr_bias} stance with macro score at {curr_score:+.1f} ({delta_score:+.1f} pts change). "
            f"Underlying impulse: {primary_driver}."
        )

    return {
        "symbol": symbol,
        "previous_score": prev_score,
        "current_score": curr_score,
        "delta_score": delta_score,
        "previous_bias": prev_bias,
        "current_bias": curr_bias,
        "bias_flipped": bias_flipped,
        "primary_driver": primary_driver,
        "secondary_driver": secondary_driver,
        "narrative": narrative,
        "top_factor_deltas": factor_deltas[:3],
    }
