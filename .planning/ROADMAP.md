# Roadmap: ScholarHub

## Overview

ScholarHub delivers a scholarship aggregation platform in 9 phases, starting with infrastructure and data collection (the foundation everything depends on), progressing through data processing and admin tools, and culminating in the public-facing directory with discovery features and SEO. The ordering reflects a strict dependency chain: you cannot filter scholarships that have not been scraped, cannot publish data that has not been reviewed, and cannot optimize SEO for pages that do not yet exist. Scraping and data quality come first; frontend comes after real data exists.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Monorepo scaffold, Convex schema, Netlify deployment, project skeleton
- [ ] **Phase 2: Source Discovery** - Catalog 1000+ scholarship sources with metadata and scrape strategies
- [ ] **Phase 3: Scraping Pipeline** - Automated scraping with API-first approach, Scrapling fallback, GitHub Actions scheduling, monitoring
- [ ] **Phase 4: Data Aggregation** - Deduplication, multi-source merging, cyclical scholarship tracking
- [ ] **Phase 5: Admin Dashboard** - Review queue, approve/reject workflow, source trust levels, editorial notes
- [ ] **Phase 6: Public Directory** - Searchable, filterable scholarship listing with neo-brutalism design
- [ ] **Phase 7: Scholarship Detail Page** - Complete scholarship detail view with all required fields
- [ ] **Phase 8: Discovery Features** - Curated collections, scholarship comparison, related scholarships
- [ ] **Phase 9: SEO & Growth** - Structured data, auto-generated landing pages, meta tag optimization

## Phase Details

### Phase 1: Foundation
**Goal**: Project infrastructure is set up and deployable -- monorepo structure works, Convex schema is defined, and the app deploys to Netlify with a placeholder page
**Depends on**: Nothing (first phase)
**Requirements**: INFR-01, INFR-02, INFR-03
**Success Criteria** (what must be TRUE):
  1. Monorepo contains both Python scraping directory and TypeScript web app directory with shared configuration
  2. Convex schema is deployed with tables for raw scraped records, canonical scholarships, and sources -- with indexes for all planned filter combinations
  3. Frontend app deploys to Netlify and loads successfully in a browser (placeholder page)
  4. Python environment is configured with dependency management and can import Convex HTTP API utilities
**Plans**: TBD

Plans:
- [ ] 01-01: TBD
- [ ] 01-02: TBD

### Phase 2: Source Discovery
**Goal**: A comprehensive, structured catalog of scholarship sources exists, each annotated with scrape strategy and priority, ready to feed the scraping pipeline
**Depends on**: Phase 1
**Requirements**: SRCD-01, SRCD-02, SRCD-03, SRCD-04, SRCD-05
**Success Criteria** (what must be TRUE):
  1. Source catalog contains 1000+ entries spanning official programs (DAAD, Erasmus, MEXT, Chevening, Fulbright), university-specific pages, and third-party aggregators
  2. Each source entry specifies URL, source type (API/scrape/Scrapling), estimated reliability, and recommended scrape frequency
  3. Sources are categorized by type (official program, university, aggregator, government, foundation) and prioritized for scraping order
  4. Source catalog is stored in a format consumable by the scraping pipeline (structured data in repo or Convex)
**Plans**: TBD

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD

### Phase 3: Scraping Pipeline
**Goal**: An automated scraping system pulls scholarship data from multiple source types, lands it in Convex staging tables, and runs on a schedule via GitHub Actions with monitoring
**Depends on**: Phase 1, Phase 2
**Requirements**: SCRP-01, SCRP-02, SCRP-03, SCRP-04, SCRP-05, SCRP-06, SCRP-07, INFR-04
**Success Criteria** (what must be TRUE):
  1. Pipeline successfully scrapes an API-based source, a standard HTTP source, and a Cloudflare-protected source (via Scrapling) -- all landing raw records in Convex staging tables
  2. GitHub Actions workflow runs scraping on a configurable schedule (at least daily) without manual intervention
  3. Each scrape run produces yield metrics: records found, success/failure rate per source, and "last verified" timestamps per scholarship
  4. Monitoring detects silent scraper rot -- alerts when a previously-working source returns zero results or errors for consecutive runs
  5. Raw scraped records in staging are structured with source attribution and ready for the aggregation phase
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD
- [ ] 03-03: TBD

### Phase 4: Data Aggregation
**Goal**: Raw scraped records from multiple sources are deduplicated, merged into canonical scholarship entries, and cyclical programs are linked across years
**Depends on**: Phase 3
**Requirements**: AGGR-01, AGGR-02, AGGR-03, AGGR-04, AGGR-05, AGGR-06
**Success Criteria** (what must be TRUE):
  1. Same scholarship appearing in multiple sources is detected via composite matching (title + organization + country + degree level) and merged into a single canonical entry
  2. Merge logic selects the richest/most complete data from each source -- source-level records are preserved separately from the canonical merged record
  3. Cyclical scholarships (e.g., DAAD 2025 and DAAD 2026) are linked, and expired scholarships display "expected to reopen [month]" based on historical patterns
  4. Aggregation pipeline runs after scraping and produces a clear count of new, updated, and duplicate records per run
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD

