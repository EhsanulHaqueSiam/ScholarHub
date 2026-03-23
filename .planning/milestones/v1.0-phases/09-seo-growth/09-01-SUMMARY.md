---
phase: 09-seo-growth
plan: 01
subsystem: seo
tags: [json-ld, schema-org, opengraph, meta-tags, sitemap, seo, convex, ga4]

# Dependency graph
requires:
  - phase: 06.1-country-eligibility-filtering
    provides: "scholarship schema, directory queries, country/degree routes"
  - phase: 07-scholarship-detail-page
    provides: "slug-based scholarship detail, existing JSON-LD pattern"
provides:
  - "JSON-LD builder functions (Grant, BreadcrumbList, FAQPage, ItemList, Organization)"
  - "Meta tag helpers (canonical, OG, Twitter Card, hreflang)"
  - "Landing page content generators (country/degree intro, FAQ, cross-links)"
  - "Sitemap XML generation utility"
  - "Convex SEO queries (slugs, country/degree stats, top countries, all degrees)"
  - "Root layout global SEO (Organization JSON-LD, OG defaults, GA4, GSC)"
affects: [09-02-route-enhancements, 09-03-server-routes]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Schema.org Grant type for scholarships", "env-gated GA4 injection", "module-level SITE_URL constant"]

key-files:
  created:
    - web/src/lib/seo/json-ld.ts
    - web/src/lib/seo/meta.ts
    - web/src/lib/seo/landing-content.ts
    - web/src/lib/seo/sitemap.ts
    - web/convex/seo.ts
    - web/src/__tests__/seo-jsonld.test.ts
    - web/src/__tests__/seo-meta.test.ts
  modified:
    - web/src/routes/__root.tsx

key-decisions:
  - "Used @type Grant (not Scholarship) per Schema.org spec -- Scholarship type does not exist"
  - "GA4 script injection gated by VITE_GA4_ID env var to avoid loading in dev"
  - "GSC verification meta conditionally included only when VITE_GSC_VERIFICATION is set"
  - "Organization JSON-LD computed once at module level, not per-render"

patterns-established:
  - "SITE_URL constant: window.location.origin in browser, import.meta.env.VITE_SITE_URL on server, fallback to scholarhub.io"
  - "SEO library modular structure: json-ld.ts, meta.ts, landing-content.ts, sitemap.ts under web/src/lib/seo/"
  - "Convex SEO queries: public queries for aggregate stats, used by landing pages and sitemap"

requirements-completed: [SEOG-01, SEOG-02, SEOG-03]

# Metrics
duration: 5min
completed: 2026-03-22
---

# Phase 9 Plan 1: SEO Foundation Summary

**SEO library with Schema.org Grant JSON-LD, OG/Twitter meta builders, data-driven landing content generators, sitemap XML utility, 5 Convex SEO queries, and root-level GA4/GSC integration**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-22T20:56:14Z
- **Completed:** 2026-03-22T21:01:24Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- 5 JSON-LD builder functions covering Grant, BreadcrumbList, FAQPage, ItemList, Organization structured data types
- Meta tag helpers producing canonical, OG, Twitter Card, and hreflang meta for any page
- 7 landing content generators producing unique stats-driven intro paragraphs, FAQ, cross-links, and meta descriptions for country/degree pages
- Sitemap XML generator with proper XML escaping
- 5 Convex SEO queries for slugs, country stats, degree stats, top countries, and all degrees
- Root layout enhanced with Organization JSON-LD, default OG/Twitter meta, hreflang, robots meta, GA4 injection, and GSC verification

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): SEO tests** - `3db4b4d` (test)
2. **Task 1 (GREEN): SEO library implementation** - `0d139ea` (feat)
3. **Task 2: Convex SEO queries and root layout enhancements** - `3fee990` (feat)

_TDD task 1 has separate test and implementation commits._

## Files Created/Modified
- `web/src/lib/seo/json-ld.ts` - JSON-LD builders for Grant, BreadcrumbList, FAQPage, ItemList, Organization
- `web/src/lib/seo/meta.ts` - Canonical URL, OG/Twitter Card meta, combined page meta with hreflang
- `web/src/lib/seo/landing-content.ts` - Country/degree intro, FAQ, cross-links, meta description generators
- `web/src/lib/seo/sitemap.ts` - Sitemap XML generator with XML escaping
- `web/convex/seo.ts` - 5 public Convex queries for SEO data
- `web/src/routes/__root.tsx` - Organization JSON-LD, OG defaults, hreflang, GA4, GSC, robots meta
- `web/src/__tests__/seo-jsonld.test.ts` - 25 tests for JSON-LD builders
- `web/src/__tests__/seo-meta.test.ts` - 5 tests for meta helpers

## Decisions Made
- Used `@type: "Grant"` instead of `"Scholarship"` per Schema.org specification (Scholarship type does not exist)
- GA4 script injection is gated by `VITE_GA4_ID` environment variable to prevent loading analytics in development
- GSC verification meta tag is conditionally included only when `VITE_GSC_VERIFICATION` env var is set
- Organization JSON-LD is computed once at module level (static content, no need to recompute per render)
- SITE_URL fallback chain: window.location.origin -> VITE_SITE_URL env var -> "https://scholarhub.io"

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## Known Stubs
None - all functions are fully implemented with real logic, not placeholders.

## User Setup Required
None - no external service configuration required. GA4 and GSC are env-var gated and will activate when environment variables are set in production.

## Next Phase Readiness
- SEO library ready for consumption by Plan 02 (route enhancements for country/degree pages)
- Sitemap utility ready for Plan 03 (server routes for sitemap.xml, robots.txt)
- Convex SEO queries ready for landing page data hydration
- All 195 existing tests pass with new additions

---
*Phase: 09-seo-growth*
*Completed: 2026-03-22*
