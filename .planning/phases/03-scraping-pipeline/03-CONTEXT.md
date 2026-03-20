# Phase 3: Scraping Pipeline - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Build an automated scraping system that pulls scholarship data from all 201 cataloged sources, lands raw records in Convex staging tables, runs on a GitHub Actions schedule with monitoring for silent scraper rot. Covers requirements SCRP-01 through SCRP-07 and INFR-04. The pipeline must stay within Convex free tier limits (1M function calls/month) and GitHub Actions free tier (public repo, unlimited minutes).

</domain>

<decisions>
## Implementation Decisions

### Scrape rollout scope
- Build scrapers for ALL 201 cataloged sources in Phase 3 — no subset
- Claude writes and tests all 201 source configs during execution
- Auto with spot checks: Claude writes/tests all configs, user spot-checks a few per category
- Design the pipeline architecture for 1000+ sources (future-proofing) even though current catalog has 201
- Go live with all 201 sources at once after Phase 3 is complete — no staged rollout

### Scrape method hierarchy (structured-data-first)
- Priority cascade for each source, determined at config creation time (not runtime):
  1. **API** — if available, most reliable
  2. **JSON-LD / Schema.org** — embedded structured data, stable across redesigns
  3. **AJAX/XHR endpoints** — internal APIs powering the frontend
  4. **RSS/Atom feeds** — machine-readable, stable
  5. **HTML scraping** — last resort, most brittle
  6. **Scrapling** — for Cloudflare-protected and JS-rendered sources
- Each source config specifies **primary + secondary** method (explicit fallback per source, not always HTML)
- If API source fails, auto-fallback to HTML scraping for that run
- If non-Scrapling source gets blocked (403/CAPTCHA), auto-upgrade to Scrapling for that run, log for config review
- JSON-LD: extract ALL structured data on the page (not just scholarship types), filter during normalization
- AJAX: use Scrapling's browser runtime network interception to auto-discover XHR/fetch endpoints
- Sitemap.xml: use as additional discovery method for sources without clear listing pages

### Scraping framework
- **Evaluate Scrapy vs Scrapling** — Claude researches both during planning/execution
- Lean toward Scrapling (user preference) — give it benefit of the doubt unless it clearly falls short
- Evaluation criteria (equal weight): community & maturity, feature completeness, code simplicity, GitHub Actions compatibility
- If Scrapling is chosen: **remove Scrapy entirely** (items.py, pipelines.py, settings.py, spiders/)
- If Scrapling chosen: rename Python package to match framework (not scholarhub_scraping)
- Scrapling handles JS-rendered pages and CAPTCHAs via its anti-bot features

### Source config architecture
- **Separate config directory**: `scraping/configs/` (not embedded in source catalog JSON)
- **Python modules** — each source gets its own .py file with custom logic capability
- **Strict protocol/base class**: SourceConfig protocol with required fields (url, primary_method, secondary_method, selectors, field_mappings)
- **Base config inheritance**: try to use base classes per source type (BaseAggregatorConfig, etc.) for shared behavior. Fall back to flat standalone configs if inheritance gets messy
- **Category prefix naming**: `agg_scholarshipportal.py`, `off_daad.py`, `gov_anu.py`
- Organization: Claude decides (flat vs. by-category subdirectories)
- **Auto-scan discovery**: pipeline scans configs directory at runtime, discovers all modules implementing SourceConfig protocol
- Optional auth field in config (hook for future use, not populated in v1)
- Detail page scraping is **configurable per source** — some sources need detail pages for full data, others have everything on listings
- Git is source of truth for configs — no hot-reload, changes require commit to main
- Config auto-update: when fuzzy fallback discovers new selectors, auto-commit to a 'config-updates' branch in GitHub Actions
- Pipeline semver versioning in pyproject.toml, auto-generated changelog from conventional commits

### Data extraction
- **Best-effort extraction** — extract whatever each source provides, don't force-parse missing fields
- **Normalize in Phase 3** — standardize country names, parse dates to ISO 8601, normalize currency codes during scraping
- Store extracted JSON in raw_data field (not full page HTML)
- **Permissive + quality flag** — insert all records but flag quality issues:
  - Missing required fields (title, source_url)
  - Unparseable dates
  - Unrecognized countries
  - Suspiciously short content (<5 char title, <20 char description)
