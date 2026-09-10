"""Unit tests for the 15-Year Historical Macro-Fundamental Backtest and Forward Validator."""

import pytest
from backend.app.backtest.historical_15y_dataset import (
    get_15y_dataset,
    REGIMES_15Y,
    HistoricalMacroObservation,
)
from backend.app.backtest.historical_15y_validator import (
    Historical15YearValidator,
    report_15y_to_dict,
)


class Test15YearDatasetIntegrity:
    """Verify chronological monotonicity and point-in-time integrity of the 15-year dataset."""

    def test_total_weekly_observations(self):
        dataset = get_15y_dataset()
        assert len(dataset) == 780, f"Expected 780 weeks, got {len(dataset)}"

    def test_strictly_monotonic_dates(self):
        dataset = get_15y_dataset()
        for i in range(len(dataset) - 1):
            assert dataset[i].observation_date < dataset[i + 1].observation_date, (
                f"Date inversion at index {i}: {dataset[i].observation_date} >= {dataset[i+1].observation_date}"
            )

    def test_regimes_coverage(self):
        dataset = get_15y_dataset()
        regime_ids = {obs.regime_id for obs in dataset}
        expected_ids = {r["id"] for r in REGIMES_15Y}
        assert regime_ids == expected_ids
        assert len(REGIMES_15Y) == 5

    def test_asset_prices_strictly_positive(self):
        dataset = get_15y_dataset()
        for obs in dataset:
            assert obs.eurusd_price > 0.5 and obs.eurusd_price < 2.5
            assert obs.usdjpy_price > 50.0 and obs.usdjpy_price < 200.0
            assert obs.spx_price > 800.0 and obs.spx_price < 10000.0
            assert obs.xauusd_price > 800.0 and obs.xauusd_price < 5000.0


class TestPointInTimeGuarantee:
    """Prove that fundamental scores at T_0 depend strictly on data available at or before T_0."""

    def test_no_future_data_leakage(self):
        dataset = get_15y_dataset()
        test_index = 350
        obs = dataset[test_index]
        prev = dataset[test_index - 8]

        score_full, bias_full, conf_full = Historical15YearValidator.compute_point_in_time_score(
            obs, "EURUSD", prev
        )

        # Truncate dataset up to test_index
        truncated_dataset = dataset[: test_index + 1]
        obs_trunc = truncated_dataset[-1]
        prev_trunc = truncated_dataset[-9]

        score_trunc, bias_trunc, conf_trunc = Historical15YearValidator.compute_point_in_time_score(
            obs_trunc, "EURUSD", prev_trunc
        )

        assert score_full == score_trunc
        assert bias_full == bias_trunc
        assert conf_full == conf_trunc


class Test15YearBacktestEngine:
    """Test performance, metrics, and empirical verification across assets."""

    def test_eurusd_15y_backtest(self):
        report = Historical15YearValidator.run_15y_validation("EURUSD", horizon_weeks=4)
        assert report.asset_symbol == "EURUSD"
        assert report.total_weeks == 780
        assert report.total_signals == 776
        assert report.overall_hit_rate_pct > 50.0  # Above coin-toss
        assert -1.0 <= report.information_coefficient <= 1.0
        assert len(report.regime_breakdowns) == 5
        assert len(report.milestone_case_studies) >= 5
        assert len(report.equity_curve) > 100

    def test_spx_15y_backtest(self):
        report = Historical15YearValidator.run_15y_validation("SPX", horizon_weeks=4)
        assert report.asset_symbol == "SPX"
        assert report.bullish_hit_rate_pct > 55.0
        assert report.sharpe_equivalent > 0.5
        assert report.overall_hit_rate_pct > 55.0

    def test_xauusd_15y_backtest(self):
        report = Historical15YearValidator.run_15y_validation("XAUUSD", horizon_weeks=4)
        assert report.asset_symbol == "XAUUSD"
        assert report.bullish_hit_rate_pct > 50.0

    def test_different_horizon_horizons(self):
        r1 = Historical15YearValidator.run_15y_validation("EURUSD", horizon_weeks=1)
        r4 = Historical15YearValidator.run_15y_validation("EURUSD", horizon_weeks=4)
        r12 = Historical15YearValidator.run_15y_validation("EURUSD", horizon_weeks=12)

        assert r1.evaluated_horizon_weeks == 1
        assert r4.evaluated_horizon_weeks == 4
        assert r12.evaluated_horizon_weeks == 12
        assert r1.total_signals == 779
        assert r12.total_signals == 768

    def test_nzdusd_15y_backtest(self):
        report = Historical15YearValidator.run_15y_validation("NZDUSD", horizon_weeks=4)
        assert report.asset_symbol == "NZDUSD"
        assert report.total_signals == 776
        assert report.overall_hit_rate_pct > 50.0
        assert len(report.regime_breakdowns) == 5

    def test_btcusd_15y_backtest(self):
        report = Historical15YearValidator.run_15y_validation("BTCUSD", horizon_weeks=4)
        assert report.asset_symbol == "BTCUSD"
        assert report.total_signals == 776
        assert report.overall_hit_rate_pct > 50.0
        assert len(report.regime_breakdowns) == 5

    def test_ndx_15y_backtest(self):
        report = Historical15YearValidator.run_15y_validation("NDX", horizon_weeks=4)
        assert report.asset_symbol == "NDX"
        assert report.total_signals == 776
        assert report.overall_hit_rate_pct > 50.0
        assert len(report.regime_breakdowns) == 5

    def test_xagusd_15y_backtest(self):
        report = Historical15YearValidator.run_15y_validation("XAGUSD", horizon_weeks=4)
        assert report.asset_symbol == "XAGUSD"
        assert report.total_signals == 776
        assert report.overall_hit_rate_pct > 50.0
        assert len(report.regime_breakdowns) == 5

    def test_audusd_15y_backtest(self):
        report = Historical15YearValidator.run_15y_validation("AUDUSD", horizon_weeks=4)
        assert report.asset_symbol == "AUDUSD"
        assert report.total_signals == 776
        assert report.overall_hit_rate_pct > 50.0

    def test_usdcad_15y_backtest(self):
        report = Historical15YearValidator.run_15y_validation("USDCAD", horizon_weeks=4)
        assert report.asset_symbol == "USDCAD"
        assert report.total_signals == 776
        assert report.overall_hit_rate_pct > 50.0

    def test_usdchf_15y_backtest(self):
        report = Historical15YearValidator.run_15y_validation("USDCHF", horizon_weeks=4)
        assert report.asset_symbol == "USDCHF"
        assert report.total_signals == 776
        assert report.overall_hit_rate_pct > 50.0

    def test_report_serialization(self):
        report = Historical15YearValidator.run_15y_validation("USDJPY", horizon_weeks=4)
        d = report_15y_to_dict(report)
        assert isinstance(d, dict)
        assert d["asset_symbol"] == "USDJPY"
        assert "regime_breakdowns" in d
        assert "equity_curve" in d
        assert "milestone_case_studies" in d

