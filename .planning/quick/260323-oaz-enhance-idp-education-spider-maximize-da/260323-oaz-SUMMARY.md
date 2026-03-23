---
phase: quick-260323-oaz
plan: 01
subsystem: scraping
tags: [api-scraper, nextdata, idp-education, pagination]
dependency_graph:
  requires: []
  provides: [nextdata-format, page-num-pagination, max-records, idp-nextdata-config]
  affects: [scraping/api_scraper, scraping/configs/idp]
tech_stack:
  added: []
  patterns: [nextdata-extraction, page-num-pagination]
key_files:
  created:
    - scraping/src/scholarhub_pipeline/configs/agg_idp_education_scholarships.py
  modified:
    - scraping/src/scholarhub_pipeline/scrapers/api_scraper.py
    - scraping/tests/test_api_scraper.py
decisions:
  - Use __NEXT_DATA__ JSON extraction instead of CSS selectors for Next.js sites
  - Listing page data (14 fields) is rich enough; disable detail_page scraping
  - Use all-subject/all-study-level/all-destination URL path for geo-IP-independent results
metrics:
  duration: ~5min
  completed: 2026-03-23
  tasks_completed: 2
  tasks_total: 2
---

# Quick Task 260323-oaz: Enhance IDP Education Spider Summary

ApiScraper gains nextdata format (extract JSON from __NEXT_DATA__ script tags), page_num pagination, and max_records limit; IDP config rewritten from fragile CSS selectors to structured JSON extraction yielding 12 mapped fields across 6300+ scholarships.

## Tasks Completed

### Task 1: Add nextdata format, page_num pagination, and max_records to ApiScraper
- **Commit:** 289b28f (tests), fe8bf29 (implementation)
- **TDD:** RED (4 failing tests) -> GREEN (all 11 pass)
- **Changes:**
  - Added `nextdata` format: regex-extracts JSON from `<script id="__NEXT_DATA__">` in HTML responses, then processes via existing `_extract_items` and `apply_field_mappings`
  - Added `page_num` pagination type: constructs `?param=N` URLs from base URL (alongside existing cursor pagination)
  - Added `max_records` enforcement: stops collection mid-page when limit reached
  - Moved `import re` and `import json as json_mod` to module top level (was inline)
  - Initialized `data = {}` before format branching to prevent NameError with page_num on json format

### Task 2: Rewrite IDP Education config for nextdata extraction
- **Commit:** caa82e1
- **Changes:**
  - `primary_method`: scrape -> api
  - `secondary_method`: scrapling -> scrape (HTML fallback)
  - `url`: Added `/all-subject/all-study-level/all-destination/` to bypass geo-IP routing
  - `selectors`: Replaced CSS selector guesses with `format=nextdata`, `items_path=props.pageProps.scholarshipSearchResult`
  - `field_mappings`: 12 mappings with dot-notation for nested objects (institution_name.value, level_of_study.value, value_of_award.*)
  - `pagination.max_pages`: 100 -> 526 (covers all 6304 scholarships at 12/page)
  - `max_records`: 1200 -> 6400
  - `detail_page`: True -> False (listing data is rich enough)
  - Removed `detail_selectors` entirely

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] pytest-asyncio not installed in worktree environment**
- **Found during:** Task 1 RED phase
- **Issue:** `pytest-asyncio` was listed in pyproject.toml dependencies but not installed in the current Python environment, causing all async tests to fail with "async functions are not natively supported"
- **Fix:** Installed pytest-asyncio via pip
- **Files modified:** None (runtime dependency only)

**2. [Rule 3 - Blocking] Python editable install pointed to wrong worktree**
- **Found during:** Task 2 verification
- **Issue:** The `scholarhub-pipeline` package was installed editable from `agent-afa50cd5` worktree, causing imports to load old config files
- **Fix:** Used `PYTHONPATH=src:$PYTHONPATH` for verification commands; the committed source files are correct
- **Files modified:** None

## Known Stubs

None. All field mappings reference actual IDP __NEXT_DATA__ schema fields verified by research.

## Verification

All 11 ApiScraper tests pass (7 existing + 4 new):
- test_api_scraper_extracts_records
- test_api_scraper_follows_pagination
- test_api_scraper_stops_at_cutoff
- test_api_scraper_handles_empty_response
- test_api_scraper_extract_items_flat_list
- test_api_scraper_handles_csv_format
- test_api_scraper_nextdata_format (NEW)
- test_api_scraper_nextdata_missing_script (NEW)
- test_api_scraper_page_num_pagination (NEW)
- test_api_scraper_max_records (NEW)
- test_api_scraper_csv_sets_host_country_default

IDP config validates: 12 field mappings, api method, nextdata format, 526 max_pages.

## Self-Check: PASSED

All files exist, all commits verified.
