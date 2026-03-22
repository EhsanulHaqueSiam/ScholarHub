# ScholarHub

## What This Is

A scholarship aggregation platform that scrapes scholarship information from 1000+ sources worldwide — official scholarship sites, university pages, government programs, aggregator sites — deduplicates and merges the data, runs it through an admin review pipeline, and publishes a searchable, filterable public directory for students. Starting with international scholarships, expanding to domestic later.

## Core Value

Students can discover every relevant international scholarship in one place, with reliable, enriched information they can't easily find elsewhere.

## Requirements

### Validated

- [x] Source catalog infrastructure — JSON Schema, Convex upsert mutation, CLI tools (seed/validate/stats), CI validation (Validated in Phase 2: Source Discovery)
- [x] Source discovery — 201 scholarship sources cataloged across aggregators, official programs, government, foundations with scrape strategies and metadata (Validated in Phase 2: Source Discovery)
- [x] Automated scraping pipeline — 6 scraper types (API, JSON-LD, AJAX, RSS, HTML, Stealthy), 201 source configs, ingestion layer, monitoring with rot detection, pipeline runner + CLI, CI/CD (Validated in Phase 3: Scraping Pipeline)
- [x] GitHub Actions automated scheduling for scraping runs (Validated in Phase 3: Scraping Pipeline)

### Active

- [ ] Massive source discovery — find 1000+ scholarship sources (aggregators, official programs like DAAD/Erasmus/MEXT, university-specific scholarships, government programs, foundations)
- [x] Multi-source aggregation — combine data from first-party and third-party sources into unified scholarship entries (Validated in Phase 4: Data Aggregation)
- [x] Deduplication — detect same scholarship across multiple sources, merge richest info from each (Validated in Phase 4: Data Aggregation)
- [ ] Admin dashboard — review scraped data, fix/correct errors, add editorial notes, add missing info, approve/reject scholarships
- [ ] Auto-post option — mark trusted sources for automatic publishing without manual review
- [x] Public scholarship directory — filterable by country, degree level (bachelor, masters, PhD), and other filters (Validated in Phase 06.1: Public Directory with Prestige System)
- [ ] Scholarship detail page — deadline, amount, country, eligibility, application link, admin-added tips
- [x] Deadline handling — archive/mark expired scholarships, auto-resurface for next cycle (Validated in Phase 4: Data Aggregation)
- [ ] Two categories: international scholarships (v1 focus) and domestic scholarships (later)

### Out of Scope

- Student accounts/login — deferred, will use Clerk when ready
- Saved filters and notifications — requires student accounts
- Domestic scholarships — after international is solid
- Mobile app — web-first
- Sentry error tracking — later
- PostHog analytics — later

## Context

- Scholarship data is messy — different sources have different levels of detail, different formats, different update frequencies
- Many official scholarship sites use Cloudflare protection, requiring specialized scraping (Scrapling)
- Third-party aggregator sites sometimes have APIs, sometimes don't, and vary wildly in data quality
- Scholarships are cyclical — same programs recur annually with updated deadlines
- The admin is a single person (the developer) initially — admin workflow should be efficient for solo use
- The scraping infrastructure runs separately from the web app (Python on GitHub Actions vs TypeScript/Convex web app)

## Constraints

- **Frontend**: TanStack (Router/Query), React, Tailwind CSS, TypeScript
- **Backend/DB**: Convex (backend, database, schema — no ORM needed)
- **Auth (later)**: Clerk
- **Hosting**: Netlify
- **Runtime**: Bun
- **Scraping**: Python (Scrapling + Scrapy), GitHub Actions for automation
- **Analytics (later)**: Sentry (errors), PostHog (usage/heatmaps/retention)
- **UI Style**: Neo-brutalism design — bold, high-contrast, distinctive. Inspiration: neobrutalism.dev, Dribbble neo-brutalism examples. Use `frontend-design` skill for all UI work.
- **Repo Structure**: Monorepo — Python scraping + TypeScript web app in single repository, sharing Convex backend

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| International scholarships first | Focus and validate before expanding to domestic | — Pending |
| Convex for backend/DB | No ORM needed, integrated backend + database | — Pending |
| Python for scraping, separate from web app | Best scraping ecosystem (Scrapy/Scrapling), runs on GitHub Actions independently | — Pending |
| API-first scraping strategy | Try APIs before scraping, fall back to Scrapling for protected sites | — Pending |
| No student auth in v1 | Focus on content quality and scraping robustness first | — Pending |
| Neo-brutalism UI design | Distinctive, user-friendly, high information density done right — stands out from generic scholarship sites | — Pending |
| Monorepo (Python + TypeScript) | Keep scraping and web app in one repo — shared Convex backend, single source of truth, unified GitHub Actions | — Pending |

---
## Current State

Phase 4 (Data Aggregation) complete — aggregation pipeline runs inside Convex as internal mutations triggered after scrape runs. Composite matching (title + org + country + degree level overlap) deduplicates across sources, trust-weighted merge (government > official_program > foundation > aggregator) selects richest data, cycle detection links annual programs via previous_cycle_id, auto-archive handles expired scholarships with expected_reopen_month. 82 tests passing, 6/6 AGGR requirements verified.

*Last updated: 2026-03-22 after Phase 4 completion*
