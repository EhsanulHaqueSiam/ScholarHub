---
phase: 02-source-discovery
plan: 02
subsystem: tooling, ci
tags: [aiohttp, async, url-validation, convex-seed, json-schema, ci, cli]

# Dependency graph
requires:
  - phase: 02-source-discovery
    plan: 01
    provides: Convex sources schema, upsertSource mutation, JSON Schema, sample fixtures
provides:
  - validate_sources.py with async URL reachability, normalization, dedup detection
  - seed_sources.py with JSON Schema validation, Convex upsert, dry-run mode
  - stats_sources.py with per-category, per-wave, per-method, per-region coverage report
  - CI validate-sources job using check-jsonschema on every PR
  - validation_report.json gitignored
affects: [02-03, 03-scraping-pipeline]

# Tech tracking
tech-stack:
  added: [aiohttp]
  patterns: [async URL validation with semaphore concurrency, CLI scripts with argparse]

key-files:
  created:
    - scraping/scripts/validate_sources.py
    - scraping/scripts/seed_sources.py
    - scraping/scripts/stats_sources.py
    - scraping/tests/test_validate_sources.py
  modified:
    - scraping/pyproject.toml
    - .github/workflows/ci.yml
    - .gitignore

key-decisions:
  - "Added scripts/ ruff per-file-ignore for T20 (print) since CLI scripts use print for output"
  - "Used dot-fill alignment in stats output for readability"
  - "Region mapping covers 40+ countries to 6 high-level regions (Global, Europe, Asia, Americas, Africa, Oceania)"

patterns-established:
  - "CLI script pattern: argparse with --source-dir default, skip schema.json/validation_report.json"
  - "Async URL validation: aiohttp.ClientSession + asyncio.Semaphore(20) + 10s timeout"
  - "Source loading pattern: glob *.json, skip SKIP_FILES set, add _file key for traceability"

requirements-completed: [SRCD-05, SRCD-01]

# Metrics
duration: 4min
completed: 2026-03-20
---

# Phase 2 Plan 2: Source Catalog Tooling Summary

**Three CLI scripts (seed, validate, stats) for source catalog workflow with async URL validation, JSON Schema CI enforcement, and TDD test coverage**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-20T00:09:47Z
- **Completed:** 2026-03-20T00:13:30Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Built validate_sources.py with async URL reachability checks (aiohttp, semaphore 20, 10s timeout), URL normalization (strip www/trailing slash/query/fragment, force HTTPS), and cross-file duplicate detection
- Built seed_sources.py that loads JSON source files, validates against schema.json, and upserts each entry to Convex via sources:upsertSource mutation (with --dry-run mode)
- Built stats_sources.py reporting per-category, per-wave, per-scrape-method, per-region counts with formatted text output
- Added validate-sources CI job using check-jsonschema to enforce JSON Schema on every PR
- All 7 URL validation tests pass, all scripts pass ruff linting

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Failing URL validation tests** - `7641266` (test)
2. **Task 1 GREEN: validate_sources.py implementation** - `6d4dbf5` (feat)
3. **Task 2: seed_sources.py, stats_sources.py, CI job, gitignore** - `86e240b` (feat)

_Note: Task 1 is TDD with separate RED and GREEN commits_

## Files Created/Modified

### Created
- `scraping/scripts/validate_sources.py` - Async URL validation, normalization, dedup detection, JSON report output
- `scraping/scripts/seed_sources.py` - Load/validate JSON against schema, upsert to Convex with dry-run mode
- `scraping/scripts/stats_sources.py` - Per-category, per-wave, per-method, per-region coverage report
- `scraping/tests/test_validate_sources.py` - 7 tests: normalize_url (4), find_duplicates (2), load_all_sources (1)

### Modified
- `scraping/pyproject.toml` - Added aiohttp dependency, scripts/ ruff T20 ignore
- `.github/workflows/ci.yml` - Added validate-sources job with check-jsonschema
- `.gitignore` - Added scraping/sources/validation_report.json

## Decisions Made
- Added `scripts/**/*.py` ruff per-file-ignore for T20 (print) since CLI scripts legitimately use print for user output
- Used dot-fill alignment in stats output tables for clean readability
- Built region mapping covering 40+ countries to 6 high-level regions for geographic aggregation
- Used `sys.path.insert` in test file to import from scripts/ directory (not a package)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed ruff line length in stats_sources.py**
- **Found during:** Task 2
- **Issue:** Summary line exceeded 100-char ruff limit
- **Fix:** Extracted dict values to local variables before f-string
- **Files modified:** `scraping/scripts/stats_sources.py`
- **Verification:** `ruff check scripts/` exits 0
- **Committed in:** 86e240b

**2. [Rule 1 - Bug] Removed unused noqa directive in validate_sources.py**
- **Found during:** Task 1 (GREEN phase)
- **Issue:** `# noqa: BLE001` on bare except was unused because BLE001 is not in the enabled rule set
- **Fix:** Removed the noqa comment
- **Files modified:** `scraping/scripts/validate_sources.py`
- **Verification:** `ruff check scripts/validate_sources.py` exits 0
- **Committed in:** 6d4dbf5

**3. [Rule 3 - Blocking] Added scripts/ T20 ignore to pyproject.toml**
- **Found during:** Task 1 (GREEN phase)
- **Issue:** ruff T20 rule flags all print() calls as errors, but CLI scripts need print for output
- **Fix:** Added `"scripts/**/*.py" = ["T20"]` to per-file-ignores
- **Files modified:** `scraping/pyproject.toml`
- **Verification:** `ruff check scripts/` exits 0
- **Committed in:** 6d4dbf5

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 blocking)
**Impact on plan:** All auto-fixes necessary for linting compliance. No scope creep.

## Issues Encountered
None - plan executed as written.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All three catalog CLI scripts operational: validate URLs, seed to Convex, report stats
- CI enforces JSON Schema validation on every PR
- Ready for Plan 03 (source discovery research and catalog population)
- Once source JSON files exist, `seed_sources.py --dry-run` can preview and `seed_sources.py` can upsert to Convex

## Self-Check: PASSED

All 4 created files verified present. All 3 task commits verified in git log.

---
*Phase: 02-source-discovery*
*Completed: 2026-03-20*
