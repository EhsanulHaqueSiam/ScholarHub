# Phase 4: Data Aggregation - Research

**Researched:** 2026-03-22
**Domain:** Convex server-side data aggregation, deduplication, merge logic, cycle detection
**Confidence:** HIGH

## Summary

Phase 4 replaces the existing naive `bulkPublishRawRecords` mutation (slug-based dedup) with a proper multi-source aggregation pipeline. The pipeline must: (1) compute composite match keys from normalized titles + organization + country + degree levels, (2) merge records using a source trust hierarchy, (3) detect cyclical scholarships and link them across years, and (4) auto-archive expired entries with expected reopen dates.

The entire aggregation pipeline runs inside Convex as internal mutations, triggered after `completeRun`. Convex transaction limits (32,000 documents read, 16,000 written, 1 second user code per mutation) require batched processing using the recursive scheduler pattern (`ctx.scheduler.runAfter(0, ...)`). The project already uses `convex-helpers` Triggers for prestige scoring and search text, so any mutation writing to `scholarships` must fire those triggers.

**Primary recommendation:** Build aggregation as a chain of small internal mutations: (1) normalize + compute match keys for a batch of unpromoted raw_records, (2) match against existing scholarships via a new `by_match_key` index, (3) merge or create canonical entries through trigger-wrapped writes, (4) detect cycles and update archival status. Each step processes a bounded batch and schedules the next via `ctx.scheduler.runAfter(0, ...)`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Composite match on: normalized title + provider_organization + host_country + degree_levels overlap. All four must match for auto-merge.
- **D-02:** Title normalization: lowercase, strip "scholarship/programme/grant/award/fellowship" suffixes, strip year references (2025/2026), collapse whitespace. "DAAD Scholarship 2025" and "DAAD Scholarship Programme 2026" normalize to the same key.
- **D-03:** Partial matches (3 of 4 fields match) are flagged as "possible_duplicate" but NOT auto-merged -- they surface in admin review (Phase 5). No false merges.
- **D-04:** Cross-source dedup only -- records from the same source are already deduped by source_id + external_id in the scraping pipeline.
- **D-05:** Source trust hierarchy determines winner on conflicts: government > official_program > foundation > aggregator. Within same tier, most-recently-scraped wins.
- **D-06:** Merge strategy is "richest field wins" -- for each field, take the non-empty value from the highest-trust source. If both have values and disagree, keep the higher-trust source's value.
- **D-07:** Source-level raw_records are always preserved -- the canonical scholarship is a merged VIEW, not a replacement. All source records link back via canonical_id.
- **D-08:** No manual review gate for auto-merges -- the pipeline merges automatically. Admin dashboard (Phase 5) can split incorrectly merged records later.
- **D-09:** Cyclical detection: same normalized title + same provider_organization + different year in title or different application_deadline year. Links via `previous_cycle_id` field on scholarships table.
- **D-10:** When a scholarship expires (deadline passed), set status to "archived" and populate `expected_reopen_month` from the historical pattern (e.g., if DAAD opens every October, set expected_reopen_month=10).
- **D-11:** Auto-archive: scholarships with deadline > 30 days past are automatically archived by the aggregation pipeline. No manual intervention needed.
- **D-12:** When a new cycle is detected (same program, new year), create a new canonical entry linked to the previous via `previous_cycle_id`, and set the old one's status to "archived."

### Claude's Discretion
- Exact normalization algorithm details (stemming, fuzzy matching thresholds)
- Convex mutation batching strategy for performance
- Whether to use a Convex cron job or trigger aggregation inline after scraping
- Match scoring algorithm weights

