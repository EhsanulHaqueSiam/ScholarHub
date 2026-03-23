"""Consecutive failure and yield drop detection for scraper rot."""

from __future__ import annotations

FAILURE_THRESHOLD = 5  # Alert after this many consecutive failures
DEACTIVATE_THRESHOLD = 10  # Auto-deactivate after this many
YIELD_DROP_RATIO = 0.5  # Flag if yield drops below 50% of average

# Fast-fail buckets for permanently broken endpoints.
FAST_DEACTIVATE_THRESHOLDS = {
    "404": 1,      # URL removed
    "410": 1,      # URL permanently gone
    "dns_error": 3,  # Host no longer resolves
    "tls_error": 3,  # Persistent TLS/certificate failures
}


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
        if last_error_type in FAST_DEACTIVATE_THRESHOLDS:
            threshold = FAST_DEACTIVATE_THRESHOLDS[last_error_type]
            return consecutive_failures >= threshold
        if consecutive_failures >= DEACTIVATE_THRESHOLD:
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
        # Try to infer HTTP status from exceptions like httpx.HTTPStatusError.
        if status_code is None and exception is not None:
            response = getattr(exception, "response", None)
            response_status = getattr(response, "status_code", None)
            if isinstance(response_status, int):
                status_code = response_status

        if status_code == 429:
            return "rate_limited"
        if status_code in (403,):
            return "blocked"
        if status_code in (404, 410):
            return str(status_code)
        if status_code and status_code >= 500:
            return "network_error"
        if exception:
            exc_name = type(exception).__name__.lower()
            message = str(exception).lower()

            if "could not resolve host" in message or "failed to resolve" in message:
                return "dns_error"
            if "name resolution" in message or "name or service not known" in message:
                return "dns_error"

            if "ssl certificate problem" in message:
                return "tls_error"
            if "certificate has expired" in message or "unable to get local issuer certificate" in message:
                return "tls_error"
            if "no alternative certificate subject name matches" in message:
                return "tls_error"
            if "tls connect error" in message:
                return "tls_error"

            if "404 not found" in message or "status code 404" in message:
                return "404"
            if "status code 410" in message or "410 gone" in message:
                return "410"

            if "timeout" in exc_name or "timed out" in message or "timeout" in message:
                return "timeout"
            if "connect" in exc_name or "failed to connect" in message or "connection refused" in message:
                return "network_error"
            if "429" in message:
                return "rate_limited"
            if "403" in message and "forbidden" in message:
                return "blocked"

        return "parse_error"
