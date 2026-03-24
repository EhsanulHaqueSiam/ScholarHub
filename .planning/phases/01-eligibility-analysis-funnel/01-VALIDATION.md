---
phase: 1
slug: eligibility-analysis-funnel
status: ready
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-24
---

# Phase 1 -- Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `web/vitest.config.ts` |
| **Quick run command** | `cd web && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd web && npx vitest run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd web && npx vitest run --reporter=verbose`
- **After every plan wave:** Run `cd web && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-T1 | 01 | 1 | D-08,D-12,D-29,D-32 | unit (vitest) | `cd web && npx vitest run src/lib/eligibility/gpa-scales.test.ts src/lib/eligibility/profile-storage.test.ts --reporter=verbose` | gpa-scales.test.ts, profile-storage.test.ts | ⬜ pending |
| 01-01-T2 | 01 | 1 | D-22,D-38,D-39 | unit (vitest) | `cd web && npx vitest run src/lib/eligibility/url-params.test.ts src/lib/analytics.test.ts --reporter=verbose` | url-params.test.ts, analytics.test.ts | ⬜ pending |
| 01-02-F1 | 02 | 1 | D-16,D-17,D-18,D-19,D-21 | unit (vitest, TDD) | `cd web && npx vitest run src/lib/eligibility/scoring.test.ts --reporter=verbose` | scoring.test.ts | ⬜ pending |
| 01-03-T1 | 03 | 1 | D-04,D-05 | grep + tsc | `cd web && grep -c "match-strong-bg\|match-good-bg\|match-partial-bg\|match-possible-bg" src/index.css && grep -c "matchStrong\|matchGood\|matchPartial\|matchPossible" src/components/ui/badge.tsx && npx tsc --noEmit 2>&1 \| head -5` | N/A (modifies existing) | ⬜ pending |
| 01-03-T2 | 03 | 1 | D-03 | grep + tsc | `cd web && grep -c '"/eligibility"' src/components/layout/Navbar.tsx && test -f src/components/eligibility/EligibilityCTA.tsx && echo "CTA exists" && npx tsc --noEmit 2>&1 \| head -5` | EligibilityCTA.tsx | ⬜ pending |
| 01-04-T1 | 04 | 2 | D-07,D-20 | convex typecheck | `cd web && npx convex typecheck 2>&1 \| tail -5` | eligibility.ts | ⬜ pending |
| 01-04-T2 | 04 | 2 | D-20 | tsc | `cd web && npx tsc --noEmit 2>&1 \| head -20` | useStudentProfile.ts, useEligibilityMatching.ts | ⬜ pending |
| 01-05-T1 | 05 | 2 | D-01,D-04,D-05,D-06,D-15,D-36 | tsc | `cd web && npx tsc --noEmit 2>&1 \| head -20` | WizardShell.tsx, eligibility/index.tsx | ⬜ pending |
| 01-05-T2 | 05 | 2 | D-08,D-09,D-14 | tsc | `cd web && npx tsc --noEmit 2>&1 \| head -20` | StepAboutYou.tsx | ⬜ pending |
| 01-05-T3 | 05 | 2 | D-10,D-11,D-12,D-13 | tsc | `cd web && npx tsc --noEmit 2>&1 \| head -20` | StepAcademics.tsx, StepPreferences.tsx | ⬜ pending |
| 01-06-T1 | 06 | 3 | D-07 | tsc | `cd web && npx tsc --noEmit 2>&1 \| head -20` | LiveMatchCount.tsx | ⬜ pending |
| 01-06-T2 | 06 | 3 | D-38 | tsc | `cd web && npx tsc --noEmit 2>&1 \| head -20` | WizardShell.tsx (updated) | ⬜ pending |
| 01-07-T1 | 07 | 3 | D-22,D-23,D-25,D-27,D-28,D-37 | tsc | `cd web && npx tsc --noEmit 2>&1 \| head -20` | results.tsx, ResultsTierSection.tsx | ⬜ pending |
| 01-07-T2 | 07 | 3 | D-24 | tsc | `cd web && npx tsc --noEmit 2>&1 \| head -20` | MatchIndicators.tsx | ⬜ pending |
| 01-07-T3 | 07 | 3 | D-26 | tsc | `cd web && npx tsc --noEmit 2>&1 \| head -20` | ProfileSummaryCard.tsx | ⬜ pending |
| 01-08-T1 | 08 | 4 | D-30,D-33,D-34,D-35 | tsc | `cd web && npx tsc --noEmit 2>&1 \| head -20` | WelcomeBack.tsx, json-ld.ts | ⬜ pending |
| 01-08-T2 | 08 | 4 | all (visual) | manual + tsc + vitest | `cd web && npx tsc --noEmit && npx vitest run --reporter=verbose` | N/A (checkpoint) | ⬜ pending |

*Status: ⬜ pending / ✅ green / ❌ red / ⚠️ flaky*

---

## Wave 0 Requirements

- [x] Test infrastructure verification -- vitest is configured via `web/vitest.config.ts` and runnable via `npx vitest run`
- [x] Plan 01 (Wave 1, TDD) creates shared test fixtures and mock data for eligibility matching logic as part of its test-first approach
- [x] Plan 02 (Wave 1, TDD) creates scoring test suite with 9+ test cases

*Wave 0 is covered by Plans 01 and 02 which run in Wave 1 with TDD approach. vitest is already installed in the project.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Slide transitions between wizard steps | D-04 | CSS animation quality | Navigate wizard forward/back, verify smooth slide transitions |
| Mobile full-screen wizard experience | D-36 | Responsive layout | Test on mobile viewport, verify sticky nav and bottom buttons |
| Neo-brutalism styling consistency | D-04 | Visual design | Compare wizard UI against existing app patterns |
| Pull-to-refresh on results | D-37 | Browser-native behavior | Test on mobile, verify results refresh |
| Sort/filter controls UX | D-25 | Visual and interaction quality | Click SortPills and FilterChips, verify results reorder/filter |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ready
