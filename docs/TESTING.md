# Testing & Acceptance Verification

## 1. Automated Test Suite

Run the full automated test suite:
```bash
python3 -m pytest backend/tests -v
```

### Coverage Overview (24 Automated Tests)
1. **Surprise Engine (`test_surprise.py`)**:
   - Upside inflation surprise (hawkish repricing)
   - Downside inflation surprise (dovish repricing)
   - Mixed trend detection (disinflationary beat vs rising momentum)
   - In-line release threshold handling
2. **Deduplication Engine (`test_deduplication.py`)**:
   - Normalized text stripping
   - Content hashing determinism
   - Event cluster ID grouping across syndicated media
3. **Scoring Engine (`test_scoring.py`)**:
   - Weighted macro scoring bounded [-100, +100]
   - Currency relative value model ($B - Q$)
   - 11-currency strength ranking
4. **Bias Engine (`test_bias.py`)**:
   - Categorical threshold bands (7 categories)
   - Contradiction detection penalizing confidence
   - Insufficient data warning state
5. **Decay Engine (`test_decay.py`)**:
   - Exponential half-life decay calculation
   - Stale data detection beyond 2 half-lives
6. **API Integration (`test_api.py`)**:
   - REST endpoints for assets, regime, matrix, rankings, gold, oil, backtesting
7. **Acceptance Simulation (`test_simulation.py`)**:
   - Full Acceptance Tests 1 through 15:
     Economic release ingested $\to$ surprise calculated $\to$ mapped to assets $\to$ scored $\to$ score changed $\to$ bias changed $\to$ "what changed" displays delta and catalyst.
