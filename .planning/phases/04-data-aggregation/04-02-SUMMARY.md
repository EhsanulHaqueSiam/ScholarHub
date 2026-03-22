---
phase: 04-data-aggregation
plan: 02
subsystem: database
tags: [aggregation, dedup, merging, cycle-detection, convex, triggers, cron, vitest, tdd]

# Dependency graph
requires:
  - phase: 04-data-aggregation plan 01
    provides: aggregationHelpers.ts pure functions, match_key field + by_match_key index, match_status field
  - phase: 01-foundation
    provides: Convex schema with scholarships, raw_records, sources tables
  - phase: 06.1
    provides: Trigger-wrapped mutations (triggers.ts with wrapDB) for prestige/search_text auto-compute
provides:
  - aggregateBatch internal mutation for batch dedup, merge, cycle detection, auto-archive
  - backfillMatchKeys migration for existing scholarships without match_key
  - archiveExpired cron-driven daily cleanup of expired scholarships
  - completeRun post-scrape aggregation trigger via scheduler
  - 9 integration tests covering all aggregation behaviors
affects: [admin-dashboard, scraping-pipeline]

# Tech tracking
tech-stack:
  added: []
  patterns: [trigger-wrapped-internal-mutation, self-scheduling-batch-mutation, trust-weighted-field-resolution, cycle-detection-by-year]

key-files:
  created:
    - web/convex/aggregation.ts
    - web/src/tests/aggregation.test.ts
  modified:
    - web/convex/scraping.ts
    - web/convex/crons.ts

key-decisions:
  - "Year-aware cycle detection: same match_key + different year creates separate scholarship with previous_cycle_id link instead of merging"
  - "take() instead of paginate() for unpromoted raw_records since canonical_id is set during processing, making cursor-based pagination unreliable"
  - "isPossibleDuplicate flag passed to createScholarship instead of reading match_status from in-memory record object"

patterns-established:
  - "Trigger-wrapped internalMutation: customMutation(rawInternalMutation, customCtx(wrapDB)) for auto-computing prestige/search_text on scholarship writes"
  - "Self-scheduling batch mutations: process N items, schedule next batch if more remain, using take() with filter on processed state"
  - "Trust-weighted field resolution: resolveField picks highest-trust non-empty value with scrapedAt tiebreak"
  - "Aggregation run counts: log new/updated/duplicate per batch for observability"

requirements-completed: [AGGR-01, AGGR-02, AGGR-03, AGGR-04, AGGR-05, AGGR-06]

# Metrics
duration: 6min
completed: 2026-03-22
---

# Phase 4 Plan 2: Aggregation Pipeline Summary

**Trigger-wrapped aggregation mutations (batch dedup, trust-weighted merge, cycle detection, auto-archive) with completeRun post-scrape trigger and daily archive cron, all verified by 9 convex-test integration tests**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-22T06:45:35Z
- **Completed:** 2026-03-22T06:51:47Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Created aggregation.ts with 3 trigger-wrapped internal mutations (aggregateBatch, backfillMatchKeys, archiveExpired) implementing full dedup pipeline
- aggregateBatch handles composite matching (D-01), trust-weighted merging (D-05/D-06), partial match flagging (D-03), year-aware cycle detection (D-09/D-12), auto-archive (D-10/D-11), and run-level count logging
- Wired completeRun in scraping.ts to trigger aggregation after successful scrape runs via scheduler
- Added daily archive_expired cron at 4:00 UTC in crons.ts
- 9 integration tests passing with convex-test, full suite 82/82 with zero regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Integration tests for aggregation pipeline (TDD RED)** - `db61c28` (test)
2. **Task 2: Aggregation pipeline mutations with trigger-wrapped writes (TDD GREEN)** - `0301568` (feat)

_TDD: Task 1 created failing tests, Task 2 implemented code to make them pass._

## Files Created/Modified
- `web/convex/aggregation.ts` - 3 internal mutations: aggregateBatch (dedup/merge/cycle/archive), backfillMatchKeys (migration), archiveExpired (cron target)
- `web/src/tests/aggregation.test.ts` - 9 integration tests covering all aggregation behaviors using convex-test
- `web/convex/scraping.ts` - Added internal import and scheduler.runAfter call in completeRun to trigger aggregation
- `web/convex/crons.ts` - Added daily archive_expired cron job at 4:00 UTC

## Decisions Made
- Year-aware cycle detection prevents merging different annual cycles: records with same match_key but different years (extracted from title or deadline) create separate scholarship entries linked via previous_cycle_id, while same-year records with same match_key merge normally
- Used take() instead of paginate() for querying unpromoted raw_records because setting canonical_id during processing invalidates cursor-based pagination; take() naturally skips already-processed records on re-query
- Passed isPossibleDuplicate boolean flag to createScholarship instead of reading match_status from the in-memory record object (which doesn't reflect DB patches made earlier in the same transaction)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Year-aware cycle detection in merge logic**
- **Found during:** Task 2 (aggregateBatch implementation)
- **Issue:** Records with same match_key + degree overlap but different years (e.g., "DAAD 2025" and "DAAD 2026") would merge into one scholarship instead of creating separate cycle entries
- **Fix:** Added year extraction before merge decision; same-year records merge, different-year records create new scholarships with cycle linking
- **Files modified:** web/convex/aggregation.ts
- **Verification:** Cycle detection test passes (2 scholarships created, previous_cycle_id linked)
- **Committed in:** 0301568

**2. [Rule 1 - Bug] In-memory record state for match_status**
- **Found during:** Task 2 (possible_duplicate flagging)
- **Issue:** createScholarship read match_status from in-memory record object which didn't reflect the DB patch setting "possible_duplicate"; result was match_status always "new"
- **Fix:** Added isPossibleDuplicate parameter to createScholarship; match_status set based on flag, not in-memory state
- **Files modified:** web/convex/aggregation.ts
- **Verification:** possible_duplicate test passes (raw_record has match_status="possible_duplicate")
- **Committed in:** 0301568

**3. [Rule 1 - Bug] Test used different years for cross-source dedup scenario**
- **Found during:** Task 2 (test verification)
- **Issue:** Cross-source dedup test used "Chevening Awards 2025" and "Chevening Scholarship 2026" which triggered cycle detection instead of dedup merge
- **Fix:** Changed test to use same year (2025) for both records, correctly testing cross-source dedup behavior
- **Files modified:** web/src/tests/aggregation.test.ts
- **Verification:** Composite match test passes (1 scholarship from 2 sources)
- **Committed in:** 0301568

---

**Total deviations:** 3 auto-fixed (3 bugs)
**Impact on plan:** All auto-fixes necessary for correctness. Cycle detection and merge logic now correctly handle year differences. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Full aggregation pipeline is operational: raw_records from multiple sources are deduplicated, merged, and promoted to canonical scholarships
- Pipeline triggers automatically after scrape runs complete
- Daily cron archives expired scholarships
- Admin dashboard (Phase 5) can use match_status="possible_duplicate" to surface records needing manual review
- backfillMatchKeys mutation available for migrating existing scholarships

## Self-Check: PASSED

All files exist, all commits verified:
- web/convex/aggregation.ts: FOUND
- web/src/tests/aggregation.test.ts: FOUND
- 04-02-SUMMARY.md: FOUND
- db61c28 (Task 1 commit): FOUND
- 0301568 (Task 2 commit): FOUND

---
*Phase: 04-data-aggregation*
*Completed: 2026-03-22*
