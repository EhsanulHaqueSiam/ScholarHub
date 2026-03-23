"""Pipeline orchestrator for complete scrape runs.

Ties together config discovery, scraper instantiation, ingestion batching,
health tracking, and heartbeat monitoring into a single run lifecycle:
startRun -> scrape sources -> completeRun.
"""

from __future__ import annotations

import asyncio
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
    "source_url",
}

MAX_TEXT_LENGTHS: dict[str, int] = {
    "external_id": 256,
    "title": 240,
    "description": 1800,
    "provider_organization": 200,
    "host_country": 120,
    "funding_type": 64,
    "award_amount": 120,
    "award_currency": 16,
    "application_deadline": 64,
    "application_url": 1024,
    "source_url": 1024,
}

LIST_FIELD_LIMITS: dict[str, tuple[int, int]] = {
    "eligibility_nationalities": (20, 64),
    "degree_levels": (10, 32),
    "fields_of_study": (20, 80),
}

if TYPE_CHECKING:
    from scholarhub_pipeline.configs._protocol import SourceConfig

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
        full_refresh: bool = False,
        json_logs: bool = False,
    ) -> None:
        """Initialize the pipeline runner.

        Args:
            convex_client: PipelineConvexClient instance, or None for dry-run.
            dry_run: If True, write results to local JSON instead of Convex.
            source_filter: Only run a specific source by name or source_id.
            wave_filter: Only run sources in a specific wave number.
            full_refresh: If True, force full (non-incremental) scraping behavior.
            json_logs: If True, configure structlog for JSON output.
        """
        self.dry_run = dry_run
        self.source_filter = source_filter
        self.wave_filter = wave_filter
        self.full_refresh = full_refresh
        self.convex = convex_client
        self.buffer = LocalBuffer()
        self._source_cache: dict[str, dict[str, Any] | None] = {}
        self._source_id_cache: dict[str, dict[str, Any] | None] = {}
        self._source_url_cache: dict[str, dict[str, Any] | None] = {}
        self._supports_get_by_url: bool = True
        self.stats: dict[str, int] = {
            "sources_targeted": 0,
            "sources_completed": 0,
            "sources_failed": 0,
            "records_inserted": 0,
            "records_updated": 0,
            "records_unchanged": 0,
        }

    def _query_source_by_url(self, url: str) -> dict[str, Any] | None:
        if not self.convex or not self._supports_get_by_url:
            return None
        try:
            return self.convex.query(
                "sources:getByUrl",
                {"url": url},
            )
        except Exception:  # noqa: BLE001 - Convex query errors vary by runtime
            self._supports_get_by_url = False
            return None

    @staticmethod
    def _truncate_text(value: Any, max_len: int) -> str | None:
        if value is None:
            return None
        text = str(value).strip()
        if not text:
            return None
        return text[:max_len]

    @staticmethod
    def _normalize_list_field(value: Any, max_items: int, max_item_len: int) -> list[str] | None:
        if not isinstance(value, list):
            return None
        items: list[str] = []
        seen: set[str] = set()
        for raw in value:
            normalized = str(raw).strip()
            if not normalized:
                continue
            normalized = normalized[:max_item_len]
            dedup_key = normalized.lower()
            if dedup_key in seen:
                continue
            seen.add(dedup_key)
            items.append(normalized)
            if len(items) >= max_items:
                break
        return items or None

    def _prepare_record_for_convex(
        self,
        record: dict[str, Any],
        convex_source_id: str,
        fallback_source_url: str,
    ) -> dict[str, Any] | None:
        cleaned = {
            k: v for k, v in record.items()
            if v is not None and k in CONVEX_RAW_RECORD_FIELDS
        }

        # Required fields and canonical source identifier.
        title = self._truncate_text(cleaned.get("title"), MAX_TEXT_LENGTHS["title"])
        if not title:
            return None
        cleaned["title"] = title
        cleaned["source_id"] = convex_source_id
        cleaned["source_url"] = self._truncate_text(
            cleaned.get("source_url") or fallback_source_url,
            MAX_TEXT_LENGTHS["source_url"],
        )
        if not cleaned["source_url"]:
            return None

        # Keep writes lean: trim long strings before sending to Convex.
        for field, max_len in MAX_TEXT_LENGTHS.items():
            if field in ("title", "source_url"):
                continue
            if field in cleaned:
                trimmed = self._truncate_text(cleaned[field], max_len)
                if trimmed is None:
                    cleaned.pop(field, None)
                else:
                    cleaned[field] = trimmed

        # Normalize list fields to dedup and cap payload size.
        for field, (max_items, max_item_len) in LIST_FIELD_LIMITS.items():
            if field in cleaned:
                normalized_list = self._normalize_list_field(
                    cleaned[field],
                    max_items=max_items,
                    max_item_len=max_item_len,
                )
                if normalized_list is None:
                    cleaned.pop(field, None)
                else:
                    cleaned[field] = normalized_list

        return cleaned

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
            self._prime_source_cache(configs)
            configs = scheduler.filter_active(configs, source_lookup=self._source_id_cache)
            configs = scheduler.filter_due_sources(configs, source_lookup=self._source_id_cache)

        self.stats["sources_targeted"] = len(configs)
        logger.info(
            "pipeline_start",
            sources=len(configs),
            dry_run=self.dry_run,
            full_refresh=self.full_refresh,
        )

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
            except Exception:
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
        source = self._source_id_cache.get(config.source_id)

        if source is None:
            if config.url not in self._source_url_cache:
                self._source_url_cache[config.url] = self._query_source_by_url(config.url)
            source = self._source_url_cache.get(config.url)
        if source is None:
            if config.name not in self._source_cache:
                self._source_cache[config.name] = self.convex.query(
                    "sources:getByName",
                    {"name": config.name},
                )
            source = self._source_cache.get(config.name)

        if source:
            self._source_id_cache[config.source_id] = source
            self._source_cache[config.name] = source
            self._source_url_cache[config.url] = source

        source_id = source.get("_id") if source else None
        return str(source_id) if source_id else None

    def _prime_source_cache(self, configs: list[SourceConfig]) -> None:
        """Warm a local cache of source records to reduce repeated Convex queries."""
        if not self.convex:
            return
        for config in configs:
            if config.source_id in self._source_id_cache:
                continue
            source = self._query_source_by_url(config.url)
            if source is None:
                source = self.convex.query(
                    "sources:getByName",
                    {"name": config.name},
                )
            self._source_id_cache[config.source_id] = source
            self._source_cache[config.name] = source
            if source and config.url not in self._source_url_cache:
                self._source_url_cache[config.url] = source

    @staticmethod
    def _resolve_method_chain(config: SourceConfig) -> list[str]:
        """Resolve ordered method attempts for a source.

        Order of preference:
        1. Explicit config methods (primary then secondary).
        2. Runtime fallbacks for JS/AJAX-heavy pages.
        3. Structured-data fallback for sparse HTML pages.
        """
        chain: list[str] = []

        def add(method: str | None) -> None:
            if method and method not in chain:
                chain.append(method)

        add(config.primary_method)
        add(config.secondary_method)

        selectors = config.selectors or {}
        primary = config.primary_method

        # Inertia.js endpoints expose props/items_key and require protocol headers.
        if selectors.get("items_key"):
            add("inertia")

        # AJAX/API-style selectors indicate a JSON payload shape.
        if (
            (selectors.get("items_path") or selectors.get("cursor_path"))
            and "api" not in chain
            and "ajax" not in chain
        ):
            add("ajax")

        # For JS-rendered and anti-bot pages, always try Scrapling as fallback.
        if primary in {"scrape", "jsonld", "inertia"}:
            add("scrapling")
        elif primary == "scrapling":
            add("scrape")

        # If CSS selectors fail but page exposes schema.org payloads, JSON-LD can recover data.
        if primary in {"scrape", "scrapling"}:
            add("jsonld")

        return chain

    async def _scrape_source(self, config: SourceConfig, run_id: str | None) -> None:
        """Scrape a single source, handle errors, update health.

        Args:
            config: SourceConfig for the source to scrape.
            run_id: Convex run ID for telemetry, or None in dry-run mode.
        """
        source_start = time.time()
        # Resolve Convex document _id for this source (needed by all mutations)
        convex_source_id = self._resolve_convex_id(config) if not self.dry_run else None
        if self.convex and not self.dry_run and not convex_source_id:
            self.stats["sources_failed"] += 1
            logger.error(
                "source_missing_in_convex",
                source=config.name,
                source_id=config.source_id,
                source_url=config.url,
            )
            return

        source_meta = (
            self._source_id_cache.get(config.source_id)
            or self._source_url_cache.get(config.url)
            or self._source_cache.get(config.name)
        )
        config.incremental_mode = bool(
            self.convex
            and not self.dry_run
            and not self.full_refresh
            and source_meta
            and source_meta.get("last_scraped"),
        )
        method_chain = self._resolve_method_chain(config)
        method_timeout = float(getattr(config, "method_timeout_seconds", 45.0) or 45.0)
        method_used = config.primary_method
        bytes_downloaded = 0
        scraper = None
        try:
            records: list[dict] = []
            for index, method in enumerate(method_chain):
                method_used = method
                scraper = get_scraper(config, method=method)
                try:
                    candidate_records = await asyncio.wait_for(
                        scraper.scrape(),
                        timeout=method_timeout,
                    )
                except Exception as method_error:
                    bytes_downloaded += scraper.bytes_downloaded
                    if index < len(method_chain) - 1:
                        logger.warning(
                            "source_method_failed_fallback",
                            source=config.name,
                            method=method,
                            next_method=method_chain[index + 1],
                            error=str(method_error),
                        )
                        continue
                    raise

                bytes_downloaded += scraper.bytes_downloaded
                if candidate_records:
                    records = candidate_records
                    if index > 0:
                        logger.info(
                            "source_method_fallback_success",
                            source=config.name,
                            method=method,
                            attempted_methods=method_chain[: index + 1],
                            records=len(records),
                        )
                    break

                if index < len(method_chain) - 1:
                    logger.info(
                        "source_method_empty_fallback",
                        source=config.name,
                        method=method,
                        next_method=method_chain[index + 1],
                    )
                else:
                    records = candidate_records

            if scraper is None:
                msg = f"No scraper available for source {config.name}"
                raise RuntimeError(msg)

            if bytes_downloaded == 0:
                bytes_downloaded = scraper.bytes_downloaded

            records_for_ingest = 0

            if self.dry_run:
                self.buffer.save(records, config.source_id)
                self.stats["records_inserted"] += len(records)
            elif self.convex and run_id and convex_source_id:
                batch = BatchAccumulator(self.convex, run_id)
                dedup = SourceDeduplicator()
                for record in records:
                    if not dedup.is_duplicate(record, config.source_id):
                        cleaned = self._prepare_record_for_convex(
                            record,
                            convex_source_id=convex_source_id,
                            fallback_source_url=config.url,
                        )
                        if cleaned is None:
                            continue
                        batch.add(cleaned)
                        records_for_ingest += 1
                batch.flush_remaining()
                cumulative = batch.stats
                self.stats["records_inserted"] += cumulative.get("inserted", 0)
                self.stats["records_updated"] += cumulative.get("updated", 0)
                self.stats["records_unchanged"] += cumulative.get("unchanged", 0)

            duration = time.time() - source_start
            self.stats["sources_completed"] += 1

            # Update health and telemetry. These should never fail the source scrape.
            if self.convex and not self.dry_run and convex_source_id and run_id:
                try:
                    health_after_success = HealthTracker(self.convex).record_success(
                        convex_source_id,
                        records_for_ingest,
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
                            "method_used": method_used,
                            "records_found": scraper.records_found,
                            "records_new": records_for_ingest,
                            "records_updated": 0,
                            "records_unchanged": 0,
                            "duration_seconds": int(duration),
                            "bytes_downloaded": bytes_downloaded,
                        },
                    )
                except Exception as telemetry_error:
                    logger.warning(
                        "source_postprocess_failed",
                        source=config.name,
                        error=str(telemetry_error),
                    )

            logger.info(
                "source_complete",
                source=config.name,
                records=len(records),
                duration=round(duration, 1),
            )

        except Exception as e:
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
                try:
                    # Record failure in per-run telemetry stream.
                    if run_id:
                        try:
                            self.convex.mutation(
                                "scraping:recordSourceResult",
                                {
                                    "run_id": run_id,
                                    "source_id": convex_source_id,
                                    "status": "failed",
                                    "method_used": method_used,
                                    "records_found": 0,
                                    "records_new": 0,
                                    "records_updated": 0,
                                    "records_unchanged": 0,
                                    "duration_seconds": int(duration),
                                    "bytes_downloaded": bytes_downloaded,
                                    "error_type": error_type,
                                    "error_message": str(e)[:500],
                                },
                            )
                        except Exception as source_result_error:
                            logger.warning(
                                "source_result_record_failed",
                                source=config.name,
                                error=str(source_result_error),
                            )

                    health_result = HealthTracker(self.convex).record_failure(
                        convex_source_id, error_type, str(e),
                    )
                    # Mark attempt time so consistently failing sources do not run again
                    # immediately on every manual/scheduled trigger.
                    self.convex.mutation(
                        "scraping:updateLastScraped",
                        {"source_id": convex_source_id},
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
                except Exception as telemetry_error:
                    logger.warning(
                        "source_failure_postprocess_failed",
                        source=config.name,
                        error=str(telemetry_error),
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
