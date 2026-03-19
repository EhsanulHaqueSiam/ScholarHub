# Phase 2: Source Discovery - Research

**Researched:** 2026-03-20
**Domain:** Scholarship source cataloging, JSON Schema validation, Convex schema evolution, async URL validation, Python CLI tooling
**Confidence:** HIGH

## Summary

Phase 2 is primarily a **data curation and tooling phase**, not a heavy coding phase. The core deliverable is a JSON-based source catalog in `scraping/sources/` validated by JSON Schema, with supporting tooling: a seed script to upsert entries into Convex, a URL validation script using aiohttp + Scrapling, a stats reporter, and schema evolution for the Convex `sources` table. The actual source discovery (researching 1000+ scholarship sources) is done through AI-assisted research sessions, not automated crawling.

The technical surface area is moderate: Convex schema migration (adding 4 fields + indexes), JSON Schema definition, a Python seed script using the existing `convex` SDK, an async URL validator with aiohttp, and Scrapling for CF-protected URL detection. All dependencies are either already installed (jsonschema, scrapling, convex) or standard additions (aiohttp, check-jsonschema).

**Primary recommendation:** Structure the phase as infrastructure-first (schema migration + JSON Schema + tooling), then catalog population via AI-assisted research waves. Keep tooling simple -- Python scripts with clear CLI interfaces, no frameworks.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- JSON seed files in `scraping/sources/`, organized by source category (e.g., `aggregators.json`, `official_programs.json`, `government.json`, `foundations.json`)
- Convex `sources` table is the runtime copy; seed files are the source of truth
- Idempotent seed script using upsert by URL -- safe to re-run, never creates duplicates
- Convex mutation (`sources.upsertSource`) handles find-by-URL + create-or-update logic
- JSON Schema validates seed file entries; CI runs validation on every PR
- Stats CLI script reports catalog coverage
- README in `scraping/sources/` with template entry and valid values
- Source deactivation via `is_active: false` -- never delete entries from JSON files
- Git history is sufficient for versioning
- AI-assisted research: Claude systematically researches sources, outputs JSON entries in batches of 10-20
- Aggregators first (~50 across 4-5 waves), then official programs (~200), then government + foundations (~100)
- Universities deferred entirely
- Quality bar: active URL, actual scholarship data, updated in past year
- International focus, all regions, English pages preferred
- Detect Cloudflare protection during discovery -- pre-tag `scrape_method: scrapling`
- API-first per source: find APIs before falling back to scraping
- Must-have checklist in `scraping/sources/MUST_HAVE.md`
- Semi-structured notes field with key prefixes: `API: <url>`, `Fields: title, deadline, amount`, `CF: yes`, `Volume: ~500`, `Auth: free registration required`
- Wave system: 1-5 aggregators, 6 official programs, 7 government + foundations
- Standalone Python `validate_sources.py` -- async with ~20 concurrency, 10s timeout, Scrapling for CF URLs
- URL normalization for dedup (strip www, trailing slashes, query params, force HTTPS)
- Convex schema adds: `wave` (number), `auth_required` (boolean), `has_api` (boolean), `estimated_volume` (string)
- Schema migration is first task
- Unit tests with mocked Convex calls for seed script; Vitest tests for `upsertSource` mutation
- Default trust level: `needs_review` for all new sources

### Claude's Discretion
- Seed script runner choice (Python CLI vs. Convex-called -- likely Python CLI given architecture)
- Data quality rating approach during discovery
- Coverage report format and scope
- Wave field implementation details (required vs. optional, compound indexes)
- Whether to add 'rss' as scrapeMethodValidator option or use 'api'
- API verification depth per source
- Source overlap tracking between aggregators
- Robots.txt checking during validation
- Rate limit capture in notes
- Scraping effort estimates per wave
- Foundation grouping (with government or separate wave)
- Stats script geo breakdown

