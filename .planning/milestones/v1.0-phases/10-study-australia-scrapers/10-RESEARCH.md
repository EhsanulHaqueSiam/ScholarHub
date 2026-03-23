# Phase 10: Study Australia Scrapers - Research

**Researched:** 2026-03-21
**Domain:** Web scraping / Inertia.js API extraction / Study Australia (search.studyaustralia.gov.au)
**Confidence:** HIGH

## Summary

Study Australia's search portal (search.studyaustralia.gov.au) is a **Laravel + Inertia.js + Vue.js** application (ACIR -- Australian Course Information Register) that serves four data categories: scholarships (1,024), courses (10,000+), providers (2,281), and careers (1,236). The critical discovery is that **Inertia.js exposes a clean JSON API** by sending the `X-Inertia: true` header with the correct version hash. This returns structured, paginated JSON data with all fields -- far richer than what HTML scraping could extract. No authentication is required.

The existing scraper config (`gov_study_in_australia_government_portal.py`) points to a **404 URL** (`/en/study-information/scholarships` -- the site restructured to `/en/plan-your-studies/scholarships`), uses generic CSS selectors that don't match the actual page structure, and targets the static content page rather than the search portal where all data lives. The existing `off_australia_awards_scholarships.py` config targets DFAT directly and is a separate concern.

**Primary recommendation:** Replace the broken `gov_study_in_australia_government_portal` config with a set of dedicated Inertia.js API-based scrapers targeting `search.studyaustralia.gov.au`, using the `api` primary method with custom Inertia header injection. Create one config per data type (scholarships, providers, optionally courses/careers). Use `scrape` with Scrapling as fallback if the Inertia API changes.

## Standard Stack

### Core (already installed -- no new dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| httpx | >=0.28.1 | Async HTTP client for Inertia API calls | Already used by ApiScraper, supports custom headers natively |
| structlog | >=25.5.0 | Structured logging for scraper output | Already used across all scrapers |
| python-dateutil | >=2.9.0 | Parse closing_date strings from API | Already used for date normalization |
| pycountry | >=26.2.16 | Country name normalization | Already used for country_of_citizenship mapping |
| scrapling | >=0.4.2 | Fallback HTML scraping if API changes | Already installed as secondary method |

### Supporting (no new packages needed)
| Library | Purpose | When to Use |
|---------|---------|-------------|
| extruct | JSON-LD extraction from HTML fallback | Not needed -- Inertia API provides all structured data |

**No new dependencies required.** The existing stack fully covers this phase.

## Architecture Patterns

### Recommended Approach: Inertia.js API Scraper

The key insight is that Inertia.js (used by Laravel apps) returns **full JSON responses** when sent the correct headers. The protocol works as follows:

1. **First request** (normal GET) -- fetch HTML, extract the Inertia version hash from the page source
2. **Subsequent requests** -- send with `X-Inertia: true` and `X-Inertia-Version: {hash}` headers to get JSON
3. **Pagination** -- append `?page=N` query parameter
4. **Filtering** -- append query parameters like `keyword=X&level_of_study=Y`

The response structure is:
```json
{
  "component": "Scholarship/List",
  "props": {
    "scholarships": {
      "meta": { "total": 1024, "page": 1 },
      "data": [{ ...scholarship_fields... }]
    }
  }
}
```

### Recommended Project Structure (new/modified files)
```
scraping/src/scholarhub_pipeline/
  configs/
    gov_study_australia_scholarships.py     # NEW: replaces broken config
    gov_study_australia_providers.py        # NEW: education provider data
    gov_study_australia_courses.py          # NEW: course data (optional)
    gov_study_australia_careers.py          # NEW: career data (optional)
  scrapers/
    inertia_scraper.py                     # NEW: Inertia.js-aware API scraper
scraping/sources/
    government.json                        # MODIFIED: update Study Australia entries
scraping/tests/
    test_inertia_scraper.py               # NEW: tests for Inertia scraper
```

### Pattern 1: Inertia.js API Scraper (new scraper type)

**What:** A specialized API scraper that handles the Inertia.js two-step protocol (fetch version hash, then request with headers).

**When to use:** Any Laravel/Inertia.js site (identifiable by `vary: X-Inertia` response header).

