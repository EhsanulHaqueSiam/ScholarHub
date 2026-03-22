---
phase: 05-admin-dashboard
plan: 03
subsystem: ui
tags: [react, radix-tabs, radix-alert-dialog, radix-tooltip, admin, review-queue, bulk-actions, selection]

# Dependency graph
requires:
  - phase: 05-admin-dashboard
    provides: "Admin backend queries/mutations (getReviewQueue, approve, reject, bulk ops)"
  - phase: 05-admin-dashboard
    provides: "StatsBar and StatCard components for admin index"
provides:
  - "ReviewQueue: tabbed status switching, client-side trust sorting, pagination at 20/page"
  - "QueueRow: expandable row with compact/expanded states, approve/reject with dedup error handling"
  - "BulkActionBar: fixed floating bar for bulk approve/reject with confirmation dialogs"
  - "DuplicateBadge: amber warning badge for possible duplicate scholarships"
  - "useAdminSelection: selection state management hook (toggle, selectAll, deselectAll)"
  - "Updated admin index page with StatsBar + ReviewQueue"
affects: [05-04, 05-05]

# Tech tracking
tech-stack:
  added:
    - "@radix-ui/react-alert-dialog for reject confirmation dialogs"
    - "@radix-ui/react-tooltip for expand chevron tooltips"
  patterns:
    - "Client-side trust-rank sorting using TRUST_RANK map (government:4, official_program:3, foundation:2, aggregator/university:1)"
    - "Accordion expand with single-row-at-a-time behavior via expandedId state"
    - "Inline error display for dedup violations on approve"
    - "Select-all with indeterminate checkbox state for partial selection"

key-files:
  created:
    - "web/src/hooks/useAdminSelection.ts"
    - "web/src/components/admin/ReviewQueue.tsx"
    - "web/src/components/admin/DuplicateBadge.tsx"
    - "web/src/components/admin/QueueRow.tsx"
    - "web/src/components/admin/BulkActionBar.tsx"
  modified:
    - "web/convex/admin.ts"
    - "web/src/routes/admin/index.tsx"

key-decisions:
  - "getReviewQueue updated to support no-status-filter for All tab (previously defaulted to pending_review)"
  - "Client-side pagination at 20 items per page with trust-rank sorting before slicing"
  - "AlertDialog used for reject confirmation, Tooltip for expand chevron hints"

patterns-established:
  - "Admin selection hook pattern: Set-based state with toggle/selectAll/deselectAll for bulk operations"
  - "Queue row accordion: single expanded row at a time, reset on tab change"
  - "Inline mutation error display pattern for dedup violations"

requirements-completed: [ADMN-01, ADMN-03, ADMN-04, ADMN-08]

# Metrics
duration: 3min
completed: 2026-03-22
---

# Phase 05 Plan 03: Review Queue UI Summary

**Review queue with tabbed status switching, expandable rows with approve/reject actions, bulk selection via floating action bar, and duplicate warning badges**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-22T09:06:23Z
- **Completed:** 2026-03-22T09:10:14Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Built complete review queue UI with 5 status tabs (Pending Review, Published, Rejected, Archived, All) and real-time count badges
- Expandable queue rows showing all scholarship fields, source provenance with trust badges, and approve/reject/edit actions with dedup error handling
- Floating bulk action bar with approve/reject for multiple selected scholarships, including confirmation dialogs matching UI-SPEC copywriting
- Selection management with select-all checkbox (indeterminate state), tab-switch clearing, and client-side trust-based sorting

## Task Commits

Each task was committed atomically:

1. **Task 1: useAdminSelection hook + ReviewQueue + DuplicateBadge** - `2040826` (feat)
2. **Task 2: QueueRow + BulkActionBar + wire admin index page** - `8b34bc1` (feat)

## Files Created/Modified
- `web/src/hooks/useAdminSelection.ts` - Selection state management hook with toggle/selectAll/deselectAll
- `web/src/components/admin/ReviewQueue.tsx` - Tabbed queue with Radix Tabs, trust sorting, pagination, select-all
- `web/src/components/admin/DuplicateBadge.tsx` - Amber warning badge for possible duplicate scholarships
- `web/src/components/admin/QueueRow.tsx` - Expandable row with compact/expanded states, approve/reject mutations, dedup error display
- `web/src/components/admin/BulkActionBar.tsx` - Fixed bottom floating bar for bulk approve/reject with AlertDialog confirmation
- `web/convex/admin.ts` - Updated getReviewQueue to support fetching all statuses for All tab
- `web/src/routes/admin/index.tsx` - Replaced placeholder with ReviewQueue component

## Decisions Made
- Updated getReviewQueue backend to support no-status filter (All tab) instead of always defaulting to pending_review
- Used @radix-ui/react-alert-dialog for reject confirmations (clean accessible modal pattern)
- Used @radix-ui/react-tooltip for expand chevron hints with 200ms delay

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated getReviewQueue to support All tab**
- **Found during:** Task 1 (ReviewQueue implementation)
- **Issue:** Backend getReviewQueue always defaulted to pending_review status when no status provided, making the All tab impossible
- **Fix:** Changed handler to fetch all scholarships when no status arg is provided
- **Files modified:** web/convex/admin.ts
- **Verification:** TypeScript compiles, All tab now receives unfiltered results
- **Committed in:** 2040826 (Task 1 commit)

**2. [Rule 3 - Blocking] Installed missing Radix packages**
- **Found during:** Task 2 (QueueRow + BulkActionBar implementation)
- **Issue:** @radix-ui/react-alert-dialog and @radix-ui/react-tooltip not installed
- **Fix:** Ran bun add for both packages
- **Files modified:** web/package.json, web/bun.lock
- **Verification:** Imports resolve, TypeScript compiles
- **Committed in:** 8b34bc1 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes were necessary for feature completeness. No scope creep.

## Known Stubs

- `web/src/components/admin/ReviewQueue.tsx:189` - onEdit callback is a no-op. Intentional: EditPanel will be wired in Plan 04.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Review queue is fully functional for viewing, sorting, and taking action on scholarships
- Plan 04 (EditPanel) can wire the onEdit callback to open the slide-out edit sheet
- Plan 05 (SourceTrustManager) can be built independently

## Self-Check: PASSED

All 7 files found. Both commits (2040826, 8b34bc1) verified. Summary file exists.

---
*Phase: 05-admin-dashboard*
*Completed: 2026-03-22*
