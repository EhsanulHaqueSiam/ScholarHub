# Enhance IDP Education Spider - Research

**Researched:** 2026-03-23
**Domain:** IDP Education (idp.com) scholarship data extraction - deep investigation
**Confidence:** HIGH

## Summary

IDP Education serves 6,304 scholarships through a Next.js SSR application at `/find-a-scholarship/`. The key finding is that **all scholarship data is embedded in `__NEXT_DATA__` JSON** in every page response -- both listing pages (12 results per page, 526 pages) and detail pages (35-field scholarship objects). There is no hidden REST API, no Algolia/Elasticsearch backend, no GraphQL endpoint exposed to clients, and no JSON-LD structured data. The data is served via `getServerSideProps` exclusively.

The current spider config uses CSS selectors to guess at HTML element structure, which is fragile for a Next.js app (hashed class names change per build). The correct approach is to **extract structured JSON from `__NEXT_DATA__` script tags** rather than scraping rendered HTML. The listing page `__NEXT_DATA__` contains a `scholarshipSearchResult` array with 12 items per page, and detail pages contain `apiData` with 35 rich fields including eligibility requirements (HTML), application URLs, subject taxonomies, and award values with currency.

**Primary recommendation:** Switch to an `api` method using a custom approach that fetches HTML pages but parses `__NEXT_DATA__` JSON instead of CSS selectors. The listing pages alone provide enough data for basic records; detail pages add eligibility, application URL, subject taxonomy, and award coverage. Since the ApiScraper uses httpx (not Scrapling), it can fetch the HTML and parse the JSON from `<script id="__NEXT_DATA__">` with minimal overhead.

## IDP Website Architecture

### Technology Stack
- **Framework:** Next.js (SSR via `getServerSideProps`)
- **Hosting:** AWS CloudFront + Lambda (OpenNext)
- **CMS:** Contentful (for page chrome/layout, NOT scholarship data)
- **CDN:** CloudFront with 3-day cache (`max-age=259200`)
- **Geo-routing:** IP-based siteId (e.g., "bangladesh") -- affects which country's results appear first but ALL 6,304 scholarships are accessible from any siteId

### URL Structure

| Page Type | URL Pattern | Data Source |
|-----------|------------|-------------|
| Listing (unfiltered) | `/find-a-scholarship/` | `__NEXT_DATA__.props.pageProps.scholarshipSearchResult` |
| Listing (filtered) | `/find-a-scholarship/{subject}/{study-level}/{destination}/` | Same, filtered server-side |
| Listing (paginated) | `?page=N` appended to any listing URL | Same |
| Detail page | `/scholarship/{institution-slug}/{scholarship-slug}/{scholarship-id}/` | `__NEXT_DATA__.props.pageProps.apiData` |

### Key Routing Detail
The Next.js page route is `/[siteId]/find-a-scholarship/[[...params]]`. When you hit `/find-a-scholarship/`, the server detects your IP's country, assigns a `siteId` (e.g., "bangladesh"), and redirects to `/{siteId}/find-a-scholarship/`. Using `/find-a-scholarship/all-subject/all-study-level/all-destination/` explicitly shows ALL scholarships regardless of geo.

## Complete Data Schema

### Listing Page Fields (per scholarship in `scholarshipSearchResult`)

```python
{
    "scholarship_id": "167640",                    # Unique numeric ID (string)
    "scholarship_name": "Mitchell Scholarship",    # Title
    "institution_name": {                          # NESTED OBJECT (not plain string)
        "value": "Trinity College Dublin",
        "key": "Trinity College Dublin"
    },
    "institution_id": "IID-IE-01116",             # IDP internal institution ID
    "institution_country_name": "Ireland",         # Host country (plain string)
    "application_deadline": "31 Mar 2026",         # Date string or null
    "funding_type": "Fee waiver/discount",         # Enum (see below)
    "country_of_residence": "All international",   # Eligibility nationality (string, NOT list)
    "eligible_intake": "Sep - 2026, Jan - 2027",   # Intake dates or null
    "level_of_study": {                            # NESTED OBJECT
        "value": "Postgraduate",
        "key": "Postgraduate"
    },
    "category_details": [                          # Broad subject categories
        {"key": "10", "value": "Engineering"}
    ],
    "sub_category_details": [                      # Specific subject areas
        {"key": "1002", "value": "Manufacturing Engineering"}
    ],
    "url_slug": {                                  # For constructing detail URL
        "institution_name": "trinity-college-dublin",
        "institution_country_name": "ireland",
        "level_of_study": "postgraduate",
        "category_details": [],
        "sub_category_details": []
    },
    "value_of_award": {                            # Award details
        "funding_details": "20% full duration scholarship",  # Human-readable
        "funding_value": "5000",                   # Numeric (string) or null
        "funding_currency": "GBP",                 # ISO currency or null
        "aud_funding_value": "10045"               # AUD equivalent (string) or "0"
    }
}
```