- **Store partial + quality flag** — insert records with whatever was extracted, quality flag indicates completeness
- **Basic dedup in Phase 3** — within a single source, skip re-inserting records by external_id or source_url. Cross-source dedup is Phase 4
- **Upsert + keep history** — upsert raw_records by source + source_url, store field-level diffs in change_log table
- **Field-level diff** for change detection — compare each field individually, track which fields changed
- **Prefer English versions** — if source has English version, use it. If only non-English, scrape anyway
- **Sanitize on scrape AND display** — basic sanitization on scrape (strip HTML), full sanitization on frontend display. Defense in depth
- Claude decides: field mapping approach (strict schema vs. flexible with raw_data fallback), language handling at extraction time

### Pagination
- **Follow all pages** — exhaust all pagination (HTML and API cursor-based)
- **Focus on latest scholarships** — scrape newest-first where possible (sort by date descending)
- **3-month cutoff** — stop paginating when hitting scholarships with deadlines >3 months expired
- Old scholarships are not errors — if they come along, insert them
- RSS feeds: **dedicated RSS spider** with feed + follow link approach (extract basic from feed, follow each entry link for full data)

### Rot detection & alerting
- **5 consecutive failures** threshold triggers alert
- **Yield drop detection** — flag when a source returns significantly fewer results than historical average
- **Auto-deactivate** sources after hitting failure threshold (consecutive failures, site permanently gone 404/410, low value/zero yield)
- **Auto-reactivate**: manual CLI command + periodic auto-retry of deactivated sources (weekly test scrape)
- **Convex health table** — per-source health status: healthy/degraded/failing, last_yield, consecutive_failures, yield_trend
- **Heartbeat check** — each run updates last_heartbeat in Convex. Convex cron checks for stale heartbeat to detect if GitHub Actions stops running
- **GitHub Issues for alerts** — auto-create structured issue (source name, URL, error type, failure count, last success, suggested fix) with 'scraper-rot' label
- **Track issue status in Convex** — source_health table tracks whether an issue exists, preventing duplicate issues
- **Auto-close issues** when source recovers (successful scrape after being failing)
- Claude decides: alerting mechanism, auto-deactivate vs keep-trying behavior

### Fuzzy fallback heuristic
- When configured selectors break, try heuristic fallback (not LLM-based):
  - Common CSS patterns (table tr, .scholarship-item, .listing-card, article)
  - Structural analysis (repeating DOM structures)
  - Text pattern matching (dates, currency, degree keywords)
  - Previous successful selectors from similar source types
- **Auto-update config** when fuzzy fallback succeeds — auto-commit new selectors to config-updates branch

### Error handling
- **Detailed error categories**: network_error, timeout, rate_limited, blocked (403/captcha), parse_error, empty_results, schema_change
- **Rate-limited (429)**: exponential backoff retry (1s, 2s, 4s, 8s) up to 3-5 attempts
- **Blocked (403/CAPTCHA)**: auto-upgrade to Scrapling for the run
- **Temporary downtime (502/503/timeout)**: retry with backoff, 2-3 attempts
- **Batch mutation failure**: retry failed records individually, continue with remaining sources
- Claude decides: per-source-type rate limits (APIs faster, HTML sources longer delays, Scrapling careful)

### Run cadence & orchestration
- **Respect per-source frequency** — only scrape when enough time has passed since last run (based on scrape_frequency_hours in catalog)
- **Manual triggers**: both workflow_dispatch (GitHub Actions) AND local CLI (`scrape run --source X --wave Y`)
- **Local + Actions**: same pipeline runs locally for dev and on GitHub Actions for production
- **Proxy support built in** — architecture supports proxy config per source, not purchased for v1
- **Execution grouping by scrape method** — API sources together, HTML together, Scrapling together
- **Dynamic priority scoring**: score based on historical yield + reliability + data freshness + data completeness. Claude decides how score affects execution
- Claude decides: workflow orchestration strategy (single vs. multi-workflow), timeout handling, concurrency level, scheduling time, run isolation model, graceful shutdown behavior
- Workflow triggers: schedule + workflow_dispatch + Claude decides which additional triggers (PR merge, webhook) to implement

### Yield reporting
- **Both Convex + GitHub Actions** — structured data in Convex for admin dashboard, human-readable summary in GitHub Actions
- **All metrics**: records found per source, new vs. updated vs. unchanged, success/failure rate, run duration & cost
- **Explicit run lifecycle**: Convex generates run ID via startRun mutation → scrape sources → completeRun mutation with summary stats
- **Per-source telemetry**: scrape duration, records extracted, bytes downloaded, memory peak. Stored in scrape_run_sources

