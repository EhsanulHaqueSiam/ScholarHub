---
phase: 02
slug: source-discovery
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework (Python)** | pytest 9.0.2+ |
| **Framework (TypeScript)** | vitest 4.1.0 + convex-test |
| **Python config** | `scraping/pyproject.toml` [tool.pytest.ini_options] |
| **TS config** | `web/vitest.config.ts` |
| **Quick run command (Python)** | `cd scraping && uv run pytest tests/ -x` |
| **Quick run command (TS)** | `cd web && bun run vitest run` |
| **Full suite command** | `cd scraping && uv run pytest tests/ && cd ../web && bun run vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** `cd scraping && uv run pytest tests/ -x` OR `cd web && bun run vitest run` (depending on which side was changed)
- **After every plan wave:** Run full suite (both Python and TypeScript tests)
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | SRCD-05 | unit | `cd scraping && uv run pytest tests/test_seed_sources.py -x` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | SRCD-05 | unit | `cd web && bun run vitest run src/tests/sources.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | SRCD-05 | unit | `cd scraping && uv run pytest tests/test_validate_sources.py -x` | ❌ W0 | ⬜ pending |
| 02-01-04 | 01 | 1 | SRCD-01 | unit | `cd scraping && uv run pytest tests/test_seed_sources.py -x` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 2 | SRCD-01 | manual-only | `cd scraping && python scripts/stats_sources.py` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `web/src/tests/sources.test.ts` — Vitest + convex-test tests for upsertSource mutation
- [ ] `scraping/tests/test_seed_sources.py` — pytest tests for seed script (JSON parsing, validation, upsert prep)
- [ ] `scraping/tests/test_validate_sources.py` — pytest tests for URL validation logic and normalization
- [ ] `scraping/tests/fixtures/sample_sources.json` — 5 sample entries covering each category
- [ ] `bun add -d convex-test @edge-runtime/vm` — convex-test not yet installed
- [ ] `cd scraping && uv add aiohttp jsonschema` — aiohttp not yet a project dependency; jsonschema needs explicit addition

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 1000+ sources in catalog | SRCD-01 | Count depends on AI-assisted discovery sessions | Run `cd scraping && python scripts/stats_sources.py` and verify total >= 1000 |
| URL reachability for CF-protected sites | SRCD-05 | Requires browser installation, heavyweight for CI | Run locally: `cd scraping && python scripts/validate_sources.py --check-cf` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
