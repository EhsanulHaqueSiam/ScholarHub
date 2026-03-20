"""Record batch accumulator for Convex ingestion."""

from __future__ import annotations

from typing import Any


class BatchAccumulator:
    """Accumulates records and flushes them in batches to Convex.

    Auto-flushes when the batch reaches the configured size.
    Call flush_remaining() after processing to send leftover records.
    """

    def __init__(
        self,
        convex_client: Any,
        run_id: str,
        batch_size: int = 50,
    ) -> None:
        """Initialize the batch accumulator.

        Args:
            convex_client: PipelineConvexClient (or mock) with a mutation() method.
            run_id: The scrape run ID for this batch.
            batch_size: Number of records per flush. Defaults to 50.
        """
        self._client = convex_client
        self._run_id = run_id
        self._batch_size = batch_size
        self._batch: list[dict[str, Any]] = []
        self._stats: dict[str, int] = {"inserted": 0, "updated": 0, "unchanged": 0}

    def add(self, record: dict[str, Any]) -> None:
        """Add a record to the current batch. Auto-flushes at batch_size.

        Args:
            record: A raw record dict to queue for insertion.
        """
        self._batch.append(record)
        if len(self._batch) >= self._batch_size:
            self.flush()

    def flush(self) -> dict[str, int]:
        """Send the current batch to Convex and reset.

        Returns:
            Dict with keys: inserted, updated, unchanged.
        """
        if not self._batch:
            return {"inserted": 0, "updated": 0, "unchanged": 0}

        result = self._client.mutation(
            "scraping:batchInsertRawRecords",
            {"records": self._batch, "run_id": self._run_id},
        )
        self._batch = []
        self._accumulate_stats(result)
        return result

    def flush_remaining(self) -> dict[str, int]:
        """Flush any leftover records that haven't reached batch_size.

        Returns:
            Dict with keys: inserted, updated, unchanged.
        """
        return self.flush()

    @property
    def stats(self) -> dict[str, int]:
        """Cumulative insertion statistics across all flushes.

        Returns:
            Dict with keys: inserted, updated, unchanged.
        """
        return dict(self._stats)

    def _accumulate_stats(self, result: dict[str, int]) -> None:
        """Add a flush result to cumulative stats.

        Args:
            result: Dict with keys: inserted, updated, unchanged.
        """
        for key in ("inserted", "updated", "unchanged"):
            self._stats[key] += result.get(key, 0)
