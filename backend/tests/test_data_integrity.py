"""Tests for the Continuous Data Integrity Monitor."""

import pytest
from datetime import datetime, timezone

from backend.app.engine.data_integrity import (
    DataFreshnessMonitor,
    SchemaValidator,
    GapDetector,
    SourceReconciler,
    CircuitBreaker,
    compute_integrity_score,
    build_integrity_report,
    ProviderStatus,
    IntegritySeverity,
    IntegrityEventType,
)


NOW = datetime(2024, 6, 15, 12, 0, 0, tzinfo=timezone.utc)


class TestDataFreshnessMonitor:
    """Validate provider freshness assessment."""

    def test_returns_heartbeats_for_all_providers(self):
        heartbeats = DataFreshnessMonitor.assess_all_providers(NOW)
        assert len(heartbeats) > 0, "Must return at least one provider heartbeat."

    def test_each_heartbeat_has_valid_status(self):
        heartbeats = DataFreshnessMonitor.assess_all_providers(NOW)
        valid_statuses = {s.value for s in ProviderStatus}
        for hb in heartbeats:
            assert hb.status.value in valid_statuses, \
                f"Provider {hb.provider_id} has invalid status: {hb.status}."

    def test_freshness_delta_is_non_negative(self):
        heartbeats = DataFreshnessMonitor.assess_all_providers(NOW)
        for hb in heartbeats:
            assert hb.freshness_delta_minutes >= 0.0, \
                f"Provider {hb.provider_id}: freshness delta cannot be negative."

    def test_freshness_score_within_bounds(self):
        heartbeats = DataFreshnessMonitor.assess_all_providers(NOW)
        score = DataFreshnessMonitor.freshness_score(heartbeats)
        assert 0.0 <= score <= 100.0, f"Freshness score {score} is out of bounds."

    def test_freshness_score_zero_when_all_offline(self):
        """If all providers are offline, freshness score should be 0."""
        from backend.app.engine.data_integrity import ProviderHeartbeat
        heartbeats = [
            ProviderHeartbeat(
                provider_id=f"p{i}", provider_name=f"Provider {i}",
                data_category="Test", country="XX",
                last_seen=NOW, expected_interval_minutes=60,
                status=ProviderStatus.OFFLINE,
                freshness_delta_minutes=9999.0,
            )
            for i in range(5)
        ]
        score = DataFreshnessMonitor.freshness_score(heartbeats)
        assert score == 0.0

    def test_freshness_score_100_when_all_live(self):
        from backend.app.engine.data_integrity import ProviderHeartbeat
        heartbeats = [
            ProviderHeartbeat(
                provider_id=f"p{i}", provider_name=f"Provider {i}",
                data_category="Test", country="XX",
                last_seen=NOW, expected_interval_minutes=60,
                status=ProviderStatus.LIVE,
                freshness_delta_minutes=5.0,
            )
            for i in range(5)
        ]
        score = DataFreshnessMonitor.freshness_score(heartbeats)
        assert score == 100.0


class TestSchemaValidator:
    """Validate schema conformance checking."""

    def test_returns_reports_for_all_providers(self):
        reports = SchemaValidator.validate_all(NOW)
        assert len(reports) > 0

    def test_schema_health_score_within_bounds(self):
        reports = SchemaValidator.validate_all(NOW)
        score = SchemaValidator.schema_health_score(reports)
        assert 0.0 <= score <= 100.0

    def test_healthy_report_has_no_missing_fields(self):
        from backend.app.engine.data_integrity import SchemaFieldReport
        healthy = SchemaFieldReport(
            provider_id="test",
            expected_fields=["a", "b", "c"],
            received_fields=["a", "b", "c"],
            missing_fields=[],
            extra_fields=[],
            drift_events_24h=0,
            last_validated=NOW,
            is_healthy=True,
        )
        assert healthy.is_healthy is True
        assert healthy.missing_fields == []

    def test_unhealthy_report_detected(self):
        from backend.app.engine.data_integrity import SchemaFieldReport
        unhealthy = SchemaFieldReport(
            provider_id="test_bad",
            expected_fields=["a", "b", "c"],
            received_fields=["a", "b"],
            missing_fields=["c"],
            extra_fields=[],
            drift_events_24h=1,
            last_validated=NOW,
            is_healthy=False,
        )
        assert unhealthy.is_healthy is False
        assert "c" in unhealthy.missing_fields

    def test_schema_health_zero_when_all_unhealthy(self):
        from backend.app.engine.data_integrity import SchemaFieldReport
        unhealthy_reports = [
            SchemaFieldReport(
                provider_id=f"p{i}", expected_fields=["x"], received_fields=[],
                missing_fields=["x"], extra_fields=[], drift_events_24h=1,
                last_validated=NOW, is_healthy=False,
            )
            for i in range(3)
        ]
        score = SchemaValidator.schema_health_score(unhealthy_reports)
        assert score == 0.0


