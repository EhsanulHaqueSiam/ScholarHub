---
phase: 4
slug: data-aggregation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.0 + convex-test 0.0.41 |
| **Config file** | `web/vitest.config.ts` |
| **Quick run command** | `cd web && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd web && npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd web && npx vitest run --reporter=verbose`
- **After every plan wave:** Run `cd web && npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 0 | AGGR-01..06 | unit | `cd web && npx vitest run src/tests/aggregation.test.ts -x` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | AGGR-02 | unit | `cd web && npx vitest run src/tests/aggregation.test.ts -t "composite match" -x` | ❌ W0 | ⬜ pending |
| 04-01-03 | 01 | 1 | AGGR-01,03 | unit | `cd web && npx vitest run src/tests/aggregation.test.ts -t "merges multi-source" -x` | ❌ W0 | ⬜ pending |
| 04-01-04 | 01 | 1 | AGGR-04 | unit | `cd web && npx vitest run src/tests/aggregation.test.ts -t "preserves raw_records" -x` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 2 | AGGR-05 | unit | `cd web && npx vitest run src/tests/aggregation.test.ts -t "cycle detection" -x` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 2 | AGGR-06 | unit | `cd web && npx vitest run src/tests/aggregation.test.ts -t "auto-archive" -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `web/src/tests/aggregation.test.ts` — test stubs for AGGR-01 through AGGR-06 with convex-test
- [ ] Pure function tests for normalization, match key computation, merge resolution, year extraction (simple vitest unit tests without convex-test)

*Existing vitest + convex-test infrastructure covers framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Aggregation pipeline count output after scrape run | AGGR-06 | Requires real scrape run to verify end-to-end counts | Trigger a test scrape via GitHub Action, verify run summary includes new/updated/duplicate counts |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
