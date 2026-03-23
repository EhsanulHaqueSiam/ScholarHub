---
phase: 10-study-australia-scrapers
plan: 01
subsystem: scraping
tags: [inertia.js, httpx, scraper, study-australia, pagination, 409-retry]

# Dependency graph
requires:
  - phase: 03-scraping-pipeline
    provides: BaseScraper, SCRAPER_MAP, SourceConfig protocol, scrapeMethodValidator
provides:
  - InertiaScraper class for Inertia.js (Laravel+Vue/React) sites
  - map_study_australia_record field mapping helper
  - InertiaVersionMismatchError exception for 409 handling
  - "inertia" registered in SCRAPER_MAP, Convex schema, VALID_METHODS
affects: [10-02-study-australia-configs, future-inertia-sites]

# Tech tracking
tech-stack:
  added: []
  patterns: [inertia-js-json-protocol, two-step-version-fetch, 409-retry-with-version-refresh]

key-files:
  created:
    - scraping/src/scholarhub_pipeline/scrapers/inertia_scraper.py
    - scraping/tests/test_inertia_scraper.py
    - scraping/tests/fixtures/inertia_scholarship_response.json
  modified:
    - scraping/src/scholarhub_pipeline/scrapers/__init__.py
    - web/convex/schema.ts
    - scraping/tests/test_configs/test_config_protocol.py

key-decisions:
  - "Dedicated InertiaScraper class rather than extending ApiScraper -- cleaner separation, reusable for any Inertia.js site"
  - "map_study_australia_record as module-level helper, not method -- allows direct testing and reuse"
  - "409 retry limited to 1 attempt per page -- prevents infinite retry loops on persistent version changes"

patterns-established:
  - "Inertia.js two-step protocol: HTML GET for version hash, then X-Inertia headers for JSON"
  - "Version extraction via HTML entity regex: version&quot;:&quot;([a-f0-9]+)&quot;"
  - "Conditional field mapping: use field_mappings if configured, else use type-specific helper"

requirements-completed: [SA-02, SA-03, SA-04, SA-05]

# Metrics
duration: 3min
completed: 2026-03-21
---

# Phase 10 Plan 01: InertiaScraper Summary

**InertiaScraper with Inertia.js JSON protocol, 409 version mismatch retry, and Study Australia field mapping**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-21T02:57:41Z
- **Completed:** 2026-03-21T03:00:47Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- InertiaScraper class extending BaseScraper with full Inertia.js two-step protocol (version extraction + JSON pagination)
- 409 version mismatch handling with automatic version re-fetch and retry
- map_study_australia_record helper mapping all scholarship fields to raw_record schema
- 9 unit tests covering version extraction, pagination (multi-page and single), 409 retry, field mapping, empty response, and max pages limit
- Registered "inertia" method across SCRAPER_MAP, Convex scrapeMethodValidator, and config protocol VALID_METHODS

## Task Commits

Each task was committed atomically:

1. **Task 1: Create InertiaScraper class with test fixture and tests**
   - `1c2c4dd` (test: add failing tests for InertiaScraper - RED)
   - `1c735b1` (feat: implement InertiaScraper with Inertia.js JSON protocol - GREEN)
2. **Task 2: Register inertia method in SCRAPER_MAP, Convex schema, and config protocol test** - `12f195e` (feat)

_Note: Task 1 used TDD with RED/GREEN commits._

## Files Created/Modified
- `scraping/src/scholarhub_pipeline/scrapers/inertia_scraper.py` - InertiaScraper class, InertiaVersionMismatchError, map_study_australia_record helper
- `scraping/tests/test_inertia_scraper.py` - 9 unit tests for version extraction, pagination, retry, field mapping
- `scraping/tests/fixtures/inertia_scholarship_response.json` - Mock Inertia API response with 2 scholarships
- `scraping/src/scholarhub_pipeline/scrapers/__init__.py` - Added InertiaScraper import, SCRAPER_MAP entry, __all__ export
- `web/convex/schema.ts` - Added v.literal("inertia") to scrapeMethodValidator
- `scraping/tests/test_configs/test_config_protocol.py` - Added "inertia" to VALID_METHODS set

## Decisions Made
- Dedicated InertiaScraper class rather than extending ApiScraper -- the two-step version fetch protocol is fundamentally different from standard API scraping
- map_study_australia_record as module-level helper function rather than class method -- allows direct import and testing without scraper instantiation
- 409 retry limited to 1 attempt per mismatch -- prevents infinite loops on rapidly-deploying sites
- Conditional field mapping: if config.field_mappings is non-empty use BaseScraper.apply_field_mappings, otherwise use map_study_australia_record -- allows both generic and Study-Australia-specific usage

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- InertiaScraper is ready for use by Study Australia config files (Plan 10-02)
- The scraper is generic enough for any Inertia.js site, not just Study Australia
- All existing tests continue to pass (18/18 including config protocol tests)

## Self-Check: PASSED

All 4 created files verified on disk. All 3 commit hashes found in git log.

---
*Phase: 10-study-australia-scrapers*
*Completed: 2026-03-21*