**Example:**
```python
# Source: Verified against search.studyaustralia.gov.au on 2026-03-21
import re
import httpx
from scholarhub_pipeline.scrapers.base import BaseScraper

class InertiaScraper(BaseScraper):
    """Scraper for Inertia.js (Laravel+Vue/React) applications.

    Fetches the Inertia version from an initial HTML request,
    then uses X-Inertia headers to receive JSON responses.
    """

    async def scrape(self) -> list[dict]:
        records = []
        headers = {"User-Agent": get_random_ua()}

        async with httpx.AsyncClient(headers=headers, timeout=30.0) as client:
            # Step 1: Get Inertia version hash
            initial = await client.get(self.config.url)
            initial.raise_for_status()
            version = self._extract_inertia_version(initial.text)
            if not version:
                raise ValueError("Could not extract Inertia version hash")

            # Step 2: Paginate with Inertia JSON headers
            page = 1
            max_pages = (self.config.pagination or {}).get("max_pages", 200)

            while page <= max_pages:
                url = f"{self.config.url}?page={page}"
                response = await client.get(url, headers={
                    "X-Inertia": "true",
                    "X-Inertia-Version": version,
                    "X-Requested-With": "XMLHttpRequest",
                    "Accept": "text/html, application/xhtml+xml",
                })
                response.raise_for_status()
                data = response.json()

                # Extract items from Inertia props
                items_key = self.config.selectors.get("items_key", "scholarships")
                items_data = data.get("props", {}).get(items_key, {})
                items = items_data.get("data", [])
                meta = items_data.get("meta", {})

                if not items:
                    break

                for item in items:
                    mapped = self.apply_field_mappings(item)
                    record = self.process_record(mapped)
                    records.append(record)
                    self.records_found += 1

                # Check if last page
                total = meta.get("total", 0)
                if page * 10 >= total:
                    break
                page += 1
                await asyncio.sleep(self.config.rate_limit_delay)

        return records

    @staticmethod
    def _extract_inertia_version(html: str) -> str | None:
        match = re.search(r'version&quot;:&quot;([a-f0-9]+)&quot;', html)
        return match.group(1) if match else None
```

### Pattern 2: Study Australia Scholarship Config
```python
# Source: Verified API structure on 2026-03-21
from dataclasses import dataclass, field
from scholarhub_pipeline.configs._bases import BaseGovernmentConfig

@dataclass
class Config(BaseGovernmentConfig):
    name: str = "Study Australia Scholarships"
    url: str = "https://search.studyaustralia.gov.au/scholarships"
    source_id: str = "study_australia_scholarships"
    primary_method: str = "inertia"  # New method type
    secondary_method: str | None = "scrape"
    selectors: dict[str, str] = field(default_factory=lambda: {
        "items_key": "scholarships",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "name": "title",
        "description": "description",
        "eligibility": "eligibility_criteria",
        "closing_date": "application_deadline",
        "amount_annual": "award_amount",
        "amount_comment": "funding_details",
        "web_address": "application_url",
        "scholarship_country_name": "host_country",
    })
    pagination: dict | None = field(default_factory=lambda: {
        "type": "page_num",
        "max_pages": 110,
    })
    detail_page: bool = False  # List API returns all fields
    rate_limit_delay: float = 1.5
```

### Anti-Patterns to Avoid
- **Scraping the static info page** (`studyaustralia.gov.au/en/plan-your-studies/scholarships`): This page lists 8 program descriptions, not individual scholarships. The actual data is on `search.studyaustralia.gov.au`.
- **HTML scraping the search portal**: The search portal is an Inertia.js SPA. HTML scraping would require JavaScript rendering and yield incomplete data. The Inertia API returns everything as JSON.
- **Fetching all 10,000+ courses at once**: 1000+ pages at 10/page. Filter by international-student-relevant courses or implement batched daily scraping.
- **Hard-coding Inertia version**: The version hash changes with each deployment. Always extract it dynamically from the initial page load.
- **Ignoring 409 responses**: Inertia returns 409 when the version hash is stale. The scraper must re-fetch the version and retry.

## Study Australia API Endpoints (Verified)

All four endpoints work with the same Inertia.js protocol:

| Endpoint | URL | Total Records | Pages (10/page) | Relevance |
|----------|-----|--------------|-----------------|-----------|
| Scholarships | `search.studyaustralia.gov.au/scholarships` | 1,024 | 103 | PRIMARY -- core scholarship data |
| Providers | `search.studyaustralia.gov.au/providers` | 2,281 | 229 | USEFUL -- provider/university metadata |
| Courses | `search.studyaustralia.gov.au/courses` | 10,000+ | 1000+ | SECONDARY -- large volume, filter needed |
| Careers | `search.studyaustralia.gov.au/careers` | 1,236 | 124 | LOW PRIORITY -- career data, not scholarships |

