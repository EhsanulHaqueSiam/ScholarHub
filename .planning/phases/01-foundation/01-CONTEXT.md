# Phase 1: Foundation - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Set up project infrastructure: monorepo structure with Python scraping and TypeScript web app directories, Convex schema with tables for raw records/canonical scholarships/sources, Netlify deployment with a branded placeholder page, and Python environment configured to communicate with Convex. This phase produces a deployable skeleton — no business logic.

</domain>

<decisions>
## Implementation Decisions

### Monorepo layout
- Two top-level directories: `web/` (TanStack + React + Convex) and `scraping/` (Python pipeline)
- Convex lives inside `web/` — the Convex dev server runs from `web/`, Python accesses Convex via its SDK (HTTP API)
- Minimal root config: README, .gitignore, shared .env (Convex keys), and a root package.json or Makefile with convenience scripts (dev, deploy). Each side manages its own tooling independently.

### Convex schema design
- Highly structured fields — individual typed fields for everything (funding_tuition, funding_living, funding_travel as booleans/amounts, eligibility_nationalities as array, degree_levels as array). Enables precise filtering and comparison in later phases.
- Separate tables for raw scraped records and canonical scholarships, linked via foreign key (nullable until matched). Source-level records preserved separately from canonical merged records. Matches AGGR-04 requirement.
- Rich source cataloging — trust level, scrape frequency, last_scraped, consecutive_failures, plus source category (official/university/aggregator/government/foundation), geographic coverage, data quality rating, notes field. Supports both Phase 2 source discovery and Phase 3-5 admin workflow.
- Indexes defined for all planned filter combinations (country, degree level, field of study, funding type, nationality eligibility, deadline).

### Python environment
- Package manager: uv (fast, Rust-based, handles venvs and lockfiles via pyproject.toml)
- Scrapy project structure inside `scraping/src/scholarhub_scraping/` with spiders/, pipelines/, items.py, settings.py, convex_client.py
- Convex Python SDK for Python → Convex communication (not raw HTTP)
- Strict Ruff linting — additional rule sets enabled (type annotations enforced, docstrings required, import sorting, no Any types)

### Placeholder page
- Branded "coming soon" page with ScholarHub name, tagline, and neo-brutalism styling — sets the visual tone early
- TanStack Router set up with route tree — only `/` renders content, but routing foundation is ready for Phase 5-6 to add /admin and /scholarships routes

### CI/CD setup
- GitHub Actions on push to main: lint (Biome) → type check (tsc) → deploy to Netlify
- GitHub Actions on PR: lint + type check only
- Scraping CI deferred to Phase 3

### Convex environment strategy

### Claude's Discretion
- Convex environment strategy (dev vs prod deployments, env var management) — Claude picks what works best for solo-dev-now, real-data-later situation
- Enum/union type approach for constrained fields (degree level, funding type, source category, trust levels) — Claude picks what works best with Convex patterns

### Linting & formatting
- TypeScript: Biome (linting + formatting in one tool)
- Python: Ruff with strict configuration (type annotations enforced, docstrings required, import sorting, no Any types)

### Testing setup
- Full test strategy from Phase 1: Vitest for TypeScript, pytest for Python
- Coverage threshold: 80% minimum enforced in CI
- Test directory structures and CI integration configured from the start, ready for TDD from Phase 2 onwards

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project definition
- `.planning/PROJECT.md` — Stack constraints, key decisions, monorepo + neo-brutalism decisions
- `.planning/REQUIREMENTS.md` — INFR-01, INFR-02, INFR-03 are the Phase 1 requirements; also review schema-relevant fields from DTLP-* and PDIR-* requirements for schema design
- `.planning/ROADMAP.md` — Phase 1 success criteria (4 criteria that must be TRUE)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing code

### Established Patterns
- None yet — Phase 1 establishes the patterns all later phases will follow

### Integration Points
- Convex schema is the integration point between web app and scraping pipeline
- Python SDK client connects the scraping side to Convex
- TanStack Router route tree is the integration point for all future frontend pages

</code_context>

<specifics>
## Specific Ideas

- Neo-brutalism styling on the placeholder page — bold, high-contrast, distinctive (inspiration: neobrutalism.dev, Dribbble examples)
- Convex schema should be comprehensive enough to support all PDIR and DTLP requirements without major schema changes later

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-20*
