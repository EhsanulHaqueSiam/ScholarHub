"""Tests for the ScholarHub CLI with all 7 subcommands."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from click.testing import CliRunner

from scholarhub_pipeline.cli import scrape


@pytest.fixture
def cli_runner():
    return CliRunner()


class TestCliHelp:
    """Test that all commands have working --help output."""

    def test_main_help(self, cli_runner):
        result = cli_runner.invoke(scrape, ["--help"])
        assert result.exit_code == 0
        assert "ScholarHub scraping pipeline CLI" in result.output

    def test_main_help_lists_all_subcommands(self, cli_runner):
        result = cli_runner.invoke(scrape, ["--help"])
        assert result.exit_code == 0
        assert "run" in result.output
        assert "status" in result.output
        assert "gen-config" in result.output
        assert "export" in result.output
        assert "validate" in result.output
        assert "reactivate" in result.output
        assert "health" in result.output

    def test_run_help(self, cli_runner):
        result = cli_runner.invoke(scrape, ["run", "--help"])
        assert result.exit_code == 0
        assert "--dry-run" in result.output
        assert "--source" in result.output
        assert "--wave" in result.output

    def test_gen_config_help(self, cli_runner):
        result = cli_runner.invoke(scrape, ["gen-config", "--help"])
        assert result.exit_code == 0
        assert "URL" in result.output

    def test_export_help(self, cli_runner):
        result = cli_runner.invoke(scrape, ["export", "--help"])
        assert result.exit_code == 0
        assert "--format" in result.output
        assert "--output" in result.output

    def test_validate_help(self, cli_runner):
        result = cli_runner.invoke(scrape, ["validate", "--help"])
        assert result.exit_code == 0

    def test_reactivate_help(self, cli_runner):
        result = cli_runner.invoke(scrape, ["reactivate", "--help"])
        assert result.exit_code == 0
        assert "SOURCE_NAME" in result.output

    def test_health_help(self, cli_runner):
        result = cli_runner.invoke(scrape, ["health", "--help"])
        assert result.exit_code == 0
        assert "--source" in result.output

    def test_status_help(self, cli_runner):
        result = cli_runner.invoke(scrape, ["status", "--help"])
        assert result.exit_code == 0


class TestRunCommand:
    @patch("scholarhub_pipeline.pipeline.runner.PipelineRunner")
    def test_run_dry_run(self, mock_runner_cls, cli_runner):
        """dry-run invokes PipelineRunner with dry_run=True."""
        mock_instance = MagicMock()
        mock_instance.run = AsyncMock(return_value={
            "sources_targeted": 0, "sources_completed": 0, "sources_failed": 0,
            "records_inserted": 0, "records_updated": 0, "records_unchanged": 0,
        })
        mock_runner_cls.return_value = mock_instance

        result = cli_runner.invoke(scrape, ["run", "--dry-run"])

        assert result.exit_code == 0
        mock_runner_cls.assert_called_once()
        call_kwargs = mock_runner_cls.call_args[1]
        assert call_kwargs["dry_run"] is True
        assert call_kwargs["convex_client"] is None

    @patch("scholarhub_pipeline.pipeline.runner.PipelineRunner")
    def test_run_with_source_filter(self, mock_runner_cls, cli_runner):
        """--source passes source_filter to PipelineRunner."""
        mock_instance = MagicMock()
        mock_instance.run = AsyncMock(return_value={
            "sources_targeted": 1, "sources_completed": 1, "sources_failed": 0,
            "records_inserted": 5, "records_updated": 0, "records_unchanged": 0,
        })
        mock_runner_cls.return_value = mock_instance

        result = cli_runner.invoke(scrape, ["run", "--dry-run", "--source", "test-source"])

        assert result.exit_code == 0
        call_kwargs = mock_runner_cls.call_args[1]
        assert call_kwargs["source_filter"] == "test-source"

    @patch("scholarhub_pipeline.pipeline.runner.PipelineRunner")
    def test_run_with_wave_filter(self, mock_runner_cls, cli_runner):
        """--wave passes wave_filter to PipelineRunner."""
        mock_instance = MagicMock()
        mock_instance.run = AsyncMock(return_value={
            "sources_targeted": 0, "sources_completed": 0, "sources_failed": 0,
            "records_inserted": 0, "records_updated": 0, "records_unchanged": 0,
        })
        mock_runner_cls.return_value = mock_instance

        result = cli_runner.invoke(scrape, ["run", "--dry-run", "--wave", "1"])

        assert result.exit_code == 0
        call_kwargs = mock_runner_cls.call_args[1]
        assert call_kwargs["wave_filter"] == 1

    @patch("scholarhub_pipeline.pipeline.runner.PipelineRunner")
    def test_run_with_json_logs(self, mock_runner_cls, cli_runner):
        """--json-logs flag sets json_logs in context."""
        mock_instance = MagicMock()
        mock_instance.run = AsyncMock(return_value={
            "sources_targeted": 0, "sources_completed": 0, "sources_failed": 0,
            "records_inserted": 0, "records_updated": 0, "records_unchanged": 0,
        })
        mock_runner_cls.return_value = mock_instance

        result = cli_runner.invoke(scrape, ["--json-logs", "run", "--dry-run"])

        assert result.exit_code == 0
        call_kwargs = mock_runner_cls.call_args[1]
        assert call_kwargs["json_logs"] is True


class TestValidateCommand:
    @patch("scholarhub_pipeline.configs.discover_configs")
    def test_validate_no_configs(self, mock_discover, cli_runner):
        """When no configs exist, reports 0 valid."""
        mock_discover.return_value = []

        result = cli_runner.invoke(scrape, ["validate"])

        assert result.exit_code == 0
        assert "All 0 configs valid" in result.output

    @patch("scholarhub_pipeline.configs.discover_configs")
    def test_validate_valid_configs(self, mock_discover, cli_runner):
        """Valid configs pass validation."""
        from scholarhub_pipeline.configs._bases import BaseSourceConfig

        mock_discover.return_value = [
            BaseSourceConfig(
                name="Test", url="https://example.com",
                source_id="test", primary_method="api",
            ),
        ]
        result = cli_runner.invoke(scrape, ["validate"])

        assert result.exit_code == 0
        assert "All 1 configs valid" in result.output

    @patch("scholarhub_pipeline.configs.discover_configs")
    def test_validate_invalid_config_missing_url(self, mock_discover, cli_runner):
        """Config with empty url fails validation."""
        from scholarhub_pipeline.configs._bases import BaseSourceConfig

        mock_discover.return_value = [
            BaseSourceConfig(
                name="Bad", url="",
                source_id="bad", primary_method="api",
            ),
        ]
        result = cli_runner.invoke(scrape, ["validate"])

        assert result.exit_code == 1
        assert "ERROR" in result.output


class TestGenConfigCommand:
    def test_gen_config_missing_url(self, cli_runner):
        """gen-config requires a URL argument."""
        result = cli_runner.invoke(scrape, ["gen-config"])
        assert result.exit_code != 0


class TestExportCommand:
    def test_export_requires_output(self, cli_runner):
        """export requires --output flag."""
        result = cli_runner.invoke(scrape, ["export"])
        assert result.exit_code != 0
        assert "output" in result.output.lower() or "Missing" in result.output
