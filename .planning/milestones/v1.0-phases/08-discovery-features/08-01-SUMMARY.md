---
phase: 08-discovery-features
plan: 01
subsystem: database, api
tags: [convex, tags, collections, auto-tagging, related-scholarships, comparison, triggers]

requires:
  - phase: 07-scholarship-detail-page
    provides: "Detail page with slug-based routing, prestige scoring, search index"
  - phase: 06.1-country-eligibility-filtering-university-tier-list-prestige-highlighting
    provides: "Directory queries, prestige triggers, filter patterns, region mapping"
provides:
  - "Collections table schema with filter criteria, slug, featured flag, sort_order, indexes"
  - "Scholarships schema additions: suggested_tags, related_ids fields"
  - "Related weights table for admin-configurable scoring"
  - "23 predefined tags across 5 categories with constants and helpers"
  - "Auto-tagging rules for 8 tag types plus region detection"
  - "Related scoring algorithm with 5-factor weighted scoring"
  - "Full tag CRUD mutations (add, remove, rename, delete, bulk-add, accept/reject suggested)"
  - "Collection CRUD queries/mutations (public browsing + admin management)"
  - "getScholarshipCollections query for D-50 badge display on detail page"
  - "Comparison batch query returning 2-3 scholarships in single round-trip"
  - "Trigger extensions for auto-computing suggested_tags and related_ids on writes"
affects: [08-02, 08-03, 08-04, 08-05, 08-06, 08-07, 08-08]

tech-stack:
  added: []
  patterns:
    - "Filter-based collection membership via matchesCollectionFilters pure function"
    - "Internal mutation + scheduler pattern for batch tag rename/delete operations"
    - "computeAutoTags filters out already-suggested tags for trigger safety"
    - "Proportional overlap scoring for degree and tag dimensions in related algorithm"

key-files:
  created:
    - web/convex/tagging.ts
    - web/convex/related.ts
    - web/convex/tags.ts
    - web/convex/collections.ts
    - web/convex/comparison.ts
    - web/src/lib/tags.ts
    - web/src/__tests__/tagging.test.ts
    - web/src/__tests__/related.test.ts
    - web/src/__tests__/collections.test.ts
    - web/src/__tests__/comparison.test.ts
  modified:
    - web/convex/schema.ts
    - web/convex/triggers.ts
    - web/convex/_generated/api.d.ts

key-decisions:
  - "Collections use filter-based membership (AND between types, OR within) rather than explicit scholarship lists"
  - "Auto-tagging produces suggestions only (not auto-confirmed) per D-28 for admin control"
  - "Region tags auto-detected from host_country using existing REGION_MAP"
  - "Related scoring bounded to .take(50) published scholarships per trigger invocation"
  - "Batch tag rename/delete uses scheduler pattern for unbounded sets"
  - "collectionStatusValidator uses draft/active/archived (separate from scholarshipStatusValidator)"

patterns-established:
  - "matchesCollectionFilters: Pure function for testing collection membership without Convex"
  - "computeAutoTags: Filters already-suggested tags to prevent re-suggestions in triggers"
  - "Trigger-wrapped mutations extended with auto-tagging and related_ids alongside prestige scoring"
  - "Internal mutation + public wrapper pattern for batch operations (renameTag, deleteTag)"

requirements-completed: [DISC-01, DISC-02, DISC-03]

duration: 9min
completed: 2026-03-23
---

# Phase 8 Plan 1: Discovery Features Backend Summary

**Collections schema + tag system with auto-tagging rules + related scoring algorithm + comparison batch query + full tag/collection CRUD mutations + trigger wiring for auto-computation**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-22T19:09:18Z
- **Completed:** 2026-03-22T19:18:34Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- Complete Convex backend for all Phase 8 discovery features: collections, tags, auto-tagging, related scholarships, comparison
- 23 predefined tags across 5 categories (eligibility, subject, duration, funding, region) with auto-tagging for 8 tag types
- 5-factor weighted related scholarships scoring algorithm (provider 35%, country 25%, degree 15%, funding 15%, tags 10%)
- Full tag management mutation surface (9 operations) and collection CRUD (12 queries/mutations)
- Triggers extended to auto-compute suggested_tags and related_ids on every scholarship write
- 151 tests passing across 12 test files (58 new tests for this plan)

