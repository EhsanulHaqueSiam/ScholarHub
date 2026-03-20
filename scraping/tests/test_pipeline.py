"""Tests for pipeline runner, scheduler, and buffer."""

from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from scholarhub_pipeline.configs._bases import BaseSourceConfig
from scholarhub_pipeline.pipeline.buffer import LocalBuffer
from scholarhub_pipeline.pipeline.runner import PipelineRunner
from scholarhub_pipeline.pipeline.scheduler import SourceScheduler


def _make_config(
    name: str = "Test Source",
    source_id: str = "test-source",
    method: str = "api",
    auth_config: dict | None = None,
    wave: int | None = None,
) -> BaseSourceConfig:
    """Create a test config with optional overrides."""
    config = BaseSourceConfig(
        name=name,
        url="https://example.com",
        source_id=source_id,
        primary_method=method,
        selectors={"items_path": "data"},
        field_mappings={"title": "title"},
    )
    if auth_config is not None:
        config.auth_config = auth_config
    if wave is not None:
        config.wave = wave
    return config


# --- Scheduler tests ---


class TestSourceScheduler:
    def test_filter_due_sources_never_scraped(self):
        """Sources with no last_scraped timestamp are always due."""
        mock_convex = MagicMock()
        mock_convex.query.return_value = None

        scheduler = SourceScheduler(mock_convex)
        configs = [_make_config()]
        result = scheduler.filter_due_sources(configs)

        assert len(result) == 1
        assert result[0].name == "Test Source"

    def test_filter_due_sources_past_frequency(self):
        """Sources past their frequency window are due."""
        mock_convex = MagicMock()
        # Last scraped 200 hours ago (past default 168h)
        import time
        old_timestamp = (time.time() - 200 * 3600) * 1000
        mock_convex.query.return_value = {"last_scraped": old_timestamp}

        scheduler = SourceScheduler(mock_convex)
        configs = [_make_config()]
        result = scheduler.filter_due_sources(configs)

        assert len(result) == 1

    def test_filter_due_sources_not_yet_due(self):
        """Sources scraped recently are not due."""
        mock_convex = MagicMock()
        import time
        recent_timestamp = (time.time() - 1 * 3600) * 1000  # 1 hour ago
        mock_convex.query.return_value = {"last_scraped": recent_timestamp}

        scheduler = SourceScheduler(mock_convex)
        configs = [_make_config()]
        result = scheduler.filter_due_sources(configs)

        assert len(result) == 0

    def test_filter_due_sources_null_last_scraped(self):
        """Sources with null last_scraped field are due."""
        mock_convex = MagicMock()
        mock_convex.query.return_value = {"last_scraped": None}

        scheduler = SourceScheduler(mock_convex)
        configs = [_make_config()]
        result = scheduler.filter_due_sources(configs)

        assert len(result) == 1

    def test_group_by_method(self):
        """Groups configs into api, scrape, etc. buckets."""
        mock_convex = MagicMock()
        scheduler = SourceScheduler(mock_convex)
        configs = [
            _make_config(name="API 1", source_id="api-1", method="api"),
            _make_config(name="API 2", source_id="api-2", method="api"),
            _make_config(name="HTML 1", source_id="html-1", method="scrape"),
            _make_config(name="RSS 1", source_id="rss-1", method="rss"),
        ]
        groups = scheduler.group_by_method(configs)

        assert len(groups["api"]) == 2
        assert len(groups["scrape"]) == 1
        assert len(groups["rss"]) == 1
        assert "jsonld" not in groups

    def test_filter_active_excludes_auth(self):
        """Sources with auth_config are excluded."""
        mock_convex = MagicMock()
        scheduler = SourceScheduler(mock_convex)
        configs = [
            _make_config(name="Public", source_id="public"),
            _make_config(name="Private", source_id="private", auth_config={"token": "secret"}),
        ]
        active = scheduler.filter_active(configs)

        assert len(active) == 1
        assert active[0].name == "Public"


# --- Buffer tests ---


class TestLocalBuffer:
    def test_save_and_load_roundtrip(self, tmp_path):
        """LocalBuffer round-trip: save records, load them back."""
        buffer = LocalBuffer(str(tmp_path / "buffer"))
        records = [{"title": "Test Scholarship", "amount": "10000"}]

        filepath = buffer.save(records, "test-source")

        assert filepath.exists()
        loaded = buffer.load_all()
        assert len(loaded) == 1
        assert loaded[0][0] == filepath
        assert loaded[0][1] == records

    def test_save_creates_directory(self, tmp_path):
        """Buffer directory is created if it doesn't exist."""
        buffer_dir = tmp_path / "nested" / "buffer"
        buffer = LocalBuffer(str(buffer_dir))

        assert buffer_dir.exists()

    def test_clear_removes_file(self, tmp_path):
        """Clearing a buffer file removes it from disk."""
        buffer = LocalBuffer(str(tmp_path / "buffer"))
        records = [{"title": "Test"}]
        filepath = buffer.save(records, "test")

        assert filepath.exists()
        buffer.clear(filepath)
        assert not filepath.exists()

    def test_load_all_empty(self, tmp_path):
        """Loading from an empty buffer returns empty list."""
        buffer = LocalBuffer(str(tmp_path / "buffer"))
        assert buffer.load_all() == []

    def test_save_multiple_sources(self, tmp_path):
        """Multiple saves from different sources produce separate files."""
        buffer = LocalBuffer(str(tmp_path / "buffer"))
        buffer.save([{"a": 1}], "source-a")
        buffer.save([{"b": 2}], "source-b")

        loaded = buffer.load_all()
        assert len(loaded) == 2


