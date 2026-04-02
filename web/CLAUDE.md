<!-- GSD:project-start source:PROJECT.md -->
## Project

**ScholarHub**

A scholarship discovery and application preparation platform for international students. Aggregates 5,700+ scholarships from 80+ sources, surfaces per-subject tuition/coverage data, and helps students find, evaluate, and prepare applications for scholarships they're eligible for. Designed to reduce student anxiety through transparency, actionable checklists, and personalized guidance.

**Core Value:** Help students confidently find and apply to scholarships they qualify for — reducing the anxiety of "am I eligible?", "what are my chances?", and "will I mess up the application?" through clear data, preparation tools, and personalized recommendations.

### Constraints

- **No auth**: All features must work with localStorage. Design data models so they can migrate to Clerk-backed user storage later.
- **Convex budget**: Static JSON remains primary read path. Minimize Convex function calls. New features should prefer client-side computation where possible.
- **Data quality**: Competitiveness/acceptance rate data requires manual research — not all scholarships will have it initially. Features must degrade gracefully.
- **Design system**: Neo-brutalism must be maintained across all new features. Use existing tokens, Card/Badge primitives, accent color palette.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

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
## Recommended Additions by Feature Area
### 1. Application Tracker — Kanban Board
| Package | Version (verified) | Purpose |
|---------|-------------------|---------|
| `@dnd-kit/core` | 6.3.1 | Drag-and-drop primitives |
| `@dnd-kit/sortable` | 10.0.0 | Column-reorder and card-reorder presets |
| `@dnd-kit/utilities` | 3.2.2 | CSS helpers (transform, transition) |
- `react-beautiful-dnd` is abandoned by Atlassian; `hello-pangea/dnd` is a community fork, not the originator.
- dnd-kit is actively maintained by the original author, fully tree-shakeable, headless, and has no opinions about DOM structure — meaning it will not fight the neo-brutalism design system (0px border-radius, custom card styles).
- Peer deps: `react >= 16.8.0` (HIGH confidence — verified against npm registry 2026-04-02).
- The new `@dnd-kit/react` (0.3.2) alpha exists but is not production-ready; use the stable 6.3.1 core.
- Atlassian's new headless DnD library. Works, but heavier dependency tree and less community documentation for custom implementations.
### 2. Scholarship Alerts / Notifications
| Package | Version (verified) | Purpose |
|---------|-------------------|---------|
| `sonner` | 2.0.7 | In-app toast notifications |
| Native `Notification` API | — | Browser-level deadline alerts |
- Used for immediate feedback: "Added to tracker", "Reminder set", action confirmations.
- Sonner is 30M+ weekly npm downloads, zero dependencies, Tailwind-compatible via `className` prop, dark/light theme support, React 19 confirmed.
- Styling via `toastOptions` and `className` overrides to match neo-brutalism (flat cards, 6px offset shadow, no border-radius).
- Use `Notification.requestPermission()` + `new Notification()` directly — no library required.
- Store reminder timestamps in localStorage alongside the tracker data.
- On app load, compute which deadlines are within N days; if user has granted permission, show notifications.
- **Critical constraint:** The Notification Triggers API (scheduled OS-level notifications) was abandoned by Google — it will not ship. Confirmed: Chrome Platform Status shows development ended.
- **Practical approach:** Show a deadline badge when the app opens (no background push needed). For users who want alerts, offer an "add to Google Calendar" export (iCal link) as a complementary path.
- TanStack Start has a confirmed unresolved incompatibility with `vite-plugin-pwa` in production builds (GitHub issue #4988, open as of Dec 2025). The only workaround requires a custom Vite plugin using esbuild + Workbox `injectManifest()`.
- True web push requires a backend to sign and dispatch VAPID requests. There is no backend in this stack — Convex functions could do this but would consume budget and require auth to associate a push subscription with a user. That belongs in the Clerk milestone, not now.
- **Decision:** Skip service-worker push. Deliver in-app notification on page load + browser `Notification` when permission granted.
### 3. Scholarship Calendar View
| Package | Version (verified) | Purpose |
|---------|-------------------|---------|
| `react-big-calendar` | 1.19.4 | Calendar UI (month/week/agenda views) |
| `date-fns` | 4.1.0 | Localizer (required by react-big-calendar) |
- React 19 support explicitly shipped in PR #2710, merged February 24 2025. Issue #2701 closed as "COMPLETED".
- Free (no premium tier gating unlike FullCalendar's timeline/resource views).
- Provides month, week, day, and agenda views out of the box — all relevant for deadline visualization.
- Peer deps declare `react: '^16.14.0 || ^17 || ^18 || ^19'` — confirmed React 19 support via npm.
- Tailwind v4: The library injects its own CSS (`react-big-calendar/lib/css/react-big-calendar.css`) which must be imported and then overridden via Tailwind utilities. This is the standard approach; the library exposes extensive class names for overriding.
- Latest stable `@fullcalendar/react@6.1.20`. Premium features (timeline, resource views) require paid plugins — not needed for a deadline calendar. The free tier is fine but adds heavier bundle weight vs react-big-calendar.
- v9.14.0 is a date picker, not an event calendar. It does not support multi-event month views with deadline badges. Use only if a date range selector is needed in a form.
- `shadcn-big-calendar@1.1.0` peer deps require `react@^18.0.0` only (does not list 19), and `react-big-calendar@^1.13.0` (behind on minor versions). Use react-big-calendar directly and style it with Tailwind.
### 4. Scholarship Value Calculator
| Package | Version (verified) | Purpose |
|---------|-------------------|---------|
| `recharts` | 3.8.1 | Bar/area charts for value visualization |
- Recharts 3.8.1 peer deps: `react: '^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0'` — React 19 confirmed.
- Recharts 3.x is a major rewrite of state management; it's the current stable line (not 2.x).
- Use only if the calculator needs a visual comparison bar. Skip if a table suffices — saves bundle weight.
### 5. Guided Multi-Step Wizard Flow (University Rank → Country → Budget funnel)
| Package | Version (verified) | Purpose |
|---------|-------------------|---------|
| `react-hook-form` | 7.72.0 | Per-step form validation (optional) |
| `@hookform/resolvers` | (peer) | Zod integration (already using Zod 4) |
- The existing `WizardShell.tsx` is a proven 3-step pattern with transitions, step state, and localStorage persistence already wired. The new guided wizard (rank → country → budget → results) is structurally identical.
- Composing new `StepRank.tsx`, `StepBudget.tsx`, etc. inside a new `WizardShell`-equivalent avoids a library dependency for something already solved in-repo.
- If steps have inline validation (e.g., numeric GPA range checks, required field errors shown per-field), use react-hook-form v7.72 with `zodResolver`.
- The existing eligibility wizard uses direct `useState` per-field — if the new wizard needs richer validation feedback, react-hook-form is the correct addition.
- Peer deps: `react: '^16.8.0 || ^17 || ^18 || ^19'` — React 19 confirmed via npm.
- **Known caveat:** react-hook-form does not natively support React 19's `useActionState` without workarounds. However, this wizard is client-side localStorage only — not server actions — so this caveat does not apply.
- `rhf-wizard` is a small community library wrapping react-hook-form for wizard flows. Given the existing in-repo WizardShell pattern, adding a meta-library adds indirection for no gain.
### 6. Application Readiness Score
## Global State Management Decision
| Package | Version (verified) | Purpose |
|---------|-------------------|---------|
| `zustand` | 5.0.12 | Client state store |
- v2 adds at least three independent localStorage stores: tracker state, notification preferences, and calculator state. Managing three `useLocalStorage` hooks that need to share data (e.g., tracker stage changes trigger notification reminders) creates prop-drilling or context hell.
- Zustand `persist` middleware handles `localStorage` serialization, SSR safety (`skipHydration`), and schema migration (versioned) — all needed for the Clerk upgrade path.
- Zustand v5.0.12 peer deps: `react >= 18.0.0`, `@types/react >= 18.0.0` — React 19 is a superset, confirmed compatible.
- Built-in `immer` middleware (via `zustand/middleware/immer`) allows draft-style mutations for Kanban card moves without manual spread — matches the complex nested updates in the tracker.
- Redux: massive boilerplate for localStorage-first features with no server sync needed yet.
- Jotai: atom granularity is excellent but the `atomWithStorage` utilities are less ergonomic than Zustand's `persist` for the "migrate to Clerk" upgrade path.
- React Context: No cross-tab sync, no built-in persistence, no migration utilities.
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
## Installation
# Kanban drag-and-drop
# In-app toasts
# Calendar
# type stubs (if needed)
# Global state + localStorage persistence
# Form validation (add only if per-step validation is required)
# Value comparison chart (add only if chart view is required)
## Tailwind v4 Compatibility Notes
| Library | Tailwind v4 Status |
|---------|-------------------|
| dnd-kit | No CSS dependency; 100% compatible |
| sonner | `className` / `toastOptions` props; override with Tailwind utilities. Compatible. |
| react-big-calendar | Requires importing `react-big-calendar/lib/css/react-big-calendar.css` then overriding with Tailwind. Apply neo-brutalism overrides via `.rbc-*` class selectors in `index.css`. |
| zustand | No styles. Compatible. |
| react-hook-form | No styles. Compatible. |
| recharts | SVG-based; no CSS conflict. Compatible. |
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
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
