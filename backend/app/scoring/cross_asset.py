"""Cross-Asset Transmission and Inter-Market Macro Analysis Engine."""

from typing import Dict, Any


def evaluate_gold_macro_drivers(
    usd_score: float,
    us_real_yield_bps: float = 182.0, # e.g. 1.82%
    fed_easing_probability: float = 75.0, # %
    geopolitical_risk_score: float = 65.0,
    central_bank_buying_pace: float = 70.0,
) -> Dict[str, Any]:
    """Calculate specialized gold fundamental drivers."""
    # Real yields have primary negative impact on gold
    real_yield_impact = -min(100.0, max(-100.0, (us_real_yield_bps - 150.0) * 1.2))
    # USD has negative impact
    usd_impact = -usd_score * 0.9
    # Fed easing has positive impact
    fed_impact = (fed_easing_probability - 50.0) * 1.5

    gold_score = (
        (real_yield_impact * 0.30) +
        (usd_impact * 0.25) +
        (fed_impact * 0.20) +
        (geopolitical_risk_score * 0.15) +
        (central_bank_buying_pace * 0.10)
    )
    gold_score = max(-100.0, min(100.0, round(gold_score, 1)))

    return {
        "gold_macro_score": gold_score,
        "real_yield_pressure": round(real_yield_impact, 1),
        "usd_pressure": round(usd_impact, 1),
        "fed_expectations": round(fed_impact, 1),
        "geopolitical_demand": round(geopolitical_risk_score, 1),
        "central_bank_demand": round(central_bank_buying_pace, 1),
        "primary_driver": "Declining real yields and sustained central bank reserve accumulation" if gold_score > 30 else "Yield headwinds",
    }


def evaluate_oil_macro_drivers(
    opec_quota_discipline: float = 60.0,
    us_inventory_draw_mbbl: float = -3.2,
    china_manufacturing_pmi: float = 49.5,
    global_growth_score: float = 45.0,
    geopolitical_supply_risk: float = 55.0,
) -> Dict[str, Any]:
    """Calculate specialized crude oil fundamental drivers."""
    # Inventory draw is positive for price
    inventory_impact = -us_inventory_draw_mbbl * 8.0
    # China demand proxy
    china_impact = (china_manufacturing_pmi - 50.0) * 10.0

    oil_score = (
        (opec_quota_discipline * 0.25) +
        (china_impact * 0.25) +
        (inventory_impact * 0.20) +
        (geopolitical_supply_risk * 0.15) +
        (global_growth_score * 0.15)
    )
    oil_score = max(-100.0, min(100.0, round(oil_score, 1)))

    return {
        "oil_macro_score": oil_score,
        "opec_discipline": round(opec_quota_discipline, 1),
        "china_demand_drag": round(china_impact, 1),
        "inventory_draw_support": round(inventory_impact, 1),
        "geopolitical_risk": round(geopolitical_supply_risk, 1),
        "global_growth": round(global_growth_score, 1),
        "primary_driver": "Subdued Chinese industrial activity counterbalanced by OPEC+ supply restraint" if abs(oil_score) < 30 else ("Physical supply squeeze" if oil_score > 30 else "Surplus supply overhang"),
    }
