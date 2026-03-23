# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-03-23
**Phases:** 10 | **Plans:** 45 | **Tasks:** 95

### What Was Built
- Full-stack scholarship aggregation platform: Python scraping pipeline (6 scraper types, 201 source configs) + Convex backend + TanStack Start SSR frontend
- Admin dashboard with trust-weighted auto-publish, review queue, editorial notes, source management
- Public directory with 7-dimension filtering, prestige scoring (Gold/Silver/Bronze), nationality eligibility, curated collections, side-by-side comparison
- SEO infrastructure: Schema.org JSON-LD (Grant), dynamic OG images via satori, auto-generated country/degree landing pages, sitemap, GA4/GSC integration

### What Worked
- **API-first scraping strategy**: Many sources had JSON-LD or APIs, reducing reliance on brittle HTML scraping
- **Write-time triggers**: Prestige scoring and search_text computed at write time via convex-helpers Triggers — zero query-time cost
- **Config-driven scrapers**: SourceConfig protocol + factory pattern meant no per-source spider classes — just data
- **Wave-based parallel execution**: Phases with many plans executed in parallel waves, dramatically reducing wall-clock time
- **TDD throughout**: Tests written first for all backend logic (aggregation helpers, ingestion, scrapers) caught bugs early
- **Phase 06.1 insertion**: Absorbing Phase 6 into 06.1 with prestige/eligibility avoided a throwaway intermediate phase

### What Was Inefficient
- **ROADMAP checkbox staleness**: Many plan checkboxes in ROADMAP.md showed `[ ]` despite completion — the progress table and actual summaries were the source of truth
- **Phase 3 scope**: 9 plans was the largest phase — could have been split into 2 phases (core pipeline + config population)
- **Source config volume**: 201 individual Python dataclass files is a lot of boilerplate — a single YAML/JSON config with code generation might have been leaner

### Patterns Established
- `internalMutation` for all scraping writes — called via admin auth from Python SDK
- CVA (class-variance-authority) for all component variants (prestige, urgency, badges)
- Convex search index + compound index dual-path queries for text search vs structured filtering
- Post-filtering for array membership checks (nationality eligibility) since Convex filter expressions can't do array.includes
- Trigger-wrapped mutations via customMutation pattern for auto-computing derived fields

### Key Lessons
1. **Data first, UI second**: Building scraping → aggregation → admin → public in strict dependency order meant the frontend always had real data to work with
2. **Schema design is critical**: Getting Convex indexes right early avoided expensive migrations later — compound indexes for all planned filter combinations
3. **Gap closure phases work**: Small 1-2 plan "gap closure" additions (03-08, 03-09, 05-06) cleanly addressed post-verification issues without scope creep
4. **SSR migration should happen early**: Moving from SPA to TanStack Start in Phase 06.1 was the right call — SEO requirements in Phase 9 would have forced it anyway

### Cost Observations
- Model mix: Primarily opus for execution, sonnet for research/planning
- Sessions: ~10 sessions across 3 days
- Notable: 45 plans completed in ~3 days — wave-based parallelization was key to throughput

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | ~10 | 10 | Initial MVP — established all patterns |

### Cumulative Quality

| Milestone | Plans | Tasks | Requirements |
|-----------|-------|-------|-------------|
| v1.0 | 45 | 95 | 68/69 (1 deferred) |

### Top Lessons (Verified Across Milestones)

1. Data pipeline before UI — build on real data, not mocks
2. Write-time computation beats read-time for frequently queried derived fields
3. Config-driven patterns scale better than code-per-entity approaches
