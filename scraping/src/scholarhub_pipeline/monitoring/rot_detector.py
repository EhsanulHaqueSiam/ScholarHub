"""Consecutive failure and yield drop detection for scraper rot."""

from __future__ import annotations

FAILURE_THRESHOLD = 5  # Alert after this many consecutive failures
DEACTIVATE_THRESHOLD = 10  # Auto-deactivate after this many
YIELD_DROP_RATIO = 0.5  # Flag if yield drops below 50% of average
PERMANENT_GONE_ERRORS = ["404", "410"]  # Site permanently removed


class RotDetector:
    """Detect scraper rot patterns."""

    def should_alert(self, consecutive_failures: int) -> bool:
        """Return True if we should create a GitHub Issue.

        Only alerts at exactly the threshold to avoid duplicate issues.

        Args:
            consecutive_failures: Number of consecutive failures.

        Returns:
            True if alert should be created.
        """
        return consecutive_failures == FAILURE_THRESHOLD

    def should_deactivate(
        self,
        consecutive_failures: int,
        last_error_type: str | None = None,
    ) -> bool:
        """Return True if source should be auto-deactivated.

        Args:
            consecutive_failures: Number of consecutive failures.
            last_error_type: Most recent error type string.

        Returns:
            True if source should be deactivated.
        """
        if consecutive_failures >= DEACTIVATE_THRESHOLD:
            return True
        if last_error_type in PERMANENT_GONE_ERRORS:
            return True
        return False

    def detect_yield_drop(self, current_yield: int, avg_yield: float | None) -> bool:
        """Return True if current yield is significantly below historical average.

        Args:
            current_yield: Number of records from current scrape.
            avg_yield: Rolling average yield (None if no history).

        Returns:
            True if yield dropped below threshold.
        """
        if avg_yield is None or avg_yield == 0:
            return False
        return current_yield < (avg_yield * YIELD_DROP_RATIO)

    def classify_error(self, status_code: int | None, exception: Exception | None) -> str:
        """Classify an error into one of the standard error categories.

        Args:
            status_code: HTTP status code if available.
            exception: Python exception if available.

        Returns:
            Error category string.
        """
        if status_code == 429:
            return "rate_limited"
        if status_code in (403,):
            return "blocked"
        if status_code in (404, 410):
            return str(status_code)
        if status_code and status_code >= 500:
            return "network_error"
        if exception:
            exc_name = type(exception).__name__
            if "timeout" in exc_name.lower():
                return "timeout"
            if "connect" in exc_name.lower():
                return "network_error"
        return "parse_error"