### Deferred Ideas (OUT OF SCOPE)
- University-specific scholarship pages -- future expansion
- Domestic scholarships -- v2 scope
- Automated CI-based seeding -- currently manual
- Name-based fuzzy dedup for sources -- URL dedup is sufficient
- Email newsletter sources -- too complex for now

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SRCD-01 | System discovers and catalogs 1000+ scholarship sources | Wave system (1-7) with AI-assisted research; aggregators cover more ground per source; JSON seed files as catalog format |
| SRCD-02 | Sources include official scholarship programs (DAAD, Erasmus, MEXT, Chevening, Fulbright) | Wave 6 covers official programs; MUST_HAVE.md ensures critical programs are tracked |
| SRCD-03 | Sources include university-specific scholarship pages | Deferred per CONTEXT.md -- universities excluded from this phase. SRCD-03 partially addressed by aggregators that index university scholarships |
| SRCD-04 | Sources include third-party aggregator sites | Waves 1-5 focus exclusively on aggregators (ScholarshipPortal, Scholars4Dev, IEFA, etc.) |
| SRCD-05 | Each source cataloged with URL, type, reliability rating, scrape frequency | JSON Schema enforces required fields; `scrape_method`, `trust_level`, `scrape_frequency_hours` are all required in schema |

</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| jsonschema | 4.26.0 | Validate JSON seed files against schema | Standard Python JSON Schema implementation; Draft 2020-12 support; already installed in environment |
| check-jsonschema | 0.37.0 | CLI validation in CI pipeline | Official companion to jsonschema; built-in CI support; pre-commit hook compatible |
| aiohttp | 3.13.3 | Async HTTP requests for URL validation | Standard async HTTP library; semaphore-based concurrency control; redirect following |
| scrapling | 0.4.2 | CF-protected URL detection during validation | Already a project dependency; StealthyFetcher detects/bypasses Cloudflare |
| convex (Python) | 0.7.0 | Seed script calls mutations via Convex SDK | Already used by `convex_client.py`; `client.mutation()` API for upserts |
| convex (npm) | 1.33.1 | Convex schema definition, mutation functions | Already installed in `web/`; schema evolution for new source fields |
| convex-test | latest | Vitest testing for Convex mutations | Official mock backend for testing mutations without real deployment |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| python-dotenv | 1.2.2+ | Load env vars for seed script | Already a dependency; used by `convex_client.py` |
| pytest | 9.0.2+ | Python test runner for seed/validate scripts | Already configured in `pyproject.toml` |
| vitest | 4.1.0 | TypeScript test runner for Convex mutations | Already configured in `web/vitest.config.ts` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| jsonschema | pydantic | Pydantic is schema-from-code; JSON Schema is schema-from-file which is better for CI validation and cross-language use |
| aiohttp | httpx | httpx has sync+async modes, but aiohttp is more battle-tested for high-concurrency async and session management |
| check-jsonschema | custom Python validator script | check-jsonschema provides CLI + pre-commit hooks out of the box, no custom code needed |

**Installation (Python additions):**
```bash
cd scraping && uv add aiohttp jsonschema check-jsonschema
```

**Installation (TypeScript additions):**
```bash
cd web && bun add -d convex-test @edge-runtime/vm
```

**Note:** `scrapling`, `convex`, and `python-dotenv` are already in `scraping/pyproject.toml`. `jsonschema` is installed system-wide (4.26.0) but should be added to `pyproject.toml` as an explicit project dependency.

## Architecture Patterns

### Recommended Project Structure

