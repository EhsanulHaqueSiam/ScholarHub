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
    secondary_method: str | None = None,
    auth_config: dict | None = None,
    wave: int | None = None,
) -> BaseSourceConfig:
    """Create a test config with optional overrides."""
    config = BaseSourceConfig(
        name=name,
        url="https://example.com",
        source_id=source_id,
        primary_method=method,
        secondary_method=secondary_method,
        selectors={"items_path": "data"},
        field_mappings={"title": "title"},
    )
    if auth_config is not None:
        config.auth_config = auth_config
    if wave is not None:
        config.wave = wave
    return config


def _make_source_doc(
    config: BaseSourceConfig,
    *,
    convex_id: str = "test-source",
    name: str | None = None,
    url: str | None = None,
    is_active: bool = True,
    last_scraped: int | None = None,
) -> dict:
    """Build a Convex source document for runner source-map tests."""
    doc = {
        "_id": convex_id,
        "name": name or config.name,
        "url": url or config.url,
        "is_active": is_active,
    }
    if last_scraped is not None:
        doc["last_scraped"] = last_scraped
    return doc


def _make_source_map(*sources: dict) -> dict[str, dict]:
    """Build the expected name-keyed map returned by sources:getAllSourceMap."""
    return {str(source["name"]): source for source in sources}


# --- Scheduler tests ---


