---
phase: 03-scraping-pipeline
plan: 08
subsystem: infra
tags: [convex, monitoring, deactivation, github-issues, pipeline-runner]

requires:
  - phase: 03-scraping-pipeline
    provides: "RotDetector, GitHubIssueManager, HealthTracker, pipeline runner"
provides:
  - "Auto-deactivation of sources after 10+ consecutive failures or permanent-gone errors"
  - "GitHub Issue lifecycle: creation with stored issue numbers, duplicate prevention, auto-close on recovery"
  - "deactivateSource, storeGitHubIssueNumber, clearGitHubIssueNumber Convex mutations"
  - "updateSourceHealth now returns consecutive_failures and github_issue_number for runner decisions"
affects: [03-scraping-pipeline]

tech-stack:
  added: []
  patterns:
    - "Convex mutation return values used for runner decision-making (health data flows back to Python)"
    - "Duplicate issue prevention via stored github_issue_number check before creation"

key-files:
  created: []
  modified:
    - "web/convex/scraping.ts"
    - "scraping/src/scholarhub_pipeline/pipeline/runner.py"
    - "scraping/tests/test_pipeline.py"

key-decisions:
  - "updateSourceHealth mutation now returns {consecutive_failures, github_issue_number} to enable runner decision logic"
  - "Duplicate issue prevention uses health_result.get('github_issue_number') check, not a separate Convex query"

patterns-established:
  - "Convex mutations return health metadata so Python runner can make follow-up decisions without extra queries"

requirements-completed: [INFR-04, SCRP-06]

duration: 3min
completed: 2026-03-20
---

# Phase 03 Plan 08: Auto-Deactivation and Issue Lifecycle Summary

**Pipeline runner failure path calls should_deactivate for source deactivation, stores/checks GitHub Issue numbers to prevent duplicates, and auto-closes issues on source recovery**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-20T12:28:52Z
- **Completed:** 2026-03-20T12:31:53Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Three new Convex internalMutation functions: deactivateSource (sets health status + marks source inactive), storeGitHubIssueNumber, clearGitHubIssueNumber
- Runner failure path now checks should_deactivate() and fires deactivateSource mutation for sources with 10+ failures or permanent-gone errors
- Runner failure path checks existing github_issue_number before calling create_rot_issue to prevent duplicate GitHub Issues, then stores the returned issue number
- Runner success path auto-closes GitHub Issues when previously-failing sources recover, clearing the stored issue number
- Four new tests verify all paths: deactivation threshold, issue number storage, duplicate prevention, and issue closure on recovery

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Convex mutations for deactivation and issue number tracking** - `b29ea49` (feat)
2. **Task 2: Wire auto-deactivation and issue lifecycle into runner.py** - `9e6e8bb` (feat)

## Files Created/Modified

- `web/convex/scraping.ts` - Added deactivateSource, storeGitHubIssueNumber, clearGitHubIssueNumber mutations; updateSourceHealth now returns health metadata
- `scraping/src/scholarhub_pipeline/pipeline/runner.py` - Failure path: should_deactivate + deactivateSource, duplicate issue prevention, issue number storage; Success path: issue auto-closure
- `scraping/tests/test_pipeline.py` - Four new tests for deactivation, issue storage, duplicate prevention, recovery closure

## Decisions Made

- **updateSourceHealth returns health data:** Added return statements to the Convex mutation so Python runner can read consecutive_failures and github_issue_number without a separate query. This was necessary because the mutation previously returned nothing (Rule 3 - blocking issue fix).
- **Duplicate check uses mutation return value:** Instead of making a separate Convex query for github_issue_number, we use the return value from updateSourceHealth. This reduces round trips and keeps the logic simple.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] updateSourceHealth mutation missing return values**
- **Found during:** Task 2 (wiring runner.py)
- **Issue:** The Convex updateSourceHealth mutation had no return statement, so record_failure/record_success returned None to Python. Runner needs consecutive_failures and github_issue_number to make deactivation and duplicate-prevention decisions.
- **Fix:** Added return statements to all branches of updateSourceHealth returning {consecutive_failures, github_issue_number} where applicable.
- **Files modified:** web/convex/scraping.ts
- **Verification:** All 59 tests pass; mock return values in tests match new return shape.
- **Committed in:** 9e6e8bb (part of Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential for correctness -- without return values, the runner cannot make deactivation or duplicate-prevention decisions.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Auto-deactivation and issue lifecycle are fully wired, closing verification gaps 1 and 2
- Plan 09 (RSS feed configs) can proceed independently
- All 59 tests pass across test_pipeline.py and test_monitoring.py

---
*Phase: 03-scraping-pipeline*
*Completed: 2026-03-20*