```
scraping/
  sources/
    schema.json              # JSON Schema for source entries
    aggregators.json         # Wave 1-5: Aggregator sources
    official_programs.json   # Wave 6: DAAD, Fulbright, etc.
    government.json          # Wave 7: Government programs
    foundations.json         # Wave 7: Foundation sources
    MUST_HAVE.md             # Checklist of required sources
    README.md                # Template entry, valid values, field docs
    validation_report.json   # Output of validate_sources.py (gitignored)
  scripts/
    seed_sources.py          # Upsert JSON -> Convex sources table
    validate_sources.py      # Async URL validation + dedup check
    stats_sources.py         # Catalog coverage report
  src/scholarhub_scraping/
    convex_client.py         # Existing -- reused by seed script
  tests/
    test_seed_sources.py     # Unit tests for seed script logic
    test_validate_sources.py # Unit tests for URL validation logic
    fixtures/
      sample_sources.json    # 5 sample entries for test fixtures

web/
  convex/
    schema.ts                # Extended with wave, auth_required, has_api, estimated_volume
    sources.ts               # New: upsertSource mutation + query helpers
  src/tests/
    sources.test.ts          # Vitest + convex-test for upsertSource mutation
```

### Pattern 1: JSON Schema for Source Entry Validation

**What:** A single `schema.json` defines the shape of every source entry; all JSON seed files are arrays of objects conforming to this schema.
**When to use:** Every time a source file is created, modified, or reviewed.
**Example:**

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "array",
  "items": {
    "type": "object",
    "required": ["name", "url", "category", "scrape_method", "scrape_frequency_hours", "wave", "is_active"],
    "properties": {
      "name": { "type": "string", "minLength": 1 },
      "url": { "type": "string", "format": "uri" },
      "category": {
        "type": "string",
        "enum": ["official_program", "university", "aggregator", "government", "foundation"]
      },
      "scrape_method": {
        "type": "string",
        "enum": ["api", "scrape", "scrapling"]
      },
      "trust_level": {
        "type": "string",
        "enum": ["auto_publish", "needs_review", "blocked"],
        "default": "needs_review"
      },
      "scrape_frequency_hours": { "type": "number", "minimum": 1 },
      "wave": { "type": "number", "minimum": 1, "maximum": 7 },
      "is_active": { "type": "boolean" },
      "auth_required": { "type": "boolean", "default": false },
      "has_api": { "type": "boolean", "default": false },
      "estimated_volume": { "type": "string" },
      "geographic_coverage": {
        "type": "array",
        "items": { "type": "string" }
      },
      "notes": { "type": "string" }
    },
    "additionalProperties": false
  }
}
```

### Pattern 2: Convex Upsert-by-URL Mutation

**What:** A Convex mutation that finds a source by URL (using an index), then either creates or patches it.
**When to use:** Called by the seed script for each source entry.
**Example:**

```typescript
// Source: Convex docs (writing-data + mutation-functions)
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const upsertSource = mutation({
  args: {
    name: v.string(),
    url: v.string(),
    category: sourceCategoryValidator,
    scrape_method: scrapeMethodValidator,
    trust_level: v.optional(trustLevelValidator),
    scrape_frequency_hours: v.number(),
    wave: v.number(),
    is_active: v.boolean(),
    auth_required: v.optional(v.boolean()),
    has_api: v.optional(v.boolean()),
    estimated_volume: v.optional(v.string()),
    geographic_coverage: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("sources")
      .withIndex("by_url", (q) => q.eq("url", args.url))
      .first();

    const data = {
      ...args,
      trust_level: args.trust_level ?? "needs_review",
      auth_required: args.auth_required ?? false,
      has_api: args.has_api ?? false,
      consecutive_failures: 0,
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    }
    return await ctx.db.insert("sources", data);
  },
});
```

**Note:** Requires adding a `by_url` index to the sources table: `.index("by_url", ["url"])`.

### Pattern 3: Python Seed Script with Convex SDK

**What:** A CLI script that reads JSON seed files, validates them, and calls the `upsertSource` mutation for each entry.
**When to use:** After editing JSON seed files to sync changes to Convex.
**Example:**

```python
# Source: convex-py GitHub README
import json
import sys
from pathlib import Path
from scholarhub_scraping.convex_client import get_convex_client