### Detail Page Fields (`apiData` -- 35 fields)

All listing fields PLUS these additional fields:

```python
{
    # --- Core identification ---
    "scholarship_id": "166789",
    "scholarship_name": "...",
    "institution_id": "IID-UK-00789",
    "institution_name": "University Of Bedfordshire",   # PLAIN STRING (not nested)
    "institution_url": "www.beds.ac.uk",
    "institution_logo_url": "https://images-intl.prod.aws.idp-connect.com/...",
    "institution_country": "GB",                        # ISO country code
    "location": "United Kingdom",                       # Full country name
    "status": "LIVE",
    "correlation_id": "...",                            # UUID

    # --- Classification ---
    "level_of_study": "Undergraduate",                  # PLAIN STRING (not nested)
    "qualification": "Undergraduate",
    "funding_type": "Fee waiver/discount",
    "award_type": "Mature students",                    # Audience type
    "study_mode": null,                                 # "Full Time" or null
    "delivery_mode": null,

    # --- Award details ---
    "value_of_award": {
        "funding_details": "...up to \u00a35000 off...",
        "funding_value": "5000",
        "funding_currency": "GBP",
        "aud_funding_value": "10045"
    },
    "award_coverage": "Tuition fees",                   # What the award covers
    "no_of_awards_available": null,                     # Number or null
    "avg_application_per_year": null,

    # --- Eligibility ---
    "eligibility_req": "<p>HTML content...</p>",        # HTML string with criteria
    "gender_code": "All",                               # "All", "Male", "Female"
    "country_of_residence": ["All international"],      # LIST (not string like listing)
    "selection_basis": null,                             # e.g., "Academic excellence"
    "selection_criteria": null,
    "selection_approach": "All eligible",               # or "Selective"

    # --- Application ---
    "application_process": "Separate application required",  # or "Automatic consideration"
    "application_details": null,                        # Extra application info
    "application_req_details": null,
    "scholarship_award_website": "https://...",         # EXTERNAL APPLICATION URL
    "deadline": null,                                   # Same as application_deadline
    "eligible_intake": null,
    "course_offer_application_deadline": null,
    "course_subject_you_are_applying_for": "Not subject specific",

    # --- Subject taxonomy ---
    "category": {                                       # Dict of ID -> name
        "1": "Building and Architecture",
        "7": "Business",
        "10": "Engineering"
    },
    "subject_area": {                                   # Dict of ID -> name (granular)
        "109": "Architecture",
        "911": "Software Engineering",
        "1301": "Economics And Econometrics"
    },
    "url_slug": {                                       # URL construction data
        "institution_name": "university-of-bedfordshire",
        "institution_country_name": "united-kingdom",
        "level_of_study": "undergraduate",
        "category_details": ["economics", "business", ...],
        "sub_category_details": ["law", "media", ...]
    }
}
```

## All Filter/Enum Values

### Funding Types (4 values)
| Value | Frequency |
|-------|-----------|
| Fee waiver/discount | ~90% of scholarships |
| Other Discount | ~5% |
| Free products/services | ~3% |
| Cash | ~2% |

### Study Levels (6 values -- URL slugs in parentheses)
| Value | URL Slug |
|-------|----------|
| Undergraduate | `undergraduate` |
| Postgraduate | `postgraduate` |
| Doctorate | `doctorate` |
| Foundation | `foundation` |
| Pre-Degree & Vocational | `pre-degree-vocational` |
| Vocational (VET) | `vocational-vet` |

