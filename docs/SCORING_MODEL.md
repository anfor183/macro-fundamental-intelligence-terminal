# Macro Scoring & Bias Methodology

## 1. Mathematical Scoring Principles

### A. Normalized Bounded Scale
Every factor and aggregate asset score is strictly bounded between **-100.0 (Extremely Bearish)** and **+100.0 (Extremely Bullish)** with **0.0 as Neutral**.

### B. Expectation-vs-Actual Surprise Model
For any economic indicator release $k$:
$$\text{Surprise}_k = \text{Actual}_k - \text{Consensus}_k$$
$$\text{Z-Score}_k = \frac{\text{Actual}_k - \text{Consensus}_k}{\sigma_{\text{historical}}}$$
$$\text{Momentum}_k = \text{Actual}_k - \text{Previous}_k$$

Where $\sigma_{\text{historical}}$ is the trailing 3-year standard deviation of consensus forecast errors for that specific release.

- **Hawkish Repricing**: If $Z_k \ge +0.3$ on inflation or labor data, impact score increases proportionally:
  $$\text{Impact}_k = \min(100.0, Z_k \times 30.0)$$
- **Dovish Repricing**: If $Z_k \le -0.3$, impact score decreases:
  $$\text{Impact}_k = \max(-100.0, Z_k \times 30.0)$$
- **Mixed Signals**: If $\text{Surprise}_k < 0$ (disinflationary beat) but $\text{Momentum}_k > 0$ (rising vs prior month), the system flags a mixed signal, tempering short-term dovish impulse with medium-term persistence.

### C. Exponential Time Decay Model
The influence of any macro release decays over time according to its category half-life $T_{1/2}$:
$$\lambda = \frac{\ln(2)}{T_{1/2}}$$
$$\text{Current Impact}(t) = \text{Initial Impact} \times e^{-\lambda (t - t_0)}$$

| Macro Dimension | Half-Life ($T_{1/2}$) | Rationale |
|---|---|---|
| Monetary Policy & Central Banks | 21.0 Days | Rate decisions & forward guidance anchor pricing until next meeting cycle |
| Inflation (CPI, PCE) | 14.0 Days | Monthly inflation prints remain benchmark until next release |
| Labor Market (NFP) | 14.0 Days | Employment baseline anchors rate path for two weeks |
| Economic Growth (GDP, PMIs) | 14.0 Days | Growth trajectory anchors cyclical risk |
| Trade & External Balances | 14.0 Days | Current accounts adjust slowly |
| Commodities & Inventory | 7.0 Days | EIA weekly inventory prints decay in one week |
| Geopolitics | 5.0 Days | Headline shocks decay rapidly unless active conflict escalates |
| Risk Sentiment | 3.0 Days | Market mood swings have highest velocity decay |

An event is flagged as `STALE` if $\Delta t > 2 \times T_{1/2}$.

---

## 2. Dynamic Weighting Framework by Asset Class

$$\text{Final Macro Score} = \sum_{i=1}^{N} w_i \times \text{Factor Score}_i, \quad \text{where } \sum w_i = 1.0$$

### Currency Weights (Forex)
- Monetary Policy Guidance: 20%
- Rates & Yield Differentials: 15%
- Inflation Surprises: 12%
- Economic Growth (GDP/PMIs): 12%
- Labor Market Health: 10%
- Risk Sentiment / Safe Haven: 10%
- Institutional Consensus: 6%
- Trade & External Balances: 5%
- Fiscal Deficit & Debt: 5%
- Commodity Terms of Trade: 5%

### Precious Metals (Gold / Silver)
- US Real Yields (10Y TIPS): 25%
- US Dollar Denominator (DXY): 20%
- Fed Policy Path Expectations: 15%
- Geopolitical Risk & Safe Haven: 15%
- Inflation Hedge Demand: 10%
- Central Bank Reserve Buying: 10%
- Risk Sentiment: 5%

### Energy Commodities (WTI / Brent)
- Physical Supply & OPEC+ Discipline: 25%
- Global Growth & China Demand: 25%
- Inventory Draws (EIA/API): 15%
- Geopolitical Supply Disruptions: 15%
- US Dollar Denominator Effect: 10%
- Global Risk Appetite: 10%

---

## 3. Currency Relative-Value Model
For currency pair $B/Q$ (e.g., EUR/USD):
$$\text{Relative Score}_{B/Q} = (\text{Score}_B - \text{Score}_Q) + (0.15 \times \Delta\text{Yield}_{B/Q}) + \text{TermsOfTradeAdjustment}$$

Clamped strictly between -100.0 and +100.0.

---

## 4. Bias Categorization Thresholds

| Score Range | Categorical Bias | Actionable Stance |
|---|---|---|
| $+70.0 \text{ to } +100.0$ | **STRONG BULLISH** | Maximum fundamental momentum |
| $+40.0 \text{ to } +69.99$ | **BULLISH** | Clear fundamental tailwinds |
| $+15.0 \text{ to } +39.99$ | **MILD BULLISH** | Constructive with slight headwinds |
| $-14.99 \text{ to } +14.99$ | **NEUTRAL** | Balanced or conflicting macro cross-currents |
| $-39.99 \text{ to } -15.0$ | **MILD BEARISH** | Deteriorating macro conditions |
| $-69.99 \text{ to } -40.0$ | **BEARISH** | Clear fundamental headwinds |
| $-100.0 \text{ to } -70.0$ | **STRONG BEARISH** | Severe macroeconomic contraction/outflow |

---

## 5. Confidence Calculation & Conflict Penalty

$$\text{Confidence} = (\text{DataCompleteness} \times 0.45) + \text{SourceReliabilityBonus} - \text{ConflictPenalty}$$

If opposing forces exist (e.g. Hawkish Central Bank $+60$ vs Collapsing Labor $-60$), the engine extracts the contradiction and applies a **15% to 30% penalty discount** to the confidence score, surfacing an explicit contradiction warning on the terminal.