def seed_sources(source_dir: Path) -> None:
    """Seed all source JSON files to Convex."""
    client = get_convex_client()
    json_files = sorted(source_dir.glob("*.json"))

    total = 0
    for json_file in json_files:
        if json_file.name in ("schema.json", "validation_report.json"):
            continue
        with open(json_file) as f:
            sources = json.load(f)
        for source in sources:
            client.mutation("sources:upsertSource", source)
            total += 1

    print(f"Seeded {total} sources from {len(json_files)} files")
```

### Pattern 4: Async URL Validation with Semaphore

**What:** An async Python script using aiohttp with a semaphore to concurrently validate URLs.
**When to use:** To verify source URLs are reachable before or after catalog updates.
**Example:**

```python
# Source: aiohttp docs + community patterns
import asyncio
import aiohttp

CONCURRENCY = 20
TIMEOUT = aiohttp.ClientTimeout(total=10)

async def check_url(
    session: aiohttp.ClientSession,
    semaphore: asyncio.Semaphore,
    url: str,
) -> dict:
    """Check a single URL for reachability."""
    async with semaphore:
        try:
            async with session.get(url, timeout=TIMEOUT, allow_redirects=True) as resp:
                return {
                    "url": url,
                    "status": resp.status,
                    "final_url": str(resp.url),
                    "redirected": str(resp.url) != url,
                    "reachable": True,
                }
        except Exception as e:
            return {"url": url, "status": None, "error": str(e), "reachable": False}

async def validate_all(urls: list[str]) -> list[dict]:
    """Validate all URLs with concurrency limit."""
    semaphore = asyncio.Semaphore(CONCURRENCY)
    async with aiohttp.ClientSession() as session:
        tasks = [check_url(session, semaphore, url) for url in urls]
        return await asyncio.gather(*tasks)
```

### Pattern 5: Convex-test for Mutation Testing

**What:** Use `convex-test` to test the `upsertSource` mutation without a real Convex backend.
**When to use:** Unit testing the upsert logic (create, update, duplicate handling).
**Example:**

```typescript
// Source: Convex convex-test docs
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

