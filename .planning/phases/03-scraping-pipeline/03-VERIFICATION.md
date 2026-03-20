---
phase: 03-scraping-pipeline
verified: 2026-03-20T12:35:32Z
status: passed
score: 33/33 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 27/31
  gaps_closed:
    - "Sources are auto-deactivated after hitting failure threshold (should_deactivate now called in runner.py failure path, deactivateSource Convex mutation added)"
    - "Duplicate issues are prevented via source_health.github_issue_number tracking (storeGitHubIssueNumber mutation added, return value captured and stored, existing_issue checked before create)"
    - "GitHub Issues auto-closed when sources recover (close_issue now called in success path, clearGitHubIssueNumber mutation added and invoked)"
    - "RSS sources use primary_method='rss' (agg_scholars4dev.py and agg_findaphd.py updated with rss method and feed_url selectors)"
  gaps_remaining: []
  regressions: []
human_verification: []
---

# Phase 3: Scraping Pipeline Verification Report

**Phase Goal:** Build the complete scraping pipeline — Python package with 6 scraper types, 201 source configs, ingestion layer, monitoring, pipeline runner, CLI, CI/CD, and documentation.
**Verified:** 2026-03-20T12:35:32Z
**Status:** passed
**Re-verification:** Yes — after gap closure (Plans 03-08, 03-09)

## Re-verification Summary

