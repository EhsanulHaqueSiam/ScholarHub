# Technology Stack — ScholarHub v2 Feature Libraries

**Project:** ScholarHub v2 (application tracking, notifications, calendar, calculator, wizard)
**Researched:** 2026-04-02
**Overall confidence:** HIGH (all versions verified via npm registry; peer deps confirmed)

---

## Existing Stack (Do Not Change)

| Layer | Current |
|-------|---------|
| Framework | TanStack Start 1.167 + TanStack Router 1.168 (SSR, Netlify) |
| DB / backend | Convex 1.33 (serverless; free-tier budget-sensitive) |
| UI framework | React 19.2 + React-DOM 19.2 |
| Styling | Tailwind CSS v4.2 (Vite plugin, no PostCSS) |
| Build | Vite 8.0 |
| Forms (none yet) | — |
| State (none yet) | — |
| Icons | Lucide React 0.577 |
| Validation | Zod 4.3 |
| Linting | Biome 2.4 |

Existing `useLocalStorage` hook (hand-rolled) handles profile persistence.
Existing `WizardShell` (hand-rolled `useState` machine) is the template for new wizard flows.
No form library is in use yet. No global state management library is in use yet.

---

## Recommended Additions by Feature Area

### 1. Application Tracker — Kanban Board

**Recommended: `@dnd-kit/core` + `@dnd-kit/sortable`**

| Package | Version (verified) | Purpose |
|---------|-------------------|---------|
| `@dnd-kit/core` | 6.3.1 | Drag-and-drop primitives |
| `@dnd-kit/sortable` | 10.0.0 | Column-reorder and card-reorder presets |
| `@dnd-kit/utilities` | 3.2.2 | CSS helpers (transform, transition) |

**Why dnd-kit, not react-beautiful-dnd or hello-pangea/dnd:**
- `react-beautiful-dnd` is abandoned by Atlassian; `hello-pangea/dnd` is a community fork, not the originator.
- dnd-kit is actively maintained by the original author, fully tree-shakeable, headless, and has no opinions about DOM structure — meaning it will not fight the neo-brutalism design system (0px border-radius, custom card styles).
- Peer deps: `react >= 16.8.0` (HIGH confidence — verified against npm registry 2026-04-02).
- The new `@dnd-kit/react` (0.3.2) alpha exists but is not production-ready; use the stable 6.3.1 core.

**Why NOT `@atlaskit/pragmatic-drag-and-drop`:**
- Atlassian's new headless DnD library. Works, but heavier dependency tree and less community documentation for custom implementations.

**State storage for tracker:**
No separate state library is needed for the Kanban board. Persist the tracker data with the existing `useLocalStorage` hook. Model: `{ [scholarshipId]: { stage, notes, dates, ... } }`. Keep the data model flat — this directly maps to Clerk user metadata fields later (no migration required).

**Confidence:** HIGH — dnd-kit stable version confirmed, peer deps verified.

---

### 2. Scholarship Alerts / Notifications

**Recommended: Browser Notification API (native) + Sonner (in-app toasts)**

| Package | Version (verified) | Purpose |
|---------|-------------------|---------|
| `sonner` | 2.0.7 | In-app toast notifications |
| Native `Notification` API | — | Browser-level deadline alerts |

**Strategy (two distinct notification modes):**

**A. In-app toasts (Sonner):**
- Used for immediate feedback: "Added to tracker", "Reminder set", action confirmations.
- Sonner is 30M+ weekly npm downloads, zero dependencies, Tailwind-compatible via `className` prop, dark/light theme support, React 19 confirmed.
- Styling via `toastOptions` and `className` overrides to match neo-brutalism (flat cards, 6px offset shadow, no border-radius).

