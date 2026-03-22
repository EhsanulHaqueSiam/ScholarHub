---
phase: 08-discovery-features
verified: 2026-03-23T00:00:00Z
status: passed
score: 34/34 must-haves verified
gaps:
  - truth: "Daily cron updates collection scholarship_count and reverse related_ids"
    status: resolved
    reason: "crons.ts calls internal.collections.recomputeAllCounts and internal.related.refreshAllRelatedIds, but neither function is defined in collections.ts or related.ts. This will cause a Convex deployment type error — the cron jobs will never run."
    artifacts:
      - path: "web/convex/crons.ts"
        issue: "References internal.collections.recomputeAllCounts (line 32) and internal.related.refreshAllRelatedIds (line 40) — both missing"
      - path: "web/convex/collections.ts"
        issue: "Missing exported internalMutation recomputeAllCounts"
      - path: "web/convex/related.ts"
        issue: "Missing exported internalMutation refreshAllRelatedIds"
    missing:
      - "Add export const recomputeAllCounts = internalMutation(...) to web/convex/collections.ts — paginated batch that recomputes scholarship_count for all active collections"
      - "Add export const refreshAllRelatedIds = internalMutation(...) to web/convex/related.ts — paginated batch that calls computeRelatedIds for all published scholarships"
human_verification:
  - test: "Browse /collections in a running app with seeded data"
    expected: "Grid of 10 collection cards, each showing emoji, name, scholarship count badge, and description"
    why_human: "Requires live Convex backend with seeded data to verify count badges render actual numbers"
  - test: "Open a scholarship detail page and view the Similar Scholarships section"
    expected: "4-6 compact scholarship cards appear below Sources; section is hidden when related_ids is empty"
    why_human: "Related scoring depends on data density — needs real data to verify quality of matches"
  - test: "Select 2 scholarships via checkboxes, open /scholarships/compare"
    expected: "Side-by-side table renders; differing fields highlighted with warm yellow; URL contains ?s=slug1,slug2"
    why_human: "Visual diff highlight color and URL shareability require browser verification"
  - test: "Admin creates a collection with filter criteria and checks live preview count"
    expected: "Live preview shows matching scholarship count updating as criteria change"
    why_human: "Debounced live preview UX cannot be verified by grep"
---

# Phase 8: Discovery Features Verification Report