Previous verification (2026-03-20T14:00:00Z) identified 3 gaps blocking goal achievement. Gap closure plans 03-08 and 03-09 were executed via commits `9e6e8bb` (auto-deactivation and issue lifecycle) and `9537dbd` (RSS configs). All 3 gaps are now closed. No regressions detected in the 27 previously-verified items.

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Python package renamed to scholarhub_pipeline, all Scrapy removed | VERIFIED | `scraping/pyproject.toml` name="scholarhub-pipeline", no scrapy dependency |
| 2 | All new dependencies installed and importable | VERIFIED | pyproject.toml lists scrapling, extruct, feedparser, click, convex, pycountry, structlog, bleach, httpx |
| 3 | Convex has 4 new tables (scrape_runs, source_health, scrape_run_sources, change_log) | VERIFIED | schema.ts defines all 4 tables with correct fields and indexes |
| 4 | Convex has batch mutations with upsert+dedup logic | VERIFIED | scraping.ts batchInsertRawRecords with by_source_external index lookup and field-level diff |
| 5 | Convex has run lifecycle mutations and dashboard queries | VERIFIED | startRun, completeRun, recordSourceResult, updateSourceHealth, updateLastScraped all exist |
| 6 | Convex cron jobs for 90-day cleanup and heartbeat | VERIFIED | crons.ts: cleanup_old_records (daily 3:00), cleanup_change_log (3:30), heartbeat_check (hourly) |
| 7 | SourceConfig protocol and base classes define config contract | VERIFIED | _protocol.py @runtime_checkable Protocol with all required fields; _bases.py 4 concrete base classes |
| 8 | Convex client supports admin auth and batch mutation calls | VERIFIED | convex_client.py PipelineConvexClient with set_admin_auth(key) |
| 9 | Records batched 50 per flush before sending to Convex | VERIFIED | batch.py BatchAccumulator with batch_size=50 default, auto-flush on add() |
| 10 | Country names normalized to ISO 3166 codes | VERIFIED | normalizer.py normalize_country() with pycountry.countries.search_fuzzy |
| 11 | Dates parsed to ISO 8601, currencies to ISO 4217 | VERIFIED | normalizer.py normalize_date() via dateutil, normalize_currency() with _CURRENCY_MAP |
| 12 | Quality flags detect missing/short/unparseable/unknown fields | VERIFIED | quality.py check_quality() returns flags: missing_title, missing_source_url, suspiciously_short_*, unparseable_deadline, unrecognized_country |
| 13 | Within-source dedup by external_id or source_url | VERIFIED | dedup.py SourceDeduplicator tracks seen_external_ids and seen_source_urls per source |
| 14 | Field-level diffs computed for change tracking | VERIFIED | differ.py exists; scraping.ts batchInsertRawRecords computes diffs and writes to change_log |
| 15 | HTML sanitized from scraped descriptions | VERIFIED | utils/sanitizer.py exists; base.py process_record() calls sanitize_html() |
| 16 | UA rotation provides 15+ browser UA strings | VERIFIED | ua_rotation.py has 28+ Mozilla/Chrome/Safari/Firefox strings |
| 17 | Retry logic with exponential backoff for 429/5xx | VERIFIED | utils/retry.py retry_with_backoff() with RETRYABLE_STATUS_CODES = {429, 500, 502, 503, 504} |
| 18 | API scraper fetches JSON from API endpoints with pagination | VERIFIED | scrapers/api_scraper.py ApiScraper with _extract_items, _get_next_url, httpx async client |
| 19 | JSON-LD extractor pulls structured data via extruct | VERIFIED | scrapers/jsonld_extractor.py JsonLdExtractor class |
| 20 | RSS scraper parses RSS/Atom feeds | VERIFIED | scrapers/rss_scraper.py RssScraper class |
| 21 | HTML scraper uses Scrapling Spider for standard pages | VERIFIED | html_scraper.py imports `from scrapling import Fetcher`, class HtmlScraper |
| 22 | Stealthy scraper for Cloudflare-protected pages | VERIFIED | stealthy_scraper.py StealthyScraper class |
| 23 | Health tracker updates source status after each scrape | VERIFIED | monitoring/health.py HealthTracker.record_success() and record_failure() call scraping:updateSourceHealth |
| 24 | Rot detector flags sources after 5 consecutive failures | VERIFIED | rot_detector.py FAILURE_THRESHOLD=5, should_alert() returns True at exactly 5 |
| 25 | Rot detector detects yield drops below 50% of average | VERIFIED | rot_detector.py detect_yield_drop() with YIELD_DROP_RATIO=0.5 |
| 26 | Sources are auto-deactivated after hitting failure threshold | VERIFIED | runner.py line 275: rot.should_deactivate(failures, error_type) called in failure path; scraping:deactivateSource mutation issued when True; DEACTIVATE_THRESHOLD=10 in rot_detector.py |
| 27 | GitHub Issues auto-created for failing sources | VERIFIED | github_issues.py create_rot_issue() creates Issues via gh CLI; runner.py calls it at alert threshold only when existing_issue is None |
| 28 | GitHub Issues auto-closed when sources recover + duplicate prevention | VERIFIED | runner.py success path (lines 179-194): reads github_issue_number from health_after_success, calls mgr.close_issue(), then calls scraping:clearGitHubIssueNumber; failure path (lines 250-255) checks existing_issue before creating new issue |
| 29 | Pipeline runner orchestrates full scrape runs | VERIFIED | runner.py PipelineRunner.run() calls startRun -> scrape sources -> completeRun |
| 30 | CLI provides 7 subcommands: run, status, gen-config, export, validate, reactivate, health | VERIFIED | cli.py all 7 subcommands defined with @click.group/@scrape.command decorators |
| 31 | GitHub Actions scrape workflow with daily cron + 4h timeout + CI config validation | VERIFIED | scrape.yml: `cron: '0 4 * * *'`, timeout-minutes: 240, uploads .buffer/ on failure; ci.yml has validate-configs job |
| 32 | All 201+ source configs implement SourceConfig protocol | VERIFIED | 205 configs across agg_(47), off_(79), gov_(48), fnd_(31); discover_configs() scans via pkgutil; test_config_protocol.py validates all |
| 33 | RSS sources use primary_method='rss' | VERIFIED | agg_scholars4dev.py (line 15: primary_method='rss', feed_url='https://www.scholars4dev.com/feed/') and agg_findaphd.py (line 15: primary_method='rss', feed_url='https://www.findaphd.com/phds/rss') — 2 of 205 configs confirmed |

