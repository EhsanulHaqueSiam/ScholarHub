# Phase 3: Scraping Pipeline - Research

**Researched:** 2026-03-20
**Domain:** Web scraping pipeline architecture, Scrapling framework, Convex batch ingestion, GitHub Actions scheduling
**Confidence:** HIGH

## Summary

Phase 3 builds an automated scraping system for 201 cataloged scholarship sources (191 active after excluding auth-required), landing raw records in Convex staging tables via the Python SDK, running on a GitHub Actions schedule with monitoring for scraper rot. The architecture must handle three scrape method tiers: API/JSON-LD/AJAX (structured-data-first), standard HTTP scraping, and Scrapling for Cloudflare-protected sites.

The user strongly leans toward **Scrapling** as the primary framework (replacing Scrapy). Research confirms Scrapling v0.4.2 is a viable choice: it provides a Scrapy-compatible Spider API with `start_urls`, async `parse` callbacks, `response.follow()` for pagination, configurable concurrency, and built-in anti-bot bypass via StealthyFetcher/Camoufox. It supports all three fetcher tiers (HTTP, dynamic browser, stealthy browser) within a single framework, eliminating the need for separate tools. Scrapy's existing skeleton code (items.py, pipelines.py, settings.py, spiders/) should be removed entirely.

**Convex free tier budget is comfortable:** Estimated ~6,100 function calls/month for scraping (0.6% of 1M limit), leaving 994K calls for frontend/dashboard. The key optimization pattern is batch mutations -- a single `internalMutation` accepting an array of documents, called via the Python SDK with admin auth (`set_admin_auth(deploy_key)`). Each mutation can write up to 16,000 documents / 16 MiB, so batches of 50-100 records per call are safe and efficient.

**Primary recommendation:** Use Scrapling as the sole scraping framework, with `on_scraped_item` hook for real-time Convex ingestion, `extruct` for JSON-LD extraction, `feedparser` for RSS feeds, and `click` for the CLI. Structure configs as Python modules in `scraping/configs/` with a strict `SourceConfig` protocol.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- Build scrapers for ALL 201 cataloged sources in Phase 3 -- no subset
- Claude writes and tests all 201 source configs during execution (auto with spot checks)
- Design pipeline architecture for 1000+ sources (future-proofing)
- Go live with all 201 sources at once after Phase 3
- Structured-data-first scrape method hierarchy: API > JSON-LD > AJAX/XHR > RSS > HTML > Scrapling
- Each source config specifies primary + secondary method (explicit fallback)
- Separate config directory: `scraping/configs/` with Python modules
- Strict protocol/base class: SourceConfig with required fields
- Category prefix naming: `agg_scholarshipportal.py`, `off_daad.py`, `gov_anu.py`
- Auto-scan discovery: pipeline scans configs directory at runtime
- Best-effort extraction with permissive + quality flag approach
- Upsert + keep history for raw_records by source + source_url
- Field-level diff for change detection stored in change_log table
- Follow all pages with 3-month cutoff for expired scholarships
- 5 consecutive failures threshold triggers alert
- Auto-deactivate sources after hitting failure threshold
- Convex health table (source_health) for per-source status tracking
- GitHub Issues for alerts with 'scraper-rot' label, auto-close on recovery
- Fuzzy fallback heuristic (not LLM-based) with auto-config-update on success
- Detailed error categories: network_error, timeout, rate_limited, blocked, parse_error, empty_results, schema_change
- Rate-limited (429): exponential backoff retry up to 3-5 attempts
- Blocked (403/CAPTCHA): auto-upgrade to Scrapling for the run
- Respect per-source frequency from catalog
- Manual triggers: both workflow_dispatch AND local CLI
- Execution grouping by scrape method
- Both Convex + GitHub Actions for yield reporting
- Explicit run lifecycle: startRun -> scrape -> completeRun
- New Convex tables: scrape_runs, source_health, scrape_run_sources, change_log
- Hybrid Python/Convex: scraping in Python, processing in Convex actions
- Batch inserts to minimize Convex function calls
- Buffer and batch if Convex is slow
- Convex cron jobs: 90-day retention cleanup, heartbeat stale check
- Webhook endpoint with HMAC signature verification
- Pre-build query layer: getRecentRuns, getSourceHealth, getFailingSources, getRunStats
- HARD REQUIREMENT: Everything within free tiers (Convex 1M calls/month, GitHub Actions public repo)
- Public repo with GitHub Student account -- unlimited Actions minutes
- Robots.txt NOT obeyed (ROBOTSTXT_OBEY = False)
- Generic browser UA with rotation (10-20 realistic UAs)
- Run tests before scraping in scheduled workflow
- CI validates configs on PR: schema check, import test, fixture test
- CI enforces config-catalog sync
- Structured JSON logs for pipeline output
- Buffer locally with GitHub Actions artifacts if Convex is down
- Both fixtures + periodic live testing
- All 201 sources must have at least one fixture test
- Record-playback test harness with `pytest --record`
- 7 CLI subcommands: run, status, gen-config, export, validate, reactivate, health
- --dry-run mode writes to local JSON
- Test seed script for fake scholarship data
- Skip auth-required sources in v1 (auth hook in config for future)
- Pin exact versions in uv.lock
- Performance target: moderate, reliable (3-4 hours for all sources is fine)
- Evaluate Scrapy vs Scrapling -- lean toward Scrapling
- If Scrapling chosen: remove Scrapy entirely, rename package
- Pipeline semver versioning in pyproject.toml

### Claude's Discretion

- Scraping framework final decision (Scrapy vs Scrapling) after evaluation
- Spider architecture (generic spiders + config vs per-source)
- Config directory organization (flat vs subdirectories)
- Config inheritance design (base classes if it works cleanly)
- Workflow orchestration strategy (timeout handling, parallel jobs, matrix)
- Concurrency level per source type
- Scheduling time/timezone
- Log verbosity for public repos
- Docker vs apt-get for Scrapling browser deps
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

