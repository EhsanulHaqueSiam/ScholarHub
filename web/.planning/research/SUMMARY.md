# Project Research Summary

**Project:** ScholarHub v2 — Application Tracking, Notifications, Calendar, Calculator, Wizard
**Domain:** Scholarship discovery and application management platform (international students)
**Researched:** 2026-04-02
**Confidence:** HIGH

## Executive Summary

ScholarHub v2 adds a suite of high-anxiety-reducing features to an existing SSR platform built on TanStack Start, Convex, and a static-JSON-first read architecture. The research is unambiguous on the core approach: every new feature must remain purely client-side, computed against the static JSON and persisted in localStorage via typed adapter objects. This preserves the Convex free-tier budget (already breached once in March 2026), maintains the Clerk migration seam already coded into the storage layer, and keeps the SSR-safe hydration pattern that TanStack Start requires. The existing codebase already establishes most of the architectural load-bearing patterns — v2 extends them, not replaces them.

The recommended tech additions are minimal and well-validated: dnd-kit for the Kanban tracker, Sonner for in-app toasts, react-big-calendar (or react-day-picker) for the calendar, Zustand 5 for coordinated localStorage state, and react-hook-form only if the wizard requires per-step validation. All peer dependencies are React 19 confirmed. Two libraries were definitively ruled out: vite-plugin-pwa (TanStack Start production build incompatibility, GitHub issue unresolved) and the Notification Triggers API (abandoned by Chrome). Push notifications start with Mode A (in-app, no backend) and defer Mode B (Convex VAPID + cron) to a later phase.

The top three risks that must be addressed before building, not after: (1) localStorage quota exhaustion silently fails — the existing `useLocalStorage` hook swallows `QuotaExceededError` and must be hardened before any new storage-heavy feature ships; (2) premature push permission prompts permanently block users — a double-permission UI (custom modal before native dialog) is mandatory; (3) localStorage schema version drift — every new stored object needs a `_version` field and a migration function from day one, because losing tracker data mid-application season is a trust-destroying event for the target audience.

---

## Key Findings

### Recommended Stack

The existing stack requires no major changes. The additions are targeted libraries for specific features, each chosen to avoid DOM-opinion conflicts with the neo-brutalism design system (zero border-radius, heavy borders, 6px offset shadows). Zustand 5 with `persist` middleware is the single most strategic addition: it coordinates three independent localStorage stores that would otherwise create prop-drilling, and its storage adapter interface directly maps to a future Convex-backed adapter when Clerk auth is added.

**Core additions:**
- `@dnd-kit/core@6.3.1` + `@dnd-kit/sortable@10.0.0`: Kanban drag-and-drop — actively maintained, headless, Touch/Pointer/Keyboard sensor support (react-beautiful-dnd is abandoned; do not use it)
- `sonner@2.0.7`: In-app toast notifications — zero dependencies, React 19 confirmed, Tailwind-compatible via className
- `react-big-calendar@1.19.4` + `date-fns@4.1.0`: Calendar UI — React 19 explicitly shipped Feb 2025; OR use `react-day-picker` for a deadline-visualization-only grid (headless, less opinionated UI)
- `zustand@5.0.12`: Coordinated localStorage state with `persist` middleware — the Clerk migration adapter swap point
- `react-hook-form@7.72.0` (optional): Per-step wizard validation only; do not add if the wizard uses simple selection controls without inline validation
- `recharts@3.8.1` (optional): Value comparison bar chart; skip if a table suffices
- No library for the readiness scorer or value calculator — both are pure TypeScript computations extending the existing `scoring.ts` pattern