describe("upsertSource", () => {
  it("creates a new source when URL not found", async () => {
    const t = convexTest(schema);
    const id = await t.mutation(api.sources.upsertSource, {
      name: "Test Source",
      url: "https://example.com/scholarships",
      category: "aggregator",
      scrape_method: "scrape",
      scrape_frequency_hours: 24,
      wave: 1,
      is_active: true,
    });
    expect(id).toBeDefined();

    const source = await t.run(async (ctx) => {
      return await ctx.db.get(id);
    });
    expect(source?.name).toBe("Test Source");
    expect(source?.trust_level).toBe("needs_review");
  });

  it("updates existing source when URL matches", async () => {
    const t = convexTest(schema);
    // Create initial
    await t.mutation(api.sources.upsertSource, {
      name: "Original",
      url: "https://example.com",
      category: "aggregator",
      scrape_method: "scrape",
      scrape_frequency_hours: 24,
      wave: 1,
      is_active: true,
    });
    // Upsert with same URL
    await t.mutation(api.sources.upsertSource, {
      name: "Updated",
      url: "https://example.com",
      category: "aggregator",
      scrape_method: "api",
      scrape_frequency_hours: 12,
      wave: 1,
      is_active: true,
    });
    // Verify only one source exists with updated name
    const sources = await t.run(async (ctx) => {
      return await ctx.db.query("sources").collect();
    });
    expect(sources).toHaveLength(1);
    expect(sources[0].name).toBe("Updated");
    expect(sources[0].scrape_method).toBe("api");
  });
});
```

### Anti-Patterns to Avoid

- **Monolithic source file:** Do NOT put all 1000+ sources in a single JSON file. Split by category per the locked decisions. Files with 200+ entries are unwieldy for review.
- **Hardcoded Convex URL in scripts:** Always read from environment via `convex_client.py`. Never commit URLs or credentials.
- **Synchronous URL validation:** With 1000+ URLs, synchronous checking would take hours. Always use async with concurrency.
- **Deleting source entries:** Never remove entries from JSON files. Use `is_active: false` for retirement.
- **Testing against live Convex:** Use `convex-test` for mutations, mocked `ConvexClient` for Python seed script tests. Live testing is slow and fragile.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON Schema validation | Custom Python validation | `jsonschema` library + `check-jsonschema` CLI | Edge cases in JSON Schema spec (formats, refs, defaults) are extensive; library handles all drafts |
| CI schema validation | Custom CI step with Python | `check-jsonschema --schemafile schema.json *.json` | One-line CLI; built-in pre-commit hooks; zero custom code |
| URL normalization | Custom regex parser | `urllib.parse` (stdlib) | URL parsing has dozens of edge cases (unicode, ports, fragments); stdlib handles them correctly |
| Async HTTP concurrency | Thread pool or custom event loop | `aiohttp` + `asyncio.Semaphore` | Proper connection pooling, timeout handling, redirect following -- all built in |
| Cloudflare detection | Custom header sniffing | Scrapling's `StealthyFetcher` | CF detection evolves constantly; Scrapling tracks changes |
| Convex mutation testing | Manual HTTP mocking | `convex-test` | Official mock backend with full transaction semantics |

**Key insight:** This phase's complexity is in the data (finding, vetting, and annotating 1000+ sources), not in the code. Keep tooling minimal and reliable. Every hour spent overengineering validation scripts is an hour not spent curating the catalog.

## Common Pitfalls

### Pitfall 1: Convex Schema Migration Breaking Existing Data
**What goes wrong:** Adding required fields to the Convex schema when existing documents lack those fields causes deployment errors.
**Why it happens:** Convex validates existing data against the new schema on deployment.
**How to avoid:** Make new fields optional (`v.optional(...)`) OR provide default values. For `wave`, `auth_required`, `has_api`, `estimated_volume` -- all should be `v.optional()` since existing rows don't have them. A backfill mutation can set defaults after migration.
**Warning signs:** `npx convex deploy` fails with schema validation errors.

### Pitfall 2: URL Normalization Inconsistency
**What goes wrong:** Same source appears in catalog under different URL forms (`http://` vs `https://`, `www.` vs no-www, trailing slash vs no trailing slash).
**Why it happens:** URLs scraped from different contexts have different formatting.
**How to avoid:** Normalize URLs before inserting into JSON files AND in the upsert mutation: strip `www.`, force HTTPS, remove trailing slashes, strip query parameters.
**Warning signs:** Stats script shows duplicate domain names in different files.

### Pitfall 3: aiohttp Session Exhaustion
**What goes wrong:** URL validation script hangs or times out after processing many URLs.
**Why it happens:** Creating a new `ClientSession` per request, or not using a semaphore, exhausts connection pool.
**How to avoid:** Use ONE `ClientSession` for all requests. Use `asyncio.Semaphore(20)` to limit concurrent connections. Set explicit `ClientTimeout(total=10)`.
**Warning signs:** Script becomes progressively slower, eventually hangs.

