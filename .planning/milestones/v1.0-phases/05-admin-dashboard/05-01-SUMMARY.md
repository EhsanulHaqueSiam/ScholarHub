---
phase: 05-admin-dashboard
plan: 01
subsystem: api
tags: [convex, admin, mutations, queries, trust-levels, dedup, revision-tracking, auto-publish]

# Dependency graph
requires:
  - phase: 04-data-aggregation
    provides: "aggregation pipeline, match_key dedup, trust-weighted merge"
  - phase: 01-foundation
    provides: "Convex schema, trigger system, prestige scoring"
provides:
  - "Admin queries: getAdminStats, getReviewQueue, getRevisionHistory"
  - "Admin mutations: approveScholarship, rejectScholarship, bulkApprove, bulkReject"
  - "updateScholarship with revision tracking in scholarship_revisions table"
  - "updateSourceTrust with retroactive re-evaluation of pending scholarships"
  - "Auto-publish logic in aggregation pipeline via determineStatus"
  - "adminHelpers: isAdmin guard stub, hasRequiredFields, determineStatus"
affects: [05-02, 05-03, 05-04, 05-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "triggeredMutation for admin writes with trigger-aware DB wrapper"
    - "determineStatus function for trust-based status resolution"
    - "Revision tracking via scholarship_revisions table on field changes"
    - "Batch re-evaluation via scheduler for retroactive trust changes"
    - "Dedup enforcement at approve boundary using match_key index"

key-files:
  created:
    - "web/convex/admin.ts"
    - "web/convex/adminHelpers.ts"
    - "web/src/tests/admin.test.ts"
  modified:
    - "web/convex/schema.ts"
    - "web/convex/aggregation.ts"
    - "web/src/tests/aggregation.test.ts"

key-decisions:
  - "isAdmin guard stub always returns true for Phase 5 (D-08), ready for Clerk integration"
  - "determineStatus uses null initial trust baseline to correctly handle blocked-only sources"
  - "updateSourceTrust uses plain mutation (not triggered) since it patches sources, not scholarships"

patterns-established:
  - "Admin mutations use triggeredMutation wrapping rawMutation with wrapDB for prestige/search_text triggers"
  - "Revision tracking: insert per-field changes into scholarship_revisions before patching scholarship"
  - "Retroactive re-evaluation: scheduler-based batch processing of pending scholarships after trust change"

requirements-completed: [ADMN-01, ADMN-02, ADMN-03, ADMN-04, ADMN-05, ADMN-06, ADMN-08]

# Metrics
duration: 6min
completed: 2026-03-22
---

# Phase 05 Plan 01: Admin Backend Summary

**Complete admin backend with trust-based auto-publish, dedup-enforced approval, revision tracking, and retroactive re-evaluation on source trust changes**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-22T08:56:57Z
- **Completed:** 2026-03-22T09:03:26Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Built complete admin query and mutation layer: stats, review queue, approve/reject (single + bulk), edit with revisions, source trust management
- Replaced hardcoded status: "published" in aggregation pipeline with trust-based determineStatus resolving auto_publish/needs_review/blocked with field completeness gate
- Added dedup enforcement at approve boundary (ADMN-08) preventing duplicate match_key approvals
- Full test coverage: 7 admin tests + 4 auto-publish aggregation tests, 93 total tests passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Schema evolution + admin helpers + admin mutations** - `af60f66` (feat)
2. **Task 2: Auto-publish in aggregation pipeline + admin tests** - `d4ef884` (feat)

## Files Created/Modified
- `web/convex/admin.ts` - Admin queries (getAdminStats, getReviewQueue, getRevisionHistory) and mutations (approve, reject, bulk ops, edit, trust update, re-evaluate)
- `web/convex/adminHelpers.ts` - isAdmin guard stub, hasRequiredFields completeness check, determineStatus trust resolution
- `web/convex/schema.ts` - Added scholarship_revisions table with by_scholarship and by_changed_at indexes
- `web/convex/aggregation.ts` - Replaced hardcoded published status with determineStatus, added re-evaluation in mergeIntoScholarship
- `web/src/tests/admin.test.ts` - 7 tests covering queue, approve, dedup, bulk ops, revisions, trust update
- `web/src/tests/aggregation.test.ts` - 4 new auto-publish tests for trust level status determination

## Decisions Made
- isAdmin guard stub always returns true (D-08) -- defense in depth for future Clerk integration without rewriting mutations
- determineStatus initializes trust baseline to null instead of "needs_review" to correctly detect blocked-only sources
- updateSourceTrust uses plain mutation (not triggeredMutation) since it writes to sources table, not scholarships

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed determineStatus blocked source detection**
- **Found during:** Task 2 (auto-publish tests)
- **Issue:** Initial trust baseline was "needs_review" (order 2), so a blocked source (order 1) could never become the highest trust, returning "pending_review" instead of "rejected"
- **Fix:** Changed initial highestTrust from "needs_review" to null, so the first source sets the baseline regardless of its trust level
- **Files modified:** web/convex/adminHelpers.ts
- **Verification:** "sets rejected for blocked source" test passes
- **Committed in:** d4ef884 (Task 2 commit)

**2. [Rule 1 - Bug] Updated existing aggregation test for trust-aware pipeline**
- **Found during:** Task 2 (aggregation test run)
- **Issue:** "auto-archives expired scholarships" test used a source without trust_level, defaulting to needs_review. After the auto-publish change, scholarships from needs_review sources get pending_review status instead of published, so auto-archive (which only archives published) never triggered.
- **Fix:** Added trust_level: "auto_publish", description, and application_url to the test source and raw record
- **Files modified:** web/src/tests/aggregation.test.ts
- **Verification:** Test passes, 93 total tests green
- **Committed in:** d4ef884 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes were necessary for correct behavior. The blocked-source logic bug was a functional defect. The test update was required by the pipeline behavior change. No scope creep.

## Known Stubs

- `web/convex/adminHelpers.ts:16` - `isAdmin()` always returns true. Intentional for Phase 5 (no auth). Will be replaced with Clerk token check in future auth phase.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All admin backend queries and mutations are ready for frontend consumption in plans 02-05
- Frontend plans can import from `admin.ts` for all dashboard functionality
- The aggregation pipeline now respects source trust levels for auto-publish decisions

## Self-Check: PASSED

All 6 files found. Both commits (af60f66, d4ef884) verified. Summary file exists.

---
*Phase: 05-admin-dashboard*
*Completed: 2026-03-22*
