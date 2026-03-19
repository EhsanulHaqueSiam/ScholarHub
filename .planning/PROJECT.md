# ScholarHub

## What This Is

A scholarship aggregation platform that scrapes scholarship information from 1000+ sources worldwide — official scholarship sites, university pages, government programs, aggregator sites — deduplicates and merges the data, runs it through an admin review pipeline, and publishes a searchable, filterable public directory for students. Starting with international scholarships, expanding to domestic later.

## Core Value

Students can discover every relevant international scholarship in one place, with reliable, enriched information they can't easily find elsewhere.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Massive source discovery — find 1000+ scholarship sources (aggregators, official programs like DAAD/Erasmus/MEXT, university-specific scholarships, government programs, foundations)
- [ ] Automated scraping pipeline — API-first approach, fallback to standard scraping, Scrapling for Cloudflare-protected sites
- [ ] GitHub Actions automated scheduling for scraping runs
- [ ] Multi-source aggregation — combine data from first-party and third-party sources into unified scholarship entries
- [ ] Deduplication — detect same scholarship across multiple sources, merge richest info from each
- [ ] Admin dashboard — review scraped data, fix/correct errors, add editorial notes, add missing info, approve/reject scholarships
- [ ] Auto-post option — mark trusted sources for automatic publishing without manual review
- [ ] Public scholarship directory — filterable by country, degree level (bachelor, masters, PhD), and other filters
- [ ] Scholarship detail page — deadline, amount, country, eligibility, application link, admin-added tips
- [ ] Deadline handling — archive/mark expired scholarships, auto-resurface for next cycle
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

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| International scholarships first | Focus and validate before expanding to domestic | — Pending |
| Convex for backend/DB | No ORM needed, integrated backend + database | — Pending |
| Python for scraping, separate from web app | Best scraping ecosystem (Scrapy/Scrapling), runs on GitHub Actions independently | — Pending |
| API-first scraping strategy | Try APIs before scraping, fall back to Scrapling for protected sites | — Pending |
| No student auth in v1 | Focus on content quality and scraping robustness first | — Pending |

---
*Last updated: 2026-03-20 after initialization*