### Pitfall 4: Convex Python SDK Type Mismatches
**What goes wrong:** Python seed script passes values that Convex rejects (e.g., Python `int` where Convex expects `float`, or `None` for non-optional fields).
**Why it happens:** Python-to-JavaScript type mapping has subtle differences. The Convex Python SDK converts Python `int` and `float` to Float64.
**How to avoid:** Ensure all numeric values are plain Python numbers. Use `None` only for fields marked `v.optional()` in the schema. Remove `None` values from the dict before sending (Convex doesn't accept `None` for non-optional fields).
**Warning signs:** `ConvexError` exceptions with type mismatch messages.

### Pitfall 5: JSON Schema Drift from Convex Schema
**What goes wrong:** The JSON Schema in `schema.json` accepts values that Convex rejects, or vice versa.
**Why it happens:** Two separate schema definitions (JSON Schema for files, Convex validators for DB) can drift over time.
**How to avoid:** Document the mapping explicitly in the README. Keep the enum values in JSON Schema identical to the Convex validators. Review both when changing either.
**Warning signs:** JSON validation passes but Convex seed fails, or seed succeeds but data is wrong.

### Pitfall 6: Scrapling Browser Installation
**What goes wrong:** `scrapling` is installed but `StealthyFetcher` fails because browsers are not downloaded.
**Why it happens:** `pip install scrapling[fetchers]` installs the Python package but browsers require a separate `scrapling install` command.
**How to avoid:** Run `scrapling install` after `pip install scrapling[fetchers]`. For validation script, only use Scrapling for CF-tagged URLs (fallback, not primary).
**Warning signs:** `BrowserNotFoundError` or similar when running validation.

## Code Examples

### Source Entry JSON Format

```json
{
  "name": "ScholarshipPortal",
  "url": "https://www.scholarshipportal.com",
  "category": "aggregator",
  "scrape_method": "scrape",
  "trust_level": "needs_review",
  "scrape_frequency_hours": 168,
  "wave": 1,
  "is_active": true,
  "auth_required": false,
  "has_api": false,
  "estimated_volume": "~5000",
  "geographic_coverage": ["europe", "global"],
  "notes": "CF: no | Fields: title, deadline, amount, country, degree | Volume: ~5000 scholarships | Largest EU aggregator"
}
```

### Convex Schema Evolution (sources table)

```typescript
// Add to existing sources table definition
sources: defineTable({
  // ... existing fields ...
  name: v.string(),
  url: v.string(),
  category: sourceCategoryValidator,
  scrape_method: scrapeMethodValidator,
  trust_level: trustLevelValidator,
  scrape_frequency_hours: v.number(),
  last_scraped: v.optional(v.number()),
  consecutive_failures: v.number(),
  geographic_coverage: v.optional(v.array(v.string())),
  data_quality_rating: v.optional(v.number()),
  notes: v.optional(v.string()),
  is_active: v.boolean(),
  // New Phase 2 fields (all optional for backward compat)
  wave: v.optional(v.number()),
  auth_required: v.optional(v.boolean()),
  has_api: v.optional(v.boolean()),
  estimated_volume: v.optional(v.string()),
})
  .index("by_category", ["category"])
  .index("by_trust_level", ["trust_level"])
  .index("by_active_category", ["is_active", "category"])
  // New indexes for Phase 2
  .index("by_url", ["url"])
  .index("by_wave", ["wave"])
  .index("by_active_wave", ["is_active", "wave"]),
```

### URL Normalization Utility

```python
from urllib.parse import urlparse, urlunparse

def normalize_url(url: str) -> str:
    """Normalize URL for dedup: force HTTPS, strip www/trailing slash/query."""
    parsed = urlparse(url)
    scheme = "https"
    netloc = parsed.netloc.lower().removeprefix("www.")
    path = parsed.path.rstrip("/") or "/"
    # Strip query and fragment
    return urlunparse((scheme, netloc, path, "", "", ""))
```

### CI Validation Command

```bash
# In GitHub Actions workflow or local check
check-jsonschema --schemafile scraping/sources/schema.json scraping/sources/aggregators.json scraping/sources/official_programs.json scraping/sources/government.json scraping/sources/foundations.json
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Draft 7 JSON Schema | Draft 2020-12 | 2020 | Better vocabulary, cleaner composition; `jsonschema` 4.x supports both |
| Synchronous `requests` for URL checking | Async `aiohttp` + semaphore | Standard since Python 3.6+ | 20x+ faster for bulk URL validation |
| cloudscraper for CF bypass | Scrapling `StealthyFetcher` | 2025-2026 | cloudscraper is unmaintained; Scrapling actively tracks CF changes |
| Manual Convex testing against live backend | `convex-test` mock library | 2024 | Fast, deterministic tests without network |

**Deprecated/outdated:**
- `cloudscraper`: Last updated 2021, does not handle modern CF Turnstile. Use Scrapling instead.
- `requests` for bulk HTTP: Blocking I/O is unacceptable for 1000+ URL checks. Use `aiohttp`.

## Discretion Recommendations

Based on research, here are recommendations for the areas left to Claude's discretion:

### Seed Script: Python CLI
**Recommendation:** Python CLI script in `scraping/scripts/seed_sources.py`. The existing `convex_client.py` provides the Convex connection. Python is the natural choice since all other scraping infrastructure is Python, and the Convex Python SDK (`client.mutation()`) works cleanly.

### RSS Scrape Method
**Recommendation:** Add `"rss"` as a fourth value to `scrapeMethodValidator`. RSS feeds are a distinct scrape strategy (no HTML parsing, structured XML) and deserve their own classification rather than being lumped under `"api"`. This is a minor schema change alongside the other Phase 2 additions.

### Wave Field: Optional Number
**Recommendation:** Make `wave` an `v.optional(v.number())`. Required in JSON Schema (all new entries MUST have a wave), but optional in Convex (backward compat with any pre-existing data). No compound indexes needed beyond `by_active_wave` -- queries will filter by wave after filtering by is_active.

### API Verification Depth
**Recommendation:** Catalog-only during discovery. Note API existence in `has_api: true` and `notes: "API: <url>"` but do NOT test API endpoints. API testing belongs in Phase 3 (scraping pipeline). Discovery should be fast.

### Stats Script Geo Breakdown
**Recommendation:** Simple geographic summary by region (Europe, Asia, Americas, Africa, Oceania, Global). Map `geographic_coverage` array entries to regions. Output as text table to stdout.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework (Python) | pytest 9.0.2+ |
| Framework (TypeScript) | vitest 4.1.0 + convex-test |
| Python config | `scraping/pyproject.toml` [tool.pytest.ini_options] |
| TS config | `web/vitest.config.ts` |
| Python quick run | `cd scraping && uv run pytest tests/ -x` |
| TS quick run | `cd web && bun run vitest run` |
| Full suite | `cd scraping && uv run pytest tests/ && cd ../web && bun run vitest run` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SRCD-05 | Source entries validated against JSON Schema | unit | `cd scraping && uv run pytest tests/test_seed_sources.py -x` | Wave 0 |
| SRCD-05 | upsertSource creates new source | unit | `cd web && bun run vitest run src/tests/sources.test.ts` | Wave 0 |
| SRCD-05 | upsertSource updates existing source by URL | unit | `cd web && bun run vitest run src/tests/sources.test.ts` | Wave 0 |
| SRCD-05 | upsertSource handles duplicate URLs | unit | `cd web && bun run vitest run src/tests/sources.test.ts` | Wave 0 |
| SRCD-05 | URL validation reports reachability | unit | `cd scraping && uv run pytest tests/test_validate_sources.py -x` | Wave 0 |
| SRCD-05 | URL normalization strips www/trailing slash/query | unit | `cd scraping && uv run pytest tests/test_validate_sources.py -x` | Wave 0 |
| SRCD-01 | JSON schema validation catches malformed entries | unit | `cd scraping && uv run pytest tests/test_seed_sources.py -x` | Wave 0 |
| SRCD-01 | 1000+ sources in catalog | manual-only | `cd scraping && python scripts/stats_sources.py` | N/A -- manual count |

### Sampling Rate
- **Per task commit:** `cd scraping && uv run pytest tests/ -x` OR `cd web && bun run vitest run` (depending on which side was changed)
- **Per wave merge:** Full suite (both Python and TypeScript tests)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `web/src/tests/sources.test.ts` -- Vitest + convex-test tests for upsertSource mutation
- [ ] `scraping/tests/test_seed_sources.py` -- pytest tests for seed script (JSON parsing, validation, upsert prep)
- [ ] `scraping/tests/test_validate_sources.py` -- pytest tests for URL validation logic and normalization
- [ ] `scraping/tests/fixtures/sample_sources.json` -- 5 sample entries covering each category
- [ ] `bun add -d convex-test @edge-runtime/vm` -- convex-test not yet installed
- [ ] `cd scraping && uv add aiohttp jsonschema` -- aiohttp not yet a project dependency; jsonschema needs explicit addition

## Open Questions

1. **Scrapling for URL validation on CI (GitHub Actions)**
   - What we know: Scrapling requires browser installation (`scrapling install`). This works locally but may be heavyweight for CI.
   - What's unclear: Whether CI should validate CF-protected URLs at all, or just skip them.
   - Recommendation: For CI, run `check-jsonschema` only (schema validation). URL reachability is a manual/local-only check. CF detection is best done during discovery, not automated.

2. **Convex free tier limits with 1000+ source upserts**
   - What we know: Convex free tier allows 1M function calls/month. Seeding 1000 sources = 1000 mutation calls. This is trivial.
   - What's unclear: Whether re-seeding (idempotent upserts) during development iterations will accumulate significant call volume.
   - Recommendation: Not a concern for Phase 2. Monitor in Phase 3 when scraping adds continuous traffic.

3. **Source entry `consecutive_failures` default**
   - What we know: Current schema has `consecutive_failures: v.number()` (required, not optional).
   - What's unclear: The seed script must provide this value, but it's meaningless for new sources.
   - Recommendation: Default to `0` in the upsert mutation. JSON seed files should NOT include this field -- the mutation sets it.

## Sources

### Primary (HIGH confidence)
- [Convex Python SDK](https://github.com/get-convex/convex-py) -- mutation call syntax, type mapping, error handling
- [Convex Writing Data](https://docs.convex.dev/database/writing-data) -- insert, patch, replace, delete operations
- [Convex Mutation Functions](https://docs.convex.dev/functions/mutation-functions) -- mutation structure, transactions
- [convex-test](https://docs.convex.dev/testing/convex-test) -- mock backend setup, Vitest integration
- [jsonschema PyPI](https://pypi.org/project/jsonschema/) -- version 4.26.0, Draft 2020-12 support verified
- [check-jsonschema docs](https://check-jsonschema.readthedocs.io/en/latest/usage.html) -- CLI usage, CI integration
- [aiohttp docs](https://docs.aiohttp.org/en/stable/client_quickstart.html) -- session management, timeouts, redirects
- [Scrapling PyPI](https://pypi.org/project/scrapling/) -- version 0.4.2, installation with fetchers
- Existing codebase: `web/convex/schema.ts`, `scraping/src/scholarhub_scraping/convex_client.py`, `scraping/pyproject.toml`

### Secondary (MEDIUM confidence)
- [Scrapling GitHub/docs](https://github.com/D4Vinci/Scrapling) -- StealthyFetcher CF bypass capabilities
- [aiohttp semaphore patterns](https://rednafi.com/python/limit_concurrency_with_semaphore/) -- concurrency control best practices

### Tertiary (LOW confidence)
- Scrapling CF bypass reliability at scale -- v0.4 is new, limited production reports beyond small-scale use. Validation script should handle failures gracefully.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries are verified installed or on PyPI, versions confirmed, APIs documented
- Architecture: HIGH -- patterns follow existing project conventions (Convex validators, Python scraping layout, pytest/vitest testing)
- Pitfalls: HIGH -- Convex schema migration, URL normalization, and async HTTP are well-documented problem areas
- Validation: MEDIUM -- convex-test is official but relatively new; Python mocking patterns are straightforward

**Research date:** 2026-03-20
**Valid until:** 2026-04-20 (stable domain -- JSON Schema, aiohttp, Convex SDK unlikely to break)
