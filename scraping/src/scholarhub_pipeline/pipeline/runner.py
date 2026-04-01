"""Pipeline orchestrator for complete scrape runs.

Ties together config discovery, scraper instantiation, ingestion batching,
health tracking, and heartbeat monitoring into a single run lifecycle:
startRun -> scrape sources -> completeRunBatch.

Optimized for Convex free-plan: uses bulk source query + batch completion
to minimize function calls (~8 per run instead of ~400).
"""

from __future__ import annotations

import asyncio
import time
from typing import TYPE_CHECKING, Any

import structlog

from scholarhub_pipeline.configs import discover_configs
from scholarhub_pipeline.ingestion.batch import BatchAccumulator
from scholarhub_pipeline.ingestion.dedup import SourceDeduplicator
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

    Optimized for Convex free-plan:
    - 1 query to load all sources (replaces N getByName calls)
    - Larger batch sizes (200 instead of 50) for record ingestion
    - 1 completeRunBatch mutation at end (replaces N per-source telemetry calls)
    """

    def __init__(
        self,
        convex_client: Any | None = None,
        dry_run: bool = False,
        source_filter: str | None = None,
        wave_filter: int | None = None,
        full_refresh: bool = False,
        json_logs: bool = False,
        direct_mode: bool = False,
    ) -> None:
        self.dry_run = dry_run
        self.source_filter = source_filter
        self.wave_filter = wave_filter
        self.full_refresh = full_refresh
        self.direct_mode = direct_mode
        self.convex = convex_client
        self.buffer = LocalBuffer()
        # Bulk source map: name -> {_id, last_scraped, is_active, url}
        self._source_map: dict[str, dict[str, Any]] = {}
        # Per-source results accumulated during the run for batch completion
        self._source_results: list[dict[str, Any]] = []
        self.stats: dict[str, int] = {
            "sources_targeted": 0,
            "sources_completed": 0,
            "sources_failed": 0,
            "records_inserted": 0,
            "records_updated": 0,
            "records_unchanged": 0,
        }

    def _load_source_map(self) -> None:
        """Load all sources in a single Convex query (replaces N getByName calls)."""
        if not self.convex:
            return
        try:
            self._source_map = self.convex.query("sources:getAllSourceMap", {})
            logger.info("source_map_loaded", count=len(self._source_map))
        except Exception as e:
            logger.warning("source_map_load_failed", error=str(e))
            self._source_map = {}

    def _resolve_convex_id(self, config: SourceConfig) -> str | None:
        """Resolve a source config's name to its Convex document _id using the bulk map."""
        source = self._source_map.get(config.name)
        if source:
            return str(source["_id"])
        # Fallback: try by URL match
        for _name, info in self._source_map.items():
            if info.get("url") == config.url:
                return str(info["_id"])
        return None

    def _is_source_active(self, config: SourceConfig) -> bool:
        """Check if source is active using the bulk map."""
        source = self._source_map.get(config.name)
        return bool(source and source.get("is_active", True))

    def _get_last_scraped(self, config: SourceConfig) -> int | None:
        """Get last_scraped timestamp from the bulk map."""
        source = self._source_map.get(config.name)
        return source.get("last_scraped") if source else None

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

        for field, max_len in MAX_TEXT_LENGTHS.items():
            if field in ("title", "source_url"):
                continue
            if field in cleaned:
                trimmed = self._truncate_text(cleaned[field], max_len)
                if trimmed is None:
                    cleaned.pop(field, None)
                else:
                    cleaned[field] = trimmed

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

        Returns:
            Dict of yield metrics.
        """
        start_time = time.time()

        # Load all sources in one query (replaces N getByName calls)
        if self.convex and not self.dry_run:
            self._load_source_map()

        # Discover and filter configs
        all_configs = discover_configs()
        configs = all_configs

        if self.source_filter:
            configs = [
                c
                for c in configs
                if c.name == self.source_filter or c.source_id == self.source_filter
            ]
        if self.wave_filter is not None:
            configs = [c for c in configs if getattr(c, "wave", None) == self.wave_filter]

        # Filter inactive sources using the bulk map
        if self.convex and not self.dry_run:
            configs = [c for c in configs if self._is_source_active(c)]
            # Filter due sources (skip if single-source manual run)
            if not self.source_filter:
                configs = self._filter_due_sources(configs)

        self.stats["sources_targeted"] = len(configs)
        logger.info(
            "pipeline_start",
            sources=len(configs),
            dry_run=self.dry_run,
            full_refresh=self.full_refresh,
        )

        # Start run in Convex (1 mutation)
        run_id = None
        if self.convex and not self.dry_run:
            run_id = self.convex.mutation(
                "scraping:startRun",
                {
                    "triggered_by": "cli",
                    "sources_targeted": len(configs),
                },
            )

        # Group by method and execute
        if configs:
            grouped = self._group_configs(configs)
            for method in ["github", "api", "jsonld", "ajax", "rss", "inertia", "scrape", "scrapling"]:
                method_configs = grouped.get(method, [])
                for config in method_configs:
                    await self._scrape_source(config, run_id)

        # Complete run with batched telemetry (1 mutation replaces ~300)
        duration = time.time() - start_time
        if self.convex and run_id and not self.dry_run:
            complete_stats = {k: v for k, v in self.stats.items() if k != "sources_targeted"}
            try:
                self.convex.mutation(
                    "scraping:completeRunBatch",
                    {
                        "run_id": run_id,
                        "status": "completed",
                        **complete_stats,
                        "duration_seconds": int(duration),
                        "source_results": self._source_results,
                    },
                )
            except Exception as e:
                # Fallback to legacy completeRun if completeRunBatch not deployed yet
                logger.warning("batch_complete_failed_fallback", error=str(e))
                self.convex.mutation(
                    "scraping:completeRun",
                    {
                        "run_id": run_id,
                        "status": "completed",
                        **complete_stats,
                        "duration_seconds": int(duration),
                    },
                )

        logger.info("pipeline_complete", duration=round(duration, 1), **self.stats)
        return self.stats

    def _filter_due_sources(self, configs: list[SourceConfig]) -> list[SourceConfig]:
        """Filter to sources that are due for scraping based on frequency."""
        now = time.time() * 1000  # JS-compatible timestamp
        due: list[SourceConfig] = []
        for config in configs:
            last_scraped = self._get_last_scraped(config)
            freq_hours = getattr(config, "scrape_frequency_hours", 168) or 168
            freq_ms = freq_hours * 3600 * 1000
            if last_scraped is None or (now - last_scraped) >= freq_ms:
                due.append(config)
        return due

    @staticmethod
    def _resolve_method_chain(config: SourceConfig) -> list[str]:
        """Resolve ordered method attempts for a source."""
        chain: list[str] = []

        def add(method: str | None) -> None:
            if method and method not in chain:
                chain.append(method)

        add(config.primary_method)
        add(config.secondary_method)

        selectors = config.selectors or {}
        primary = config.primary_method

        if selectors.get("items_key"):
            add("inertia")
        if (
            (selectors.get("items_path") or selectors.get("cursor_path"))
            and "api" not in chain
            and "ajax" not in chain
        ):
            add("ajax")
        if primary in {"scrape", "jsonld", "inertia"}:
            add("scrapling")
        elif primary == "scrapling":
            add("scrape")
        if primary in {"scrape", "scrapling"}:
            add("jsonld")

        return chain

    async def _scrape_source(self, config: SourceConfig, run_id: str | None) -> None:
        """Scrape a single source, accumulate results for batch completion."""
        source_start = time.time()
        convex_source_id = self._resolve_convex_id(config) if not self.dry_run else None
        if self.convex and not self.dry_run and not convex_source_id:
            self.stats["sources_failed"] += 1
            logger.error(
                "source_missing_in_convex",
                source=config.name,
                source_id=config.source_id,
            )
            return

        config.incremental_mode = bool(
            self.convex
            and not self.dry_run
            and not self.full_refresh
            and self._get_last_scraped(config),
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
            elif self.convex and convex_source_id and self.direct_mode:
                # Direct mode: enrich locally, write to scholarships table
                from scholarhub_pipeline.ingestion.direct_batch import DirectBatchAccumulator
                dbatch = DirectBatchAccumulator(self.convex, batch_size=50)
                dedup = SourceDeduplicator()
                for record in records:
                    if not dedup.is_duplicate(record, config.source_id):
                        record["source_id"] = convex_source_id
                        dbatch.add(record)
                        records_for_ingest += 1
                dbatch.flush_remaining()
                cumulative = dbatch.stats
                self.stats["records_inserted"] += cumulative.get("inserted", 0)
                self.stats["records_updated"] += cumulative.get("updated", 0)
            elif self.convex and run_id and convex_source_id:
                # Legacy mode: write to raw_records (larger batches)
                batch = BatchAccumulator(self.convex, run_id, batch_size=200)
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

            # Accumulate result for batch completion (no per-source Convex calls)
            if convex_source_id:
                self._source_results.append({
                    "source_id": convex_source_id,
                    "status": "success",
                    "method_used": method_used,
                    "records_found": scraper.records_found if scraper else 0,
                    "records_new": records_for_ingest,
                    "duration_seconds": int(duration),
                    "bytes_downloaded": bytes_downloaded,
                })

            logger.info(
                "source_complete",
                source=config.name,
                records=len(records),
                duration=round(duration, 1),
            )

        except Exception as e:
            duration = time.time() - source_start
            self.stats["sources_failed"] += 1

            from scholarhub_pipeline.monitoring.rot_detector import RotDetector
            error_type = RotDetector().classify_error(None, e)

            logger.error(
                "source_failed",
                source=config.name,
                error=str(e),
                error_type=error_type,
            )

            # Accumulate failure for batch completion (no per-source Convex calls)
            if convex_source_id:
                self._source_results.append({
                    "source_id": convex_source_id,
                    "status": "failed",
                    "method_used": method_used,
                    "records_found": 0,
                    "records_new": 0,
                    "duration_seconds": int(duration),
                    "bytes_downloaded": bytes_downloaded,
                    "error_type": error_type,
                    "error_message": str(e)[:500],
                })

    @staticmethod
    def _group_configs(configs: list[SourceConfig]) -> dict[str, list[SourceConfig]]:
        """Group configs by primary_method."""
        groups: dict[str, list[SourceConfig]] = {}
        for config in configs:
            method = config.primary_method
            if method not in groups:
                groups[method] = []
            groups[method].append(config)
        return groups
