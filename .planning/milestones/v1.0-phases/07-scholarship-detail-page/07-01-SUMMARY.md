---
phase: 07-scholarship-detail-page
plan: 01
subsystem: ui
tags: [react, convex, intl, markdown, regions, deadline, shared-helpers]

# Dependency graph
requires:
  - phase: 06.1-country-eligibility-filtering-university-tier-list-prestige-highlighting
    provides: ScholarshipCard with formatting helpers, Convex directory queries, prestige/urgency badge system
provides:
  - shared formatting helpers (formatFundingAmount, formatFundingType, urgencyVariantMap, urgencyLabelMap, hasLimitedInfo) in @/lib/shared.ts
  - deadline/timezone utilities (useCountdown, formatDeadlineDisplay, formatLastVerified, useIsHeroVisible) in @/lib/deadline.ts
  - region grouping (REGION_MAP, getRegion, groupByRegion) with 191 country codes in @/lib/regions.ts
  - getScholarshipDetail Convex query with source_ids resolved to {name, url} objects
  - react-markdown dependency installed for editorial notes rendering
affects: [07-02-PLAN, 07-03-PLAN]

# Tech tracking
tech-stack:
  added: [react-markdown]
  patterns: [shared-helpers-extraction, client-only-hooks-with-null-init, convex-relation-resolution]

key-files:
  created:
    - web/src/lib/shared.ts
    - web/src/lib/deadline.ts
    - web/src/lib/regions.ts
  modified:
    - web/src/components/directory/ScholarshipCard.tsx
    - web/convex/directory.ts
    - web/package.json

key-decisions:
  - "Broadened formatFundingAmount param type from full Doc<scholarships> to inline object type for reuse by detail page"
  - "useCountdown initializes to null for SSR hydration safety, returns numeric daysLeft only after client mount"
  - "useIsHeroVisible defaults to true to avoid sticky bar flash on initial render"
  - "getScholarshipDetail is a new query alongside getBySlug (not a modification) for backward compatibility"

patterns-established:
  - "Shared helpers pattern: extract formatting/mapping logic from components into @/lib/shared.ts for cross-component reuse"
  - "Client-only hooks: useState(null) + useEffect for SSR-safe countdown and observer hooks"
  - "Region grouping: UN M49-based REGION_MAP with alphabetical sort and 'Other' last"

requirements-completed: [DTLP-04, DTLP-05, DTLP-06, DTLP-08, DTLP-09, DTLP-10]

# Metrics
duration: 9min
completed: 2026-03-20
---

# Phase 7 Plan 1: Foundation Utilities Summary

**Shared formatting helpers, deadline/timezone hooks, region grouping, and Convex source-resolution query for scholarship detail page**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-20T18:15:11Z
- **Completed:** 2026-03-20T18:24:11Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- Extracted 5 shared helpers from ScholarshipCard into reusable @/lib/shared.ts, eliminating duplication with upcoming detail page
- Created 4 deadline/scroll utilities: SSR-safe countdown hook, timezone-aware deadline formatter, relative/absolute last-verified formatter, IntersectionObserver visibility hook
- Built region grouping library with 191 country codes across 6 regions for nationality expand grouped view
- Added getScholarshipDetail Convex query that resolves source_ids to {name, url} for attribution display
- Installed react-markdown for upcoming editorial notes markdown rendering

## Task Commits

Each task was committed atomically:

1. **Task 1: Install react-markdown, extract shared helpers from ScholarshipCard** - `3676bc2` (feat)
2. **Task 2: Create deadline utilities and region grouping library** - `f57e563` (feat)
3. **Task 3: Create getScholarshipDetail Convex query with source resolution** - `0ab3c8a` (feat)

## Files Created/Modified
- `web/src/lib/shared.ts` - Shared formatting helpers: urgencyVariantMap, urgencyLabelMap, hasLimitedInfo, formatFundingAmount, formatFundingType
- `web/src/lib/deadline.ts` - Deadline/scroll utilities: useCountdown, formatDeadlineDisplay, formatLastVerified, useIsHeroVisible
- `web/src/lib/regions.ts` - Region grouping: REGION_MAP (191 codes), getRegion, groupByRegion
- `web/src/components/directory/ScholarshipCard.tsx` - Refactored to import from @/lib/shared instead of defining locally
- `web/convex/directory.ts` - Added getScholarshipDetail query with source resolution
- `web/package.json` - Added react-markdown dependency
- `web/package-lock.json` - Updated lockfile

## Decisions Made
- Broadened formatFundingAmount parameter type from `Scholarship` (full Doc) to inline object type `{ award_amount_min?, award_amount_max?, award_currency? }` so detail page can call it without requiring a full Doc type
- useCountdown initializes state to null (not 0 or computed value) to prevent hydration mismatch between SSR and client
- useIsHeroVisible defaults to true so the sticky bar does not flash on initial page load before IntersectionObserver initializes
- Created getScholarshipDetail as a separate query alongside getBySlug rather than modifying getBySlug, preserving backward compatibility for other consumers

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All utilities ready for Plan 02 section components to import and use
- getScholarshipDetail query ready for the detail page route to consume
- react-markdown installed and ready for editorial notes rendering in Plan 02
- All 29 existing tests continue to pass

## Self-Check: PASSED

- All 3 created files verified on disk
- All 3 task commits verified in git log
- No stubs or placeholders found in created/modified files

---
*Phase: 07-scholarship-detail-page*
*Completed: 2026-03-20*
