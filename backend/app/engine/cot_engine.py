"""CFTC Commitments of Traders (COT) Positioning & Market Crowding Engine.

Ingests and analyzes weekly CFTC reports across financial and commodity futures:
- Non-Commercial Speculators (Hedge Funds, CTAs, Asset Managers)
- Commercial Hedgers (Producers, Merchants, Institutional Hedgers)
- Open Interest (OI)

Computes quantitative metrics:
1. Net Speculative Position = NonComm_Long - NonComm_Short
2. Speculative Net % of Open Interest
3. 3-Year Rolling Z-Score: Z = (Net_t - mean_3Y) / std_3Y
4. Crowding Index (0 to 100):
   - 0-20: Extreme Short Crowding (High risk of Short Squeeze Rally)
   - 20-40: Moderately Bearish Positioning (Healthy downside fuel)
   - 40-60: Neutral / Balanced
   - 60-80: Moderately Bullish Positioning (Healthy upside fuel)
   - 80-100: Extreme Long Crowding (High risk of Long Liquidation Dump)
5. Positioning Momentum: 4-week net change (Accumulation vs Distribution)
"""

from dataclasses import dataclass
from typing import Dict, Any, List, Optional
import math


@dataclass
class COTPositionSnapshot:
    """Quantitative positioning record for a specific asset at a point in time."""
    symbol: str
    asset_name: str
    cftc_contract_code: str
    report_date: str
    non_commercial_long: int
    non_commercial_short: int
    commercial_long: int
    commercial_short: int
    total_open_interest: int
    net_speculative: int
    net_commercial: int
    spec_net_pct_oi: float
    cot_zscore_3y: float
    crowding_index: float  # 0 to 100
    positioning_trend_4w: int  # 4-week change in net speculative
    sentiment_label: str  # EXTREME_SHORT, BEARISH, NEUTRAL, BULLISH, EXTREME_LONG
    squeeze_warning: Optional[str] = None