### Destination Countries (7 values)
| Country | URL Slug |
|---------|----------|
| Australia | `australia` |
| United Kingdom | `united-kingdom` |
| Canada | `canada` |
| Ireland | `ireland` |
| New Zealand | `new-zealand` |
| United States | `united-states` |
| Malaysia | `malaysia` |

### Subject Categories (from sitemap -- 113+ unique subjects)
The sitemap at `scholarship-search-sitemap.xml` contains **1,084 URL combinations** across 113+ subject slugs. Major categories include:

| Category Slug | Examples of Subcategories |
|--------------|--------------------------|
| engineering | biomedical-engineering, computer-engineering, marine-engineering |
| business | business-administration, business-economics, international-business-studies |
| law-and-legal-studies | law, international-law, taxation-law |
| health-and-medicine | health-sciences, internal-medicine, dental-studies, nutrition |
| economics | economics, actuarial-science, financial-management |
| computing-and-it | information-systems, software-engineering, computer-graphics, it-security |
| building-and-architecture | architecture, planning, construction-management |
| marketing-media-and-communication | media-theory, public-relations-pr, digital-journalism |
| hospitality-and-tourism | tourism-management, hospitality-management |
| art-and-design | fashion-design, graphic-and-design-studies, visual-arts |

### Gender Codes
- `All` (vast majority)
- `Male`
- `Female`

### Application Process Types
- `Separate application required`
- `Automatic consideration`
- `No separate application`

### Selection Approach Types
- `All eligible`
- `Selective`

## API Investigation Results

### No Hidden API Found
- **Next.js data routes** (`/_next/data/{buildId}/...`) return 404 -- confirmed SSR-only (`getServerSideProps`), no `getStaticProps`
- **No REST API endpoints** exposed in `__NEXT_DATA__`, inline scripts, or window globals
- **No Algolia/Elasticsearch** configuration detected
- **No GraphQL endpoint** exposed to client (Contentful GraphQL is server-side only)
- **No JSON-LD structured data** on any page (`schema: null` in pageProps)
- The backend is an internal IDP API that the Next.js server calls -- not accessible from outside

### Conclusion: `__NEXT_DATA__` IS the API
The `<script id="__NEXT_DATA__">` tag contains the complete, structured JSON data for every page. This is functionally equivalent to an API response embedded in HTML. The approach is:
1. Fetch HTML via httpx (lightweight, no browser needed)
2. Extract JSON from `<script id="__NEXT_DATA__">` tag
3. Parse the JSON and extract scholarship records

## Recommended Architecture

### Option A: Custom `__NEXT_DATA__` extraction via ApiScraper (RECOMMENDED)

The `ApiScraper` already uses httpx and processes JSON responses. We can adapt the config to:
1. Use `primary_method: "api"`
2. Have the scraper fetch HTML pages, extract `__NEXT_DATA__` JSON, then process normally
3. Use `items_path` to navigate to the scholarship array

**Problem:** The current `ApiScraper.scrape()` calls `response.json()` directly, which won't work for HTML pages containing JSON. We need a small modification.

**Solution:** Either:
- (a) Add a `"format": "nextdata"` option to ApiScraper that extracts JSON from HTML `__NEXT_DATA__` script tag before processing
- (b) Create a thin wrapper/preprocessor that fetches HTML, extracts the JSON, and feeds it to ApiScraper logic

### Option B: Keep HtmlScraper with correct CSS selectors

The current selectors are guesses. The actual rendered HTML uses Next.js-generated CSS class names that change per build. This approach is fragile and extracts less data than the JSON approach.

### Option C: Dedicated NextDataScraper class

A new scraper class that specializes in Next.js `__NEXT_DATA__` extraction. Fetches HTML, parses JSON from the script tag, and maps fields. This is the cleanest approach but requires a new scraper class.

### Recommendation: Option A with `"format": "nextdata"` in ApiScraper