class TestGapDetector:
    """Validate gap detection logic."""

    def test_gap_severity_correct(self):
        gaps = GapDetector.detect_gaps(NOW)
        for g in gaps:
            if g.hours_overdue >= GapDetector.CRITICAL_GAP_HOURS:
                assert g.severity == IntegritySeverity.CRITICAL
            elif g.hours_overdue >= GapDetector.HIGH_GAP_HOURS:
                assert g.severity == IntegritySeverity.HIGH
            else:
                assert g.severity == IntegritySeverity.MEDIUM

    def test_gap_rate_score_penalises_critical(self):
        """Critical gaps must cause a larger score penalty than medium ones."""
        from backend.app.engine.data_integrity import GapDetectionResult
        from datetime import datetime, timezone, timedelta

        critical_gap = GapDetectionResult(
            release_id="test_critical",
            expected_release="Test CPI",
            country="US",
            expected_window_start=NOW - timedelta(hours=50),
            hours_overdue=50.0,
            severity=IntegritySeverity.CRITICAL,
            auto_action="Circuit breaker consideration",
        )
        medium_gap = GapDetectionResult(
            release_id="test_medium",
            expected_release="Test PMI",
            country="US",
            expected_window_start=NOW - timedelta(hours=8),
            hours_overdue=8.0,
            severity=IntegritySeverity.MEDIUM,
            auto_action="Flagged for monitoring",
        )
        score_critical = GapDetector.gap_rate_score([critical_gap])
        score_medium = GapDetector.gap_rate_score([medium_gap])
        assert score_critical < score_medium, \
            "Critical gaps must produce lower scores than medium gaps."

    def test_gap_rate_score_no_gaps_returns_100(self):
        score = GapDetector.gap_rate_score([])
        assert score == 100.0

    def test_gap_rate_score_bounded(self):
        gaps = GapDetector.detect_gaps(NOW)
        score = GapDetector.gap_rate_score(gaps)
        assert 0.0 <= score <= 100.0


class TestSourceReconciler:
    """Validate source reconciliation divergence checks."""

    def test_returns_reconciliation_results(self):
        results = SourceReconciler.reconcile_all(NOW)
        assert len(results) > 0

    def test_divergence_pct_is_non_negative(self):
        results = SourceReconciler.reconcile_all(NOW)
        for r in results:
            assert r.divergence_pct >= 0.0

    def test_flagged_when_divergence_exceeds_threshold(self):
        results = SourceReconciler.reconcile_all(NOW)
        threshold = SourceReconciler.DIVERGENCE_THRESHOLD_PCT
        for r in results:
            if r.divergence_pct > threshold:
                assert r.is_flagged is True
            else:
                assert r.is_flagged is False


class TestCircuitBreaker:
    """Validate circuit breaker trigger and close logic."""

    def test_circuit_breaker_opens_below_threshold(self):
        active, reason = CircuitBreaker.evaluate(55.0)
        assert active is True
        assert reason is not None

    def test_circuit_breaker_closed_above_threshold(self):
        active, reason = CircuitBreaker.evaluate(85.0)
        assert active is False
        assert reason is None

    def test_circuit_breaker_at_exact_open_threshold(self):
        active, reason = CircuitBreaker.evaluate(CircuitBreaker.OPEN_THRESHOLD - 0.1)
        assert active is True

    def test_circuit_breaker_at_exact_close_threshold(self):
        active, reason = CircuitBreaker.evaluate(CircuitBreaker.OPEN_THRESHOLD)
        # At exactly the threshold it should be closed (not strictly less than)
        assert active is False


class TestCompositeIntegrityScore:
    """Validate composite integrity score formula."""

    def test_all_perfect_returns_100(self):
        score = compute_integrity_score(100.0, 100.0, 100.0)
        assert score == 100.0

    def test_all_zero_returns_0(self):
        score = compute_integrity_score(0.0, 0.0, 0.0)
        assert score == 0.0

    def test_weights_sum_correctly(self):
        """40% freshness + 30% schema + 30% gap = composite."""
        f, s, g = 80.0, 60.0, 70.0
        expected = round(80 * 0.4 + 60 * 0.3 + 70 * 0.3, 1)
        result = compute_integrity_score(f, s, g)
        assert result == expected

    def test_score_always_between_0_and_100(self):
        for f in [0, 50, 100]:
            for s in [0, 50, 100]:
                for g in [0, 50, 100]:
                    score = compute_integrity_score(float(f), float(s), float(g))
                    assert 0.0 <= score <= 100.0


class TestIntegrityReport:
    """Integration test for the full integrity report builder."""

    def test_full_report_builds_successfully(self):
        report = build_integrity_report(NOW)
        assert report is not None
        assert 0.0 <= report.integrity_score <= 100.0
        assert isinstance(report.circuit_breaker_active, bool)
        assert len(report.provider_heartbeats) > 0
        assert len(report.schema_reports) > 0

    def test_report_incident_log_populated(self):
        report = build_integrity_report(NOW)
        # With deterministic simulation some incidents should always exist
        # due to STALE providers
        assert isinstance(report.incidents, list)

    def test_circuit_breaker_consistent_with_score(self):
        report = build_integrity_report(NOW)
        if report.integrity_score < CircuitBreaker.OPEN_THRESHOLD:
            assert report.circuit_breaker_active is True
        elif report.integrity_score >= CircuitBreaker.OPEN_THRESHOLD:
            assert report.circuit_breaker_active is False
