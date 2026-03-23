---
phase: 09-seo-growth
plan: 03
subsystem: seo
tags: [sitemap, robots-txt, og-images, satori, resvg, server-routes, tanstack-start, netlify]

# Dependency graph
requires:
  - phase: 09-seo-growth
    provides: "SEO library (sitemap.ts, json-ld.ts, meta.ts), Convex SEO queries (seo.ts)"
  - phase: 07-scholarship-detail-page
    provides: "getScholarshipDetail and getBySlug Convex queries"
provides:
  - "Dynamic sitemap.xml server route querying Convex for all published URLs"
  - "Robots.txt server route with admin disallow and sitemap reference"
  - "Dynamic OG image generation for scholarship, country, degree, collection, and default page types"
  - "Netlify redirects for root-level /robots.txt and /sitemap.xml"
affects: []

# Tech tracking
tech-stack:
  added: [satori, "@resvg/resvg-js"]
  patterns: ["TanStack Start createServerFileRoute for non-HTML endpoints", "ConvexHttpClient in server routes for data fetching", "Module-level font caching for satori", "Google Fonts TTF fetch via IE9 user-agent spoofing"]

key-files:
  created:
    - web/src/routes/api/robots[.]txt.ts
    - web/src/routes/api/sitemap[.]xml.ts
    - web/src/routes/api/og.ts
  modified:
    - web/package.json
    - web/netlify.toml
    - web/convex/_generated/api.d.ts

key-decisions:
  - "Used ConvexHttpClient (not reactive subscription) in server routes for one-shot data fetching"
  - "Font loading from Google Fonts at runtime with IE9 user-agent to get TTF format (satori cannot use WOFF2)"
  - "Fallback to minimal sitemap or transparent PNG on errors rather than 500 responses"
  - "Netlify redirects added BEFORE SPA fallback for root-level /robots.txt and /sitemap.xml access"

patterns-established:
  - "Server route pattern: createServerFileRoute + ConvexHttpClient for backend data access"
  - "OG image pattern: satori JSX objects + Resvg for SVG-to-PNG with module-level font cache"
  - "Error resilience: graceful degradation (minimal sitemap, transparent pixel) rather than error pages"

requirements-completed: [SEOG-01, SEOG-02, SEOG-03]

# Metrics
duration: 6min
completed: 2026-03-22
---

# Phase 9 Plan 3: Server Routes Summary

**Dynamic sitemap.xml, robots.txt, and branded OG image generation via TanStack Start server routes with satori + resvg-js**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-22T21:04:23Z
- **Completed:** 2026-03-22T21:10:30Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Dynamic sitemap.xml server route that queries Convex for all published scholarship slugs, top countries, and degree levels to produce a complete URL list
- Robots.txt server route disallowing /admin routes and referencing sitemap location
- Dynamic OG image generation handling 5 page types (scholarship, country, degree, collection, default) with neo-brutalism branded design
- Netlify redirects configured for root-level /robots.txt and /sitemap.xml access by search engine crawlers

## Task Commits

Each task was committed atomically:

1. **Task 1: Install OG deps, robots.txt + sitemap.xml routes** - `c0504b4` (feat)
2. **Task 2: Dynamic OG image generation route** - `33302ce` (feat)

## Files Created/Modified
- `web/src/routes/api/robots[.]txt.ts` - Server route returning robots.txt with admin disallow and sitemap reference
- `web/src/routes/api/sitemap[.]xml.ts` - Server route dynamically generating sitemap XML from Convex scholarship, country, and degree data
- `web/src/routes/api/og.ts` - Server route generating branded PNG OG images via satori JSX-to-SVG and resvg SVG-to-PNG
- `web/package.json` - Added satori and @resvg/resvg-js dependencies
- `web/netlify.toml` - Added root-level redirects for /robots.txt and /sitemap.xml before SPA fallback
- `web/convex/_generated/api.d.ts` - Added seo module to generated type declarations

## Decisions Made
- Used ConvexHttpClient in server routes (not reactive subscriptions) since server routes are one-shot request handlers
- Fonts fetched from Google Fonts API at runtime with IE9 user-agent to force TTF format (satori cannot process WOFF2)
- Module-level font caching avoids refetching on every OG image request
- Error fallback returns minimal valid content (sitemap with homepage only, 1x1 transparent PNG) rather than failing with 500 HTML errors
- Netlify redirects placed before SPA fallback so /robots.txt and /sitemap.xml are served by server routes, not caught by catch-all

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated Convex api.d.ts to include seo module**
- **Found during:** Task 1 (sitemap route creation)
- **Issue:** Plan 01 created web/convex/seo.ts but the generated api.d.ts did not include the seo module import, causing TypeScript errors when importing api.seo queries
- **Fix:** Added `import type * as seo from "../seo.js"` and `seo: typeof seo` to the fullApi declaration in api.d.ts
- **Files modified:** web/convex/_generated/api.d.ts
- **Verification:** TypeScript imports resolve correctly in sitemap and OG routes
- **Committed in:** c0504b4 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary for TypeScript type resolution. No scope creep.

## Issues Encountered
- Cherry-pick of Plan 01 dependency commits caused merge conflict in __root.tsx (resolved by keeping the complete version with CompareProvider + SEO enhancements)

## Known Stubs
None - all server routes are fully implemented with real Convex queries and proper error handling.

## User Setup Required
None - server routes work with existing VITE_CONVEX_URL environment variable. OG images will render with Google Fonts fetched at runtime.

## Next Phase Readiness
- All 3 technical SEO server routes operational (sitemap.xml, robots.txt, OG images)
- OG image URLs ready for consumption by meta tags (e.g., /api/og?type=scholarship&slug=X)
- Sitemap available at /sitemap.xml for Google Search Console submission
- All 123 existing tests continue to pass

---
*Phase: 09-seo-growth*
*Completed: 2026-03-22*
