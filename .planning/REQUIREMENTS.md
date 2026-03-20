# Requirements: ScholarHub

**Defined:** 2026-03-20
**Core Value:** Students can discover every relevant international scholarship in one place, with reliable, enriched information they can't easily find elsewhere.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Source Discovery

- [x] **SRCD-01**: System discovers and catalogs 1000+ scholarship sources (aggregators, official programs, universities, government programs, foundations)
- [x] **SRCD-02**: Sources include official scholarship programs (DAAD, Erasmus, MEXT, Chevening, Fulbright, etc.)
- [ ] **SRCD-03**: Sources include university-specific scholarship pages
- [x] **SRCD-04**: Sources include third-party aggregator sites (ScholarshipPortal, Scholars4Dev, IEFA, etc.)
- [x] **SRCD-05**: Each source is cataloged with URL, type (API/scrape/Scrapling), reliability rating, and scrape frequency

### Scraping Pipeline

- [x] **SCRP-01**: Automated scraping pipeline uses API-first approach when available
- [x] **SCRP-02**: Standard HTTP scraping fallback when no API exists
- [x] **SCRP-03**: Scrapling-based scraping for Cloudflare-protected sites
- [x] **SCRP-04**: GitHub Actions runs scraping on automated schedule
- [x] **SCRP-05**: Scraped data lands in staging area (raw records) before processing
- [x] **SCRP-06**: Each scrape run logs yield metrics (records found, success/fail rate per source)
- [x] **SCRP-07**: "Last verified" timestamp tracked per scholarship per source

### Data Aggregation

- [ ] **AGGR-01**: Multi-source aggregation combines data from different sources for the same scholarship into one unified entry
- [ ] **AGGR-02**: Deduplication detects same scholarship across multiple sources using composite matching (title + organization + country + degree level)
- [ ] **AGGR-03**: Merge logic selects richest/most complete data from each source
- [ ] **AGGR-04**: Source-level records preserved separately from canonical merged records
- [ ] **AGGR-05**: Cyclical scholarship tracking links same program across years (DAAD 2025 → DAAD 2026)
- [ ] **AGGR-06**: Expired scholarships show "expected to reopen [month]" based on historical data

### Admin Dashboard

- [ ] **ADMN-01**: Admin can view review queue of pending scraped scholarships
- [ ] **ADMN-02**: Admin can edit any scholarship field (fix scraped data, fill gaps, rewrite descriptions)
- [ ] **ADMN-03**: Admin can approve or reject scholarships with single action
- [ ] **ADMN-04**: Admin can bulk-approve or bulk-reject multiple scholarships
- [ ] **ADMN-05**: Admin can configure source trust levels (auto-publish, needs-review, blocked)
- [ ] **ADMN-06**: Trusted sources auto-publish scholarships without manual review
- [ ] **ADMN-07**: Admin can add editorial notes and tips per scholarship (rich text)
- [ ] **ADMN-08**: No duplicate scholarships can be published (dedup enforced at publish)

### Public Directory

- [x] **PDIR-01**: User can search scholarships via full-text search across title, description, eligibility
- [x] **PDIR-02**: User can filter by destination country (multi-select)
- [x] **PDIR-03**: User can filter by degree level (bachelor, masters, PhD, postdoc)
- [x] **PDIR-04**: User can filter by field of study (20-30 broad categories)
- [x] **PDIR-05**: User can filter by funding type (fully funded, partial, tuition waiver, stipend only)
- [x] **PDIR-06**: User can filter by nationality/citizenship eligibility ("scholarships I can apply for")
- [x] **PDIR-07**: Deadline displayed prominently on listing cards with color-coded urgency (closing soon, open, closed)
- [x] **PDIR-08**: Default view shows "Open Now" scholarships sorted by deadline urgency
- [x] **PDIR-09**: User can view "Closing Soon" scholarships as a dedicated view
- [x] **PDIR-10**: Expired scholarships show "applications closed" badge, remain visible for reference
- [x] **PDIR-11**: No login required to browse or view any scholarship

### Scholarship Detail Page

- [ ] **DTLP-01**: Detail page shows scholarship name, provider/organization, host country
- [ ] **DTLP-02**: Detail page shows eligible nationalities
- [ ] **DTLP-03**: Detail page shows degree level(s) and field(s) of study
- [ ] **DTLP-04**: Detail page shows funding coverage breakdown (tuition, living allowance, travel, insurance)
- [ ] **DTLP-05**: Detail page shows award amount (range or fixed, with currency)
- [ ] **DTLP-06**: Detail page shows application deadline with timezone awareness
- [ ] **DTLP-07**: Detail page shows direct link to official application page
- [ ] **DTLP-08**: Detail page shows source attribution ("compiled from daad.de, scholars4dev.com")
- [ ] **DTLP-09**: Detail page shows "last verified" date
- [ ] **DTLP-10**: Detail page shows admin editorial notes/tips when available
- [ ] **DTLP-11**: Detail page shows description/overview (rich text)

### Discovery Features

- [ ] **DISC-01**: Curated collections — admin-created, tag-based, auto-populating lists (e.g., "Top Fully Funded 2026", "No GRE Required")
- [ ] **DISC-02**: Scholarship comparison — side-by-side comparison of 2-3 scholarships
- [ ] **DISC-03**: Related scholarships shown on detail page

### SEO & Growth

- [ ] **SEOG-01**: Each scholarship page has clean URL, proper meta tags, and Schema.org structured data
- [ ] **SEOG-02**: Country landing pages auto-generated ("/scholarships/germany") with unique meta descriptions
- [ ] **SEOG-03**: Degree-level landing pages auto-generated ("/scholarships/phd")

