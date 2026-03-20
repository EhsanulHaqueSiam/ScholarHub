"""Tests for monitoring: HealthTracker, RotDetector, HeartbeatMonitor."""

import time
from unittest.mock import MagicMock, patch

from scholarhub_pipeline.monitoring.health import ERROR_TYPES, HealthTracker
from scholarhub_pipeline.monitoring.heartbeat import STALE_THRESHOLD_HOURS, HeartbeatMonitor
from scholarhub_pipeline.monitoring.rot_detector import (
    DEACTIVATE_THRESHOLD,
    FAILURE_THRESHOLD,
    YIELD_DROP_RATIO,
    RotDetector,
)


def _make_mock_client():
    """Create a mock PipelineConvexClient that records calls."""
    client = MagicMock()
    client.mutation = MagicMock(return_value={})
    client.query = MagicMock(return_value=None)
    return client


# --- HealthTracker tests ---


class TestHealthTracker:
    def test_record_success_calls_convex_mutation(self):
        client = _make_mock_client()
        tracker = HealthTracker(client)
        tracker.record_success("source_1", yield_count=50)
        client.mutation.assert_called_once_with(
            "scraping:updateSourceHealth",
            {"source_id": "source_1", "success": True, "yield_count": 50},
        )

    def test_record_success_returns_result(self):
        client = _make_mock_client()
        client.mutation.return_value = {"status": "healthy"}
        tracker = HealthTracker(client)
        result = tracker.record_success("source_1", yield_count=50)
        assert result == {"status": "healthy"}

    def test_record_failure_calls_convex_mutation(self):
        client = _make_mock_client()
        tracker = HealthTracker(client)
        tracker.record_failure("source_1", "network_error", "Connection refused")
        client.mutation.assert_called_once_with(
            "scraping:updateSourceHealth",
            {
                "source_id": "source_1",
                "success": False,
                "yield_count": 0,
                "error_type": "network_error",
                "error_message": "Connection refused",
            },
        )

    def test_record_failure_unknown_error_type_defaults_to_parse_error(self):
        client = _make_mock_client()
        tracker = HealthTracker(client)
        tracker.record_failure("source_1", "unknown_error", "Something broke")
        call_args = client.mutation.call_args[0][1]
        assert call_args["error_type"] == "parse_error"

    def test_record_failure_truncates_long_error_messages(self):
        client = _make_mock_client()
        tracker = HealthTracker(client)
        long_msg = "x" * 1000
        tracker.record_failure("source_1", "network_error", long_msg)
        call_args = client.mutation.call_args[0][1]
        assert len(call_args["error_message"]) == 500


# --- RotDetector tests ---


class TestRotDetector:
    def test_should_deactivate_true_when_failures_at_threshold(self):
        detector = RotDetector()
        assert detector.should_deactivate(consecutive_failures=DEACTIVATE_THRESHOLD) is True

    def test_should_deactivate_true_when_failures_above_threshold(self):
        detector = RotDetector()
        assert detector.should_deactivate(consecutive_failures=15) is True

    def test_should_deactivate_true_for_404_error(self):
        detector = RotDetector()
        assert detector.should_deactivate(consecutive_failures=1, last_error_type="404") is True

    def test_should_deactivate_true_for_410_error(self):
        detector = RotDetector()
        assert detector.should_deactivate(consecutive_failures=1, last_error_type="410") is True

    def test_should_deactivate_false_below_threshold(self):
        detector = RotDetector()
        assert detector.should_deactivate(consecutive_failures=3) is False

    def test_should_alert_true_at_failure_threshold(self):
        detector = RotDetector()
        assert detector.should_alert(consecutive_failures=FAILURE_THRESHOLD) is True

    def test_should_alert_false_below_threshold(self):
        detector = RotDetector()
        assert detector.should_alert(consecutive_failures=3) is False

    def test_should_alert_false_above_threshold(self):
        """Only alert exactly at threshold, not every subsequent failure."""
        detector = RotDetector()
        assert detector.should_alert(consecutive_failures=7) is False

    def test_detect_yield_drop_true_when_below_50_percent(self):
        detector = RotDetector()
        assert detector.detect_yield_drop(current_yield=15, avg_yield=40.0) is True

    def test_detect_yield_drop_false_when_at_50_percent(self):
        detector = RotDetector()
        assert detector.detect_yield_drop(current_yield=20, avg_yield=40.0) is False

    def test_detect_yield_drop_false_when_above_50_percent(self):
        detector = RotDetector()
        assert detector.detect_yield_drop(current_yield=50, avg_yield=40.0) is False

    def test_detect_yield_drop_false_when_avg_yield_is_none(self):
        detector = RotDetector()
        assert detector.detect_yield_drop(current_yield=5, avg_yield=None) is False

    def test_detect_yield_drop_false_when_avg_yield_is_zero(self):
        detector = RotDetector()
        assert detector.detect_yield_drop(current_yield=5, avg_yield=0) is False

    def test_classify_error_rate_limited(self):
        detector = RotDetector()
        assert detector.classify_error(status_code=429, exception=None) == "rate_limited"

    def test_classify_error_blocked(self):
        detector = RotDetector()
        assert detector.classify_error(status_code=403, exception=None) == "blocked"

    def test_classify_error_server_error(self):
        detector = RotDetector()
        assert detector.classify_error(status_code=500, exception=None) == "network_error"

    def test_classify_error_timeout_exception(self):
        detector = RotDetector()
        assert detector.classify_error(status_code=None, exception=TimeoutError()) == "timeout"

    def test_classify_error_connection_exception(self):
        detector = RotDetector()
        assert (
            detector.classify_error(status_code=None, exception=ConnectionError()) == "network_error"
        )


# --- HeartbeatMonitor tests ---


class TestHeartbeatMonitor:
    def test_update_calls_convex_mutation(self):
        client = _make_mock_client()
        monitor = HeartbeatMonitor(client)
        monitor.update()
        client.mutation.assert_called_once()
        call_name = client.mutation.call_args[0][0]
        assert call_name == "scraping:updateHeartbeat"

    def test_update_sends_timestamp_in_milliseconds(self):
        client = _make_mock_client()
        monitor = HeartbeatMonitor(client)
        before = int(time.time() * 1000)
        monitor.update()
        after = int(time.time() * 1000)
        call_args = client.mutation.call_args[0][1]
        assert before <= call_args["timestamp"] <= after

    def test_is_stale_returns_true_when_query_returns_true(self):
        client = _make_mock_client()
        client.query.return_value = True
        monitor = HeartbeatMonitor(client)
        assert monitor.is_stale() is True

    def test_is_stale_returns_false_when_query_returns_false(self):
        client = _make_mock_client()
        client.query.return_value = False
        monitor = HeartbeatMonitor(client)
        assert monitor.is_stale() is False

    def test_is_stale_calls_correct_query(self):
        client = _make_mock_client()
        client.query.return_value = False
        monitor = HeartbeatMonitor(client)
        monitor.is_stale()
        client.query.assert_called_once_with("monitoring:getStaleHeartbeat", {})