**B. Deadline reminders (Browser Notification API — no library):**
- Use `Notification.requestPermission()` + `new Notification()` directly — no library required.
- Store reminder timestamps in localStorage alongside the tracker data.
- On app load, compute which deadlines are within N days; if user has granted permission, show notifications.
- **Critical constraint:** The Notification Triggers API (scheduled OS-level notifications) was abandoned by Google — it will not ship. Confirmed: Chrome Platform Status shows development ended.
- **Practical approach:** Show a deadline badge when the app opens (no background push needed). For users who want alerts, offer an "add to Google Calendar" export (iCal link) as a complementary path.

**Why NOT true web push (VAPID + service worker):**
- TanStack Start has a confirmed unresolved incompatibility with `vite-plugin-pwa` in production builds (GitHub issue #4988, open as of Dec 2025). The only workaround requires a custom Vite plugin using esbuild + Workbox `injectManifest()`.
- True web push requires a backend to sign and dispatch VAPID requests. There is no backend in this stack — Convex functions could do this but would consume budget and require auth to associate a push subscription with a user. That belongs in the Clerk milestone, not now.
- **Decision:** Skip service-worker push. Deliver in-app notification on page load + browser `Notification` when permission granted.

**Confidence:** HIGH (Sonner version verified; push limitation verified via official GitHub issue + Chrome Platform Status).

---

### 3. Scholarship Calendar View

**Recommended: `react-big-calendar` + `date-fns`**

| Package | Version (verified) | Purpose |
|---------|-------------------|---------|
| `react-big-calendar` | 1.19.4 | Calendar UI (month/week/agenda views) |
| `date-fns` | 4.1.0 | Localizer (required by react-big-calendar) |

**Why react-big-calendar:**
- React 19 support explicitly shipped in PR #2710, merged February 24 2025. Issue #2701 closed as "COMPLETED".
- Free (no premium tier gating unlike FullCalendar's timeline/resource views).
- Provides month, week, day, and agenda views out of the box — all relevant for deadline visualization.
- Peer deps declare `react: '^16.14.0 || ^17 || ^18 || ^19'` — confirmed React 19 support via npm.
- Tailwind v4: The library injects its own CSS (`react-big-calendar/lib/css/react-big-calendar.css`) which must be imported and then overridden via Tailwind utilities. This is the standard approach; the library exposes extensive class names for overriding.

**Why NOT FullCalendar:**
- Latest stable `@fullcalendar/react@6.1.20`. Premium features (timeline, resource views) require paid plugins — not needed for a deadline calendar. The free tier is fine but adds heavier bundle weight vs react-big-calendar.

**Why NOT react-day-picker:**
- v9.14.0 is a date picker, not an event calendar. It does not support multi-event month views with deadline badges. Use only if a date range selector is needed in a form.

**Why NOT shadcn-big-calendar (npm package):**
- `shadcn-big-calendar@1.1.0` peer deps require `react@^18.0.0` only (does not list 19), and `react-big-calendar@^1.13.0` (behind on minor versions). Use react-big-calendar directly and style it with Tailwind.

**Confidence:** HIGH (React 19 PR verified on GitHub; version confirmed on npm).

---

### 4. Scholarship Value Calculator

**No additional library required.** Pure JavaScript computation.

The value calculator is:
```
total_value = (tuition_per_year × duration_years) + (stipend_per_month × 12 × duration_years)
coverage_pct = (scholarship_value / total_cost_of_study) × 100
```

All input data (tuition, stipend, duration) is already in the static JSON export under per-subject fields. Compute entirely client-side in a React component with controlled inputs. Use `Intl.NumberFormat` for currency display (built-in, no library).

**If a chart is needed for value comparison:**

| Package | Version (verified) | Purpose |
|---------|-------------------|---------|
| `recharts` | 3.8.1 | Bar/area charts for value visualization |

- Recharts 3.8.1 peer deps: `react: '^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0'` — React 19 confirmed.
- Recharts 3.x is a major rewrite of state management; it's the current stable line (not 2.x).
- Use only if the calculator needs a visual comparison bar. Skip if a table suffices — saves bundle weight.

**Confidence:** HIGH (no library needed for calculation; Recharts version confirmed).

---

### 5. Guided Multi-Step Wizard Flow (University Rank → Country → Budget funnel)

**Recommended: Extend the existing hand-rolled WizardShell pattern. Add `react-hook-form` only if complex per-step validation is needed.**

| Package | Version (verified) | Purpose |
|---------|-------------------|---------|
| `react-hook-form` | 7.72.0 | Per-step form validation (optional) |
| `@hookform/resolvers` | (peer) | Zod integration (already using Zod 4) |

**Why extend WizardShell, not replace it:**
- The existing `WizardShell.tsx` is a proven 3-step pattern with transitions, step state, and localStorage persistence already wired. The new guided wizard (rank → country → budget → results) is structurally identical.
- Composing new `StepRank.tsx`, `StepBudget.tsx`, etc. inside a new `WizardShell`-equivalent avoids a library dependency for something already solved in-repo.

**When to add react-hook-form:**
- If steps have inline validation (e.g., numeric GPA range checks, required field errors shown per-field), use react-hook-form v7.72 with `zodResolver`.
- The existing eligibility wizard uses direct `useState` per-field — if the new wizard needs richer validation feedback, react-hook-form is the correct addition.
- Peer deps: `react: '^16.8.0 || ^17 || ^18 || ^19'` — React 19 confirmed via npm.
- **Known caveat:** react-hook-form does not natively support React 19's `useActionState` without workarounds. However, this wizard is client-side localStorage only — not server actions — so this caveat does not apply.

**Why NOT rhf-wizard (npm package):**
- `rhf-wizard` is a small community library wrapping react-hook-form for wizard flows. Given the existing in-repo WizardShell pattern, adding a meta-library adds indirection for no gain.

**Confidence:** HIGH (RHF peer deps confirmed on npm; existing WizardShell pattern verified in codebase).

---

### 6. Application Readiness Score

**No additional library required.** Pure scoring computation (same model as `src/lib/eligibility/scoring.ts`).

The readiness scorer reads `StudentProfile` from localStorage and computes a 0–100 score per scholarship field against documented requirements. The existing `scoring.ts` module (7.9k, 9 unit tests) is the direct template. Extend it with a new `scoreReadiness(profile, scholarship)` function.

Output is rendered as a percentage bar using a Tailwind `div` with dynamic `width` — no chart library needed.

**Confidence:** HIGH — confirmed by reading existing `scoring.ts` and `useEligibilityMatching.ts`.

---

## Global State Management Decision

**Recommended: Zustand 5.0.12 with `persist` middleware**

| Package | Version (verified) | Purpose |
|---------|-------------------|---------|
| `zustand` | 5.0.12 | Client state store |

**Why introduce Zustand now:**
- v2 adds at least three independent localStorage stores: tracker state, notification preferences, and calculator state. Managing three `useLocalStorage` hooks that need to share data (e.g., tracker stage changes trigger notification reminders) creates prop-drilling or context hell.
- Zustand `persist` middleware handles `localStorage` serialization, SSR safety (`skipHydration`), and schema migration (versioned) — all needed for the Clerk upgrade path.
- Zustand v5.0.12 peer deps: `react >= 18.0.0`, `@types/react >= 18.0.0` — React 19 is a superset, confirmed compatible.
- Built-in `immer` middleware (via `zustand/middleware/immer`) allows draft-style mutations for Kanban card moves without manual spread — matches the complex nested updates in the tracker.

**Why NOT Redux / Jotai / Context:**
- Redux: massive boilerplate for localStorage-first features with no server sync needed yet.
- Jotai: atom granularity is excellent but the `atomWithStorage` utilities are less ergonomic than Zustand's `persist` for the "migrate to Clerk" upgrade path.
- React Context: No cross-tab sync, no built-in persistence, no migration utilities.

**Migration path to Clerk:** Replace `persist` storage from `localStorage` to a custom Convex-backed storage adapter. The store interface does not change — only the storage layer.

**Confidence:** HIGH (version and peer deps verified on npm 2026-04-02).

---

## What NOT to Use

| Library | Why Not |
|---------|---------|
| `react-beautiful-dnd` | Abandoned by Atlassian; unmaintained since 2022 |
| `hello-pangea/dnd` | Community fork of above; choose dnd-kit instead |
| `@atlaskit/pragmatic-drag-and-drop` | Heavier; less community documentation |
| `vite-plugin-pwa` for push | Production build broken with TanStack Start (GitHub #4988, unresolved Dec 2025) |
| Notification Triggers API | Abandoned by Google; will not ship (Chrome Platform Status confirmed) |
| `shadcn-big-calendar` (npm) | React 18-only peer deps; wraps react-big-calendar — use the underlying library directly |
| `@fullcalendar/react` | Premium features paywalled; unnecessary bundle weight for a deadline calendar |
| `rhf-wizard` | Community meta-wrapper; use existing WizardShell pattern instead |
| External charting libraries for readiness score | A Tailwind progress bar suffices; recharts only if value comparison chart needed |

---

## Installation

```bash
# Kanban drag-and-drop
npm install @dnd-kit/core@6.3.1 @dnd-kit/sortable@10.0.0 @dnd-kit/utilities@3.2.2

# In-app toasts
npm install sonner@2.0.7

# Calendar
npm install react-big-calendar@1.19.4 date-fns@4.1.0
# type stubs (if needed)
npm install -D @types/react-big-calendar

# Global state + localStorage persistence
npm install zustand@5.0.12

# Form validation (add only if per-step validation is required)
npm install react-hook-form@7.72.0 @hookform/resolvers

# Value comparison chart (add only if chart view is required)
npm install recharts@3.8.1
```

**Budget impact on Convex:** None. All libraries above are pure client-side. No new Convex functions are implied.

---

## Tailwind v4 Compatibility Notes

| Library | Tailwind v4 Status |
|---------|-------------------|
| dnd-kit | No CSS dependency; 100% compatible |
| sonner | `className` / `toastOptions` props; override with Tailwind utilities. Compatible. |
| react-big-calendar | Requires importing `react-big-calendar/lib/css/react-big-calendar.css` then overriding with Tailwind. Apply neo-brutalism overrides via `.rbc-*` class selectors in `index.css`. |
| zustand | No styles. Compatible. |
| react-hook-form | No styles. Compatible. |
| recharts | SVG-based; no CSS conflict. Compatible. |

---

## Sources

- dnd-kit npm registry: https://www.npmjs.com/package/@dnd-kit/core (version 6.3.1 confirmed)
- dnd-kit React 19 peer deps: `react >= 16.8.0` confirmed via `npm info`
- react-big-calendar React 19 PR: https://github.com/jquense/react-big-calendar/issues/2701 (closed Feb 24 2025)
- react-big-calendar peer deps: `react: '^16.14.0 || ^17 || ^18 || ^19'` confirmed via `npm info`
- TanStack Start + vite-plugin-pwa incompatibility: https://github.com/TanStack/router/issues/4988 (unresolved Dec 2025)
- Notification Triggers API abandoned: https://chromestatus.com/feature/5133150283890688
- Sonner 2.0.7 confirmed: https://www.npmjs.com/package/sonner
- zustand 5.0.12 peer deps: `react >= 18.0.0` confirmed via `npm info`
- react-hook-form 7.72.0 peer deps: `react: '^16.8.0 || ^17 || ^18 || ^19'` confirmed via `npm info`
- recharts 3.8.1 peer deps: `react: '^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0'` confirmed via `npm info`
- Notification API (MDN): https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API/Using_the_Notifications_API