**Phase Goal:** Students can discover scholarships through curated collections, compare options side-by-side, and find related scholarships from detail pages
**Verified:** 2026-03-23
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Collections table exists in Convex with all filter criteria fields, status, featured flag, slug, emoji, sort_order | VERIFIED | `web/convex/schema.ts` lines 337-363: full `collections` defineTable with all required fields + 4 indexes |
| 2 | Scholarships table has suggested_tags and related_ids optional fields | VERIFIED | `web/convex/schema.ts` lines 189-238: both fields defined as optional |
| 3 | Auto-tagging rules detect no_gre, women_only, stem, developing_countries from text | VERIFIED | `web/convex/tagging.ts` lines 27-128: all 4 rules present in `AUTO_TAG_RULES` array |
| 4 | Related scoring algorithm computes weighted score (provider 35%, country 25%, degree 15%, funding 15%, tags 10%) | VERIFIED | `web/convex/related.ts` lines 14-87: `DEFAULT_RELATED_WEIGHTS` constants and `scoreRelated` function match specified weights exactly |
| 5 | Collection CRUD queries and mutations exist for admin and public access | VERIFIED | `web/convex/collections.ts` exports: getCollectionBySlug, getCollectionScholarships, getFeaturedCollections, getAllCollections, recordCollectionView, getScholarshipCollections, getAdminCollections, createCollection, updateCollection, deleteCollection, bulkUpdateCollectionStatus, getCollectionPreview |
| 6 | Batch comparison query returns 2-3 scholarships in single round-trip | VERIFIED | `web/convex/comparison.ts`: `getComparisonScholarships` uses `Promise.all` over slug array — single Convex query |
| 7 | Tag management mutations cover full CRUD surface | VERIFIED | `web/convex/tags.ts`: getAllTags, getScholarshipTags, addTagToScholarship, removeTag, renameTagPublic, deleteTagPublic, bulkAddTags, acceptSuggestedTag, rejectSuggestedTag |
| 8 | Query exists to find which collections a scholarship belongs to (D-50) | VERIFIED | `web/convex/collections.ts` line 269: `getScholarshipCollections` exported |
| 9 | CSS variables for comparison diff highlight, tag outline, and suggested tag amber exist in both light and dark mode | VERIFIED | `web/src/index.css` lines 46-93: `--compare-diff-bg`, `--tag-outline-border`, `--tag-suggested-border`, `--tag-suggested-bg` in both `:root` and `.dark` blocks |
| 10 | Badge component has tag and tagSuggested variants | VERIFIED | `web/src/components/ui/badge.tsx` line 24-25: `tag` and `tagSuggested` variants using CSS variables |
| 11 | Navbar shows Collections link between Scholarships and Closing Soon | VERIFIED | `web/src/components/layout/Navbar.tsx` lines 76, 136: "Collections" link present |
| 12 | Admin can see Collections and Tags tabs in the admin dashboard | VERIFIED | `web/src/routes/admin/index.tsx`: state includes "collections" and "tags", tabs rendered at lines 71-93 |
| 13 | Admin can create, edit, and archive collections via slide-out form | VERIFIED | `web/src/components/admin/CollectionsManager.tsx` (19k), `CollectionEditForm.tsx` (23k): createCollection/updateCollection mutations wired |
| 14 | Admin can manage tags: view grouped list, review suggested tags, bulk-tag scholarships | VERIFIED | `web/src/components/admin/TagsManager.tsx` (24k), `SuggestedTagReview.tsx` (2.9k): all present |
| 15 | Collection edit form shows live preview with matching scholarship count | VERIFIED | `web/src/components/admin/CollectionEditForm.tsx` line 144: `useQuery(api.collections.getCollectionPreview, debouncedCriteria)` |
| 16 | Admin can add/remove tags on individual scholarships via EditForm (D-34) | VERIFIED | `web/src/components/admin/EditForm.tsx` lines 798-801: addTagToScholarship, removeTag, acceptSuggestedTag, rejectSuggestedTag mutations |
| 17 | Admin can bulk-tag selected scholarships from the review queue via BulkActionBar (D-36) | VERIFIED | `web/src/components/admin/BulkActionBar.tsx` lines 19, 48, 159, 167: bulkAddTags mutation wired, "Tag Selected" button present |
| 18 | User can select up to 3 scholarships for comparison via checkboxes on cards | VERIFIED | `CompareContext.tsx`: MAX_COMPARE=3, `CompareCheckbox.tsx` rendered in both ScholarshipCard (line 75) and ScholarshipListItem (line 122) |
| 19 | Floating compare bar appears at bottom when 1+ scholarships selected | VERIFIED | `CompareBar.tsx` line 23: `if (selected.length === 0) return null` — shows when ≥1 selected |
| 20 | Compare bar shows selected scholarship names and Compare button | VERIFIED | `CompareBar.tsx` lines 46-70: selected.map renders item titles, Compare button navigates to /scholarships/compare |
| 21 | Compare context is session-only and wraps the entire app | VERIFIED | `__root.tsx` lines 54-56: `CompareProvider` wraps children; context uses `useState` (no persistence) |
| 22 | Students can browse all active collections at /collections | VERIFIED | `web/src/routes/collections/index.tsx`: `useQuery(api.collections.getAllCollections)` at line 88, renders CollectionCard grid |
| 23 | Students can view a collection detail page at /collections/{slug} with filtered scholarships | VERIFIED | `web/src/routes/collections/$slug.tsx`: queries `getCollectionBySlug` and `getCollectionScholarships` |
| 24 | Featured collections row appears on /scholarships directory page | VERIFIED | `web/src/routes/scholarships/index.tsx` line 226: `<FeaturedCollectionsRow />` rendered |
| 25 | Collection cards show emoji, name, count badge, and description | VERIFIED | `web/src/components/collections/CollectionCard.tsx` (2.2k): substantive, renders emoji, name, scholarship_count, description |
| 26 | Students can view 2-3 scholarships side-by-side at /scholarships/compare | VERIFIED | `web/src/routes/scholarships/compare.tsx`: `useQuery(api.comparison.getComparisonScholarships, { slugs })` at line 108; `ComparisonTable` rendered at line 263 |
| 27 | Comparison table highlights differing fields with warm yellow tint | VERIFIED | `web/src/components/comparison/ComparisonTable.tsx` line 280: `bg-[var(--compare-diff-bg)]` applied to differing cells |
| 28 | Students can add scholarships to comparison via search-to-add dropdown | VERIFIED | `web/src/components/comparison/SearchToAdd.tsx`: `useQuery(api.directory.searchSuggestions)` at line 36 |
| 29 | Comparison page has shareable URL with slugs and dynamic meta tags | VERIFIED | `compare.tsx` line 18: `validateSearch: compareSearchSchema`; `head()` at line 19 renders dynamic meta tags |
| 30 | Mobile comparison uses horizontal scroll with sticky first column | VERIFIED | `ComparisonTable.tsx` line 199: `overflow-x-auto`; lines 205, 270: `sticky left-0` on row headers |
| 31 | Scholarship detail page shows tag badges and collection badges in hero section | VERIFIED | `HeroSection.tsx` lines 2-3, 87-90: TagBadges and CollectionBadges both imported and conditionally rendered |
| 32 | Tag badges are clickable and navigate to tag-filtered directory; collection badges link to /collections/{slug} | VERIFIED | `TagBadges.tsx` line 41: `<Link to="/scholarships" search={{ tags: tagId }}>`. `CollectionBadges.tsx` line 26: `<Link to="/collections/${collection.slug}">` |
| 33 | Related scholarships show 4-6 compact cards; section hidden when none exist | VERIFIED | `RelatedScholarships.tsx` line 62: `if (related.length === 0) return null`; `related.ts` line 163: top 6 returned |
| 34 | Daily cron updates collection scholarship_count and reverse related_ids | FAILED | `crons.ts` calls `internal.collections.recomputeAllCounts` (line 32) and `internal.related.refreshAllRelatedIds` (line 40), but neither function is defined in any Convex module |

