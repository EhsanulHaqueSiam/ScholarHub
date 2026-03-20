---
phase: 03-scraping-pipeline
plan: 02
subsystem: scraping
tags: [pycountry, dateutil, bleach, convex, normalization, dedup, sanitizer, user-agent]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Convex schema with raw_records table, Python environment with uv
  - phase: 02-source-discovery
    provides: 201 source catalog entries with scrape_method annotations
provides:
  - Convex client with admin auth for pipeline batch mutations
  - Record batch accumulator with configurable flush size
  - Country/date/currency normalization (ISO 3166, ISO 8601, ISO 4217)
  - Quality flag detection for missing/short/unparseable fields
  - Within-source deduplication by external_id and source_url
  - Field-level diff computation for change tracking
  - 20 realistic browser User-Agent strings with rotation
  - Async retry with exponential backoff and jitter
  - HTML sanitizer stripping script/style tags and content
  - Fuzzy fallback heuristic for CSS selector recovery
affects: [03-scraping-pipeline, 04-data-enrichment]

# Tech tracking
tech-stack:
  added: [pycountry, python-dateutil, bleach, structlog, pytest-timeout]
  patterns: [batch-accumulator, quality-flags, within-source-dedup, field-level-diff]

key-files:
  created:
    - scraping/src/scholarhub_pipeline/ingestion/convex_client.py
    - scraping/src/scholarhub_pipeline/ingestion/batch.py
    - scraping/src/scholarhub_pipeline/ingestion/normalizer.py
    - scraping/src/scholarhub_pipeline/ingestion/quality.py
    - scraping/src/scholarhub_pipeline/ingestion/dedup.py
    - scraping/src/scholarhub_pipeline/ingestion/differ.py
    - scraping/src/scholarhub_pipeline/utils/ua_rotation.py
    - scraping/src/scholarhub_pipeline/utils/retry.py
    - scraping/src/scholarhub_pipeline/utils/sanitizer.py
    - scraping/src/scholarhub_pipeline/utils/fuzzy_fallback.py
    - scraping/tests/test_normalizer.py
    - scraping/tests/test_quality.py
    - scraping/tests/test_ingestion.py
  modified:
    - scraping/pyproject.toml

key-decisions:
  - "Used dayfirst=True in dateutil parser to correctly handle DD/MM/YYYY formats common in international scholarship sites"
  - "Script/style tag content stripped before bleach processing for defense-in-depth sanitization"
  - "Country normalization uses manual overrides for UK/USA/South Korea before pycountry fuzzy search for performance"

patterns-established:
  - "Quality flags as list[str]: check_quality returns flag names like missing_title, unparseable_deadline"
  - "BatchAccumulator pattern: add() auto-flushes at batch_size, flush_remaining() for tail records"
  - "SourceDeduplicator scoped by source_id prefix: source_id:external_id and source_id:source_url"
  - "DIFF_FIELDS list controls which fields are tracked for change detection"

requirements-completed: [SCRP-05, SCRP-07]

# Metrics
duration: 7min
completed: 2026-03-20
---

# Phase 03 Plan 02: Data Ingestion Layer Summary

**Complete ingestion pipeline with Convex client, batch accumulation, country/date/currency normalization via pycountry+dateutil, quality flagging, within-source dedup, field-level diffing, plus utility modules for UA rotation, retry, sanitization, and fuzzy selector recovery -- all with 57 passing TDD tests**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-20T11:08:12Z
- **Completed:** 2026-03-20T11:15:44Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments
- Built complete data ingestion layer: Convex client with admin auth, batch accumulator (50-record flush), normalizer (country ISO 3166, date ISO 8601, currency ISO 4217), quality flags (6 checks), within-source dedup, field-level diff
- Built utility modules: 20 realistic browser UAs, async retry with exponential backoff, HTML sanitizer (strips script/style content), fuzzy CSS selector recovery heuristic
- All 57 TDD tests pass covering normalizer (30 tests), quality (12 tests), and ingestion components (15 tests)

## Task Commits

Each task was committed atomically:

1. **Task 1: Ingestion layer (TDD RED)** - `3f78ca4` (test) -- failing tests for normalizer, quality, ingestion
2. **Task 1: Ingestion layer (TDD GREEN)** - `1fafd4e` (feat) -- implementation making all 57 tests pass
3. **Task 2: Utility modules** - `bb553ab` (feat) -- UA rotation, retry, sanitizer, fuzzy fallback

## Files Created/Modified
- `scraping/src/scholarhub_pipeline/ingestion/convex_client.py` - PipelineConvexClient with admin auth and batch mutations
- `scraping/src/scholarhub_pipeline/ingestion/batch.py` - BatchAccumulator with configurable size, auto-flush, stats tracking
- `scraping/src/scholarhub_pipeline/ingestion/normalizer.py` - normalize_country (pycountry), normalize_date (dateutil), normalize_currency (lookup table)
- `scraping/src/scholarhub_pipeline/ingestion/quality.py` - check_quality returning quality flag strings
- `scraping/src/scholarhub_pipeline/ingestion/dedup.py` - SourceDeduplicator tracking by external_id and source_url
- `scraping/src/scholarhub_pipeline/ingestion/differ.py` - compute_diff for field-level change tracking
- `scraping/src/scholarhub_pipeline/utils/ua_rotation.py` - 20 browser UAs with get_random_ua()
- `scraping/src/scholarhub_pipeline/utils/retry.py` - retry_with_backoff async with exponential backoff + jitter
- `scraping/src/scholarhub_pipeline/utils/sanitizer.py` - sanitize_html stripping all tags including script/style content
- `scraping/src/scholarhub_pipeline/utils/fuzzy_fallback.py` - find_listing_selector and find_field_selectors heuristics
- `scraping/tests/test_normalizer.py` - 30 tests for country/date/currency normalization
- `scraping/tests/test_quality.py` - 12 tests for quality flag detection
- `scraping/tests/test_ingestion.py` - 15 tests for batch accumulator, dedup, differ

## Decisions Made
- Used `dayfirst=True` in dateutil parser to correctly handle DD/MM/YYYY formats common in international scholarship sites
- Strip script/style tag content before bleach processing -- bleach with strip=True only removes tags but keeps content, so a regex pre-pass removes dangerous script/style content entirely
- Country normalization checks manual overrides dict first (UK, USA, South Korea, etc.) before falling back to pycountry fuzzy search, which is slower but comprehensive

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Dependencies not installed in pyproject.toml**
- **Found during:** Task 1 (initial setup)
- **Issue:** pyproject.toml was missing pycountry, python-dateutil, bleach, structlog, pytest-timeout
- **Fix:** Added all required dependencies. During execution, Plan 01's changes were detected in the working tree (pyproject.toml already updated by a parallel Plan 01 execution), so no additional changes were needed
- **Files modified:** scraping/pyproject.toml, scraping/uv.lock
- **Verification:** `uv sync` succeeded, all imports work
- **Committed in:** 1fafd4e (Task 1 commit)

**2. [Rule 1 - Bug] sanitize_html did not strip script/style tag content**
- **Found during:** Task 2 (sanitizer implementation)
- **Issue:** bleach.clean with strip=True only removes HTML tags but keeps their text content. `<script>alert("xss")</script>Test` would return `alert("xss")Test` instead of `Test`
- **Fix:** Added regex pre-pass to remove `<script>` and `<style>` tags and their content before bleach processing
- **Files modified:** scraping/src/scholarhub_pipeline/utils/sanitizer.py
- **Verification:** `sanitize_html('<script>alert("xss")</script>Test')` returns `'Test'`
- **Committed in:** bb553ab (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Ingestion layer complete, ready for scraper framework integration (Plan 03)
- All normalization and quality checks ready for production use
- Utility modules (UA rotation, retry, sanitizer) ready for HTTP scraping

## Self-Check: PASSED

All 13 files verified present. All 3 commits (3f78ca4, 1fafd4e, bb553ab) verified in git log.

---
*Phase: 03-scraping-pipeline*
*Completed: 2026-03-20*