### Deferred Ideas (OUT OF SCOPE)

None -- discussion stayed within phase scope. All discussed features are within the scraping pipeline boundary.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SCRP-01 | Automated scraping pipeline uses API-first approach when available | Scrapling Fetcher for HTTP API calls; structured-data-first hierarchy with extruct for JSON-LD; per-source config specifies primary method |
| SCRP-02 | Standard HTTP scraping fallback when no API exists | Scrapling Fetcher (fast HTTP) + Spider API with CSS/XPath selectors; 190 of 201 sources use standard scrape method |
| SCRP-03 | Scrapling-based scraping for Cloudflare-protected sites | StealthyFetcher (Camoufox-based) with auto-upgrade from 403/CAPTCHA; 10 sources pre-tagged as scrapling; `scrapling install` for browser deps |
| SCRP-04 | GitHub Actions runs scraping on automated schedule | Cron-triggered workflow with uv setup, Scrapling browser install step; workflow_dispatch for manual triggers |
| SCRP-05 | Scraped data lands in staging area (raw records) | Existing raw_records table with source_id, external_id, scrape_run_id; batch insert via internalMutation + Python SDK admin auth |
| SCRP-06 | Each scrape run logs yield metrics | scrape_runs + scrape_run_sources tables; CrawlResult.stats from Scrapling; per-source telemetry stored in Convex |
| SCRP-07 | "Last verified" timestamp tracked per scholarship per source | Update last_scraped on sources table + last_verified field on records; Convex server-side timestamps |
| INFR-04 | Scraping monitoring -- track yield metrics, detect silent scraper rot | source_health table with consecutive_failures, yield_trend; GitHub Issues auto-creation; heartbeat check via Convex cron |

</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| scrapling | 0.4.2 | Primary scraping framework (HTTP, browser, anti-bot) | Scrapy-compatible Spider API + built-in Cloudflare bypass + adaptive element tracking. Single framework replaces Scrapy + Playwright + custom anti-bot. User preference with strong justification |
| convex (Python) | 0.7.0 | Database client for Convex backend | Official Python SDK; supports mutation/query/action calls; admin auth for internal functions |
| extruct | 0.18.0 | JSON-LD / Schema.org / microdata extraction from HTML | De facto standard for extracting structured data from web pages; handles all major formats (JSON-LD, microdata, RDFa, OpenGraph) |
| feedparser | 6.0.12 | RSS/Atom feed parsing | Gold standard for feed parsing; handles malformed XML gracefully; 15+ years of development |
| click | 8.3.1 | CLI framework for `scrape` subcommands | Battle-tested, composable CLI groups; nesting of 7 subcommands is native |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| pycountry | 26.2.16 | Country name normalization (ISO 3166) | Standardize country names from varied source formats to ISO codes |
| python-dateutil | 2.9.0.post0 | Date parsing and normalization to ISO 8601 | Parse varied date formats from scholarship pages |
| structlog | 25.5.0 | Structured JSON logging | Pipeline logs as structured JSON for GitHub Actions and debugging |
| rich | 14.3.3 | Terminal output formatting for CLI | Pretty tables, progress bars, colored output for CLI commands |
| python-dotenv | 1.2.2 | Environment variable loading | Already in use; loads CONVEX_URL from .env.local |
| httpx | 0.28.1 | HTTP client for API-based sources | Async HTTP for direct API calls (EURAXESS, DAAD APIs) where Scrapling's spider overhead is unnecessary |
| bleach or html-sanitizer | latest | HTML sanitization on scrape | Strip HTML tags from scraped descriptions; defense in depth |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Scrapling | Scrapy | Scrapy has larger ecosystem/maturity but requires separate tools for anti-bot (scrapy-playwright, scrapy-impersonate). Scrapling provides Cloudflare bypass, adaptive tracking, and browser automation built-in. User leans Scrapling. |
| click | typer | Typer wraps click with type hints, slightly more modern. Click is more established, project already uses click patterns, no meaningful difference for 7 commands. |
| extruct | manual JSON-LD parsing | extruct handles all structured data formats automatically; manual parsing would miss microdata/RDFa |
| structlog | stdlib logging | structlog provides structured JSON output natively, crucial for machine-readable GitHub Actions logs |

### Installation

```bash
cd scraping
uv add scrapling[fetchers] extruct feedparser click pycountry python-dateutil structlog rich httpx bleach
uv sync
# Install browser dependencies for Scrapling's StealthyFetcher
uv run scrapling install
```

**Version verification:** All versions confirmed against PyPI registry on 2026-03-20.

## Architecture Patterns

### Recommended Project Structure

