---
phase: quick
plan: 260322-hcw
subsystem: database
tags: [convex, mutation, data-quality, scholarships]

provides:
  - demoteIncompleteScholarships mutation for auditing published scholarship completeness
affects: [directory, admin]

tech-stack:
  added: []
  patterns: [batch-query-and-patch with by_status index, dryRun mode for safe preview]

key-files:
  created: []
  modified: [web/convex/scraping.ts]

key-decisions:
  - "Used mutation (not internalMutation) for Convex dashboard one-off execution"
  - "Batch size of 500 via .take(500) to respect Convex query limits"
  - "editorial_notes describes all missing fields for admin triage"

requirements-completed: []

duration: 1min
completed: 2026-03-22
---

# Quick Task 260322-hcw: Demote Incomplete Published Scholarships Summary

**Convex mutation to audit published scholarships and demote those missing description, application_url, slug, or with fallback provider/country values to pending_review with editorial notes**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-22T06:32:16Z
- **Completed:** 2026-03-22T06:33:12Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Added `demoteIncompleteScholarships` mutation to scraping.ts
- Checks 5 completeness criteria: missing description, application_url, slug, "Unknown" provider, "International" country
- Supports dryRun mode (default false) to preview without patching
- Returns structured summary: `{ demoted, checked, reasons }` with per-field tallies
- Sets `editorial_notes` on demoted records describing which fields triggered the demotion

## Task Commits

Each task was committed atomically:

1. **Task 1: Create demoteIncompleteScholarships mutation** - `36f6528` (feat)

## Files Created/Modified
- `web/convex/scraping.ts` - Added demoteIncompleteScholarships mutation (81 lines)

## Decisions Made
- Used `mutation` (not `internalMutation`) so the function is callable from the Convex dashboard for one-off execution
- Batch size of 500 via `.take(500)` to stay within Convex query limits per transaction
- `editorial_notes` includes a comma-separated list of all missing fields for easy admin triage

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Steps
- Run `demoteIncompleteScholarships({ dryRun: true })` from Convex dashboard to preview impact
- Run `demoteIncompleteScholarships({})` to execute the demotion
- Re-run periodically after bulk publish operations to maintain directory quality

## Self-Check: PASSED

- web/convex/scraping.ts: FOUND
- Commit 36f6528: FOUND
- demoteIncompleteScholarships export: FOUND

---
*Quick task: 260322-hcw*
*Completed: 2026-03-22*