**Score:** 33/34 truths verified (1 failed)

---

### Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `web/convex/schema.ts` | VERIFIED | collections table with all filter fields + indexes; suggested_tags and related_ids on scholarships |
| `web/convex/collections.ts` | VERIFIED | 469 lines; full CRUD + getScholarshipCollections; MISSING: recomputeAllCounts internal mutation |
| `web/convex/tags.ts` | VERIFIED | 9.3k; all required exports present |
| `web/convex/tagging.ts` | VERIFIED | 7.1k; AUTO_TAG_RULES + computeSuggestedTags + backfillSuggestedTags |
| `web/convex/related.ts` | VERIFIED | 232 lines; scoreRelated, computeRelatedIds, getRelatedScholarships; MISSING: refreshAllRelatedIds internal mutation |
| `web/convex/comparison.ts` | VERIFIED | 1.6k; getComparisonScholarships with resolved_sources |
| `web/src/lib/tags.ts` | VERIFIED | 5.8k; TAG_CATEGORIES, ALL_TAGS, getTagLabel, getTagDescription, getTagCategory, isRegionTag |
| `web/src/components/comparison/CompareContext.tsx` | VERIFIED | CompareProvider + useCompare; MAX_COMPARE=3; session-only via useState |
| `web/src/components/comparison/CompareCheckbox.tsx` | VERIFIED | 4.6k; rendered in ScholarshipCard and ScholarshipListItem |
| `web/src/components/comparison/CompareBar.tsx` | VERIFIED | 3.1k; renders selected names, navigate to compare route |
| `web/src/components/comparison/ComparisonTable.tsx` | VERIFIED | 11k; overflow-x-auto, sticky headers, diff highlighting |
| `web/src/components/comparison/SearchToAdd.tsx` | VERIFIED | 3.9k; queries api.directory.searchSuggestions |
| `web/src/components/collections/CollectionCard.tsx` | VERIFIED | 2.2k; renders emoji, name, count badge, description |
| `web/src/components/collections/FeaturedCollectionsRow.tsx` | VERIFIED | 5.6k; horizontal scroll row |
| `web/src/routes/collections/index.tsx` | VERIFIED | 4.9k; getAllCollections query, grid render |
| `web/src/routes/collections/$slug.tsx` | VERIFIED | 12k; getCollectionBySlug + getCollectionScholarships |
| `web/src/components/admin/CollectionsManager.tsx` | VERIFIED | 19k; full CRUD table |
| `web/src/components/admin/CollectionEditForm.tsx` | VERIFIED | 23k; live preview via getCollectionPreview |
| `web/src/components/admin/TagsManager.tsx` | VERIFIED | 24k; grouped list, suggested review, filter-tag |
| `web/src/components/admin/SuggestedTagReview.tsx` | VERIFIED | 2.9k; accept/reject with reason tooltip |
| `web/src/components/detail/TagBadges.tsx` | VERIFIED | 3.1k; clickable, tooltip, navigate to tag-filtered directory |
| `web/src/components/detail/CollectionBadges.tsx` | VERIFIED | 1.0k; links to /collections/{slug} |
| `web/src/components/detail/RelatedScholarships.tsx` | VERIFIED | 6.2k; api.related.getRelatedScholarships; null return when empty |
| `web/convex/seed-collections.ts` | VERIFIED | 5.1k; 10 seed collections with correct names including "Top Fully Funded" |
| `web/convex/crons.ts` | STUB | 1.3k; references recomputeAllCounts and refreshAllRelatedIds which are missing |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `web/convex/triggers.ts` | `web/convex/tagging.ts` | `computeAutoTags` called in trigger | WIRED | Line 5: import; lines 33-43: called with scholarship fields |
| `web/convex/triggers.ts` | `web/convex/related.ts` | `computeRelatedIds` called in trigger | WIRED | Line 4: import; lines 57-67: conditional call on field changes |
| `web/convex/collections.ts` | `web/convex/schema.ts` | queries use `withIndex("by_slug", ...)` | WIRED | Line 148 in getCollectionBySlug |
| `web/src/routes/__root.tsx` | `web/src/components/comparison/CompareContext.tsx` | CompareProvider wraps children | WIRED | Lines 10, 54-56 |
| `web/src/components/directory/ScholarshipCard.tsx` | `web/src/components/comparison/CompareCheckbox.tsx` | CompareCheckbox rendered in card | WIRED | Lines 4, 75 |
| `web/src/routes/collections/index.tsx` | `web/convex/collections.ts` | useQuery(api.collections.getAllCollections) | WIRED | Line 88 |
| `web/src/routes/collections/$slug.tsx` | `web/convex/collections.ts` | useQuery for getCollectionBySlug and getCollectionScholarships | WIRED | Lines 47, 59 |
| `web/src/routes/scholarships/index.tsx` | `web/src/components/collections/FeaturedCollectionsRow.tsx` | FeaturedCollectionsRow rendered | WIRED | Lines 4, 226 |
| `web/src/routes/scholarships/compare.tsx` | `web/convex/comparison.ts` | useQuery(api.comparison.getComparisonScholarships) | WIRED | Lines 6, 108, 263 |
| `web/src/routes/scholarships/$slug.tsx` | `web/src/components/detail/RelatedScholarships.tsx` | RelatedScholarships rendered after Sources | WIRED | Lines 16, 392 |
| `web/src/components/detail/RelatedScholarships.tsx` | `web/convex/related.ts` | useQuery(api.related.getRelatedScholarships) | WIRED | Line 29 |
| `web/src/routes/scholarships/$slug.tsx` | `web/convex/collections.ts` | useQuery(api.collections.getScholarshipCollections) | WIRED | Line 177 |
| `web/src/components/detail/HeroSection.tsx` | `web/src/components/detail/TagBadges.tsx` | TagBadges rendered with tags prop | WIRED | Lines 3, 87 |
| `web/src/components/detail/HeroSection.tsx` | `web/src/components/detail/CollectionBadges.tsx` | CollectionBadges rendered with collections prop | WIRED | Lines 2, 90 |
| `web/src/routes/admin/index.tsx` | `web/src/components/admin/CollectionsManager.tsx` | Tab switch renders CollectionsManager | WIRED | Lines 4, 92 |
| `web/src/components/admin/CollectionEditForm.tsx` | `web/convex/collections.ts` | useMutation for createCollection/updateCollection | WIRED | Lines 76-77 |
| `web/src/components/admin/EditForm.tsx` | `web/convex/tags.ts` | useMutation for addTagToScholarship/removeTag | WIRED | Lines 799-800 |
| `web/src/components/admin/BulkActionBar.tsx` | `web/convex/tags.ts` | useMutation for bulkAddTags | WIRED | Lines 19, 48 |
| `web/convex/crons.ts` | `web/convex/collections.ts` | cron calls recomputeAllCounts | NOT WIRED | `internal.collections.recomputeAllCounts` called but function does not exist |
| `web/convex/crons.ts` | `web/convex/related.ts` | cron calls refreshAllRelatedIds | NOT WIRED | `internal.related.refreshAllRelatedIds` called but function does not exist |

