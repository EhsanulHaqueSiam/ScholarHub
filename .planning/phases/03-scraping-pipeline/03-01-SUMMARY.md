---
phase: 03-scraping-pipeline
plan: 01
subsystem: database, scraping
tags: [scrapling, convex, protocol, dataclass, cron, webhook, hmac]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Convex schema with sources, raw_records, scholarships tables
  - phase: 02-source-discovery
    provides: 201 source catalog entries in Convex
provides:
  - Renamed Python package scholarhub_pipeline with all new dependencies
  - SourceConfig protocol and base config classes (BaseSourceConfig, BaseAggregatorConfig, BaseOfficialConfig, BaseGovernmentConfig, BaseFoundationConfig)
  - Auto-scan config discovery via importlib
  - 4 new Convex tables (scrape_runs, source_health, scrape_run_sources, change_log)
  - Batch insert mutations with upsert/dedup and field-level change logging
  - Run lifecycle mutations (startRun, completeRun)
  - Source health tracking mutations
  - Dashboard queries (getRecentRuns, getSourceHealth, getFailingSources, getRunStats)
  - Cron jobs for 90-day cleanup and heartbeat monitoring
  - Webhook endpoint with HMAC-SHA256 verification
affects: [03-02, 03-03, 03-04, 03-05, 03-06, 03-07, 05-frontend]

# Tech tracking
tech-stack:
  added: [scrapling, extruct, feedparser, click, pycountry, python-dateutil, structlog, rich, httpx, bleach]
  patterns: [SourceConfig Protocol with dataclass bases, internalMutation for pipeline ingestion, HMAC webhook auth]

key-files:
  created:
    - scraping/src/scholarhub_pipeline/__init__.py
    - scraping/src/scholarhub_pipeline/configs/_protocol.py
    - scraping/src/scholarhub_pipeline/configs/_bases.py
    - scraping/src/scholarhub_pipeline/configs/__init__.py
    - web/convex/scraping.ts
    - web/convex/maintenance.ts
    - web/convex/monitoring.ts
    - web/convex/dashboard.ts
    - web/convex/crons.ts
    - web/convex/http.ts
  modified:
    - scraping/pyproject.toml
    - web/convex/schema.ts

key-decisions:
  - "Used runtime_checkable Protocol for SourceConfig to allow isinstance checks at config discovery time"
  - "All scraping mutations use internalMutation (not public) -- called via admin auth from Python SDK"
  - "Rolling average yield (70/30 weight) for source health status determination"
  - "HMAC-SHA256 webhook verification using Web Crypto API (Convex runtime compatible)"
  - "Added jsonld and ajax to scrapeMethodValidator for full method hierarchy support"

patterns-established:
  - "SourceConfig Protocol: all 201 source configs must satisfy this contract"
  - "Base config hierarchy: BaseSourceConfig -> BaseAggregatorConfig/BaseOfficialConfig/BaseGovernmentConfig/BaseFoundationConfig with category-specific rate limits"
  - "Config discovery: each config module exports CONFIG attribute, auto-scanned by pkgutil"
  - "Field-level change tracking: tracked fields compared on upsert, changes logged to change_log table"

requirements-completed: [SCRP-05, SCRP-06, SCRP-07]

# Metrics
duration: 6min
completed: 2026-03-20
---

# Phase 3 Plan 1: Foundation Infrastructure Summary

**Scrapling-based Python package with SourceConfig protocol, 4 new Convex tables for run tracking/health/change-log, batch upsert mutations, dashboard queries, cron cleanup, and HMAC webhook endpoint**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-20T11:07:41Z
- **Completed:** 2026-03-20T11:14:11Z
- **Tasks:** 2
- **Files modified:** 19

## Accomplishments
- Restructured Python package from scholarhub_scraping (Scrapy) to scholarhub_pipeline (Scrapling) with all new dependencies installed
- Defined SourceConfig Protocol and 5 base config classes with category-specific rate limits
- Extended Convex schema with 4 new tables: scrape_runs, source_health, scrape_run_sources, change_log
- Implemented batch insert with upsert/dedup logic and field-level change logging
- Built run lifecycle management, source health tracking, dashboard queries, cron jobs, and webhook endpoint