### Convex schema changes
- New tables: **scrape_runs**, **source_health**, **scrape_run_sources**, **change_log** (plus Claude decides any additional)
- Claude decides: scrapeMethodValidator expansion (jsonld, ajax) vs config-level granularity
- Claude decides: source table runtime fields vs separate source_health table
- Claude decides: Convex function naming convention, batch mutation design, run ID generation
- **Hybrid Python/Convex**: scraping in Python, some processing in Convex actions (dedup check, health update, run lifecycle)
- **Batch inserts** — minimize Convex function calls to stay within free tier
- **Buffer and batch** — if Convex is slow, keep scraping at full speed, buffer records, send in larger batches
- **Convex cron jobs**: raw records cleanup (90-day retention), heartbeat stale check, change log cleanup (90-day)
- **Webhook endpoint** — Convex HTTP action for sources to POST data (HMAC signature verification)
- **Pre-build query layer** — create Convex queries now: getRecentRuns, getSourceHealth, getFailingSources, getRunStats. Ready for Phase 5 dashboard

### Free tier constraint (HARD REQUIREMENT)
- **Everything must stay within free tiers** — Convex (1M function calls/month, storage limits), GitHub Actions (public repo = free)
- Aggressively optimize Convex function calls — batch everything, minimize round-trips
- Convex dashboard for usage monitoring — no custom tracking
- Claude designs all batch sizes and call patterns to stay comfortably within limits
- 90-day retention for raw_records and change_logs to manage storage
- Claude decides: storage management beyond retention crons

### GitHub Actions configuration
- **Public repo with GitHub Student account** — unlimited Actions minutes
- Robots.txt: **NOT obeyed** (ROBOTSTXT_OBEY = False)
- User-Agent: **generic browser UA** with **rotation** (10-20 realistic browser UAs, randomly selected)
- **Run tests before scraping** in scheduled workflow (pytest → scrape)
- **CI validates configs** on PR: schema check, import test, fixture test for modified configs
- **CI enforces config-catalog sync** — fails PR if active source has no matching config
- Permissions: write to repo (auto-commit configs), create issues (rot alerts), upload artifacts (buffer/debug)
- **Structured JSON logs** for pipeline output
- Claude decides: log verbosity for public workflow logs, Docker vs apt-get for Scrapling/Chromium setup

### Resilience
- **Buffer locally, retry later** if Convex is down during scrape
- **GitHub Actions artifacts** for buffer storage (ephemeral runner → upload as artifacts)
- **No concern about geo-blocking** — accept whatever US datacenter IP sees
- **Trust the framework** for memory management (7GB runner RAM)

### Testing strategy
- **Both: fixtures + periodic live** — unit tests use saved fixtures (fast, CI-safe), separate scheduled job runs live integration tests
- **All 201 sources** must have at least one fixture test
- **Record-playback** test harness: first run records HTTP responses to fixture files, subsequent runs replay. `pytest --record` to refresh
- **Focus on pipeline core** for coverage: pipeline framework, Convex ingestion, normalization thoroughly tested. Individual configs get fixture-based smoke tests
- **Unit + integration tests** for all 7 CLI commands
- Claude decides: fixture refresh frequency (weekly/monthly)

### CLI tooling
7 CLI subcommands:
1. `scrape run` — run scraping (--dry-run, --source, --wave flags)
2. `scrape status` — recent runs, health summary, failing sources
3. `scrape gen-config` — auto-generate starter config from URL (fetch, analyze page structure, detect best method, suggest selectors, output Python config)
4. `scrape export` — export data from Convex as JSON/CSV
5. `scrape validate` — validate all config files (schema, import, fixtures)
6. `scrape reactivate` — re-enable deactivated source + trigger test scrape
7. `scrape health` — detailed per-source health report with telemetry
- **--dry-run mode** writes results to local JSON instead of Convex
- **Test seed script** — populate Convex with realistic fake scholarship data for Phase 4/5 development
- Telemetry visualization: CLI for quick terminal checks + Phase 5 admin dashboard for rich charts

### Auth-required sources
- **Skip in v1** — don't scrape auth-required sources. Focus on ~180+ sources that don't need auth
- Auth hook in config protocol (optional field, not populated)

### Documentation
- **Config writing guide** — structure, required fields, examples per source type
- **Pipeline operations guide** — run locally, trigger manually, read reports, debug failures
- **Architecture overview** — data flow, component diagram, Convex integration

### Dependencies
- **Pin exact versions** in uv.lock
- Performance target: **moderate, reliable** — 3-4 hours for all sources is fine if fewer blocks/errors

### GitHub Issues format
- Structured template: source name, URL, error type, consecutive failure count, last successful run, suggested fix
- Labels: 'scraper-rot', severity level
- Track issue status in Convex source_health to prevent duplicates
- Auto-close when source recovers

