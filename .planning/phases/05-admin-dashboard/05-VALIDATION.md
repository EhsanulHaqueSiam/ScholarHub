---
phase: 5
slug: admin-dashboard
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 + convex-test 0.0.41 |
| **Config file** | `web/vitest.config.ts` |
| **Quick run command** | `cd web && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd web && npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd web && npx vitest run --reporter=verbose`
- **After every plan wave:** Run `cd web && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | ADMN-01 | unit (convex-test) | `cd web && npx vitest run src/tests/admin.test.ts -t "getReviewQueue" -x` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | ADMN-02 | unit (convex-test) | `cd web && npx vitest run src/tests/admin.test.ts -t "updateScholarship" -x` | ❌ W0 | ⬜ pending |
| 05-01-03 | 01 | 1 | ADMN-03 | unit (convex-test) | `cd web && npx vitest run src/tests/admin.test.ts -t "approve" -x` | ❌ W0 | ⬜ pending |
| 05-01-04 | 01 | 1 | ADMN-04 | unit (convex-test) | `cd web && npx vitest run src/tests/admin.test.ts -t "bulk" -x` | ❌ W0 | ⬜ pending |
| 05-01-05 | 01 | 1 | ADMN-05 | unit (convex-test) | `cd web && npx vitest run src/tests/admin.test.ts -t "trust" -x` | ❌ W0 | ⬜ pending |
| 05-01-06 | 01 | 1 | ADMN-06 | unit (convex-test) | `cd web && npx vitest run src/tests/aggregation.test.ts -t "auto-publish" -x` | ❌ W0 | ⬜ pending |
| 05-01-07 | 01 | 1 | ADMN-08 | unit (convex-test) | `cd web && npx vitest run src/tests/admin.test.ts -t "dedup" -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `web/src/tests/admin.test.ts` — stubs for ADMN-01 through ADMN-05, ADMN-08
- [ ] Update `web/src/tests/aggregation.test.ts` — add auto-publish tests for ADMN-06
- [ ] Framework install: `npm install @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-placeholder` — new dependency

*Existing vitest + convex-test infrastructure covers test runner needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| TipTap editorial notes stored as HTML, rendered in detail page | ADMN-07 | Requires browser interaction with WYSIWYG editor | 1. Open admin dashboard 2. Select a scholarship 3. Add editorial note via TipTap editor 4. Save and verify note appears on public detail page |
| UI uses neo-brutalism components (Card, Badge, Button variants) | UIDX-04 | Design/visual check requiring human inspection | 1. Open admin dashboard 2. Verify Card, Badge, Button components match neo-brutalism style 3. Check consistent shadow, border, and color treatment |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
