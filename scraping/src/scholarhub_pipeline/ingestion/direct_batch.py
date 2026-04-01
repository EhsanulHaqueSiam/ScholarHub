"""Direct batch accumulator — writes enriched records directly to scholarships table.

Bypasses raw_records + aggregation pipeline entirely.
Uses the ingest:upsertBatch mutation for minimal Convex function calls.
"""

from __future__ import annotations

from typing import Any

import structlog

from scholarhub_pipeline.ingestion.enrichment import enrich_record

logger = structlog.get_logger()


class DirectBatchAccumulator:
    """Accumulates enriched records and flushes directly to scholarships table.

    Enriches each record locally (Python-side) and writes to the
    ingest:upsertBatch mutation, completely bypassing raw_records,
    aggregation, and enrichPublish pipelines.

    Batch size default = 50 (Convex mutation argument size limit).
    """

    def __init__(
        self,
        convex_client: Any,
        batch_size: int = 50,
    ) -> None:
        self._client = convex_client
        self._batch_size = batch_size
        self._batch: list[dict[str, Any]] = []
        self._stats: dict[str, int] = {"inserted": 0, "updated": 0, "skipped": 0}

    def add(self, record: dict[str, Any]) -> None:
        """Enrich and queue a record. Auto-flushes at batch_size."""
        enriched = enrich_record(record)
        if not enriched.get("title"):
            self._stats["skipped"] += 1
            return

        self._batch.append(enriched)
        if len(self._batch) >= self._batch_size:
            self.flush()

    def flush(self) -> dict[str, int]:
        """Send the current batch to Convex via ingest:upsertBatch."""
        if not self._batch:
            return {"inserted": 0, "updated": 0, "skipped": 0}

        try:
            result = self._client.mutation(
                "ingest:upsertBatch",
                {"records": self._batch},
            )
            self._batch = []
            self._accumulate_stats(result)
            return result
        except Exception as e:
            logger.error("direct_batch_flush_failed", error=str(e), batch_size=len(self._batch))
            # Fall back to legacy raw_records path
            self._batch = []
            raise

    def flush_remaining(self) -> dict[str, int]:
        """Flush any leftover records."""
        return self.flush()

    @property
    def stats(self) -> dict[str, int]:
        """Cumulative statistics across all flushes."""
        return dict(self._stats)

    def _accumulate_stats(self, result: dict[str, int]) -> None:
        for key in ("inserted", "updated", "skipped"):
            self._stats[key] += result.get(key, 0)