### Claude's Discretion
- Scraping framework final decision (Scrapy vs Scrapling) after evaluation
- Spider architecture (generic spiders + config vs per-source)
- Config directory organization (flat vs subdirectories)
- Config inheritance design (base classes if it works cleanly)
- Workflow orchestration strategy (timeout handling, parallel jobs, matrix)
- Concurrency level per source type
- Scheduling time/timezone
- Log verbosity for public repos
- Docker vs apt-get for Scrapling
- Convex function naming conventions
- Batch mutation sizes
- Data flow (direct to Convex vs local staging)
- Config versioning (git history vs version field)
- Session/cookie management per source type
- Run isolation model (per-source vs shared state)
- Graceful shutdown behavior
- Score-based frequency adjustment
- Additional workflow triggers
- Storage management beyond crons
- Fixture refresh frequency
- Field mapping approach (strict vs flexible)
- Source execution build order during Phase 3

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project definition
- `.planning/PROJECT.md` — Stack constraints (Python scraping + Convex), API-first strategy, free tier constraint, monorepo structure
- `.planning/REQUIREMENTS.md` — SCRP-01 through SCRP-07 (scraping pipeline) and INFR-04 (monitoring) are Phase 3 requirements
- `.planning/ROADMAP.md` — Phase 3 success criteria (5 criteria that must be TRUE)

### Prior phase context
- `.planning/phases/01-foundation/01-CONTEXT.md` — Convex schema design, Python environment (uv, Ruff strict, pytest), monorepo layout, Scrapy skeleton, testing setup (80% coverage)
- `.planning/phases/02-source-discovery/02-CONTEXT.md` — Source catalog format, wave system (1-7), scrape method annotation, API-first philosophy, URL validation tooling, quality bar

### Convex schema
- `web/convex/schema.ts` — Current tables: sources (with wave, has_api, auth_required), raw_records (with scrape_run_id, external_id), scholarships. Phase 3 must add: scrape_runs, source_health, scrape_run_sources, change_log tables

### Source catalog
- `scraping/sources/aggregators.json` — 201 sources with scrape_method, wave, has_api, estimated_volume, geographic_coverage, notes (API URLs, CF status)
- `scraping/sources/schema.json` — JSON Schema for source catalog validation
- `scraping/sources/README.md` — Source entry template and field documentation

### Existing code
- `scraping/src/scholarhub_scraping/` — Scrapy skeleton (may be replaced): items.py, pipelines.py, settings.py, convex_client.py
- `.github/workflows/ci.yml` — Existing CI with validate-sources job
- `.github/workflows/deploy.yml` — Netlify deployment workflow

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scraping/src/scholarhub_scraping/convex_client.py` — Convex Python SDK client wrapper. Extend for batch mutations and run lifecycle
- `scraping/src/scholarhub_scraping/items.py` — ScholarshipItem with all extraction fields. May be replaced if switching from Scrapy, but field list is reusable
- `scraping/sources/*.json` — 201 source entries with scrape_method, wave, has_api, estimated_volume, notes (API URLs, CF flags)
- `web/convex/schema.ts` — Validators (scrapeMethodValidator, sourceCategoryValidator, trustLevelValidator) and raw_records table with indexes

### Established Patterns
- Convex validators use `v.union(v.literal(...))` for enums (Phase 1)
- Python uses uv + strict Ruff linting (type annotations, docstrings, no Any)
- Tests in `scraping/tests/` (pytest) and `web/` (Vitest), 80% coverage threshold
- Source catalog uses JSON Schema validation in CI

### Integration Points
- Scraping pipeline → Convex raw_records table via Python SDK (batch mutations)
- Source catalog JSON → pipeline configs (CI enforces sync)
- GitHub Actions scheduled workflow → Python pipeline → Convex
- New Convex tables (scrape_runs, source_health) → Phase 5 admin dashboard queries
- Convex crons → cleanup (90-day retention) and heartbeat monitoring

</code_context>

<specifics>
## Specific Ideas

- "First try API, JSON-LD, AJAX and other advanced scrapes which don't change. If nothing is present, then HTML" — structured-data-first hierarchy is a core principle
- Scrapling has grown significantly — evaluate it as primary framework, not just CF fallback
- Everything must run on free tier — this is a hard constraint, not a soft goal
- Public repo with GitHub Student account — unlimited Actions minutes but public logs
- No robots.txt compliance — scholarship data is public information for student benefit
- Config auto-update with fuzzy fallback is a self-healing mechanism — configs improve over time
- "Focus on latest scholarships which have dates" — pagination should prioritize recent, not exhaustively scrape archives

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. All discussed features are within the scraping pipeline boundary.

</deferred>

---

*Phase: 03-scraping-pipeline*
*Context gathered: 2026-03-20*
