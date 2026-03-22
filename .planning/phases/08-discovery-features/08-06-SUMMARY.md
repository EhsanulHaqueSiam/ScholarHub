---
phase: 08-discovery-features
plan: 06
subsystem: ui
tags: [react, comparison, radix-popover, convex, vitest, accessibility, wcag]

# Dependency graph
requires:
  - phase: 08-discovery-features
    provides: "Compare context (Plan 04), CSS variables (Plan 02), Convex comparison query (Plan 01)"
  - phase: 06.1-country-eligibility-filtering-university-tier-list-prestige-highlighting
    provides: "Directory components, badge variants, prestige system, country utilities"
  - phase: 07-scholarship-detail-page
    provides: "Detail page route pattern, funding formatters, shared utilities"
provides:
  - "ComparisonTable component with WCAG AA semantic HTML table"
  - "SearchToAdd component with Radix Popover and debounced search"
  - "/scholarships/compare route with shareable URLs and SEO meta tags"
  - "Comparison Convex query (getComparisonScholarships)"
  - "CompareContext provider for compare state management"
  - "--compare-diff-bg CSS variable for difference highlighting"
affects: [08-discovery-features]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "isDifferent helper for field comparison with array normalization"
    - "Radix Popover for search-to-add dropdown pattern"
    - "URL search param (?s=slug1,slug2) for shareable comparison links"

key-files:
  created:
    - "web/src/components/comparison/ComparisonTable.tsx"
    - "web/src/components/comparison/SearchToAdd.tsx"
    - "web/src/components/comparison/CompareContext.tsx"
    - "web/src/routes/scholarships/compare.tsx"
    - "web/convex/comparison.ts"
    - "web/src/__tests__/ComparisonTable.test.tsx"
  modified:
    - "web/src/index.css"
    - "web/convex/_generated/api.d.ts"

key-decisions:
  - "Created blocking dependency files (comparison.ts, CompareContext, CSS vars) inline since parallel agents build them simultaneously"
  - "Used semantic HTML table with th scope=col/row for WCAG AA screen reader support"
  - "Difference highlighting uses CSS variable var(--compare-diff-bg) for light/dark mode consistency"

patterns-established:
  - "Comparison field rendering: COMPARISON_FIELDS array drives table rows with renderField switch"
  - "isDifferent: sorted JSON.stringify for array comparison, strict equality for scalars"

requirements-completed: [DISC-02]

# Metrics
duration: 4min
completed: 2026-03-23
---

# Phase 08 Plan 06: Scholarship Comparison Summary

**Side-by-side comparison table with difference highlighting, search-to-add, and shareable /scholarships/compare route**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-22T19:41:54Z
- **Completed:** 2026-03-22T19:46:00Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- ComparisonTable renders semantic HTML table with 10 field rows, difference highlighting in warm yellow, and sticky first column for mobile
- SearchToAdd uses Radix Popover with debounced search suggestions from existing directory.searchSuggestions query
- /scholarships/compare route handles empty state, loading skeleton, partial data warning, and dynamic meta title updates
- 14 unit tests for isDifferent and renderField helper functions, all passing

## Task Commits

Each task was committed atomically:

1. **Task 1: ComparisonTable + SearchToAdd components** - `c86ffca` (feat)
2. **Task 2: /scholarships/compare route with SEO** - `a6c7ecb` (feat)

## Files Created/Modified
- `web/src/components/comparison/ComparisonTable.tsx` - Side-by-side comparison table with isDifferent highlighting, renderField, Apply/Remove buttons
- `web/src/components/comparison/SearchToAdd.tsx` - Radix Popover search dropdown to add scholarships to comparison
- `web/src/components/comparison/CompareContext.tsx` - React context for compare state (selected items, add/remove/clear)
- `web/src/routes/scholarships/compare.tsx` - Compare page route with empty/loading/error/partial states and SEO
- `web/convex/comparison.ts` - getComparisonScholarships query resolving slugs to full docs with sources
- `web/convex/_generated/api.d.ts` - Updated to include comparison module for typed imports
- `web/src/index.css` - Added --compare-diff-bg CSS variable for light and dark modes
- `web/src/__tests__/ComparisonTable.test.tsx` - 14 unit tests for isDifferent and renderField functions

## Decisions Made
- Created blocking dependency files (comparison.ts, CompareContext, CSS variables) inline since parallel agents build Plans 01, 02, 04 simultaneously -- Rule 3 auto-fix for blocking issues
- Used semantic HTML table with th scope="col" and scope="row" for WCAG AA accessibility per UI-SPEC D-98
- Difference highlighting uses CSS variable `var(--compare-diff-bg)` rather than inline oklch values, supporting light/dark mode via :root/.dark overrides

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created comparison.ts Convex module**
- **Found during:** Task 1 (ComparisonTable implementation)
- **Issue:** web/convex/comparison.ts (dependency from Plan 01) doesn't exist in this worktree since Plan 01 runs in parallel
- **Fix:** Created the getComparisonScholarships query matching the interface spec from the plan
- **Files modified:** web/convex/comparison.ts, web/convex/_generated/api.d.ts
- **Verification:** TypeScript imports resolve, query used correctly in compare route
- **Committed in:** c86ffca (Task 1 commit)

**2. [Rule 3 - Blocking] Created CompareContext provider**
- **Found during:** Task 1 (ComparisonTable implementation)
- **Issue:** web/src/components/comparison/CompareContext.tsx (dependency from Plan 04) doesn't exist in this worktree
- **Fix:** Created the CompareProvider and useCompare hook matching the interface spec
- **Files modified:** web/src/components/comparison/CompareContext.tsx
- **Verification:** ComparisonTable and SearchToAdd correctly import and use useCompare
- **Committed in:** c86ffca (Task 1 commit)

**3. [Rule 3 - Blocking] Added --compare-diff-bg CSS variable**
- **Found during:** Task 1 (ComparisonTable implementation)
- **Issue:** --compare-diff-bg CSS variable (dependency from Plan 02) not defined in index.css
- **Fix:** Added the variable to both :root (light) and .dark (dark) blocks per UI-SPEC color values
- **Files modified:** web/src/index.css
- **Verification:** ComparisonTable uses var(--compare-diff-bg) for difference highlighting
- **Committed in:** c86ffca (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (3 blocking -- all dependency files from parallel plans)
**Impact on plan:** All auto-fixes necessary to unblock execution. Created minimal implementations matching interface specs. No scope creep -- parallel plan agents will produce their own versions that will be merged.

## Issues Encountered
- Vitest not installed in worktree -- ran `bun install` to install all dependencies before test execution

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Comparison page fully functional with shareable URLs
- DISC-02 (scholarship comparison) requirement complete
- Ready for integration with CompareCheckbox on cards (Plan 04) and CompareBar floating UI (Plan 04)

## Self-Check: PASSED

All 6 created files verified on disk. Both task commits (c86ffca, a6c7ecb) verified in git log.

---
*Phase: 08-discovery-features*
*Completed: 2026-03-23*
