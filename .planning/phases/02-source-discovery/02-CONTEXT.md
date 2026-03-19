# Phase 2: Source Discovery - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Build a comprehensive, structured catalog of scholarship sources — primarily aggregators and official programs — each annotated with scrape strategy, wave assignment, and metadata. The catalog feeds the Phase 3 scraping pipeline. Universities are deferred to later. The output is JSON seed files in the repo + a Convex upsert mutation + validation/stats tooling.

</domain>

<decisions>
## Implementation Decisions

### Catalog storage format
- JSON seed files checked into repo at `scraping/sources/`, organized by source category (e.g., `aggregators.json`, `official_programs.json`, `government.json`, `foundations.json`)
- Files split by region if >200 entries (e.g., `universities_europe.json`) — though universities are deferred for now
- Convex `sources` table is the runtime copy — seed files are the source of truth
- Idempotent seed script using upsert by URL — safe to re-run, never creates duplicates
- Convex mutation (`sources.upsertSource`) handles find-by-URL + create-or-update logic — seed script calls it via HTTP API
- JSON Schema validates seed file entries; CI runs validation on every PR
- Stats CLI script reports catalog coverage (per-category count, per-region count, total)
- README in `scraping/sources/` with template entry showing all fields and valid values
- Separate tooling guide for running scripts (validate, seed, stats)
- Source deactivation via `is_active: false` — never delete entries from JSON files
- Git history is sufficient for versioning — no per-entry timestamps

### Discovery method
- AI-assisted research: Claude systematically researches sources, outputs JSON entries in batches of 10-20 for user review
- Strategy: seed with Claude-generated starter list (~100-200 known sources), then expand to target via systematic research
- **Aggregators first** — focus on ~50 aggregators across 4-5 waves (by size/reputation, biggest first). Aggregators compile many scholarships, reducing need for individual sources
- Then official programs (~200), then government programs (~100)
- Universities deferred entirely — not in this phase's catalog
- Foundations grouped with government wave
- Research organized by mixed approach (Claude determines optimal category/region ordering)
- Quality bar: source URL must be active and contain actual scholarship data (not just blog posts), updated in past year
- International focus, all regions — no geographic bias
- English pages preferred — catalog English version where available, skip sources only in non-English
- Include RSS feed sources (machine-readable), skip email newsletters
- Verify each discovered URL is reachable during execution
- Detect Cloudflare protection during discovery — pre-tag `scrape_method: scrapling`
- API-first per source: find APIs before falling back to scraping, HTTP scraper as last resort
- Note API availability for aggregators in scrape_method + notes fields
- Include auth-required sources but flag them (lower priority for scraping)
- Must-have checklist: 20-30 major programs + top aggregators in `scraping/sources/MUST_HAVE.md` — Claude generates, user reviews. Phase not complete until all must-haves are cataloged (hard requirement)

### Source annotation depth
- Semi-structured notes field with consistent key prefixes: `API: <url>`, `Fields: title, deadline, amount`, `CF: yes`, `Volume: ~500`, `Auth: free registration required`
- Estimated scholarship volume captured in notes (rough count per source)
- Scrape frequency (`scrape_frequency_hours`) estimated during discovery based on source update patterns
- Geographic coverage field populated during discovery (countries/regions the source covers)
- Available data fields noted (e.g., "provides: title, deadline, amount, eligibility, country")
- Default trust level: `needs_review` for all new sources
- Cloudflare presence: flag `CF: yes` in notes — no need to categorize protection type
- Auth-required sources: note auth type in notes (`Auth: API key needed`), credentials never in JSON files

### Priority & ordering (wave system)
- Wave 1-5: Aggregators (by size/reputation — top-tier first, niche last)
- Wave 6: Official programs (DAAD, Fulbright, Chevening, MEXT, Erasmus, etc.)
- Wave 7: Government programs + foundations
- Universities: deferred to later (not in this phase)
- Wave number field added to Convex `sources` schema and seeded from JSON files
- 1000+ target is a soft goal — quality aggregator coverage matters more than raw count

### URL validation tooling
- Standalone Python script (`validate_sources.py`) — checks all catalog URLs for reachability
- Uses Scrapling for CF-protected URL validation
- Async with concurrency limit (~20 concurrent requests), 10-second timeout per URL
- Follow redirects, report final URL if different from catalog URL
- Flag CF-protected URLs as "CF protected" (not dead)
- Output: console summary + `validation_report.json` detailed results
- Also handles duplicate source detection via URL normalization (strip www, trailing slashes, query params, force HTTPS)
- Same-domain different-path URLs allowed with review (flagged, not auto-rejected)
- Cross-file duplicate URLs flagged for manual category decision
- Reachability check only — no content sniffing

