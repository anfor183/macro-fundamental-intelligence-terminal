# System Architecture & Technical Specification

## 1. Overview
The **Automated Macro Fundamental Intelligence Platform** is architected as an asynchronous, decoupled, multi-tier system engineered for institutional-grade reliability, transparent explainability, and zero hallucination.

```
+-------------------------------------------------------------------------+
|                        Institutional Trading UI                         |
|      (React 18 + TypeScript + Vite + Dark Bloomberg Theme)             |
+------------------------------------+------------------------------------+
                                     | REST & WebSocket
+------------------------------------v------------------------------------+
|                         FastAPI Gateway (v1)                            |
|    - Asset Deep-Dives      - Macro Regime        - Currency Matrix      |
|    - What Changed Log      - Scenario Simulator  - Report Exporter      |
+------------------------------------+------------------------------------+
                                     |
+------------------------------------v------------------------------------+
|                   Quantitative Macro Engine                             |
|  +-----------------------+ +--------------------+ +-------------------+ |
|  | Factor Scorer (-100)  | | Relative Model     | | Regime Detector   | |
|  | (14 Dimensions)       | | (Base - Quote)     | | (Risk / Cycles)   | |
|  +-----------------------+ +--------------------+ +-------------------+ |
|  +-----------------------+ +--------------------+ +-------------------+ |
|  | Bias Classifier (7)   | | Conflict Detector  | | Time Decay Engine | |
|  | (Tactical vs Weekly)  | | (Confidence Pen.)  | | (Category T_1/2)  | |
|  +-----------------------+ +--------------------+ +-------------------+ |
+------------------------------------+------------------------------------+
                                     |
+------------------------------------v------------------------------------+
|                    Event Normalization & Extraction                     |
|  - Content Hashing (SHA-256)       - Event Clustering (cluster_id)      |
|  - Surprise Engine (Z-scores)      - Fact vs. Opinion Classifier        |
+------------------------------------+------------------------------------+
                                     |
+------------------------------------v------------------------------------+
|                         Ingestion Adapters                              |
|  - Official Central Banks          - Statistical Bureaus (BLS, BEA)     |
|  - Reputable Media RSS             - Institutional Bank Research        |
|  - Scenario Simulator              - Circuit Breakers & Backoff         |
+------------------------------------+------------------------------------+
                                     |
+------------------------------------v------------------------------------+
|                   Persistence & Audit Storage                           |
|       SQLAlchemy 2.0 Async (SQLite Default / PostgreSQL Ready)          |
|   Assets | Releases | Factors | BiasSnapshots | Provenance | Alerts     |
+-------------------------------------------------------------------------+
```

## 2. Directory Structure
```
fx fundamentals/
├── backend/
│   ├── app/
│   │   ├── api/routes.py            # FastAPI REST endpoints
│   │   ├── core/                    # Config, DB connection, seeder, constants
│   │   ├── models/                  # Normalized SQLAlchemy 2.0 models
│   │   ├── schemas/                 # Pydantic v2 strict schemas
│   │   ├── ingestion/               # Base ingestor, RSS, calendar, simulator
│   │   ├── processing/              # Deduplication, surprise, decay, exposure
│   │   ├── scoring/                 # Factor scorer, relative currency, cross-asset
│   │   ├── engine/                  # Regime, bias thresholds, confidence, what-changed
│   │   ├── intelligence/            # Grounded AI explanation & extraction
│   │   ├── backtest/                # Historical testing & calibration engine
│   │   └── export/                  # PDF and CSV report exporter
│   ├── tests/                       # 24 automated unit & acceptance tests
│   └── data/                        # Local SQLite database directory
├── frontend/
│   ├── src/
│   │   ├── components/              # Terminal views, tables, modals, cards
│   │   ├── services/api.ts          # Strongly-typed API client
│   │   ├── types/macro.ts           # Core TypeScript data structures
│   │   └── index.css                # Institutional dark design system
│   └── dist/                        # Production build bundle
├── docker/                          # Backend & Frontend Dockerfiles
├── docs/                            # Complete technical documentation suite
├── .env.example
├── docker-compose.yml
├── requirements.txt
└── README.md
```

## 3. Core Database Entities
- **Assets**: 50 assets with asset class, base/quote currencies, and daily metrics.
- **Currencies**: 11 global currencies linked to their central banks.
- **CentralBanks**: Policy rates, guidance stance (Hawkish/Dovish), meeting schedules.
- **EconomicIndicators & Releases**: Consensus, previous, actual, surprise, z-score.
- **NewsSources**: Tier 1 to 5 reliability registry with error tracking.
- **NewsEvents**: Deduplicated articles clustered under `event_cluster_id`.
- **MacroScores & BiasSnapshots**: Normalized scores, factor waterfalls, scenarios, invalidations.
- **BiasChanges**: Chronological audit trail powering "What Changed Today?".
