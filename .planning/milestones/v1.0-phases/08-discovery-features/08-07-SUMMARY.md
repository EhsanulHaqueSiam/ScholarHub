---
phase: 08-discovery-features
plan: 07
subsystem: ui
tags: [react, radix-tooltip, tanstack-router, convex, tags, collections, related-scholarships]

requires:
  - phase: 08-01
    provides: Tag system (tags.ts), related scoring algorithm (related.ts), collection CRUD (collections.ts)
  - phase: 08-02
    provides: Schema with tags, related_ids, collections, related_weights tables
  - phase: 08-04
    provides: CompareCheckbox component for comparison feature integration
provides:
  - TagBadges component with Radix Tooltip descriptions and expand/collapse
  - CollectionBadges component with linked emoji badges (D-50)
  - RelatedScholarships section with compact cards and compare checkboxes
  - Detail page integration wiring tags, collections, and related scholarships
affects: [08-08, detail-page, comparison]

tech-stack:
  added: []
  patterns:
    - Radix Tooltip with 200ms delay for tag badge descriptions
    - Horizontal snap scroll with CSS grid breakpoint fallback for related cards
    - Conditional Convex query with "skip" sentinel for dependent data loading

key-files:
  created:
    - web/src/components/detail/TagBadges.tsx
    - web/src/components/detail/CollectionBadges.tsx
    - web/src/components/detail/RelatedScholarships.tsx
  modified:
    - web/src/components/detail/HeroSection.tsx
    - web/src/routes/scholarships/$slug.tsx
    - web/convex/_generated/api.d.ts

key-decisions:
  - "Tag badges use transparent bg with hover transition instead of solid neutral variant for subtler outline-only appearance"
  - "Related cards use Card-wrapped section layout matching SourcesSection pattern for visual consistency"
  - "Collections query uses skip sentinel to avoid querying before scholarship data loads"

patterns-established:
  - "Tooltip-enhanced badges: Radix Tooltip.Root wrapping Badge with 200ms delay and arrow"
  - "Detail page feature sections: Card-wrapped sections with CardHeader/CardContent after SourcesSection"

requirements-completed: [DISC-01, DISC-03]

duration: 3min
completed: 2026-03-23
---

# Phase 08 Plan 07: Detail Page Tags, Collections, and Related Scholarships Summary

**Tag badges with tooltips, collection membership badges (D-50), and Similar Scholarships section with compact compare-enabled cards on the scholarship detail page**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-22T19:42:34Z
- **Completed:** 2026-03-22T19:45:51Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- TagBadges component shows clickable outline badges with Radix Tooltip descriptions, expand/collapse for 5+ tags, and tag-filtered directory navigation
- CollectionBadges component displays which curated collections contain a scholarship (D-50), each linking to /collections/{slug}
- RelatedScholarships section shows 4-6 compact cards with compare checkboxes, horizontal scroll on mobile, grid on desktop
- Detail route fully wired: tags and collections passed to HeroSection, related scholarships rendered after Sources

## Task Commits

Each task was committed atomically:

1. **Task 1: TagBadges + CollectionBadges + HeroSection integration** - `eab8cf7` (feat)
2. **Task 2: RelatedScholarships section + detail route wiring** - `a09f91d` (feat)

## Files Created/Modified
- `web/src/components/detail/TagBadges.tsx` - Clickable tag badges with Radix Tooltip descriptions, expand/collapse for overflow
- `web/src/components/detail/CollectionBadges.tsx` - Collection membership badges with emoji prefix and link to collection page
- `web/src/components/detail/RelatedScholarships.tsx` - Similar Scholarships section with compact cards, compare checkboxes, horizontal scroll
- `web/src/components/detail/HeroSection.tsx` - Added tags and collections props, renders TagBadges and CollectionBadges
- `web/src/routes/scholarships/$slug.tsx` - Wired getScholarshipCollections query, passes tags/collections to HeroSection, added RelatedScholarships after Sources, added tags to search schema
- `web/convex/_generated/api.d.ts` - Added related and collections module imports for type safety
- `web/convex/related.ts` - Copied from dependency agent (08-01)
- `web/convex/collections.ts` - Copied from dependency agent (08-01)
- `web/src/lib/tags.ts` - Copied from dependency agent (08-01)

## Decisions Made
- Tag badges use transparent background with hover transition for subtle outline-only appearance, matching the design spec's outline-only requirement
- RelatedScholarships uses Card-wrapped section layout for consistency with SourcesSection visual pattern
- Collections query uses Convex "skip" sentinel pattern to avoid querying before scholarship data loads
- Updated api.d.ts to include related and collections modules from parallel agents

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Copied dependency files from parallel agents**
- **Found during:** Task 1
- **Issue:** Dependency files (tags.ts, related.ts, collections.ts, CompareCheckbox.tsx, CompareContext.tsx, schema.ts) created by wave 1/2 agents were not in this worktree
- **Fix:** Copied files from main repo where parallel agents had already committed them
- **Files modified:** web/src/lib/tags.ts, web/convex/related.ts, web/convex/collections.ts, web/src/components/comparison/CompareCheckbox.tsx, web/src/components/comparison/CompareContext.tsx, web/convex/schema.ts
- **Verification:** All imports resolve correctly
- **Committed in:** a09f91d (Task 2 commit)

**2. [Rule 3 - Blocking] Updated api.d.ts with related and collections modules**
- **Found during:** Task 2
- **Issue:** Generated api.d.ts did not include related or collections modules, TypeScript would not resolve api.related.* or api.collections.* references
- **Fix:** Added import statements and fullApi entries for both modules
- **Verification:** TypeScript references to api.related.getRelatedScholarships and api.collections.getScholarshipCollections properly typed
- **Committed in:** a09f91d (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes necessary for parallel agent worktree isolation. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Detail page now fully integrated with discovery features (tags, collections, related)
- Ready for Plan 08-08 (remaining discovery feature integration)
- CompareCheckbox integration on related cards enables seamless comparison workflow

## Self-Check: PASSED

All 3 created files exist. Both task commits (eab8cf7, a09f91d) verified in git log.

---
*Phase: 08-discovery-features*
*Completed: 2026-03-23*