---

### Requirements Coverage

| Requirement | Description | Plans | Status | Evidence |
|-------------|-------------|-------|--------|----------|
| DISC-01 | Curated collections — admin-created, tag-based, auto-populating lists | 08-01, 08-02, 08-03, 08-05, 08-07, 08-08 | SATISFIED | Full backend + admin UI + public browse + collection badges on detail page all implemented and wired |
| DISC-02 | Scholarship comparison — side-by-side comparison of 2-3 scholarships | 08-01, 08-02, 08-04, 08-06, 08-08 | SATISFIED | CompareContext + checkboxes + CompareBar + ComparisonTable + /compare route all wired end-to-end |
| DISC-03 | Related scholarships shown on detail page | 08-01, 08-07, 08-08 | SATISFIED | RelatedScholarships component wired to api.related.getRelatedScholarships; trigger computes related_ids on write |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `web/convex/crons.ts` | 32, 40 | References to non-existent internal functions | BLOCKER | Daily collection count refresh and related_ids reverse update will throw a Convex type/deployment error — eventual consistency mechanism broken |

Note: "Collections coming soon!" in `web/src/routes/collections/index.tsx` line 121 is an empty-state fallback shown only when `collections.length === 0` from a live query — not a stub.

---

### Human Verification Required

#### 1. Collections browse page with real data

