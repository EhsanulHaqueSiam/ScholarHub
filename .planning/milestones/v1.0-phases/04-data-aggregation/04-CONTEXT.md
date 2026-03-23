# Phase 4: Data Aggregation - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Raw scraped records from multiple sources are deduplicated, merged into canonical scholarship entries, and cyclical programs are linked across years. The aggregation pipeline runs after scraping and produces clear counts of new, updated, and duplicate records per run.

Existing state: `bulkPublishRawRecords` mutation does basic promotion (raw_records → scholarships with slug-based dedup). This phase replaces it with proper composite matching, multi-source merging, and cycle detection.

</domain>

<decisions>
## Implementation Decisions

### Duplicate matching rules
- **D-01:** Composite match on: normalized title + provider_organization + host_country + degree_levels overlap. All four must match for auto-merge.
- **D-02:** Title normalization: lowercase, strip "scholarship/programme/grant/award/fellowship" suffixes, strip year references (2025/2026), collapse whitespace. "DAAD Scholarship 2025" and "DAAD Scholarship Programme 2026" normalize to the same key.
- **D-03:** Partial matches (3 of 4 fields match) are flagged as "possible_duplicate" but NOT auto-merged — they surface in admin review (Phase 5). No false merges.
- **D-04:** Cross-source dedup only — records from the same source are already deduped by source_id + external_id in the scraping pipeline.

### Merge conflict resolution
- **D-05:** Source trust hierarchy determines winner on conflicts: government > official_program > foundation > aggregator. Within same tier, most-recently-scraped wins.
- **D-06:** Merge strategy is "richest field wins" — for each field, take the non-empty value from the highest-trust source. If both have values and disagree, keep the higher-trust source's value.
- **D-07:** Source-level raw_records are always preserved — the canonical scholarship is a merged VIEW, not a replacement. All source records link back via canonical_id.
- **D-08:** No manual review gate for auto-merges — the pipeline merges automatically. Admin dashboard (Phase 5) can split incorrectly merged records later.

### Cycle detection behavior
- **D-09:** Cyclical detection: same normalized title + same provider_organization + different year in title or different application_deadline year. Links via `previous_cycle_id` field on scholarships table.
- **D-10:** When a scholarship expires (deadline passed), set status to "archived" and populate `expected_reopen_month` from the historical pattern (e.g., if DAAD opens every October, set expected_reopen_month=10).
- **D-11:** Auto-archive: scholarships with deadline > 30 days past are automatically archived by the aggregation pipeline. No manual intervention needed.
- **D-12:** When a new cycle is detected (same program, new year), create a new canonical entry linked to the previous via `previous_cycle_id`, and set the old one's status to "archived."

### Claude's Discretion
- Exact normalization algorithm details (stemming, fuzzy matching thresholds)
- Convex mutation batching strategy for performance
- Whether to use a Convex cron job or trigger aggregation inline after scraping
- Match scoring algorithm weights

</decisions>

<specifics>
## Specific Ideas

- The aggregation should run as a Convex internal mutation triggered after `completeRun` — not a separate Python process. This keeps it within Convex's transaction model.
- Match results should be logged: "Merged record X from sources [A, B, C]" for debugging.
- The `source_ids` array on scholarships should grow as new sources contribute data for the same scholarship.

</specifics>

<canonical_refs>
## Canonical References

### Schema
- `web/convex/schema.ts` — raw_records (canonical_id, source_id), scholarships (source_ids, previous_cycle_id, expected_reopen_month, status), sources (trust_level)
- `web/convex/scraping.ts` — bulkPublishRawRecords (current basic promotion logic to replace), batchInsertRawRecords (where raw records land)

### Existing aggregation code
- `scraping/src/scholarhub_pipeline/ingestion/dedup.py` — Within-source dedup (external_id + source_url based)
- `scraping/src/scholarhub_pipeline/ingestion/batch.py` — BatchAccumulator for Convex ingestion

### Requirements
- `.planning/REQUIREMENTS.md` — AGGR-01 through AGGR-06

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `bulkPublishRawRecords` mutation: already does basic raw→scholarship promotion with slug dedup. Can be evolved into the proper aggregation mutation.
- `by_canonical` index on raw_records: enables finding all source records for a canonical scholarship.
- `source_ids` array on scholarships: ready for multi-source tracking.
- `previous_cycle_id` and `expected_reopen_month` fields: already in schema, just unused.

### Established Patterns
- Convex mutations handle batching via `.take(N)` to cap reads.
- Source trust_level field exists on sources table: "auto_publish", "needs_review", "blocked".
- Category field on sources maps to trust hierarchy: government > official_program > foundation > aggregator.

### Integration Points
- After `scraping:completeRun` — trigger aggregation on newly inserted raw_records.
- `scholarships.status` transitions: "draft" → "published" → "archived".
- Directory query `listScholarshipsBatch` reads from scholarships table — aggregation writes to it.

</code_context>

<deferred>
## Deferred Ideas

- Admin UI for splitting incorrectly merged records — Phase 5 (Admin Dashboard)
- Fuzzy matching with NLP/embeddings for semantically similar but differently named scholarships — future enhancement
- Cross-language dedup (English vs native language scholarship names) — future enhancement

</deferred>

---

*Phase: 04-data-aggregation*
*Context gathered: 2026-03-22*
