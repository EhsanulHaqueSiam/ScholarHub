"""Pipeline heartbeat monitoring via Convex."""

from __future__ import annotations

import time
from typing import TYPE_CHECKING

import structlog

if TYPE_CHECKING:
    from scholarhub_pipeline.ingestion.convex_client import PipelineConvexClient

logger = structlog.get_logger()

STALE_THRESHOLD_HOURS = 48


class HeartbeatMonitor:
    """Update and check pipeline heartbeat via Convex."""

    def __init__(self, convex_client: PipelineConvexClient) -> None:
        """Initialize with a Convex client.

        Args:
            convex_client: Client for Convex mutations/queries.
        """
        self.convex = convex_client

    def update(self) -> None:
        """Record current timestamp as heartbeat."""
        self.convex.mutation(
            "scraping:updateHeartbeat",
            {"timestamp": int(time.time() * 1000)},
        )
        logger.info("heartbeat_updated")

    def is_stale(self) -> bool:
        """Check if heartbeat is older than threshold.

        Returns:
            True if no recent successful run detected.
        """
        result = self.convex.query("monitoring:getStaleHeartbeat", {})
        return bool(result)