### Schema evolution
- Add new fields to Convex `sources` table: `wave` (number), `auth_required` (boolean), `has_api` (boolean), `estimated_volume` (string)
- Schema migration is first task in Phase 2 execution
- Add appropriate indexes for wave-based queries
- Consider adding `rss` to scrapeMethodValidator

### Research output review
- Batch review per wave: Claude outputs 10-20 sources per batch, user approves/rejects/modifies individual entries
- Per-source approve/reject granularity within each batch
- No research provenance tracking — just the resulting catalog entries

### Seed data testing
- Unit tests with mocked Convex calls for seed script logic (JSON parsing, upsert preparation, validation)
- Test fixtures with ~5 sample source entries covering each category
- Vitest tests for Convex `upsertSource` mutation (create, update, duplicate handling)

### Monitoring & catalog management
- Stats script output for tracking catalog growth (Claude's discretion on geo breakdown)
- Coverage report scope at Claude's discretion
- Seed script run manually after catalog changes — not automated in CI
- Source retirement: always mark inactive, never delete from JSON files

### Claude's Discretion
- Seed script runner choice (Python CLI vs. Convex-called — likely Python CLI given architecture)
- Data quality rating approach during discovery
- Coverage report format and scope
- Wave field implementation details (required vs. optional, compound indexes)
- Whether to add 'rss' as scrapeMethodValidator option or use 'api'
- API verification depth per source (catalog existence only vs. light test)
- Source overlap tracking between aggregators
- Robots.txt checking during validation
- Rate limit capture in notes (if discovered during research)
- Scraping effort estimates per wave
- Foundation grouping (with government or separate wave)
- Stats script geo breakdown

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project definition
- `.planning/PROJECT.md` — Stack constraints (Python scraping + Convex + monorepo), key decisions, API-first scraping strategy
- `.planning/REQUIREMENTS.md` — SRCD-01 through SRCD-05 are Phase 2 requirements; also review SCRP-* for downstream scraping context
- `.planning/ROADMAP.md` — Phase 2 success criteria (4 criteria that must be TRUE)

### Prior phase context
- `.planning/phases/01-foundation/01-CONTEXT.md` — Convex schema design decisions, Python environment setup (uv, Ruff, pytest), monorepo layout

### Convex schema
- `web/convex/schema.ts` — Current sources table definition, validators (scrapeMethodValidator, sourceCategoryValidator, trustLevelValidator). Phase 2 must extend this with wave, auth_required, has_api, estimated_volume fields

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `web/convex/schema.ts` — Source validators and table definition already exist. Extend with new fields, don't rewrite.
- `scraping/src/scholarhub_scraping/convex_client.py` — Convex Python SDK client already configured. Seed script can use this.
- `scraping/pyproject.toml` — Python project configured with uv, Ruff strict linting, pytest. Add Scrapling + aiohttp as Phase 2 dependencies.

### Established Patterns
- Convex validators use `v.union(v.literal(...))` pattern for enums (established in Phase 1)
- Python code under `scraping/src/scholarhub_scraping/` with strict Ruff linting (type annotations enforced, docstrings required)
- Tests in `scraping/tests/` (pytest) and `web/` (Vitest)

### Integration Points
- Seed script → Convex `sources` table via HTTP API (upsertSource mutation)
- JSON Schema validates seed files → CI step validates on PR
- Validation script reads JSON files + makes HTTP requests to source URLs
- Stats script reads JSON files and outputs coverage report

</code_context>

<specifics>
## Specific Ideas

- Aggregators are the primary focus because they already compile scholarship data — 50 good aggregators may cover more scholarships than 500 individual university pages
- API-first philosophy: find APIs before resorting to scraping, use Scrapling only for CF-protected sites, standard HTTP scraper as absolute last resort
- Semi-structured notes format enables both human readability and potential machine parsing later
- Wave system enables incremental Phase 3 execution — start scraping wave 1 while still researching wave 5

</specifics>

<deferred>
## Deferred Ideas

- University-specific scholarship pages — will be added as a future expansion after aggregators + official programs + government sources are solid
- Domestic scholarships — v2 scope per PROJECT.md
- Automated CI-based seeding — currently manual, may automate later
- Name-based fuzzy dedup for sources — URL dedup is sufficient for now
- Email newsletter sources — too complex for now, may revisit

</deferred>

---

*Phase: 02-source-discovery*
*Context gathered: 2026-03-20*
