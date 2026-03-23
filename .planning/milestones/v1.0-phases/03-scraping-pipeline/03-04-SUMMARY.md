---
phase: 03-scraping-pipeline
plan: 04
subsystem: monitoring
tags: [structlog, health-tracking, rot-detection, github-issues, heartbeat]

requires:
  - phase: 03-scraping-pipeline-01
    provides: "PipelineConvexClient, Convex scraping/monitoring mutations"
provides:
  - "HealthTracker for per-source health status updates via Convex"
  - "RotDetector for consecutive failure thresholds and yield drop detection"
  - "GitHubIssueManager for auto-creating/closing scraper rot issues via gh CLI"
  - "HeartbeatMonitor for pipeline liveness checks via Convex"
affects: [03-scraping-pipeline-05, 03-scraping-pipeline-06, 03-scraping-pipeline-07]

tech-stack:
  added: []
  patterns:
    - "Mock-based testing for Convex client interactions"
    - "subprocess.run with gh CLI for GitHub Issues management"
    - "Structured logging with structlog for all monitoring events"

key-files:
  created:
    - scraping/src/scholarhub_pipeline/monitoring/health.py
    - scraping/src/scholarhub_pipeline/monitoring/rot_detector.py
    - scraping/src/scholarhub_pipeline/monitoring/github_issues.py
    - scraping/src/scholarhub_pipeline/monitoring/heartbeat.py
    - scraping/tests/test_monitoring.py
  modified:
    - scraping/src/scholarhub_pipeline/monitoring/__init__.py

key-decisions:
  - "RotDetector alerts exactly at failure threshold (==5) to prevent duplicate GitHub Issues"
  - "Error types 404/410 trigger immediate deactivation as permanent-gone indicators"
  - "HeartbeatMonitor delegates staleness check to Convex query rather than client-side calculation"

patterns-established:
  - "Health status transitions: healthy -> degraded -> failing -> deactivated"
  - "Yield drop detection: below 50% of rolling average flags degraded status"
  - "GitHub Issue lifecycle: auto-create at threshold, auto-close on recovery"

requirements-completed: [INFR-04, SCRP-06]

duration: 4min
completed: 2026-03-20
---

# Phase 03 Plan 04: Monitoring Subsystem Summary

**Source health tracking with rot detection (consecutive failures + yield drops), GitHub Issue auto-create/close via gh CLI, and pipeline heartbeat monitoring**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-20T11:19:33Z
- **Completed:** 2026-03-20T11:23:54Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- HealthTracker records success/failure to Convex with error type validation and message truncation
- RotDetector detects consecutive failures (5=alert, 10=deactivate), permanent-gone errors (404/410), and yield drops below 50% of average
- GitHubIssueManager creates structured issues via gh CLI with source info, error details, and suggested fixes; auto-closes on recovery
- HeartbeatMonitor updates pipeline liveness timestamp and checks for staleness via Convex query
- 37 passing tests across all 4 monitoring components

## Task Commits

Each task was committed atomically:

1. **Task 1: Health tracker, rot detector, and heartbeat** (TDD)
   - `57c8317` (test) - Failing tests for monitoring subsystem
   - `bda908a` (feat) - Implement health tracker, rot detector, and heartbeat monitor
2. **Task 2: GitHub Issues integration** - `72fa3f8` (feat)

## Files Created/Modified
- `scraping/src/scholarhub_pipeline/monitoring/health.py` - HealthTracker with record_success/record_failure Convex mutations
- `scraping/src/scholarhub_pipeline/monitoring/rot_detector.py` - RotDetector with thresholds, yield drop, error classification
- `scraping/src/scholarhub_pipeline/monitoring/github_issues.py` - GitHubIssueManager with create/close/suggest_fix via gh CLI
- `scraping/src/scholarhub_pipeline/monitoring/heartbeat.py` - HeartbeatMonitor with update and is_stale via Convex
- `scraping/src/scholarhub_pipeline/monitoring/__init__.py` - Module exports for all 4 components
- `scraping/tests/test_monitoring.py` - 37 tests covering all monitoring behaviors

## Decisions Made
- RotDetector alerts exactly at `consecutive_failures == 5` (not `>=`) to prevent duplicate GitHub Issues on every subsequent failure
- Error types "404" and "410" are classified as permanent-gone and trigger immediate deactivation regardless of failure count
- HeartbeatMonitor delegates staleness calculation to the Convex `monitoring:getStaleHeartbeat` query rather than replicating the 48h logic client-side

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed ruff S607 noqa placement on subprocess calls**
- **Found during:** Task 2 (GitHub Issues implementation)
- **Issue:** `# noqa: S603, S607` on `subprocess.run` line didn't suppress S607 which fires on the list literal, not the function call
- **Fix:** Split noqa directives: S603 on `subprocess.run` line, S607 on the list literal line
- **Files modified:** `scraping/src/scholarhub_pipeline/monitoring/github_issues.py`
- **Verification:** `ruff check` passes clean on all monitoring source modules
- **Committed in:** 72fa3f8 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Minor lint fix. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Monitoring subsystem ready for integration with scraper execution (Plan 05/06)
- HealthTracker and RotDetector ready to be called after each source scrape
- GitHubIssueManager ready to be triggered when RotDetector.should_alert() returns True

## Self-Check: PASSED

All 6 files verified present. All 3 commits verified in git log.

---
*Phase: 03-scraping-pipeline*
*Completed: 2026-03-20*