### Deferred Ideas (OUT OF SCOPE)
- Admin UI for splitting incorrectly merged records -- Phase 5 (Admin Dashboard)
- Fuzzy matching with NLP/embeddings for semantically similar but differently named scholarships -- future enhancement
- Cross-language dedup (English vs native language scholarship names) -- future enhancement
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AGGR-01 | Multi-source aggregation combines data from different sources for the same scholarship into one unified entry | Composite match key + merge logic in aggregation mutation; source trust hierarchy from D-05/D-06 |
| AGGR-02 | Deduplication detects same scholarship across multiple sources using composite matching (title + organization + country + degree level) | Normalization function (D-02) + match key index on scholarships table; partial match flagging (D-03) |
| AGGR-03 | Merge logic selects richest/most complete data from each source | Field-by-field merge with trust-weighted selection; source category maps to trust rank |
| AGGR-04 | Source-level records preserved separately from canonical merged records | raw_records always kept; canonical_id links them back; source_ids array grows on scholarships |
| AGGR-05 | Cyclical scholarship tracking links same program across years (DAAD 2025 -> DAAD 2026) | Cycle detection via year extraction from title/deadline; previous_cycle_id linking (D-09/D-12) |
| AGGR-06 | Expired scholarships show "expected to reopen [month]" based on historical data | Auto-archive at deadline+30d (D-11); expected_reopen_month computed from historical deadline months (D-10) |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| convex | 1.33.1+ | Backend database + mutations | Already in use; all aggregation runs server-side |
| convex-helpers | 0.1.114+ | Triggers (prestige/search_text auto-compute), customMutation | Already in use for write-time triggers on scholarships table |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| convex-test | 0.0.41 | Testing Convex mutations in vitest | Already installed; test aggregation logic with in-memory DB |
| vitest | 4.1.0 | Test runner | Already configured in web/vitest.config.ts |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Convex mutations for aggregation | Python-side aggregation in scraping pipeline | Would break Convex transaction model; user decided aggregation runs inside Convex |
| String normalization in mutation | Separate normalization library | Overkill -- simple regex normalization suffices per D-02 |
| Fuzzy matching (Levenshtein/Jaro-Winkler) | Exact normalized key matching | Deferred per user decision -- future enhancement only |

**Installation:**
No new packages needed. All dependencies already present.

## Architecture Patterns

### Recommended Project Structure
```
web/convex/
  aggregation.ts       # Core aggregation pipeline mutations (new)
  aggregation/
    normalize.ts       # Title normalization + match key computation (new)
    merge.ts           # Field-level merge logic with trust hierarchy (new)
    cycles.ts          # Cycle detection + archival logic (new)
  scraping.ts          # Modified: completeRun triggers aggregation
  schema.ts            # Modified: add match_key field + by_match_key index
  triggers.ts          # Existing: prestige + search_text auto-compute
  crons.ts             # Modified: add daily auto-archive cron
```

**Recommendation on file structure:** Use a single `aggregation.ts` file rather than a subdirectory. Convex modules must be flat files in the `convex/` directory -- subdirectories create separate modules in the generated API. Keep helper functions (normalize, merge, cycles) as exported utilities within `aggregation.ts` or as a non-Convex helper file imported by the mutation.

### Pattern 1: Recursive Batch Processing via Scheduler
**What:** Process unpromoted raw_records in batches of N, scheduling the next batch via `ctx.scheduler.runAfter(0, ...)` until all records are processed.
**When to use:** When total records to process may exceed Convex's 32K document scan or 16K write limits per transaction.
**Example:**
```typescript
// Source: Convex docs - Stateful Online Migrations
export const aggregateBatch = internalMutation({
  args: {
    cursor: v.union(v.string(), v.null()),
    batchSize: v.number(),
    runId: v.optional(v.id("scrape_runs")),
  },
  handler: async (ctx, args) => {
    // Query unpromoted raw_records using pagination
    const results = await ctx.db
      .query("raw_records")
      .filter((q) =>
        q.or(
          q.eq(q.field("canonical_id"), undefined),
          q.eq(q.field("canonical_id"), null),
        ),
      )
      .paginate({ cursor: args.cursor ?? null, numItems: args.batchSize });

    for (const record of results.page) {
      // 1. Normalize and compute match key
      // 2. Look up existing scholarship by match key
      // 3. Merge or create canonical entry
      // 4. Link raw_record via canonical_id
    }

    if (!results.isDone) {
      await ctx.scheduler.runAfter(0, internal.aggregation.aggregateBatch, {
        cursor: results.continueCursor,
        batchSize: args.batchSize,
        runId: args.runId,
      });
    }
  },
});
```

