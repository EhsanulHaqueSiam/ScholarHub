# Research Summary: ScholarHub

**Domain:** Scholarship Aggregation Platform (International Focus)
**Researched:** 2026-03-20
**Overall confidence:** HIGH

## Executive Summary

ScholarHub is a scholarship aggregation platform that scrapes 1000+ international scholarship sources, deduplicates and enriches the data through an admin review pipeline, and publishes a searchable, filterable public directory. The chosen stack -- TanStack Router/Query + React + Convex + Scrapling/Scrapy + GitHub Actions -- is well-suited for this use case, with one significant research finding: Scrapling v0.4 (Feb 2026) now includes its own spider/crawling framework with multi-session routing, making Scrapy potentially unnecessary for the initial build.

The architecture splits cleanly into two runtimes: a React SPA on Netlify communicating with Convex via WebSocket (real-time reactive queries), and a Python scraping pipeline running on GitHub Actions that pushes data to Convex via HTTP API. Convex serves as both the database and the backend, eliminating the need for a separate API server. The Python-to-Convex bridge uses Convex's HTTP API with batched mutations (up to 16,000 documents per transaction), avoiding both the alpha Python client dependency and the overhead of individual mutation calls.

The critical engineering challenges are: (1) deduplication across 1000+ sources, which is an entity resolution problem requiring composite matching keys and a two-stage raw-to-canonical data flow; (2) designing within Convex's transaction limits (1-second mutation timeout, 32K document scan limit), which requires careful index planning and batched ingestion patterns; and (3) building resilient scraping infrastructure that handles the Cloudflare anti-bot arms race through Scrapling's multi-session fetcher routing.

The free tier limits are generous for an MVP: Convex gives 1M function calls/month and 0.5 GiB storage, GitHub Actions gives 2,000 minutes/month for private repos (enough for twice-daily scraping runs), and Netlify gives 100GB bandwidth. The main scaling concern is Convex function calls -- each real-time query subscription counts as calls, and with admin usage plus public traffic plus scraping ingestion, the 1M/month limit could be reached before paid features are needed.

## Key Findings

**Stack:** TanStack Router (SPA mode) + TanStack Query + Convex + Scrapling (primary) + GitHub Actions. Use Convex HTTP API (not Python client) for scraping-to-database bridge. shadcn/ui for components.

**Architecture:** Two-runtime split (Python scraping on GitHub Actions, React SPA on Netlify) with Convex as the shared backend. Two-stage data flow: raw scraped data lands in staging, gets processed through admin review or auto-approval into canonical published records.

**Critical pitfall:** Deduplication is not string matching -- it's entity resolution. The same scholarship appears with different names/formats across 15+ aggregator sites. Must use composite matching keys (title + organization + country + degree level) and store source-level records separately from canonical merged records from day one. Retrofitting dedup after data is live is a HIGH-cost recovery.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Foundation (Convex schema + data model + project scaffold)** - Everything depends on the data model. Define schema, set up Convex project, configure Vite + TanStack Router + Tailwind. No features yet, just the skeleton.
   - Addresses: Schema design, index planning, project structure
   - Avoids: Building on an undefined data model that requires later migration

2. **Scraping Pipeline MVP (5-10 sources, end-to-end)** - Prove the scrape-to-Convex flow works. Build Scrapling spiders for 5-10 diverse sources (one API-based, one simple HTTP, one Cloudflare-protected, one JS-rendered). Build the Python-to-Convex HTTP bridge with batched mutations.
   - Addresses: Scraping infrastructure, ingestion pipeline, spider framework
   - Avoids: Building 1000 spiders before building 10 good ones (Pitfall 7)

3. **Admin Dashboard** - Review what the scraper produced. Build the review queue, approve/reject flow, edit/enrich UI. This validates the two-stage ingestion pattern before building the public-facing directory.
   - Addresses: Admin workflow, data quality control, auto-publish for trusted sources
   - Avoids: Garbage data going live without review (Anti-Pattern 1)

4. **Public Directory** - Scholarship listing with search + filters (country, degree level, field of study). Detail pages with all required fields. Deadline display and expired marking.
   - Addresses: Core user-facing product, table stakes features
   - Avoids: Building frontend for data that doesn't yet exist

5. **Scale Scraping (50-100+ sources)** - Expand spider coverage. Add deduplication engine. Implement cyclical deadline handling. Set up GitHub Actions cron workflows with monitoring.
   - Addresses: Source expansion, deduplication, data enrichment
   - Avoids: Silent scraper rot (Pitfall 1) through built-in monitoring

6. **SEO + Growth** - Country/degree landing pages, structured data markup, meta tags. Consider SSR/SSG for scholarship pages if needed for SEO (may require TanStack Start at this point).
   - Addresses: Discovery, organic traffic
   - Avoids: Premature optimization before content quality is proven

**Phase ordering rationale:**
- Schema must come first because every other component depends on it
- Scraping pipeline before frontend because the frontend needs real data to develop against
- Admin dashboard before public directory because data quality must be verified before exposing to users
- Scale scraping after proving the pipeline works end-to-end with a small number of sources
- SEO last because it requires sufficient content volume to be meaningful

**Research flags for phases:**
- Phase 2: Likely needs deeper research on Scrapling spider framework at scale (new framework, limited production reports)
- Phase 3: Standard CRUD patterns, unlikely to need research
- Phase 5: Deduplication needs phase-specific research (entity resolution algorithms, `dedupe` library evaluation)
- Phase 6: May need research on SSR/SSG options if SEO becomes critical (TanStack Start vs static pre-rendering)

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified via npm/PyPI registries and official docs. Technologies are mature and well-integrated |
| Features | HIGH | Based on competitive analysis of 15+ scholarship platforms. Table stakes are well-understood in this domain |
| Architecture | HIGH | Two-runtime split is a proven pattern. Convex + TanStack Query integration is officially supported. GitHub Actions for cron scraping is widely documented |
| Pitfalls | HIGH | All pitfalls sourced from official docs (Convex limits), community reports (GitHub Actions scheduling), and domain-specific analysis (deduplication, scraper rot). Multiple sources corroborate each finding |
| Scrapling spider framework | MEDIUM | v0.4 is new (Feb 2026). Production-ready claims backed by 92% test coverage, but limited independent validation at 1000+ source scale. Scrapy remains a proven fallback |
| Convex Python client | MEDIUM | Alpha (v0.7.0, pre-1.0). Functional but API may change. HTTP API is a more stable alternative |

## Gaps to Address

- **Scrapling at scale:** No independent reports of Scrapling's spider framework handling 1000+ sources. Need to validate during Phase 2 with real-world testing
- **SEO for SPAs:** Convex + React SPA will need SSR or static pre-rendering for scholarship pages to rank in search. This may require TanStack Start or a pre-rendering solution -- research needed before Phase 6
- **Deduplication algorithm:** The `dedupe` Python library and composite matching key approach need evaluation with real scholarship data. Phase-specific research recommended before Phase 5
- **Convex free tier longevity:** 1M function calls/month is generous but real-time subscriptions from multiple concurrent users could consume quota. Need monitoring from day one
- **Netlify + Convex deployment:** Standard pattern but deploy workflow (Netlify builds frontend, Convex deploys backend separately) needs validation during Phase 1 setup
