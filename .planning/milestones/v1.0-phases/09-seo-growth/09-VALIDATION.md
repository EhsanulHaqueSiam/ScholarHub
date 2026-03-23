---
phase: 9
slug: seo-growth
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.x |
| **Config file** | web/vitest.config.ts |
| **Quick run command** | `cd web && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd web && npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd web && npx vitest run`
- **After every plan wave:** Run `cd web && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | SEOG-01 | unit | `cd web && npx vitest run src/__tests__/seo-structured-data.test.ts` | ❌ W0 | ⬜ pending |
| 09-01-02 | 01 | 1 | SEOG-01 | grep | `grep -c "application/ld+json" web/src/routes/scholarships/\$slug.tsx` | ✅ | ⬜ pending |
| 09-02-01 | 02 | 2 | SEOG-02,03 | unit | `cd web && npx vitest run src/__tests__/seo-landing-pages.test.ts` | ❌ W0 | ⬜ pending |
| 09-02-02 | 02 | 2 | SEOG-02,03 | grep | `grep -c "generateMetaDescription" web/src/lib/seo.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `web/src/__tests__/seo-structured-data.test.ts` — stubs for SEOG-01 structured data validation
- [ ] `web/src/__tests__/seo-landing-pages.test.ts` — stubs for SEOG-02/03 landing page content uniqueness

*Existing vitest infrastructure covers framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Google Rich Results Test passes | SEOG-01 | External Google tool | Run URL through search.google.com/test/rich-results |
| OG images render correctly in social previews | SEOG-01 | Visual verification | Share URL on Twitter/LinkedIn, verify image appears |
| Lighthouse SEO score 90+ | ALL | External tool | Run Lighthouse audit on each page type |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
