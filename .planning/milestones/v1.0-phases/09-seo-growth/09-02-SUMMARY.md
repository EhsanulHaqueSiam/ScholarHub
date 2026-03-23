---
phase: 09-seo-growth
plan: 02
subsystem: seo
tags: [json-ld, schema-org, opengraph, meta-tags, breadcrumbs, faq, landing-pages, seo]

# Dependency graph
requires:
  - phase: 09-seo-growth
    provides: "SEO library (json-ld.ts, meta.ts, landing-content.ts), Convex SEO queries"
  - phase: 07-scholarship-detail-page
    provides: "Scholarship detail page with inline JSON-LD"
  - phase: 06.1-country-eligibility-filtering
    provides: "Country and degree route pages, directory listing"
provides:
  - "Grant JSON-LD + BreadcrumbList on scholarship detail pages"
  - "FAQPage + BreadcrumbList JSON-LD on country and degree landing pages"
  - "ItemList JSON-LD on collection and compare pages"
  - "Canonical URLs, OG meta, Twitter Cards on all 7 public route files"
  - "Data-driven country pages with stats, intro, FAQ, cross-links"
  - "Full degree landing pages with scholarship listings, stats, FAQ, cross-links"
affects: [09-03-server-routes]

# Tech tracking
tech-stack:
  added: []
  patterns: ["JSON-LD via script tag children pattern", "Convex SEO queries for data-driven landing content", "details/summary HTML for FAQ accordions"]

key-files:
  created: []
  modified:
    - web/src/routes/scholarships/$slug.tsx
    - web/src/routes/collections/$slug.tsx
    - web/src/routes/scholarships/compare.tsx
    - web/src/routes/scholarships/closing-soon.tsx
    - web/src/routes/scholarships/index.tsx
    - web/src/routes/scholarships/country/$country.tsx
    - web/src/routes/scholarships/degree/$degree.tsx
    - web/convex/_generated/api.d.ts

key-decisions:
  - "Used script tag children instead of innerHTML for JSON-LD injection"
  - "Country cross-links use getCountryName for display with slugified codes for URLs"
  - "Degree page rebuilt from placeholder with full ScholarshipCard grid, not just text content"
  - "Kept degree URLs at /scholarships/degree/$degree (not /scholarships/phd) to avoid $slug route conflicts"

patterns-established:
  - "All public routes use buildPageMeta for consistent canonical, OG, Twitter Card meta"
  - "Landing pages follow stats-bar + intro + content + FAQ + cross-links pattern"
  - "FAQ sections use native details/summary HTML elements for accessibility"

requirements-completed: [SEOG-01, SEOG-02, SEOG-03]

# Metrics
duration: 8min
completed: 2026-03-22
---

# Phase 9 Plan 2: Route SEO Enhancements Summary

**All 7 public routes enhanced with Grant/BreadcrumbList/FAQPage/ItemList JSON-LD, canonical URLs, OG/Twitter meta, and data-driven country+degree landing pages with stats, FAQ, and cross-links**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-22T21:05:43Z
- **Completed:** 2026-03-22T21:14:09Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Scholarship detail page upgraded from inline "Scholarship" type to imported "Grant" JSON-LD with BreadcrumbList (Home > Scholarships > Country > Title)
- Country landing pages enriched with dynamic stats bar (total, fully funded, degree levels, closing soon), templated intro, FAQ accordion with FAQPage JSON-LD, and cross-links to related countries and degree levels
- Degree landing pages rebuilt from placeholder into full pages with scholarship grid (up to 12 cards), stats, intro, FAQ, cross-links, and all structured data
- Collection and compare pages now emit ItemList JSON-LD for scholarship entries
- All 7 route files have canonical URLs, Open Graph meta, and Twitter Cards via buildPageMeta

## Task Commits

Each task was committed atomically:

1. **Task 1: Enhance detail, collection, compare, closing-soon, index pages** - `cfc906b` (feat)
2. **Task 2: Build out country and degree landing pages** - `acd2aa0` (feat)