### UI/UX Design

- [x] **UIDX-01**: Neo-brutalism design style — bold, high-contrast, distinctive visual identity
- [x] **UIDX-02**: Mobile-responsive design (mobile-first approach)
- [x] **UIDX-03**: High information density presented in easily digestible format
- [ ] **UIDX-04**: Use frontend-design skill for all UI implementation

### Infrastructure

- [x] **INFR-01**: Monorepo structure — Python scraping + TypeScript web app in single repository
- [x] **INFR-02**: Convex backend with proper schema, indexes for all filter combinations
- [x] **INFR-03**: Netlify deployment for frontend
- [x] **INFR-04**: Scraping monitoring — track yield metrics, detect silent scraper rot

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Student Accounts

- **ACCT-01**: Student can create account via Clerk
- **ACCT-02**: Student can save/bookmark scholarships
- **ACCT-03**: Student can set filter preferences for notifications
- **ACCT-04**: Student receives notifications when matching scholarships are posted

### Analytics & Monitoring

- **ANLZ-01**: Sentry error tracking integration
- **ANLZ-02**: PostHog analytics (usage, heatmaps, retention)

### Domestic Scholarships

- **DMST-01**: Domestic scholarship category with country-specific sources
- **DMST-02**: Separate filters and taxonomy for domestic scholarships

## Out of Scope

| Feature | Reason |
|---------|--------|
| In-platform scholarship applications | ScholarHub is an aggregator, not an application portal — always link to official application |
| AI-powered "matching" | Good filters are better than bad AI — invest in filter UX instead |
| Scholarship application tracking | Students use spreadsheets/Notion — not our problem in v1 |
| Email notifications/alerts | Requires student accounts (v2) |
| Forum/community features | Different product, different moderation burden |
| Scholarship reviews/ratings by students | Admin editorial notes fill this gap better |
| Premium/paid tier | Charging before proving value kills growth |
| Mobile app | Responsive web covers mobile use cases |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFR-01 | Phase 1 | Complete |
| INFR-02 | Phase 1 | Complete |
| INFR-03 | Phase 1 | Complete |
| SRCD-01 | Phase 2 | Complete |
| SRCD-02 | Phase 2 | Complete |
| SRCD-03 | Deferred | Deferred — university-specific pages moved to future phase |
| SRCD-04 | Phase 2 | Complete |
| SRCD-05 | Phase 2 | Complete |
| SCRP-01 | Phase 3 | Complete |
| SCRP-02 | Phase 3 | Complete |
| SCRP-03 | Phase 3 | Complete |
| SCRP-04 | Phase 3 | Complete |
| SCRP-05 | Phase 3 | Complete |
| SCRP-06 | Phase 3 | Complete |
| SCRP-07 | Phase 3 | Complete |
| INFR-04 | Phase 3 | Complete |
| AGGR-01 | Phase 4 | Pending |
| AGGR-02 | Phase 4 | Pending |
| AGGR-03 | Phase 4 | Pending |
| AGGR-04 | Phase 4 | Pending |
| AGGR-05 | Phase 4 | Pending |
| AGGR-06 | Phase 4 | Pending |
| ADMN-01 | Phase 5 | Pending |
| ADMN-02 | Phase 5 | Pending |
| ADMN-03 | Phase 5 | Pending |
| ADMN-04 | Phase 5 | Pending |
| ADMN-05 | Phase 5 | Pending |
| ADMN-06 | Phase 5 | Pending |
| ADMN-07 | Phase 5 | Pending |
| ADMN-08 | Phase 5 | Pending |
| UIDX-04 | Phase 5 | Pending |
| PDIR-01 | Phase 6 | Complete |
| PDIR-02 | Phase 6 | Complete |
| PDIR-03 | Phase 6 | Complete |
| PDIR-04 | Phase 6 | Complete |
| PDIR-05 | Phase 6 | Complete |
| PDIR-06 | Phase 6 | Complete |
| PDIR-07 | Phase 6 | Complete |
| PDIR-08 | Phase 6 | Complete |
| PDIR-09 | Phase 6 | Complete |
| PDIR-10 | Phase 6 | Complete |
| PDIR-11 | Phase 6 | Complete |
| UIDX-01 | Phase 6 | Complete |
| UIDX-02 | Phase 6 | Complete |
| UIDX-03 | Phase 6 | Complete |
| DTLP-01 | Phase 7 | Pending |
| DTLP-02 | Phase 7 | Pending |
| DTLP-03 | Phase 7 | Pending |
| DTLP-04 | Phase 7 | Pending |
| DTLP-05 | Phase 7 | Pending |
| DTLP-06 | Phase 7 | Pending |
| DTLP-07 | Phase 7 | Pending |
| DTLP-08 | Phase 7 | Pending |
| DTLP-09 | Phase 7 | Pending |
| DTLP-10 | Phase 7 | Pending |
| DTLP-11 | Phase 7 | Pending |
| DISC-01 | Phase 8 | Pending |
| DISC-02 | Phase 8 | Pending |
| DISC-03 | Phase 8 | Pending |
| SEOG-01 | Phase 9 | Pending |
| SEOG-02 | Phase 9 | Pending |
| SEOG-03 | Phase 9 | Pending |

**Coverage:**
- v1 requirements: 62 total
- Mapped to phases: 62
- Unmapped: 0

---
*Requirements defined: 2026-03-20*
*Last updated: 2026-03-20 after roadmap creation*