### Phase 5: Admin Dashboard
**Goal**: A solo admin can efficiently review, edit, approve/reject, and publish scraped scholarships through a streamlined dashboard -- with trusted sources auto-publishing
**Depends on**: Phase 4
**Requirements**: ADMN-01, ADMN-02, ADMN-03, ADMN-04, ADMN-05, ADMN-06, ADMN-07, ADMN-08, UIDX-04
**Success Criteria** (what must be TRUE):
  1. Admin can view a review queue of pending scholarships, sorted by source trust level and recency
  2. Admin can edit any scholarship field, approve or reject with a single click, and bulk-approve/reject multiple scholarships at once
  3. Admin can configure source trust levels (auto-publish, needs-review, blocked) and scholarships from trusted sources publish automatically without manual review
  4. Admin can add rich-text editorial notes and tips to any scholarship
  5. No duplicate scholarships can be published -- dedup is enforced at the publish boundary
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD
- [ ] 05-03: TBD

### Phase 6: Public Directory
**Goal**: Students can browse, search, and filter all published international scholarships in a neo-brutalism-styled, mobile-responsive directory -- no login required
**Depends on**: Phase 5
**Requirements**: PDIR-01, PDIR-02, PDIR-03, PDIR-04, PDIR-05, PDIR-06, PDIR-07, PDIR-08, PDIR-09, PDIR-10, PDIR-11, UIDX-01, UIDX-02, UIDX-03
**Success Criteria** (what must be TRUE):
  1. User can search scholarships by keyword across title, description, and eligibility text -- results update in real time
  2. User can filter by destination country, degree level, field of study, funding type, and nationality eligibility -- filters combine with AND logic
  3. Scholarship listing cards show deadline with color-coded urgency (closing soon = red/warning, open = green, closed = grey), and the default view shows "Open Now" sorted by deadline urgency
  4. User can view a dedicated "Closing Soon" view and expired scholarships remain visible with an "applications closed" badge
  5. All pages use neo-brutalism design (bold, high-contrast, distinctive), are mobile-responsive, and present high information density in an easily digestible format -- no login required for any public page
**Plans**: TBD

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD
- [ ] 06-03: TBD

### Phase 7: Scholarship Detail Page
**Goal**: Each scholarship has a comprehensive detail page showing all relevant information a student needs to decide whether and how to apply
**Depends on**: Phase 6
**Requirements**: DTLP-01, DTLP-02, DTLP-03, DTLP-04, DTLP-05, DTLP-06, DTLP-07, DTLP-08, DTLP-09, DTLP-10, DTLP-11
**Success Criteria** (what must be TRUE):
  1. Detail page displays scholarship name, provider/organization, host country, eligible nationalities, degree levels, and fields of study
  2. Detail page shows funding breakdown (tuition, living allowance, travel, insurance), award amount with currency, and application deadline with timezone awareness
  3. Detail page includes a direct link to the official application page, source attribution listing all sources the data was compiled from, and "last verified" date
  4. Detail page displays admin editorial notes/tips (when available) and a rich-text description/overview
**Plans**: TBD

Plans:
- [ ] 07-01: TBD
- [ ] 07-02: TBD

### Phase 8: Discovery Features
**Goal**: Students can discover scholarships through curated collections, compare options side-by-side, and find related scholarships from detail pages
**Depends on**: Phase 7
**Requirements**: DISC-01, DISC-02, DISC-03
**Success Criteria** (what must be TRUE):
  1. Admin-created curated collections exist as tag-based, auto-populating lists (e.g., "Top Fully Funded 2026", "No GRE Required") that students can browse
  2. User can select 2-3 scholarships and view them in a side-by-side comparison table highlighting key differences
  3. Scholarship detail pages show a "Related Scholarships" section with relevant alternatives
**Plans**: TBD

Plans:
- [ ] 08-01: TBD
- [ ] 08-02: TBD

### Phase 9: SEO & Growth
**Goal**: Scholarship pages are discoverable by search engines with proper structured data, and auto-generated landing pages drive organic traffic for country and degree-level searches
**Depends on**: Phase 7
**Requirements**: SEOG-01, SEOG-02, SEOG-03
**Success Criteria** (what must be TRUE):
  1. Each scholarship page has a clean URL slug, proper meta tags (title, description, Open Graph), and Schema.org structured data (Scholarship markup)
  2. Country landing pages are auto-generated (e.g., "/scholarships/germany") with unique meta descriptions and filtered scholarship listings
  3. Degree-level landing pages are auto-generated (e.g., "/scholarships/phd") with unique meta descriptions and filtered scholarship listings
**Plans**: TBD

Plans:
- [ ] 09-01: TBD
- [ ] 09-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/2 | Not started | - |
| 2. Source Discovery | 0/2 | Not started | - |
| 3. Scraping Pipeline | 0/3 | Not started | - |
| 4. Data Aggregation | 0/2 | Not started | - |
| 5. Admin Dashboard | 0/3 | Not started | - |
| 6. Public Directory | 0/3 | Not started | - |
| 7. Scholarship Detail Page | 0/2 | Not started | - |
| 8. Discovery Features | 0/2 | Not started | - |
| 9. SEO & Growth | 0/2 | Not started | - |