## Task Commits

Each task was committed atomically:

1. **Task 1: Schema additions + tag constants + auto-tagging + related scoring** - `653a2fe` (feat)
2. **Task 2: Tag mutations + collection CRUD + comparison query + trigger wiring** - `4d9118e` (feat)

## Files Created/Modified
- `web/convex/schema.ts` - Added collections table, related_weights table, collectionStatusValidator, suggested_tags and related_ids fields on scholarships
- `web/convex/tagging.ts` - Auto-tagging rules (8 keyword patterns + region detection), computeSuggestedTags, computeAutoTags, backfillSuggestedTags
- `web/convex/related.ts` - Related scoring algorithm (scoreRelated, computeRelatedIds, intersectionSize), getRelatedScholarships query, weight management
- `web/convex/tags.ts` - Full tag CRUD: getAllTags, getScholarshipTags, addTagToScholarship, removeTag, renameTag, deleteTag, bulkAddTags, acceptSuggestedTag, rejectSuggestedTag
- `web/convex/collections.ts` - Collection CRUD: public queries (getCollectionBySlug, getCollectionScholarships, getFeaturedCollections, getAllCollections, getScholarshipCollections), admin mutations (createCollection, updateCollection, deleteCollection, bulkUpdateCollectionStatus, getCollectionPreview), recordCollectionView
- `web/convex/comparison.ts` - getComparisonScholarships batch query (1-3 slugs, single round-trip)
- `web/convex/triggers.ts` - Extended with computeAutoTags and computeRelatedIds invocations on scholarship writes
- `web/convex/_generated/api.d.ts` - Added collections, comparison, related, tagging, tags modules
- `web/src/lib/tags.ts` - TAG_CATEGORIES (5 categories, 23 tags), ALL_TAGS, getTagLabel, getTagDescription, getTagCategory, isRegionTag
- `web/src/__tests__/tagging.test.ts` - 22 tests for auto-tagging rules and computeSuggestedTags/computeAutoTags
- `web/src/__tests__/related.test.ts` - 10 tests for scoreRelated, intersectionSize, DEFAULT_RELATED_WEIGHTS
- `web/src/__tests__/collections.test.ts` - 19 tests for collection filter matching, slug generation, getScholarshipCollections
- `web/src/__tests__/comparison.test.ts` - 7 tests for comparison query validation and behavior

## Decisions Made
- Collections use filter-based membership (matchesCollectionFilters pure function) instead of explicit scholarship lists -- enables auto-populating collections that stay current
- Auto-tagging produces suggestions only (not auto-confirmed) per D-28, admin retains full control
- Region tags auto-detected from host_country using existing REGION_MAP from regions.ts
- Related scoring bounded to `.take(50)` to avoid unbounded reads in triggers (Pitfall 1 from RESEARCH.md)
- Batch tag rename/delete uses internal mutation + scheduler pattern for processing beyond 50 records
- collectionStatusValidator (draft/active/archived) separate from scholarshipStatusValidator to keep concerns isolated

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- bun.lock needed install before tests could run (worktree had no node_modules)
- Phase 08 plan files weren't in the worktree (behind master), checked them out with `git checkout master --`

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Complete backend foundation for all Phase 8 UI plans (02 through 08)
- All queries/mutations ready for: admin UI (collections tab, tags tab), public UI (collection browsing, comparison page, tag display, related section)
- CSS design tokens for tag badges and collection cards needed in Plan 02
- Seed collections data needed in later plan

## Self-Check: PASSED

All 14 created/modified files verified present. Both task commits (653a2fe, 4d9118e) verified in git history.

---
*Phase: 08-discovery-features*
*Completed: 2026-03-23*
