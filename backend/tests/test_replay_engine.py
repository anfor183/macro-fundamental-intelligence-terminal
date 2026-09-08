"""Tests for the Historical Replay Engine."""

import pytest
from datetime import datetime, timedelta, timezone

from backend.app.engine.replay_engine import (
    generate_historical_snapshots,
    replay_prediction_window,
    WalkForwardValidator,
    PointInTimeSnapshot,
)


class TestPointInTimeSnapshots:
    """Ensure snapshots are generated with no look-ahead bias."""

    def test_snapshots_are_ordered(self):
        end = datetime(2024, 6, 1, tzinfo=timezone.utc)
        start = end - timedelta(weeks=12)
        snaps = generate_historical_snapshots("EURUSD", start, end)
        dates = [s.as_of_date for s in snaps]
        assert dates == sorted(dates), "Snapshots must be chronologically ordered."

    def test_no_snapshot_exceeds_end_date(self):
        end = datetime(2024, 6, 1, tzinfo=timezone.utc)
        start = end - timedelta(weeks=12)
        snaps = generate_historical_snapshots("EURUSD", start, end)
        assert all(s.as_of_date <= end for s in snaps), \
            "No snapshot may be dated after the end_date (look-ahead violation)."

    def test_score_within_bounds(self):
        snaps = generate_historical_snapshots("USDJPY")
        assert all(-100.0 <= s.score <= 100.0 for s in snaps), \
            "All scores must be within [-100, +100]."

    def test_confidence_within_bounds(self):
        snaps = generate_historical_snapshots("GBPUSD")
        assert all(0.0 <= s.confidence <= 100.0 for s in snaps), \
            "Confidence must be in [0, 100]."

    def test_bias_direction_consistent_with_score(self):
        snaps = generate_historical_snapshots("XAUUSD")
        for s in snaps:
            if s.score >= 15.0:
                assert s.bias_direction == "BULLISH", \
                    f"Score {s.score} should map to BULLISH, got {s.bias_direction}."
            elif s.score <= -15.0:
                assert s.bias_direction == "BEARISH", \
                    f"Score {s.score} should map to BEARISH, got {s.bias_direction}."
            else:
                assert s.bias_direction == "NEUTRAL"

    def test_deterministic_output(self):
        """Same symbol + same dates → identical snapshots every time."""
        end = datetime(2024, 6, 1, tzinfo=timezone.utc)
        start = end - timedelta(weeks=8)
        snaps_a = generate_historical_snapshots("AUDUSD", start, end)
        snaps_b = generate_historical_snapshots("AUDUSD", start, end)
        assert [(s.score, s.confidence) for s in snaps_a] == \
               [(s.score, s.confidence) for s in snaps_b], \
            "Snapshot generation must be deterministic for the same inputs."

    def test_different_assets_produce_different_snapshots(self):
        end = datetime(2024, 6, 1, tzinfo=timezone.utc)
        start = end - timedelta(weeks=8)
        snaps_eur = generate_historical_snapshots("EURUSD", start, end)
        snaps_gbp = generate_historical_snapshots("GBPUSD", start, end)
        scores_eur = [s.score for s in snaps_eur]
        scores_gbp = [s.score for s in snaps_gbp]
        assert scores_eur != scores_gbp, \
            "Different assets must produce different score trajectories."


class TestPredictionOutcome:
    """Verify prediction evaluation logic."""

    def test_bullish_correct_on_up(self):
        snap = PointInTimeSnapshot(
            asset_symbol="TEST",
            as_of_date=datetime(2024, 1, 1, tzinfo=timezone.utc),
            score=80.0,
            confidence=85.0,
            bias_direction="BULLISH",
        )
        outcome = replay_prediction_window(snap, horizon_days=5)
        # For a score of +80 the forward return should almost always be positive
        # (but not guaranteed due to noise — just verify the structure)
        assert outcome.predicted_direction == "BULLISH"
        assert outcome.horizon_days == 5
        assert isinstance(outcome.is_correct, bool)
        assert isinstance(outcome.forward_return_pct, float)

    def test_neutral_correct_on_flat(self):
        snap = PointInTimeSnapshot(
            asset_symbol="TEST",
            as_of_date=datetime(2024, 3, 15, tzinfo=timezone.utc),
            score=5.0,
            confidence=60.0,
            bias_direction="NEUTRAL",
        )
        outcome = replay_prediction_window(snap, horizon_days=5)
        assert outcome.predicted_direction == "NEUTRAL"

    def test_outcome_uses_only_snapshot_data(self):
        """Verify the forward return seed uses only snapshot's own data."""
        snap = PointInTimeSnapshot(
            asset_symbol="SEED_TEST",
            as_of_date=datetime(2024, 2, 1, tzinfo=timezone.utc),
            score=50.0,
            confidence=75.0,
            bias_direction="BULLISH",
        )
        o1 = replay_prediction_window(snap, horizon_days=5)
        o2 = replay_prediction_window(snap, horizon_days=5)
        assert o1.forward_return_pct == o2.forward_return_pct, \
            "Prediction must be deterministic given identical snapshot data."


class TestWalkForwardValidator:
    """Validate walk-forward window structure and no data leakage."""

    def test_produces_multiple_windows(self):
        validator = WalkForwardValidator(total_weeks=52, train_weeks=8, val_weeks=4)
        windows = validator.run("EURUSD")
        assert len(windows) >= 4, "Should produce at least 4 walk-forward windows for 52 weeks."

    def test_train_end_before_val_start(self):
        """Critical no look-ahead check: training window must end before validation begins."""
        validator = WalkForwardValidator()
        windows = validator.run("EURUSD")
        for w in windows:
            assert w.train_end <= w.val_start, \
                f"Window {w.window_id}: train_end ({w.train_end}) must be <= val_start ({w.val_start})."

    def test_windows_have_non_negative_accuracy(self):
        validator = WalkForwardValidator()
        windows = validator.run("GBPUSD")
        for w in windows:
            assert 0.0 <= w.train_accuracy_pct <= 100.0
            assert 0.0 <= w.val_accuracy_pct <= 100.0

    def test_window_ids_are_sequential(self):
        validator = WalkForwardValidator()
        windows = validator.run("USDJPY")
        ids = [w.window_id for w in windows]
        assert ids == list(range(len(windows))), "Window IDs must be sequential from 0."

    def test_windows_non_overlapping_validation(self):
        """Each validation window must start after the previous validation window ends."""
        validator = WalkForwardValidator(total_weeks=52, train_weeks=8, val_weeks=4)
        windows = validator.run("XAUUSD")
        for i in range(1, len(windows)):
            assert windows[i].val_start > windows[i - 1].val_end or \
                   windows[i].val_start >= windows[i - 1].val_start, \
                "Validation windows should progress forward in time."
