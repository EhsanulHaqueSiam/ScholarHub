"""Tests for monitoring: HealthTracker, RotDetector, HeartbeatMonitor, GitHubIssueManager."""

import subprocess
from unittest.mock import MagicMock, patch

from scholarhub_pipeline.monitoring.github_issues import ISSUE_LABEL, GitHubIssueManager
from scholarhub_pipeline.monitoring.health import HealthTracker
from scholarhub_pipeline.monitoring.heartbeat import HeartbeatMonitor
from scholarhub_pipeline.monitoring.rot_detector import (
    DEACTIVATE_THRESHOLD,
    FAILURE_THRESHOLD,
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
            {"source_id": "source_1", "success": True, "records_found": 50},
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
                "records_found": 0,
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
        result = detector.classify_error(status_code=None, exception=ConnectionError())
        assert result == "network_error"


# --- HeartbeatMonitor tests ---


class TestHeartbeatMonitor:
    def test_update_is_noop_and_does_not_call_convex(self):
        client = _make_mock_client()
        monitor = HeartbeatMonitor(client)
        monitor.update()
        client.mutation.assert_not_called()

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


# --- GitHubIssueManager tests ---


class TestGitHubIssueManager:
    def test_create_rot_issue_calls_gh_cli(self):
        client = _make_mock_client()
        manager = GitHubIssueManager(client, repo="owner/ScholarHub")
        with patch("scholarhub_pipeline.monitoring.github_issues.subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(
                stdout="https://github.com/owner/ScholarHub/issues/42\n",
            )
            result = manager.create_rot_issue(
                source_name="DAAD",
                source_url="https://daad.de/scholarships",
                error_type="network_error",
                consecutive_failures=5,
                last_success="2026-03-15T10:00:00Z",
                suggested_fix="Check if site is reachable.",
            )
            assert result == 42
            mock_run.assert_called_once()
            call_args = mock_run.call_args[0][0]
            assert "gh" in call_args
            assert "issue" in call_args
            assert "create" in call_args
            assert "--label" in call_args
            assert ISSUE_LABEL in call_args

    def test_create_rot_issue_includes_source_info_in_title(self):
        client = _make_mock_client()
        manager = GitHubIssueManager(client, repo="owner/ScholarHub")
        with patch("scholarhub_pipeline.monitoring.github_issues.subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(
                stdout="https://github.com/owner/ScholarHub/issues/1\n",
            )
            manager.create_rot_issue(
                source_name="DAAD",
                source_url="https://daad.de",
                error_type="timeout",
                consecutive_failures=5,
                last_success=None,
                suggested_fix="Increase timeout.",
            )
            call_args = mock_run.call_args[0][0]
            title_idx = call_args.index("--title") + 1
            title = call_args[title_idx]
            assert "DAAD" in title
            assert "timeout" in title

    def test_create_rot_issue_returns_none_on_subprocess_failure(self):
        client = _make_mock_client()
        manager = GitHubIssueManager(client, repo="owner/ScholarHub")
        with patch("scholarhub_pipeline.monitoring.github_issues.subprocess.run") as mock_run:
            mock_run.side_effect = subprocess.CalledProcessError(1, "gh")
            result = manager.create_rot_issue(
                source_name="DAAD",
                source_url="https://daad.de",
                error_type="blocked",
                consecutive_failures=5,
                last_success=None,
                suggested_fix="Try StealthyFetcher.",
            )
            assert result is None

    def test_create_rot_issue_returns_none_on_timeout(self):
        client = _make_mock_client()
        manager = GitHubIssueManager(client, repo="owner/ScholarHub")
        with patch("scholarhub_pipeline.monitoring.github_issues.subprocess.run") as mock_run:
            mock_run.side_effect = subprocess.TimeoutExpired("gh", 30)
            result = manager.create_rot_issue(
                source_name="DAAD",
                source_url="https://daad.de",
                error_type="blocked",
                consecutive_failures=5,
                last_success=None,
                suggested_fix="Try StealthyFetcher.",
            )
            assert result is None

    def test_create_rot_issue_returns_none_when_repo_missing(self):
        client = _make_mock_client()
        manager = GitHubIssueManager(client, repo="")
        with patch("scholarhub_pipeline.monitoring.github_issues.subprocess.run") as mock_run:
            result = manager.create_rot_issue(
                source_name="DAAD",
                source_url="https://daad.de",
                error_type="blocked",
                consecutive_failures=5,
                last_success=None,
                suggested_fix="Try StealthyFetcher.",
            )
            assert result is None
            mock_run.assert_not_called()

    def test_create_rot_issue_returns_none_when_gh_missing(self):
        client = _make_mock_client()
        manager = GitHubIssueManager(client, repo="owner/ScholarHub")
        with patch("scholarhub_pipeline.monitoring.github_issues.subprocess.run") as mock_run:
            mock_run.side_effect = FileNotFoundError("gh")
            result = manager.create_rot_issue(
                source_name="DAAD",
                source_url="https://daad.de",
                error_type="blocked",
                consecutive_failures=5,
                last_success=None,
                suggested_fix="Try StealthyFetcher.",
            )
            assert result is None

    def test_close_issue_calls_gh_cli(self):
        client = _make_mock_client()
        manager = GitHubIssueManager(client, repo="owner/ScholarHub")
        with patch("scholarhub_pipeline.monitoring.github_issues.subprocess.run") as mock_run:
            mock_run.return_value = MagicMock()
            result = manager.close_issue(issue_number=42, source_name="DAAD")
            assert result is True
            call_args = mock_run.call_args[0][0]
            assert "gh" in call_args
            assert "issue" in call_args
            assert "close" in call_args
            assert "42" in call_args
            assert "--comment" in call_args

    def test_close_issue_returns_false_on_failure(self):
        client = _make_mock_client()
        manager = GitHubIssueManager(client, repo="owner/ScholarHub")
        with patch("scholarhub_pipeline.monitoring.github_issues.subprocess.run") as mock_run:
            mock_run.side_effect = subprocess.CalledProcessError(1, "gh")
            result = manager.close_issue(issue_number=42, source_name="DAAD")
            assert result is False

    def test_close_issue_returns_false_when_repo_missing(self):
        client = _make_mock_client()
        manager = GitHubIssueManager(client, repo="")
        with patch("scholarhub_pipeline.monitoring.github_issues.subprocess.run") as mock_run:
            result = manager.close_issue(issue_number=42, source_name="DAAD")
            assert result is False
            mock_run.assert_not_called()

    def test_close_issue_returns_false_when_gh_missing(self):
        client = _make_mock_client()
        manager = GitHubIssueManager(client, repo="owner/ScholarHub")
        with patch("scholarhub_pipeline.monitoring.github_issues.subprocess.run") as mock_run:
            mock_run.side_effect = FileNotFoundError("gh")
            result = manager.close_issue(issue_number=42, source_name="DAAD")
            assert result is False

    def test_suggest_fix_returns_text_for_each_error_type(self):
        client = _make_mock_client()
        manager = GitHubIssueManager(client, repo="owner/ScholarHub")
        error_types = [
            "network_error", "timeout", "rate_limited", "blocked",
            "parse_error", "empty_results", "schema_change",
        ]
        for error_type in error_types:
            suggestion = manager.suggest_fix(error_type, "https://example.com")
            assert len(suggestion) > 10, f"No suggestion for {error_type}"

    def test_suggest_fix_unknown_error_type(self):
        client = _make_mock_client()
        manager = GitHubIssueManager(client, repo="owner/ScholarHub")
        suggestion = manager.suggest_fix("unknown_type", "https://example.com")
        assert "example.com" in suggestion

    def test_suggest_fix_network_error_includes_url(self):
        client = _make_mock_client()
        manager = GitHubIssueManager(client, repo="owner/ScholarHub")
        suggestion = manager.suggest_fix("network_error", "https://daad.de")
        assert "daad.de" in suggestion
