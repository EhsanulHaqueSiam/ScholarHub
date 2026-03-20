# Pipeline Architecture

System overview of the ScholarHub scraping pipeline.

## Data Flow

```
Source Website
     |
     v
[Config Discovery] -- discovers configs from configs/ package
     |
     v
[Scheduler] -- filters: active, due, wave, source_filter
     |
     v
[Group by Method] -- api -> jsonld -> ajax -> rss -> scrape -> scrapling
     |
     v
[Scraper] -- fetches data using method-specific scraper
     |                |
     |           (on failure)
     |                |
     |                v
     |         [HealthTracker] -> [RotDetector] -> [GitHub Issues]
     |
     v
[Normalizer] -- dates, countries, HTML sanitization
     |
     v
[Quality Checker] -- flags missing/suspicious fields
     |
     v
[Deduplicator] -- fingerprint-based within-source dedup
     |
     v
[Batch Accumulator] -- groups records into batches of 50
     |
     v
[Convex Mutations] -- batchInsertRawRecords, updateLastScraped
     |
     v
[Run Lifecycle] -- startRun -> recordSourceResult -> completeRun
     |
     v
[Heartbeat] -- updates pipeline heartbeat timestamp
```

In dry-run mode, records write to `LocalBuffer` (.buffer/ directory) instead of Convex.

## Component Map

```
scraping/src/scholarhub_pipeline/
|
+-- configs/                    # Source configuration modules
|   +-- _protocol.py            # SourceConfig protocol definition
|   +-- _bases.py               # Base config dataclasses
|   +-- __init__.py             # discover_configs() scanner
|   +-- agg_*.py                # Aggregator source configs (wave 1-2)
|   +-- off_*.py                # Official program configs (wave 2-3)
|   +-- gov_*.py                # Government source configs (wave 2-3)
|   +-- fnd_*.py                # Foundation source configs (wave 3-4)
|
+-- scrapers/                   # Data extraction layer
|   +-- base.py                 # BaseScraper abstract class
|   +-- api_scraper.py          # REST API / AJAX endpoint scraper
|   +-- jsonld_extractor.py     # JSON-LD structured data extractor
|   +-- rss_scraper.py          # RSS/Atom feed parser
|   +-- html_scraper.py         # CSS selector-based HTML scraper
|   +-- stealthy_scraper.py     # Scrapling browser-based scraper
|   +-- __init__.py             # get_scraper() factory
|
+-- ingestion/                  # Data processing and storage
|   +-- convex_client.py        # Convex client with admin auth
|   +-- normalizer.py           # Date, country, HTML normalization
|   +-- quality.py              # Quality flag detection
|   +-- dedup.py                # Source-level deduplication
|   +-- batch.py                # BatchAccumulator for Convex writes
|   +-- differ.py               # Field-level change detection
|
+-- monitoring/                 # Reliability tracking
|   +-- health.py               # HealthTracker (success/failure recording)
|   +-- rot_detector.py         # Error classification + alert threshold
|   +-- github_issues.py        # GitHub Issue creation for rot alerts
|   +-- heartbeat.py            # Pipeline heartbeat for staleness detection
|
+-- pipeline/                   # Orchestration
|   +-- runner.py               # PipelineRunner (main entry point)
|   +-- scheduler.py            # SourceScheduler (filtering, grouping)
|   +-- buffer.py               # LocalBuffer for dry-run output
|
+-- utils/                      # Shared utilities
|   +-- retry.py                # Exponential backoff retry decorator
|   +-- ua_rotation.py          # User-agent rotation pool
|   +-- sanitizer.py            # HTML sanitization helpers
|   +-- fuzzy_fallback.py       # CSS selector auto-detection
|
+-- cli.py                      # Click CLI with 7 subcommands
```

## Convex Integration

### Tables Used

| Table | Purpose | Written By |
|-------|---------|------------|
| `sources` | Source catalog with scrape config | seed_sources.py, admin |
| `raw_records` | Scraped scholarship data (staging) | batchInsertRawRecords |
| `scrape_runs` | Pipeline execution history | startRun, completeRun |
| `source_health` | Per-source reliability metrics | recordSuccess, recordFailure |
| `scrape_run_sources` | Per-source results within a run | recordSourceResult |
| `change_log` | Field-level change audit trail | differ.py via mutations |

### Mutations (internalMutation)

All scraping mutations use `internalMutation` and require admin auth via `CONVEX_DEPLOY_KEY`:

| Mutation | Purpose |
|----------|---------|
| `scraping:startRun` | Create new scrape_run record |
| `scraping:completeRun` | Finalize run with stats |
| `scraping:batchInsertRawRecords` | Insert/update up to 50 raw records |
| `scraping:updateLastScraped` | Update source timestamp |
| `scraping:recordSourceResult` | Record per-source outcome |
| `scraping:recordSuccess` | Update source_health on success |
| `scraping:recordFailure` | Update source_health on failure |
| `scraping:reactivateSource` | Reset health status to healthy |

### Batch Pattern

Records are accumulated in groups of 50 via `BatchAccumulator`, then flushed in a single mutation call. This minimizes Convex function call usage (critical for free tier budget).

```
Record 1 -> BatchAccumulator.add()
Record 2 -> BatchAccumulator.add()
...
Record 50 -> BatchAccumulator.add() -> auto-flush -> batchInsertRawRecords(50 records)
Record 51 -> BatchAccumulator.add()
...
(end)    -> BatchAccumulator.flush_remaining()
```

## GitHub Actions

### scrape.yml Flow

```
Schedule (04:00 UTC) or Manual Dispatch
     |
     v
[test job] -- pytest (non-browser tests, 10min timeout)
     |
     v (on success)
[scrape job] -- (240min timeout)
     |
     +-- Install dependencies (uv sync)
     +-- Install Scrapling browsers
     +-- Run pipeline (uv run scrape run --json-logs)
     +-- On failure: upload .buffer/ artifact
     +-- Always: upload .logs/ artifact
```

### ci.yml Flow

```
Pull Request to main
     |
     +-- [lint-and-typecheck] -- Biome + TypeScript (web/)
     +-- [validate-sources]   -- JSON Schema validation (sources/)
     +-- [validate-configs]   -- Pipeline config validation (scraping/)
```

## Error Handling

### Retry Strategy

Network requests use exponential backoff with jitter:
- 3 retries max
- Base delay: 2 seconds
- Max delay: 30 seconds
- Jitter: 0-1 second random addition

### Fallback Chain

Each source can define a `secondary_method`. If the primary scraper raises an exception, the pipeline can fall back:

```
api (fast, structured)
  -> scrape (CSS selectors)
    -> scrapling (full browser rendering)
```

### Rot Detection

The `RotDetector` classifies errors and tracks consecutive failures per source:

| Failures | Action |
|----------|--------|
| 1-4 | Logged, source remains active |
| 5 | GitHub Issue created with suggested fix |
| 5+ | Source status set to `degraded` then `failing` |
| 404/410 | Immediate deactivation (permanent-gone) |

### Health States

```
healthy -> degraded (3+ failures) -> failing (5+ failures) -> deactivated (permanent-gone)
                                                                     |
                                                               (manual reactivation)
                                                                     |
                                                                     v
                                                                  healthy
```

## Free Tier Budget Analysis

Convex free tier: **1M function calls/month**.

### Estimated Usage per Full Scrape Run

| Operation | Calls | Notes |
|-----------|-------|-------|
| startRun | 1 | One per pipeline execution |
| batchInsertRawRecords | ~200 | ~10,000 records / 50 per batch |
| updateLastScraped | ~200 | One per source |
| recordSourceResult | ~200 | One per source |
| recordSuccess/Failure | ~200 | One per source |
| completeRun | 1 | One per pipeline execution |
| **Total per run** | **~800** | |

### Monthly Budget (daily runs)

| Component | Calls/Month | % of Budget |
|-----------|-------------|-------------|
| Scraping pipeline (30 runs) | ~24,000 | 2.4% |
| Dashboard queries | ~10,000 | 1.0% |
| Public API (Phase 5+) | ~100,000 | 10% |
| Real-time subscriptions | ~50,000 | 5% |
| **Estimated total** | **~184,000** | **18.4%** |

Budget is well within free tier limits. The batch pattern (50 records per call) is the key optimization -- without batching, 10,000 individual inserts would consume 30% of the monthly budget per run.

## CLI Commands

| Command | Purpose |
|---------|---------|
| `scrape run` | Execute the scraping pipeline |
| `scrape status` | Show recent runs and failing sources |
| `scrape health` | Detailed per-source health report |
| `scrape validate` | Validate all config modules |
| `scrape export` | Export data from Convex as JSON/CSV |
| `scrape reactivate` | Re-enable deactivated source |
| `scrape gen-config` | Auto-generate starter config from URL |