**Do NOT use:**
- `vite-plugin-pwa` — production build broken with TanStack Start (GitHub #4988, unresolved)
- `react-beautiful-dnd` / `hello-pangea/dnd` — abandoned
- Notification Triggers API — abandoned by Google

### Expected Features

Features map to five confirmed student anxieties: eligibility uncertainty, chance assessment, deadline/process fear, post-application black hole, and representation gap. Cross-validating against Fastweb, Bold.org, Scholarships360, ScholarshipOwl, and Going Merry (now shutdown) confirms the table stakes list.

**Must have (table stakes):**
- Personalized recommendations / "For You" feed — profile already exists; this is a filter/scoring layer
- Application tracker with named stages (Researching → Preparing → Submitted → Interview → Result) — students use spreadsheets without this
- Deadline reminders / alerts — cited as the #1 missing feature in student scholarship apps; browser Notification API, graceful degradation when denied
- Document checklist per scholarship — standardized taxonomy across scholarships, localStorage check-off state
- Scholarship calendar with deadline visualization — most requested missing feature in competing apps
- Readiness / match score per scholarship — all major competitors show match %; required for prioritization
- Scholarship value calculator — "fully funded" is meaningless without context; tuition + stipend vs cost of destination
- Improved "similar" suggestions — three tiers: reach / match / safety; prevents dead-end detail pages

**Should have (differentiators):**
- Application readiness score with concrete gap analysis and action items — "Your IELTS 6.5 is 0.5 below the 7.0 requirement — retake to reach 7.0" is far more valuable than a match percentage
- SOP / essay guidance by scholarship type — no major platform does per-type guidance; guidance only, never templates
- Country comparison tool (2-3 countries side-by-side) — not integrated with scholarship search anywhere currently
- Guided discovery wizard (rank → country → budget → results) — reduces abandonment for uncertain new users
- Calendar with shortlist overlay and seasonal insights

**Defer to later milestone:**
- Competitiveness / acceptance rate data — manual research dependency; ship UI skeleton with graceful "data not available" degradation; fill data over time
- Calendar seasonal insights — pure content task, not engineering
- Push Mode B (background VAPID + Convex cron) — additive after Mode A (in-app) ships
- AI essay generation — no auth to gate cost, plagiarism association, destroys trust; never build this
- Community Q&A, email notifications, native mobile app, auto-application submission — all require auth or are out of scope

### Architecture Approach

The v2 architecture is strictly layered: Static JSON (read-only, primary) → Client-Side Computation Engines (pure TypeScript, no async) → localStorage State Layer (typed adapters only) → React hooks → UI. Convex is only touched for admin CRUD and, in a later sub-phase, push subscription storage. Every new engine (`readiness-engine.ts`, `value-engine.ts`, `deadline-engine.ts`, `tracker-engine.ts`) is a pure function — no side effects, no I/O, unit-testable in isolation. The key insight from the codebase inspection: the `LocalStorageProfileAdapter` / `ProfileStorage` interface pattern is already the Clerk migration seam. All new storage (tracker, alerts) must follow the same typed adapter pattern so the Clerk migration is a storage layer swap, not a component rewrite.

**Major components:**
1. **Storage Layer** (`lib/*/storage.ts`) — typed adapter objects for every localStorage key; no component calls `localStorage` directly; migration point to Clerk/Convex
2. **Computation Engines** (`lib/tracker/`, `lib/scoring/`, `lib/calendar/`) — pure functions consuming StaticData + StudentProfile; wrap in `useMemo` per scholarship slug
3. **Application Tracker** (`/tracker` route) — Kanban with dnd-kit; `useApplicationTracker` hook; denormalize title at add-time for offline display
4. **Calendar View** (`/calendar` route) — deadline-engine aggregates static deadlines; shortlist + tracker overlays; react-day-picker preferred over react-big-calendar for a read-only grid
5. **Discovery Wizard** (`/discover` route) — new WizardShell with `useReducer` discriminated union; terminates by navigating to `/scholarships` with URL params; keep separate from eligibility wizard
6. **Push Notification Layer** — Mode A: `useDeadlineAlerts` hook + `reg.showNotification()` when page is open; Mode B (deferred): Convex `push_subscriptions` table + scheduled action + VAPID signing
7. **Detail Page Enhancements** — `ReadinessScoreCard` and `ValueBreakdownCard` components reading from computation engines; "Track This" CTA

### Critical Pitfalls

1. **localStorage quota silently exhausted** — The existing `useLocalStorage` hook swallows `QuotaExceededError`. Add a `getStorageEstimate()` utility, upgrade the hook to surface a warning banner above 3MB, and cap notes fields to 500 characters. Store only slugs in localStorage — never full scholarship objects. Address before any tracker or notes feature ships.

2. **Push permission permanently blocked by premature prompt** — Never call `Notification.requestPermission()` without a preceding custom modal explaining what alerts will be sent. Only surface the opt-in after the user has added at least one scholarship to the tracker. Detect `Notification.permission === 'denied'` and show a help link instead of the enable button. For iOS, detect `navigator.standalone === false` and show Home Screen install instructions.

3. **localStorage schema version drift breaks existing users** — Add `_version: number` to every new stored object from day one. Write `migrateVxToVy()` functions called at read time when the version field is behind. Use Zod or a manual guard at parse time — never bare `JSON.parse(stored) as T` without validation. A tracker crash mid-application season is a trust-destroying event.

4. **SSR hydration mismatch from localStorage reads** — TanStack Start renders server-side; `localStorage` does not exist there. Any synchronous localStorage read in a component will cause a Netlify SSR 500 (this already happened: commit `efffd17`). All new localStorage access must go through hooks that have `typeof window === "undefined"` guards and a `hydrated` flag pattern (see `useStudentProfile` as the reference). Route loaders must never read localStorage.

5. **Convex function calls from new features blowing free-tier budget** — The free tier was breached in March 2026 before v2 features were added. All user-specific state (tracker, alerts, recommendations, calculator) must be localStorage-only — zero new `useQuery` calls. Only the push subscription record (Mode B) touches Convex, and only when the user explicitly opts into background push.

---

## Implications for Roadmap

Based on the dependency graph in FEATURES.md and the build order in ARCHITECTURE.md, a 5-phase structure emerges. The key dependency: storage foundations and computation engines must precede all UI phases.

### Phase 1: Storage and Engine Foundations
**Rationale:** Every subsequent phase consumes these. Building them first — as pure TypeScript with unit tests — validates the data model before any UI is built. Also the right moment to harden the existing localStorage infrastructure (quota handling, schema versioning, SSR guard audit) so all new features inherit the fixes automatically.
**Delivers:** `TrackerStorage` adapter + `ApplicationTracker` types; `AlertsConfig` types + adapter; `readiness-engine.ts`; `value-engine.ts`; `deadline-engine.ts`; `useApplicationTracker` hook; upgraded `useLocalStorage` with quota error handling; `_version` fields on all stored objects.
**Addresses:** Personalized recommendations (profile already exists, engine consumes it), readiness score, value calculator data model
**Avoids:** Pitfalls 1 (quota), 3 (schema drift), 4 (SSR hydration) — address all three before any feature builds on top

### Phase 2: Application Tracker (Kanban)
**Rationale:** Highest table-stakes anxiety reducer (post-application black hole). Depends only on Phase 1. No Convex. No service worker. Self-contained.
**Delivers:** `/tracker` route with Kanban columns; dnd-kit drag-and-drop with touch/keyboard sensors; tap-to-move stage selector as mobile fallback; document checklist per tracker entry; "Track This" CTA on scholarship detail pages; stage badge on shortlist page.
**Uses:** `@dnd-kit/core`, `@dnd-kit/sortable`, `zustand` with `persist`, `useApplicationTracker` from Phase 1
**Implements:** Application Tracker component (Architecture §2)
**Avoids:** Pitfall 7 (mobile drag-drop — use dnd-kit, not HTML5), Pitfall 11 (cross-tab desync — storage event listener)

### Phase 3: Calendar View and Discovery Wizard
**Rationale:** Calendar depends on tracker (for stage-aware colors) from Phase 2. Wizard is independent but logically grouped with navigation features. Both are medium complexity and deliver distinct user value.
**Delivers:** `/calendar` route with deadline grid, shortlist and tracker overlays, urgency color coding; `/discover` route with 4-step guided wizard (rank → country → budget → degree) terminating at filtered directory; enhanced directory filters (value-based, rank tier)
**Uses:** `react-day-picker` (calendar grid) or `react-big-calendar` (if full event view needed); `useReducer` discriminated union for wizard state; URL params for wizard state persistence
**Implements:** Calendar View (Architecture §5), Discovery Wizard (Architecture §6), Enhanced Filtering (Architecture §7)
**Avoids:** Pitfall 10 (wizard state lost on Back — encode steps in URL params), Pitfall 4 (SSR guard in calendar hooks)

### Phase 4: Detail Page Enhancements and Recommendations
**Rationale:** Readiness score and value calculator depend on the engines from Phase 1. These ship as enhancements to existing scholarship detail pages — no new routes, high visibility impact.
**Delivers:** `ReadinessScoreCard` on detail pages (gap analysis with named action items); `ValueBreakdownCard` on detail pages (tuition + stipend + duration with "calculated from available data" disclaimer); improved "similar" suggestions (reach/match/safety tiers); personalized "For You" recommendations section on homepage/directory
**Uses:** `recharts` (optional, only if value comparison bar needed); Tailwind progress bar for readiness percentage; computation engines from Phase 1
**Implements:** Client-Side Scoring Engines (Architecture §3)
**Avoids:** Pitfall 6 (acceptance rate absent data — show only when present), Pitfall 9 (value calculator false totals — always show data completeness indicator), Pitfall 13 (currency formatting — carry currency code, never sum across currencies)

### Phase 5: Notification Infrastructure (Mode A)
**Rationale:** Notifications require service worker registration and explicit user opt-in — these have the most implementation risk (iOS constraints, permission UX, subscription staleness). Deferred until tracker and calendar are live so the user has actual tracked scholarships to receive alerts for, making the opt-in value proposition concrete.
**Delivers:** Service Worker registration at `/sw.js`; `useDeadlineAlerts` hook (in-page notification on load); double-permission flow UI (custom modal before native dialog); `AlertsConfigPanel` (frequency preferences, per-scholarship toggle); subscription validity check on page load; `sonner` toasts for in-app feedback
**Uses:** `sonner@2.0.7`, Browser Notification API (native), Service Worker API (native)
**Implements:** Push Notification Architecture Mode A (Architecture §4)
**Avoids:** Pitfall 2 (premature permission — double-permission flow mandatory), Pitfall 8 (subscription lost on clear — validate subscription on load), Pitfall 12 (notification fatigue — default 14-day only, grouping), Pitfall 15 (SW conflicts — push-only SW, no cache strategies)

### Phase 5b (Deferred): Push Mode B — Background Notifications
**Rationale:** Requires Convex schema additions (`push_subscriptions` table), a scheduled action, and VAPID key management. Additive on top of Phase 5. Only build when Mode A is validated and there is evidence users want background push (i.e., they are actually using the tracker and enabling alerts).
**Delivers:** Convex `push_subscriptions` table; VAPID-signed push delivery via Convex cron; background notifications when browser is closed
**Avoids:** Pitfall 5 (Convex budget — anonymous subscription rows only, no reactive queries)

---

### Phase Ordering Rationale

- Phase 1 before everything: the storage adapter pattern and computation engines are the foundation every other phase builds on. Hardening localStorage here means pitfalls 1, 3, and 4 are fixed once for all phases.
- Tracker (Phase 2) before Calendar (Phase 3): the calendar's tracker overlay depends on `useApplicationTracker`. The wizard is independent but logically grouped as a navigation feature.
- Detail page enhancements (Phase 4) after engines (Phase 1): `ReadinessScoreCard` and `ValueBreakdownCard` call `computeReadiness` and `computeValue` directly — they cannot ship without those functions existing.
- Notifications (Phase 5) last: requires tracker data to exist for the opt-in to be meaningful. Also carries the most browser-compatibility and UX risk — deferring reduces the chance of a broken notification experience launching before the core features are solid.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 5 (Notifications):** iOS Safari 16.4+ web push for installed PWAs has distinct constraints from desktop Chrome/Firefox. The `navigator.standalone` detection path and iOS-specific permission UX patterns need design research before implementation.
- **Phase 5b (Push Mode B):** Convex scheduled action rate limits and VAPID key rotation strategies need a dedicated technical spike. Do not plan implementation without checking Convex cron constraints on the free/pro plan.
- **Phase 3 (Calendar library choice):** The ARCHITECTURE.md and STACK.md disagree on library choice (react-big-calendar vs react-day-picker). This needs a brief spike against the neo-brutalism design system before committing.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Storage foundations):** The adapter pattern is already proven in the codebase (`LocalStorageProfileAdapter`). Extending it is mechanical.
- **Phase 2 (Tracker):** dnd-kit patterns are well-documented. The Kanban data model is specified in ARCHITECTURE.md.
- **Phase 4 (Detail enhancements):** Pure TypeScript computation extending an existing tested module (`scoring.ts`). Standard React component work.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All library versions verified against npm registry 2026-04-02; peer deps confirmed; two ruled-out libraries confirmed via official sources (Chrome Platform Status, GitHub issue tracker) |
| Features | MEDIUM-HIGH | Table stakes cross-validated across 5+ competitor platforms; student pain point data from UX case study + platform research; differentiator uptake unvalidated without ScholarHub-specific A/B data |
| Architecture | HIGH | Based on direct codebase inspection of existing patterns; build order follows confirmed dependency graph; Clerk migration seam already coded |
| Pitfalls | HIGH (critical), MEDIUM (moderate) | Critical pitfalls verified against official sources (TanStack Start docs, Convex docs, Chrome developer blog); moderate pitfall mitigations draw from community sources |

