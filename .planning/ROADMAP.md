# Roadmap: ScholarHub

## Milestones

- ✅ **v1.0 MVP** — Phases 1-10 (shipped 2026-03-23) — [Archive](milestones/v1.0-ROADMAP.md)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-10) — SHIPPED 2026-03-23</summary>

- [x] Phase 1: Foundation (2/2 plans) — Monorepo scaffold, Convex schema, Netlify deployment
- [x] Phase 2: Source Discovery (3/3 plans) — 201 scholarship sources cataloged
- [x] Phase 3: Scraping Pipeline (9/9 plans) — 6 scraper types, monitoring, GitHub Actions CI/CD
- [x] Phase 4: Data Aggregation (2/2 plans) — Deduplication, merging, cycle tracking
- [x] Phase 5: Admin Dashboard (6/6 plans) — Review queue, trust levels, editorial notes
- [x] Phase 6: Public Directory — ABSORBED INTO Phase 06.1
- [x] Phase 06.1: Public Directory + Prestige (7/7 plans) — SSR directory, filtering, prestige scoring
- [x] Phase 7: Scholarship Detail Page (3/3 plans) — Full detail view with all fields
- [x] Phase 8: Discovery Features (8/8 plans) — Collections, comparison, related scholarships
- [x] Phase 9: SEO & Growth (3/3 plans) — JSON-LD, landing pages, OG images, sitemap
- [x] Phase 10: Study Australia Scrapers (2/2 plans) — InertiaScraper, new configs

**Total: 10 phases, 45 plans, 68/69 requirements (1 deferred)**

</details>

## Progress

| Milestone | Phases | Plans | Status | Shipped |
|-----------|--------|-------|--------|---------|
| v1.0 MVP | 10 | 45 | Complete | 2026-03-23 |

### Phase 1: Eligibility Analysis Funnel

**Goal:** Multi-step eligibility wizard at /eligibility where students provide their profile and receive matched scholarships grouped by tier (Strong/Good/Partial/Possible) on a results page at /eligibility/results
**Requirements**: D-01 through D-39 (39 locked decisions from context session)
**Depends on:** v1.0 MVP
**Plans:** 8 plans

Plans:
- [x] 01-01-PLAN.md — Foundation libs: types, GPA scales, profile storage, URL params, analytics
- [x] 01-02-PLAN.md — Scoring engine (TDD): point-based tier scoring with tests
- [x] 01-03-PLAN.md — Design system: match tier CSS tokens, badge variants, nav link, CTA
- [x] 01-04-PLAN.md — Convex eligibility queries + React hooks (useStudentProfile, useEligibilityMatching)
- [x] 01-05-PLAN.md — Wizard UI: WizardShell, 3 step components, /eligibility route
- [x] 01-06-PLAN.md — Wizard live data: LiveMatchCount, Convex wiring, analytics tracking
- [x] 01-07-PLAN.md — Results page: tier sections, match indicators, profile summary card
- [ ] 01-08-PLAN.md — Welcome back flow, SEO (FAQPage, dynamic titles), visual verification
