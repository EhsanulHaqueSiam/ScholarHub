"""Pipeline orchestrator for complete scrape runs.

Ties together config discovery, scraper instantiation, ingestion batching,
health tracking, and heartbeat monitoring into a single run lifecycle:
startRun -> scrape sources -> completeRun.
"""

from __future__ import annotations

import time
from typing import TYPE_CHECKING, Any

import structlog

from scholarhub_pipeline.configs import discover_configs
from scholarhub_pipeline.ingestion.batch import BatchAccumulator
from scholarhub_pipeline.ingestion.dedup import SourceDeduplicator
from scholarhub_pipeline.monitoring.health import HealthTracker
from scholarhub_pipeline.monitoring.heartbeat import HeartbeatMonitor
from scholarhub_pipeline.monitoring.rot_detector import RotDetector
from scholarhub_pipeline.pipeline.buffer import LocalBuffer
from scholarhub_pipeline.pipeline.scheduler import SourceScheduler
from scholarhub_pipeline.scrapers import get_scraper

# Fields accepted by Convex batchInsertRawRecords mutation
CONVEX_RAW_RECORD_FIELDS = {
    "source_id", "external_id", "title", "description",
    "provider_organization", "host_country", "eligibility_nationalities",
    "degree_levels", "fields_of_study", "funding_type", "award_amount",
    "award_currency", "application_deadline", "application_url",
    "source_url", "raw_data",
}

if TYPE_CHECKING:
    from scholarhub_pipeline.configs._protocol import SourceConfig
    from scholarhub_pipeline.monitoring.github_issues import GitHubIssueManager

logger = structlog.get_logger()


