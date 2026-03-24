---
phase: 01-eligibility-analysis-funnel
plan: 06
subsystem: eligibility-wizard
tags: [convex-integration, analytics, live-count, wizard-wiring]
dependency_graph:
  requires: ["01-04", "01-05"]
  provides: ["live-match-count", "wizard-analytics", "wizard-profile-persistence"]
  affects: ["01-07"]
tech_stack:
  added: []
  patterns: ["debounced-convex-query", "prop-lifting-for-state", "analytics-event-tracking"]
key_files:
  created:
    - web/src/components/eligibility/LiveMatchCount.tsx
  modified:
    - web/src/components/eligibility/WizardShell.tsx
    - web/src/routes/eligibility/index.tsx
decisions:
  - "Used 500ms debounce on Convex match count query to avoid per-keystroke queries"
  - "Profile state lifted to route level via useStudentProfile, passed as props to WizardShell"
  - "Wizard completion navigates with profileToUrlParams for compact URL encoding"
metrics:
  duration: "2m 19s"
  completed: "2026-03-24T19:17:00Z"
  tasks: 2
  files: 3
---

# Phase 01 Plan 06: Wizard Convex Integration & Analytics Summary

LiveMatchCount component with debounced Convex query, analytics event tracking at each funnel stage, and profile persistence via useStudentProfile hook wired into results navigation.

## What Was Built

### Task 1: LiveMatchCount Component
Created `web/src/components/eligibility/LiveMatchCount.tsx` -- a real-time scholarship match count badge displayed during the wizard.

Key implementation details:
- Calls `api.eligibility.getMatchCount` with debounced (500ms) profile args
- Three display states: "Checking..." (loading), "No matches yet" (zero), count badge with "scholarships match so far"
- Scale pulse animation (1 -> 1.1 -> 1, 200ms) when count value changes
- `aria-live="polite"` for screen reader announcements
- `motion-safe:` prefixes for reduced motion support
- Neo-brutalism badge styling: `bg-accent text-accent-foreground border-2 border-border px-3 py-1 font-heading text-xl`
- Only renders when user has entered at least one nationality

### Task 2: WizardShell Integration
Updated `web/src/components/eligibility/WizardShell.tsx` and `web/src/routes/eligibility/index.tsx`:

**WizardShell changes:**
- Accepts `profile` and `onProfileChange` props (replaces internal state management)
- LiveMatchCount rendered between step bar and form card
- Analytics events: `wizard_started` on mount, `step_completed` on each step advance, `wizard_completed` on final submission
- `countFilledFields()` utility for analytics field count
- Wizard completion navigates to `/eligibility/results` with compact URL params via `profileToUrlParams`

**Route changes:**
- Uses `useStudentProfile()` hook for localStorage-backed profile state
- SSR hydration guard: returns `null` until `hydrated` is true
- Passes `profile` and `updateProfile` to WizardShell as props

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 8a3aefb | LiveMatchCount component with live Convex query |
| 2 | d649172 | Wire WizardShell to profile hooks, analytics, and results navigation |

## Deviations from Plan

None -- plan executed exactly as written.

## Known Stubs

None -- all data sources are wired (LiveMatchCount to Convex, profile to localStorage, analytics to ConsoleAnalytics provider).

## Self-Check: PASSED

- All 3 created/modified files exist on disk
- Both commit hashes (8a3aefb, d649172) verified in git log