```
scraping/
  pyproject.toml               # Renamed package, semver, dependencies
  src/
    scholarhub_pipeline/       # Renamed from scholarhub_scraping (if Scrapling chosen)
      __init__.py
      cli.py                   # Click CLI entry point with 7 subcommands
      pipeline/
        __init__.py
        runner.py              # Orchestrates scrape runs (startRun -> scrape -> completeRun)
        scheduler.py           # Respects per-source frequency, execution grouping
        buffer.py              # Local JSON buffer for Convex downtime
      scrapers/
        __init__.py
        base.py                # BaseSpider(Spider) with on_scraped_item hook for Convex
        api_scraper.py         # Direct API calls (httpx, no Spider needed)
        rss_scraper.py         # feedparser-based RSS/Atom scraper
        jsonld_extractor.py    # extruct-based JSON-LD extraction
        html_scraper.py        # Standard HTML scraping via Scrapling Spider
        stealthy_scraper.py    # StealthyFetcher-based for CF-protected sites
      ingestion/
        __init__.py
        convex_client.py       # Extended Convex client with admin auth + batch mutations
        batch.py               # Batch record accumulator, flush to Convex
        dedup.py               # Within-source dedup by external_id/source_url
        normalizer.py          # Country, date, currency normalization
        quality.py             # Quality flag logic (missing fields, suspiciously short, etc.)
        differ.py              # Field-level diff for change_log
      monitoring/
        __init__.py
        health.py              # Source health tracking (healthy/degraded/failing)
        rot_detector.py        # Consecutive failure tracking, yield drop detection
        github_issues.py       # Auto-create/close GitHub Issues for scraper rot
        heartbeat.py           # Heartbeat update for Convex cron monitoring
      configs/                 # Source-specific config modules (201 files)
        __init__.py             # Auto-scan discovery via importlib
        _protocol.py           # SourceConfig Protocol definition
        _bases.py              # BaseAggregatorConfig, BaseOfficialConfig, etc.
        agg_scholarshipportal.py
        agg_scholars4dev.py
        off_daad.py
        gov_anu.py
        ...                    # All 201 source configs
      utils/
        __init__.py
        ua_rotation.py         # 10-20 realistic browser User-Agent strings
        retry.py               # Exponential backoff retry logic
        fuzzy_fallback.py      # Heuristic selector recovery
        sanitizer.py           # HTML sanitization
  configs/                     # Alternative: flat config directory outside src/ (Claude decides)
  tests/
    __init__.py
    conftest.py                # Shared fixtures, --record flag for playback
    fixtures/                  # Recorded HTTP responses per source
      agg_scholarshipportal/
      off_daad/
      ...
    test_pipeline.py           # Pipeline framework tests
    test_ingestion.py          # Convex batch insert, dedup, normalization tests
    test_normalizer.py         # Country/date/currency normalization
    test_quality.py            # Quality flag logic
    test_cli.py                # All 7 CLI commands
    test_configs/              # Per-source fixture smoke tests
      test_agg_scholarshipportal.py
      ...
```

### Pattern 1: Scrapling Spider with on_scraped_item Hook

**What:** Each scraper type extends a base Spider class that uses `on_scraped_item` to send records to the Convex ingestion pipeline in real-time.
**When to use:** For all HTML and browser-based scraping.
**Example:**

```python
from scrapling.spiders import Spider, Response

class BaseScholarshipSpider(Spider):
    """Base spider with Convex ingestion hook."""

    def __init__(self, config, convex_client, run_id, **kwargs):
        super().__init__(**kwargs)
        self.config = config
        self.convex = convex_client
        self.run_id = run_id
        self._batch = []
        self._batch_size = 50

    async def on_scraped_item(self, item: dict) -> dict | None:
        """Buffer items and flush to Convex in batches."""
        normalized = self.normalize(item)
        flagged = self.quality_check(normalized)
        self._batch.append(flagged)
        if len(self._batch) >= self._batch_size:
            await self.flush_batch()
        return item  # return to keep in spider's item list

    async def flush_batch(self):
        """Send accumulated batch to Convex."""
        if self._batch:
            self.convex.mutation(
                "scraping:batchInsertRawRecords",
                {"records": self._batch, "run_id": self.run_id}
            )
            self._batch = []

    async def on_close(self):
        """Flush remaining items on spider close."""
        await self.flush_batch()
```

### Pattern 2: Config-Driven Generic Scraping

**What:** Source configs define selectors/URLs/methods; generic scrapers consume configs. No per-source spider classes.
**When to use:** For the majority of sources that follow common patterns.
**Example:**

```python
from typing import Protocol, runtime_checkable

@runtime_checkable
class SourceConfig(Protocol):
    """Protocol all source configs must implement."""
    name: str
    url: str
    source_id: str                    # Matches catalog entry
    primary_method: str               # api, jsonld, ajax, rss, scrape, scrapling
    secondary_method: str | None      # Fallback method
    selectors: dict[str, str]         # CSS selectors for data extraction
    field_mappings: dict[str, str]    # Maps extracted fields to raw_record schema
    pagination: dict | None           # next_page selector, type (url/cursor/page_num)
    detail_page: bool                 # Whether to follow links for full data
    auth_config: dict | None          # Future: auth credentials (None in v1)
```

### Pattern 3: Convex Batch Mutation for Data Ingestion

**What:** A single Convex internalMutation accepts an array of records, upserting each with dedup and diff tracking.
**When to use:** Every batch insert from the scraping pipeline.
**Example (Convex TypeScript side):**

```typescript
// web/convex/scraping.ts
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const batchInsertRawRecords = internalMutation({
  args: {
    records: v.array(v.object({
      source_id: v.id("sources"),
      title: v.string(),
      source_url: v.string(),
      // ... other fields
    })),
    run_id: v.string(),
  },
  handler: async (ctx, { records, run_id }) => {
    for (const record of records) {
      // Dedup: check existing by source_id + source_url
      const existing = await ctx.db
        .query("raw_records")
        .withIndex("by_source_external", q =>
          q.eq("source_id", record.source_id).eq("external_id", record.external_id)
        )
        .first();

      if (existing) {
        // Field-level diff and update
        await ctx.db.patch(existing._id, { ...record, scrape_run_id: run_id });
      } else {
        await ctx.db.insert("raw_records", { ...record, scrape_run_id: run_id, scraped_at: Date.now() });
      }
    }
  },
});
```

**Python side call:**

```python
# Uses admin auth to call internalMutation
from convex import ConvexClient

client = ConvexClient(convex_url)
client.set_admin_auth(deploy_key)
client.mutation("scraping:batchInsertRawRecords", {
    "records": batch,
    "run_id": run_id
})
```

### Pattern 4: Run Lifecycle Management

**What:** Explicit run lifecycle with Convex-generated run ID.
**When to use:** Every pipeline execution.
**Flow:**