### Pattern 2: Match Key for Dedup Lookup
**What:** Compute a deterministic string key from normalized fields and store it on the scholarships table for O(1) index lookup.
**When to use:** Every time a raw_record needs to be matched against existing scholarships.
**Example:**
```typescript
// Normalization per D-02
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\b(scholarship|programme|program|grant|award|fellowship)s?\b/gi, "")
    .replace(/\b(20\d{2})\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function computeMatchKey(
  title: string,
  org: string,
  country: string,
  degreeLevels: string[],
): string {
  const normTitle = normalizeTitle(title);
  const normOrg = org.toLowerCase().trim();
  const normCountry = country.toLowerCase().trim();
  const normDegrees = [...degreeLevels].sort().join(",");
  return `${normTitle}|${normOrg}|${normCountry}|${normDegrees}`;
}
```

### Pattern 3: Source Trust Hierarchy Merge
**What:** Resolve field conflicts using source category as trust weight.
**When to use:** Merging raw_records from different sources into canonical scholarship.
**Example:**
```typescript
// Source trust ranking per D-05
const TRUST_RANK: Record<string, number> = {
  government: 4,
  official_program: 3,
  foundation: 2,
  aggregator: 1,
};

function resolveField<T>(
  candidates: Array<{ value: T | undefined; category: string; scrapedAt: number }>,
): T | undefined {
  // Filter to non-empty values
  const nonEmpty = candidates.filter((c) => c.value != null && c.value !== "");
  if (nonEmpty.length === 0) return undefined;

  // Sort by trust rank desc, then scraped_at desc for tiebreak
  nonEmpty.sort((a, b) => {
    const rankDiff = (TRUST_RANK[b.category] ?? 0) - (TRUST_RANK[a.category] ?? 0);
    if (rankDiff !== 0) return rankDiff;
    return b.scrapedAt - a.scrapedAt;
  });

  return nonEmpty[0].value;
}
```

### Pattern 4: Trigger-Aware Writes to Scholarships
**What:** Ensure all scholarship writes go through the Triggers wrapper so prestige_score, prestige_tier, and search_text are auto-computed.
**When to use:** Any mutation that inserts or patches the scholarships table.
**Important detail:** The current codebase exports `wrapDB` and `wrapDatabaseWriter` from `triggers.ts` but does NOT yet define a `customMutation` that uses them. The existing `bulkPublishRawRecords` uses raw `mutation` from `_generated/server`, meaning trigger logic does NOT fire on those writes. The aggregation pipeline must either:
  - (a) Create a proper `customMutation`/`customInternalMutation` wrapper using `wrapDB`, or
  - (b) Manually call the prestige/search_text computation after each write.

Option (a) is correct. Define a trigger-wrapped `internalMutation` for the aggregation module:
```typescript
import { customMutation } from "convex-helpers/server/customFunctions";
import { customCtx } from "convex-helpers/server/customFunctions";
import { internalMutation as rawInternalMutation } from "./_generated/server";
import { wrapDB } from "./triggers";

// Trigger-aware internal mutation
const triggeredInternalMutation = customMutation(
  rawInternalMutation,
  customCtx(wrapDB),
);
```

### Anti-Patterns to Avoid
- **Processing all raw_records in one mutation:** Convex limits to 32K document scans per transaction. With hundreds of sources producing thousands of records, a single-mutation approach will fail. Always batch.
- **Querying scholarships by scanning the whole table for match checking:** Use an index on `match_key` field. Full table scans hit the 32K limit quickly.
- **Using `mutation` instead of `internalMutation` for aggregation:** Aggregation should not be client-callable. Use `internalMutation` and trigger via scheduler.
- **Modifying existing raw_records table structure:** raw_records schema already has `canonical_id` -- just populate it. Don't add computed fields to raw_records; keep normalization in the aggregation logic.
- **Calling a mutation from within another mutation:** Convex doesn't support this. Use `ctx.scheduler.runAfter(0, ...)` instead to chain mutations.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Write-time triggers on scholarships | Manual prestige/search_text computation in every write path | `convex-helpers` Triggers + `customMutation` wrapper (already set up in triggers.ts) | Triggers fire atomically; manual calls will drift |
| Batch pagination across mutations | Custom cursor tracking | `ctx.db.query(...).paginate()` + Convex's built-in pagination cursor | Battle-tested, handles edge cases |
| Scheduled function chaining | setTimeout/poll pattern | `ctx.scheduler.runAfter(0, internal.aggregation.nextBatch, {...})` | Convex-native, transactional guarantees |
| Slug generation | Custom slug algorithm | Reuse existing `toSlug()` pattern from `seed.ts` | Already proven, consistent |