**Overall confidence:** HIGH

### Gaps to Address

- **Calendar library: react-big-calendar vs react-day-picker** — STACK.md recommends react-big-calendar; ARCHITECTURE.md recommends react-day-picker for the read-only deadline grid. Resolve with a brief CSS override spike before the Phase 3 planning session. Recommendation: prefer react-day-picker unless agenda/week views are explicitly required.
- **Acceptance rate data coverage** — The competitiveness feature is gated on manual research. Engineering can ship the display skeleton in Phase 4 with graceful degradation, but the data backfill timeline is unknown. Flag this as a content milestone, not an engineering milestone.
- **Convex cron behavior on free plan** — The existing `convex/crons.ts` was inspected but the exact limits on concurrent cron executions and action duration on the free plan are not fully characterized. Validate before planning Phase 5b.
- **`scholarhub_shortlist` still uses `useLocalStorage` directly** — ARCHITECTURE.md flags this as a cleanup item before v2 ships. Should be wrapped in a typed adapter (same pattern as profile storage) during Phase 1 cleanup, not deferred.
- **SOP guidance content** — The SOP/essay guidance feature is a differentiator but is 80% content work, not engineering. The content taxonomy (government / university / need-based / merit-based / field-specific) needs to be written before the feature can ship. Flag as a content dependency.

