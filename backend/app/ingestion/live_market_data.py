"""Live Market Data Ingestion using Free Online Sources (Yahoo Finance).

Fetches real-time market prices, daily percentage changes, and sovereign bond yields
for Forex majors and crosses, equity indices, metals, and commodities without requiring paid API keys.
"""

import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
import yfinance as yf
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.entities import Asset

logger = logging.getLogger(__name__)

# Map internal symbols to Yahoo Finance tickers
YFINANCE_TICKER_MAP: Dict[str, str] = {
    # Forex Majors
    "EURUSD": "EURUSD=X",
    "GBPUSD": "GBPUSD=X",
    "USDJPY": "USDJPY=X",
    "USDCHF": "USDCHF=X",
    "USDCAD": "USDCAD=X",
    "AUDUSD": "AUDUSD=X",
    "NZDUSD": "NZDUSD=X",
    # Forex Crosses
    "EURGBP": "EURGBP=X",
    "EURJPY": "EURJPY=X",
    "EURCHF": "EURCHF=X",
    "EURAUD": "EURAUD=X",
    "EURNZD": "EURNZD=X",
    "EURCAD": "EURCAD=X",
    "GBPJPY": "GBPJPY=X",
    "GBPCHF": "GBPCHF=X",
    "GBPAUD": "GBPAUD=X",
    "GBPCAD": "GBPCAD=X",
    "GBPNZD": "GBPNZD=X",
    "AUDJPY": "AUDJPY=X",
    "AUDCAD": "AUDCAD=X",
    "AUDCHF": "AUDCHF=X",
    "AUDNZD": "AUDNZD=X",
    "NZDJPY": "NZDJPY=X",
    "NZDCHF": "NZDCHF=X",
    "NZDCAD": "NZDCAD=X",
    "CADJPY": "CADJPY=X",
    "CADCHF": "CADCHF=X",
    "CHFJPY": "CHFJPY=X",
    # Equity Indices
    "SPX": "^GSPC",
    "NDX": "^IXIC",
    "DJI": "^DJI",
    "RUT": "^RUT",
    "DAX": "^GDAXI",
    "CAC": "^FCHI",
    "FTSE": "^FTSE",
    "SX5E": "^STOXX50E",
    "N225": "^N225",
    "HSI": "^HSI",
    "ASX200": "^AXJO",
    # Metals
    "XAUUSD": "GC=F",
    "XAGUSD": "SI=F",
    "XPTUSD": "PL=F",
    "XPDUSD": "PA=F",
    # Commodities
    "CL": "CL=F",
    "BZ": "BZ=F",
    "NG": "NG=F",
    "HG": "HG=F",
    "ZW": "ZW=F",
    "ZC": "ZC=F",
    "ZS": "ZS=F",
    # Sovereign Yields & Macro Benchmarks
    "US10Y": "^TNX",
    "US05Y": "^FVX",
    "US13W": "^IRX",
}

# Reverse map: Yahoo Finance Ticker -> Internal Symbol
REVERSE_TICKER_MAP: Dict[str, str] = {v: k for k, v in YFINANCE_TICKER_MAP.items()}


class LiveMarketDataCollector:
    """Collects real-time market quotes and yield benchmarks via open Yahoo Finance feeds."""

    @classmethod
    def fetch_quotes(cls, symbols: Optional[List[str]] = None) -> Dict[str, Dict[str, float]]:
        """
        Fetch latest prices and 24h percentage changes for requested symbols.
        Returns: { symbol: { 'price': float, 'daily_change_pct': float } }
        """
        target_map = {
            s: YFINANCE_TICKER_MAP[s]
            for s in (symbols or YFINANCE_TICKER_MAP.keys())
            if s in YFINANCE_TICKER_MAP
        }

        if not target_map:
            return {}

        results: Dict[str, Dict[str, float]] = {}
        tickers_list = list(target_map.values())

        try:
            # Batch download 2 days of close history to compute live price and daily change %
            df = yf.download(
                tickers_list,
                period="2d",
                interval="1d",
                progress=False,
                auto_adjust=False,
                threads=True,
            )

            if df is not None and not df.empty and "Close" in df:
                close_df = df["Close"]
                for sym, ticker in target_map.items():
                    if ticker in close_df.columns:
                        series = close_df[ticker].dropna()
                        if not series.empty:
                            current_val = float(series.iloc[-1])
                            if len(series) >= 2 and series.iloc[-2] > 0:
                                prev_val = float(series.iloc[-2])
                                pct = round(((current_val - prev_val) / prev_val) * 100.0, 2)
                            else:
                                pct = 0.0

                            # Treasury yields like ^TNX report index points (e.g. 4.45% is 4.45)
                            results[sym] = {
                                "price": round(current_val, 4 if current_val < 10 else 2),
                                "daily_change_pct": pct,
                            }
        except Exception as exc:
            logger.warning(f"Batch download failed: {exc}")

        logger.info(f"Live market data collected for {len(results)}/{len(target_map)} assets.")
        return results

    @classmethod
    async def update_database_prices(cls, session: AsyncSession) -> int:
        """
        Fetches live prices from Yahoo Finance and updates Asset records in the database.
        Returns the count of updated assets.
        """
        import asyncio
        quotes = await asyncio.to_thread(cls.fetch_quotes)
        if not quotes:
            return 0

        updated_count = 0
        now = datetime.now(timezone.utc)

        result = await session.execute(select(Asset))
        assets = result.scalars().all()

        for asset in assets:
            if asset.symbol in quotes:
                quote = quotes[asset.symbol]
                asset.current_price = quote["price"]
                asset.daily_change_pct = quote["daily_change_pct"]
                asset.updated_at = now
                updated_count += 1

        await session.commit()
        logger.info(f"Successfully updated live market prices for {updated_count} assets in DB.")
        return updated_count