# --- Runner tests ---


class TestPipelineRunner:
    @pytest.mark.asyncio
    @patch("scholarhub_pipeline.pipeline.runner.discover_configs")
    async def test_runner_discovers_configs(self, mock_discover):
        """Runner calls discover_configs and processes results."""
        mock_discover.return_value = []
        runner = PipelineRunner(dry_run=True)
        stats = await runner.run()

        mock_discover.assert_called_once()
        assert stats["sources_targeted"] == 0

    @pytest.mark.asyncio
    @patch("scholarhub_pipeline.pipeline.runner.discover_configs")
    async def test_runner_filters_by_source(self, mock_discover):
        """source_filter='test-api' only runs matching config."""
        mock_discover.return_value = [
            _make_config(name="API Source", source_id="test-api"),
            _make_config(name="Other Source", source_id="other-source"),
        ]
        runner = PipelineRunner(dry_run=True, source_filter="test-api")
        stats = await runner.run()

        assert stats["sources_targeted"] == 1

    @pytest.mark.asyncio
    @patch("scholarhub_pipeline.pipeline.runner.discover_configs")
    async def test_runner_filters_by_wave(self, mock_discover):
        """wave_filter=1 only runs wave 1 configs."""
        c1 = _make_config(name="Wave 1", source_id="w1", wave=1)
        c2 = _make_config(name="Wave 2", source_id="w2", wave=2)
        mock_discover.return_value = [c1, c2]

        runner = PipelineRunner(dry_run=True, wave_filter=1)
        stats = await runner.run()

        assert stats["sources_targeted"] == 1

    @pytest.mark.asyncio
    @patch("scholarhub_pipeline.pipeline.runner.get_scraper")
    @patch("scholarhub_pipeline.pipeline.runner.discover_configs")
    async def test_runner_dry_run_writes_local_json(self, mock_discover, mock_get_scraper, tmp_path):
        """dry_run=True produces .buffer/ files."""
        config = _make_config()
        mock_discover.return_value = [config]

        mock_scraper = AsyncMock()
        mock_scraper.scrape.return_value = [
            {"title": "Test Scholarship", "source_url": "https://example.com/1"},
        ]
        mock_get_scraper.return_value = mock_scraper

        runner = PipelineRunner(dry_run=True)
        runner.buffer = LocalBuffer(str(tmp_path / "buffer"))
        stats = await runner.run()

        assert stats["records_inserted"] == 1
        assert stats["sources_completed"] == 1
        # Verify buffer file was created
        buffered = runner.buffer.load_all()
        assert len(buffered) == 1

    @pytest.mark.asyncio
    @patch("scholarhub_pipeline.pipeline.runner.get_scraper")
    @patch("scholarhub_pipeline.pipeline.runner.discover_configs")
    async def test_yield_metrics(self, mock_discover, mock_get_scraper):
        """After run, stats contain records_inserted, records_updated, records_unchanged."""
        config = _make_config()
        mock_discover.return_value = [config]

        mock_scraper = AsyncMock()
        mock_scraper.scrape.return_value = [
            {"title": "Scholarship A"},
            {"title": "Scholarship B"},
        ]
        mock_get_scraper.return_value = mock_scraper

        runner = PipelineRunner(dry_run=True)
        stats = await runner.run()

        assert "records_inserted" in stats
        assert "records_updated" in stats
        assert "records_unchanged" in stats
        assert stats["records_inserted"] == 2

    @pytest.mark.asyncio
    @patch("scholarhub_pipeline.pipeline.runner.get_scraper")
    @patch("scholarhub_pipeline.pipeline.runner.discover_configs")
    async def test_last_verified(self, mock_discover, mock_get_scraper):
        """After successful source scrape, updateLastScraped is called."""
        config = _make_config()
        mock_discover.return_value = [config]

        mock_scraper = AsyncMock()
        mock_scraper.scrape.return_value = [{"title": "Test"}]
        mock_scraper.records_found = 1
        mock_scraper.bytes_downloaded = 1024
        mock_get_scraper.return_value = mock_scraper

        mock_convex = MagicMock()

        def mutation_side_effect(name, args):
            if name == "scraping:startRun":
                return "run_123"
            if name == "scraping:batchInsertRawRecords":
                return {"inserted": 1, "updated": 0, "unchanged": 0}
            if name == "scraping:updateSourceHealth":
                return {"consecutive_failures": 0}
            return None

        mock_convex.mutation.side_effect = mutation_side_effect
        mock_convex.query.return_value = None

        runner = PipelineRunner(convex_client=mock_convex, dry_run=False)
        await runner.run()

        # Find the updateLastScraped call
        mutation_calls = [
            call for call in mock_convex.mutation.call_args_list
            if call[0][0] == "scraping:updateLastScraped"
        ]
        assert len(mutation_calls) == 1
        assert mutation_calls[0][0][1]["source_id"] == "test-source"

    @pytest.mark.asyncio
    @patch("scholarhub_pipeline.pipeline.runner.get_scraper")
    @patch("scholarhub_pipeline.pipeline.runner.discover_configs")
    async def test_runner_handles_scrape_failure(self, mock_discover, mock_get_scraper):
        """Failed scrapes increment sources_failed and don't crash the run."""
        config = _make_config()
        mock_discover.return_value = [config]

        mock_scraper = AsyncMock()
        mock_scraper.scrape.side_effect = RuntimeError("Connection refused")
        mock_get_scraper.return_value = mock_scraper

        runner = PipelineRunner(dry_run=True)
        stats = await runner.run()

        assert stats["sources_failed"] == 1
        assert stats["sources_completed"] == 0