# CFTC Contract mapping for all major global trading instruments
CFTC_CONTRACT_MAP = {
    # Forex Majors
    "EURUSD": {"code": "099741", "name": "Euro FX Futures", "base": "EUR"},
    "USDJPY": {"code": "097741", "name": "Japanese Yen Futures", "base": "JPY", "inverted": True},
    "GBPUSD": {"code": "096742", "name": "British Pound Futures", "base": "GBP"},
    "AUDUSD": {"code": "232741", "name": "Australian Dollar Futures", "base": "AUD"},
    "USDCAD": {"code": "090741", "name": "Canadian Dollar Futures", "base": "CAD", "inverted": True},
    "USDCHF": {"code": "092741", "name": "Swiss Franc Futures", "base": "CHF", "inverted": True},
    "NZDUSD": {"code": "112741", "name": "New Zealand Dollar Futures", "base": "NZD"},

    # Forex Crosses (Synthesized from CFTC Leg Contracts)
    "EURGBP": {"code": "SYN_EUR_GBP", "name": "EUR/GBP Synthetic Cross COT", "base": "EUR", "quote": "GBP"},
    "EURJPY": {"code": "SYN_EUR_JPY", "name": "EUR/JPY Synthetic Cross COT", "base": "EUR", "quote": "JPY"},
    "GBPJPY": {"code": "SYN_GBP_JPY", "name": "GBP/JPY Synthetic Cross COT", "base": "GBP", "quote": "JPY"},
    "AUDJPY": {"code": "SYN_AUD_JPY", "name": "AUD/JPY Synthetic Cross COT", "base": "AUD", "quote": "JPY"},
    "CADJPY": {"code": "SYN_CAD_JPY", "name": "CAD/JPY Synthetic Cross COT", "base": "CAD", "quote": "JPY"},
    "NZDJPY": {"code": "SYN_NZD_JPY", "name": "NZD/JPY Synthetic Cross COT", "base": "NZD", "quote": "JPY"},
    "CHFJPY": {"code": "SYN_CHF_JPY", "name": "CHF/JPY Synthetic Cross COT", "base": "CHF", "quote": "JPY"},
    "EURCHF": {"code": "SYN_EUR_CHF", "name": "EUR/CHF Synthetic Cross COT", "base": "EUR", "quote": "CHF"},
    "GBPCHF": {"code": "SYN_GBP_CHF", "name": "GBP/CHF Synthetic Cross COT", "base": "GBP", "quote": "CHF"},
    "AUDNZD": {"code": "SYN_AUD_NZD", "name": "AUD/NZD Synthetic Cross COT", "base": "AUD", "quote": "NZD"},
    "AUDCAD": {"code": "SYN_AUD_CAD", "name": "AUD/CAD Synthetic Cross COT", "base": "AUD", "quote": "CAD"},
    "AUDCHF": {"code": "SYN_AUD_CHF", "name": "AUD/CHF Synthetic Cross COT", "base": "AUD", "quote": "CHF"},
    "NZDCAD": {"code": "SYN_NZD_CAD", "name": "NZD/CAD Synthetic Cross COT", "base": "NZD", "quote": "CAD"},
    "NZDCHF": {"code": "SYN_NZD_CHF", "name": "NZD/CHF Synthetic Cross COT", "base": "NZD", "quote": "CHF"},
    "CADCHF": {"code": "SYN_CAD_CHF", "name": "CAD/CHF Synthetic Cross COT", "base": "CAD", "quote": "CHF"},
    "EURAUD": {"code": "SYN_EUR_AUD", "name": "EUR/AUD Synthetic Cross COT", "base": "EUR", "quote": "AUD"},
    "EURCAD": {"code": "SYN_EUR_CAD", "name": "EUR/CAD Synthetic Cross COT", "base": "EUR", "quote": "CAD"},
    "EURNZD": {"code": "SYN_EUR_NZD", "name": "EUR/NZD Synthetic Cross COT", "base": "EUR", "quote": "NZD"},
    "GBPAUD": {"code": "SYN_GBP_AUD", "name": "GBP/AUD Synthetic Cross COT", "base": "GBP", "quote": "AUD"},
    "GBPCAD": {"code": "SYN_GBP_CAD", "name": "GBP/CAD Synthetic Cross COT", "base": "GBP", "quote": "CAD"},
    "GBPNZD": {"code": "SYN_GBP_NZD", "name": "GBP/NZD Synthetic Cross COT", "base": "GBP", "quote": "NZD"},

    # Metals
    "XAUUSD": {"code": "088691", "name": "Gold Commodity Futures", "base": "XAU"},
    "XAGUSD": {"code": "084691", "name": "Silver Commodity Futures", "base": "XAG"},
    "XPTUSD": {"code": "076651", "name": "Platinum Commodity Futures", "base": "XPT"},
    "XPDUSD": {"code": "075651", "name": "Palladium Commodity Futures", "base": "XPD"},
    "HG": {"code": "085692", "name": "Copper #1 Futures", "base": "HG"},

    # Energy & Commodities
    "CL": {"code": "067411", "name": "WTI Light Sweet Crude Oil", "base": "CL"},
    "BZ": {"code": "06765T", "name": "Brent Crude Oil Futures", "base": "BZ"},
    "NG": {"code": "023391", "name": "Natural Gas Futures", "base": "NG"},
    "ZC": {"code": "002602", "name": "Corn Futures", "base": "ZC"},
    "ZS": {"code": "005602", "name": "Soybean Futures", "base": "ZS"},
    "ZW": {"code": "001602", "name": "Wheat Futures", "base": "ZW"},

    # Indices
    "SPX": {"code": "13874A", "name": "E-mini S&P 500 Futures", "base": "SPX"},
    "NDX": {"code": "209742", "name": "Nasdaq 100 Mini Futures", "base": "NDX"},
    "DJI": {"code": "124603", "name": "DJIA x $5 Futures", "base": "DJI"},
    "RUT": {"code": "239742", "name": "Russell 2000 Mini Futures", "base": "RUT"},
    "N225": {"code": "240743", "name": "Nikkei Stock Average Futures", "base": "N225"},
    "DAX": {"code": "SYN_DAX", "name": "DAX 40 Synthetic Institutional Equity", "base": "DAX"},
    "FTSE": {"code": "SYN_FTSE", "name": "FTSE 100 Synthetic Institutional Equity", "base": "FTSE"},
    "CAC": {"code": "SYN_CAC", "name": "CAC 40 Synthetic Institutional Equity", "base": "CAC"},
    "SX5E": {"code": "SYN_SX5E", "name": "Euro Stoxx 50 Synthetic Institutional Equity", "base": "SX5E"},
    "ASX200": {"code": "SYN_ASX", "name": "ASX 200 Synthetic Institutional Equity", "base": "ASX200"},
    "HSI": {"code": "SYN_HSI", "name": "Hang Seng Synthetic Institutional Equity", "base": "HSI"},

    # Cryptocurrencies (CME Futures)
    "BTCUSD": {"code": "133741", "name": "Bitcoin Futures", "base": "BTC"},
    "ETHUSD": {"code": "146041", "name": "Ether Futures", "base": "ETH"},
}