### Scholarship Record Fields (from API)
```
name, description, eligibility, closing_date, amount_annual, amount_max,
amount_comment, web_address, scholarship_country_name, country_of_citizenship,
is_for_international_students, is_for_australian_students, is_tenable_overseas,
level_of_studies[].name, field_of_studies[].name, organisations[].name,
organisations[].cricos_code, organisations[].web_address, organisations[].sites[],
duration, duration_name, frequency_name, age_min, age_max, from_date, to_date,
created_at, id, slug, scholarship_id
```

### Filter Query Parameters (Scholarships)
```
keyword=engineering         # Text search
level_of_study=postgraduate # Level filter
areas_of_study=Engineering  # Field of study
page=1                      # Pagination
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Inertia version extraction | Custom HTML parser | Simple regex on `version&quot;:&quot;` | Version always in the same format in SSR HTML |
| Nested field extraction | Deep JSON traversal | Flat field_mappings with dotted paths | Scholarship data is mostly flat, nested objects (organisations, level_of_studies) need explicit extraction helpers |
| 409 retry logic | Manual retry loop | httpx retry transport or a simple version-refresh wrapper | Inertia 409 means version changed; re-fetch version and retry |
| Rate limiting | Custom timer | asyncio.sleep with config.rate_limit_delay | Already standard pattern in all existing scrapers |

## Common Pitfalls

### Pitfall 1: Inertia Version Hash Staleness
**What goes wrong:** The Inertia version hash changes every time the site deploys. Using a cached or hard-coded version returns 409 errors.
**Why it happens:** Inertia.js uses the version hash to detect client/server version mismatch and force full page reloads.
**How to avoid:** Always extract version dynamically from initial HTML. Handle 409 by re-fetching version and retrying.
**Warning signs:** Sudden 409 responses on all requests.

### Pitfall 2: Broken URL in Existing Config
**What goes wrong:** The existing `gov_study_in_australia_government_portal` config targets `studyaustralia.gov.au/en/study-information/scholarships` which returns HTTP 404.
**Why it happens:** The Study Australia site restructured its URL scheme. The scholarships info page moved to `/en/plan-your-studies/scholarships`.
**How to avoid:** Replace the config entirely -- point to `search.studyaustralia.gov.au/scholarships` instead.
**Warning signs:** Source consistently fails with 404 error, rot detector should have flagged this.

### Pitfall 3: Nested Organization Data
**What goes wrong:** Scholarship records embed provider data as nested `organisations[]` array with complex structure (logos, sites, CRICOS codes).
**Why it happens:** The ACIR database stores relationships between scholarships, providers, and campuses.
**How to avoid:** Extract organisation name and web_address with explicit mapping logic. Don't try to flatten the entire nested structure.
**Warning signs:** Missing provider names in scraped records.

### Pitfall 4: Courses Volume Overwhelming Pipeline
**What goes wrong:** Scraping all 10,000+ courses requires 1000+ pages and takes excessive time/bandwidth.
**Why it happens:** The courses endpoint includes all CRICOS-registered courses from all Australian providers.
**How to avoid:** Either filter courses (e.g., by level_of_study or areas_of_study), implement incremental scraping based on `created_at`, or accept that courses are a secondary priority and limit max_pages.
**Warning signs:** Pipeline runs exceeding 30+ minutes due to courses alone.

### Pitfall 5: SCRAPER_MAP Registration
**What goes wrong:** New `inertia` method type not recognized by `get_scraper()` factory.
**Why it happens:** The factory only maps known methods: api, jsonld, ajax, rss, scrape, scrapling.
**How to avoid:** Register `"inertia": InertiaScraper` in `SCRAPER_MAP` dict and add `"inertia"` to `scrapeMethodValidator` in Convex schema.
**Warning signs:** `ValueError: Unknown scrape method: inertia` at runtime.

### Pitfall 6: Config Protocol Test Breakage
**What goes wrong:** Removing the old config without updating `government.json` catalog will break `test_config_catalog_sync`.
**Why it happens:** The test checks that every active source in the JSON catalog has a matching Python config.
**How to avoid:** Update both the catalog JSON and the Python config simultaneously. Replace (not just add) the broken entry.
**Warning signs:** `test_config_protocol.py` failures in CI.

## Code Examples

### Extracting Inertia Version from HTML
```python
# Source: Verified against search.studyaustralia.gov.au HTML on 2026-03-21
import re

