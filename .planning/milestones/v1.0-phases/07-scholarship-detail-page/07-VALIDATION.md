---
phase: 7
slug: scholarship-detail-page
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | DTLP-01 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 07-01-02 | 01 | 1 | DTLP-02 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 07-01-03 | 01 | 1 | DTLP-03, DTLP-04 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 07-01-04 | 01 | 1 | DTLP-05, DTLP-06 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 07-02-01 | 02 | 1 | DTLP-07, DTLP-08 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 07-02-02 | 02 | 1 | DTLP-09, DTLP-10 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 07-02-03 | 02 | 1 | DTLP-11 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Test stubs for detail page component rendering
- [ ] Test stubs for Convex query (getScholarshipDetail)
- [ ] Shared test fixtures for scholarship mock data

*Existing vitest infrastructure covers framework needs — no new test framework install required.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sticky header scroll behavior | DTLP-11 | IntersectionObserver requires browser | Scroll detail page, verify sticky bar appears |
| Timezone-aware deadline display | DTLP-05 | Requires visual check of Intl.DateTimeFormat output | View deadline in different browser timezone settings |
| Rich-text markdown rendering | DTLP-10 | Visual rendering quality | Review editorial notes with various markdown content |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
