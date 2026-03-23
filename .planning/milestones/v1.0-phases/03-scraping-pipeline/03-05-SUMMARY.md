---
phase: 03-scraping-pipeline
plan: 05
subsystem: pipeline
tags: [click, structlog, asyncio, pipeline, scheduler, buffer, cli]

requires:
  - phase: 03-scraping-pipeline/plan-01
    provides: SourceConfig protocol and discover_configs
  - phase: 03-scraping-pipeline/plan-02
    provides: Ingestion layer (ConvexClient, BatchAccumulator, SourceDeduplicator)
  - phase: 03-scraping-pipeline/plan-03
    provides: Scraper factory (get_scraper) and all 6 scraper types
  - phase: 03-scraping-pipeline/plan-04
    provides: Monitoring (HealthTracker, RotDetector, GitHubIssueManager, HeartbeatMonitor)
provides:
  - PipelineRunner orchestrating full scrape lifecycle
  - SourceScheduler for frequency filtering and method grouping
  - LocalBuffer for Convex downtime resilience and dry-run output
  - CLI with 7 subcommands (run, status, gen-config, export, validate, reactivate, health)
affects: [03-scraping-pipeline/plan-07, github-actions, deployment]

tech-stack:
  added: []
  patterns: [async pipeline orchestration, click CLI with lazy imports, method-grouped execution]

key-files:
  created:
    - scraping/src/scholarhub_pipeline/pipeline/runner.py
    - scraping/src/scholarhub_pipeline/pipeline/scheduler.py
    - scraping/src/scholarhub_pipeline/pipeline/buffer.py
    - scraping/src/scholarhub_pipeline/cli.py
    - scraping/tests/test_pipeline.py
    - scraping/tests/test_cli.py
  modified:
    - scraping/src/scholarhub_pipeline/pipeline/__init__.py
    - .gitignore

key-decisions:
  - "Pipeline groups sources by method (api, jsonld, ajax, rss, scrape, scrapling) for efficient batch execution"
  - "CLI uses lazy imports inside click commands to avoid loading Convex client for --help and dry-run"
  - "LocalBuffer doubles as dry-run output store and Convex downtime resilience layer"

patterns-established:
  - "Pipeline lifecycle: startRun -> scrape sources by method group -> completeRun with stats"
  - "CLI commands use lazy imports to avoid requiring Convex credentials for local-only operations"

requirements-completed: [SCRP-04, SCRP-06, SCRP-07]

duration: 7min
completed: 2026-03-20
---

# Phase 03 Plan 05: Pipeline Runner and CLI Summary

**Pipeline orchestrator with frequency scheduling, method grouping, local buffer, and 7-command CLI for scrape run lifecycle management**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-20T11:31:12Z
- **Completed:** 2026-03-20T11:38:29Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- PipelineRunner orchestrates full scrape lifecycle: config discovery, frequency filtering, method-grouped execution, batched ingestion, health tracking, and heartbeat updates
- SourceScheduler filters sources by frequency (default 168h weekly), excludes auth-required sources, and groups by scraping method
- LocalBuffer persists records to local JSON for dry-run mode and Convex downtime resilience
- CLI provides all 7 subcommands with rich terminal output, structured JSON log mode, and proper Click argument parsing
- 36 tests total (18 pipeline + 18 CLI) all passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Pipeline runner, scheduler, and buffer** - `8990df7` (feat)
2. **Task 2: CLI with all 7 subcommands** - `380f234` (feat)

## Files Created/Modified
- `scraping/src/scholarhub_pipeline/pipeline/runner.py` - PipelineRunner: full scrape lifecycle orchestrator
- `scraping/src/scholarhub_pipeline/pipeline/scheduler.py` - SourceScheduler: frequency filtering and method grouping
- `scraping/src/scholarhub_pipeline/pipeline/buffer.py` - LocalBuffer: JSON file buffer for offline/dry-run
- `scraping/src/scholarhub_pipeline/pipeline/__init__.py` - Package exports for PipelineRunner, SourceScheduler, LocalBuffer
- `scraping/src/scholarhub_pipeline/cli.py` - Click CLI: run, status, gen-config, export, validate, reactivate, health
- `scraping/tests/test_pipeline.py` - 18 tests: scheduler filtering, buffer round-trip, runner lifecycle
- `scraping/tests/test_cli.py` - 18 tests: all command help, argument parsing, mock execution
- `.gitignore` - Added scraping/.buffer/ for dry-run output

## Decisions Made
- Pipeline groups sources by method (api, jsonld, ajax, rss, scrape, scrapling) for efficient batch execution -- similar scrapers run together
- CLI uses lazy imports inside click commands to avoid loading Convex client for --help and dry-run operations
- LocalBuffer serves dual purpose: dry-run output storage and Convex downtime resilience layer
- Mock Convex mutation returns different values by mutation name to properly test batched ingestion flow

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Convex mock returning string for batch mutations**
- **Found during:** Task 1 (test_last_verified)
- **Issue:** MagicMock.mutation returned "run_123" for all calls, but BatchAccumulator.flush() expected dict with inserted/updated/unchanged keys
- **Fix:** Used side_effect function to return appropriate values based on mutation name
- **Files modified:** scraping/tests/test_pipeline.py
- **Verification:** All 18 pipeline tests pass
- **Committed in:** 8990df7 (Task 1 commit)

**2. [Rule 3 - Blocking] Fixed mock paths for lazy CLI imports**
- **Found during:** Task 2 (CLI tests)
- **Issue:** `patch("scholarhub_pipeline.cli.PipelineRunner")` failed because CLI uses lazy imports inside click commands, so PipelineRunner is not an attribute of cli module
- **Fix:** Changed patch targets to source module paths: `scholarhub_pipeline.pipeline.runner.PipelineRunner` and `scholarhub_pipeline.configs.discover_configs`
- **Files modified:** scraping/tests/test_cli.py
- **Verification:** All 18 CLI tests pass
- **Committed in:** 380f234 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both auto-fixes were test infrastructure issues. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Pipeline runner, scheduler, buffer, and CLI all complete
- Ready for Plan 07 (GitHub Actions workflow) to automate scheduled pipeline runs
- dry-run mode verified working end-to-end against 201 real source configs

---
*Phase: 03-scraping-pipeline*
*Completed: 2026-03-20*
