---
phase: quick-260323-oaz
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - scraping/src/scholarhub_pipeline/scrapers/api_scraper.py
  - scraping/src/scholarhub_pipeline/configs/agg_idp_education_scholarships.py
  - scraping/tests/test_api_scraper.py
autonomous: true
requirements: [quick-260323-oaz]
must_haves:
  truths:
    - "ApiScraper handles format=nextdata by extracting JSON from __NEXT_DATA__ script tags in HTML responses"
    - "ApiScraper handles page_num pagination by constructing ?param=N URLs from base URL"
    - "ApiScraper respects max_records limit and stops fetching when reached"
    - "IDP config uses api method with nextdata format and extracts all 14 listing fields via dot-notation field mappings"
  artifacts:
    - path: "scraping/src/scholarhub_pipeline/scrapers/api_scraper.py"
      provides: "nextdata format support, page_num pagination, max_records limit"
    - path: "scraping/src/scholarhub_pipeline/configs/agg_idp_education_scholarships.py"
      provides: "IDP config with api method, nextdata format, complete field mappings"
    - path: "scraping/tests/test_api_scraper.py"
      provides: "Tests for nextdata extraction, page_num pagination, max_records"
  key_links:
    - from: "scraping/src/scholarhub_pipeline/configs/agg_idp_education_scholarships.py"
      to: "scraping/src/scholarhub_pipeline/scrapers/api_scraper.py"
      via: "selectors.format=nextdata triggers HTML fetch + JSON extraction"
      pattern: 'format.*nextdata'
---

<objective>
Enhance the ApiScraper with `nextdata` format support and `page_num` pagination, then rewrite the IDP Education config to use structured JSON extraction from `__NEXT_DATA__` instead of fragile CSS selectors.

Purpose: The current IDP config uses CSS selectors that guess at Next.js-generated class names (which change per build). The `__NEXT_DATA__` JSON embedded in every page contains complete structured scholarship data (14 fields on listing pages). Switching to JSON extraction is both more reliable and extracts significantly more data.

Output: Enhanced ApiScraper with three new capabilities (nextdata format, page_num pagination, max_records), updated IDP config, and tests.
</objective>

<context>
@.planning/quick/260323-oaz-enhance-idp-education-spider-maximize-da/260323-oaz-RESEARCH.md
@scraping/src/scholarhub_pipeline/scrapers/api_scraper.py
@scraping/src/scholarhub_pipeline/scrapers/base.py
@scraping/src/scholarhub_pipeline/configs/agg_idp_education_scholarships.py
@scraping/tests/test_api_scraper.py
@scraping/tests/conftest.py

<interfaces>
<!-- ApiScraper currently supports two formats: json (default) and csv -->
<!-- BaseScraper._get_nested() already handles dot-notation field access -->
<!-- BaseScraper.apply_field_mappings() supports dot-notation source keys like "institution_name.value" -->
<!-- html_scraper.py page_num pagination pattern (lines 263-269):
     param = self.config.pagination.get("param", "page")
     start = self.config.pagination.get("start", 1)
     base = self.config.url.split("?")[0]
     sep = "&" if "?" in self.config.url else "?"
     url = f"{self.config.url}{sep}{param}={start + page}"
