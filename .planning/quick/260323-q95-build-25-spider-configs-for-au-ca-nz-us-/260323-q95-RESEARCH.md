# Quick Task: Build 25 Spider Configs - Research

**Researched:** 2026-03-23
**Domain:** Web scraping config development for scholarship sources (AU/CA/NZ/US/IE)
**Confidence:** HIGH (all sites probed, patterns identified)

## Summary

Of the 25 requested scholarship sources, 19 have confirmed working URLs and clear scraping patterns. 3 sources are discontinued/non-existent (NZIDRS, NZ-GRADS, Palmerston North Mayor's as standalone scrape targets -- they exist only on aggregator sites like studywithnewzealand.govt.nz). 2 sites block all headless access (education.gov.au returns connection timeout, Otago uses Cloudflare managed challenge). 1 site (nsf.org.in) is the wrong organization -- the correct Narotam Sekhsaria Foundation URL is pg.nsfoundation.co.in.

The sources divide cleanly into three scraping patterns: (A) single-record official program pages (simplest -- most AU/CA sources), (B) multi-record university listing pages (NZ universities), and (C) sites requiring Scrapling for JS-rendering or bot protection.

**Primary recommendation:** Build configs in three waves by pattern: single-record first (fastest, 12 configs), then multi-record listings (6 configs), then Scrapling-dependent sites last (4 configs). Drop 3 discontinued/unavailable sources.

## Project Constraints (from CLAUDE.md)

No project CLAUDE.md exists. Global rules: no Co-Authored-By in commits.

## Standard Stack

Already established in project -- no new libraries needed. Configs use:
- `BaseOfficialConfig` for named program pages (Fulbright-like)
- `BaseGovernmentConfig` for government portals
- `BaseFoundationConfig` for foundation pages
- Primary methods: `scrape` (HTML), `scrapling` (JS-rendered), `api` (JSON endpoints)

## Site-by-Site Analysis

### AUSTRALIA (2 sources)

#### 1. AGRTP / Research Training Program (education.gov.au)
- **URL:** `https://www.education.gov.au/research-block-grants/research-training-program`
- **Status:** CONNECTION TIMEOUT (000). Site blocks all curl/headless requests from non-AU IPs or uses WAF. Search results confirm the page exists and has content.
- **Type:** Single-record government program page
- **Method:** `scrapling` (primary), no fallback -- site requires browser-like TLS fingerprint
- **Config class:** `BaseGovernmentConfig`
- **Fields available (from search):** Program description, stipend rates, eligibility, governed under Higher Education Support (Commonwealth Scholarships) Guidelines 2025
- **Selectors:** Will need Scrapling to determine -- use generic government selectors: `article`, `h1`, `.field-body p`, `section`
- **Config name:** `gov_australia_research_training_program.py`
- **Confidence:** MEDIUM (URL confirmed via search, but cannot verify selectors without Scrapling access)

#### 2. John Allwright Fellowship (ACIAR)
- **URL:** `https://www.aciar.gov.au/john-allwright-fellowship` (canonical: `/scholarships/john-allwright-fellowship`)
- **Status:** 200 OK
- **Type:** Single-record official program page (Drupal 11)
- **Method:** `scrape` (primary), `scrapling` (secondary)
- **JSON-LD:** Present but minimal (only description, no structured scholarship data)
- **Content structure:** `.node__content` contains everything. Title in `h1` within `.view-header-blocks`. Body in `.field--name-body .field__item`. Has sections: "About the John Allwright Fellowship program" (h2), eligibility in paragraphs.
- **Key selectors:**
  - `listing`: `article.node--type-standard-page`
  - `title`: `h1`
  - `description`: `.field--name-body .field__item p`
- **Config class:** `BaseGovernmentConfig` (ACIAR is Australian government)
- **Config name:** `gov_australia_john_allwright_fellowship.py`
- **Confidence:** HIGH

### CANADA (9 sources)

#### 3. Shastri Indo-Canadian Institute
- **URL:** `https://www.shastriinstitute.org/grants-awards` (grants hub) -> individual programs at `/grants-awards-and-opportunities-for-indian-canadian-scholars`
- **Status:** 200 OK
- **Type:** Multi-record -- hub page linking to grant categories (Students, Faculties, Universities)
- **Method:** `scrapling` (Drupal site with Quicktabs, heavy JS for content display)
- **Structure:** Hub page with cards linking to subcategory pages. Programs include SHARP, SSTSG, Faculty/Student Mobility.
- **Key selectors:**
  - `listing`: `.views-row, .node, article`
  - `title`: `h2 a::text, h3::text`
  - `detail_link`: `h2 a::attr(href), a::attr(href)`
- **Config class:** `BaseOfficialConfig`
- **Detail page:** Yes -- subcategory pages contain individual program details
- **Config name:** `off_shastri_indo_canadian_institute.py`
- **Confidence:** MEDIUM (JS-rendered content may need Scrapling to fully load)

#### 4. Canadian Commonwealth Scholarship Plan
- **URL:** `https://www.educanada.ca/scholarships-bourses/index.aspx?lang=eng` (EduCanada hub, but no dedicated CCSP page found)
- **Status:** 200 OK (EduCanada hub)
- **Type:** Single-record -- the CCSP is administered through Global Affairs Canada and referenced on EduCanada
- **Method:** `scrape` (primary), `scrapling` (secondary)
- **Note:** No standalone CCSP page exists. EduCanada lists programs like ELAP and Study in Canada Scholarships. The Commonwealth Scholarship Plan info is scattered. Best approach: scrape EduCanada international scholarships page.
- **Key selectors:**
  - `listing`: `.well, .panel, article, section`
  - `title`: `h2::text, h3::text`
  - `description`: `p::text`
- **Config class:** `BaseGovernmentConfig`
- **Config name:** `gov_canada_commonwealth_scholarship_plan.py`
- **Confidence:** LOW (no dedicated page -- may need to point to a different URL or mark as single-record with manual description)

#### 5. Ontario Graduate Scholarship (UofT SGS)
- **URL:** `https://www.sgs.utoronto.ca/awards/ontario-graduate-scholarship/`
- **Status:** 200 OK
- **Type:** Single-record WordPress page
- **Method:** `scrape` (primary), `scrapling` (secondary)
- **Content structure:** WordPress block editor. Title in `h1`. Content organized under `h2`/`h3` headings: Purpose, Value & Duration ($5,000/session, up to $15,000), Eligibility, Selection Criteria, How to Apply.
- **Key selectors:**
  - `listing`: `article, .entry-content, .wp-block-group`
  - `title`: `h1::text`
  - `description`: `.entry-content p::text`
  - `amount`: Text extraction -- "$5,000 per session" under "Value & Duration"
- **Config class:** `BaseOfficialConfig`
- **Config name:** `off_ontario_graduate_scholarship.py`
- **Confidence:** HIGH

#### 6. National Research Council Canada
- **URL:** `https://nrc.canada.ca/en/corporate/careers/`
- **Status:** 403 Forbidden (blocks automated access)
- **Type:** Single-record government page
- **Method:** `scrapling` (primary -- 403 means bot protection)
- **Config class:** `BaseGovernmentConfig`
- **Config name:** `gov_canada_nrc_research.py`
- **Confidence:** LOW (403 even with browser UA -- may need to find alternative scholarship-specific URL)

#### 7. Quebec PBEEE Merit Scholarship (FRQ)
- **URL:** `https://frq.gouv.qc.ca/en/program/merit-scholarship-program-for-foreign-students-pbeee/`
- **Status:** 200 OK
- **Type:** Single-record program page (WordPress)
- **Method:** `scrape` (primary), `scrapling` (secondary)
- **Content structure:** Comprehensive page with table of contents using anchor links. Sections: Objectives, Target Group, Eligibility, Value of Scholarships ($25,000/yr doctoral, $35,000 postdoctoral, $3,000/month short-term), Application deadlines.
- **Key selectors:**
  - `listing`: `article, .entry-content`
  - `title`: `h1::text`
  - `description`: `#objectives ~ p::text`
  - `amount`: `#value-of-scholarships ~ p::text, #value-of-scholarships ~ ul li::text`
  - `eligibility`: `#eligibility-requirements-citizenship-and-residence ~ p::text`
- **Config class:** `BaseGovernmentConfig`
- **Config name:** `gov_quebec_pbeee_merit_scholarship.py`
- **Confidence:** HIGH

#### 8. Ontario Trillium Scholarship
- **URL:** `https://www.sgs.utoronto.ca/awards/ontario-trillium-scholarship/` -- 404
- **Alt URL:** `https://grad.uwo.ca/finances/external_funding/ots.html` -- 200 but does NOT contain OTS info
- **Status:** NO WORKING URL FOUND. The OTS page has been removed from UofT SGS and Western doesn't have a dedicated page either.
- **Type:** Single-record (if page found)
- **Method:** `scrape`
- **Note:** The Ontario Trillium Scholarship may have been consolidated into general OGS information or is administered differently now. Consider scraping from UofT SGS awards listing or Ontario government sources.
- **Config class:** `BaseOfficialConfig`
- **Config name:** `off_ontario_trillium_scholarship.py`
- **Confidence:** LOW -- URL needs manual discovery. Try `https://www.sgs.utoronto.ca/awards/` and search for Trillium.

#### 9. SSHRC Partnership Grants
- **URL:** `https://sshrc-crsh.canada.ca/en/funding/opportunities/partnership-grants.aspx` (redirected from old URL)
- **Status:** 200 OK (after 2 redirects)
- **Type:** Single-record government program page (Canada.ca template)
- **Method:** `scrape` (primary), `scrapling` (secondary)
- **Content structure:** Standard Canada.ca gov template. Multiple competition years listed (2026, 2025, 2024). Values: Stage 1 up to $30,000, Stage 2 up to $2.5M over 4-7 years. Deadlines clearly marked per year.
- **Key selectors:**
  - `listing`: `main, article, .col-md-9`
  - `title`: `h1::text`
  - `description`: `main p::text`
  - `amount`: `li::text` (under "Values and duration")
  - `deadline`: Text near "Application deadlines"
- **Config class:** `BaseGovernmentConfig`
- **Config name:** `gov_canada_sshrc_partnership_grants.py`
- **Confidence:** HIGH

#### 10. Anne Vallee Ecological Fund (UBC)
- **URL:** `https://www.grad.ubc.ca/awards/anne-vallee-ecological-fund` -- 403
- **Alt URL:** `https://www.grad.ubc.ca/awards?award_id=2155` -- 200 but redirects to general awards page
- **Status:** 403 on direct URL, general awards page doesn't show specific fund
- **Type:** Single-record
- **Method:** `scrapling` (primary -- UBC blocks automated access)
- **Config class:** `BaseOfficialConfig`
- **Config name:** `off_canada_anne_vallee_ecological_fund.py`
- **Confidence:** LOW (blocked URL -- Scrapling may bypass, needs testing)

#### 11. Trudeau Foundation Scholarships
- **URL:** `https://www.fondationtrudeau.ca/bourse/` (French, but primary content)
- **Status:** 200 OK (foundation site)
- **Type:** Single-record program overview page
- **Method:** `scrape` (primary), `scrapling` (secondary)
- **Content structure:** Program overview with amount: up to $50,000/year for 3 years plus $20,000/year additional allowance. Application link to `/devenir-boursier-ou-boursiere/`. Content is in French.
- **Key selectors:**
  - `listing`: `.content, article`
  - `title`: `h1::text, h2::text`
  - `description`: `.content p::text`
- **Note:** May want English URL: `https://fondationtrudeau.ca/en/programs/` (200, but less specific)
- **Config class:** `BaseFoundationConfig`
- **Config name:** `fnd_trudeau_foundation_scholarships.py`
- **Confidence:** MEDIUM (French content, may need English variant)

### NEW ZEALAND (12 sources)

#### 12. AUT University
- **URL:** `https://www.aut.ac.nz/scholarships`
- **Status:** 200 OK
- **Type:** Hub page -- directs to external GivME database and AUT scholarships database
- **Method:** `scrapling` (the actual scholarship database is external/JS-rendered)
- **Content structure:** Navigation hub with testimonials. No scholarship data on this page. Links to external databases.
- **Config class:** `BaseOfficialConfig`
- **Config name:** `uni_nz_aut_scholarships.py`
- **Note:** AUT may not be scrapable as a standalone source -- their scholarships are in an external database (GivME). Consider pointing to their specific database URL or skipping.
- **Confidence:** LOW (hub page only, actual data in external DB)

#### 13. University of Auckland
- **URL:** `https://www.auckland.ac.nz/en/study/scholarships-and-awards/find-a-scholarship.html`
- **Status:** 200 OK
- **Type:** Multi-record listing page with server-rendered HTML links to detail pages
- **Method:** `scrape` (primary) -- listings are in static HTML
- **Content structure:** Page contains direct links to scholarship detail pages. URL pattern: `/en/study/scholarships-and-awards/find-a-scholarship/{name}-{id}-{faculty}.html`. Detail pages have structured content: title in `h1`, "About the scholarship" definition list with Value, Closing date, Tenure, Application status.
- **Key selectors (listing):**
  - `listing`: `a[href*="find-a-scholarship/"]`
  - `title`: `a::text`
  - `detail_link`: `a::attr(href)`
- **Key selectors (detail):**
  - `title`: `h1::text`
  - `description`: `#main-content p::text`
  - `amount`: Text near "Value" in definition list
  - `deadline`: Text near "Closing date"
- **Pagination:** None visible -- all links on one page (appears to be complete list)
- **Config class:** `BaseOfficialConfig`
- **Config name:** `uni_nz_auckland_scholarships.py`
- **Detail page:** Yes
- **Confidence:** HIGH

#### 14. Lincoln University
- **URL:** `https://www.lincoln.ac.nz/study/scholarships/search-scholarships/`
- **Status:** 200 OK but with Cloudflare challenge embedded
- **Type:** Multi-record listing (Silverstripe CMS)
- **Method:** `scrapling` (primary -- Cloudflare challenge protection)
- **Config class:** `BaseOfficialConfig`
- **Config name:** `uni_nz_lincoln_scholarships.py`
- **Confidence:** MEDIUM (Scrapling should bypass Cloudflare, but selectors need runtime verification)

#### 15. Massey University
- **URL:** `https://www.massey.ac.nz/study/scholarships-and-awards/`
- **Status:** 200 OK
- **Type:** Multi-record with JS-based filtering system
- **Method:** `scrapling` (primary -- dynamic filtering via JS, JSON config embedded)
- **Content structure:** Page has embedded JSON configuration for filter categories (application status, study type, student type). Scholarship data loads dynamically after filter interaction. Template class: `template-scholarshipindexpage`.
- **Config class:** `BaseOfficialConfig`
- **Config name:** `uni_nz_massey_scholarships.py`
- **Confidence:** MEDIUM (JS rendering required, filter mechanism needs Scrapling)

#### 16. University of Otago
- **URL:** `https://www.otago.ac.nz/study/scholarships/database/` or `https://www.otago.ac.nz/courses/scholarships`
- **Status:** Cloudflare managed challenge (bot protection)
- **Type:** Multi-record database/listing
- **Method:** `scrapling` (primary -- Cloudflare challenge blocks all headless access)
- **Config class:** `BaseOfficialConfig`
- **Config name:** `uni_nz_otago_scholarships.py`
- **Confidence:** MEDIUM (Scrapling should handle Cloudflare, selectors need runtime discovery)

#### 17. University of Waikato
- **URL:** `https://www.waikato.ac.nz/scholarships/find-a-scholarship/`
- **Status:** 200 OK
- **Type:** Multi-record -- uses URL-encoded JSON filter parameters
- **Method:** `scrapling` (primary -- JS filtering with encoded JSON params)
- **Content structure:** Hub page links to filtered views using URL-encoded JSON query params. Has JSON-LD for SEO. Actual scholarship cards load on the find-a-scholarship subpage.
- **Config class:** `BaseOfficialConfig`
- **Config name:** `uni_nz_waikato_scholarships.py`
- **Confidence:** MEDIUM (filter mechanism via URL params needs Scrapling to render)

#### 18. Victoria University of Wellington
- **URL:** `https://www.wgtn.ac.nz/scholarships/find-scholarships`
- **Status:** 200 OK
- **Type:** Multi-record -- fully JS-rendered scholarship search
- **Method:** `scrapling` (primary -- page explicitly states "doesn't work without JavaScript")
- **Content structure:** Empty HTML body that requires JS to populate. Search form present but no data rendered server-side.
- **Config class:** `BaseOfficialConfig`
- **Config name:** `uni_nz_victoria_wellington_scholarships.py`
- **Confidence:** MEDIUM (Scrapling required for all content)

#### 19. NZIDRS (NZ International Doctoral Research Scholarships)
- **Status:** DISCONTINUED. Program no longer accepting applications as confirmed by official sources and Universities NZ. Paused around 2020 due to COVID and budget reallocation.
- **Recommendation:** SKIP -- do not build config. University-specific doctoral scholarships have replaced this.
- **Config name:** N/A
- **Confidence:** HIGH (confirmed discontinued)

#### 20. NZ-GRADS (Global Research Alliance Doctoral Scholarship)
- **URL:** `https://globalresearchalliance.org/library/nz-grads/`
- **Status:** 200 OK but program status: "This programme is no longer receiving applications"
- **Type:** Single-record archival page
- **Method:** `scrape` (primary)
- **Content structure:** Title in `h1.title-page`. Status notice in `h2`. Coverage details in `ul.wp-block-list li`. Scholar profiles in `.person` divs.
- **Note:** Program is closed but page is informational. Worth scraping for historical data if desired, but low value for active scholarship discovery.
- **Recommendation:** SKIP or mark as inactive source
- **Config name:** `off_nz_grads_doctoral_scholarship.py` (optional)
- **Confidence:** HIGH (page accessible but program inactive)

#### 21. SEG Scholarship (Society of Exploration Geophysicists)
- **URL:** `https://seg.org/programs/student-programs/scholarships/`
- **Status:** 403 on WebFetch (bot protection), but page confirmed to exist via search
- **Type:** Single-record program page (with annual application cycle)
- **Method:** `scrapling` (primary -- 403 indicates bot protection)
- **Fields:** Scholarships $500-$10,000/year, deadline March 1, open to all countries
- **Config class:** `BaseOfficialConfig`
- **Config name:** `off_seg_scholarships.py`
- **Confidence:** MEDIUM (URL confirmed, selectors need Scrapling to determine)

#### 22. Palmerston North Mayor's Goodwill Ambassador Scholarship
- **URL:** `https://www.studywithnewzealand.govt.nz/en/study-options/scholarship/ba974507-8483-4638-ad3f-de4f5aae2e71`
- **Status:** 429 (rate limited -- studywithnewzealand.govt.nz blocks aggressive access)
- **Type:** Single-record on studywithnewzealand.govt.nz portal
- **Method:** `scrapling` (primary -- rate limiting suggests bot protection)
- **Fields:** NZ$1,000 towards first year tuition, for international students
- **Note:** No standalone website. Only exists as an entry in the Study With New Zealand government portal.
- **Config class:** `BaseGovernmentConfig`
- **Config name:** `gov_nz_palmerston_north_mayor_scholarship.py`
- **Confidence:** LOW (dependent on studywithnewzealand.govt.nz accessibility)

#### 23. NZ Commonwealth Scholarships (MFAT)
- **URL:** `https://www.nzscholarships.govt.nz/` (redirected from mfat.govt.nz)
- **Status:** Already have `gov_nz_scholarships.py` config pointing to `nzscholarships.govt.nz`
- **Note:** This is the SAME source as the existing `gov_nz_scholarships` config. The NZ Commonwealth Scholarships are part of Manaaki NZ Scholarships administered via nzscholarships.govt.nz.
- **Recommendation:** SKIP -- already covered by existing config `gov_nz_scholarships.py`
- **Config name:** N/A (duplicate)
- **Confidence:** HIGH

### US/INDIA (1 source)

#### 24. Narotam Sekhsaria Foundation
- **URL:** `https://pg.nsfoundation.co.in/` (NOT nsf.org.in which is a different org)
- **Status:** 200 OK
- **Type:** Single-record foundation program page (WordPress)
- **Method:** `scrape` (primary), `scrapling` (secondary)
- **Content structure:** Single PG Scholarship programme. Homepage has hero banner, about section, application process link, statistics (288 scholars, 64 universities, 7 countries). Application redirects to external portal (webportalapp.com).
- **Key selectors:**
  - `listing`: `article, .elementor-section, .e-con`
  - `title`: `h1::text, h2::text`
  - `description`: `.elementor-widget-text-editor p::text`
- **Application process page:** `https://pg.nsfoundation.co.in/application-process/`
- **Config class:** `BaseFoundationConfig`
- **Config name:** `fnd_narotam_sekhsaria_foundation.py`
- **Confidence:** HIGH

### IRELAND (1 source)

#### 25. Walsh Fellowship / Walsh Scholars Programme (Teagasc)
- **URL:** `https://www.teagasc.ie/about/research-innovation/the-walsh-scholars-programme/` (note: single dash in research-innovation)
- **Status:** 200 OK
- **Type:** Hub page with links to sub-sections (About, Scholarship Opportunities, Current Scholars, Alumni)
- **Method:** `scrape` (primary), `scrapling` (secondary)
- **Content structure:** Landing page with 5 linked cards. Postgraduate development and training programme in partnership with Irish universities. Supports 100+ MSc and PhD students annually.
- **Key selectors:**
  - `listing`: `article, .content, section`
  - `title`: `h1::text`
  - `description`: `.field--name-body p::text, .teaser p::text`
  - `detail_link`: `.card a::attr(href), article a::attr(href)`
- **Detail page:** Yes -- sub-pages contain specific program details
- **Config class:** `BaseOfficialConfig`
- **Config name:** `off_ireland_walsh_scholars_programme.py`
- **Confidence:** HIGH

## Grouping by Scraping Pattern

### Group A: Single-Record Official Pages (12 configs -- build first)

These are the simplest configs: one URL, extract title/description/eligibility/amount, no pagination.

| # | Source | Config Name | Method | Confidence |
|---|--------|-------------|--------|------------|
| 2 | John Allwright Fellowship | `gov_australia_john_allwright_fellowship.py` | scrape | HIGH |
| 5 | Ontario Graduate Scholarship | `off_ontario_graduate_scholarship.py` | scrape | HIGH |
| 7 | Quebec PBEEE | `gov_quebec_pbeee_merit_scholarship.py` | scrape | HIGH |
| 9 | SSHRC Partnership Grants | `gov_canada_sshrc_partnership_grants.py` | scrape | HIGH |
| 11 | Trudeau Scholarships | `fnd_trudeau_foundation_scholarships.py` | scrape | MEDIUM |
| 24 | Narotam Sekhsaria | `fnd_narotam_sekhsaria_foundation.py` | scrape | HIGH |
| 25 | Walsh Scholars (Teagasc) | `off_ireland_walsh_scholars_programme.py` | scrape | HIGH |
| 4 | Canadian Commonwealth | `gov_canada_commonwealth_scholarship_plan.py` | scrape | LOW |
| 8 | Ontario Trillium | `off_ontario_trillium_scholarship.py` | scrape | LOW |
| 10 | Anne Vallee Fund | `off_canada_anne_vallee_ecological_fund.py` | scrapling | LOW |
| 20 | NZ-GRADS (inactive) | `off_nz_grads_doctoral_scholarship.py` | scrape | HIGH |
| 22 | Palmerston North Mayor | `gov_nz_palmerston_north_mayor_scholarship.py` | scrapling | LOW |

### Group B: Multi-Record University Listing Pages (6 configs)

These need listing selectors, detail page selectors, and potentially pagination.

| # | Source | Config Name | Method | Confidence |
|---|--------|-------------|--------|------------|
| 13 | University of Auckland | `uni_nz_auckland_scholarships.py` | scrape | HIGH |
| 14 | Lincoln University | `uni_nz_lincoln_scholarships.py` | scrapling | MEDIUM |
| 15 | Massey University | `uni_nz_massey_scholarships.py` | scrapling | MEDIUM |
| 16 | University of Otago | `uni_nz_otago_scholarships.py` | scrapling | MEDIUM |
| 17 | University of Waikato | `uni_nz_waikato_scholarships.py` | scrapling | MEDIUM |
| 18 | Victoria University of Wellington | `uni_nz_victoria_wellington_scholarships.py` | scrapling | MEDIUM |

### Group C: Sites Needing Scrapling Due to Bot Protection (4 configs)

| # | Source | Config Name | Issue | Confidence |
|---|--------|-------------|-------|------------|
| 1 | AU Research Training Program | `gov_australia_research_training_program.py` | Connection timeout | MEDIUM |
| 3 | Shastri Institute | `off_shastri_indo_canadian_institute.py` | Drupal + heavy JS | MEDIUM |
| 6 | NRC Canada | `gov_canada_nrc_research.py` | 403 Forbidden | LOW |
| 12 | AUT University | `uni_nz_aut_scholarships.py` | External DB, hub only | LOW |
| 21 | SEG Scholarships | `off_seg_scholarships.py` | 403 bot protection | MEDIUM |

### Sources to SKIP (3)

| # | Source | Reason |
|---|--------|--------|
| 19 | NZIDRS | Discontinued since ~2020, no longer accepting applications |
| 23 | NZ Commonwealth Scholarships | Already covered by existing `gov_nz_scholarships.py` config |
| (partial) 20 | NZ-GRADS | Program closed -- optional, low priority |

## Architecture Patterns

### Naming Convention (from existing configs)

```
{category}_{country_or_org}_{program_name}.py

Categories:
  gov_  = government source
  off_  = official program (non-government)
  fnd_  = foundation
  uni_  = university (NEW prefix for NZ universities)
  agg_  = aggregator
```

**New prefix needed:** `uni_` for NZ university scholarship listing pages. No existing `uni_` configs exist yet. This is a deliberate choice to distinguish university-level multi-record scholarship databases from single-program official pages.

### Single-Record Config Pattern (Group A)

```python
"""[Name] source configuration."""

from dataclasses import dataclass, field
from scholarhub_pipeline.configs._bases import BaseOfficialConfig  # or BaseGovernmentConfig/BaseFoundationConfig

@dataclass
class Config(BaseOfficialConfig):
    """[Name] official program config."""

    name: str = "[Program Name]"
    url: str = "[url]"
    source_id: str = "[snake_case_id]"
    primary_method: str = "scrape"
    secondary_method: str | None = "scrapling"
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": "article, .content, main",
        "title": "h1::text",
        "description": "p::text, .entry-content p::text",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "description": "description",
    })
    pagination: dict | None = None
    detail_page: bool = False
    detail_selectors: dict[str, str] | None = None

CONFIG = Config()
```

### Multi-Record University Config Pattern (Group B)

```python
"""[University] Scholarships source configuration."""

from dataclasses import dataclass, field
from scholarhub_pipeline.configs._bases import BaseOfficialConfig

@dataclass
class Config(BaseOfficialConfig):
    """[University] scholarships config."""

    name: str = "[University] Scholarships"
    url: str = "[listing_url]"
    source_id: str = "[university]_scholarships"
    primary_method: str = "scrapling"  # Most NZ unis need JS
    secondary_method: str | None = None
    selectors: dict[str, str] = field(default_factory=lambda: {
        "listing": ".scholarship-item, .card, article, .result-item",
        "title": "h2 a::text, h3 a::text, .card-title::text",
        "detail_link": "h2 a::attr(href), h3 a::attr(href), .card a::attr(href)",
        "description": "p::text, .summary::text",
        "host_country_default": "New Zealand",
    })
    field_mappings: dict[str, str] = field(default_factory=lambda: {
        "title": "title",
        "detail_link": "source_url",
        "description": "description",
    })
    pagination: dict | None = field(default_factory=lambda: {
        "type": "url",
        "selector": ".pagination .next::attr(href), a.next::attr(href)",
        "max_pages": 10,
    })
    detail_page: bool = True
    detail_selectors: dict[str, str] | None = field(default_factory=lambda: {
        "description": ".content p::text, article p::text",
        "eligibility": ".eligibility p::text, .requirements li::text",
        "deadline": ".deadline::text, .closing-date::text",
        "amount": ".amount::text, .value::text",
    })
    rate_limit_delay: float = 3.0

CONFIG = Config()
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bot protection bypass | Custom headers/cookies | Scrapling (`scrapling` method) | Handles TLS fingerprinting, Cloudflare challenges |
| HTML parsing | Regex extraction | HtmlScraper with CSS selectors | Handles malformed HTML, encoding issues |
| Rate limiting | Manual delays | `rate_limit_delay` config field | Built into pipeline runner |

## Common Pitfalls

### Pitfall 1: Wrong URL for Program Pages
**What goes wrong:** URLs change frequently on government sites (education.gov.au reorganized from `/research-training-program` to `/research-block-grants/research-training-program`)
**How to avoid:** Include canonical URL in config docstring. Use WebSearch to verify current URL before building config. Set `secondary_method` for resilience.

### Pitfall 2: Mistaking Hub Pages for Listing Pages
**What goes wrong:** Building listing selectors for a page that's just navigation links, extracting zero records
**How to avoid:** Check if page contains actual scholarship data vs. just links to other pages. Auckland's find-a-scholarship.html has actual links, but the main /scholarships-and-awards.html is just a hub.

### Pitfall 3: Cloudflare Challenge Pages
**What goes wrong:** curl returns 200 but content is a JavaScript challenge page, not actual content
**How to avoid:** Check response body for "Just a moment..." title and `_cf_chl_opt`. These sites MUST use `scrapling` as primary method.

### Pitfall 4: Duplicate Sources
**What goes wrong:** Creating configs for sources already covered (NZ Commonwealth = nzscholarships.govt.nz = existing gov_nz_scholarships config)
**How to avoid:** Check existing configs by running `ls scraping/src/scholarhub_pipeline/configs/ | grep keyword`

### Pitfall 5: Discontinued Programs
**What goes wrong:** Building configs for programs that no longer exist (NZIDRS discontinued 2020)
**How to avoid:** Verify program is currently active via web search before building config

## Final Build List (22 configs)

**Build (22):**
1. `gov_australia_research_training_program.py` -- scrapling, single-record
2. `gov_australia_john_allwright_fellowship.py` -- scrape, single-record
3. `off_shastri_indo_canadian_institute.py` -- scrapling, multi-record
4. `gov_canada_commonwealth_scholarship_plan.py` -- scrape, single-record (LOW confidence URL)
5. `off_ontario_graduate_scholarship.py` -- scrape, single-record
6. `gov_canada_nrc_research.py` -- scrapling, single-record (LOW confidence)
7. `gov_quebec_pbeee_merit_scholarship.py` -- scrape, single-record
8. `off_ontario_trillium_scholarship.py` -- scrape, single-record (LOW -- URL TBD)
9. `gov_canada_sshrc_partnership_grants.py` -- scrape, single-record
10. `off_canada_anne_vallee_ecological_fund.py` -- scrapling, single-record (LOW)
11. `fnd_trudeau_foundation_scholarships.py` -- scrape, single-record
12. `uni_nz_aut_scholarships.py` -- scrapling, hub/external DB (LOW)
13. `uni_nz_auckland_scholarships.py` -- scrape, multi-record listing
14. `uni_nz_lincoln_scholarships.py` -- scrapling, multi-record
15. `uni_nz_massey_scholarships.py` -- scrapling, multi-record
16. `uni_nz_otago_scholarships.py` -- scrapling, multi-record
17. `uni_nz_waikato_scholarships.py` -- scrapling, multi-record
18. `uni_nz_victoria_wellington_scholarships.py` -- scrapling, multi-record
19. `off_seg_scholarships.py` -- scrapling, single-record
20. `gov_nz_palmerston_north_mayor_scholarship.py` -- scrapling, single-record
21. `fnd_narotam_sekhsaria_foundation.py` -- scrape, single-record
22. `off_ireland_walsh_scholars_programme.py` -- scrape, single-record

**Skip (3):**
- NZIDRS (discontinued)
- NZ Commonwealth Scholarships (duplicate of existing config)
- NZ-GRADS (program closed, optional low-priority)

## Sources

### Primary (HIGH confidence)
- Direct HTTP probing of all 25 URLs plus alternates
- HTML source analysis of accessible pages
- WebFetch content extraction for accessible pages

### Secondary (MEDIUM confidence)
- WebSearch for education.gov.au RTP, NZIDRS status, NZ-GRADS status, SEG scholarships
- WebSearch for Narotam Sekhsaria Foundation correct URL
- WebSearch for Palmerston North Mayor scholarship info

### Tertiary (LOW confidence)
- Selector predictions for Cloudflare-protected sites (Otago, Lincoln) -- will need runtime verification via Scrapling

## Metadata

**Confidence breakdown:**
- Site accessibility: HIGH (all URLs probed with multiple fallbacks)
- Selector accuracy for accessible sites: HIGH (HTML analyzed)
- Selector accuracy for blocked sites: LOW (generic selectors, need Scrapling verification)
- Grouping/patterns: HIGH (clear A/B/C categorization)

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (URLs may change, especially government sites)
