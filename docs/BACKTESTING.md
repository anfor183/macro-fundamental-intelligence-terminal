# Backtesting & Statistical Calibration

## 1. Methodology
The backtesting engine tests the persistence and predictive value of the quantitative macro bias against forward price movements:
- **Evaluation Windows**: Configurable 3, 5, 10, or 20 days holding periods.
- **Directional Hit Rate**: Measures the percentage of times an asset moved in the predicted direction when the model established a moderate or strong bias ($|\text{Score}| \ge 40.0$).
- **Regime Performance**: Segregates hit rates across differing market environments (e.g. Disinflationary Growth vs. Stagflationary Risk).

## 2. Weight Optimization & Calibration
Using historical release correlations, the calibration engine runs linear regression to calculate:
- Optimal factor weights
- t-statistics of factor significance
- p-values testing whether a factor has statistically significant explanatory power