```
1. Python calls startRun mutation -> returns run_id
2. For each source group:
   a. Check if source is due (frequency check)
   b. Scrape source
   c. Batch insert records with run_id
   d. Update source_health
   e. Record scrape_run_sources telemetry
3. Python calls completeRun mutation with summary stats
4. Heartbeat updated
```

### Anti-Patterns to Avoid

- **One mutation per record:** Each Convex mutation is a function call. Inserting 80K records individually would consume 80K of the 1M monthly limit. Always batch (50-100 records per mutation).
- **Spider per source:** Do NOT create 201 separate spider classes. Use config-driven generic scrapers that read SourceConfig modules.
- **Scrapy + Scrapling side by side:** Do NOT keep both frameworks. Scrapling replaces Scrapy entirely -- its Fetcher class handles HTTP requests that Scrapy would, and StealthyFetcher handles what scrapy-playwright would.
- **Blocking Convex calls in spider parse:** Do NOT call Convex synchronously inside `parse()` callbacks. Use `on_scraped_item` for batching or buffer locally and flush after spider completes.
- **Storing full HTML in raw_data:** Store extracted JSON only, not full page HTML. Saves Convex storage (0.5 GiB free tier limit).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON-LD extraction | Custom JSON-LD parser | `extruct` | Handles JSON-LD, microdata, RDFa, OpenGraph in one call. Edge cases in spec compliance are numerous. |
| RSS/Atom parsing | Custom XML feed parser | `feedparser` | Handles malformed XML, auto-detects feed type, normalizes data structure. 15+ years of edge case handling. |
| Country normalization | Lookup table with manual mappings | `pycountry` (ISO 3166) | Covers all countries with official names, alpha-2/3 codes, common name variants. |
| Date parsing | Manual regex/strptime patterns | `python-dateutil.parser.parse()` | Handles dozens of date formats, relative dates, timezone awareness automatically. |
| Cloudflare bypass | Custom browser fingerprinting | Scrapling `StealthyFetcher` | Built on Camoufox (modified Firefox) with TLS fingerprint spoofing, header injection, Turnstile solving. |
| User-Agent rotation | Hardcoded UA list | Scrapling's built-in browser impersonation | `Fetcher` already impersonates real browsers at the TLS level, not just the UA header string. |
| CLI framework | argparse subcommands | `click` groups | Composable commands, automatic help generation, parameter validation. |
| Structured logging | Custom JSON formatter | `structlog` | Structured, context-aware, JSON-serializable logs out of the box. |
| GitHub Issues management | Direct GitHub API calls | `gh` CLI in GitHub Actions | Already available in runners, handles auth automatically, simple for create/close/search. |

**Key insight:** The scraping domain has mature tooling for every sub-problem. The value of this phase is in the orchestration architecture (pipeline, monitoring, config management, Convex integration), not in reinventing extraction or parsing.

## Common Pitfalls

### Pitfall 1: Convex Free Tier Function Call Exhaustion

**What goes wrong:** Naive one-record-per-mutation approach consumes 80K+ calls per full scrape, eating 8% of the monthly budget per run.
**Why it happens:** Developers treat Convex like a REST API with individual inserts.
**How to avoid:** Batch 50-100 records per `internalMutation` call. Estimated budget: ~6,100 calls/month (0.6% of 1M). Each mutation can handle up to 16,000 documents / 16 MiB, so batches of 50-100 are conservative and safe.
**Warning signs:** Convex dashboard showing >50K function calls/month from scraping alone.

### Pitfall 2: Scrapling Browser Dependency Install in CI

**What goes wrong:** GitHub Actions runner fails because Scrapling's StealthyFetcher requires Playwright Chromium + Camoufox (modified Firefox) + system libraries.
**Why it happens:** `scrapling install` downloads ~400MB of browser binaries; CI caching is not set up.
**How to avoid:** Add explicit `scrapling install` step in GitHub Actions after Python setup. Cache the browser installation directory (`~/.scrapling/` or check marker file `.scrapling_dependencies_installed`). For CI tests that don't need a browser, run only the Fetcher-based tests (no StealthyFetcher).
**Warning signs:** CI taking 5+ minutes on browser download; flaky CI from download timeouts.

### Pitfall 3: Selector Rot Goes Undetected

**What goes wrong:** A source redesigns its HTML, selectors return empty results, pipeline silently produces zero records.
**Why it happens:** No yield comparison against historical averages.
**How to avoid:** Implement yield drop detection: if a source returns <50% of its historical average, flag as "degraded." After 5 consecutive failures or zero-result runs, auto-deactivate and create GitHub Issue.
**Warning signs:** scrape_run_sources showing records_found = 0 for previously-working sources.

### Pitfall 4: Convex Document Size Limit (1 MiB)