## Files Created/Modified
- `web/src/routes/scholarships/$slug.tsx` - Replaced inline Scholarship JSON-LD with imported Grant builder + BreadcrumbList, added buildPageMeta
- `web/src/routes/collections/$slug.tsx` - Added ItemList JSON-LD and buildPageMeta with canonical URLs
- `web/src/routes/scholarships/compare.tsx` - Added ItemList JSON-LD and buildPageMeta with canonical URLs
- `web/src/routes/scholarships/closing-soon.tsx` - Replaced manual OG meta with buildPageMeta
- `web/src/routes/scholarships/index.tsx` - Replaced manual OG meta with buildPageMeta, canonical strips query params
- `web/src/routes/scholarships/country/$country.tsx` - Added dynamic stats, intro, FAQ, cross-links, BreadcrumbList + FAQPage JSON-LD
- `web/src/routes/scholarships/degree/$degree.tsx` - Rebuilt from placeholder into full landing page with scholarship grid, stats, FAQ, cross-links, structured data
- `web/convex/_generated/api.d.ts` - Added seo, collections, comparison module types

## Decisions Made
- Used script tag children pattern instead of innerHTML for JSON-LD -- cleaner React pattern, avoids security lint warnings
- Country cross-links resolve country codes to display names via getCountryName, then slugify for URL generation
- Degree page rebuilt with full ScholarshipCard grid (up to 12 cards) plus "View all" link to filtered directory, matching the CountryScholarships component pattern
- Kept degree URLs at `/scholarships/degree/$degree` rather than `/scholarships/phd` per plan note -- adding static routes at `/scholarships/phd` would conflict with the `$slug` dynamic route

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Cherry-picked 09-01 SEO library commits into worktree**
- **Found during:** Task 1 (pre-execution setup)
- **Issue:** This worktree was missing the SEO library files created by 09-01 (running on a different branch)
- **Fix:** Cherry-picked 4 commits from worktree-agent-a75461e6, resolved merge conflict in __root.tsx (removed CompareProvider/CompareBar refs not yet available)
- **Files modified:** web/src/lib/seo/*, web/convex/seo.ts, web/src/routes/__root.tsx
- **Verification:** All 123 tests pass

**2. [Rule 3 - Blocking] Copied collections/$slug.tsx and compare.tsx from main repo**
- **Found during:** Task 1
- **Issue:** Collection and compare route files from Phase 8 don't exist in this worktree
- **Fix:** Copied the files from the main repo to this worktree so SEO enhancements could be applied
- **Files modified:** web/src/routes/collections/$slug.tsx, web/src/routes/scholarships/compare.tsx

**3. [Rule 3 - Blocking] Updated Convex generated API types**
- **Found during:** Task 1
- **Issue:** api.d.ts missing seo, collections, comparison module types needed for useQuery calls
- **Fix:** Added import and module declarations for seo, collections, comparison
- **Files modified:** web/convex/_generated/api.d.ts

---

**Total deviations:** 3 auto-fixed (all Rule 3 - blocking issues)
**Impact on plan:** All auto-fixes necessary to unblock execution in a parallel worktree. No scope creep.

## Issues Encountered
- Cherry-pick conflict in __root.tsx required manual resolution (CompareProvider/CompareBar from Phase 8 not available in this worktree, kept plain Outlet)
- Node modules not installed in worktree -- ran bun install before test verification

## Known Stubs
None - all pages are fully implemented with real Convex queries and SEO library functions.

## User Setup Required
None - no external service configuration required. SEO structured data and meta tags are self-contained.

## Next Phase Readiness
- All public routes now have complete SEO optimization (structured data, canonical URLs, OG meta)
- Plan 03 can build on this for server routes (sitemap.xml, robots.txt) and any remaining SEO infrastructure
- 123 tests pass with no regressions

---
*Phase: 09-seo-growth*
*Completed: 2026-03-22*