**Key insight:** Convex's mutation scheduler is the correct mechanism for breaking aggregation into bounded transactions. Each mutation processes a batch, writes results, and atomically schedules the next batch. If a mutation fails, only that batch rolls back.

## Common Pitfalls

### Pitfall 1: OCC Conflicts from Broad Reads
**What goes wrong:** Aggregation reads "all scholarships with status=published" to find matches, causing Optimistic Concurrency Control conflicts with concurrent directory queries.
**Why it happens:** Convex tracks read sets per transaction. If the aggregation mutation scans the same documents that a concurrent query reads, one will retry.
**How to avoid:** Use the `by_match_key` index for precise point lookups instead of table scans. Each aggregation batch reads only the specific scholarships it needs.
**Warning signs:** Mutation retries, "Too many retries" errors in Convex logs.

### Pitfall 2: Trigger Infinite Loops
**What goes wrong:** Aggregation writes to scholarships, trigger fires and patches prestige/search_text, which triggers again.
**Why it happens:** The existing trigger already guards against this with a "only patch if values changed" check. But if the aggregation code patches the same fields the trigger computes, it can cause unnecessary trigger re-fires.
**How to avoid:** The existing trigger code (`triggers.ts` line 25-35) already compares before patching. Ensure aggregation mutations don't redundantly set `prestige_score`, `prestige_tier`, or `search_text` -- let the trigger handle those fields.
**Warning signs:** Unexplained extra document writes in Convex dashboard.

### Pitfall 3: Transaction Limits on Large Scrape Runs
**What goes wrong:** A scrape run yields 5000+ new records. Trying to aggregate all at once exceeds the 32K read / 16K write limits.
**Why it happens:** Each aggregation step reads the raw_record + queries scholarships for match + writes the result. At ~3-5 reads per record, 5000 records = 15-25K reads.
**How to avoid:** Batch size of 50-100 records per mutation. 100 records * ~5 reads each = 500 reads, well within limits. Schedule next batch via `ctx.scheduler.runAfter(0, ...)`.
**Warning signs:** "Transaction too large" errors.

### Pitfall 4: Match Key Collisions Across Degree Levels
**What goes wrong:** Two genuinely different scholarships from the same organization in the same country but for different degree levels get different match keys (correct), but a scholarship that offers "bachelor, master" vs one that offers "master" gets treated as different.
**Why it happens:** D-01 requires degree_levels overlap, not exact match. A naive string match key requires exact equality.
**How to avoid:** The match key should use the normalized title + org + country (3 fields). Then do degree_levels overlap check as a secondary filter in code after the index lookup returns candidates. This gives exact index lookup for the first 3 fields and code-level check for the 4th.
**Warning signs:** Same scholarship appearing as separate entries with slightly different degree level sets.

### Pitfall 5: Missing customMutation Wrapper
**What goes wrong:** Aggregation pipeline writes directly to scholarships table using raw `ctx.db.insert`/`ctx.db.patch`, bypassing the Triggers that compute prestige and search_text.
**Why it happens:** The existing codebase does NOT yet wire up `wrapDB` into a `customMutation` -- it only exports the helpers. All current mutations use raw `mutation`/`internalMutation`.
**How to avoid:** This phase MUST create a trigger-wrapped `internalMutation` and use it for all aggregation writes to the scholarships table. Alternatively, manually call the prestige computation after each write -- but the wrapper is the correct pattern.
**Warning signs:** New scholarships created by aggregation have `null` prestige_tier and empty search_text.

### Pitfall 6: Year Extraction Edge Cases
**What goes wrong:** Cycle detection fails for scholarships that don't have years in their titles or have non-standard date formats.
**Why it happens:** Not all scholarships include years in their names. "DAAD Graduate Scholarship" has no year; the year is only in the deadline field.
**How to avoid:** Extract year from both (a) the title using regex, and (b) the `application_deadline` field year. If no year in title, use deadline year. If no deadline either, skip cycle detection for that record.
**Warning signs:** Scholarships from the same program in different years not being linked.

## Code Examples

### Title Normalization (D-02)
```typescript
// Normalize title for matching per D-02
const STRIP_SUFFIXES = /\b(scholarships?|programmes?|programs?|grants?|awards?|fellowships?)\b/gi;
const STRIP_YEARS = /\b20\d{2}[-/]?\d{0,2}\b/g;

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(STRIP_SUFFIXES, "")
    .replace(STRIP_YEARS, "")
    .replace(/[^\w\s]/g, " ")  // punctuation to spaces
    .replace(/\s+/g, " ")
    .trim();
}
```

