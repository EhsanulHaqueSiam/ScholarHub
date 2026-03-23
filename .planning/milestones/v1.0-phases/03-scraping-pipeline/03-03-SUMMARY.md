---
phase: 03-scraping-pipeline
plan: 03
subsystem: scraping
tags: [scrapling, httpx, extruct, feedparser, stealthy-fetcher, config-driven, factory-pattern]

# Dependency graph
requires:
  - phase: 03-scraping-pipeline
    provides: SourceConfig protocol, base config classes, ingestion layer (normalizer, quality, sanitizer), utility modules (UA rotation, retry, fuzzy fallback)
provides:
  - BaseScraper ABC with record processing, field mapping, and cutoff checking
  - ApiScraper for paginated JSON API endpoints via httpx
  - JsonLdExtractor for structured data extraction via extruct
  - RssScraper for RSS/Atom feed parsing via feedparser
  - HtmlScraper for standard HTML pages via Scrapling Fetcher with fuzzy fallback
  - StealthyScraper for Cloudflare-protected pages via StealthyFetcher
  - Scraper factory function (get_scraper) mapping 6 method strings to scraper classes
  - 13 passing tests across API, HTML, and Stealthy scrapers
affects: [03-04, 03-05, 03-06, 03-07]

# Tech tracking
tech-stack:
  added: [pytest-asyncio]
  patterns: [config-driven-scraper, scraper-factory, fuzzy-selector-fallback, mock-scrapling-with-real-selectors]

key-files:
  created:
    - scraping/src/scholarhub_pipeline/scrapers/base.py
    - scraping/src/scholarhub_pipeline/scrapers/api_scraper.py
    - scraping/src/scholarhub_pipeline/scrapers/jsonld_extractor.py
    - scraping/src/scholarhub_pipeline/scrapers/rss_scraper.py
    - scraping/src/scholarhub_pipeline/scrapers/html_scraper.py
    - scraping/src/scholarhub_pipeline/scrapers/stealthy_scraper.py
    - scraping/tests/test_api_scraper.py
    - scraping/tests/test_html_scraper.py
    - scraping/tests/test_stealthy_scraper.py
  modified:
    - scraping/src/scholarhub_pipeline/scrapers/__init__.py
    - scraping/tests/conftest.py
    - scraping/pyproject.toml

key-decisions:
  - "All scrapers are config-driven via SourceConfig protocol -- no per-source spider classes needed"
  - "Scrapling Fetcher.get() and StealthyFetcher.fetch() used as sync calls within async scrape() methods"
  - "Test mocking strategy uses real Scrapling Selector for CSS parsing while mocking HTTP fetch layer"
  - "AJAX method aliases to ApiScraper since AJAX endpoints serve JSON just like REST APIs"

patterns-established:
  - "Config-driven scraper: all scraper behavior is driven by SourceConfig.selectors and field_mappings, no subclassing needed per source"
  - "Scraper factory: get_scraper(config) returns the right scraper instance based on config.primary_method"
  - "Fuzzy fallback: HtmlScraper tries common CSS patterns when configured selectors fail to match"
  - "Test pattern: mock Fetcher/StealthyFetcher at module level, use real Scrapling Selector for CSS assertions"

requirements-completed: [SCRP-01, SCRP-02, SCRP-03]

# Metrics
duration: 7min
completed: 2026-03-20
---

# Phase 03 Plan 03: Scraper Types Summary

**6 config-driven scrapers (API, JSON-LD, RSS, HTML via Scrapling Fetcher, Stealthy via StealthyFetcher, AJAX alias) with shared BaseScraper ABC, factory function, pagination support, cutoff filtering, and 13 passing tests**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-20T11:19:52Z
- **Completed:** 2026-03-20T11:27:18Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Implemented all 6 scraper types covering every primary_method in the SourceConfig protocol (api, jsonld, ajax, rss, scrape, scrapling)
- Each scraper is fully config-driven: CSS selectors, field mappings, pagination, detail page following, and cutoff filtering all come from SourceConfig
- 13 tests passing: 5 API scraper tests, 5 HTML scraper tests, 3 Stealthy scraper tests -- all using mocked HTTP with real Scrapling Selector CSS parsing
- Factory function maps method strings to classes, enabling the pipeline orchestrator to auto-select scrapers

