# Quick Task: Build IDP Education Spider - Research

**Researched:** 2026-03-23
**Domain:** IDP Education (idp.com) scholarship data extraction
**Confidence:** HIGH

## Summary

IDP Education (idp.com) has a **structured scholarship database with 6,300+ scholarships** accessible through a Next.js SSR application. The key discovery is that IDP is NOT primarily a blog source -- it has a proper **scholarship finder** at `/find-a-scholarship/` that returns structured JSON data embedded in `__NEXT_DATA__` on every page. Each page returns 12 scholarships with rich structured fields (title, institution, country, deadline, funding type, eligibility, award value, degree level, etc.).

The blog posts (e.g., "Types of Scholarships for International Students 2026") are informational guides that mention scholarships by name but lack structured per-scholarship data. They are NOT the primary extraction target. The scholarship finder pages are far more valuable and machine-parseable.

**Primary recommendation:** Build an HTML scraper targeting the `/find-a-scholarship/` listing pages, extracting scholarship data from the `__NEXT_DATA__` JSON embedded in each page. Paginate through `?page=N` (up to ~526 pages at 12 per page). This yields clean, structured data without needing blog post text parsing.

## IDP Website Structure

### Scholarship Finder (PRIMARY TARGET)
- **URL:** `https://www.idp.com/find-a-scholarship/`
- **Tech:** Next.js SSR (`getServerSideProps`), data embedded in `__NEXT_DATA__` JSON
- **Results:** 6,304 scholarships, 12 per page, ~526 pages
- **Pagination:** `?page=N` query parameter (1-indexed)
- **Filtered URLs:** `/find-a-scholarship/all-subject/all-study-level/{country}/`

### Scholarship Detail Pages
- **URL Pattern:** `/scholarship/{institution-slug}/{scholarship-slug}/{scholarship_id}/`
- **Example:** `/scholarship/flinders-university/alumni-scholarship/162424/`
- **Data:** Full scholarship details in `__NEXT_DATA__` under `pageProps.apiData`

### Blog Posts (SECONDARY -- low value for structured extraction)
- **URL Pattern:** `/blog/{topic-slug}/`
- **Content:** Informational guides mentioning scholarships by name
- **Structure:** Narrative text with bullet points, no structured per-scholarship data
- **Assessment:** Not worth scraping for individual scholarship records

## Scholarship Data Schema (from __NEXT_DATA__)

### Listing Page Fields (per scholarship in `scholarshipSearchResult` array)
```python
{
    "scholarship_id": "162424",
    "scholarship_name": "Alumni Scholarship",
    "institution_name": {"value": "Flinders University", "key": "..."},
    "institution_id": "IID-AU-00404",
    "institution_country_name": "Australia",
    "application_deadline": "31 Mar 2026",  # or null
    "funding_type": "Fee waiver/discount",
    "country_of_residence": "All international",
    "eligible_intake": "Sep - 2026, Jan - 2027",  # or null
    "level_of_study": {"value": "Postgraduate", "key": "Postgraduate"},
    "value_of_award": {
        "funding_details": "20% full duration scholarship",
        "funding_value": "20% of fees",
        "aud_funding_value": "0",
        "funding_currency": null
    },
    "sub_category_details": [...],  # subject categories
    "category_details": [...],
    "url_slug": {
        "institution_name": "flinders-university",
        "institution_country_name": "australia",
        "level_of_study": "undergraduate,postgraduate",
    }
}
```

### Detail Page Fields (from `pageProps.apiData`)
```python
{
    "scholarship_id": "162424",
    "scholarship_name": "Alumni Scholarship",
    "institution_name": "Flinders University",
    "institution_id": "IID-AU-00404",
    "institution_country": "AU",
    "location": "Australia",
    "level_of_study": "Postgraduate, Undergraduate",
    "funding_type": "Fee waiver/discount",
    "deadline": null,
    "country_of_residence": ["All international"],
    "eligibility_req": "Alumni of Flinders University with previous undergraduate/postgraduate qualification",
    "gender_code": "All",
    "award_coverage": "Tuition fees",
    "value_of_award": {
        "funding_details": "20% full duration scholarship",
        "funding_value": "20% of fees",
        "aud_funding_value": "0",
        "funding_currency": null
    },
    "selection_basis": "Academic excellence",
    "selection_approach": "Selective",
    "application_details": "Automatic assessment with courses; no separate application needed",
    "application_process": "Automatic consideration",
    "scholarship_award_website": "https://www.flinders.edu.au/international/apply/scholarships/alumni",
    "institution_url": "https://www.flinders.edu.au/",
    "study_mode": "Full Time",
    "status": "LIVE",
    "no_of_awards_available": null,
    "institution_logo_url": "https://images-intl.prod.aws.idp-connect.com/commimg/..."
}
```