This is the least invasive change -- add ~15 lines to `ApiScraper.scrape()` to handle a `"format": "nextdata"` mode that:
1. Fetches the URL as HTML (not JSON)
2. Extracts the `__NEXT_DATA__` JSON from `<script id="__NEXT_DATA__">`
3. Uses `items_path` to navigate to the scholarship array
4. Processes items normally through existing field_mappings + pagination logic

### Detail Page Strategy

Detail pages contain 35 fields vs 14 on listing pages. The additional fields worth extracting are:
- `eligibility_req` (HTML) -- rich eligibility criteria
- `scholarship_award_website` -- external application URL
- `award_coverage` -- what the award covers
- `application_process` -- how to apply
- `selection_approach` / `selection_basis`
- `subject_area` / `category` -- detailed subject taxonomy
- `institution_url` / `institution_logo_url`
- `gender_code`

**Performance concern:** 6,304 detail pages at 2s delay = ~3.5 hours. With `max_records: 1200`, detail pages would add ~40 minutes to the run.

**Recommendation:** Use listing pages for basic records. Enable detail pages but cap at `max_records: 1200` (100 pages x 12). The listing data is already rich enough for initial ingestion; detail data fills in eligibility and application URL.

## Field Mapping (IDP -> ScholarHub)

### From Listing Pages

| IDP Field | Access Path | ScholarHub Field | Transform |
|-----------|-------------|-----------------|-----------|
| `scholarship_id` | direct | `external_id` | prefix with "idp-" |
| `scholarship_name` | direct | `title` | none |
| `institution_name` | `.value` | `provider_organization` | extract from nested object |
| `institution_country_name` | direct | `host_country` | none |
| `level_of_study` | `.value` | `degree_levels` | extract from nested object |
| `funding_type` | direct | `funding_type` | none |
| `application_deadline` | direct | `application_deadline` | parse "31 Mar 2026" format |
| `value_of_award.funding_details` | nested | `description` (partial) | none |
| `value_of_award.funding_value` | nested | `award_amount` | none |
| `value_of_award.funding_currency` | nested | `award_currency` | none |
| `country_of_residence` | direct | `eligibility_nationalities` | none |
| `eligible_intake` | direct | (store in description) | none |
| (constructed URL) | from url_slug | `source_url` | build detail URL |

### Additional From Detail Pages

| IDP Field | ScholarHub Field | Transform |
|-----------|-----------------|-----------|
| `eligibility_req` | `eligibility_criteria` / `description` | strip HTML tags |
| `scholarship_award_website` | `application_url` | none |
| `award_coverage` | append to `description` | none |
| `application_process` | append to `description` | none |
| `gender_code` | `eligibility_gender` | map "All" -> null |
| `category` | `field_of_study` | extract values from dict |
| `subject_area` | `field_of_study` (granular) | extract values from dict |

## Pagination Strategy

### Current Approach (fragile)
```
URL: /find-a-scholarship/?page=N
Method: page_num with param="page"
```
This works but may get geo-redirected and only shows results for detected country.

### Recommended Approach (robust)
```
URL: /find-a-scholarship/all-subject/all-study-level/all-destination/?page=N
Method: page_num with param="page", start=1
Total: 526 pages (6,304 / 12 per page)
```
Using the explicit `all-subject/all-study-level/all-destination/` path ensures ALL scholarships are returned regardless of geo-IP routing.

### Detail Page URL Construction
From listing data, construct:
```
https://www.idp.com/scholarship/{url_slug.institution_name}/{scholarship_name_slugified}/{scholarship_id}/
```
Note: The `scholarship_name` needs to be kebab-cased (lowercase, spaces to hyphens, special chars removed) to match the URL pattern. However, the sitemap shows detail URLs at `https://www.idp.com/scholarship/...` (without siteId prefix).

## Config Pattern

