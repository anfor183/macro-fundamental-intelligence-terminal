"""Confidence and Conflict Detection Engine."""

from typing import Dict, Any, List


def calculate_confidence_and_conflicts(
    factor_breakdown: Dict[str, Any],
    source_count: int = 4,
    avg_source_tier: float = 1.5,
    has_primary_official_source: bool = True,
    data_completeness_pct: float = 92.0,
) -> Dict[str, Any]:
    """Calculate confidence score and detect macro contradictions.
    
    Confidence depends on:
    - Data completeness (40%)
    - Average source tier and presence of primary official sources (25%)
    - Cross-factor consistency / absence of sharp conflicts (35%)
    """
    # 1. Base confidence from data completeness
    base_confidence = data_completeness_pct * 0.45

    # 2. Source reliability bonus
    source_score = 30.0 if has_primary_official_source else 15.0
    if source_count >= 5:
        source_score += 10.0
    elif source_count <= 1:
        source_score -= 10.0

    # 3. Conflict Detection
    # Look for opposing high-conviction forces:
    # Example: Hawkish Monetary Policy (+50) vs Crashing Labor (-60)
    conflicts = []
    conflict_penalty = 0.0

    scores = {k: v.get("score", 0.0) if isinstance(v, dict) else v for k, v in factor_breakdown.items()}

    monetary = scores.get("monetary_policy", 0.0)
    labor = scores.get("labor", 0.0)
    growth = scores.get("growth", 0.0)
    inflation = scores.get("inflation", 0.0)

    # Conflict 1: Central bank hawkish but labor severely deteriorating
    if monetary > 35.0 and labor < -35.0:
        conflicts.append("Central bank policy expectations remain hawkish despite sharp deterioration in labor market indicators.")
        conflict_penalty += 15.0

    # Conflict 2: Inflation surging while growth is contracting (Stagflationary headwind)
    if inflation > 40.0 and growth < -30.0:
        conflicts.append("Surging inflation forces rate pressure while real economic output contracts (stagflationary dilemma).")
        conflict_penalty += 15.0

    # Conflict 3: Yields surging but currency softening (Sovereign / fiscal risk)
    rates = scores.get("rates_yields", 0.0)
    fiscal = scores.get("fiscal", 0.0)
    if rates > 40.0 and fiscal < -35.0:
        conflicts.append("Rising bond yields driven by fiscal debt supply expansion rather than healthy economic growth.")
        conflict_penalty += 10.0

    total_confidence = base_confidence + source_score - conflict_penalty
    final_confidence = max(20.0, min(96.0, round(total_confidence, 1)))

    # Insufficient data check
    if data_completeness_pct < 40.0 or source_count == 0:
        data_status = "INSUFFICIENT_DATA"
        status_message = "Insufficient verified primary sources to establish reliable directional confidence."
    elif conflicts or final_confidence < 60.0:
        data_status = "WARNING"
        status_message = "Macro signals exhibit material internal contradictions. Reduced model confidence."
    else:
        data_status = "HEALTHY"
        status_message = "Data completeness and cross-factor consistency within institutional parameters."

    return {
        "confidence": final_confidence,
        "conflicting_factors": conflicts,
        "conflict_penalty": conflict_penalty,
        "data_status": data_status,
        "status_message": status_message,
        "data_completeness_pct": data_completeness_pct,
    }