## Task Commits

Each task was committed atomically:

1. **Task 1: Base scraper and config-driven API, JSON-LD, and RSS scrapers** - `19dd35b` (feat)
2. **Task 2: HTML scraper, Stealthy scraper, factory, and tests** - `4f0b432` (feat)

## Files Created/Modified
- `scraping/src/scholarhub_pipeline/scrapers/base.py` - BaseScraper ABC with process_record, is_expired_beyond_cutoff, apply_field_mappings
- `scraping/src/scholarhub_pipeline/scrapers/api_scraper.py` - ApiScraper with paginated JSON extraction via httpx
- `scraping/src/scholarhub_pipeline/scrapers/jsonld_extractor.py` - JsonLdExtractor with extruct schema.org mapping
- `scraping/src/scholarhub_pipeline/scrapers/rss_scraper.py` - RssScraper with feedparser and optional detail page following
- `scraping/src/scholarhub_pipeline/scrapers/html_scraper.py` - HtmlScraper with Scrapling Fetcher and fuzzy selector fallback
- `scraping/src/scholarhub_pipeline/scrapers/stealthy_scraper.py` - StealthyScraper with StealthyFetcher for Cloudflare bypass
- `scraping/src/scholarhub_pipeline/scrapers/__init__.py` - SCRAPER_MAP and get_scraper factory function
- `scraping/tests/conftest.py` - Shared fixtures: mock_source_config, mock_html_config, mock_api_response, mock_html_page, mock_rss_feed, pytest_addoption
- `scraping/tests/test_api_scraper.py` - 5 tests: extract, pagination, cutoff, empty, flat list
- `scraping/tests/test_html_scraper.py` - 5 tests: extract, field mappings, pagination, fuzzy fallback, cutoff
- `scraping/tests/test_stealthy_scraper.py` - 3 tests: extract, pagination, detail pages
- `scraping/pyproject.toml` - Added pytest-asyncio dev dependency

## Decisions Made
- All scrapers are config-driven via SourceConfig protocol: no per-source spider classes. A single HtmlScraper handles any HTML source given appropriate selectors.
- Scrapling Fetcher.get() and StealthyFetcher.fetch() are synchronous calls used within async scrape() methods. The async boundary exists for rate limiting sleeps and detail page following.
- Test mocking strategy: mock the HTTP fetch layer (Fetcher/StealthyFetcher classes) but use real Scrapling Selector for CSS parsing to validate actual extraction logic.
- AJAX method aliases directly to ApiScraper since AJAX endpoints return JSON responses identical to REST APIs.
- Added pytest-asyncio dev dependency to enable async test support for all scraper tests.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added pytest-asyncio dev dependency**
- **Found during:** Task 1 (pre-test setup)
- **Issue:** pytest-asyncio was not installed, needed for @pytest.mark.asyncio on all scraper tests
- **Fix:** `uv add --group dev pytest-asyncio`
- **Files modified:** scraping/pyproject.toml, scraping/uv.lock
- **Verification:** All async tests run successfully
- **Committed in:** 19dd35b (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary dev dependency addition. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 6 scraper types ready for pipeline orchestrator integration (Plan 04)
- Factory function ready for config-driven scraper instantiation
- Shared base class provides consistent record processing across all types
- Test infrastructure ready for additional scraper-specific tests

## Self-Check: PASSED

All 12 files verified on disk. Both task commits (19dd35b, 4f0b432) verified in git log.

---
*Phase: 03-scraping-pipeline*
*Completed: 2026-03-20*