```python
"""IDP Education Scholarships source configuration.

Next.js SSR site with 6300+ scholarships. Data is embedded in
__NEXT_DATA__ JSON on every page. Listing pages at
/find-a-scholarship/all-subject/all-study-level/all-destination/?page=N
return 12 scholarships per page with structured fields.
"""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseAggregatorConfig


@dataclass
class Config(BaseAggregatorConfig):
    """IDP Education scholarship finder config.

    Uses ApiScraper with format='nextdata' to extract scholarship data
    from __NEXT_DATA__ JSON embedded in Next.js SSR pages.
    """

    name: str = "IDP Education Scholarships"
    url: str = "https://www.idp.com/find-a-scholarship/all-subject/all-study-level/all-destination/"
    source_id: str = "idp_education_scholarships"
    primary_method: str = "api"
    secondary_method: str | None = "scrape"
    rate_limit_delay: float = 2.0
    selectors: dict[str, str] = field(default_factory=lambda: {
        "format": "nextdata",
        "items_path": "props.pageProps.scholarshipSearchResult",
        "nextdata_script_id": "__NEXT_DATA__",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "scholarship_id": "external_id",
        "scholarship_name": "title",
        "institution_name.value": "provider_organization",
        "institution_country_name": "host_country",
        "level_of_study.value": "degree_levels",
        "funding_type": "funding_type",
        "application_deadline": "application_deadline",
        "value_of_award.funding_details": "description",
        "value_of_award.funding_value": "award_amount",
        "value_of_award.funding_currency": "award_currency",
        "country_of_residence": "eligibility_nationalities",
    })
    pagination: dict | None = field(default_factory=lambda: {
        "type": "page_num",
        "param": "page",
        "start": 1,
        "max_pages": 526,
    })
    detail_page: bool = False  # Listing __NEXT_DATA__ is rich enough
    max_records: int | None = 6400


CONFIG = Config()
```

## ApiScraper Enhancement Required

The ApiScraper needs a `"format": "nextdata"` mode. The change is ~15 lines:

```python
# In ApiScraper.scrape(), after fetching response:
is_nextdata = self.config.selectors.get("format") == "nextdata"

if is_nextdata:
    # Extract __NEXT_DATA__ JSON from HTML
    import re
    match = re.search(
        r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>',
        response.text,
        re.DOTALL,
    )
    if not match:
        break
    data = json.loads(match.group(1))
else:
    data = response.json()
```

The `items_path` already supports dot-notation navigation (e.g., `props.pageProps.scholarshipSearchResult`), so no changes needed for item extraction.

For pagination in nextdata mode, the scraper should use the existing `page_num` pagination type (construct `?page=N` URLs) rather than cursor-based pagination.

### Field Mapping Enhancement

The current `apply_field_mappings` in `BaseScraper` already supports dot-notation for SOURCE fields (e.g., `"institution_name.value"` maps to nested dict access). This handles the IDP schema where `institution_name` is `{"value": "...", "key": "..."}` and `level_of_study` is `{"value": "...", "key": "..."}`.

However, `value_of_award.funding_details` requires accessing nested dicts -- this already works via `_get_nested()` in `BaseScraper`.

## Common Pitfalls

### Pitfall 1: Geo-IP Redirect
**What goes wrong:** Fetching `/find-a-scholarship/` redirects to `/{siteId}/find-a-scholarship/` based on IP location. The siteId affects result ordering.
**How to avoid:** Use the explicit path `/find-a-scholarship/all-subject/all-study-level/all-destination/` which always returns ALL 6,304 scholarships regardless of detected location.

### Pitfall 2: institution_name is a Nested Object on Listing Pages
**What goes wrong:** On listing pages, `institution_name` is `{"value": "...", "key": "..."}` not a plain string. On detail pages, it's a plain string.
**How to avoid:** Use dot-notation field mapping: `"institution_name.value": "provider_organization"`.

### Pitfall 3: level_of_study Format Differs Between Listing and Detail
**What goes wrong:** On listings it's `{"value": "Postgraduate", "key": "Postgraduate"}`. On detail pages it's just `"Postgraduate"`.
**How to avoid:** Use `"level_of_study.value"` for listing pages. If adding detail page support, handle both formats.

### Pitfall 4: country_of_residence Format Differs
**What goes wrong:** On listing pages it's a plain string (`"All international"`). On detail pages it's a list (`["All international"]`).
**How to avoid:** Normalize in post-processing: if string, wrap in list.

