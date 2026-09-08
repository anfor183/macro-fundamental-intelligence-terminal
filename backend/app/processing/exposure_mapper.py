"""Asset Exposure and Transmission Engine."""

from typing import List, Dict, Any


def map_event_to_assets(
    category: str,
    primary_currency: str,
    direction: str = "bullish", # "bullish", "bearish", "neutral"
    impact_score: float = 50.0,
) -> Dict[str, Any]:
    """Determine which currencies and trading assets are affected by a macro event,
    and compute transmission sensitivity factors.
    """
    sign = 1.0 if direction.lower() == "bullish" else (-1.0 if direction.lower() == "bearish" else 0.0)
    base_impact = sign * impact_score

    affected_currencies = [primary_currency]
    affected_assets: List[Dict[str, Any]] = []

    # Currency transmission
    if primary_currency == "USD":
        # USD strength/weakness transmits directly to majors
        affected_assets.append({"symbol": "EURUSD", "impact": -base_impact * 0.9, "reason": "USD valuation transmission"})
        affected_assets.append({"symbol": "GBPUSD", "impact": -base_impact * 0.85, "reason": "USD valuation transmission"})
        affected_assets.append({"symbol": "USDJPY", "impact": base_impact * 0.9, "reason": "USD/Yield differential transmission"})
        affected_assets.append({"symbol": "USDCHF", "impact": base_impact * 0.8, "reason": "USD valuation transmission"})
        affected_assets.append({"symbol": "USDCAD", "impact": base_impact * 0.75, "reason": "USD valuation transmission"})
        affected_assets.append({"symbol": "AUDUSD", "impact": -base_impact * 0.8, "reason": "Risk & USD transmission"})
        # Precious metals: Gold has strong inverse transmission to USD and yields
        affected_assets.append({"symbol": "XAUUSD", "impact": -base_impact * 0.85, "reason": "USD & real rate inverse sensitivity"})
        affected_assets.append({"symbol": "XAGUSD", "impact": -base_impact * 0.80, "reason": "USD inverse sensitivity"})
        # Equities
        if category in ("inflation", "monetary_policy"):
            # Higher USD/yields often weighs on equities
            affected_assets.append({"symbol": "SPX", "impact": -base_impact * 0.6, "reason": "Discount rate & liquidity transmission"})
            affected_assets.append({"symbol": "NDX", "impact": -base_impact * 0.7, "reason": "Tech valuation discount rate transmission"})

    elif primary_currency == "EUR":
        affected_assets.append({"symbol": "EURUSD", "impact": base_impact * 0.9, "reason": "EUR fundamental score direct transmission"})
        affected_assets.append({"symbol": "EURGBP", "impact": base_impact * 0.8, "reason": "EUR/GBP relative strength"})
        affected_assets.append({"symbol": "EURJPY", "impact": base_impact * 0.85, "reason": "EUR/JPY relative strength"})
        affected_assets.append({"symbol": "DAX", "impact": base_impact * 0.5 if category == "growth" else -base_impact * 0.4, "reason": "Eurozone growth/rates transmission"})

    elif primary_currency == "JPY":
        affected_assets.append({"symbol": "USDJPY", "impact": -base_impact * 0.9, "reason": "JPY strength strengthens quote currency"})
        affected_assets.append({"symbol": "EURJPY", "impact": -base_impact * 0.85, "reason": "JPY quote currency transmission"})
        affected_assets.append({"symbol": "GBPJPY", "impact": -base_impact * 0.85, "reason": "JPY quote currency transmission"})
        affected_assets.append({"symbol": "AUDJPY", "impact": -base_impact * 0.8, "reason": "Carry trade unwind transmission"})
        affected_assets.append({"symbol": "N225", "impact": -base_impact * 0.6, "reason": "Exporters currency headwind transmission"})

    elif primary_currency == "GBP":
        affected_assets.append({"symbol": "GBPUSD", "impact": base_impact * 0.9, "reason": "GBP fundamental score direct transmission"})
        affected_assets.append({"symbol": "EURGBP", "impact": -base_impact * 0.8, "reason": "GBP quote currency transmission"})
        affected_assets.append({"symbol": "GBPJPY", "impact": base_impact * 0.85, "reason": "GBP base currency transmission"})
        affected_assets.append({"symbol": "FTSE", "impact": base_impact * 0.4 if category == "growth" else -base_impact * 0.3, "reason": "UK macro transmission"})

    elif primary_currency == "CAD":
        affected_assets.append({"symbol": "USDCAD", "impact": -base_impact * 0.85, "reason": "CAD quote currency transmission"})
        affected_assets.append({"symbol": "CADJPY", "impact": base_impact * 0.8, "reason": "CAD base currency transmission"})

    elif primary_currency == "AUD":
        affected_assets.append({"symbol": "AUDUSD", "impact": base_impact * 0.85, "reason": "AUD base currency transmission"})
        affected_assets.append({"symbol": "AUDJPY", "impact": base_impact * 0.8, "reason": "AUD base currency transmission"})
        affected_assets.append({"symbol": "EURAUD", "impact": -base_impact * 0.75, "reason": "AUD quote currency transmission"})

    # Commodity specific transmission
    if category == "commodities":
        affected_assets.append({"symbol": "CL", "impact": base_impact, "reason": "Crude physical supply/demand direct driver"})
        affected_assets.append({"symbol": "BZ", "impact": base_impact * 0.95, "reason": "Brent benchmark transmission"})
        affected_assets.append({"symbol": "USDCAD", "impact": -base_impact * 0.6, "reason": "Petro-currency CAD terms of trade"})

    return {
        "primary_currency": primary_currency,
        "affected_currencies": affected_currencies,
        "affected_assets": affected_assets
    }
