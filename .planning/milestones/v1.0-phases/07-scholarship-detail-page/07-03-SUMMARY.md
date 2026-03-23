---
phase: 07-scholarship-detail-page
plan: 03
subsystem: ui
tags: [react, tanstack-router, convex, json-ld, seo, breadcrumb, sticky-bar, schema-org]

# Dependency graph
requires:
  - phase: 07-scholarship-detail-page
    provides: "Plan 01 utilities (shared.ts, deadline.ts, regions.ts, getScholarshipDetail query) and Plan 02 section components (10 components in detail/)"
provides:
  - "Complete scholarship detail page route ($slug.tsx) wiring all sections, SEO, navigation"
  - "Expanded Schema.org JSON-LD with educationalLevel, occupationalCategory, dateModified, funder"
  - "Structured meta title: {Title} -- {Funding Type} {Degree} Scholarship in {Country} | ScholarHub"
  - "Breadcrumb with filter context preservation via Zod search params"
  - "Sticky bar with IntersectionObserver-driven visibility toggle"
  - "Loading skeleton and 404 not-found states"
  - "Typed api import replacing anyApi for directory module"
affects: [08-related-scholarships, 09-seo-landing-pages]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Typed api import from _generated/api instead of anyApi for type-safe Convex queries"
    - "Client-side document.title update with typeof document guard for SSR safety"
    - "Zod search params schema for breadcrumb filter context preservation across route navigation"

key-files:
  created: []
  modified:
    - web/src/routes/scholarships/$slug.tsx
    - web/convex/_generated/api.ts

key-decisions:
  - "Updated generated api.ts to include directory module for typed api import (replaces anyApi pattern)"
  - "Client-side document.title update uses typeof document !== undefined guard for SSR compatibility"
  - "Breadcrumb search params use a separate detailSearchSchema (subset of directory schema) to avoid carrying unused params"

patterns-established:
  - "Detail page route pattern: typed query + loading skeleton + 404 state + multi-section layout with sticky bar"
  - "Meta title pattern: buildMetaTitle function with structured format and graceful fallback"

requirements-completed: [DTLP-01, DTLP-02, DTLP-03, DTLP-04, DTLP-05, DTLP-06, DTLP-07, DTLP-08, DTLP-09, DTLP-10, DTLP-11]

# Metrics
duration: 2min
completed: 2026-03-21
---

# Phase 7 Plan 3: Detail Page Route Integration Summary

**Complete $slug.tsx rewrite wiring 10 section components, expanded Schema.org JSON-LD, structured meta titles, breadcrumb filter context, and sticky bar scroll behavior**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-20T18:34:47Z
- **Completed:** 2026-03-20T18:37:00Z
- **Tasks:** 1 (of 2; Task 2 is human-verify checkpoint)
- **Files modified:** 2

## Accomplishments
- Completely rewrote $slug.tsx from 184-line placeholder to 324-line fully-integrated detail page with all 10 section components
- Expanded Schema.org JSON-LD with 4 new fields: educationalLevel, occupationalCategory, dateModified, funder
- Added structured meta title following "{Title} -- {Funding Type} {Degree} Scholarship in {Country} | ScholarHub" format with graceful fallback
- Integrated sticky bar with IntersectionObserver-driven visibility, breadcrumb with filter context, and loading/404 states
- Replaced anyApi with typed api import by updating generated api.ts to include directory module

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite $slug.tsx -- wire all sections, expanded JSON-LD, meta tags, sticky bar, breadcrumb** - `9673a68` (feat)
2. **Task 2: Visual verification of complete detail page** - checkpoint:human-verify (pending)

## Files Created/Modified
- `web/src/routes/scholarships/$slug.tsx` - Complete detail page route with all section components, JSON-LD, meta tags, breadcrumb, sticky bar, loading/404 states
- `web/convex/_generated/api.ts` - Added directory module import for typed api usage

## Decisions Made
- Updated generated api.ts to include directory module for typed api import instead of using anyApi -- improves type safety while matching what `npx convex dev` would generate
- Client-side document.title update uses typeof document guard for SSR compatibility -- head() provides slug-based fallback for SSR, client-side updates with full scholarship data
- Breadcrumb uses a separate detailSearchSchema with only filter-relevant fields (from, to, degree, field, funding, tier, sort) to avoid carrying UI-only params like view/show_closed

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated generated api.ts to include directory module**
- **Found during:** Task 1 (route rewrite)
- **Issue:** Generated api.ts only included `sources` module, not `directory`. Using `api.directory.getScholarshipDetail` would fail TypeScript compilation.
- **Fix:** Added `import type * as directory from "../directory.js"` and included `directory: typeof directory` in fullApi type map
- **Files modified:** web/convex/_generated/api.ts
- **Verification:** `npx tsc --noEmit` passes with no errors
- **Committed in:** 9673a68 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Auto-fix necessary to use typed api import as specified. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all section components are wired to live Convex query data with no placeholder values.

## Next Phase Readiness
- Detail page is fully integrated and ready for visual verification (Task 2 checkpoint)
- Phase 7 complete after human approval -- all 3 plans delivered
- Ready for Phase 8 (related scholarships) and Phase 9 (SEO landing pages) which depend on this page

## Self-Check: PASSED