### Composite Match Key (3-field index + code check)
```typescript
// 3-field key for index lookup (org + country + normalized title)
export function computeMatchKey(
  title: string,
  org: string,
  country: string,
): string {
  const nt = normalizeTitle(title);
  const no = org.toLowerCase().trim();
  const nc = country.toLowerCase().trim();
  return `${nt}|${no}|${nc}`;
}

// 4th field check: degree_levels overlap (D-01)
export function hasDegreeLevelOverlap(
  existing: string[],
  candidate: string[],
): boolean {
  return candidate.some((d) => existing.includes(d));
}
```

### Source Trust Hierarchy (D-05)
```typescript
const TRUST_RANK: Record<string, number> = {
  government: 4,
  official_program: 3,
  foundation: 2,
  aggregator: 1,
};

export function getTrustRank(category: string): number {
  return TRUST_RANK[category] ?? 0;
}
```

### Year Extraction for Cycle Detection (D-09)
```typescript
const YEAR_REGEX = /\b(20\d{2})\b/;

export function extractYear(title: string, deadline?: number): number | null {
  // Try title first
  const match = title.match(YEAR_REGEX);
  if (match) return parseInt(match[1], 10);

  // Fall back to deadline year
  if (deadline) {
    return new Date(deadline).getFullYear();
  }

  return null;
}
```

### Auto-Archive Check (D-11)
```typescript
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function shouldArchive(deadline: number | undefined): boolean {
  if (!deadline) return false;
  return Date.now() - deadline > THIRTY_DAYS_MS;
}
```

### Expected Reopen Month Computation (D-10)
```typescript
// Given a chain of previous cycles, compute the most common opening month
export function computeExpectedReopenMonth(
  historicalDeadlines: number[],
): number | null {
  if (historicalDeadlines.length === 0) return null;

  // Approximate opening month as ~6 months before deadline
  // Better: use earliest scraped_at date of each cycle's raw records
  const months = historicalDeadlines.map((d) => new Date(d).getMonth() + 1);

  // Find most common month
  const freq: Record<number, number> = {};
  for (const m of months) {
    freq[m] = (freq[m] ?? 0) + 1;
  }

  let bestMonth = months[0];
  let bestCount = 0;
  for (const [month, count] of Object.entries(freq)) {
    if (count > bestCount) {
      bestCount = count;
      bestMonth = parseInt(month, 10);
    }
  }

  return bestMonth;
}
```

## Schema Changes Required

The scholarships table needs a new `match_key` field and index for efficient dedup lookups:

```typescript
// Addition to scholarships table in schema.ts
match_key: v.optional(v.string()),  // normalized composite key for dedup

// New index
.index("by_match_key", ["match_key"])
```

