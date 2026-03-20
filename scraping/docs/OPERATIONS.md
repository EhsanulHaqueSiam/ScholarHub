# Pipeline Operations Guide

How to run, monitor, debug, and maintain the ScholarHub scraping pipeline.

## Running the Pipeline

### Local Development

Run the full pipeline with dry-run mode (writes to local JSON, skips Convex):

```bash
cd scraping && uv run scrape run --dry-run
```

Run a single source:

```bash
cd scraping && uv run scrape run --dry-run --source daad-scholarships
```

Run all sources in a specific wave:

```bash
cd scraping && uv run scrape run --dry-run --wave 1
```

Enable structured JSON logging (for CI/production):

```bash
cd scraping && uv run scrape run --json-logs
```

### Production (via Convex)

Requires `CONVEX_URL` and `CONVEX_DEPLOY_KEY` environment variables (or `.env.local` at repo root):

```bash
cd scraping && uv run scrape run --source daad-scholarships
```

### GitHub Actions

#### Scheduled Runs

The `scrape.yml` workflow runs automatically at **04:00 UTC daily**. It:

1. Runs unit tests (non-browser)
2. Installs Scrapling browser dependencies
3. Executes the full pipeline with `--json-logs`
4. Uploads `.buffer/` as artifact on failure
5. Uploads `.logs/` as artifact always

#### Manual Dispatch (workflow_dispatch)

Trigger from the Actions tab on GitHub with optional inputs:

| Input | Description | Default |
|-------|-------------|---------|
| `source` | Run only this source (by name or source_id) | All due sources |
| `wave` | Run only sources in this wave number | All waves |
| `dry_run` | Write to local JSON, skip Convex | `false` |

## Monitoring

### Quick Status

View recent runs and failing sources:

```bash
cd scraping && uv run scrape status
```

Output shows:
- Last 10 runs with status, source count, record count, duration
- List of currently failing sources with failure count and error type

### Detailed Health Report

Per-source health with telemetry:

```bash
cd scraping && uv run scrape health
```

Filter to a specific source:

```bash
cd scraping && uv run scrape health --source daad-scholarships
```

Shows status (healthy/degraded/failing/deactivated), consecutive failures, last success, average yield.

### Convex Dashboard

Monitor database usage and function calls at:

```
https://dashboard.convex.dev
```

Key tables to watch:
- `scrape_runs` -- Pipeline execution history
- `source_health` -- Per-source reliability tracking
- `raw_records` -- Ingested scholarship data
- `scrape_run_sources` -- Per-source results within each run

## Debugging Failures

### 1. Check recent run status

```bash
cd scraping && uv run scrape status
```

Look for sources with `consecutive_failures > 0`.

### 2. Check GitHub Issues

Scraper rot detection automatically creates GitHub Issues when a source fails 5 consecutive times. Check the repo's Issues tab for issues with the `scraper-rot` label.

### 3. Inspect buffer files

On failed runs, the GitHub Actions workflow uploads `.buffer/` as an artifact. Download and inspect:

```bash
# After downloading the artifact
cat scrape-buffer-<run-id>/source-id.json
```

For local debugging:

```bash
cd scraping && uv run scrape run --dry-run --source failing-source
ls .buffer/
cat .buffer/failing-source.json
```

### 4. Check logs

In GitHub Actions, logs are uploaded as artifacts. Locally:

```bash
# Run with verbose JSON logs
cd scraping && uv run scrape run --dry-run --source failing-source --json-logs
```

### 5. Common error types

| Error Type | Cause | Action |
|-----------|-------|--------|
| `timeout` | Source too slow | Increase timeout or rate_limit_delay |
| `http_4xx` | Client error (forbidden, not found) | Check URL, may need auth |
| `http_5xx` | Server error | Transient, will retry next run |
| `parse_error` | Selectors broken | Source changed HTML structure |
| `empty_response` | No data returned | Source may be down or blocked |
| `permanent_gone` (404/410) | Source removed | Auto-deactivated |

### 6. Test a fix locally

After updating a config's selectors:

```bash
cd scraping && uv run scrape validate
cd scraping && uv run scrape run --dry-run --source fixed-source
cat .buffer/fixed-source.json | python3 -m json.tool | head -50
```

## Source Management

### Reactivating a Deactivated Source

When a source is fixed and ready to retry:

```bash
cd scraping && uv run scrape reactivate source-name
```

This resets health status to healthy and triggers a test scrape.

### Validating Configs

Check all config modules for protocol compliance:

```bash
cd scraping && uv run scrape validate
```

Run the full config test suite:

```bash
cd scraping && uv run pytest tests/test_configs/ -x
```

### Adding a New Source

1. Create a config module (see [CONFIG_GUIDE.md](CONFIG_GUIDE.md))
2. Validate: `uv run scrape validate`
3. Test: `uv run scrape run --dry-run --source new-source`
4. Inspect: `cat .buffer/new-source.json`
5. Commit and let CI verify

## Data Export

Export scraped data from Convex:

```bash
# JSON format
cd scraping && uv run scrape export --format json -o output.json

# CSV format
cd scraping && uv run scrape export --format csv -o output.csv

# Filter by source
cd scraping && uv run scrape export --format json --source daad-scholarships -o daad.json
```

## Seeding Test Data

For development without live scraping:

```bash
# Preview what would be generated
cd scraping && uv run python scripts/seed_test_data.py --dry-run --count 5

# Seed 100 fake scholarships to Convex
cd scraping && uv run python scripts/seed_test_data.py --count 100

# Reproducible output with seed
cd scraping && uv run python scripts/seed_test_data.py --dry-run --count 10 --seed 42
```

## CI Integration

The `ci.yml` workflow validates configs on every PR to `main`:

- **validate-configs** job: runs `uv run scrape validate` and config-catalog sync test
- **validate-sources** job: validates source catalog JSON against schema

This prevents broken configs from merging. If a PR modifies config files, both jobs must pass.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CONVEX_URL` | For live runs | Convex deployment URL |
| `CONVEX_DEPLOY_KEY` | For live runs | Convex admin deploy key |
| `GITHUB_TOKEN` | For rot detection | GitHub API token for issue creation |
| `GITHUB_REPOSITORY` | For rot detection | `owner/repo` format |

Set locally via `.env.local` at repo root or export in your shell.
