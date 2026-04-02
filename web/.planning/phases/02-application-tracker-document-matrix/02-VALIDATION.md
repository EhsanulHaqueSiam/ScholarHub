---
phase: 02
slug: application-tracker-document-matrix
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-03
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1 |
| **Config file** | `web/vitest.config.ts` |
| **Quick run command** | `cd web && npx vitest run src/lib/tracker/ --reporter=verbose` |
| **Full suite command** | `cd web && npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd web && npx vitest run src/lib/tracker/ --reporter=verbose`
- **After every plan wave:** Run `cd web && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | TRACK-01 | unit | `npx vitest run src/lib/tracker/tracker-store.test.ts -t "addEntry"` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | TRACK-02 | unit | `npx vitest run src/lib/tracker/tracker-engine.test.ts -t "groupByStage"` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | TRACK-03 | unit | `npx vitest run src/lib/tracker/tracker-store.test.ts -t "moveToStage"` | ❌ W0 | ⬜ pending |
| 02-01-04 | 01 | 1 | TRACK-04 | unit | `npx vitest run src/lib/tracker/tracker-engine.test.ts -t "entry fields"` | ❌ W0 | ⬜ pending |
| 02-01-05 | 01 | 1 | TRACK-05 | unit | `npx vitest run src/lib/tracker/tracker-store.test.ts -t "updateNotes"` | ❌ W0 | ⬜ pending |
| 02-01-06 | 01 | 1 | TRACK-06 | unit | `npx vitest run src/lib/tracker/tracker-store.test.ts -t "persist"` | ❌ W0 | ⬜ pending |
| 02-01-07 | 01 | 1 | TRACK-07 | unit | `npx vitest run src/lib/tracker/tracker-csv.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-08 | 01 | 1 | DOC-01 | unit | `npx vitest run src/lib/tracker/document-types.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-09 | 01 | 1 | DOC-02 | unit | `npx vitest run src/lib/tracker/tracker-store.test.ts -t "toggleDocument"` | ❌ W0 | ⬜ pending |
| 02-01-10 | 01 | 1 | DOC-03 | unit | `npx vitest run src/lib/tracker/tracker-engine.test.ts -t "matrix"` | ❌ W0 | ⬜ pending |
| 02-01-11 | 01 | 1 | DOC-04 | unit | `npx vitest run src/tests/schema.test.ts` | Existing (extend) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/tracker/tracker-store.test.ts` — stubs for TRACK-01, 03, 05, 06, DOC-02
- [ ] `src/lib/tracker/tracker-engine.test.ts` — stubs for TRACK-02, 04, DOC-03
- [ ] `src/lib/tracker/tracker-csv.test.ts` — stubs for TRACK-07
- [ ] `src/lib/tracker/document-types.test.ts` — stubs for DOC-01

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Drag-and-drop between stages | TRACK-02 | Requires real browser interaction with pointer events | Open /tracker, drag a card from Researching to Applying, verify it appears in Applying column |
| Mobile tap-to-move | TRACK-02 | Touch interaction on real device | Open /tracker on mobile, tap card, tap stage selector, verify card moves |
| Cross-tab sync | TRACK-06 | Requires multiple browser tabs | Open /tracker in two tabs, add entry in one, verify appears in other |
| CSV download | TRACK-07 | Browser download API | Click Export CSV, verify .csv file downloads with correct columns |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
