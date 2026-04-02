# Phase 03: Scholarship Calendar - Research

**Researched:** 2026-04-03
**Domain:** Calendar UI with react-big-calendar, deadline visualization, urgency color coding
**Confidence:** HIGH

## Summary

Phase 03 adds a monthly deadline calendar at `/calendar` that renders deadlines from the user's tracked scholarships. The primary library is react-big-calendar 1.19.4 with date-fns 4.1.0 as the localizer -- both are already validated in STACK.md and the UI-SPEC. The implementation is read-only: no new localStorage keys are introduced. The calendar reads from the existing `useTrackerStore` (Zustand) for tracked scholarship slugs and looks up `application_deadline` timestamps from the static JSON data via `useStaticData()`.

A critical finding from codebase inspection: the existing "shortlist" (`scholarhub-shortlist` localStorage key) stores **universities and countries**, NOT scholarship slugs. The UI-SPEC references both "tracked" and "shortlisted" scholarships as calendar data sources, but there is no per-scholarship shortlist mechanism in the codebase. The tracker IS the per-scholarship mechanism. The calendar should source deadlines from the tracker only, or the plan must introduce a scholarship-level bookmark/shortlist feature. The tracker-only approach is recommended to avoid scope creep -- universities in the shortlist cannot be meaningfully mapped to individual scholarship deadlines.

Additionally, only 2% of scholarships (116 of 5,722) have `application_deadline` data. Of those, 87 are future deadlines. This means the empty state will be the default experience for most users, and the `CalendarEmptyState` component is not an edge case but the primary initial experience. The "peak season" banner threshold of 3+ deadlines per month is appropriate given the sparse data -- most months will have 0-2 deadlines from a user's tracked set.

**Primary recommendation:** Use react-big-calendar with custom component overrides (toolbar, event, dateHeader) and neo-brutalism CSS overrides. Source deadlines exclusively from the tracker store. Build a pure `deadline-engine.ts` module for urgency computation and month data aggregation. Treat the empty state as a first-class design concern.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
None -- discuss phase was skipped per user setting. All implementation choices are at Claude's discretion.

### Claude's Discretion
All implementation choices are at Claude's discretion -- discuss phase was skipped per user setting. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

