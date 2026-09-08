# Data Sources, Reliability Registry & Provenance

## 1. Source Reliability Tiers

Every piece of data ingested into the system is classified by reliability tier:

| Tier | Category | Reliability Score | Examples |
|---|---|---|---|
| **Tier 1** | Official Primary Sources | 97% – 99% | Federal Reserve, ECB, BoE, BoJ, BLS, BEA, Eurostat, ONS, EIA |
| **Tier 2** | Institutional & Major Media | 88% – 92% | Reuters, Bloomberg, Financial Times, WSJ, Goldman Sachs, JPMorgan |
| **Tier 3** | Professional Secondary Analysis | 80% – 85% | Specialized macro research firms, accredited economists |
| **Tier 4** | Specialist & Industry Intelligence | 75% – 85% | OPEC Secretariat, World Gold Council, IEA |
| **Tier 5** | Unverified / Social | < 50% | Unverified social media claims (Excluded from primary scoring) |

---

## 2. Ingestion Resilience & Circuit Breakers

All external ingestion adapters inherit from `BaseIngestor` in `backend/app/ingestion/base.py`:
- **Timeout Controls**: Strict 8.0s per request to avoid blocking workers.
- **Exponential Backoff**: Up to 3 retries on transient network disconnects.
- **Circuit Breakers**: If 5 consecutive failures occur on any source, the circuit breaker opens for 180 seconds, isolating the failure without crashing the platform.
- **Error Observability**: Every failed request increments `error_count` on the `NewsSource` record, visible in the System Health monitor.

---

## 3. Deduplication & Semantic Event Clustering

To prevent 25 syndicated wire copies of one breaking release from multiplying its quantitative weight 25 times:
1. **Normalized Content Hashing**: SHA-256 hash computed across normalized titles and leads.
2. **Semantic Cluster ID (`event_cluster_id`)**: Articles sharing identical entities, category, and date window are clustered together.
3. **Syndication Counter**: The primary event score is applied once; subsequent copies increment `duplicate_count` to boost confirmation reliability without double-counting the impact.

---

## 4. Fact vs. Opinion vs. Forecast Classification

Every institutional statement is labeled:
- `FACT`: Verified economic statistic with numerical release.
- `ANALYST OPINION`: Qualitative interpretation from bank strategists.
- `FORECAST`: Numerical forward projection.
- `MARKET EXPECTATION`: Market-implied pricing (e.g. Fed funds futures).
