# Antigravity Macro Fundamental Intelligence Platform

> **Automated Macro-Fundamental Intelligence and Market-Bias Engine for Global Financial Trading Assets**  
> Covering Global Forex (28 Majors & Crosses), Global Equity Indices (11), Precious Metals (Gold, Silver, Platinum, Palladium), and Energy/Commodities (WTI, Brent, Natural Gas, Copper, Ags).

[![Python 3.12](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6.svg)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Tests-105%20Passing-10b981.svg)]()
[![Compliance](https://img.shields.io/badge/Compliance-Zero%20Lookahead-emerald.svg)]()

---

## 1. System Vision & Core Objective

This platform is **not a simple news aggregator**. It is an **automated macro-fundamental intelligence and market-bias engine**.

It continuously answers five fundamental questions for every asset:
1. **What is the fundamental bias right now?** (Strong Bullish, Bullish, Mild Bullish, Neutral, Mild Bearish, Bearish, Strong Bearish)
2. **Why does that bias exist?** (Traceable factor waterfall decomposition across 14 macroeconomic dimensions)
3. **How strong is the evidence?** (Quantitative Confidence Score % penalizing internal contradictions and data staleness)
4. **What changed it?** ("What Changed Today?" delta engine tracking catalytic drivers between snapshots)
5. **What events could invalidate it?** (Explicit invalidation conditions and probabilistic scenario analysis)

---

## 2. Core Architecture Pipeline

```
VERIFIED DATA
  → SOURCE VALIDATION (Tier 1 Official to Tier 5 Unverified)
  → NORMALIZATION & DEDUPLICATION (Content Hashing + event_cluster_id)
  → EVENT EXTRACTION (Actual vs Consensus vs Previous, Revision, Surprise Z-Score)
  → MACRO FACTOR CLASSIFICATION (Monetary Policy, Inflation, Growth, Labor, etc.)
  → ASSET EXPOSURE MAPPING (Transmission to affected currencies and markets)
  → FACTOR IMPACT ASSESSMENT (Surprise, Trend, Momentum, Exponential Time Decay)
  → CROSS-ASSET CONTEXT (Real Yields, DXY Pressure, Terms of Trade, Oil-CAD Linkage)
  → WEIGHTED MACRO SCORING (-100 to +100 Normalized Scale)
  → CURRENCY RELATIVE-VALUE MODEL (Base Currency Score − Quote Currency Score)
  → REGIME DETECTION (Risk-On/Off, Disinflationary Slowdown, Stagflation Risk, etc.)
  → CONFIDENCE CALCULATION (Completeness, Source Tier, Contradiction Penalty)
  → DETERMINISTIC BIAS ENGINE (Categorical Thresholds)
  → GROUNDED AI EXPLANATION ENGINE (Zero Hallucination Synthesis)
  → "WHAT CHANGED TODAY?" DELTA ENGINE
  → HISTORICAL AUDIT LOG & SNAPSHOT DATABASE
```

---

## 3. Supported Asset Universe

The platform covers **50 global trading assets** out of the box:

- **Forex Majors**: EURUSD, GBPUSD, USDJPY, USDCHF, USDCAD, AUDUSD, NZDUSD
- **Forex Crosses**: EURGBP, EURJPY, EURCHF, EURAUD, EURNZD, EURCAD, GBPJPY, GBPCHF, GBPAUD, GBPCAD, GBPNZD, AUDJPY, AUDCAD, AUDCHF, AUDNZD, NZDJPY, NZDCHF, NZDCAD, CADJPY, CADCHF, CHFJPY
- **Currencies**: USD, EUR, GBP, JPY, CHF, CAD, AUD, NZD, CNY, SEK, NOK
- **Global Equity Indices**: S&P 500 (SPX), Nasdaq 100 (NDX), Dow Jones (DJI), Russell 2000 (RUT), DAX 40, CAC 40, FTSE 100, Euro Stoxx 50, Nikkei 225, Hang Seng, ASX 200
- **Precious Metals**: Gold (XAUUSD), Silver (XAGUSD), Platinum (XPTUSD), Palladium (XPDUSD)
- **Energy & Commodities**: WTI Crude Oil (CL), Brent Crude Oil (BZ), Natural Gas (NG), Copper Futures (HG), Wheat (ZW), Corn (ZC), Soybeans (ZS)

---

## 4. Key Platform Features

- **Dual Time Horizon**: Distinguishes **Tactical Intraday Bias** (responsive to immediate surprises) from **Weekly Structural Macro Bias** (anchored on monetary policy trajectories and structural balances).
- **Currency Relative Value Strength Matrix**: Full 11×11 matrix evaluating every global currency against each other ($B - Q + \Delta\text{Yield}$).
- **Forex Conviction Ranking**: Automatically ranks all 28 forex pairs by conviction score ($|\text{Tactical Score}| \times \text{Confidence}$).
- **Specialized Gold & Oil Terminals**: Dedicated factor waterfalls for Gold (Real yields, DXY, Fed odds, Central bank reserve flows) and Oil (OPEC+ discipline, inventories, China manufacturing drag).
- **"What Changed Today?" Delta Engine**: Shows exact point deltas, previous vs new bias, and catalytic drivers.
- **Scenario Simulator (`[DEMO / SIMULATION]`)**: Inject synthetic macro shocks (US CPI miss, NFP shock, BoJ rate hike, Oil disruption, Risk-off) to observe real-time bias transitions.
- **Institutional PDF & CSV Exporter**: One-click generation of executive briefing reports.
- **Historical Backtesting Engine**: Statistical evaluation of directional hit rates, persistence half-life, and weight calibrations.

---

## 5. Quick Start (Local Setup)

### Prerequisites
- Python 3.12+
- Node.js v20+ and npm

### 1. Install Backend Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run Tests
```bash
python3 -m pytest backend/tests -v
```
*All 24 unit and acceptance tests will execute and verify the mathematical scoring, deduplication, and simulation engine.*

### 3. Start Application
```bash
python3 -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8080
```
Open your browser at **`http://127.0.0.1:8080/`** to access the complete institutional trading terminal!

For frontend hot-module reloading during development:
```bash
cd frontend && npm run dev
```

---

## 6. Project Documentation Index

- [Architecture Specification](file:///home/fortune/Documents/fx%20fundamentals/docs/ARCHITECTURE.md)
- [Data Sources & Provenance](file:///home/fortune/Documents/fx%20fundamentals/docs/DATA_SOURCES.md)
- [API Documentation](file:///home/fortune/Documents/fx%20fundamentals/docs/API.md)
- [Scoring & Bias Methodology](file:///home/fortune/Documents/fx%20fundamentals/docs/SCORING_MODEL.md)
- [AI Synthesis Pipeline](file:///home/fortune/Documents/fx%20fundamentals/docs/AI_PIPELINE.md)
- [Backtesting & Calibration](file:///home/fortune/Documents/fx%20fundamentals/docs/BACKTESTING.md)
- [Security & Risk Controls](file:///home/fortune/Documents/fx%20fundamentals/docs/SECURITY.md)
- [Testing & Acceptance Verification](file:///home/fortune/Documents/fx%20fundamentals/docs/TESTING.md)
- [Deployment Guide (Docker)](file:///home/fortune/Documents/fx%20fundamentals/docs/DEPLOYMENT.md)
- [User Terminal Guide](file:///home/fortune/Documents/fx%20fundamentals/docs/USER_GUIDE.md)

---

## 7. Regulatory & Compliance Notice

> **Institutional Notice:** Fundamental bias is an analytical output derived from quantitative macroeconomic factor scoring and verified data releases. It does not constitute investment advice, trade recommendations, or guarantees of future market direction.