### Deferred Ideas (OUT OF SCOPE)
None -- discuss phase skipped.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CAL-01 | Monthly calendar view shows deadlines for tracked/shortlisted scholarships | react-big-calendar month view with custom components; deadline-engine aggregates from tracker store + static data |
| CAL-02 | Color-coded by urgency (critical/warning/open matching existing design tokens) | Existing urgency badge variants (`urgencyCritical`, `urgencyWarning`, `urgencyOpen`, `urgencyClosed`) and CSS custom properties (`--urgency-critical`, etc.) already defined in badge.tsx and index.css |
| CAL-03 | Click a calendar event to navigate to scholarship detail page | `onSelectEvent` callback on react-big-calendar navigates to `/scholarships/[slug]` via TanStack Router |
| CAL-04 | "Peak season" insights: "October is busy -- you have 5 deadlines this month" | Pure computation in deadline-engine: `isPeakSeason = totalDeadlines >= 3`; PeakSeasonBanner renders conditionally |
| CAL-05 | Calendar renders only shortlisted/tracked scholarships (not all 5,700+) | Filter static data summaries against tracker slug set; only 2% of scholarships have deadlines so performance is not a concern |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **No auth:** All features must work with localStorage. Calendar reads from tracker store (Zustand persist to localStorage).
- **Convex budget:** Static JSON remains primary read path. Calendar introduces zero new Convex queries -- all data comes from `useStaticData()` + `useTrackerStore`.
- **Design system:** Neo-brutalism must be maintained. Use existing tokens, Card/Badge primitives. react-big-calendar CSS must be overridden to match.
- **Git commits:** Do NOT add Co-Authored-By: Claude lines (global CLAUDE.md rule).

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `react-big-calendar` | 1.19.4 | Calendar month view with event rendering | React 19 confirmed (PR #2710 merged Feb 2025); provides month + agenda views; headless component override API |
| `date-fns` | 4.1.0 | Localizer for react-big-calendar | Already installed in project; required by react-big-calendar's dateFnsLocalizer |
| `@types/react-big-calendar` | 1.16.3 | TypeScript definitions | DefinitelyTyped package; provides ToolbarProps, DateHeaderProps, EventProps types |

### Supporting (already in project)

| Library | Version | Purpose | Usage |
|---------|---------|---------|-------|
| `zustand` | 5.0.12 | Tracker state store | `useTrackerStore` for tracked scholarship slugs |
| `lucide-react` | 0.577 | Icons | Calendar, ChevronLeft, ChevronRight for month navigation |
| `class-variance-authority` | existing | Badge variants | Urgency badge variants for deadline chips |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-big-calendar | react-day-picker 9.x | react-day-picker is a date picker, not an event calendar -- does not support multi-event day rendering; would require building all event display from scratch |
| react-big-calendar | @fullcalendar/react 6.x | Premium features paywalled; heavier bundle; unnecessary for a deadline-only view |
| react-big-calendar | Custom CSS grid calendar | Full control but must hand-roll accessibility (grid role, arrow key nav, aria-live), month computation, and event layout -- not worth it |

**Installation:**
```bash
npm install react-big-calendar@1.19.4
npm install -D @types/react-big-calendar
```

Note: `date-fns` is already installed (`^4.1.0` in package.json).

## Architecture Patterns

### Recommended Project Structure

```
src/
  lib/
    calendar/
      deadline-engine.ts       # Pure functions: getMonthData, computeUrgency, filterTrackedDeadlines
      deadline-engine.test.ts  # Unit tests for deadline-engine
      types.ts                 # CalendarEvent, MonthData, UrgencyLevel types
  components/
    calendar/
      CalendarPage.tsx         # Route component (could be inline in routes/calendar.tsx)
      MonthNavigation.tsx      # Custom toolbar replacing react-big-calendar default
      DeadlineChip.tsx         # Custom event component with urgency coloring
      DayHeader.tsx            # Custom dateHeader with "today" ring
      DayDetailPanel.tsx       # Expanded panel below grid for selected day
      PeakSeasonBanner.tsx     # Conditional insight card
      CalendarEmptyState.tsx   # Empty state CTA
      calendar-overrides.css   # Neo-brutalism CSS overrides for .rbc-* selectors
  routes/
    calendar.tsx               # Route definition with search params for month
```

### Pattern 1: Pure Deadline Engine (same pattern as tracker-engine.ts)

**What:** All calendar data computation lives in pure functions with no side effects, no hooks, no async.
**When to use:** Always. The existing `tracker-engine.ts` establishes this pattern.
**Example:**
```typescript
// lib/calendar/deadline-engine.ts
import type { ScholarshipSummary } from "@/lib/scholarship-summary";
import type { CalendarEvent, MonthData, UrgencyLevel } from "./types";

export function computeUrgency(deadlineMs: number, nowMs: number): UrgencyLevel {
  const diffDays = Math.ceil((deadlineMs - nowMs) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "closed";
  if (diffDays <= 7) return "critical";
  if (diffDays <= 30) return "warning";
  return "open";
}

export function getMonthData(
  summaries: ScholarshipSummary[],
  trackedSlugs: Set<string>,
  year: number,
  month: number, // 0-indexed
  nowMs: number,
): MonthData {
  // Filter summaries to those tracked AND having a deadline in the target month
  // Build CalendarEvent[] and eventsByDay Map
  // Compute isPeakSeason (totalDeadlines >= 3)
}
```

### Pattern 2: Custom react-big-calendar Components via `components` Prop

**What:** react-big-calendar renders UI through an internal component tree. The `components` prop lets you swap any internal component.
**When to use:** Always for this project -- the default UI does not match neo-brutalism.
**Example:**
```typescript
// From UI-SPEC, verified against react-big-calendar API
<Calendar
  localizer={dateFnsLocalizer}
  events={calendarEvents}
  views={["month"]}
  defaultView="month"
  date={currentDate}
  onNavigate={handleNavigate}
  components={{
    toolbar: MonthNavigation,
    event: DeadlineChip,
    month: { dateHeader: DayHeader },
  }}
  onSelectEvent={handleEventClick}
  eventPropGetter={eventStyleGetter}
/>
```

### Pattern 3: URL Search Params for Month State (TanStack Router pattern)

**What:** The currently displayed month is encoded in URL search params (`?month=2026-04`) for shareability and browser back-button support.
**When to use:** Per UI-SPEC interaction contract.
**Example:**
```typescript
// routes/calendar.tsx
import { z } from "zod/v4";

const calendarSearchSchema = z.object({
  month: z.string().optional(), // format: "YYYY-MM"
});

export const Route = createFileRoute("/calendar")({
  validateSearch: calendarSearchSchema,
  head: () => ({
    meta: [
      { title: "Deadline Calendar | ScholarHub" },
      { name: "description", content: "View your scholarship deadlines in a monthly calendar." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CalendarPage,
});
```

### Pattern 4: SSR-Safe Hydration (existing pattern)

**What:** Zustand stores use `skipHydration: true` and rehydrate client-side. The tracker store already does this.
**When to use:** For any component that reads localStorage-based state. The calendar reads from `useTrackerStore` which already handles this.
**Example:**
```typescript
// The useTrackerHydration hook pattern is already established
// Calendar components should check hydration before rendering deadline data
const hydrated = useTrackerHydration();
if (!hydrated) return <CalendarSkeleton />;
```

### Anti-Patterns to Avoid

- **Reading localStorage directly in calendar components:** Always go through `useTrackerStore`. Direct reads break SSR and cross-tab sync.
- **Querying Convex for deadline data:** All 5,722 summaries are already in static JSON. Adding a Convex query would burn free-tier budget for no benefit.
- **Rendering all 5,722 deadlines on the calendar:** CAL-05 explicitly says only tracked scholarships. Filter FIRST, render SECOND.
- **Custom calendar grid from scratch:** The accessibility requirements (grid role, arrow key navigation, aria-live regions) are substantial. react-big-calendar handles these.
- **Importing the full date-fns library:** Only import specific functions (`format`, `parse`, `startOfWeek`, `getDay`, `startOfMonth`, `endOfMonth`, `addMonths`, `subMonths`).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Monthly calendar grid with day cells | CSS Grid + manual date math | `react-big-calendar` month view | Handles month boundary wrapping, different month lengths, leap years, first-day-of-week locale, accessible grid roles |
| Date localization | `new Date().toLocaleDateString()` calls scattered everywhere | `dateFnsLocalizer` + `format` from date-fns | Consistent locale handling; required by react-big-calendar |
| Calendar keyboard navigation | Manual keydown handlers on grid cells | react-big-calendar's built-in keyboard support | Arrow keys, Enter/Space, focus management already implemented |
| Urgency color mapping to events | Inline style computation in components | `eventPropGetter` callback on Calendar component | The standard react-big-calendar way to apply per-event styles |

**Key insight:** react-big-calendar is opinionated about layout but extensible about appearance. Use its structural opinions (month grid, event stacking, overflow handling) and override its visual opinions (colors, borders, fonts) via CSS and custom components.

## Common Pitfalls

### Pitfall 1: react-big-calendar CSS Import Order with Tailwind v4

**What goes wrong:** The calendar renders unstyled or with broken layout because the base CSS was not imported or was overridden too aggressively.
**Why it happens:** react-big-calendar requires its own CSS (`react-big-calendar/lib/css/react-big-calendar.css`) for layout. Tailwind v4 with @layer resets can strip these styles.
**How to avoid:** Import the base CSS in the calendar component file or in a dedicated `calendar-overrides.css` file. Place overrides AFTER the base import. Use specific `.rbc-*` selectors to override only visual properties, not layout properties.
**Warning signs:** Calendar grid collapses, events don't position correctly, toolbar is invisible.

### Pitfall 2: SSR Hydration Mismatch from Date.now() in Render

**What goes wrong:** Server renders urgency as "open" but client renders as "critical" because `Date.now()` differs between SSR and hydration.
**Why it happens:** TanStack Start SSR runs on Netlify; the server timestamp can differ from client by seconds.
**How to avoid:** Never call `Date.now()` during render. Use the `useCountdown` pattern from `deadline.ts` -- initialize state as null during SSR, compute in `useEffect` after hydration. Or, since this route is `noindex`, use a `typeof window !== "undefined"` guard.
**Warning signs:** React hydration mismatch warning in console; urgency badges flash on load.

### Pitfall 3: Shortlist vs Tracker Data Source Confusion

**What goes wrong:** Calendar shows no events because it's trying to read from a non-existent per-scholarship shortlist.
**Why it happens:** The ROADMAP says "shortlisted/tracked" but the existing shortlist stores universities, not scholarship slugs. The tracker is the only per-scholarship mechanism.
**How to avoid:** Source deadlines exclusively from `useTrackerStore.entries`. Do NOT attempt to extract scholarship slugs from the university shortlist.
**Warning signs:** Calendar always shows empty state even when user has tracked scholarships.

### Pitfall 4: Sparse Deadline Data Leading to Poor Empty Experience

**What goes wrong:** Users see an empty calendar and think the feature is broken.
**Why it happens:** Only 2% of scholarships have deadline data. A user with 5 tracked scholarships might have 0-1 with deadlines.
**How to avoid:** Design the empty state as the primary first-time experience, not an edge case. The `CalendarEmptyState` should clearly explain what's needed and provide a direct CTA to the tracker. Consider showing a "X of your Y tracked scholarships have deadline data" message when the calendar is partially populated.
**Warning signs:** Users navigate to the calendar, see an empty grid, and immediately leave.

### Pitfall 5: react-big-calendar Event Object Shape Mismatch

**What goes wrong:** Events don't render or throw runtime errors about missing `start`/`end` properties.
**Why it happens:** react-big-calendar expects events with `start: Date` and `end: Date` properties. The scholarship data stores `application_deadline` as a unix millisecond timestamp.
**How to avoid:** Transform `deadlineMs` to `new Date(deadlineMs)` when creating the event objects. For deadline events that are a single point in time, set `start` and `end` to the same Date, and use `allDay: true`.
**Warning signs:** Console errors about `start.getTime is not a function`; blank calendar despite having events.

## Code Examples

### dateFnsLocalizer Setup (verified pattern from STACK.md and UI-SPEC)

```typescript
// lib/calendar/localizer.ts
import { dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale/en-US";

export const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: enUS }),
  getDay,
  locales: { "en-US": enUS },
});
```

### CalendarEvent Type (from UI-SPEC state contract)

```typescript
// lib/calendar/types.ts
export type UrgencyLevel = "critical" | "warning" | "open" | "closed";

export interface CalendarEvent {
  scholarshipSlug: string;
  scholarshipTitle: string;
  deadlineMs: number;
  source: "tracked"; // Only "tracked" for now, see Pitfall 3
  urgency: UrgencyLevel;
  prestigeTier: string | null;
  // react-big-calendar required fields
  start: Date;
  end: Date;
  allDay: boolean;
  title: string; // alias for scholarshipTitle
}

export interface MonthData {
  year: number;
  month: number; // 0-indexed
  events: CalendarEvent[];
  eventsByDay: Map<number, CalendarEvent[]>; // day-of-month -> events
  totalDeadlines: number;
  isPeakSeason: boolean; // 3+ deadlines in month
}
```

### eventPropGetter for Urgency Coloring

```typescript
// Maps urgency to CSS classes for react-big-calendar events
function eventPropGetter(event: CalendarEvent) {
  const urgencyClasses: Record<UrgencyLevel, string> = {
    critical: "bg-urgency-critical text-main-foreground border-urgency-critical",
    warning: "bg-urgency-warning text-accent-foreground border-urgency-warning",
    open: "bg-urgency-open text-main-foreground border-urgency-open",
    closed: "bg-urgency-closed text-main-foreground border-urgency-closed",
  };

  return {
    className: urgencyClasses[event.urgency],
    style: {
      borderRadius: "0px", // neo-brutalism
      border: "2px solid var(--border)",
    },
  };
}
```

### Route with URL Month Param (TanStack Router pattern from codebase)

```typescript
// routes/calendar.tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod/v4";

const calendarSearch = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
});

export const Route = createFileRoute("/calendar")({
  validateSearch: calendarSearch,
  head: () => ({
    meta: [
      { title: "Deadline Calendar | ScholarHub" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CalendarPage,
});
```

### CSS Override Pattern for Neo-Brutalism

```css
/* components/calendar/calendar-overrides.css */
/* Import base styles first */
@import "react-big-calendar/lib/css/react-big-calendar.css";

/* Neo-brutalism overrides */
.rbc-month-view,
.rbc-month-row,
.rbc-day-bg,
.rbc-header {
  border: 2px solid var(--border);
  border-radius: 0px;
}

.rbc-event {
  border-radius: 0px;
  border: 2px solid var(--border);
  font-family: var(--font-base);
  font-size: var(--text-caption);
}

.rbc-event:hover {
  box-shadow: var(--shadow);
}

.rbc-today {
  background-color: transparent;
  border: 3px solid var(--main);
}

.rbc-toolbar {
  display: none; /* Replaced by custom MonthNavigation */
}

.rbc-off-range-bg {
  background: var(--background);
}

.rbc-header {
  font-family: var(--font-heading);
  font-size: var(--text-caption);
  text-transform: uppercase;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-big-calendar with moment.js localizer | react-big-calendar with date-fns localizer | date-fns v4 (2024) | Lighter bundle; date-fns already in project |
| Custom CSS calendar grids | Library-based calendar with component overrides | Ongoing | Accessibility handled by library |
| Full scholarship list as calendar source | Filtered tracked-only scholarships | Architecture decision | Prevents performance issues and information overload |

**Deprecated/outdated:**
- `momentLocalizer` from react-big-calendar -- still works but adds moment.js dependency. Use `dateFnsLocalizer` with date-fns v4.
- `globalizeLocalizer` -- deprecated in favor of dateFnsLocalizer.

## Open Questions

1. **Shortlist as Calendar Source**
   - What we know: The existing shortlist stores universities + countries, NOT scholarship slugs. The tracker is the only per-scholarship mechanism.
   - What's unclear: Whether the ROADMAP's "shortlisted/tracked" language means a future per-scholarship shortlist or was using "shortlist" loosely to mean "tracker."
   - Recommendation: Source from tracker only. If a per-scholarship bookmark feature is added later, calendar integration is a simple union of slug sets. Do not block on this.

2. **Mobile View: Month Grid vs Agenda**
   - What we know: UI-SPEC specifies condensed grid with dot indicators on mobile. react-big-calendar has a built-in agenda view that could serve as a mobile alternative.
   - What's unclear: Whether the dot-indicator mobile grid is feasible with react-big-calendar's month view or requires significant CSS hacking.
   - Recommendation: Use react-big-calendar's month view on all viewports with responsive CSS. If the mobile experience is poor, swap to agenda view at `< 768px` breakpoint. react-big-calendar supports `views={["month", "agenda"]}` with responsive switching.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1 |
| Config file | `web/vitest.config.ts` |
| Quick run command | `npx vitest run src/lib/calendar/` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CAL-01 | getMonthData returns correct events for tracked scholarships | unit | `npx vitest run src/lib/calendar/deadline-engine.test.ts -x` | Wave 0 |
| CAL-02 | computeUrgency returns correct urgency level for threshold boundaries | unit | `npx vitest run src/lib/calendar/deadline-engine.test.ts -x` | Wave 0 |
| CAL-03 | onSelectEvent callback receives correct slug | unit | `npx vitest run src/lib/calendar/deadline-engine.test.ts -x` | Wave 0 (engine only; UI click is manual) |
| CAL-04 | isPeakSeason = true when 3+ deadlines in month | unit | `npx vitest run src/lib/calendar/deadline-engine.test.ts -x` | Wave 0 |
| CAL-05 | getMonthData filters to tracked slugs only, ignores untracked | unit | `npx vitest run src/lib/calendar/deadline-engine.test.ts -x` | Wave 0 |

### Sampling Rate

- **Per task commit:** `npx vitest run src/lib/calendar/ --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/lib/calendar/deadline-engine.test.ts` -- covers CAL-01, CAL-02, CAL-04, CAL-05
- [ ] `src/lib/calendar/types.ts` -- CalendarEvent, MonthData, UrgencyLevel types

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| react-big-calendar | Calendar UI | Not installed | 1.19.4 (npm) | Must install |
| @types/react-big-calendar | TypeScript | Not installed | 1.16.3 (npm) | Must install |
| date-fns | Localizer | Installed | ^4.1.0 | -- |
| zustand | Tracker store | Installed | ^5.0.12 | -- |
| vitest | Testing | Installed (dev) | ^4.1.0 | -- |

**Missing dependencies with no fallback:**
- `react-big-calendar` and `@types/react-big-calendar` must be installed before implementation

**Missing dependencies with fallback:**
- None

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `src/lib/tracker/tracker-store.ts` -- Zustand store with `useTrackerStore`, `skipHydration: true`, `persist` middleware
- Codebase inspection: `src/lib/tracker/types.ts` -- TrackerEntry type with `scholarshipSlug`, `scholarshipTitle`, `stage`
- Codebase inspection: `src/lib/scholarship-summary.ts` -- ScholarshipSummary with `application_deadline?: number | null`
- Codebase inspection: `src/routes/shortlist.tsx` -- Shortlist stores `ShortlistData { universities, countries }`, NOT scholarship slugs
- Codebase inspection: `src/components/ui/badge.tsx` -- urgencyCritical/urgencyWarning/urgencyOpen/urgencyClosed variants exist
- Codebase inspection: `src/index.css` -- `--urgency-critical`, `--urgency-warning`, `--urgency-open`, `--urgency-closed` tokens with both light and dark mode values
- Codebase inspection: `src/data/scholarships.json` -- 5,722 summaries, 116 with deadlines (2.0%), 87 future
- npm registry (verified 2026-04-03): react-big-calendar 1.19.4, @types/react-big-calendar 1.16.3, date-fns 4.1.0
- [react-big-calendar React 19 support](https://github.com/jquense/react-big-calendar/issues/2701) -- PR #2710 merged Feb 2025
- STACK.md research (2026-04-02) -- react-big-calendar recommendation with version verification

### Secondary (MEDIUM confidence)
- [react-big-calendar custom toolbar](https://github.com/jquense/react-big-calendar/issues/818) -- `components={{ toolbar: CustomToolbar }}` pattern
- [DefinitelyTyped types](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/react-big-calendar/index.d.ts) -- ToolbarProps, DateHeaderProps, EventProps

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- react-big-calendar 1.19.4 version verified on npm; React 19 support confirmed via GitHub PR; date-fns already installed
- Architecture: HIGH -- follows exact patterns established in tracker-engine.ts (pure functions) and tracker route (page layout)
- Pitfalls: HIGH -- SSR hydration, CSS import order, and data shape issues verified against codebase patterns and prior Phase 01 incidents (commit efffd17)
- Data availability: HIGH -- directly measured from scholarships.json (116/5722 with deadlines)

**Research date:** 2026-04-03
**Valid until:** 2026-05-03 (stable -- library versions unlikely to change significantly)