Additionally, raw_records may benefit from a `match_status` field to track partial matches:
```typescript
// Addition to raw_records table
match_status: v.optional(v.union(
  v.literal("matched"),
  v.literal("possible_duplicate"),
  v.literal("new"),
)),
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `bulkPublishRawRecords` slug-based dedup | Composite match key dedup (this phase) | Phase 4 | Eliminates false duplicates and false merges |
| Single mutation processing all records | Recursive scheduler batching pattern | Convex best practice | Scales to thousands of records per run |
| Raw `mutation` for scholarship writes | `customMutation` with Triggers wrapper | Phase 4 (fixing existing gap) | Prestige + search_text auto-compute on all writes |

**Deprecated/outdated:**
- `bulkPublishRawRecords` in `scraping.ts`: Will be replaced by the aggregation pipeline. Should be deprecated but not deleted (keep for rollback safety).

## Open Questions

1. **Batch size optimization**
   - What we know: Convex limits are 32K reads, 16K writes per mutation. Each record needs ~3-5 reads for match lookup.
   - What's unclear: Optimal batch size depends on average match complexity. 50-100 is safe but may be slow for large runs.
   - Recommendation: Start with batch size 100, monitor Convex dashboard metrics, adjust if needed.

2. **Match key backfill for existing scholarships**
   - What we know: ~50+ seed scholarships exist without match_key values. Newly created scholarships will have match_key.
   - What's unclear: Whether to backfill in a one-time migration or compute match_key lazily during aggregation.
   - Recommendation: Add a one-time migration mutation that computes and sets match_key for all existing scholarships. Run it before the first aggregation.

3. **Trigger wrapper scope**
   - What we know: `wrapDB` and `wrapDatabaseWriter` are exported but unused. Current mutations don't fire triggers.
   - What's unclear: Whether existing non-aggregation mutations (seed, bulkPublish) should also be updated to use the wrapper.
   - Recommendation: Create the wrapper in this phase for aggregation use. Retrofitting existing mutations is a separate concern (Phase 5 or standalone task).

4. **Partial match storage**
   - What we know: D-03 says 3-of-4 field matches flag as "possible_duplicate" for admin review.
   - What's unclear: Where to store partial match pairs. Options: separate table, field on raw_records, or field on scholarships.
   - Recommendation: Use a lightweight `possible_duplicates` log (could be a new table or `match_status` on raw_records). Keep it simple since Phase 5 admin dashboard will consume this.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.0 + convex-test 0.0.41 |
| Config file | `web/vitest.config.ts` |
| Quick run command | `cd web && npx vitest run --reporter=verbose` |
| Full suite command | `cd web && npx vitest run --reporter=verbose` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AGGR-01 | Multi-source records merge into one canonical entry | unit | `cd web && npx vitest run src/tests/aggregation.test.ts -t "merges multi-source" -x` | Wave 0 |
| AGGR-02 | Composite matching detects cross-source duplicates | unit | `cd web && npx vitest run src/tests/aggregation.test.ts -t "composite match" -x` | Wave 0 |
| AGGR-03 | Merge selects richest data per trust hierarchy | unit | `cd web && npx vitest run src/tests/aggregation.test.ts -t "richest field" -x` | Wave 0 |
| AGGR-04 | Source-level records preserved with canonical_id link | unit | `cd web && npx vitest run src/tests/aggregation.test.ts -t "preserves raw_records" -x` | Wave 0 |
| AGGR-05 | Cyclical scholarships linked via previous_cycle_id | unit | `cd web && npx vitest run src/tests/aggregation.test.ts -t "cycle detection" -x` | Wave 0 |
| AGGR-06 | Expired scholarships archived with expected_reopen_month | unit | `cd web && npx vitest run src/tests/aggregation.test.ts -t "auto-archive" -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd web && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd web && npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `web/src/tests/aggregation.test.ts` -- covers AGGR-01 through AGGR-06 with convex-test
- [ ] Pure function tests for normalization, match key computation, merge resolution, year extraction (can be simple vitest unit tests without convex-test)

## Sources

### Primary (HIGH confidence)
- [Convex Limits documentation](https://docs.convex.dev/production/state/limits) - Transaction limits: 32K docs read, 16K written, 1s user code
- [Convex Scheduled Functions](https://docs.convex.dev/scheduling/scheduled-functions) - `ctx.scheduler.runAfter` pattern, 1000 functions per scheduler call
- [Convex Stateful Migrations](https://stack.convex.dev/migrating-data-with-mutations) - Recursive batch processing pattern with pagination cursor
- [Convex Database Triggers](https://stack.convex.dev/triggers) - `wrapDB` + `customMutation` pattern for trigger-aware mutations
- [Convex OCC and Transaction Throughput](https://stack.convex.dev/high-throughput-mutations-via-precise-queries) - Avoiding OCC conflicts via precise index queries

### Secondary (MEDIUM confidence)
- [convex-helpers README](https://github.com/get-convex/convex-helpers/blob/main/packages/convex-helpers/README.md) - Triggers API, customMutation, customCtx

### Tertiary (LOW confidence)
- None -- all findings verified against official Convex documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new packages; all within existing Convex ecosystem
- Architecture: HIGH - Patterns verified against official Convex docs (scheduled functions, migrations, triggers)
- Pitfalls: HIGH - OCC conflicts, transaction limits, trigger behavior all documented in official sources
- Normalization logic: MEDIUM - D-02 is prescriptive but edge cases (non-English titles, unusual formatting) may surface
- Cycle detection: MEDIUM - Year extraction from titles works for common patterns but edge cases exist

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable domain, Convex APIs mature)
