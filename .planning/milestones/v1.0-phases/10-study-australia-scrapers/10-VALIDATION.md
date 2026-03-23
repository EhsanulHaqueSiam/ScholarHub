---
phase: 10
slug: study-australia-scrapers
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 9.0.2+ with pytest-asyncio |
| **Config file** | `scraping/pyproject.toml` [tool.pytest.ini_options] |
| **Quick run command** | `cd scraping && uv run pytest tests/test_inertia_scraper.py tests/test_configs/test_config_protocol.py -x` |
| **Full suite command** | `cd scraping && uv run pytest` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd scraping && uv run pytest tests/test_inertia_scraper.py tests/test_configs/test_config_protocol.py -x`
- **After every plan wave:** Run `cd scraping && uv run pytest`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 0 | SA-02 | unit | `cd scraping && uv run pytest tests/test_inertia_scraper.py::test_version_extraction -x` | ❌ W0 | ⬜ pending |
| 10-01-02 | 01 | 0 | SA-03 | unit | `cd scraping && uv run pytest tests/test_inertia_scraper.py::test_pagination -x` | ❌ W0 | ⬜ pending |
| 10-01-03 | 01 | 0 | SA-04 | unit | `cd scraping && uv run pytest tests/test_inertia_scraper.py::test_version_mismatch_retry -x` | ❌ W0 | ⬜ pending |
| 10-01-04 | 01 | 0 | SA-05 | unit | `cd scraping && uv run pytest tests/test_inertia_scraper.py::test_scholarship_field_mapping -x` | ❌ W0 | ⬜ pending |
| 10-02-01 | 02 | 1 | SA-01 | unit | `cd scraping && uv run pytest tests/test_configs/test_config_protocol.py -x` | ✅ | ⬜ pending |
| 10-02-02 | 02 | 1 | SA-06 | unit | `cd scraping && uv run pytest tests/test_configs/test_config_protocol.py -x` | ✅ | ⬜ pending |
| 10-02-03 | 02 | 1 | SA-07 | unit | `cd scraping && uv run pytest tests/test_configs/test_config_protocol.py::TestConfigProtocol::test_config_catalog_sync -x` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scraping/tests/test_inertia_scraper.py` — test stubs for SA-02 through SA-05
- [ ] `scraping/tests/fixtures/inertia_scholarship_response.json` — mock Inertia API response fixture

*Wave 0 creates test infrastructure before implementation begins.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Live Inertia API returns expected JSON | SA-02 | Requires network access to live site | `curl -H "X-Inertia: true" -H "X-Inertia-Version: {hash}" "https://search.studyaustralia.gov.au/scholarships?page=1"` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
