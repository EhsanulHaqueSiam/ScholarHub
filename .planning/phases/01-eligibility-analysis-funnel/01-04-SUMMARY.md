---
phase: 01-eligibility-analysis-funnel
plan: 04
subsystem: api
tags: [convex, react-hooks, eligibility, hybrid-compute, localStorage]

# Dependency graph
requires:
  - phase: 01-eligibility-analysis-funnel plan 01
    provides: StudentProfile types, ProfileStorage interface, scoring engine
provides:
  - Convex getMatchCount query for live wizard match counts
  - Convex getEligibleScholarships query for server-side hard constraint filtering
  - useStudentProfile hook for localStorage-backed profile state
  - useEligibilityMatching hook orchestrating hybrid compute (Convex + client scoring)
affects: [01-05, 01-06, 01-07, 01-08]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Convex eligibility queries under web/convex/eligibility.ts"
    - "useQuery skip sentinel for incomplete profile state"
    - "useMemo on join() to prevent unnecessary re-queries"

key-files:
  created:
    - web/convex/eligibility.ts
    - web/src/hooks/useStudentProfile.ts
    - web/src/hooks/useEligibilityMatching.ts
  modified: []

key-decisions:
  - "Mapped host_country (singular) to host_countries array in query response for EligibilitySummary compatibility"
  - "gender_requirement and source_name returned as undefined since scholarship table lacks these fields directly"
  - "SCAN_CAP of 600 matches existing directory.ts pattern for consistent Convex read budgets"

patterns-established:
  - "useQuery skip sentinel: pass 'skip' as const when profile args are incomplete"
  - "useMemo dependency on array.join() to stabilize references across re-renders"

requirements-completed: [D-07, D-20]

# Metrics
duration: 3min
completed: 2026-03-25
---

# Phase 01 Plan 04: Convex Eligibility Queries & React Hooks Summary

**Convex eligibility queries (getMatchCount, getEligibleScholarships) and React hooks (useStudentProfile, useEligibilityMatching) implementing D-20 hybrid compute model**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-24T19:05:20Z
- **Completed:** 2026-03-24T19:08:30Z
- **Tasks:** 2
- **Files created:** 3

## Accomplishments
- Created getMatchCount Convex query for lightweight live wizard match counts (D-07)
- Created getEligibleScholarships Convex query returning lean EligibilitySummary-shaped documents for client scoring
- Built useStudentProfile hook with localStorage persistence, SSR-safe hydration, and clearProfile support
- Built useEligibilityMatching hook orchestrating Convex server-side filtering + client-side scoring engine

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Convex eligibility queries** - `6a650cb` (feat)
2. **Task 2: Create useStudentProfile and useEligibilityMatching hooks** - `fc0afa7` (feat)

## Files Created
- `web/convex/eligibility.ts` - getMatchCount (count for wizard) and getEligibleScholarships (lean summaries for scoring)
- `web/src/hooks/useStudentProfile.ts` - Profile state management with localStorage adapter (D-29, D-32)
- `web/src/hooks/useEligibilityMatching.ts` - Hybrid compute orchestration: Convex filter + client score (D-20)

## Decisions Made
- Mapped `host_country` (singular string from schema) to `host_countries: [host_country]` array to match the EligibilitySummary interface expected by the scoring engine
- Used `undefined` for `gender_requirement` and `source_name` fields since the scholarships table doesn't have these as direct fields -- the scoring engine handles undefined gracefully (returns "not_required" for full points)
- Used SCAN_CAP constant (600) matching the existing directory.ts BATCH_QUERY_SCAN_CAP for consistent Convex read budgets

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed schema mismatch between EligibilitySummary and scholarships table**
- **Found during:** Task 1 (Convex eligibility queries)
- **Issue:** Plan specified returning `host_countries`, `funding_amount`, `language_requirements`, `gender_requirement`, `source_name` which don't exist as direct fields on the scholarships table. The schema has `host_country` (singular string), `award_amount_min/max`, `study_info.lang_ielts`, and no gender_requirement or source_name fields.
- **Fix:** Mapped `host_country` to `[host_country]` array, derived `funding_amount` from `award_amount_max + award_currency`, derived `language_requirements` from `study_info.lang_ielts`, set `gender_requirement` and `source_name` to undefined.
- **Files modified:** web/convex/eligibility.ts
- **Verification:** All acceptance criteria patterns verified via grep
- **Committed in:** 6a650cb (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix for schema mismatch)
**Impact on plan:** Essential fix -- plan's query shape didn't match actual schema. No scope creep.

## Issues Encountered
- Convex typecheck couldn't run in worktree (no node_modules), but TypeScript compilation verified clean in main repo
- Dependency files from Plan 01 (types.ts, profile-storage.ts, scoring.ts) not present in worktree -- copied from main repo where Plan 01 already committed them

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Convex queries ready for wizard components (Plan 05-06) to call via hooks
- useStudentProfile hook ready for wizard step components to manage profile state
- useEligibilityMatching hook ready for results page to display tier-grouped matches

---
*Phase: 01-eligibility-analysis-funnel*
*Completed: 2026-03-25*