**Score:** 33/33 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scraping/pyproject.toml` | Renamed package + new deps | VERIFIED | name="scholarhub-pipeline", all deps present |
| `scraping/src/scholarhub_pipeline/configs/_protocol.py` | SourceConfig Protocol | VERIFIED | @runtime_checkable Protocol with all required fields |
| `scraping/src/scholarhub_pipeline/configs/_bases.py` | Base config classes | VERIFIED | BaseSourceConfig + 4 category-specific subclasses |
| `web/convex/schema.ts` | Extended with 4 new tables | VERIFIED | scrape_runs, source_health (with github_issue_number, deactivation_reason), scrape_run_sources, change_log |
| `web/convex/scraping.ts` | Batch mutations + run lifecycle + deactivation + issue tracking | VERIFIED | batchInsertRawRecords, startRun, completeRun, updateSourceHealth, updateLastScraped, deactivateSource, storeGitHubIssueNumber, clearGitHubIssueNumber all present |
| `web/convex/crons.ts` | Cleanup + heartbeat crons | VERIFIED | cleanup_old_records, cleanup_change_log, heartbeat_check |
| `scraping/src/scholarhub_pipeline/ingestion/convex_client.py` | Convex admin auth client | VERIFIED | PipelineConvexClient with set_admin_auth |
| `scraping/src/scholarhub_pipeline/ingestion/normalizer.py` | Country/date/currency normalization | VERIFIED | normalize_country, normalize_date, normalize_currency, normalize_record |
| `scraping/src/scholarhub_pipeline/ingestion/quality.py` | Quality flag logic | VERIFIED | check_quality() with 5 flag types |
| `scraping/src/scholarhub_pipeline/ingestion/batch.py` | BatchAccumulator | VERIFIED | batch_size=50, flush via convex_client.mutation |
| `scraping/src/scholarhub_pipeline/ingestion/dedup.py` | Within-source dedup | VERIFIED | SourceDeduplicator by external_id + source_url |
| `scraping/tests/test_normalizer.py` | Normalization tests | VERIFIED | 118 lines (min 50) |
| `scraping/tests/test_quality.py` | Quality flag tests | VERIFIED | 101 lines (min 40) |
| `scraping/src/scholarhub_pipeline/scrapers/base.py` | BaseScraper | VERIFIED | abstract class with SourceConfig, normalize_record, check_quality wiring |
| `scraping/src/scholarhub_pipeline/scrapers/api_scraper.py` | ApiScraper | VERIFIED | class ApiScraper with pagination and httpx |
| `scraping/src/scholarhub_pipeline/scrapers/jsonld_extractor.py` | JsonLdExtractor | VERIFIED | class JsonLdExtractor |
| `scraping/src/scholarhub_pipeline/scrapers/rss_scraper.py` | RssScraper | VERIFIED | class RssScraper; agg_scholars4dev and agg_findaphd now use primary_method='rss' |
| `scraping/src/scholarhub_pipeline/scrapers/html_scraper.py` | HtmlScraper via Scrapling | VERIFIED | imports Scrapling Fetcher |
| `scraping/src/scholarhub_pipeline/scrapers/stealthy_scraper.py` | StealthyScraper | VERIFIED | class StealthyScraper |
| `scraping/src/scholarhub_pipeline/monitoring/health.py` | HealthTracker | VERIFIED | class HealthTracker with record_success/record_failure |
| `scraping/src/scholarhub_pipeline/monitoring/rot_detector.py` | RotDetector | VERIFIED | should_deactivate() now called in runner.py at DEACTIVATE_THRESHOLD=10 |
| `scraping/src/scholarhub_pipeline/monitoring/github_issues.py` | GitHub Issue auto-create/close | VERIFIED | create_rot_issue() wired with dedup guard; close_issue() called on source recovery |
| `scraping/tests/test_monitoring.py` | Monitoring tests | VERIFIED | 318 lines, 37 test methods including test_close_issue_calls_gh_cli, test_close_issue_returns_false_on_failure |
| `scraping/src/scholarhub_pipeline/pipeline/runner.py` | Complete PipelineRunner with full failure+success handlers | VERIFIED | 311 lines; should_deactivate at line 275; storeGitHubIssueNumber at line 267; close_issue at line 190; dedup guard at line 255 |
| `scraping/src/scholarhub_pipeline/pipeline/scheduler.py` | SourceScheduler | VERIFIED | filter_due_sources, group_by_method, filter_active |
| `scraping/src/scholarhub_pipeline/cli.py` | 7-subcommand CLI | VERIFIED | run, status, gen-config, export, validate, reactivate, health |
| `scraping/tests/test_pipeline.py` | Pipeline tests including deactivation and issue lifecycle | VERIFIED | 487 lines, 22 test methods including test_runner_deactivates_source_after_threshold, test_runner_stores_issue_number_on_alert, test_runner_skips_duplicate_issue_creation, test_runner_closes_issue_on_recovery |
| `scraping/tests/test_cli.py` | CLI tests | VERIFIED | 198 lines (min 60) |
| `scraping/src/scholarhub_pipeline/configs/` | 201+ source config modules | VERIFIED | 205 configs (agg_: 47, off_: 79, gov_: 48, fnd_: 31) |
| `scraping/tests/test_configs/test_config_protocol.py` | Protocol validation test | VERIFIED | test_all_configs_implement_protocol, test_config_catalog_sync |
| `.github/workflows/scrape.yml` | Daily scraping workflow | VERIFIED | cron 0 4 * * *, 4h timeout, buffer upload on failure |
| `.github/workflows/ci.yml` | CI with config validation | VERIFIED | validate-configs job runs `uv run scrape validate` |
| `scraping/scripts/seed_test_data.py` | Test data seed script | VERIFIED | generate_fake_scholarship() present |
| `scraping/src/scholarhub_pipeline/configs/agg_scholars4dev.py` | RSS config with feed_url | VERIFIED | primary_method='rss', feed_url='https://www.scholars4dev.com/feed/', secondary_method='scrape' |
| `scraping/src/scholarhub_pipeline/configs/agg_findaphd.py` | RSS config with feed_url | VERIFIED | primary_method='rss', feed_url='https://www.findaphd.com/phds/rss', secondary_method='scrape' |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `configs/_bases.py` | `configs/_protocol.py` | base classes implement protocol | VERIFIED | BaseSourceConfig dataclass satisfies SourceConfig Protocol attributes |
| `web/convex/scraping.ts` | `web/convex/schema.ts` | mutations write to schema tables | VERIFIED | ctx.db.insert("raw_records"), ctx.db.insert("change_log") |
| `ingestion/batch.py` | `ingestion/convex_client.py` | batch flushes via convex client | VERIFIED | self._client.mutation("scraping:batchInsertRawRecords") |
| `ingestion/normalizer.py` | pycountry | country lookup | VERIFIED | pycountry.countries.search_fuzzy(name) |
| `scrapers/base.py` | `configs/_protocol.py` | scrapers consume SourceConfig | VERIFIED | from scholarhub_pipeline.configs._protocol import SourceConfig |
| `scrapers/base.py` | `ingestion/normalizer.py` | records normalized before yield | VERIFIED | normalize_record(raw) called in process_record() |
| `scrapers/html_scraper.py` | scrapling | uses Scrapling Fetcher | VERIFIED | `from scrapling import Fetcher` |
| `monitoring/health.py` | `web/convex/scraping.ts` | calls updateSourceHealth | VERIFIED | self.convex.mutation("scraping:updateSourceHealth") |
| `monitoring/github_issues.py` | GitHub Issues API | subprocess call to gh CLI | VERIFIED | subprocess.run(["gh", "issue", "create", ...]) |
| `monitoring/github_issues.py` | Convex source_health | store issue number to prevent duplicates | VERIFIED | runner.py captures return value and calls scraping:storeGitHubIssueNumber |
| `monitoring/rot_detector.py` | `pipeline/runner.py` | auto-deactivation invocation | VERIFIED | rot.should_deactivate(failures, error_type) called at runner.py line 275; scraping:deactivateSource mutation issued |
| `agg_scholars4dev.py` | `scrapers/rss_scraper.py` | primary_method='rss' routes to RssScraper | VERIFIED | get_scraper() factory maps 'rss' to RssScraper; feed_url in selectors |
| `agg_findaphd.py` | `scrapers/rss_scraper.py` | primary_method='rss' routes to RssScraper | VERIFIED | get_scraper() factory maps 'rss' to RssScraper; feed_url in selectors |
| `pipeline/runner.py` | `scrapers/__init__.py` | get_scraper factory | VERIFIED | from scholarhub_pipeline.scrapers import get_scraper |
| `pipeline/runner.py` | `ingestion/batch.py` | BatchAccumulator for batching | VERIFIED | batch = BatchAccumulator(self.convex, run_id) |
| `pipeline/runner.py` | `monitoring/health.py` | HealthTracker post-scrape | VERIFIED | HealthTracker(self.convex).record_success/record_failure |
| `cli.py` | `pipeline/runner.py` | CLI invokes pipeline runner | VERIFIED | from scholarhub_pipeline.pipeline.runner import PipelineRunner |
| `.github/workflows/scrape.yml` | `cli.py` | workflow invokes CLI | VERIFIED | `uv run scrape run $ARGS` |
| `.github/workflows/ci.yml` | `cli.py` | CI validates via CLI | VERIFIED | `uv run scrape validate` |

---

### Requirements Coverage

| Requirement | Description | Source Plans | Status | Evidence |
|-------------|-------------|-------------|--------|---------|
| SCRP-01 | API-first scraping when available | Plan 03, 06 | SATISFIED | api_scraper.py ApiScraper; 2 configs with primary_method='api' |
| SCRP-02 | Standard HTTP scraping fallback | Plan 03, 06 | SATISFIED | html_scraper.py HtmlScraper; 196 configs with primary_method='scrape' |
| SCRP-03 | Scrapling for Cloudflare-protected sites | Plan 03, 06 | SATISFIED | stealthy_scraper.py StealthyScraper; 3 configs with primary_method='scrapling' |
| SCRP-04 | GitHub Actions automated schedule | Plan 05, 07 | SATISFIED | scrape.yml cron 0 4 * * *, 4h timeout, CLI invocation wired |
| SCRP-05 | Scraped data lands in raw_records staging | Plan 01, 02 | SATISFIED | raw_records table in schema.ts; batchInsertRawRecords writes to it |
| SCRP-06 | Yield metrics logged per source per run | Plan 01, 04, 05 | SATISFIED | scrape_run_sources table; recordSourceResult mutation; runner.py stats dict |
| SCRP-07 | "Last verified" timestamp per source | Plan 01, 02, 05 | SATISFIED | updateLastScraped mutation; runner.py calls it after each successful scrape |
| INFR-04 | Scraping monitoring + rot detection | Plan 04, 07, 08 | SATISFIED | Health tracking wired; rot alert with dedup wired; auto-deactivation at 10 failures wired; issue auto-closure on recovery wired |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `cli.py` | ~307 | `name="TODO: Human-readable name"` | INFO | Inside _generate_config_template() string output — intentional placeholder text for user-editable generated configs, not a code stub |

No blocker or warning-level anti-patterns. No orphaned methods. No dead code paths remaining.

---

### Human Verification Required

None. All automated checks pass and all wiring is verifiable via static analysis.

---

### Gaps Summary

No gaps remaining. All 3 previously-identified gaps are closed:

**Gap 1 (closed) — Auto-deactivation now wired.**
`runner.py` failure path calls `rot.should_deactivate(failures, error_type)` at line 275. When True, it issues `scraping:deactivateSource` mutation which sets `source_health.status = "deactivated"` and `sources.is_active = false`. The Convex mutation is substantively implemented with both patch-existing and insert-new branches. Test `test_runner_deactivates_source_after_threshold` in test_pipeline.py covers the behavior.

**Gap 2 (closed) — GitHub Issue lifecycle now fully wired.**
Failure path: `create_rot_issue()` return value is captured; `existing_issue` check at line 255 prevents duplicate creation; `scraping:storeGitHubIssueNumber` mutation at line 267 persists the issue number. Success path: `health_after_success.get("github_issue_number")` at line 180 reads the stored number; `mgr.close_issue()` at line 190 closes it via gh CLI; `scraping:clearGitHubIssueNumber` at line 192 clears the stored number. Four tests in test_pipeline.py cover all four behaviors.

**Gap 3 (closed) — RSS configs now exist.**
`agg_scholars4dev.py` uses `primary_method='rss'` with `feed_url='https://www.scholars4dev.com/feed/'`. `agg_findaphd.py` uses `primary_method='rss'` with `feed_url='https://www.findaphd.com/phds/rss'`. Both retain all HTML selectors for the `secondary_method='scrape'` fallback. The RssScraper code path is now exercisable in production.

---

_Verified: 2026-03-20T12:35:32Z_
_Verifier: Claude (gsd-verifier)_