## Task Commits

Each task was committed atomically:

1. **Task 1: Restructure Python package and install dependencies** - `d279794` (feat)
2. **Task 2: Extend Convex schema with 4 new tables and implement all mutations, queries, and crons** - `bb5c59c` (feat)

## Files Created/Modified
- `scraping/pyproject.toml` - Renamed to scholarhub-pipeline, replaced scrapy with scrapling ecosystem deps
- `scraping/src/scholarhub_pipeline/__init__.py` - Package root with version
- `scraping/src/scholarhub_pipeline/configs/_protocol.py` - SourceConfig Protocol definition
- `scraping/src/scholarhub_pipeline/configs/_bases.py` - BaseSourceConfig and category-specific subclasses
- `scraping/src/scholarhub_pipeline/configs/__init__.py` - Auto-scan discovery via importlib/pkgutil
- `scraping/src/scholarhub_pipeline/pipeline/__init__.py` - Pipeline subpackage placeholder
- `scraping/src/scholarhub_pipeline/scrapers/__init__.py` - Scrapers subpackage placeholder
- `scraping/src/scholarhub_pipeline/ingestion/__init__.py` - Ingestion subpackage placeholder
- `scraping/src/scholarhub_pipeline/monitoring/__init__.py` - Monitoring subpackage placeholder
- `scraping/src/scholarhub_pipeline/utils/__init__.py` - Utils subpackage placeholder
- `web/convex/schema.ts` - Extended with 4 new tables, updated validators and raw_records fields
- `web/convex/scraping.ts` - Batch insert, run lifecycle, source health, and last_scraped mutations
- `web/convex/maintenance.ts` - 90-day cleanup mutations for raw_records and change_log
- `web/convex/monitoring.ts` - Heartbeat check mutation and stale query
- `web/convex/dashboard.ts` - Public queries for runs, health, failing sources, run stats
- `web/convex/crons.ts` - Daily cleanup and hourly heartbeat cron jobs
- `web/convex/http.ts` - Webhook endpoint with HMAC-SHA256 verification

## Decisions Made
- Used runtime_checkable Protocol for SourceConfig to allow isinstance checks during config discovery
- All scraping mutations use internalMutation (not public) since they are called via admin auth from the Python SDK
- Rolling average yield calculation uses 70/30 weighting (70% previous avg, 30% current) for source health
- HMAC-SHA256 webhook verification uses Web Crypto API for Convex runtime compatibility
- Added jsonld and ajax to scrapeMethodValidator to support the full method hierarchy from CONTEXT.md
- Upgraded raw_records.scrape_run_id from v.string() to v.id("scrape_runs") for proper foreign key reference

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Reverted externally modified ingestion __init__.py**
- **Found during:** Task 2 (post-commit check)
- **Issue:** External process added imports for modules (batch, dedup, differ, normalizer, quality) that don't exist yet
- **Fix:** Reverted to simple docstring to prevent import errors
- **Files modified:** scraping/src/scholarhub_pipeline/ingestion/__init__.py
- **Verification:** Package imports cleanly
- **Committed in:** 408a4ed

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minor fix to revert premature imports. No scope creep.

## Issues Encountered
- pyproject.toml was modified by an external process between read and write, requiring a re-read before the update. Resolved by re-reading and proceeding.

## User Setup Required
None - no external service configuration required. WEBHOOK_SECRET environment variable will be needed when deploying the webhook endpoint, but that is a deployment concern for later phases.

## Next Phase Readiness
- Python package structure ready for source config implementations (Plan 02)
- Convex schema ready for pipeline ingestion (Plan 03+)
- SourceConfig protocol ready for all 201 source configs to implement
- Dashboard queries pre-built for Phase 5 frontend

## Self-Check: PASSED

All 10 created files verified on disk. All 3 task commits (d279794, bb5c59c, 408a4ed) verified in git log.

---
*Phase: 03-scraping-pipeline*
*Completed: 2026-03-20*