## Technical Approach

### Recommended: Scrape method with __NEXT_DATA__ JSON extraction

The listing pages are server-rendered HTML with all scholarship data embedded in `<script id="__NEXT_DATA__">`. The `HtmlScraper` (Fetcher) can fetch each page, then a custom extraction step parses the JSON from the script tag rather than using CSS selectors on rendered HTML.

However, the existing `HtmlScraper` uses CSS selectors to extract from HTML DOM elements. For IDP, the richest approach is:

1. **Use `scrape` method** with the `HtmlScraper`
2. **Set listing selector** to target the rendered scholarship cards on the page
3. **Use detail pages** to get full data from `__NEXT_DATA__` JSON on detail pages
4. **Field mappings** translate IDP field names to ScholarHub schema

### Alternative: Custom scraper or post-processor

Since the data is in `__NEXT_DATA__` JSON, an API-like approach could work better -- fetch the HTML, extract the JSON from the script tag, and process it like API data. But this requires either:
- A custom scraper class (more work than needed)
- OR adapting the existing HtmlScraper with CSS selectors that target the rendered card elements

### Recommended Config Strategy

Use `HtmlScraper` (`scrape` method) with CSS selectors for the rendered listing cards, plus `detail_page: True` to visit each scholarship detail page. The detail pages contain the richest data in rendered HTML elements.

The listing page renders each scholarship as a card with visible fields (name, institution, country, degree level, funding type). Detail pages add eligibility, description, award coverage, and application details.

## Field Mapping (IDP -> ScholarHub)

| IDP Field | ScholarHub Field | Source |
|-----------|-----------------|--------|
| `scholarship_name` | `title` | listing + detail |
| `institution_name` | `provider_organization` | listing + detail |
| `location` / `institution_country_name` | `host_country` | listing + detail |
| `level_of_study` | `degree_levels` | listing + detail |
| `funding_type` | `funding_type` | listing + detail |
| `value_of_award.funding_value` | `award_amount` | listing + detail |
| `value_of_award.funding_currency` | `award_currency` | detail |
| `application_deadline` / `deadline` | `application_deadline` | listing + detail |
| `eligibility_req` | `eligibility_criteria` (-> description) | detail only |
| `country_of_residence` | `eligibility_nationalities` | detail |
| `scholarship_award_website` | `application_url` | detail |
| detail page URL | `source_url` | constructed |
| `award_coverage` + `eligibility_req` | `description` | detail |

## Config Pattern

```python
"""IDP Education Scholarships source configuration."""

from dataclasses import dataclass, field

from scholarhub_pipeline.configs._bases import BaseAggregatorConfig


@dataclass
class Config(BaseAggregatorConfig):
    """IDP Education scholarship finder config.

    Next.js SSR site with 6300+ scholarships. Listing pages render
    scholarship cards; detail pages at /scholarship/{inst}/{name}/{id}/
    contain full eligibility, award, and application info.
    """

    name: str = "IDP Education Scholarships"
    url: str = "https://www.idp.com/find-a-scholarship/"
    source_id: str = "idp_education_scholarships"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    rate_limit_delay: float = 2.0
    selectors: dict[str, str] = field(default_factory=lambda: {
        # Listing page selectors targeting rendered scholarship cards
        "listing": "[data-testid='scholarship-card'], .scholarship-card, article, .search-result-item, [class*='ScholarshipCard']",
        "title": "h3 a::text, h2 a::text, [class*='scholarshipName']::text, [class*='ScholarshipName']::text",
        "provider": "[class*='institutionName']::text, [class*='InstitutionName']::text, .institution::text",
        "country": "[class*='country']::text, [class*='location']::text, .country-name::text",
        "degree": "[class*='studyLevel']::text, [class*='level']::text, .study-level::text",
        "amount": "[class*='awardValue']::text, [class*='value']::text, .award-value::text",
        "funding_type_raw": "[class*='fundingType']::text, .funding-type::text",
        "deadline_raw": "[class*='deadline']::text, .deadline::text",
        "detail_link": "h3 a::attr(href), h2 a::attr(href), a[href*='/scholarship/']::attr(href)",
        "next_page": "a[aria-label='Next']::attr(href), a[rel='next']::attr(href), .pagination-next a::attr(href)",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "provider": "provider_organization",
        "country": "host_country",
        "degree": "degree_levels",
        "amount": "award_amount",
        "funding_type_raw": "funding_type",
        "deadline_raw": "application_deadline",
        "detail_link": "source_url",
    })
    pagination: dict | None = field(default_factory=lambda: {
        "type": "page_num",
        "param": "page",
        "start": 1,
        "max_pages": 100,  # 100 pages * 12 = 1200 scholarships per run
    })
    detail_page: bool = True
    detail_selectors: dict[str, str] | None = field(default_factory=lambda: {
        "description": "[class*='eligibility']::text, [class*='requirements']::text, .entry-requirements::text, section p::text",
        "eligibility": "[class*='eligibility']::text, .eligibility-section::text",
        "amount": "[class*='awardValue']::text, [class*='value-of-award']::text",
        "application_url": "a[href*='apply']::attr(href), a[class*='apply']::attr(href), a[class*='website']::attr(href)",
    })
    max_records: int | None = 1200


CONFIG = Config()
```