-->
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add nextdata format, page_num pagination, and max_records to ApiScraper</name>
  <files>scraping/src/scholarhub_pipeline/scrapers/api_scraper.py, scraping/tests/test_api_scraper.py</files>
  <behavior>
    - Test: nextdata format extracts JSON from HTML containing `<script id="__NEXT_DATA__">` tag, navigates items_path through the parsed JSON, and returns mapped records
    - Test: nextdata format with empty/missing __NEXT_DATA__ script tag returns empty list (does not crash)
    - Test: page_num pagination constructs URLs like `{base_url}?page={start+N}` and fetches multiple pages
    - Test: max_records stops collection after reaching the configured limit mid-page
  </behavior>
  <action>
    First, add tests to `scraping/tests/test_api_scraper.py`:

    1. `test_api_scraper_nextdata_format` -- Create a config with `selectors={"format": "nextdata", "items_path": "props.pageProps.results"}`. Mock response returns HTML string containing `<script id="__NEXT_DATA__">{json}</script>`. Verify records are extracted and field-mapped correctly. Use the existing `FakeResponse` class but note that for nextdata, `response.text` is what matters (the HTML string), not `response.json()`. Create a new `HtmlFakeResponse` class similar to `CsvFakeResponse` that returns HTML text.

    2. `test_api_scraper_nextdata_missing_script` -- Config with nextdata format, mock response has HTML without `__NEXT_DATA__` tag. Verify empty list returned.

    3. `test_api_scraper_page_num_pagination` -- Config with `pagination={"type": "page_num", "param": "page", "start": 1, "max_pages": 3}` and a regular JSON format. Mock `client.get` to track URLs called. Verify page 1 fetches base URL, page 2 fetches `{url}?page=2`, page 3 fetches `{url}?page=3`. Use non-nextdata format so this tests the pagination logic independently.

    4. `test_api_scraper_max_records` -- Config with `max_records=2`. Mock response returns 5 items. Verify only 2 records returned.

    Then modify `scraping/src/scholarhub_pipeline/scrapers/api_scraper.py`:

    **Add `import json as json_mod` and `import re` at module top** (not inside loops).

    **In `scrape()` method, add nextdata format handling** alongside existing csv/json:
    ```python
    is_csv = self.config.selectors.get("format") == "csv"
    is_nextdata = self.config.selectors.get("format") == "nextdata"
    ```

    After `response.raise_for_status()` and bytes tracking, replace the if/else block:
    ```python
    if is_csv:
        reader = csv.DictReader(io.StringIO(response.text))
        items = list(reader)
    elif is_nextdata:
        match = re.search(
            r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>',
            response.text,
            re.DOTALL,
        )
        if not match:
            logger.warning("no_nextdata_script", url=url)
            break
        data = json_mod.loads(match.group(1))
        items = self._extract_items(data)
    else:
        data = response.json()
        items = self._extract_items(data)
    ```

    **Add page_num pagination support** in the pagination section (after the CSV break check). Currently only `cursor_path` is handled via `_get_next_url`. Add page_num as an alternative:
    ```python
    # Pagination
    pag_type = self.config.pagination.get("type") if self.config.pagination else None

    if pag_type == "page_num":
        page += 1
        param = self.config.pagination.get("param", "page")
        start = self.config.pagination.get("start", 1)
        base = self.config.url.split("?")[0]
        sep = "&" if "?" in self.config.url else "?"
        url = f"{self.config.url}{sep}{param}={start + page}"
    else:
        url = self._get_next_url(data)
        page += 1
    ```
    Move the existing `page += 1` into both branches. Keep max_pages check after.

    **Add max_records check** inside the item processing loop, after `records.append(record)`:
    ```python
    if self.config.max_records and self.records_found >= self.config.max_records:
        return records
    ```

    Important: `data` variable is only defined in the non-csv, non-nextdata path for `_get_next_url`. For nextdata, the pagination is always page_num (no cursor), so `data` is also defined there. For csv, we already break. But to be safe, initialize `data = {}` before the format branch so `_get_next_url` doesn't fail with NameError if used with page_num pagination on a json format config that has no cursor_path.
  </action>
  <verify>
    <automated>cd /home/siam/Personal/ScholarHub/scraping && python -m pytest tests/test_api_scraper.py -x -v 2>&1 | tail -30</automated>
  </verify>
  <done>All existing tests still pass. New tests for nextdata format (happy path + missing script), page_num pagination (URL construction verified), and max_records (early termination) all pass.</done>
</task>

