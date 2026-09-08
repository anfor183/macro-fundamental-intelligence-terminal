"""Synthetic Macro Scenario Simulator for Testing, Demos, and Validation.

All data produced by this module is explicitly marked with `is_simulated = True`
and watermarked `[DEMO / SIMULATION]`.
"""

from datetime import datetime, timezone
from typing import Dict, Any, List


class ScenarioSimulator:
    """Provides structured synthetic macro events to test pipeline reaction and bias flips."""

    @staticmethod
    def get_available_scenarios() -> List[Dict[str, str]]:
        return [
            {
                "id": "cpi_downside_surprise",
                "name": "US CPI Downside Surprise (Disinflationary)",
                "description": "US Headline CPI drops to 2.6% vs 3.0% consensus. Massive Fed easing repricing, USD sells off, Gold & EURUSD surge."
            },
            {
                "id": "cpi_upside_surprise",
                "name": "US CPI Upside Spike (Sticky Inflation)",
                "description": "US Core CPI surges to 0.5% MoM vs 0.2% consensus. Fed pause expected, yields spike, USD rallies, Gold drops."
            },
            {
                "id": "nfp_employment_shock",
                "name": "US Labor Deterioration Shock",
                "description": "Nonfarm payrolls print +35K vs +160K expected, unemployment jumps to 4.5%. Soft landing questioned, yields collapse."
            },
            {
                "id": "boj_hawkish_hike",
                "name": "Bank of Japan Surprise Rate Hike (+50bps)",
                "description": "BoJ raises uncollateralized call rate by 50bps, signaling end of easy money. JPY skyrockets, USDJPY plummets."
            },
            {
                "id": "oil_supply_shock",
                "name": "Middle East Transit Supply Disruption",
                "description": "Critical tanker corridor halted. Crude oil spikes +8.5%, stagflationary concerns emerge in energy-importing regions."
            },
            {
                "id": "global_risk_off",
                "name": "Global Geopolitical Risk-Off Escalation",
                "description": "Geopolitical military escalation sparks broad flight to safety. Equities sell off, Gold, CHF, and US Treasuries surge."
            }
        ]

    @staticmethod
    def build_scenario_event(scenario_id: str) -> Dict[str, Any]:
        """Build structured synthetic event payload."""
        now = datetime.now(timezone.utc)

        if scenario_id == "cpi_downside_surprise":
            return {
                "title": "[DEMO / SIMULATION] US Headline CPI Cools Sharply to 2.6% YoY vs 3.0% Consensus",
                "summary": "Bureau of Labor Statistics simulated release shows US Headline CPI slowed to 2.6% YoY, well below expectations of 3.0%. Core CPI printed 0.15% MoM. Swap markets immediately price in 75bps of Fed rate cuts for the upcoming two meetings.",
                "category": "inflation",
                "currency": "USD",
                "actual": 2.6,
                "consensus": 3.0,
                "previous": 3.2,
                "importance": "Critical",
                "direction": "bearish", # Bearish for USD
                "impact_score": 85.0,
                "source_name": "U.S. Bureau of Labor Statistics [SIMULATED]",
                "source_tier": 1,
                "source_url": "https://www.bls.gov/simulated/cpi",
                "is_simulated": True,
                "published_at": now,
            }

        elif scenario_id == "cpi_upside_surprise":
            return {
                "title": "[DEMO / SIMULATION] US Core CPI Re-accelerates to 0.48% MoM vs 0.20% Forecast",
                "summary": "Simulated BLS inflation data reveals acute reacceleration in shelter and transportation services costs. Core inflation climbs to 3.8% YoY. 2-year Treasury yields surge 22bps as traders eliminate near-term Fed rate cut odds.",
                "category": "inflation",
                "currency": "USD",
                "actual": 0.48,
                "consensus": 0.20,
                "previous": 0.22,
                "importance": "Critical",
                "direction": "bullish", # Bullish for USD
                "impact_score": 90.0,
                "source_name": "U.S. Bureau of Labor Statistics [SIMULATED]",
                "source_tier": 1,
                "source_url": "https://www.bls.gov/simulated/cpi_beat",
                "is_simulated": True,
                "published_at": now,
            }

        elif scenario_id == "nfp_employment_shock":
            return {
                "title": "[DEMO / SIMULATION] US Nonfarm Payrolls Miss Drastically at +35K vs +160K Expected",
                "summary": "Simulated employment report indicates broad cooling across manufacturing and temporary help services. Unemployment rate ticks up to 4.5%. Markets aggressively price in emergency 50bps Fed cut.",
                "category": "labor",
                "currency": "USD",
                "actual": 35.0,
                "consensus": 160.0,
                "previous": 142.0,
                "importance": "Critical",
                "direction": "bearish",
                "impact_score": 95.0,
                "source_name": "U.S. Bureau of Labor Statistics [SIMULATED]",
                "source_tier": 1,
                "source_url": "https://www.bls.gov/simulated/nfp_miss",
                "is_simulated": True,
                "published_at": now,
            }

        elif scenario_id == "boj_hawkish_hike":
            return {
                "title": "[DEMO / SIMULATION] Bank of Japan Delivers Surprise 50bps Rate Hike to 1.00%",
                "summary": "In an unscheduled aggressive move, Governor Kazuo Ueda announces a 50bps rate increase, citing persistent real wage growth and broadening service price gains. Global carry trades experience swift liquidation.",
                "category": "monetary_policy",
                "currency": "JPY",
                "actual": 1.00,
                "consensus": 0.50,
                "previous": 0.50,
                "importance": "Critical",
                "direction": "bullish", # Bullish for JPY
                "impact_score": 98.0,
                "source_name": "Bank of Japan [SIMULATED]",
                "source_tier": 1,
                "source_url": "https://www.boj.or.jp/simulated/press",
                "is_simulated": True,
                "published_at": now,
            }

        elif scenario_id == "oil_supply_shock":
            return {
                "title": "[DEMO / SIMULATION] Critical Middle East Maritime Route Disrupted: WTI Spikes +8.5%",
                "summary": "Reports confirm temporary halt of commercial crude tanker transit through key maritime chokepoint following security incidents. Brent crude jumps above $84/bbl, driving energy inflation expectations higher globally.",
                "category": "commodities",
                "currency": "USD",
                "actual": 84.50,
                "consensus": 75.0,
                "previous": 75.6,
                "importance": "High",
                "direction": "bullish", # Bullish for Oil & CAD
                "impact_score": 88.0,
                "source_name": "Energy Intelligence Agency [SIMULATED]",
                "source_tier": 2,
                "source_url": "https://www.eia.gov/simulated/oil_shock",
                "is_simulated": True,
                "published_at": now,
            }

        elif scenario_id == "global_risk_off":
            return {
                "title": "[DEMO / SIMULATION] Broad Risk-Off Shock: Flight to Safe Havens and Gold",
                "summary": "Heightened geopolitical friction triggers widespread liquidation in risk-sensitive assets. Equity index futures down 2.8%, Gold gains +$65/oz, Swiss Franc and US Treasuries see heavy safe-haven bids.",
                "category": "geopolitics",
                "currency": "USD",
                "actual": 100.0,
                "consensus": 0.0,
                "previous": 0.0,
                "importance": "High",
                "direction": "bullish",
                "impact_score": 85.0,
                "source_name": "Global Intelligence Wire [SIMULATED]",
                "source_tier": 2,
                "source_url": "https://www.reuters.com/simulated/risk_off",
                "is_simulated": True,
                "published_at": now,
            }

        raise ValueError(f"Unknown scenario ID: {scenario_id}")