**What goes wrong:** A record with very large raw_data (e.g., an entire page's extracted JSON) exceeds the 1 MiB document limit.
**Why it happens:** Storing full extracted JSON without truncation.
**How to avoid:** Cap `raw_data` field to essential extracted fields only. Truncate descriptions to a reasonable length (e.g., 10,000 chars). Validate document size before insert.
**Warning signs:** Convex mutation errors with "document too large."

### Pitfall 5: Rate Limiting Triggering IP Blocks

**What goes wrong:** Running all 191 sources in rapid succession from a single GitHub Actions runner IP gets the IP flagged/blocked by multiple sites.
**Why it happens:** No inter-source delay, no per-domain throttling.
**How to avoid:** Group by scrape method and execute with delays: API sources (fast, minimal delay), HTML sources (1-3s download delay), Scrapling sources (browser-based, inherently slower). Add randomized delay between sources (2-10s). Scrapling's Spider API has built-in per-domain throttling.
**Warning signs:** Increasing 403/429 responses across multiple sources in the same run.

### Pitfall 6: Auth-Required Sources Treated as Scrape Failures

**What goes wrong:** 10 sources are auth_required=true but pipeline tries to scrape them, generating errors and rot alerts.
**Why it happens:** Config doesn't exclude auth-required sources.
**How to avoid:** Mark auth_required sources as inactive in pipeline configs (skip in v1). Do not count them as failures.
**Warning signs:** Consistent failures for the same 10 sources (Fastweb, Scholarships.com, BridgeU, etc.).

### Pitfall 7: GitHub Actions Scheduled Run Drift

**What goes wrong:** Scheduled cron workflow runs 15-45 minutes late, overlapping with previous run.
**Why it happens:** GitHub Actions does not guarantee exact cron timing; scheduling can be delayed.
**How to avoid:** Add a lock mechanism: check if a run is already in progress (via Convex scrape_runs table). If yes, skip. Use generous scheduling windows (not every hour, use every 6/12/24 hours).
**Warning signs:** Multiple concurrent scrape runs logged in Convex.

## Code Examples

Verified patterns from official sources:

### Scrapling Spider with Pagination

```python
# Source: Scrapling docs - spiders/architecture
from scrapling.spiders import Spider, Response

class ScholarshipListSpider(Spider):
    name = "scholarship_list"
    start_urls = ["https://example.com/scholarships"]
    concurrent_requests = 4

    async def parse(self, response: Response):
        for item in response.css(".scholarship-card"):
            yield {
                "title": item.css("h2::text").get(""),
                "deadline": item.css(".deadline::text").get(""),
                "url": item.css("a::attr(href)").get(""),
            }
        # Follow pagination
        next_page = response.css(".pagination .next::attr(href)").get()
        if next_page:
            yield response.follow(next_page, callback=self.parse)
```

### Scrapling StealthyFetcher for Cloudflare

```python
# Source: Scrapling docs - fetching/stealthy
from scrapling import StealthyFetcher

# Single page fetch (not Spider, for one-off fetches)
page = StealthyFetcher.fetch(
    "https://cloudflare-protected-site.com/scholarships",
    headless=True,
    network_idle=True,  # Wait for all network requests to complete
)
# Extract data using familiar CSS selectors
titles = page.css("h2.scholarship-title::text").getall()
```

### Scrapling Multi-Session Spider (HTTP + Browser)

```python
# Source: Scrapling docs - spiders/sessions
from scrapling.spiders import Spider, Response

class HybridSpider(Spider):
    name = "hybrid"
    start_urls = ["https://api-site.com/scholarships"]

    async def parse(self, response: Response):
        for item in response.css(".item"):
            detail_url = item.css("a::attr(href)").get()
            if detail_url:
                # Use stealthy session for detail pages (might be CF-protected)
                yield response.follow(
                    detail_url,
                    callback=self.parse_detail,
                    sid="stealthy"  # Routes through StealthySession
                )

    async def parse_detail(self, response: Response):
        yield {
            "title": response.css("h1::text").get(""),
            "description": response.css(".description::text").get(""),
        }
```

### extruct for JSON-LD Extraction

```python
# Source: extruct README / PyPI
import extruct

html_content = fetcher_response.body
data = extruct.extract(
    html_content,
    base_url="https://example.com",
    syntaxes=["json-ld", "microdata", "opengraph"],
    uniform=True,
)
# data["json-ld"] contains list of JSON-LD objects
for item in data.get("json-ld", []):
    if item.get("@type") == "Scholarship":
        yield normalize_jsonld_scholarship(item)
```

### feedparser for RSS Feeds

```python
# Source: feedparser docs
import feedparser

feed = feedparser.parse("https://example.com/scholarships/rss")
for entry in feed.entries:
    yield {
        "title": entry.get("title", ""),
        "description": entry.get("summary", ""),
        "source_url": entry.get("link", ""),
        "published": entry.get("published", ""),
    }
```

### Convex Python SDK with Admin Auth

```python
# Source: convex-py README + Convex internal functions docs
from convex import ConvexClient

client = ConvexClient("https://your-deployment.convex.cloud")
client.set_admin_auth("deploy_key_from_dashboard")

# Call internal mutation (not exposed to public API)
run_id = client.mutation("scraping:startRun", {
    "triggered_by": "github_actions",
    "sources_targeted": 191,
})

# Batch insert records
client.mutation("scraping:batchInsertRawRecords", {
    "records": records_batch,
    "run_id": run_id,
})
```

### Click CLI with Subcommands

```python
# Source: click docs
import click

@click.group()
def scrape():
    """ScholarHub scraping pipeline CLI."""
    pass

@scrape.command()
@click.option("--dry-run", is_flag=True, help="Write to local JSON instead of Convex")
@click.option("--source", help="Run single source by name")
@click.option("--wave", type=int, help="Run all sources in a specific wave")
def run(dry_run: bool, source: str | None, wave: int | None):
    """Run scraping pipeline."""
    ...

@scrape.command()
def status():
    """Show recent runs, health summary, failing sources."""
    ...

# Register all 7 subcommands: run, status, gen-config, export, validate, reactivate, health
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Scrapy + scrapy-playwright for JS pages | Scrapling with built-in StealthyFetcher/DynamicFetcher | 2025-2026 (Scrapling v0.3+) | Single framework handles HTTP, browser, anti-bot |
| BeautifulSoup for parsing | Scrapling's Selector (Parsel-speed parser) | 2025 | Same API as Scrapy selectors, faster than BS4 |
| Custom Cloudflare bypass scripts | StealthyFetcher (Camoufox-based) | 2025 | Turnstile/Interstitial bypass built-in |
| Manual selector maintenance | Adaptive element tracking (adaptive=True) | 2025 (Scrapling feature) | Elements auto-relocated after page redesigns |
| Scrapy Item + Pipeline pattern | Spider `on_scraped_item` hook + dict yields | 2026 (Scrapling v0.4) | Simpler, no Pipeline class needed |
| actions/upload-artifact v3 | actions/upload-artifact v6 (Node 24) | 2025 | v3 deprecated Jan 2025; must use v4+ |

**Deprecated/outdated:**
- **Scrapy's ROBOTSTXT_OBEY setting**: Not relevant -- decision is to not obey robots.txt. But this setting will be removed since Scrapy is being replaced.
- **actions/upload-artifact v3**: Deprecated since January 2025. Use v4+ (currently v6).
- **scrapy-playwright**: Unnecessary if using Scrapling; StealthyFetcher replaces it.

## Scrapling Framework Evaluation (Claude's Discretion Resolution)

### Recommendation: Use Scrapling as sole framework

**Evaluation criteria (equal weight per CONTEXT.md):**

| Criterion | Scrapy | Scrapling | Winner |
|-----------|--------|-----------|--------|
| Community & maturity | 15+ years, 55K+ stars, massive ecosystem | ~1.5 years, 20K+ stars, growing rapidly | Scrapy (but Scrapling is sufficient) |
| Feature completeness | Full crawling, middleware, pipelines, exporters | Spider API, fetchers, adaptive parsing, anti-bot, MCP | Scrapling (built-in anti-bot) |
| Code simplicity | More boilerplate (Item, Pipeline, Settings, Spider) | Simpler (dict yields, on_scraped_item hook, fewer files) | Scrapling |
| GitHub Actions compatibility | Straightforward, no browser deps needed for basic | Needs `scrapling install` for browser deps, larger install | Scrapy (slight edge) |

**Decision: Scrapling wins overall.**
- The built-in anti-bot bypass (StealthyFetcher/Camoufox) eliminates the need for scrapy-playwright + custom middleware
- Simpler code: yield dicts directly, on_scraped_item replaces Pipeline classes
- Adaptive element tracking provides self-healing for selector rot (complements fuzzy fallback)
- Single framework for all scrape types (HTTP, browser, stealthy) vs Scrapy needing add-ons
- Spider API is familiar to anyone who knows Scrapy (start_urls, parse, follow)
- 92% test coverage on the framework itself
- The GitHub Actions install step is a one-time cost per run (cache-able)

**Action: Remove Scrapy entirely** (items.py, pipelines.py, settings.py, spiders/). Rename package.

### Architecture Decision: Generic Scrapers + Config Modules

- Do NOT create 201 individual spider classes
- Create ~6 generic scraper types: API, JSON-LD, AJAX, RSS, HTML, Stealthy
- Each source config module (Python file) specifies which scraper type to use and provides selectors/mappings
- The runner iterates over discovered configs, instantiates the appropriate scraper, and runs it

### Config Organization Decision: Flat with Category Prefix

- Use flat directory: `scraping/configs/` (or `src/scholarhub_pipeline/configs/`)
- Category prefix naming: `agg_scholarshipportal.py`, `off_daad.py`, `gov_anu.py`, `fnd_rotary.py`
- At 201 files, flat is manageable and avoids nested import complexity
- Auto-discovery via `importlib` + `pkgutil` scanning

### Concurrency Recommendation

| Scrape Method | Concurrent Requests | Download Delay | Rationale |
|---------------|-------------------|----------------|-----------|
| API | 8-10 | 0.5s | APIs are designed for traffic; be respectful but efficient |
| JSON-LD/HTML | 4-6 | 1-2s | Standard web pages; avoid hammering |
| RSS | 8-10 | 0.5s | Feed endpoints are lightweight |
| Scrapling (browser) | 2-3 | 3-5s | Browser sessions are heavy; each runs Camoufox instance |

### Scheduling Recommendation

- **Schedule: 04:00 UTC daily** (low GitHub Actions contention, most scholarship sites updated during business hours prior)
- Use workflow_dispatch for manual triggers
- Per-source frequency check: only scrape sources whose `scrape_frequency_hours` has elapsed since `last_scraped`

### Batch Size Recommendation

- **50 records per Convex mutation** -- conservative, well within 16K doc / 16 MiB limits
- At ~81K total estimated records across all sources: ~1,620 mutation calls per full scrape
- With overhead (startRun, completeRun, health updates): ~2,000 calls per full scrape
- Monthly (assuming ~3 full scrapes/month due to frequency filtering): ~6,000 calls

## Convex Schema Additions

New tables required for Phase 3 (added to `web/convex/schema.ts`):

```typescript
// Scrape run lifecycle tracking
scrape_runs: defineTable({
  started_at: v.number(),
  completed_at: v.optional(v.number()),
  status: v.union(v.literal("running"), v.literal("completed"), v.literal("failed")),
  triggered_by: v.string(), // "github_actions" | "cli" | "manual"
  sources_targeted: v.number(),
  sources_completed: v.number(),
  sources_failed: v.number(),
  records_inserted: v.number(),
  records_updated: v.number(),
  records_unchanged: v.number(),
  duration_seconds: v.optional(v.number()),
})
  .index("by_status", ["status"])
  .index("by_started_at", ["started_at"]),

// Per-source health status
source_health: defineTable({
  source_id: v.id("sources"),
  status: v.union(v.literal("healthy"), v.literal("degraded"), v.literal("failing"), v.literal("deactivated")),
  consecutive_failures: v.number(),
  last_success: v.optional(v.number()),
  last_failure: v.optional(v.number()),
  last_yield: v.optional(v.number()),  // records found in last scrape
  avg_yield: v.optional(v.number()),   // historical average
  yield_trend: v.optional(v.string()), // "stable" | "declining" | "increasing"
  last_error_type: v.optional(v.string()),
  last_error_message: v.optional(v.string()),
  github_issue_number: v.optional(v.number()),
  deactivation_reason: v.optional(v.string()),
})
  .index("by_source", ["source_id"])
  .index("by_status", ["status"]),

// Per-source-per-run telemetry
scrape_run_sources: defineTable({
  run_id: v.id("scrape_runs"),
  source_id: v.id("sources"),
  status: v.union(v.literal("success"), v.literal("failed"), v.literal("skipped")),
  method_used: scrapeMethodValidator,
  records_found: v.number(),
  records_new: v.number(),
  records_updated: v.number(),
  records_unchanged: v.number(),
  duration_seconds: v.number(),
  bytes_downloaded: v.optional(v.number()),
  error_type: v.optional(v.string()),
  error_message: v.optional(v.string()),
  fallback_used: v.optional(v.boolean()),
})
  .index("by_run", ["run_id"])
  .index("by_source", ["source_id"])
  .index("by_run_source", ["run_id", "source_id"]),

// Field-level change tracking
change_log: defineTable({
  record_id: v.id("raw_records"),
  source_id: v.id("sources"),
  run_id: v.id("scrape_runs"),
  changed_at: v.number(),
  field_name: v.string(),
  old_value: v.optional(v.string()),
  new_value: v.optional(v.string()),
})
  .index("by_record", ["record_id"])
  .index("by_source", ["source_id"])
  .index("by_changed_at", ["changed_at"]),
```

### Convex Cron Jobs (web/convex/crons.ts)

```typescript
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Clean up raw_records older than 90 days
crons.daily("cleanup_old_records", { hourUTC: 3, minuteUTC: 0 }, internal.maintenance.cleanupOldRecords);

// Clean up change_log older than 90 days
crons.daily("cleanup_change_log", { hourUTC: 3, minuteUTC: 30 }, internal.maintenance.cleanupChangeLog);

// Check for stale heartbeat (GitHub Actions not running)
crons.hourly("heartbeat_check", { minuteUTC: 0 }, internal.monitoring.checkHeartbeat);

export default crons;
```

### Pre-Built Query Layer

```typescript
// web/convex/dashboard.ts - Ready for Phase 5 admin dashboard
export const getRecentRuns = query({ ... });      // Latest 10 scrape runs with stats
export const getSourceHealth = query({ ... });     // All sources with health status
export const getFailingSources = query({ ... });   // Sources in "failing" or "deactivated" state
export const getRunStats = query({ ... });         // Aggregate stats for a specific run
```

## GitHub Actions Workflow Design

### Scraping Workflow (`scrape.yml`)

```yaml
name: Scrape Scholarships

on:
  schedule:
    - cron: '0 4 * * *'  # Daily at 04:00 UTC
  workflow_dispatch:
    inputs:
      source:
        description: 'Specific source name (blank for all)'
        required: false
      wave:
        description: 'Specific wave number (blank for all due)'
        required: false

jobs:
  scrape:
    runs-on: ubuntu-latest
    timeout-minutes: 240  # 4-hour limit for full scrape
    steps:
      - uses: actions/checkout@v4

      - uses: astral-sh/setup-uv@v6

      - name: Install Python dependencies
        run: cd scraping && uv sync

      - name: Install Scrapling browser dependencies
        run: cd scraping && uv run scrapling install
        # TODO: Cache browser binaries for faster CI

      - name: Run tests
        run: cd scraping && uv run pytest tests/ -x --timeout=60

      - name: Run scraping pipeline
        env:
          CONVEX_URL: ${{ secrets.CONVEX_URL }}
          CONVEX_DEPLOY_KEY: ${{ secrets.CONVEX_DEPLOY_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: cd scraping && uv run scrape run --json-logs

      - name: Upload buffer on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: scrape-buffer-${{ github.run_id }}
          path: scraping/.buffer/
          retention-days: 7
```

### Key CI Additions

```yaml
# Added to ci.yml for config validation
validate-configs:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: astral-sh/setup-uv@v6
    - name: Install dependencies
      run: cd scraping && uv sync
    - name: Validate all configs
      run: cd scraping && uv run scrape validate
    - name: Check config-catalog sync
      run: cd scraping && uv run python -m scholarhub_pipeline.configs --check-sync
```

## Convex Function Call Budget Analysis

| Operation | Calls per Full Scrape | Scrapes/Month | Monthly Total |
|-----------|----------------------|---------------|---------------|
| startRun | 1 | 3 | 3 |
| batchInsert (50 rec/batch, ~81K records) | ~1,620 | 3 | 4,860 |
| updateSourceHealth (191 sources) | 191 | 3 | 573 |
| completeRun | 1 | 3 | 3 |
| updateRunSources (191 telemetry entries) | 191 | 3 | 573 |
| Heartbeat cron | - | - | 720 |
| Cleanup crons | - | - | 60 |
| Dashboard queries (dev) | - | - | ~200 |
| **TOTAL** | | | **~6,989** |
| **Free tier budget** | | | **1,000,000** |
| **Utilization** | | | **0.7%** |

This is very conservative. Even at 10x the estimated volume, the budget stays under 7% of the free tier.

## Open Questions

1. **Scrapling Spider `on_scraped_item` async behavior**
   - What we know: The hook exists, accepts items, can return None to drop. Documented in advanced features.
   - What's unclear: Whether calling a synchronous Convex client inside an async hook blocks the event loop. The Convex Python SDK is synchronous (no async support documented).
   - Recommendation: Buffer items in `on_scraped_item` (fast, sync), flush batches to Convex via a dedicated thread or after spider completes. Or use `on_close` to flush all accumulated items. Test this pattern early.

2. **Scrapling browser cache in GitHub Actions**
   - What we know: `scrapling install` downloads Playwright Chromium + Camoufox (~400MB+). Actions runners are ephemeral.
   - What's unclear: Exact cache key and directory for `actions/cache` to speed up subsequent runs.
   - Recommendation: Test `scrapling install` timing; if >3 min, implement caching. Check `~/.cache/ms-playwright/` and Camoufox install location.

3. **Config auto-update branch commit from GitHub Actions**
   - What we know: Fuzzy fallback should auto-commit new selectors to `config-updates` branch.
   - What's unclear: Git auth in GitHub Actions for committing back to repo. `GITHUB_TOKEN` has limited permissions by default.
   - Recommendation: Use `GITHUB_TOKEN` with `contents: write` permission in workflow. Create branch, commit, optionally auto-create PR.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pytest 9.0.2+ (already configured) |
| Config file | `scraping/pyproject.toml` [tool.pytest.ini_options] |
| Quick run command | `cd scraping && uv run pytest tests/ -x --timeout=30` |
| Full suite command | `cd scraping && uv run pytest tests/ -v --timeout=60` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SCRP-01 | API-first scraping produces records | integration | `uv run pytest tests/test_api_scraper.py -x` | Wave 0 |
| SCRP-02 | HTML scraping with CSS selectors | integration | `uv run pytest tests/test_html_scraper.py -x` | Wave 0 |
| SCRP-03 | StealthyFetcher for CF sites | integration (live) | `uv run pytest tests/test_stealthy_scraper.py -x` | Wave 0 |
| SCRP-04 | GitHub Actions cron workflow | manual-only | Trigger workflow_dispatch manually | N/A |
| SCRP-05 | Records land in Convex raw_records | integration | `uv run pytest tests/test_ingestion.py -x` | Wave 0 |
| SCRP-06 | Yield metrics logged per run | unit | `uv run pytest tests/test_pipeline.py::test_yield_metrics -x` | Wave 0 |
| SCRP-07 | Last verified timestamp updated | unit | `uv run pytest tests/test_pipeline.py::test_last_verified -x` | Wave 0 |
| INFR-04 | Rot detection alerts | unit | `uv run pytest tests/test_monitoring.py -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd scraping && uv run pytest tests/ -x --timeout=30`
- **Per wave merge:** `cd scraping && uv run pytest tests/ -v --timeout=60`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/test_pipeline.py` -- covers SCRP-06, SCRP-07 (run lifecycle, yield metrics)
- [ ] `tests/test_ingestion.py` -- covers SCRP-05 (batch insert, dedup, normalization)
- [ ] `tests/test_api_scraper.py` -- covers SCRP-01 (API-based scraping)
- [ ] `tests/test_html_scraper.py` -- covers SCRP-02 (HTML scraping)
- [ ] `tests/test_stealthy_scraper.py` -- covers SCRP-03 (Cloudflare bypass)
- [ ] `tests/test_monitoring.py` -- covers INFR-04 (rot detection, health tracking)
- [ ] `tests/test_normalizer.py` -- covers normalization logic (country, date, currency)
- [ ] `tests/test_quality.py` -- covers quality flag logic
- [ ] `tests/test_cli.py` -- covers all 7 CLI subcommands
- [ ] `tests/test_configs/` -- per-source fixture smoke tests (201 files)
- [ ] `tests/conftest.py` update -- add --record flag, fixture recording, mock Convex client
- [ ] Framework install: `uv add scrapling[fetchers] extruct feedparser click pycountry python-dateutil structlog rich httpx bleach`

## Sources

### Primary (HIGH confidence)
- [Scrapling PyPI](https://pypi.org/project/scrapling/) - v0.4.2 confirmed, Python >=3.10
- [Scrapling ReadTheDocs](https://scrapling.readthedocs.io/en/latest/) - Spider API, fetchers, hooks, architecture
- [Scrapling GitHub](https://github.com/D4Vinci/Scrapling) - Feature list, 20K+ stars, 92% test coverage
- [Convex Limits](https://docs.convex.dev/production/state/limits) - 1M calls/month free, 16K docs/mutation, 1 MiB/doc
- [Convex Best Practices](https://docs.convex.dev/understanding/best-practices/) - Batch mutations, single-transaction inserts
- [Convex Internal Functions](https://docs.convex.dev/functions/internal-functions) - admin auth for Python SDK
- [Convex HTTP Actions](https://docs.convex.dev/functions/http-actions) - Webhook endpoint pattern
- [Convex Cron Jobs](https://docs.convex.dev/scheduling/cron-jobs) - Scheduled function definition
- [extruct GitHub](https://github.com/scrapinghub/extruct) - JSON-LD/microdata/RDFa extraction
- [feedparser PyPI](https://pypi.org/project/feedparser/) - v6.0.12, RSS/Atom parsing
- [click PyPI](https://pypi.org/project/click/) - v8.3.1, CLI framework

### Secondary (MEDIUM confidence)
- [ZenRows Scrapling Tutorial](https://www.zenrows.com/blog/scrapling-web-scraper) - 2026 tutorial with practical examples
- [ScrapingBee Scrapling Guide](https://www.scrapingbee.com/blog/scrapling-adaptive-python-web-scraping/) - Adaptive scraping patterns
- [Convex Batch Insertions Community](https://discord-questions.convex.dev/m/1329903836021784626) - Community batch pattern (100 docs/mutation)
- [GitHub Actions Cron Best Practices](https://cicube.io/blog/github-actions-cron/) - Scheduling, drift, manual triggers

### Tertiary (LOW confidence)
- Scrapling at 1000+ source scale: No production reports at this scale found. The framework is new (v0.4, ~1.5 years old). Validate during Phase 3 execution with Wave 1 sources first.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All versions verified against PyPI, Scrapling docs comprehensive, Convex limits well-documented
- Architecture: HIGH - Patterns derived from official docs and established best practices (batch mutations, Spider API)
- Pitfalls: HIGH - Convex limits verified, GitHub Actions timing documented, scraper rot is a well-known problem domain
- Scrapling at scale: MEDIUM - Framework is new, limited production reports at 200+ source scale. Mitigated by wave-based rollout.

**Research date:** 2026-03-20
**Valid until:** 2026-04-20 (30 days -- Scrapling is actively releasing; check for v0.5+ changes)
