---
phase: 05-admin-dashboard
plan: 06
subsystem: ui
tags: [convex, react, useQuery, admin, trust-level]

# Dependency graph
requires:
  - phase: 05-admin-dashboard
    provides: "countAffectedScholarships query in convex/admin.ts, SourceTrustManager component"
provides:
  - "Live pending scholarship count in SourceTrustManager pre-confirmation dialog"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Convex conditional useQuery with 'skip' for dialog-triggered queries"

key-files:
  created: []
  modified:
    - "web/src/components/admin/SourceTrustManager.tsx"

key-decisions:
  - "Used Convex conditional skip pattern for countAffectedScholarships -- query only fires when confirmingSource is set, avoiding unnecessary DB reads"

patterns-established:
  - "Conditional useQuery with 'skip': useQuery(api.x, condition ? args : 'skip') for dialog-gated data fetching"

requirements-completed: [ADMN-05]

# Metrics
duration: 1min
completed: 2026-03-22
---

# Phase 05 Plan 06: Source Trust Manager Affected Count Summary

**Live countAffectedScholarships query wired into SourceTrustManager pre-confirmation dialog replacing dead stub**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-22T09:59:05Z
- **Completed:** 2026-03-22T10:00:38Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Wired `countAffectedScholarships` Convex query into SourceTrustManager using conditional `"skip"` pattern
- Removed dead `affectedCount` useState and stub logic (`sources ? 0 : 0` anti-pattern)
- Dialog now shows three states: real positive count, zero count, and loading (no text)
- Simplified `handleApplyClick` and `handleConfirmApply` by removing dead code paths

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire countAffectedScholarships query and fix pre-confirm dialog** - `d7c9668` (feat)

**Plan metadata:** (pending final commit)

## Files Created/Modified
- `web/src/components/admin/SourceTrustManager.tsx` - Added live query for affected scholarship count, removed dead state/stub, updated dialog text

## Decisions Made
- Used Convex conditional `"skip"` pattern for `countAffectedScholarships` -- query only runs when a source is being confirmed, avoiding unnecessary DB reads when dialog is closed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 05 (admin-dashboard) is now fully complete with all 6 plans executed
- ADMN-05 gap (affected count in pre-confirmation dialog) is closed
- Ready for Phase 05 verification or next phase

## Self-Check: PASSED

- FOUND: web/src/components/admin/SourceTrustManager.tsx
- FOUND: d7c9668 (Task 1 commit)

---
*Phase: 05-admin-dashboard*
*Completed: 2026-03-22*