def extract_inertia_version(html: str) -> str | None:
    """Extract Inertia.js version hash from SSR HTML page.

    The version is embedded in the page as:
    version&quot;:&quot;{hex_hash}&quot;

    Args:
        html: Full HTML page content.

    Returns:
        Hex version hash string, or None if not found.
    """
    match = re.search(r'version&quot;:&quot;([a-f0-9]+)&quot;', html)
    return match.group(1) if match else None
```

### Making Inertia JSON Request
```python
# Source: Verified working protocol on 2026-03-21
async def fetch_inertia_page(
    client: httpx.AsyncClient,
    url: str,
    version: str,
    page: int = 1,
) -> dict:
    """Fetch a page of data via Inertia.js JSON protocol.

    Args:
        client: httpx async client.
        url: Base URL (e.g., "https://search.studyaustralia.gov.au/scholarships").
        version: Inertia version hash from initial HTML.
        page: Page number for pagination.

    Returns:
        Parsed JSON response dict.
    """
    response = await client.get(
        f"{url}?page={page}",
        headers={
            "X-Inertia": "true",
            "X-Inertia-Version": version,
            "X-Requested-With": "XMLHttpRequest",
            "Accept": "text/html, application/xhtml+xml",
        },
    )
    if response.status_code == 409:
        # Version mismatch -- need to re-fetch
        raise InertiaVersionMismatchError(
            response.headers.get("x-inertia-location", url)
        )
    response.raise_for_status()
    return response.json()
```

### Mapping Scholarship Record to ScholarHub Schema
```python
# Source: Verified field structure from API on 2026-03-21
def map_study_australia_scholarship(item: dict) -> dict:
    """Map a Study Australia Inertia API scholarship to raw_record schema.

    Args:
        item: Single scholarship dict from the Inertia API response.

    Returns:
        Dict mapped to ScholarHub raw_record fields.
    """
    organisations = item.get("organisations", [])
    provider = organisations[0] if organisations else {}

    level_names = [
        l["name"] for l in item.get("level_of_studies", [])
    ]
    fos_names = [
        f["name"] for f in item.get("field_of_studies", [])
    ]

    return {
        "title": item.get("name", ""),
        "description": item.get("description", ""),
        "eligibility_criteria": item.get("eligibility", ""),
        "application_deadline": item.get("closing_date"),
        "award_amount": str(item.get("amount_annual", "")) if item.get("amount_annual") else None,
        "funding_details": item.get("amount_comment", ""),
        "application_url": item.get("web_address", ""),
        "host_country": "Australia",
        "provider_organization": provider.get("name", ""),
        "degree_level": level_names,
        "field_of_study": fos_names,
        "source_url": f"https://search.studyaustralia.gov.au/scholarship/{item.get('slug', '')}/{item.get('id', '')}",
        "is_for_international_students": item.get("is_for_international_students", True),
    }
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Generic CSS selectors on static pages | Inertia.js JSON API with custom headers | Discovered 2026-03-21 | 100% field coverage, no selector rot, structured data |
| Scraping `studyaustralia.gov.au/en/study-information/scholarships` | Targeting `search.studyaustralia.gov.au/scholarships` | Site restructured (pre-2026) | Old URL returns 404, new URL has 1024 scholarships |
| Single "Study Australia" source | Four distinct endpoints (scholarships, providers, courses, careers) | 2026-03-21 research | Can scrape scholarships AND provider metadata separately |

**Deprecated/outdated:**
- `gov_study_in_australia_government_portal` config: Points to 404 URL, uses selectors that don't match any page structure. Must be replaced.
- `off_australia_awards_scholarships` config: Still valid (targets dfat.gov.au directly), should be kept as a separate source.

## Open Questions

1. **Should courses be scraped?**
   - What we know: 10,000+ courses, 1000+ API pages. Rich data (fees, locations, start dates).
   - What's unclear: Whether course data is relevant to ScholarHub's scholarship-focused mission. Would bloat the database significantly.
   - Recommendation: Defer course scraping to future phase. Focus on scholarships and providers. Courses could feed a future "find programs" feature.

2. **Should careers be scraped?**
   - What we know: 1,236 career profiles with salary, employment data, skills, and linked courses.
   - What's unclear: How career data maps to the current ScholarHub schema (no careers table exists).
   - Recommendation: Defer. Career data doesn't map to the current scholarship schema.

