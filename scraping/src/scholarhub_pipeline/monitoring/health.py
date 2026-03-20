"""Source health tracking and status transitions."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

import structlog

if TYPE_CHECKING:
    from scholarhub_pipeline.ingestion.convex_client import PipelineConvexClient

logger = structlog.get_logger()

ERROR_TYPES = [
    "network_error",
    "timeout",
    "rate_limited",
    "blocked",
    "parse_error",
    "empty_results",
    "schema_change",
]


class HealthTracker:
    """Track per-source health status, update Convex."""

    def __init__(self, convex_client: PipelineConvexClient) -> None:
        """Initialize with a Convex client.

        Args:
            convex_client: Client for Convex mutations.
        """
        self.convex = convex_client

    def record_success(self, source_id: str, yield_count: int) -> dict[str, Any]:
        """Record successful scrape, update health status.

        Args:
            source_id: The source identifier.
            yield_count: Number of records scraped.

        Returns:
            Updated source_health record from Convex.
        """
        result = self.convex.mutation(
            "scraping:updateSourceHealth",
            {
                "source_id": source_id,
                "success": True,
                "yield_count": yield_count,
            },
        )
        logger.info("source_health_success", source_id=source_id, yield_count=yield_count)
        return result

    def record_failure(
        self,
        source_id: str,
        error_type: str,
        error_message: str,
    ) -> dict[str, Any]:
        """Record failed scrape, update health status.

        Args:
            source_id: The source identifier.
            error_type: Category of error (from ERROR_TYPES).
            error_message: Descriptive error message.

        Returns:
            Updated source_health record from Convex.
        """
        if error_type not in ERROR_TYPES:
            error_type = "parse_error"  # default bucket
        result = self.convex.mutation(
            "scraping:updateSourceHealth",
            {
                "source_id": source_id,
                "success": False,
                "yield_count": 0,
                "error_type": error_type,
                "error_message": error_message[:500],  # truncate long messages
            },
        )
        logger.warning("source_health_failure", source_id=source_id, error_type=error_type)
        return result