class PipelineRunner:
    """Orchestrates a complete scrape run.

    Discovers source configs, filters by schedule/method/source, executes
    scraping with batched ingestion, tracks health per source, and records
    run lifecycle in Convex.
    """

    def __init__(
        self,
        convex_client: Any | None = None,
        dry_run: bool = False,
        source_filter: str | None = None,
        wave_filter: int | None = None,
        json_logs: bool = False,
    ) -> None:
        """Initialize the pipeline runner.

        Args:
            convex_client: PipelineConvexClient instance, or None for dry-run.
            dry_run: If True, write results to local JSON instead of Convex.
            source_filter: Only run a specific source by name or source_id.
            wave_filter: Only run sources in a specific wave number.
            json_logs: If True, configure structlog for JSON output.
        """
        self.dry_run = dry_run
        self.source_filter = source_filter
        self.wave_filter = wave_filter
        self.convex = convex_client
        self.buffer = LocalBuffer()
        self.stats: dict[str, int] = {
            "sources_targeted": 0,
            "sources_completed": 0,
            "sources_failed": 0,
            "records_inserted": 0,
            "records_updated": 0,
            "records_unchanged": 0,
        }

    async def run(self) -> dict[str, int]:
        """Execute full pipeline run.

        Discovers configs, filters by schedule and method, scrapes each source,
        ingests records, and records the run in Convex.

        Returns:
            Dict of yield metrics: sources_targeted, sources_completed,
            sources_failed, records_inserted, records_updated, records_unchanged.
        """
        start_time = time.time()

        # Discover and filter configs
        all_configs = discover_configs()
        scheduler = SourceScheduler(self.convex) if self.convex else None

        configs = all_configs
        if self.source_filter:
            configs = [
                c
                for c in configs
                if c.name == self.source_filter or c.source_id == self.source_filter
            ]
        if self.wave_filter is not None:
            configs = [c for c in configs if getattr(c, "wave", None) == self.wave_filter]
        if scheduler and not self.dry_run:
            configs = scheduler.filter_active(configs)
            configs = scheduler.filter_due_sources(configs)

        self.stats["sources_targeted"] = len(configs)
        logger.info("pipeline_start", sources=len(configs), dry_run=self.dry_run)

        # Start run in Convex
        run_id = None
        if self.convex and not self.dry_run:
            run_id = self.convex.mutation(
                "scraping:startRun",
                {
                    "triggered_by": "cli",
                    "sources_targeted": len(configs),
                },
            )

        # Group by method and execute in order
        if configs:
            grouped = SourceScheduler(self.convex).group_by_method(configs) if self.convex else {}
            if not self.convex:
                # Without Convex client, group manually
                grouped = self._group_configs(configs)

            for method in ["api", "jsonld", "ajax", "rss", "inertia", "scrape", "scrapling"]:
                method_configs = grouped.get(method, [])
                for config in method_configs:
                    await self._scrape_source(config, run_id)

        # Complete run
        duration = time.time() - start_time
        if self.convex and run_id and not self.dry_run:
            complete_stats = {k: v for k, v in self.stats.items() if k != "sources_targeted"}
            self.convex.mutation(
                "scraping:completeRun",
                {
                    "run_id": run_id,
                    "status": "completed",
                    **complete_stats,
                    "duration_seconds": int(duration),
                },
            )
            try:
                HeartbeatMonitor(self.convex).update()
            except Exception:  # noqa: BLE001
                logger.debug("heartbeat_update_skipped", reason="mutation not deployed")

        logger.info("pipeline_complete", duration=round(duration, 1), **self.stats)
        return self.stats

    def _resolve_convex_id(self, config: SourceConfig) -> str | None:
        """Resolve a source config's name to its Convex document _id.

        Args:
            config: SourceConfig with name field.

        Returns:
            Convex document _id string, or None if not found.
        """
        if not self.convex:
            return None
        source = self.convex.query("sources:getByName", {"name": config.name})
        return source["_id"] if source else None

    async def _scrape_source(self, config: SourceConfig, run_id: str | None) -> None:
        """Scrape a single source, handle errors, update health.

        Args:
            config: SourceConfig for the source to scrape.
            run_id: Convex run ID for telemetry, or None in dry-run mode.
        """
        source_start = time.time()
        # Resolve Convex document _id for this source (needed by all mutations)
        convex_source_id = self._resolve_convex_id(config) if not self.dry_run else None
        try:
            scraper = get_scraper(config)
            records = await scraper.scrape()

            if self.dry_run:
                self.buffer.save(records, config.source_id)
                self.stats["records_inserted"] += len(records)
            elif self.convex and run_id and convex_source_id:
                batch = BatchAccumulator(self.convex, run_id)
                dedup = SourceDeduplicator()
                for record in records:
                    if not dedup.is_duplicate(record, config.source_id):
                        # Strip None values and non-schema fields for Convex
                        cleaned = {
                            k: v for k, v in record.items()
                            if v is not None and k in CONVEX_RAW_RECORD_FIELDS
                        }
                        cleaned["source_id"] = convex_source_id
                        # source_url is required — use config URL as fallback
                        if "source_url" not in cleaned:
                            cleaned["source_url"] = config.url
                        # Coerce numeric fields to strings for Convex
                        for str_field in ("award_amount", "award_currency"):
                            if str_field in cleaned and not isinstance(cleaned[str_field], str):
                                cleaned[str_field] = str(cleaned[str_field])
                        batch.add(cleaned)
                batch.flush_remaining()
                cumulative = batch.stats
                self.stats["records_inserted"] += cumulative.get("inserted", 0)
                self.stats["records_updated"] += cumulative.get("updated", 0)
                self.stats["records_unchanged"] += cumulative.get("unchanged", 0)

            duration = time.time() - source_start
            self.stats["sources_completed"] += 1

            # Update health and timestamp
            if self.convex and not self.dry_run:
                health_after_success = HealthTracker(self.convex).record_success(
                    convex_source_id, len(records),
                )
                # Auto-close GitHub Issue if source recovered
                issue_num = (
                    health_after_success.get("github_issue_number")
                    if health_after_success
                    else None
                )
                if issue_num is not None:
                    from scholarhub_pipeline.monitoring.github_issues import (
                        GitHubIssueManager,
                    )

                    mgr = GitHubIssueManager(self.convex)
                    if mgr.close_issue(issue_num, config.name):
                        self.convex.mutation(
                            "scraping:clearGitHubIssueNumber",
                            {"source_id": convex_source_id},
                        )

                self.convex.mutation(
                    "scraping:updateLastScraped",
                    {
                        "source_id": convex_source_id,
                    },
                )
                self.convex.mutation(
                    "scraping:recordSourceResult",
                    {
                        "run_id": run_id,
                        "source_id": convex_source_id,
                        "status": "success",
                        "method_used": config.primary_method,
                        "records_found": scraper.records_found,
                        "records_new": len(records),
                        "records_updated": 0,
                        "records_unchanged": 0,
                        "duration_seconds": int(duration),
                        "bytes_downloaded": scraper.bytes_downloaded,
                    },
                )

            logger.info(
                "source_complete",
                source=config.name,
                records=len(records),
                duration=round(duration, 1),
            )

        except Exception as e:  # noqa: BLE001
            duration = time.time() - source_start
            self.stats["sources_failed"] += 1
            error_type = RotDetector().classify_error(None, e)
            logger.error(
                "source_failed",
                source=config.name,
                error=str(e),
                error_type=error_type,
            )

            if self.convex and not self.dry_run and convex_source_id:
                health_result = HealthTracker(self.convex).record_failure(
                    convex_source_id, error_type, str(e),
                )
                rot = RotDetector()
                failures = health_result.get("consecutive_failures", 0) if health_result else 0

                # Create GitHub Issue if alert threshold reached and no existing issue
                if rot.should_alert(failures):
                    from scholarhub_pipeline.monitoring.github_issues import (
                        GitHubIssueManager,
                    )

                    existing_issue = (
                        health_result.get("github_issue_number")
                        if health_result
                        else None
                    )
                    if existing_issue is None:
                        mgr = GitHubIssueManager(self.convex)
                        issue_number = mgr.create_rot_issue(
                            source_name=config.name,
                            source_url=config.url,
                            error_type=error_type,
                            consecutive_failures=failures,
                            last_success=None,
                            suggested_fix=mgr.suggest_fix(error_type, config.url),
                        )
                        if issue_number is not None:
                            self.convex.mutation(
                                "scraping:storeGitHubIssueNumber",
                                {
                                    "source_id": convex_source_id,
                                    "issue_number": issue_number,
                                },
                            )

                # Auto-deactivation check
                if rot.should_deactivate(failures, error_type):
                    reason = (
                        f"Auto-deactivated: {failures} consecutive failures, "
                        f"last error: {error_type}"
                    )
                    self.convex.mutation(
                        "scraping:deactivateSource",
                        {
                            "source_id": convex_source_id,
                            "reason": reason,
                        },
                    )
                    logger.warning(
                        "source_deactivated",
                        source=config.name,
                        failures=failures,
                        error_type=error_type,
                    )

    @staticmethod
    def _group_configs(configs: list[SourceConfig]) -> dict[str, list[SourceConfig]]:
        """Group configs by primary_method without a scheduler instance.

        Args:
            configs: List of source configs to group.

        Returns:
            Dict mapping method name to list of configs.
        """
        groups: dict[str, list[SourceConfig]] = {}
        for config in configs:
            method = config.primary_method
            if method not in groups:
                groups[method] = []
            groups[method].append(config)
        return groups
