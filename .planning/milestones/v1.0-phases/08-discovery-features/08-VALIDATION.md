---
phase: 8
slug: discovery-features
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.0 + convex-test 0.0.41 |
| **Config file** | `web/vitest.config.ts` |
| **Quick run command** | `cd web && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd web && npx vitest run --reporter=verbose --coverage` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd web && npx vitest run --reporter=verbose`
- **After every plan wave:** Run `cd web && npx vitest run --reporter=verbose --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | DISC-01 | unit | `cd web && npx vitest run src/__tests__/collections.test.ts -t "filter matching"` | ❌ W0 | ⬜ pending |
| 08-01-02 | 01 | 1 | DISC-01 | unit | `cd web && npx vitest run src/__tests__/collections.test.ts -t "CRUD"` | ❌ W0 | ⬜ pending |
| 08-01-03 | 01 | 1 | DISC-01 | unit | `cd web && npx vitest run src/__tests__/tagging.test.ts` | ❌ W0 | ⬜ pending |
| 08-01-04 | 01 | 1 | DISC-01 | unit | `cd web && npx vitest run src/__tests__/collections.test.ts -t "count"` | ❌ W0 | ⬜ pending |
| 08-02-01 | 02 | 2 | DISC-02 | unit | `cd web && npx vitest run src/__tests__/comparison.test.ts` | ❌ W0 | ⬜ pending |
| 08-02-02 | 02 | 2 | DISC-02 | unit | `cd web && npx vitest run src/__tests__/ComparisonTable.test.tsx` | ❌ W0 | ⬜ pending |
| 08-03-01 | 03 | 2 | DISC-03 | unit | `cd web && npx vitest run src/__tests__/related.test.ts` | ❌ W0 | ⬜ pending |
| 08-03-02 | 03 | 2 | DISC-03 | unit | `cd web && npx vitest run src/__tests__/related.test.ts -t "expired"` | ❌ W0 | ⬜ pending |
| 08-03-03 | 03 | 2 | DISC-03 | unit | `cd web && npx vitest run src/__tests__/related.test.ts -t "proportional"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `web/src/__tests__/collections.test.ts` — stubs for DISC-01 collection filter matching, CRUD, count caching
- [ ] `web/src/__tests__/tagging.test.ts` — stubs for auto-tagging rule matching
- [ ] `web/src/__tests__/comparison.test.ts` — stubs for comparison batch query
- [ ] `web/src/__tests__/related.test.ts` — stubs for related scoring algorithm, expired exclusion, proportional overlap
- [ ] `web/src/__tests__/ComparisonTable.test.tsx` — stubs for comparison UI difference highlighting

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Collection browse page visual layout (3-col grid, emoji cards) | DISC-01 | Visual/layout verification | Open /collections, verify 3-col grid on desktop, 1-col on mobile, emoji + count badges render |
| Comparison table difference highlighting | DISC-02 | Visual styling verification | Compare 2 scholarships with different countries, verify differing cells have visual highlight |
| Compare bar floating position + mobile layout | DISC-02 | Layout/positioning | Select 2 scholarships on mobile, verify fixed bottom bar with correct touch targets |
| Tag badge styling on detail page hero | DISC-01 | Visual styling | Open a tagged scholarship detail page, verify outline badges render with tooltips |
| Collection admin slide-out sheet UX | DISC-01 | Interactive flow | Create/edit collection via admin, verify slide-out sheet pattern matches existing EditPanel |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
