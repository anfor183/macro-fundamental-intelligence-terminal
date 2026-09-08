"""Database initialization and baseline macro fundamental seed data."""

import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import AsyncSessionLocal, init_db
from backend.app.core.constants import (
    SUPPORTED_CENTRAL_BANKS,
    SUPPORTED_CURRENCIES,
    SUPPORTED_ASSETS,
    DEFAULT_SOURCES,
    DEFAULT_WEIGHTS,
    score_to_bias,
)
from backend.app.models.entities import CentralBank, Currency, Asset, EconomicIndicator, EconomicRelease
from backend.app.models.intelligence import NewsSource, NewsEvent, InstitutionalView, ProvenanceRecord
from backend.app.models.scoring import MacroScore, BiasSnapshot, BiasChange, Alert, SystemHealth

logger = logging.getLogger(__name__)


def utc_now():
    return datetime.now(timezone.utc)


async def seed_database():
    """Seed initial universe, sources, indicators, and baseline macro scores."""
    await init_db()

    async with AsyncSessionLocal() as session:
        # Check if assets are already seeded
        result = await session.execute(select(Asset).limit(1))
        if result.scalars().first():
            logger.info("Database already seeded. Skipping initial seeding.")
            return

        logger.info("Seeding Central Banks...")
        cb_map = {}
        for cb_data in SUPPORTED_CENTRAL_BANKS:
            cb = CentralBank(
                code=cb_data["code"],
                name=cb_data["name"],
                country=cb_data["country"],
                currency=cb_data["currency"],
                current_rate=cb_data["current_rate"],
                previous_rate=cb_data["previous_rate"],
                expected_next_rate=cb_data["expected_next_rate"],
                guidance_stance=cb_data["guidance_stance"],
                balance_sheet_policy=cb_data["balance_sheet_policy"],
                next_meeting_date=utc_now() + timedelta(days=14),
                last_statement_summary=cb_data["last_statement_summary"],
            )
            session.add(cb)
            cb_map[cb_data["code"]] = cb

        await session.flush()

        logger.info("Seeding Currencies...")
        curr_map = {}
        # Base fundamental currency scores
        curr_scores = {
            "USD": 18.0, "EUR": 42.0, "GBP": 25.0, "JPY": 55.0,
            "CHF": 10.0, "CAD": -15.0, "AUD": 28.0, "NZD": -20.0,
            "CNY": -5.0, "SEK": 12.0, "NOK": 5.0
        }
        for curr_data in SUPPORTED_CURRENCIES:
            cb = cb_map.get(curr_data["cb_code"])
            c_score = curr_scores.get(curr_data["code"], 0.0)
            curr = Currency(
                code=curr_data["code"],
                name=curr_data["name"],
                central_bank_id=cb.id if cb else None,
                current_score=c_score,
                weekly_score=c_score - 2.0,
                policy_direction="Tightening" if c_score > 30 else ("Easing" if c_score < -10 else "Paused"),
                growth_direction="Accelerating" if c_score > 20 else ("Slowing" if c_score < 0 else "Stable"),
            )
            session.add(curr)
            curr_map[curr_data["code"]] = curr

        await session.flush()

        logger.info("Seeding Sources...")
        for src_data in DEFAULT_SOURCES:
            src = NewsSource(
                name=src_data["name"],
                domain=src_data["domain"],
                tier=src_data["tier"],
                reliability_score=src_data["reliability_score"],
                source_type=src_data["source_type"],
                feed_url=src_data["feed_url"],
                is_active=True,
                last_fetch_time=utc_now() - timedelta(minutes=15),
            )
            session.add(src)

        logger.info("Seeding Economic Indicators...")
        indicators_data = [
            {"code": "US_CPI_YOY", "name": "US Headline CPI YoY", "country": "United States", "currency": "USD", "category": "inflation", "importance": "Critical", "unit": "%", "std": 0.25},
            {"code": "US_CORE_CPI_MOM", "name": "US Core CPI MoM", "country": "United States", "currency": "USD", "category": "inflation", "importance": "Critical", "unit": "%", "std": 0.15},
            {"code": "US_NFP", "name": "US Nonfarm Payrolls", "country": "United States", "currency": "USD", "category": "labor", "importance": "Critical", "unit": "K", "std": 45.0},
            {"code": "US_UNEMP_RATE", "name": "US Unemployment Rate", "country": "United States", "currency": "USD", "category": "labor", "importance": "High", "unit": "%", "std": 0.2},
            {"code": "US_ISM_MFG", "name": "US ISM Manufacturing PMI", "country": "United States", "currency": "USD", "category": "growth", "importance": "High", "unit": "Index", "std": 1.5},
            {"code": "EZ_CPI_YOY", "name": "Eurozone Flash HICP YoY", "country": "Eurozone", "currency": "EUR", "category": "inflation", "importance": "Critical", "unit": "%", "std": 0.2},
            {"code": "EZ_PMI_COMP", "name": "Eurozone Composite PMI", "country": "Eurozone", "currency": "EUR", "category": "growth", "importance": "High", "unit": "Index", "std": 1.2},
            {"code": "UK_CPI_YOY", "name": "UK Headline CPI YoY", "country": "United Kingdom", "currency": "GBP", "category": "inflation", "importance": "Critical", "unit": "%", "std": 0.3},
            {"code": "JP_CPI_CORE_YOY", "name": "Japan Core CPI (ex-fresh food) YoY", "country": "Japan", "currency": "JPY", "category": "inflation", "importance": "High", "unit": "%", "std": 0.2},
            {"code": "EIA_CRUDE_STOCKS", "name": "US EIA Weekly Crude Inventories", "country": "United States", "currency": "USD", "category": "commodities", "importance": "High", "unit": "M bbl", "std": 2.5},
        ]
        ind_map = {}
        for ind in indicators_data:
            ei = EconomicIndicator(
                code=ind["code"],
                name=ind["name"],
                country=ind["country"],
                currency=ind["currency"],
                category=ind["category"],
                importance=ind["importance"],
                unit=ind["unit"],
                historical_std_dev=ind["std"],
            )
            session.add(ei)
            ind_map[ind["code"]] = ei

        await session.flush()

        logger.info("Seeding baseline Economic Releases...")
        releases_data = [
            {"ind": "US_CPI_YOY", "period": "Latest", "actual": 2.9, "consensus": 3.1, "prev": 3.2, "surprise": -0.2, "pol": "Dovish", "dt": utc_now() - timedelta(days=2)},
            {"ind": "US_NFP", "period": "Latest", "actual": 142.0, "consensus": 165.0, "prev": 114.0, "surprise": -23.0, "pol": "Dovish", "dt": utc_now() - timedelta(days=5)},
            {"ind": "EZ_CPI_YOY", "period": "Latest", "actual": 2.2, "consensus": 2.2, "prev": 2.6, "surprise": 0.0, "pol": "Neutral", "dt": utc_now() - timedelta(days=4)},
            {"ind": "JP_CPI_CORE_YOY", "period": "Latest", "actual": 2.8, "consensus": 2.5, "prev": 2.5, "surprise": 0.3, "pol": "Hawkish", "dt": utc_now() - timedelta(days=3)},
            {"ind": "EIA_CRUDE_STOCKS", "period": "Latest", "actual": -3.2, "consensus": -1.0, "prev": 1.4, "surprise": -2.2, "pol": "Bullish Commodity", "dt": utc_now() - timedelta(days=1)},
        ]
        for rel in releases_data:
            ei = ind_map.get(rel["ind"])
            if ei:
                er = EconomicRelease(
                    indicator_id=ei.id,
                    event_time=rel["dt"],
                    period=rel["period"],
                    actual=rel["actual"],
                    consensus=rel["consensus"],
                    previous=rel["prev"],
                    surprise=rel["surprise"],
                    surprise_zscore=rel["surprise"] / ei.historical_std_dev,
                    policy_implication=rel["pol"],
                    source_url="https://www.bls.gov/cpi",
                )
                session.add(er)

        logger.info("Seeding Assets and Baseline Macro Scores...")
        for a_data in SUPPORTED_ASSETS:
            asset = Asset(
                symbol=a_data["symbol"],
                name=a_data["name"],
                asset_class=a_data["asset_class"],
                base_currency=a_data["base_currency"],
                quote_currency=a_data["quote_currency"],
                current_price=a_data["current_price"],
                daily_change_pct=a_data["daily_change_pct"],
                is_active=True,
            )
            session.add(asset)
            await session.flush()

            # Calculate initial baseline score
            if asset.asset_class == "forex":
                base_score = curr_scores.get(asset.base_currency, 0.0)
                quote_score = curr_scores.get(asset.quote_currency, 0.0)
                # Relative value = Base - Quote + pair-specific factor
                tactical_score = round(base_score - quote_score, 1)
                weekly_score = round(tactical_score - 3.0, 1)
                confidence = 78.0 if abs(tactical_score) > 20 else 68.0
            elif asset.symbol == "XAUUSD":
                tactical_score = 64.0 # Gold Bullish (lower yields, safe haven)
                weekly_score = 58.0
                confidence = 82.0
            elif asset.symbol in ("CL", "BZ"):
                tactical_score = -24.0 # Mild Bearish Oil (China slowdown, rising supply)
                weekly_score = -20.0
                confidence = 74.0
            elif asset.symbol in ("SPX", "NDX", "DJI", "RUT"):
                tactical_score = 46.0 # Equity Bullish (earnings resilience + rate cut tailwinds)
                weekly_score = 42.0
                confidence = 79.0
            elif asset.symbol in ("DAX", "CAC", "SX5E"):
                tactical_score = 12.0 # Neutral to Mild Bullish European Equities
                weekly_score = 10.0
                confidence = 70.0
            else:
                tactical_score = 15.0
                weekly_score = 10.0
                confidence = 70.0

            tactical_bias = score_to_bias(tactical_score)
            weekly_bias = score_to_bias(weekly_score)

            # Factor waterfall contributions
            weights = DEFAULT_WEIGHTS.get(asset.asset_class, DEFAULT_WEIGHTS["forex"])
            factor_breakdown = {}
            for cat, w in weights.items():
                cat_score = tactical_score + (10.0 if "policy" in cat or "rate" in cat else -5.0)
                cat_score = max(-100.0, min(100.0, cat_score))
                factor_breakdown[cat] = {
                    "score": round(cat_score, 1),
                    "weight": w,
                    "contribution": round(cat_score * w, 2),
                    "status": "BULLISH" if cat_score >= 15 else ("BEARISH" if cat_score <= -15 else "NEUTRAL")
                }

            # Primary and secondary driver logic
            if asset.symbol == "EURUSD":
                primary_driver = "US inflation cooling increases Fed rate cut probability"
                secondary_driver = "ECB holds steady tone on services inflation persistence"
                bullish_factors = [
                    "US Core CPI printed below consensus (-0.2% surprise)",
                    "2Y US Treasury yields fell 14bps easing USD rate advantage",
                    "ECB policy expectations remain balanced vs Fed aggressive easing path",
                    "Improving Eurozone terms of trade as natural gas prices stabilize"
                ]
                bearish_factors = [
                    "Eurozone manufacturing PMIs remain in contraction territory (45.8)",
                    "German industrial production momentum continues to stagnate"
                ]
                invalidation = [
                    {"id": "inv_1", "condition": "US Core CPI re-accelerates above 0.35% MoM", "likelihood": "Medium", "impact_if_triggered": "Flips to Mild Bearish", "metric_to_watch": "US Core CPI MoM"},
                    {"id": "inv_2", "condition": "ECB accelerates rate cuts to 50bps pace", "likelihood": "Low", "impact_if_triggered": "Flips to Bearish", "metric_to_watch": "ECB Policy Statement"}
                ]
                scenarios = {
                    "bull": {"title": "Bull Case (Soft Landing + Aggressive Fed)", "probability": 0.55, "description": "Fed delivers consecutive rate cuts while Eurozone avoids recession.", "implications": "EURUSD expands toward 1.1100-1.1250", "triggers": ["US labor cooling", "Fed dovish pivot"]},
                    "base": {"title": "Base Case (Gradual Global Easing)", "probability": 0.35, "description": "Both central banks ease moderately, keeping yield spread steady.", "implications": "EURUSD consolidates in 1.0750-1.0950 range", "triggers": ["In-line inflation prints"]},
                    "bear": {"title": "Bear Case (US Growth Re-acceleration)", "probability": 0.10, "description": "US exceptionalism resumes, forcing Fed pause while ECB eases.", "implications": "EURUSD breaks below 1.0500 support", "triggers": ["US CPI beat", "Surging retail sales"]}
                }
            elif asset.symbol == "XAUUSD":
                primary_driver = "Falling US 10Y real yields and robust global central bank reserve diversification"
                secondary_driver = "Geopolitical safe-haven hedging and geopolitical supply chokepoint risks"
                bullish_factors = [
                    "US 10-year TIPS real yields declined to 1.82% (-18bps 30-day move)",
                    "Global central banks accumulated net 48 tonnes in recent month",
                    "Sustained Middle East shipping and geopolitical tensions supporting risk premia"
                ]
                bearish_factors = [
                    "Western ETF retail holdings remain subdued compared to 2020 peaks",
                    "High physical jewellery premiums curbing retail consumption in India and China"
                ]
                invalidation = [
                    {"id": "inv_gold_1", "condition": "US 10Y Real Yield breaks upward above 2.25%", "likelihood": "Low", "impact_if_triggered": "Reduces to Neutral", "metric_to_watch": "10Y TIPS Yield"},
                    {"id": "inv_gold_2", "condition": "Fed halts rate cuts due to persistent services inflation", "likelihood": "Medium", "impact_if_triggered": "Flips to Bearish", "metric_to_watch": "FOMC Dot Plot"}
                ]
                scenarios = {
                    "bull": {"title": "Bull Case (Yield Breakdown & Geopolitical Escalation)", "probability": 0.60, "description": "Aggressive central bank buying meets declining real rates.", "implications": "Gold tests $2,850 - $3,000", "triggers": ["Sub-1.5% real yields", "Reserve flows"]},
                    "base": {"title": "Base Case (Steady Real Yield Consolidation)", "probability": 0.30, "description": "Gold holds structural high ground with gradual upward drift.", "implications": "Rangebound $2,680 - $2,780", "triggers": ["Fed 25bps steps"]},
                    "bear": {"title": "Bear Case (Hawkish Fed Repricing & Peace Accord)", "probability": 0.10, "description": "Sharp rise in real yields and de-escalation of safe-haven flows.", "implications": "Retracement toward $2,520 support", "triggers": ["Hawkish Fed", "Spike in nominal yields"]}
                }
            elif asset.symbol in ("CL", "BZ"):
                primary_driver = "Muted global industrial demand and rising non-OPEC+ supply output"
                secondary_driver = "OPEC+ voluntary production unwinding schedule overhang"
                bullish_factors = [
                    "US EIA crude stockpiles posted unexpected 3.2M barrel draw",
                    "Geopolitical supply vulnerability in Middle East transit corridors"
                ]
                bearish_factors = [
                    "China manufacturing PMIs signal sluggish diesel and industrial demand",
                    "Surging US, Brazilian, and Guyanese crude export volumes into Atlantic basin",
                    "OPEC+ spare production capacity exceeds 5.5M barrels/day"
                ]
                invalidation = [
                    {"id": "inv_oil_1", "condition": "Major infrastructure or tanker disruption in Strait of Hormuz", "likelihood": "Low", "impact_if_triggered": "Flips to Strong Bullish", "metric_to_watch": "Shipping Alerts"},
                    {"id": "inv_oil_2", "condition": "China unleashes massive infrastructure-focused fiscal stimulus", "likelihood": "Medium", "impact_if_triggered": "Flips to Bullish", "metric_to_watch": "China Fiscal Deficit"}
                ]
                scenarios = {
                    "bull": {"title": "Bull Case (Severe Supply Shock / Escalation)", "probability": 0.20, "description": "Physical supply chokepoint severed.", "implications": "Crude spikes above $88/bbl", "triggers": ["Transit halt"]},
                    "base": {"title": "Base Case (Soft Demand & Managed Supply)", "probability": 0.60, "description": "Rangebound market with OPEC+ defending $70 floor.", "implications": "WTI oscillates $68-$76/bbl", "triggers": ["OPEC discipline"]},
                    "bear": {"title": "Bear Case (OPEC Price War & Demand Collapse)", "probability": 0.20, "description": "Quota compliance fails and supply flooded into soft market.", "implications": "WTI drops to $58-$62/bbl", "triggers": ["OPEC quota breach"]}
                }
            elif asset.symbol == "SPX":
                primary_driver = "Corporate earnings resilience combined with Fed monetary easing tailwinds"
                secondary_driver = "Productivity enhancements and resilient consumer balance sheets"
                bullish_factors = [
                    "S&P 500 blended Q3/Q4 earnings growth tracking above +11% YoY",
                    "Fed policy rate trajectory entering easing phase without broad recession",
                    "Credit spreads (HY OAS) near historic cycle lows indicating tight liquidity risk"
                ]
                bearish_factors = [
                    "Elevated equity valuation multiples (Forward P/E ~ 22.1x vs 18.5x 10Y avg)",
                    "Sticky core services inflation could limit terminal Fed rate cuts"
                ]
                invalidation = [
                    {"id": "inv_spx_1", "condition": "US 10Y Treasury yield surges past 4.75%", "likelihood": "Medium", "impact_if_triggered": "Flips to Bearish", "metric_to_watch": "US 10Y Yield"},
                    {"id": "inv_spx_2", "condition": "Unemployment rate jumps above 4.6% triggering Sahm Rule recession", "likelihood": "Low", "impact_if_triggered": "Flips to Strong Bearish", "metric_to_watch": "US Unemployment Rate"}
                ]
                scenarios = {
                    "bull": {"title": "Bull Case (Productivity Boom & Soft Landing)", "probability": 0.50, "description": "Earnings expansion continues alongside moderate Fed easing.", "implications": "S&P 500 pushes towards 6,200-6,400", "triggers": ["Solid GDP", "Sub-3% inflation"]},
                    "base": {"title": "Base Case (Moderate Grind Higher)", "probability": 0.35, "description": "Valuation limits multiple expansion but earnings support floor.", "implications": "Consolidation around 5,850-6,050", "triggers": ["In-line earnings"]},
                    "bear": {"title": "Bear Case (Stagflationary Margin Squeeze)", "probability": 0.15, "description": "Input cost rebound meets decelerating consumer demand.", "implications": "Correction towards 5,300-5,500", "triggers": ["Margin compression"]}
                }
            else:
                primary_driver = f"Macro relative alignment for {asset.symbol}"
                secondary_driver = "Yield spread and cross-asset liquidity conditions"
                bullish_factors = [f"Constructive underlying macroeconomic momentum for {asset.symbol}"]
                bearish_factors = ["Broader macroeconomic growth vulnerability and market cross-currents"]
                invalidation = [
                    {"id": f"inv_{asset.symbol}", "condition": "Unexpected central bank monetary policy repricing", "likelihood": "Medium", "impact_if_triggered": "Shifts bias to Neutral", "metric_to_watch": "Policy Guidance"}
                ]
                scenarios = {
                    "bull": {"title": "Bull Case", "probability": 0.45, "description": "Macro factors accelerate positively.", "implications": "Upward bias progression", "triggers": ["Data beat"]},
                    "base": {"title": "Base Case", "probability": 0.40, "description": "Status quo macro conditions hold.", "implications": "Consolidation within trend", "triggers": ["In-line data"]},
                    "bear": {"title": "Bear Case", "probability": 0.15, "description": "Macro factors deteriorate.", "implications": "Downward reversal", "triggers": ["Data miss"]}
                }

            # Create MacroScore record
            ms = MacroScore(
                asset_id=asset.id,
                tactical_score=tactical_score,
                weekly_score=weekly_score,
                confidence=confidence,
                factor_breakdown=factor_breakdown,
                weight_breakdown=weights,
                regime_tags=["DISINFLATIONARY", "GROWTH_SLOWDOWN"] if tactical_score > 0 else ["STAGFLATIONARY_RISK"]
            )
            session.add(ms)

            # Create BiasSnapshot record
            bs = BiasSnapshot(
                asset_id=asset.id,
                tactical_bias=tactical_bias,
                weekly_bias=weekly_bias,
                score=tactical_score,
                weekly_score=weekly_score,
                confidence=confidence,
                primary_driver=primary_driver,
                secondary_driver=secondary_driver,
                bullish_factors=bullish_factors,
                bearish_factors=bearish_factors,
                conflicting_factors=["Conflicting signals between softening labor metrics and sticky core services inflation"],
                invalidation_conditions=invalidation,
                scenario_bull=scenarios["bull"],
                scenario_base=scenarios["base"],
                scenario_bear=scenarios["bear"],
                data_quality={
                    "status": "HEALTHY",
                    "completeness_pct": 94.0,
                    "stale_factors": [],
                    "conflicting_signals": ["Labor cooling vs services inflation stickiness"]
                }
            )
            session.add(bs)

            # Create BiasChange record
            bc = BiasChange(
                asset_id=asset.id,
                previous_bias="NEUTRAL" if tactical_bias != "NEUTRAL" else "MILD BEARISH",
                new_bias=tactical_bias,
                previous_score=tactical_score - 15.0 if tactical_score >= 0 else tactical_score + 15.0,
                new_score=tactical_score,
                primary_driver=primary_driver,
                secondary_driver=secondary_driver,
                confidence=confidence,
            )
            session.add(bc)

        logger.info("Seeding Institutional Views...")
        inst_views = [
            {"inst": "Goldman Sachs", "symbol": "EURUSD", "stance": "Bullish", "title": "EURUSD: Room to Run on Fed Rate Cut Acceleration", "summary": "Goldman Sachs FX strategists project EURUSD reaching 1.1200 over 6 months as Fed cutting cycle outpaces gradual ECB normalization.", "type": "ANALYST OPINION"},
            {"inst": "JPMorgan", "symbol": "XAUUSD", "stance": "Bullish", "title": "Precious Metals Outlook: Gold Structural Target $2,850", "summary": "JPMorgan commodities research maintains structural overweight on gold citing relentless central bank reserve demand and declining US real yields.", "type": "FORECAST"},
            {"inst": "Morgan Stanley", "symbol": "SPX", "stance": "Neutral", "title": "US Equities: Earnings Durability Meets Valuation Ceiling", "summary": "Morgan Stanley equity strategy notes high quality tech earnings support index, but current multiples leave little room for policy error.", "type": "ANALYST OPINION"},
            {"inst": "UBS", "symbol": "CL", "stance": "Bearish", "title": "Crude Oil: Non-OPEC Production Surge Weighs on Brent & WTI", "summary": "UBS energy strategists anticipate Brent crude consolidating near $72-75 as supply additions from US, Guyana, and Brazil offset Middle East risk premia.", "type": "ANALYST OPINION"},
            {"inst": "Bank of America", "symbol": "USDJPY", "stance": "Bearish", "title": "BoJ Rate Hike Cycle to Narrow US-Japan Yield Gap", "summary": "BofA FX strategists forecast USDJPY heading toward 145.00 by mid-2026 as Bank of Japan proceeds with measured quantitative tightening and rate hikes.", "type": "FORECAST"},
        ]
        for iv_data in inst_views:
            iv = InstitutionalView(
                institution_name=iv_data["inst"],
                title=iv_data["title"],
                summary=iv_data["summary"],
                view_type=iv_data["type"],
                asset_symbol=iv_data["symbol"],
                stance=iv_data["stance"],
                target_horizon="3-6 Months",
                published_at=utc_now() - timedelta(days=1),
                source_url=f"https://www.{iv_data['inst'].lower().replace(' ', '')}.com/research",
                reliability_tier=2
            )
            session.add(iv)

        logger.info("Seeding System Health metrics...")
        components = [
            {"comp": "Data Ingestion Engine", "status": "HEALTHY", "latency": 120.5, "err": 0.0, "msg": "Consuming 18 official RSS and API endpoints"},
            {"comp": "Deduplication & Clustering", "status": "HEALTHY", "latency": 45.2, "err": 0.0, "msg": "Event cluster ID hashing operational"},
            {"comp": "Macro Scoring Engine", "status": "HEALTHY", "latency": 85.0, "err": 0.0, "msg": "Factor waterfall calculations synced"},
            {"comp": "Bias & Invalidation Engine", "status": "HEALTHY", "latency": 32.1, "err": 0.0, "msg": "Deterministic bias threshold checks active"},
            {"comp": "Database & Persistence", "status": "HEALTHY", "latency": 15.4, "err": 0.0, "msg": "Async connection pool nominal"},
            {"comp": "AI Synthesis Layer", "status": "HEALTHY", "latency": 210.0, "err": 0.0, "msg": "Structured schema validation active with fallback rules"},
        ]
        for c in components:
            sh = SystemHealth(
                component=c["comp"],
                status=c["status"],
                latency_ms=c["latency"],
                error_rate_pct=c["err"],
                message=c["msg"],
            )
            session.add(sh)

        logger.info("Seeding initial Alerts...")
        alerts_data = [
            {"symbol": "EURUSD", "type": "BIAS_CHANGE", "title": "EURUSD Bias Upgraded to Bullish", "msg": "Score increased from +28 to +42 following softer US CPI print and Fed easing repricing.", "sev": "INFO"},
            {"symbol": "XAUUSD", "type": "HIGH_IMPACT_CATALYST", "title": "Gold Reaches Strong Bullish Conviction (+64)", "msg": "US 10Y real yields drop 14bps while central bank reserve buying pace accelerates.", "sev": "INFO"},
            {"symbol": "USDJPY", "type": "CENTRAL_BANK_GUIDANCE", "title": "BoJ Signals Preparedness for Further Rate Hikes", "msg": "Governor Ueda speech emphasizes positive wage-price dynamic and currency stability.", "sev": "WARNING"},
        ]
        for a in alerts_data:
            alt = Alert(
                asset_symbol=a["symbol"],
                alert_type=a["type"],
                title=a["title"],
                message=a["msg"],
                severity=a["sev"],
            )
            session.add(alt)

        await session.commit()
        logger.info("Database successfully seeded with comprehensive macro data!")


if __name__ == "__main__":
    import asyncio
    logging.basicConfig(level=logging.INFO)
    asyncio.run(seed_database())