### Pitfall 5: buildId Changes Break _next/data Routes
**What goes wrong:** Next.js `/_next/data/{buildId}/...` routes return 404 when buildId is stale.
**How to avoid:** Do NOT use `_next/data` routes. Fetch the full HTML page and extract `__NEXT_DATA__` -- this always works regardless of buildId.

### Pitfall 6: HTML in eligibility_req
**What goes wrong:** The `eligibility_req` field contains HTML (`<p>`, `<ul>`, `<li>` tags). Storing raw HTML causes display issues.
**How to avoid:** Strip HTML tags during normalization. The existing `sanitize_html()` utility in the pipeline handles this.

### Pitfall 7: Page Count is 526 but Returns Become Sparse
**What goes wrong:** Later pages (e.g., page 526) may return fewer than 12 results or empty results.
**How to avoid:** Stop pagination when `scholarshipSearchResult` is empty or has 0 items.

### Pitfall 8: Award Values are Strings, Not Numbers
**What goes wrong:** `funding_value` is `"5000"` (string) not `5000` (int). `aud_funding_value` is always a string.
**How to avoid:** The normalizer should handle string-to-number conversion for award amounts.

## Detail Page URL Construction

To build detail page URLs from listing data:
```python
def build_detail_url(scholarship: dict) -> str:
    """Construct IDP scholarship detail URL from listing data."""
    import re
    slug = scholarship.get("url_slug", {})
    inst_slug = slug.get("institution_name", "")
    name = scholarship.get("scholarship_name", "")
    name_slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    sid = scholarship.get("scholarship_id", "")
    return f"https://www.idp.com/scholarship/{inst_slug}/{name_slug}/{sid}/"
```

Note: The sitemap confirms detail URLs follow the pattern `/scholarship/{institution-slug}/{scholarship-name-slug}/{numeric-id}/` without a siteId prefix.

## Sitemap Data

- **Scholarship detail sitemap:** `https://www.idp.com/scholarship-detail-sitemap.xml` -- contains individual scholarship page URLs
- **Scholarship search sitemap:** `https://www.idp.com/scholarship-search-sitemap.xml` -- 1,084 URLs covering 113+ subject/level/country filter combinations

The search sitemap could be used as an alternative pagination strategy: instead of paginating through 526 pages of all results, iterate through the 1,084 filter combinations. However, this would result in overlapping scholarships (a scholarship can appear in multiple filter combinations) and more total requests.

## Sources

### Primary (HIGH confidence)
- Direct `curl` + JSON parsing of `https://www.idp.com/find-a-scholarship/` -- confirmed __NEXT_DATA__ schema with 35-field detail data
- Direct `curl` of pages 1, 10, 50, 100, 150, 200, 300, 400, 500 -- confirmed 6,304 total, 12 per page, consistent schema
- Direct `curl` of `https://www.idp.com/scholarship/.../166789/` -- confirmed 35-field apiData schema on detail pages
- HTTP headers analysis -- confirmed CloudFront, Next.js, OpenNext, no auth required
- `/_next/data/` routes tested -- confirmed 404 (getServerSideProps only)
- `https://www.idp.com/sitemap.xml` -- confirmed scholarship-detail-sitemap.xml and scholarship-search-sitemap.xml
- `https://www.idp.com/scholarship-search-sitemap.xml` -- confirmed 1,084 filter URL combinations, 113+ subjects

### Verified Data Points
- **Total scholarships:** 6,304
- **Results per page:** 12
- **Total pages:** 526
- **Funding types:** 4 (Fee waiver/discount, Other Discount, Free products/services, Cash)
- **Study levels:** 6 (Undergraduate, Postgraduate, Doctorate, Foundation, Pre-Degree & Vocational, Vocational (VET))
- **Countries:** 7 (Australia, UK, Canada, Ireland, New Zealand, United States, Malaysia)
- **Subjects:** 113+ unique subcategory slugs

## Metadata

**Confidence breakdown:**
- Data schema: HIGH -- verified by parsing actual JSON from multiple pages
- Filter values: HIGH -- verified from sitemap + multi-page sampling
- API investigation: HIGH -- tested all common patterns, confirmed SSR-only
- Architecture recommendation: HIGH -- based on existing ApiScraper codebase patterns

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (buildId changes frequently but schema is stable)