class TestSourceScheduler:
    def test_filter_due_sources_never_scraped(self):
        """Sources with no last_scraped timestamp are always due."""
        mock_convex = MagicMock()
        mock_convex.query.return_value = {"_id": "test-source", "name": "Test Source"}

        scheduler = SourceScheduler(mock_convex)
        configs = [_make_config()]
        result = scheduler.filter_due_sources(configs)

        assert len(result) == 1
        assert result[0].name == "Test Source"

    def test_filter_due_sources_past_frequency(self):
        """Sources past their frequency window are due."""
        mock_convex = MagicMock()
        # Last scraped 200 hours ago (past default daily window)
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

    def test_filter_due_sources_uses_source_frequency_from_convex(self):
        """Scheduler should prefer scrape_frequency_hours stored in Convex source data."""
        mock_convex = MagicMock()
        import time
        # 30 hours ago should NOT be due when source frequency is 48h.
        recent_timestamp = (time.time() - 30 * 3600) * 1000
        mock_convex.query.return_value = {
            "last_scraped": recent_timestamp,
            "scrape_frequency_hours": 48,
        }

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

    def test_filter_active_excludes_inactive_source_record(self):
        """Sources marked inactive in Convex should be excluded."""
        mock_convex = MagicMock()
        scheduler = SourceScheduler(mock_convex)
        configs = [_make_config(name="Inactive", source_id="inactive")]
        lookup = {"inactive": {"is_active": False}}

        active = scheduler.filter_active(configs, source_lookup=lookup)

        assert active == []

    def test_filter_due_sources_uses_source_id_lookup(self):
        """Due filtering should use source_id-keyed lookup to avoid duplicate-name collisions."""
        mock_convex = MagicMock()
        scheduler = SourceScheduler(mock_convex)
        configs = [_make_config(name="Shared Name", source_id="s1")]
        lookup = {"s1": {"_id": "src1", "last_scraped": None}}

        result = scheduler.filter_due_sources(configs, source_lookup=lookup)

        assert len(result) == 1
        assert result[0].source_id == "s1"


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
        """After successful scrape, result is included in completeRunBatch payload."""
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
            return None

        mock_convex.mutation.side_effect = mutation_side_effect
        mock_convex.query.return_value = _make_source_map(_make_source_doc(config))

        runner = PipelineRunner(convex_client=mock_convex, dry_run=False)
        with patch.dict("os.environ", {"GITHUB_REPOSITORY": "owner/repo"}):
            await runner.run()

        batch_calls = [
            call for call in mock_convex.mutation.call_args_list
            if call[0][0] == "scraping:completeRunBatch"
        ]
        assert len(batch_calls) == 1
        source_results = batch_calls[0][0][1]["source_results"]
        assert len(source_results) == 1
        assert source_results[0]["source_id"] == "test-source"
        assert source_results[0]["status"] == "success"

    @pytest.mark.asyncio
    @patch("scholarhub_pipeline.pipeline.runner.get_scraper")
    @patch("scholarhub_pipeline.pipeline.runner.discover_configs")
    async def test_runner_falls_back_to_source_url_lookup(self, mock_discover, mock_get_scraper):
        """If source name is missing, runner should resolve Convex source by URL match."""
        config = _make_config(name="GKS Korea", source_id="gks-korea")
        mock_discover.return_value = [config]

        mock_scraper = AsyncMock()
        mock_scraper.scrape.return_value = [{"title": "Test Scholarship"}]
        mock_scraper.records_found = 1
        mock_scraper.bytes_downloaded = 100
        mock_get_scraper.return_value = mock_scraper

        mock_convex = MagicMock()

        def mutation_side_effect(name, args):
            if name == "scraping:startRun":
                return "run_123"
            if name == "scraping:batchInsertRawRecords":
                return {"inserted": 1, "updated": 0, "unchanged": 0}
            return None

        mock_convex.query.return_value = _make_source_map(
            _make_source_doc(
                config,
                convex_id="source-by-url",
                name="Different Name",
                url=config.url,
            ),
        )
        mock_convex.mutation.side_effect = mutation_side_effect

        runner = PipelineRunner(convex_client=mock_convex, dry_run=False)
        await runner.run()

        insert_calls = [
            call for call in mock_convex.mutation.call_args_list
            if call[0][0] == "scraping:batchInsertRawRecords"
        ]
        assert len(insert_calls) == 1
        assert insert_calls[0][0][1]["records"][0]["source_id"] == "source-by-url"

        batch_calls = [
            call for call in mock_convex.mutation.call_args_list
            if call[0][0] == "scraping:completeRunBatch"
        ]
        assert len(batch_calls) == 1
        assert batch_calls[0][0][1]["source_results"][0]["source_id"] == "source-by-url"

    @pytest.mark.asyncio
    @patch("scholarhub_pipeline.pipeline.runner.get_scraper")
    @patch("scholarhub_pipeline.pipeline.runner.discover_configs")
    async def test_runner_does_not_fail_on_success_telemetry_error(
        self,
        mock_discover,
        mock_get_scraper,
    ):
        """Source should remain completed if completeRunBatch fails and fallback is used."""
        config = _make_config()
        mock_discover.return_value = [config]

        mock_scraper = AsyncMock()
        mock_scraper.scrape.return_value = [{"title": "Test Scholarship"}]
        mock_scraper.records_found = 1
        mock_scraper.bytes_downloaded = 100
        mock_get_scraper.return_value = mock_scraper

        mock_convex = MagicMock()

        def mutation_side_effect(name, args):
            if name == "scraping:startRun":
                return "run_123"
            if name == "scraping:batchInsertRawRecords":
                return {"inserted": 1, "updated": 0, "unchanged": 0}
            if name == "scraping:completeRunBatch":
                raise RuntimeError("telemetry failed")
            return None

        mock_convex.mutation.side_effect = mutation_side_effect
        mock_convex.query.return_value = _make_source_map(_make_source_doc(config))

        runner = PipelineRunner(convex_client=mock_convex, dry_run=False)
        stats = await runner.run()

        assert stats["sources_completed"] == 1
        assert stats["sources_failed"] == 0
        complete_fallback_calls = [
            call for call in mock_convex.mutation.call_args_list
            if call[0][0] == "scraping:completeRun"
        ]
        assert len(complete_fallback_calls) == 1

    @pytest.mark.asyncio
    @patch("scholarhub_pipeline.pipeline.runner.get_scraper")
    @patch("scholarhub_pipeline.pipeline.runner.discover_configs")
    async def test_runner_marks_existing_sources_as_incremental(
        self,
        mock_discover,
        mock_get_scraper,
    ):
        """Sources with a last_scraped timestamp should run in incremental mode."""
        config = _make_config()
        mock_discover.return_value = [config]

        mock_scraper = AsyncMock()
        mock_scraper.scrape.return_value = [{"title": "Test Scholarship"}]
        mock_scraper.records_found = 1
        mock_scraper.bytes_downloaded = 100
        mock_get_scraper.return_value = mock_scraper

        mock_convex = MagicMock()
        import time
        old_timestamp = int((time.time() - 200 * 3600) * 1000)

        def mutation_side_effect(name, args):
            if name == "scraping:startRun":
                return "run_123"
            if name == "scraping:batchInsertRawRecords":
                return {"inserted": 1, "updated": 0, "unchanged": 0}
            return None

        mock_convex.mutation.side_effect = mutation_side_effect
        mock_convex.query.return_value = _make_source_map(
            _make_source_doc(config, last_scraped=old_timestamp),
        )

        runner = PipelineRunner(convex_client=mock_convex, dry_run=False)
        await runner.run()

        called_config = mock_get_scraper.call_args[0][0]
        assert called_config.incremental_mode is True

    @pytest.mark.asyncio
    @patch("scholarhub_pipeline.pipeline.runner.get_scraper")
    @patch("scholarhub_pipeline.pipeline.runner.discover_configs")
    async def test_runner_fallbacks_to_secondary_method_after_empty_results(
        self,
        mock_discover,
        mock_get_scraper,
    ):
        """If primary returns no records, runner should try secondary method."""
        config = _make_config(method="scrape", secondary_method="scrapling")
        config.selectors = {"listing": ".item"}
        mock_discover.return_value = [config]

        primary_scraper = AsyncMock()
        primary_scraper.scrape.return_value = []
        primary_scraper.records_found = 0
        primary_scraper.bytes_downloaded = 100

        secondary_scraper = AsyncMock()
        secondary_scraper.scrape.return_value = [{"title": "Recovered"}]
        secondary_scraper.records_found = 1
        secondary_scraper.bytes_downloaded = 200

        mock_get_scraper.side_effect = [primary_scraper, secondary_scraper]

        runner = PipelineRunner(dry_run=True)
        stats = await runner.run()

        assert stats["sources_completed"] == 1
        assert stats["sources_failed"] == 0
        assert stats["records_inserted"] == 1
        assert mock_get_scraper.call_args_list[0].kwargs["method"] == "scrape"
        assert mock_get_scraper.call_args_list[1].kwargs["method"] == "scrapling"

    @pytest.mark.asyncio
    @patch("scholarhub_pipeline.pipeline.runner.get_scraper")
    @patch("scholarhub_pipeline.pipeline.runner.discover_configs")
    async def test_runner_fallbacks_to_secondary_method_after_primary_error(
        self,
        mock_discover,
        mock_get_scraper,
    ):
        """If primary raises, runner should continue with configured fallback method."""
        config = _make_config(method="scrape", secondary_method="scrapling")
        config.selectors = {"listing": ".item"}
        mock_discover.return_value = [config]

        primary_scraper = AsyncMock()
        primary_scraper.scrape.side_effect = RuntimeError("Blocked")
        primary_scraper.records_found = 0
        primary_scraper.bytes_downloaded = 25

        secondary_scraper = AsyncMock()
        secondary_scraper.scrape.return_value = [{"title": "Recovered"}]
        secondary_scraper.records_found = 1
        secondary_scraper.bytes_downloaded = 150

        mock_get_scraper.side_effect = [primary_scraper, secondary_scraper]

        runner = PipelineRunner(dry_run=True)
        stats = await runner.run()

        assert stats["sources_completed"] == 1
        assert stats["sources_failed"] == 0
        assert stats["records_inserted"] == 1
        assert mock_get_scraper.call_args_list[0].kwargs["method"] == "scrape"
        assert mock_get_scraper.call_args_list[1].kwargs["method"] == "scrapling"

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

    @pytest.mark.asyncio
    @patch("scholarhub_pipeline.pipeline.runner.get_scraper")
    @patch("scholarhub_pipeline.pipeline.runner.discover_configs")
    async def test_runner_marks_last_scraped_on_failure(self, mock_discover, mock_get_scraper):
        """Failure path should be included in completeRunBatch telemetry."""
        config = _make_config()
        mock_discover.return_value = [config]

        mock_scraper = AsyncMock()
        mock_scraper.scrape.side_effect = RuntimeError("Connection refused")
        mock_get_scraper.return_value = mock_scraper

        mock_convex = MagicMock()

        def mutation_side_effect(name, args):
            if name == "scraping:startRun":
                return "run_123"
            return None

        mock_convex.mutation.side_effect = mutation_side_effect
        mock_convex.query.return_value = _make_source_map(_make_source_doc(config))

        runner = PipelineRunner(convex_client=mock_convex, dry_run=False)
        await runner.run()

        batch_calls = [
            call for call in mock_convex.mutation.call_args_list
            if call[0][0] == "scraping:completeRunBatch"
        ]
        assert len(batch_calls) == 1
        source_results = batch_calls[0][0][1]["source_results"]
        assert len(source_results) == 1
        assert source_results[0]["source_id"] == "test-source"
        assert source_results[0]["status"] == "failed"

    @pytest.mark.asyncio
    @patch("scholarhub_pipeline.pipeline.runner.get_scraper")
    @patch("scholarhub_pipeline.pipeline.runner.discover_configs")
    async def test_runner_uses_batch_telemetry_for_failures(self, mock_discover, mock_get_scraper):
        """Failure runs should use completeRunBatch instead of per-source telemetry calls."""
        config = _make_config()
        mock_discover.return_value = [config]

        mock_scraper = AsyncMock()
        mock_scraper.scrape.side_effect = RuntimeError("Connection refused")
        mock_get_scraper.return_value = mock_scraper

        mock_convex = MagicMock()

        def mutation_side_effect(name, args):
            if name == "scraping:startRun":
                return "run_123"
            return None

        mock_convex.mutation.side_effect = mutation_side_effect
        mock_convex.query.return_value = _make_source_map(_make_source_doc(config))

        runner = PipelineRunner(convex_client=mock_convex, dry_run=False)
        with patch.dict("os.environ", {"GITHUB_REPOSITORY": "owner/repo"}):
            await runner.run()

        batch_calls = [
            call for call in mock_convex.mutation.call_args_list
            if call[0][0] == "scraping:completeRunBatch"
        ]
        assert len(batch_calls) == 1
        legacy_calls = [
            call for call in mock_convex.mutation.call_args_list
            if call[0][0] in {"scraping:updateSourceHealth", "scraping:deactivateSource"}
        ]
        assert legacy_calls == []

    @pytest.mark.asyncio
    @patch("scholarhub_pipeline.monitoring.github_issues.subprocess.run")
    @patch("scholarhub_pipeline.pipeline.runner.get_scraper")
    @patch("scholarhub_pipeline.pipeline.runner.discover_configs")
    async def test_runner_does_not_call_github_issue_flow_in_batch_mode(
        self, mock_discover, mock_get_scraper, mock_subprocess,
    ):
        """Failure path should not invoke legacy GitHub issue orchestration from runner."""
        config = _make_config()
        mock_discover.return_value = [config]

        mock_scraper = AsyncMock()
        mock_scraper.scrape.side_effect = RuntimeError("Connection refused")
        mock_get_scraper.return_value = mock_scraper

        mock_convex = MagicMock()

        def mutation_side_effect(name, args):
            if name == "scraping:startRun":
                return "run_123"
            return None

        mock_convex.mutation.side_effect = mutation_side_effect
        mock_convex.query.return_value = _make_source_map(_make_source_doc(config))

        runner = PipelineRunner(convex_client=mock_convex, dry_run=False)
        with patch.dict("os.environ", {"GITHUB_REPOSITORY": "owner/repo"}):
            await runner.run()

        mock_subprocess.assert_not_called()
        store_calls = [
            call for call in mock_convex.mutation.call_args_list
            if call[0][0] == "scraping:storeGitHubIssueNumber"
        ]
        assert len(store_calls) == 0

    @pytest.mark.asyncio
    @patch("scholarhub_pipeline.pipeline.runner.get_scraper")
    @patch("scholarhub_pipeline.pipeline.runner.discover_configs")
    async def test_runner_skips_duplicate_issue_creation(self, mock_discover, mock_get_scraper):
        """When github_issue_number already exists, no new issue is created."""
        config = _make_config()
        mock_discover.return_value = [config]

        mock_scraper = AsyncMock()
        mock_scraper.scrape.side_effect = RuntimeError("Connection refused")
        mock_get_scraper.return_value = mock_scraper

        mock_convex = MagicMock()

        def mutation_side_effect(name, args):
            if name == "scraping:startRun":
                return "run_123"
            return None

        mock_convex.mutation.side_effect = mutation_side_effect
        mock_convex.query.return_value = _make_source_map(_make_source_doc(config))

        runner = PipelineRunner(convex_client=mock_convex, dry_run=False)
        with patch(
            "scholarhub_pipeline.monitoring.github_issues.subprocess.run",
        ) as mock_subprocess:
            await runner.run()
            # create_rot_issue should NOT be called since issue already exists
            mock_subprocess.assert_not_called()

        # storeGitHubIssueNumber should NOT be called
        store_calls = [
            call for call in mock_convex.mutation.call_args_list
            if call[0][0] == "scraping:storeGitHubIssueNumber"
        ]
        assert len(store_calls) == 0

    @pytest.mark.asyncio
    @patch("scholarhub_pipeline.monitoring.github_issues.subprocess.run")
    @patch("scholarhub_pipeline.pipeline.runner.get_scraper")
    @patch("scholarhub_pipeline.pipeline.runner.discover_configs")
    async def test_runner_does_not_call_issue_close_in_batch_mode(
        self, mock_discover, mock_get_scraper, mock_subprocess,
    ):
        """Success path should not invoke legacy GitHub issue closing from runner."""
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
            return None

        mock_convex.mutation.side_effect = mutation_side_effect
        mock_convex.query.return_value = _make_source_map(_make_source_doc(config))

        runner = PipelineRunner(convex_client=mock_convex, dry_run=False)
        with patch.dict("os.environ", {"GITHUB_REPOSITORY": "owner/repo"}):
            await runner.run()

        mock_subprocess.assert_not_called()

        clear_calls = [
            call for call in mock_convex.mutation.call_args_list
            if call[0][0] == "scraping:clearGitHubIssueNumber"
        ]
        assert len(clear_calls) == 0
