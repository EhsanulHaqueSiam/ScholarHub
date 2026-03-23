---
phase: 02-source-discovery
plan: 01
subsystem: database, testing
tags: [convex, json-schema, vitest, convex-test, pytest, jsonschema]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Convex schema with sources table, validators, Python scraping package
provides:
  - Extended Convex sources schema with wave/auth/api/volume fields and URL/wave indexes
  - upsertSource mutation with find-by-URL create-or-update logic
  - JSON Schema (Draft 2020-12) for source entry validation
  - Source catalog README with template entry and valid values documentation
  - 5 sample source fixtures covering all categories
  - convex-test infrastructure for testing Convex mutations
affects: [02-02, 02-03, 03-scraping-pipeline]

# Tech tracking
tech-stack:
  added: [convex-test, "@edge-runtime/vm", jsonschema, check-jsonschema]
  patterns: [convex-test with anyApi and import.meta.glob, JSON Schema Draft 2020-12 validation]

key-files:
  created:
    - web/convex/sources.ts
    - web/convex/_generated/api.ts
    - web/convex/_generated/server.ts
    - web/convex/_generated/dataModel.ts
    - web/src/tests/sources.test.ts
    - scraping/sources/schema.json
    - scraping/sources/README.md
    - scraping/tests/fixtures/sample_sources.json
    - scraping/tests/test_seed_sources.py
  modified:
    - web/convex/schema.ts
    - web/package.json
    - scraping/pyproject.toml

key-decisions:
  - "Used anyApi from convex/server with import.meta.glob for convex-test since convex codegen requires auth"
  - "Created convex/_generated files manually for type-safe testing without live Convex deployment"
  - "Added rss as 4th scrapeMethodValidator option for RSS/Atom feed sources"

patterns-established:
  - "convex-test pattern: convexTest(schema, import.meta.glob('../../convex/**/*.*s')) with @vitest-environment edge-runtime"
  - "JSON Schema validation pattern: jsonschema.validate(instance, schema) for source entry validation"
  - "Source entry format: required fields (name, url, category, scrape_method, scrape_frequency_hours, wave, is_active) + optional defaults"

requirements-completed: [SRCD-05]

# Metrics
duration: 7min
completed: 2026-03-20
---

# Phase 2 Plan 1: Source Catalog Infrastructure Summary

**Convex schema extended with wave/auth/api fields, upsertSource mutation with URL-based upsert, JSON Schema (Draft 2020-12) validation, and full TDD test coverage via convex-test and pytest**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-19T23:07:32Z
- **Completed:** 2026-03-19T23:14:53Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Extended Convex sources table with 4 new optional fields (wave, auth_required, has_api, estimated_volume) and 3 new indexes (by_url, by_wave, by_active_wave)
- Created upsertSource mutation that finds sources by URL index and creates or updates idempotently
- JSON Schema validates all source entries with enum constraints matching Convex validators exactly
- Full TDD: 4 Vitest tests (convex-test) + 5 pytest tests (jsonschema), all passing

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Failing upsertSource tests** - `1570877` (test)
2. **Task 1 GREEN: Schema extension + mutation + passing tests** - `77284ea` (feat)
3. **Task 2 RED: Failing JSON Schema validation tests** - `a006065` (test)
4. **Task 2 GREEN: JSON Schema + fixtures + README + passing tests** - `fd6a205` (feat)

_Note: TDD tasks have separate RED (failing test) and GREEN (implementation) commits_

## Files Created/Modified

### Created
- `web/convex/sources.ts` - upsertSource mutation with URL-based find-or-create
- `web/convex/_generated/api.ts` - Generated API types for convex-test compatibility
- `web/convex/_generated/server.ts` - Generated server utilities (query, mutation, action builders)
- `web/convex/_generated/dataModel.ts` - Generated data model types from schema
- `web/src/tests/sources.test.ts` - 4 Vitest tests using convex-test mock backend
- `scraping/sources/schema.json` - JSON Schema (Draft 2020-12) for source entries
- `scraping/sources/README.md` - Template entry, valid values, field docs, validation commands
- `scraping/tests/fixtures/sample_sources.json` - 5 sample entries (one per category)
- `scraping/tests/test_seed_sources.py` - 5 pytest tests for schema validation

### Modified
- `web/convex/schema.ts` - Added rss to scrapeMethodValidator, 4 new fields, 3 new indexes
- `web/package.json` - Added convex-test and @edge-runtime/vm dev dependencies
- `scraping/pyproject.toml` - Added jsonschema and check-jsonschema dependencies

## Decisions Made
- Used `anyApi` from `convex/server` with `import.meta.glob` for convex-test instead of generated `api` import, since `convex codegen` requires authentication to a live deployment
- Created `convex/_generated` files manually (api.ts, server.ts, dataModel.ts) to enable convex-test module discovery without running codegen
- Added `rss` as a 4th scrapeMethodValidator option (distinct from `api`) for RSS/Atom feed sources

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created convex/_generated files manually**
- **Found during:** Task 1 (GREEN phase)
- **Issue:** `convex codegen` requires authentication to a live Convex deployment; `convex-test` requires `_generated` directory in module glob results
- **Fix:** Created minimal `_generated/api.ts`, `_generated/server.ts`, `_generated/dataModel.ts` manually using the same patterns as Convex's codegen templates
- **Files modified:** `web/convex/_generated/api.ts`, `web/convex/_generated/server.ts`, `web/convex/_generated/dataModel.ts`
- **Verification:** All 4 convex-test tests pass
- **Committed in:** 77284ea

**2. [Rule 3 - Blocking] Used anyApi instead of generated typed api**
- **Found during:** Task 1 (GREEN phase)
- **Issue:** Without `convex codegen`, the typed `api` export from `_generated/api` was unavailable for test function references
- **Fix:** Used `anyApi` from `convex/server` which provides untyped function references, combined with `import.meta.glob` for module discovery
- **Files modified:** `web/src/tests/sources.test.ts`
- **Verification:** All 4 tests pass with correct type inference at runtime
- **Committed in:** 77284ea

**3. [Rule 1 - Bug] Fixed ruff line length in test file**
- **Found during:** Task 2 (GREEN phase)
- **Issue:** Test assertion line exceeded 100-char limit
- **Fix:** Split long assertion into variable + assertion
- **Files modified:** `scraping/tests/test_seed_sources.py`
- **Verification:** `ruff check` passes
- **Committed in:** fd6a205

---

**Total deviations:** 3 auto-fixed (1 bug, 2 blocking)
**Impact on plan:** All auto-fixes necessary for test infrastructure to work without live Convex auth. No scope creep.

## Issues Encountered
- Convex codegen requires authentication (`convex codegen` calls the deployment API). Resolved by creating generated files manually. This is a known limitation when running offline or without deployment credentials.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Source catalog infrastructure complete: schema, mutation, validation, and documentation all in place
- Ready for Plan 02 (seed script + URL validation tooling) and Plan 03 (source discovery research)
- Enum values verified identical between JSON Schema and Convex validators

## Self-Check: PASSED

All 9 created files verified present. All 4 task commits verified in git log.

---
*Phase: 02-source-discovery*
*Completed: 2026-03-20*