3. **Should `inertia` be a new scraper type or handled as a special case of `api`?**
   - What we know: The only difference from ApiScraper is the two-step version fetch + custom headers. The JSON extraction is similar.
   - What's unclear: Whether other Inertia.js sites will be scraped in the future (e.g., other government portals).
   - Recommendation: Create a dedicated `InertiaScraper` class. It's cleaner than overloading ApiScraper and follows the existing pattern of one class per method. Register as `"inertia"` in SCRAPER_MAP.

4. **Provider scraping -- separate config or combined with scholarships?**
   - What we know: Providers endpoint (2,281 entries) gives university names, CRICOS codes, campus locations, logos, descriptions. This enriches scholarship records.
   - What's unclear: Whether provider data should be stored separately or only used to enrich scholarships.
   - Recommendation: Create a separate provider config. Store provider data for enrichment during aggregation (Phase 4). This gives us a comprehensive Australia provider database.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pytest 9.0.2+ with pytest-asyncio |
| Config file | `scraping/pyproject.toml` [tool.pytest.ini_options] |
| Quick run command | `cd scraping && uv run pytest tests/test_inertia_scraper.py -x` |
| Full suite command | `cd scraping && uv run pytest` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SA-01 | Remove broken Study Australia scraper config | unit | `cd scraping && uv run pytest tests/test_configs/test_config_protocol.py -x` | Yes (existing) |
| SA-02 | InertiaScraper extracts version and fetches JSON | unit | `cd scraping && uv run pytest tests/test_inertia_scraper.py::test_version_extraction -x` | No -- Wave 0 |
| SA-03 | InertiaScraper paginates through all pages | unit | `cd scraping && uv run pytest tests/test_inertia_scraper.py::test_pagination -x` | No -- Wave 0 |
| SA-04 | InertiaScraper handles 409 version mismatch | unit | `cd scraping && uv run pytest tests/test_inertia_scraper.py::test_version_mismatch_retry -x` | No -- Wave 0 |
| SA-05 | Scholarship field mapping produces valid records | unit | `cd scraping && uv run pytest tests/test_inertia_scraper.py::test_scholarship_field_mapping -x` | No -- Wave 0 |
| SA-06 | New configs pass protocol validation | unit | `cd scraping && uv run pytest tests/test_configs/test_config_protocol.py -x` | Yes (existing) |
| SA-07 | Catalog JSON and Python configs stay in sync | unit | `cd scraping && uv run pytest tests/test_configs/test_config_protocol.py::TestConfigProtocol::test_config_catalog_sync -x` | Yes (existing) |

### Sampling Rate
- **Per task commit:** `cd scraping && uv run pytest tests/test_inertia_scraper.py tests/test_configs/test_config_protocol.py -x`
- **Per wave merge:** `cd scraping && uv run pytest`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `scraping/tests/test_inertia_scraper.py` -- covers SA-02 through SA-05
- [ ] `scraping/tests/fixtures/inertia_scholarship_response.json` -- mock Inertia API response

## Sources

### Primary (HIGH confidence)
- **Direct API verification** -- All Inertia.js API endpoints tested with curl against live `search.studyaustralia.gov.au` on 2026-03-21
- **HTTP header analysis** -- `vary: X-Inertia` confirmed Inertia.js framework; response headers analyzed
- **JSON response structure** -- Full scholarship, course, provider, career data structures extracted and analyzed
- **Existing codebase** -- All scraper classes, configs, protocols, and tests read from repo

### Secondary (MEDIUM confidence)
- [Study Australia Scholarships Info](https://www.studyaustralia.gov.au/en/plan-your-studies/scholarships) -- Current scholarships page URL (200 OK)
- [Study Australia Search Portal](https://search.studyaustralia.gov.au/scholarships) -- Main search interface

### Tertiary (LOW confidence)
- WebSearch results about ACIR (Australian Course Information Register) -- managed by Year13/Good Education Group. Not verified with official documentation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all tools already in use
- Architecture: HIGH -- Inertia.js API protocol verified with live requests, full JSON structures captured
- Pitfalls: HIGH -- broken URL confirmed with HTTP 404 status code, version mismatch tested and documented
- API stability: MEDIUM -- Inertia version hash mechanism is well-understood but the API is undocumented (could change without notice)

**Research date:** 2026-03-21
**Valid until:** 2026-04-21 (30 days -- API structure stable but version hash changes with deploys)
