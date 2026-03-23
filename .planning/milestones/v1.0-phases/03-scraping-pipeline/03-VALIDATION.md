---
phase: 03
slug: scraping-pipeline
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 7.x |
| **Config file** | `scraping/pytest.ini` or "none — Wave 0 installs" |
| **Quick run command** | `cd scraping && python -m pytest tests/ -x -q --timeout=30` |
| **Full suite command** | `cd scraping && python -m pytest tests/ -v --timeout=60` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd scraping && python -m pytest tests/ -x -q --timeout=30`
- **After every plan wave:** Run `cd scraping && python -m pytest tests/ -v --timeout=60`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | SCRP-01 | unit | `pytest tests/test_config.py` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | SCRP-02 | unit | `pytest tests/test_scrapers.py` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 1 | SCRP-03 | integration | `pytest tests/test_convex_sink.py` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 2 | SCRP-04 | unit | `pytest tests/test_metrics.py` | ❌ W0 | ⬜ pending |
| 03-03-01 | 03 | 2 | SCRP-05 | integration | `pytest tests/test_pipeline_e2e.py` | ❌ W0 | ⬜ pending |
| 03-03-02 | 03 | 2 | SCRP-06 | unit | `pytest tests/test_monitoring.py` | ❌ W0 | ⬜ pending |
| 03-03-03 | 03 | 2 | SCRP-07 | unit | `pytest tests/test_scheduling.py` | ❌ W0 | ⬜ pending |
| 03-03-04 | 03 | 2 | INFR-04 | integration | `pytest tests/test_ci_workflow.py` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scraping/tests/conftest.py` — shared fixtures (mock Convex client, sample HTML fixtures)
- [ ] `scraping/tests/test_config.py` — stubs for SCRP-01 (source config validation)
- [ ] `scraping/tests/test_scrapers.py` — stubs for SCRP-02 (scraper type dispatch)
- [ ] `scraping/tests/test_convex_sink.py` — stubs for SCRP-03 (batch mutation to Convex)
- [ ] `scraping/tests/test_metrics.py` — stubs for SCRP-04 (yield metrics)
- [ ] `scraping/tests/test_monitoring.py` — stubs for SCRP-06 (scraper rot detection)
- [ ] `pytest` + `pytest-timeout` — install if not in requirements

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Cloudflare bypass via Scrapling StealthyFetcher | SCRP-05 | Requires live Cloudflare-protected site | Run `python -m scraping scrape --source cloudflare-test --dry-run` against a known CF-protected URL |
| GitHub Actions scheduled trigger | INFR-04 | Requires actual GH Actions environment | Verify workflow runs on schedule in Actions tab |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