<task type="auto">
  <name>Task 2: Rewrite IDP Education config for nextdata extraction with complete field mappings</name>
  <files>scraping/src/scholarhub_pipeline/configs/agg_idp_education_scholarships.py</files>
  <action>
    Replace the entire IDP Education config file. The new config switches from HTML scraping (fragile CSS selectors) to API method with nextdata format (structured JSON extraction from `__NEXT_DATA__`).

    Key changes from current config:
    - `primary_method`: "scrape" -> "api"
    - `secondary_method`: "scrapling" -> "scrape" (HTML fallback still viable)
    - `url`: Add `/all-subject/all-study-level/all-destination/` path to ensure ALL 6,304 scholarships are returned regardless of geo-IP routing
    - `selectors`: Replace CSS selector guesses with nextdata format config:
      - `"format": "nextdata"`
      - `"items_path": "props.pageProps.scholarshipSearchResult"`
      - `"nextdata_script_id": "__NEXT_DATA__"` (informational, the regex uses the standard id)
    - `field_mappings`: Replace simple CSS-field mappings with dot-notation mappings for all 14 listing fields:
      - `"scholarship_id": "external_id"` -- direct field, unique numeric ID (string)
      - `"scholarship_name": "title"` -- direct field
      - `"institution_name.value": "provider_organization"` -- nested object, extract .value
      - `"institution_country_name": "host_country"` -- direct string
      - `"level_of_study.value": "degree_levels"` -- nested object, extract .value
      - `"funding_type": "funding_type"` -- direct string
      - `"application_deadline": "application_deadline"` -- direct string (format: "31 Mar 2026")
      - `"value_of_award.funding_details": "description"` -- nested, human-readable award description
      - `"value_of_award.funding_value": "award_amount"` -- nested, numeric string
      - `"value_of_award.funding_currency": "award_currency"` -- nested, ISO currency code
      - `"country_of_residence": "eligibility_nationalities"` -- direct string (e.g., "All international")
      - `"eligible_intake": "eligible_intake"` -- direct string (e.g., "Sep - 2026, Jan - 2027")
    - `pagination`: Keep page_num type but increase max_pages from 100 to 526 (actual page count for 6,304 scholarships at 12/page)
    - `detail_page`: Set to False -- listing `__NEXT_DATA__` provides 14 rich fields, enough for initial ingestion
    - Remove `detail_selectors` entirely (not needed without detail_page)
    - `max_records`: Increase from 1200 to 6400 (capture all ~6,304 scholarships)

    Update the module docstring to explain the Next.js SSR / `__NEXT_DATA__` extraction approach.
  </action>
  <verify>
    <automated>cd /home/siam/Personal/ScholarHub/scraping && python -c "from scholarhub_pipeline.configs.agg_idp_education_scholarships import CONFIG; assert CONFIG.primary_method == 'api'; assert CONFIG.selectors['format'] == 'nextdata'; assert 'scholarship_id' in CONFIG.field_mappings; assert CONFIG.pagination['max_pages'] == 526; assert len(CONFIG.field_mappings) >= 12; print(f'OK: {CONFIG.name}, {len(CONFIG.field_mappings)} field mappings, method={CONFIG.primary_method}')"</automated>
  </verify>
  <done>IDP config uses api method with nextdata format, URL includes all-subject/all-study-level/all-destination path, 12+ field mappings with dot-notation for nested objects, pagination covers all 526 pages, no detail_page scraping needed.</done>
</task>

</tasks>

<verification>
1. All existing ApiScraper tests pass (no regressions to csv or cursor pagination)
2. New nextdata/page_num/max_records tests pass
3. IDP config imports cleanly with correct settings
4. Quick smoke test: `cd scraping && python -m pytest tests/test_api_scraper.py -x -v`
</verification>

<success_criteria>
- ApiScraper supports three formats: json (default), csv, nextdata
- ApiScraper supports two pagination types: cursor (existing), page_num (new)
- ApiScraper respects max_records config to stop early
- IDP Education config extracts all 14 listing fields from __NEXT_DATA__ JSON
- IDP config uses robust all-subject/all-study-level/all-destination URL
- All tests green
</success_criteria>

<output>
After completion, create `.planning/quick/260323-oaz-enhance-idp-education-spider-maximize-da/260323-oaz-SUMMARY.md`
</output>
