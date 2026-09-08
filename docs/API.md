# REST API Reference

Base URL: `http://localhost:8080/api/v1`

## Endpoints Summary

### 1. Macro Regime & Assets
- `GET /macro/regime`: Returns current overarching global macro regime (Risk-On/Off, Inflation Cycle, Growth Cycle, Liquidity).
- `GET /assets`: List all 50 covered assets with current price, daily move, tactical bias, macro score, and confidence.
  - Query parameters: `asset_class` (forex, index, metal, commodity), `search` (string).
- `GET /assets/{symbol}`: Comprehensive asset deep-dive with factor breakdown waterfall, bullish/bearish evidence, invalidation conditions, and scenario analysis.
- `GET /assets/{symbol}/history`: Time-series of historical scores and biases.

### 2. Currencies & Forex Models
- `GET /currencies/matrix`: Full 11×11 relative strength matrix for USD, EUR, GBP, JPY, CHF, CAD, AUD, NZD, CNY, SEK, NOK.
- `GET /currencies/ranking`: Fundamentally ranked currency list with policy stances.
- `GET /forex/rankings`: Ranked list of all 28 forex pairs by conviction score ($|\text{Score}| \times \text{Confidence}$).

### 3. Specialized Commodity & Metals Terminals
- `GET /specialized/gold`: Real yields, USD pressure, Fed rate cut odds, and safe-haven demand for Gold (XAUUSD).
- `GET /specialized/oil`: OPEC+ quota discipline, inventories, China demand drag, and global growth for Crude Oil (CL/BZ).

### 4. Intelligence & Calendar
- `GET /calendar`: High-impact scheduled economic releases with consensus expectations and sensitivity guidelines.
- `GET /news`: Filterable verified news feed with source tiers and event clusters.
- `GET /institutional`: Public major bank research publications.
- `GET /what-changed`: Chronological timeline of bias updates, score deltas, and primary catalysts.
- `GET /alerts`: Active alerts for bias flips, high-impact catalysts, and contradictions.

### 5. Testing & Simulation
- `GET /simulation/scenarios`: List available synthetic test scenarios.
- `POST /simulation/run?scenario_id={id}`: Inject synthetic event (e.g. `cpi_downside_surprise`) and trigger live recalculation.

### 6. Analytics & Observability
- `GET /backtest?symbol={symbol}&holding_days={days}`: Historical hit rate, win-loss ratio, drawdown, and calibration weights.
- `GET /system/health`: Live health metrics for all 6 platform components.
- `GET /export/pdf`: Download daily institutional PDF macro briefing.
- `GET /export/csv`: Export current asset universe as CSV.