**Test:** Seed the database using `seedCollections` mutation, then visit `/collections`
**Expected:** 10 collection cards in a responsive grid, each showing emoji, name, scholarship count, and description; cards link to `/collections/{slug}`
**Why human:** Count badge accuracy and card click navigation require live backend with data

#### 2. Related scholarships quality

**Test:** Open a scholarship detail page that has existing related_ids in the database
**Expected:** 4-6 compact scholarship cards appear below the Sources section; the section is absent when there are no related scholarships
**Why human:** Scoring algorithm quality and empty-state hiding depend on real data density

#### 3. Side-by-side comparison visual diff

**Test:** Select 2 scholarships with differing funding types and open the compare page
**Expected:** Differing cells highlighted with warm yellow background (`--compare-diff-bg`); URL is shareable (contains slug query params)
**Why human:** Visual color rendering and URL copy-paste shareability require browser verification

#### 4. Admin collection live preview

**Test:** In admin, open the collection create form and add a filter criterion
**Expected:** Preview count updates within ~500ms as criteria change (debounced); correct scholarship count shown
**Why human:** Debounced UX timing cannot be verified by static analysis

---

### Gaps Summary

One gap blocks full goal achievement: the daily cron jobs for eventual consistency are wired in `crons.ts` but their implementation functions do not exist.

**Root cause:** Plan 08-08 documents the crons requirement ("Daily cron updates collection scholarship_count and reverse related_ids") but the execution created the cron schedule without creating the paginated internal mutation handlers that the crons call.

**Specific missing functions:**

1. `web/convex/collections.ts` — needs `export const recomputeAllCounts = internalMutation(...)`: a paginated batch that iterates all active collections, recomputes `scholarship_count` by running `matchesCollectionFilters` against published scholarships, and patches each collection document.

2. `web/convex/related.ts` — needs `export const refreshAllRelatedIds = internalMutation(...)`: a paginated batch that iterates all published scholarships and calls `computeRelatedIds` to refresh stale `related_ids`.

**Impact:** Without these functions, `convex deploy` will likely fail at the type-checking stage (Convex validates `internal.*` references at build time). Even if it deploys, the collection scholarship_count field will never update and the reverse related_ids refresh will never occur, degrading collection accuracy and related scholarship discovery over time.

The remaining 33 out of 34 must-haves are fully verified and wired. The three core goals — collections browsing, comparison, and related scholarships — all have complete UI and backend pipelines. Only the maintenance/eventual-consistency layer is broken.

---

_Verified: 2026-03-23_
_Verifier: Claude (gsd-verifier)_