## Common Pitfalls

### Pitfall 1: Next.js buildId Changes
**What goes wrong:** If using `_next/data/` API routes directly, the buildId changes on every deploy, breaking URLs.
**How to avoid:** Scrape the rendered HTML pages, not the Next.js data endpoints. The `__NEXT_DATA__` JSON is always present in the HTML regardless of buildId.

### Pitfall 2: Geo-localized Redirects
**What goes wrong:** IDP redirects to country-specific subpaths (e.g., `/bangladesh/find-a-scholarship/`). The default page may vary based on IP geolocation.
**How to avoid:** Use a neutral URL or accept the redirect. The data format is identical across country sites -- the `siteId` just changes which scholarships are pre-filtered by nationality.

### Pitfall 3: 6300+ Scholarships = Too Many Detail Pages
**What goes wrong:** Visiting detail pages for all 6300 scholarships at 2s rate limit = ~3.5 hours.
**How to avoid:** Cap at `max_records: 1200` (100 pages). The listing page already provides title, institution, country, degree, funding type, and deadline. Detail pages add eligibility and application URL -- nice to have but not required for every record. Use incremental mode to gradually fill in detail data.

### Pitfall 4: CSS Selectors for Next.js Rendered Content
**What goes wrong:** Next.js apps use dynamic CSS class names (hashed). Selectors like `.css-b62m3t-container` break across builds.
**How to avoid:** Target semantic HTML (`h3`, `a[href*='/scholarship/']`), `data-testid` attributes, or ARIA attributes rather than CSS class names. Multiple fallback selectors in the config help.

### Pitfall 5: institution_name is Nested Object on Listing
**What goes wrong:** On listing pages, `institution_name` is `{"value": "Flinders University", "key": "..."}` not a plain string.
**How to avoid:** This is only relevant if parsing `__NEXT_DATA__` JSON directly. When scraping rendered HTML, the institution name displays as plain text.

## Architecture Decision: Blog Posts vs. Scholarship Finder

| Approach | Records | Data Quality | Effort | Recommendation |
|----------|---------|-------------|--------|----------------|
| Scholarship Finder pages | 6,300+ | HIGH - structured fields | LOW - standard selectors | **USE THIS** |
| Blog post text parsing | ~50-100 | LOW - unstructured text | HIGH - NLP/regex extraction | Skip |
| Both | 6,300+ | Mixed | HIGH | Unnecessary |

Blog posts are informational articles, not scholarship databases. The scholarship finder is the authoritative, structured source. There is no need to parse blog content.

## Sources

### Primary (HIGH confidence)
- WebFetch of `https://www.idp.com/find-a-scholarship/` - confirmed Next.js SSR with __NEXT_DATA__, 6304 scholarships, 12 per page
- WebFetch of `https://www.idp.com/find-a-scholarship/?page=2` - confirmed pagination, buildId, page structure
- WebFetch of `https://www.idp.com/scholarship/flinders-university/alumni-scholarship/162424/` - confirmed complete detail page data schema
- WebFetch of `https://www.idp.com/blog/types-of-scholarships-for-international-students-2026/` - confirmed blog posts are informational, not structured scholarship data

### Secondary (MEDIUM confidence)
- WebSearch for IDP scholarship URL patterns - confirmed `/find-a-scholarship/`, `/scholarship/` detail pages
- WebFetch of country-filtered pages (Australia, UK) - confirmed same data structure across filters
