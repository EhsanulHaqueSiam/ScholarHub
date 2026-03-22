---
phase: 08-discovery-features
plan: 05
subsystem: ui
tags: [react, tanstack-router, convex, collections, neo-brutalism, horizontal-scroll]

# Dependency graph
requires:
  - phase: 08-01
    provides: Collection schema, Convex queries/mutations (getAllCollections, getFeaturedCollections, getCollectionBySlug, getCollectionScholarships, recordCollectionView)
  - phase: 08-02
    provides: Collection seed data and schema validators
  - phase: 06.1
    provides: Directory UI components (ScholarshipCard, FeaturedRow scroll pattern, SortPills, ViewToggle, Pagination, EmptyState, SkeletonCard, BackToTop, Navbar)
provides:
  - CollectionCard component for grid browsing
  - FeaturedCollectionsRow horizontal scroll component
  - CollectionHeader with emoji, markdown description, copy link
  - /collections browse page with grid of all active collections
  - /collections/$slug detail page with filtered scholarships, sort, view toggle, pagination
  - FeaturedCollectionsRow integration on /scholarships directory
  - Collections link in Navbar (desktop + mobile)
affects: [08-06, 08-07, 09-seo]

# Tech tracking
tech-stack:
  added: []
  patterns: [collection-card-grid, featured-collections-row, collection-detail-reuse-directory-components, localStorage-view-counter-debounce]

key-files:
  created:
    - web/src/components/collections/CollectionCard.tsx
    - web/src/components/collections/FeaturedCollectionsRow.tsx
    - web/src/components/collections/CollectionHeader.tsx
    - web/src/routes/collections/index.tsx
    - web/src/routes/collections/$slug.tsx
  modified:
    - web/src/routes/scholarships/index.tsx
    - web/src/components/layout/Navbar.tsx
    - web/convex/_generated/api.d.ts

key-decisions:
  - "Sort pills and ViewToggle inlined in $slug.tsx rather than importing SortPills/ViewToggle from directory (which depend on useScholarshipFilters hook tied to URL state) -- collection page manages its own local state"
  - "CollectionCard wraps Link around the entire Card for full clickable area with focus-visible ring on the Link element"
  - "FeaturedCollectionsRow compact cards use inline Link elements (not CollectionCard) for compact 200px width layout"
  - "Navbar Collections link added between Scholarships and Closing Soon in both desktop and mobile menus"

patterns-established:
  - "Collection card: Link wrapper + Card unranked + emoji circle (bg-main/10) + name + badge + description"
  - "Collection detail page reuses directory ScholarshipCard/ScholarshipListItem/Pagination with local sort/view/page state"
  - "View counter debounce via localStorage key with 30-minute TTL"

requirements-completed: [DISC-01]

# Metrics
duration: 5min
completed: 2026-03-23
---

# Phase 08 Plan 05: Collection Browsing UI Summary

**Public collection browsing with /collections browse page, /collections/$slug detail page, FeaturedCollectionsRow on directory, and Navbar link**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-22T19:25:19Z
- **Completed:** 2026-03-22T19:30:47Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- CollectionCard with emoji circle, name, count badge, description, and neo-brutalism hover/focus styling
- FeaturedCollectionsRow horizontal scroll row with up to 6 featured collections, scroll arrows, and "View all collections" link
- CollectionHeader with 64px emoji, markdown description rendering, copy link button, and sort label
- /collections browse page with 3-column grid, loading skeletons, empty state with neo-brutalism illustration
- /collections/$slug detail page reusing directory ScholarshipCard/ListItem with sort pills, view toggle, pagination, and localStorage-debounced view counter
- FeaturedCollectionsRow integrated on /scholarships directory page below FeaturedRow
- "Collections" link added to Navbar in both desktop nav and mobile dropdown menu

## Task Commits

Each task was committed atomically:

1. **Task 1: CollectionCard + FeaturedCollectionsRow components** - `870c243` (feat)
2. **Task 2: /collections routes + CollectionHeader + directory page integration** - `99e58f9` (feat)

## Files Created/Modified
- `web/src/components/collections/CollectionCard.tsx` - Grid card with emoji, name, badge, description, Link to /collections/$slug
- `web/src/components/collections/FeaturedCollectionsRow.tsx` - Horizontal scroll of featured collections with arrow buttons
- `web/src/components/collections/CollectionHeader.tsx` - Detail page header with emoji, markdown description, copy link, sort label
- `web/src/routes/collections/index.tsx` - /collections browse page with grid, loading skeletons, empty state
- `web/src/routes/collections/$slug.tsx` - /collections/$slug detail with sort, view toggle, pagination, view counter
- `web/src/routes/scholarships/index.tsx` - Added FeaturedCollectionsRow below FeaturedRow
- `web/src/components/layout/Navbar.tsx` - Added "Collections" link (desktop + mobile)
- `web/convex/collections.ts` - Copied from main repo (created in plan 08-01)
- `web/convex/_generated/api.d.ts` - Added collections module import for typed API access

## Decisions Made
- Inlined sort pills and view toggle in $slug.tsx rather than importing SortPills/ViewToggle from directory -- directory components depend on useScholarshipFilters hook which is tied to URL search params, while collection detail manages local React state
- CollectionCard wraps Link around the entire Card for full clickable area with focus-visible ring on the Link
- FeaturedCollectionsRow uses compact inline Link cards (not CollectionCard) for the 200px width horizontal scroll layout
- Added "Collections" link between "Scholarships" and "Closing Soon" in Navbar per D-42

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Copied collections.ts and updated generated API**
- **Found during:** Task 1 (CollectionCard + FeaturedCollectionsRow)
- **Issue:** web/convex/collections.ts did not exist in worktree (created by parallel plan 08-01), and api.d.ts lacked collections module
- **Fix:** Copied collections.ts from main repo, added collections import to api.d.ts
- **Files modified:** web/convex/collections.ts, web/convex/_generated/api.d.ts
- **Verification:** TypeScript imports resolve, api.collections.* calls work
- **Committed in:** 870c243 (Task 1 commit)

**2. [Rule 3 - Blocking] Installed node_modules in worktree**
- **Found during:** Task 2 (creating CollectionHeader with react-markdown)
- **Issue:** Worktree's node_modules lacked react-markdown and other dependencies
- **Fix:** Ran bun install in worktree web/ directory
- **Files modified:** none committed (node_modules is gitignored)
- **Verification:** react-markdown import resolves

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes were necessary to unblock execution in the parallel worktree. No scope creep.

## Issues Encountered
None beyond the blocking worktree setup issues documented above.

## Known Stubs
None - all components are wired to real Convex queries.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Collection browsing UI is complete for DISC-01 public browsing
- Admin collection management (08-03) and comparison features (08-06/07) can proceed independently
- SEO for /collections routes deferred to Phase 9 per D-113

## Self-Check: PASSED

All 6 created files verified on disk. Both task commits (870c243, 99e58f9) verified in git log.

---
*Phase: 08-discovery-features*
*Completed: 2026-03-23*
