---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework (TS)** | Vitest 4.1.0 |
| **Framework (Python)** | pytest 9.0.2 |
| **Config file (TS)** | `web/vitest.config.ts` (Wave 0) |
| **Config file (Python)** | `scraping/pyproject.toml` [tool.pytest.ini_options] (Wave 0) |
| **Quick run command (TS)** | `cd web && bun vitest run --reporter=verbose` |
| **Quick run command (Python)** | `cd scraping && uv run pytest -x -v` |
| **Full suite command** | `cd web && bun vitest run --coverage && cd ../scraping && uv run pytest -x -v` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd web && bun vitest run --reporter=verbose`
- **After every plan wave:** Run `cd web && bun vitest run --coverage && cd ../scraping && uv run pytest -x -v`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | INFR-01 | smoke | `test -f web/package.json && test -f scraping/pyproject.toml` | N/A | ⬜ pending |
| 01-01-02 | 01 | 1 | INFR-02 | integration | `cd web && npx convex dev --once` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | INFR-02 | unit | `cd web && bun vitest run src/tests/schema.test.ts -x` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 2 | INFR-03 | smoke | `cd web && bun run build` | N/A | ⬜ pending |
| 01-02-02 | 02 | 2 | INFR-03 | unit | `cd web && bun vitest run src/tests/home.test.tsx -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `web/vitest.config.ts` — Vitest configuration with jsdom environment
- [ ] `web/tests/setup.ts` — Testing library setup (@testing-library/jest-dom)
- [ ] `scraping/tests/conftest.py` — pytest shared fixtures
- [ ] Framework install (TS): `cd web && bun add -d vitest @testing-library/react @testing-library/jest-dom jsdom`
- [ ] Framework install (Python): `cd scraping && uv add --group dev pytest`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Netlify deploy succeeds | INFR-03 | Requires Netlify account and deploy key | Push to main, verify build succeeds in Netlify dashboard |
| Placeholder page renders in browser | INFR-03 | Visual verification | Open deployed URL, confirm page loads with content |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