---

## Sources

### Primary (HIGH confidence)
- npm registry (all library versions verified 2026-04-02)
- GitHub: `https://github.com/jquense/react-big-calendar/issues/2701` — React 19 support confirmed merged Feb 24 2025
- GitHub: `https://github.com/TanStack/router/issues/4988` — vite-plugin-pwa incompatibility confirmed unresolved Dec 2025
- Chrome Platform Status: `https://chromestatus.com/feature/5133150283890688` — Notification Triggers API abandoned
- TanStack Start official docs — hydration error patterns, selective SSR
- Convex official docs — free tier limits, cron constraints
- Chrome Developers: Web Push Rate Limits — official

### Secondary (MEDIUM confidence)
- Scholarships360, Bold.org, ScholarshipOwl, Going Merry — competitor feature analysis
- Kimberly Tanny Scholarship Planner UX Case Study — student pain point rankings from usability testing
- ColorWhistle Hyper-Personalized UX for Scholarship Finders — recommendation UX patterns
- OneSignal: Web Push Opt-In Rates — notification permission benchmarks (vendor data)
- MDN: Storage quotas and eviction criteria — localStorage limits
- dnd-kit Touch sensor support — community documentation
- Cross-Tab Sync with storage event — community pattern

### Tertiary (LOW confidence)
- MagicBell: PWA iOS Limitations 2026 — iOS push constraints (vendor blog, needs validation against live iOS Safari 18)

---
*Research completed: 2026-04-02*
*Ready for roadmap: yes*
