"""Tests for ingestion components: BatchAccumulator, SourceDeduplicator, compute_diff."""

from scholarhub_pipeline.ingestion.batch import BatchAccumulator
from scholarhub_pipeline.ingestion.dedup import SourceDeduplicator
from scholarhub_pipeline.ingestion.differ import compute_diff


class MockConvexClient:
    """Mock Convex client that records mutation calls."""

    def __init__(self):
        self.calls = []

    def mutation(self, name, args):
        self.calls.append({"name": name, "args": args})
        return {"inserted": len(args.get("records", [])), "updated": 0, "unchanged": 0}


class TestBatchAccumulator:
    def test_flush_at_batch_size(self):
        client = MockConvexClient()
        batch = BatchAccumulator(client, run_id="run_123", batch_size=3)
        batch.add({"title": "A"})
        batch.add({"title": "B"})
        assert len(client.calls) == 0
        batch.add({"title": "C"})
        assert len(client.calls) == 1
        assert len(client.calls[0]["args"]["records"]) == 3

    def test_flush_sends_to_convex(self):
        client = MockConvexClient()
        batch = BatchAccumulator(client, run_id="run_123", batch_size=50)
        batch.add({"title": "Test"})
        batch.add({"title": "Test 2"})
        result = batch.flush()
        assert len(client.calls) == 1
        assert client.calls[0]["name"] == "scraping:batchInsertRawRecords"
        assert client.calls[0]["args"]["run_id"] == "run_123"
        assert result["inserted"] == 2

    def test_flush_remaining(self):
        client = MockConvexClient()
        batch = BatchAccumulator(client, run_id="run_123", batch_size=50)
        batch.add({"title": "Leftover 1"})
        batch.add({"title": "Leftover 2"})
        result = batch.flush_remaining()
        assert len(client.calls) == 1
        assert result["inserted"] == 2

    def test_flush_remaining_empty(self):
        client = MockConvexClient()
        batch = BatchAccumulator(client, run_id="run_123", batch_size=50)
        result = batch.flush_remaining()
        assert result["inserted"] == 0
        assert result["updated"] == 0
        assert result["unchanged"] == 0
        assert len(client.calls) == 0

    def test_stats_accumulate(self):
        client = MockConvexClient()
        batch = BatchAccumulator(client, run_id="run_123", batch_size=2)
        batch.add({"title": "A"})
        batch.add({"title": "B"})
        batch.add({"title": "C"})
        batch.flush_remaining()
        stats = batch.stats
        assert stats["inserted"] == 3

    def test_default_batch_size_is_50(self):
        client = MockConvexClient()
        batch = BatchAccumulator(client, run_id="run_123")
        assert batch._batch_size == 50


class TestSourceDeduplicator:
    def test_same_external_id_is_duplicate(self):
        dedup = SourceDeduplicator()
        record = {"external_id": "abc123", "source_url": "https://example.com/1"}
        assert dedup.is_duplicate(record, "source_A") is False
        assert dedup.is_duplicate(record, "source_A") is True

    def test_same_source_url_is_duplicate(self):
        dedup = SourceDeduplicator()
        record = {"source_url": "https://example.com/1"}
        assert dedup.is_duplicate(record, "source_A") is False
        assert dedup.is_duplicate(record, "source_A") is True

    def test_different_source_url_not_duplicate(self):
        dedup = SourceDeduplicator()
        record1 = {"source_url": "https://example.com/1"}
        record2 = {"source_url": "https://example.com/2"}
        assert dedup.is_duplicate(record1, "source_A") is False
        assert dedup.is_duplicate(record2, "source_A") is False

    def test_same_url_different_source_not_duplicate(self):
        dedup = SourceDeduplicator()
        record = {"source_url": "https://example.com/1"}
        assert dedup.is_duplicate(record, "source_A") is False
        assert dedup.is_duplicate(record, "source_B") is False

    def test_external_id_scoped_to_source(self):
        dedup = SourceDeduplicator()
        record = {"external_id": "abc123", "source_url": "https://example.com/1"}
        assert dedup.is_duplicate(record, "source_A") is False
        record2 = {"external_id": "abc123", "source_url": "https://example.com/2"}
        assert dedup.is_duplicate(record2, "source_B") is False


class TestComputeDiff:
    def test_changed_fields(self):
        old = {"title": "Old Title", "description": "Old desc", "host_country": "DE"}
        new = {"title": "New Title", "description": "Old desc", "host_country": "US"}
        diffs = compute_diff(old, new)
        field_names = [d[0] for d in diffs]
        assert "title" in field_names
        assert "host_country" in field_names
        assert "description" not in field_names

    def test_identical_records_empty_diff(self):
        record = {
            "title": "Same Title",
            "description": "Same desc",
            "host_country": "DE",
            "application_deadline": "2026-12-31",
        }
        diffs = compute_diff(record, record)
        assert diffs == []

    def test_new_field_appears(self):
        old = {"title": "Title"}
        new = {"title": "Title", "description": "New description"}
        diffs = compute_diff(old, new)
        assert len(diffs) == 1
        assert diffs[0][0] == "description"
        assert diffs[0][1] is None
        assert diffs[0][2] == "New description"

    def test_field_removed(self):
        old = {"title": "Title", "description": "Old desc"}
        new = {"title": "Title"}
        diffs = compute_diff(old, new)
        assert len(diffs) == 1
        assert diffs[0][0] == "description"
        assert diffs[0][1] == "Old desc"
        assert diffs[0][2] is None
