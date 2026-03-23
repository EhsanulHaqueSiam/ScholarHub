# ScholarHub

## What This Is

A scholarship aggregation platform that scrapes international scholarship data from 200+ sources worldwide — official programs (DAAD, Erasmus, MEXT, Chevening, Fulbright), government portals, aggregator sites, and foundations — deduplicates and merges records, runs them through a trust-weighted admin review pipeline, and publishes a searchable, filterable public directory with prestige scoring, curated collections, comparison tools, and SEO-optimized landing pages. Neo-brutalism design with SSR via TanStack Start.

## Core Value

Students can discover every relevant international scholarship in one place, with reliable, enriched information they can't easily find elsewhere.

## Requirements

### Validated

- ✓ Monorepo infrastructure (Python scraping + TypeScript web app + Convex backend) — v1.0
- ✓ 201 scholarship sources cataloged with scrape strategies across 4 categories — v1.0
- ✓ Automated scraping pipeline with 6 scraper types, monitoring, rot detection, GitHub Actions scheduling — v1.0
- ✓ Multi-source aggregation with composite dedup, trust-weighted merging, cycle detection — v1.0
- ✓ Admin dashboard with review queue, bulk actions, source trust levels, editorial notes, auto-publish — v1.0
- ✓ Public directory with full-text search, 7-dimension filtering, prestige scoring, SSR — v1.0
- ✓ Scholarship detail pages with funding breakdown, eligibility, timezone-aware deadlines, source attribution — v1.0
- ✓ Discovery features: curated collections, side-by-side comparison, related scholarships, tag system — v1.0
- ✓ SEO: Schema.org JSON-LD, dynamic OG images, auto-generated country/degree landing pages, sitemap — v1.0
- ✓ Neo-brutalism design with WCAG AA accessibility, mobile-responsive, dark mode — v1.0

### Active

- [ ] Massive source discovery — scale from 201 to 1000+ scholarship sources
- [ ] University-specific scholarship pages (SRCD-03, deferred from v1.0)
- [ ] Student accounts via Clerk (save/bookmark scholarships, filter preferences, notifications)
- [ ] Domestic scholarships category with country-specific sources and taxonomy
- [ ] Two categories: international scholarships (shipped) and domestic scholarships

### Out of Scope

- In-platform scholarship applications — aggregator, not application portal
- AI-powered "matching" — good filters beat bad AI
- Scholarship application tracking — not our problem
- Forum/community features — different product, different moderation burden
- Scholarship reviews/ratings — admin editorial notes fill this gap
- Premium/paid tier — prove value before charging
- Mobile app — responsive web covers mobile use cases

## Context

Shipped v1.0 MVP with:
- ~310k LOC TypeScript (web app, Convex functions, source configs)
- ~56k LOC Python (scraping pipeline, 201 source configs, tests)
- ~1.8k LOC CSS (neo-brutalism design system)
- 335 commits over 3 days
- Convex backend with 10+ tables, search indexes, compound indexes
- TanStack Start SSR with streaming HTML
- Deployed on Netlify

Tech stack: TanStack Start (SSR), React, Tailwind v4, Convex, Python/Scrapling, GitHub Actions, Netlify.

Known technical debt:
- SRCD-03 deferred: university-specific scholarship pages not yet cataloged
- Scrapling v0.4 is new — limited production validation at scale
- Convex free tier limits may need monitoring under real traffic
- isAdmin guard is a stub (always returns true) — needs Clerk integration
- Some ROADMAP plan checkboxes were stale (phases 2-3 showed unchecked despite completion)

## Constraints

- **Frontend**: TanStack Start (SSR), React, Tailwind CSS v4, TypeScript
- **Backend/DB**: Convex (backend, database, schema — no ORM needed)
- **Auth (later)**: Clerk
- **Hosting**: Netlify
- **Runtime**: Bun
- **Scraping**: Python (Scrapling), GitHub Actions for automation
- **Analytics (later)**: Sentry (errors), PostHog (usage/heatmaps/retention)
- **UI Style**: Neo-brutalism design — bold, high-contrast, distinctive
- **Repo Structure**: Monorepo — Python scraping + TypeScript web app sharing Convex backend

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| International scholarships first | Focus and validate before expanding to domestic | ✓ Good — shipped full pipeline without scope creep |
| Convex for backend/DB | No ORM needed, integrated backend + database | ✓ Good — triggers, search indexes, real-time subscriptions all useful |
| Python for scraping, separate from web app | Best scraping ecosystem (Scrapling), runs on GitHub Actions independently | ✓ Good — 6 scraper types, 201 configs, clean separation |
| API-first scraping strategy | Try APIs before scraping, fall back to Scrapling for protected sites | ✓ Good — many sources have JSON-LD or APIs |
| No student auth in v1 | Focus on content quality and scraping robustness first | ✓ Good — reduced complexity, can add Clerk later |
| Neo-brutalism UI design | Distinctive, high information density — stands out from generic scholarship sites | ✓ Good — distinctive identity established |
| Monorepo (Python + TypeScript) | Shared Convex backend, single source of truth, unified GitHub Actions | ✓ Good — simplified CI/CD and source catalog sync |
| TanStack Start SSR (replacing SPA) | SEO requires server-rendered pages for meta tags and structured data | ✓ Good — enabled dynamic OG images, proper meta tags, sitemap |
| Write-time triggers for prestige/search | Avoid expensive read-time computation on every query | ✓ Good — zero query-time cost for prestige and search_text |
| Composite match key for dedup | title+org+country with separate degree overlap check | ✓ Good — catches cross-source duplicates without false positives |
| Trust-weighted auto-publish | Trusted sources skip manual review, reduces admin workload | ✓ Good — scales admin to solo operator |

---
*Last updated: 2026-03-23 after v1.0 milestone*
