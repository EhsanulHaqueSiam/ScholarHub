---
phase: 4
slug: data-aggregation
status: draft
nyquist_compliant: true
wave_0_complete: true
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
| 04-01-01 | 01 | 1 (RED) | AGGR-02,03,05,06 | unit | `cd web && npx vitest run src/tests/aggregationHelpers.test.ts -x` | Task creates it | ⬜ pending |
| 04-01-02 | 01 | 1 (GREEN) | AGGR-02,03,05,06 | unit | `cd web && npx vitest run src/tests/aggregationHelpers.test.ts --reporter=verbose` | Yes (from 04-01-01) | ⬜ pending |
| 04-02-01 | 02 | 2 (RED) | AGGR-01..06 | integration | `cd web && npx vitest run src/tests/aggregation.test.ts -x` | Task creates it | ⬜ pending |
| 04-02-02 | 02 | 2 (GREEN) | AGGR-01..06 | integration | `cd web && npx vitest run src/tests/aggregation.test.ts --reporter=verbose` | Yes (from 04-02-01) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Wave 0 is handled by the TDD task ordering within each plan:
- Plan 01: Task 1 (RED) creates `web/src/tests/aggregationHelpers.test.ts` before Task 2 (GREEN) implements the helpers
- Plan 02: Task 1 (RED) creates `web/src/tests/aggregation.test.ts` before Task 2 (GREEN) implements the mutations

No separate Wave 0 is needed -- test files are created as the first task in each plan.

*Existing vitest + convex-test infrastructure covers framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Aggregation pipeline count output after scrape run | AGGR-06 | Requires real scrape run to verify end-to-end counts | Trigger a test scrape via GitHub Action, verify run summary includes new/updated/duplicate counts |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (test files created as Task 1 in each plan)
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