class COTEngine:
    """Institutional COT Positioning Analysis and Crowding Detection."""

    @staticmethod
    def calculate_crowding_index(zscore: float) -> float:
        """Convert a 3-year Z-score (-3.0 to +3.0) to an intuitive Crowding Index (0 to 100).
        
        Uses cumulative logistic distribution:
        - Z = -2.5 -> Index ~ 7.5 (Extreme Short Crowding)
        - Z = 0.0  -> Index = 50.0 (Balanced)
        - Z = +2.5 -> Index ~ 92.5 (Extreme Long Crowding)
        """
        # Logistic transformation: 1 / (1 + exp(-0.8 * Z)) * 100
        val = 100.0 / (1.0 + math.exp(-0.9 * zscore))
        return round(max(0.0, min(100.0, val)), 1)

    @staticmethod
    def determine_sentiment_label(crowding_index: float) -> str:
        if crowding_index >= 85.0:
            return "EXTREME_LONG_CROWDING"
        elif crowding_index >= 62.0:
            return "BULLISH_POSITIONING"
        elif crowding_index <= 15.0:
            return "EXTREME_SHORT_CROWDING"
        elif crowding_index <= 38.0:
            return "BEARISH_POSITIONING"
        return "NEUTRAL_BALANCED"

    @staticmethod
    def detect_squeeze_risk(crowding_index: float, macro_score: float) -> Optional[str]:
        """Detect when speculative positioning creates high-risk squeeze traps.
        
        Trap 1: Macro is Bearish, but Speculators are already over-crowded Short (<15).
                Risk: Violent short squeeze rally on any slightly positive news.
        Trap 2: Macro is Bullish, but Speculators are already over-crowded Long (>85).
                Risk: Long liquidation cascade on any minor pullback.
        """
        if crowding_index <= 18.0 and macro_score < -15.0:
            return "SHORT_SQUEEZE_RISK: Speculative shorts are at 3-year extremes. Do NOT short support; wait for squeeze exhaust."
        elif crowding_index >= 82.0 and macro_score > 15.0:
            return "LONG_LIQUIDATION_RISK: Speculative longs are over-crowded (>85th pct). Do NOT buy breakouts; buy deep pullbacks only."
        return None

    @classmethod
    def analyze_cot_snapshot(
        cls,
        symbol: str,
        report_date: str,
        non_comm_long: int,
        non_comm_short: int,
        comm_long: int,
        comm_short: int,
        open_interest: int,
        history_net_specs: List[int],
        macro_score: float = 0.0,
    ) -> COTPositionSnapshot:
        """Compute full quantitative positioning profile for an asset."""
        sym_upper = symbol.upper()
        meta = CFTC_CONTRACT_MAP.get(sym_upper, {
            "code": "GENERIC", "name": f"{sym_upper} Futures", "base": sym_upper
        })

        net_spec = non_comm_long - non_comm_short
        net_comm = comm_long - comm_short

        # For quote USD pairs like USDJPY or USDCAD where the futures contract is on JPY or CAD,
        # invert net positioning so it reflects the traded pair.
        if meta.get("inverted", False):
            # If JPY is net short, USDJPY pair is net long USD
            net_spec_pair = -net_spec
        else:
            net_spec_pair = net_spec

        oi = max(1, open_interest)
        spec_pct_oi = round((net_spec_pair / oi) * 100.0, 2)

        # 3-Year Rolling Z-Score calculation (from past 156 weekly samples)
        samples = history_net_specs[-156:] if history_net_specs else [net_spec_pair]
        if len(samples) > 1:
            mean = sum(samples) / len(samples)
            variance = sum((x - mean) ** 2 for x in samples) / (len(samples) - 1)
            std = math.sqrt(variance) if variance > 0 else 1.0
            zscore = round((net_spec_pair - mean) / std, 2)
        else:
            zscore = 0.0

        # Clamp Z-score to [-3.5, +3.5]
        zscore = max(-3.5, min(3.5, zscore))
        crowding = cls.calculate_crowding_index(zscore)
        sentiment = cls.determine_sentiment_label(crowding)
        squeeze = cls.detect_squeeze_risk(crowding, macro_score)

        # 4-week momentum
        if len(history_net_specs) >= 4:
            trend_4w = net_spec_pair - history_net_specs[-4]
        else:
            trend_4w = 0

        return COTPositionSnapshot(
            symbol=sym_upper,
            asset_name=meta["name"],
            cftc_contract_code=meta["code"],
            report_date=report_date,
            non_commercial_long=non_comm_long,
            non_commercial_short=non_comm_short,
            commercial_long=comm_long,
            commercial_short=comm_short,
            total_open_interest=oi,
            net_speculative=net_spec_pair,
            net_commercial=net_comm,
            spec_net_pct_oi=spec_pct_oi,
            cot_zscore_3y=zscore,
            crowding_index=crowding,
            positioning_trend_4w=trend_4w,
            sentiment_label=sentiment,
            squeeze_warning=squeeze,
        )


def cot_snapshot_to_dict(snap: COTPositionSnapshot) -> Dict[str, Any]:
    """Serialize snapshot dataclass to dict for JSON API."""
    return {
        "symbol": snap.symbol,
        "asset_name": snap.asset_name,
        "cftc_contract_code": snap.cftc_contract_code,
        "report_date": snap.report_date,
        "non_commercial_long": snap.non_commercial_long,
        "non_commercial_short": snap.non_commercial_short,
        "commercial_long": snap.commercial_long,
        "commercial_short": snap.commercial_short,
        "total_open_interest": snap.total_open_interest,
        "net_speculative": snap.net_speculative,
        "net_commercial": snap.net_commercial,
        "spec_net_pct_oi": snap.spec_net_pct_oi,
        "cot_zscore_3y": snap.cot_zscore_3y,
        "crowding_index": snap.crowding_index,
        "positioning_trend_4w": snap.positioning_trend_4w,
        "sentiment_label": snap.sentiment_label,
        "squeeze_warning": snap.squeeze_warning,
    }
