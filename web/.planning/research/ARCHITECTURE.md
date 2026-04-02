# Architecture Patterns

**Domain:** Scholarship discovery + application tooling (v2 features)
**Researched:** 2026-04-02
**Confidence:** HIGH (based on direct codebase inspection + verified patterns)

---

## Existing Architecture Baseline

Before documenting the new architecture, the current system must be understood precisely. The v1 codebase establishes several load-bearing patterns that v2 must extend, not replace.

### Current Data Flow

```
                  Build time
  Convex DB ─────────────────► /public/data/scholarships.json (12MB)
                                        │
                  Runtime               │
  Browser ─── fetch (force-cache) ──────┘
      │                                 │
      │                    staticData in module-level cache
      │                                 │
      ├── useStaticData() ──────────────► filterScholarships() (pure fn)
      │                                 │
      ├── useEligibilityMatching() ──────► scoreAllScholarships() (pure fn)
      │                                 │
      └── Convex fallback only if        └── Results rendered
          static JSON unavailable
```

### Current localStorage Keys (v1, active)

| Key | Shape | Owner |
|-----|-------|-------|
| `scholarhub_student_profile` | `StudentProfile` object | `LocalStorageProfileAdapter` via `profileStorage` singleton |
| `scholarhub_nationality` | ISO string | `useScholarshipFilters` hook |
| `scholarhub_shortlist` | `ShortlistData` (universities + countries) | `useLocalStorage("scholarhub_shortlist")` in shortlist route |

### Key Architectural Invariants to Preserve

1. Static JSON is the primary read path. Convex must not be called for public read operations.
2. The `LocalStorageProfileAdapter` implements the `ProfileStorage` interface — the swap point for Clerk is already coded and just needs a new adapter.
3. SSR safety: all localStorage access must be guarded by `typeof window === "undefined"` checks. The existing pattern uses `useEffect` + a `hydrated` flag (see `useStudentProfile`).
4. Scoring is pure TypeScript — `scoreScholarship(scholarship, profile)` has zero dependencies and runs client-side only. This must remain true for all new computation engines.

---

## New Component Architecture

### Component Map

```
                                    STATIC JSON (read-only)
                                           │
                        ┌──────────────────┼──────────────────────┐
                        │                  │                       │
               useStaticData()     staticData module cache   filterScholarships()
                        │                  │                       │
                        ▼                  ▼                       ▼
 ┌──────────────────────────────────────────────────────────────────────────────┐
 │                         Client-Side Computation Layer                        │
 │                                                                              │
 │  lib/eligibility/scoring.ts          (EXISTING — scoreAllScholarships)       │
 │  lib/tracker/tracker-engine.ts       (NEW — kanban stage transitions)        │
 │  lib/scoring/readiness-engine.ts     (NEW — readiness score per scholarship) │
 │  lib/scoring/value-engine.ts         (NEW — total value calculation)         │
 │  lib/calendar/deadline-engine.ts     (NEW — deadline aggregation + grouping) │
 │                                                                              │
 └──────────────────────────────────────────────────────────────────────────────┘
                        │
                        ▼
 ┌──────────────────────────────────────────────────────────────────────────────┐
 │                        localStorage State Layer                              │
 │                                                                              │
 │  scholarhub_student_profile   (EXISTING — StudentProfile via ProfileStorage) │
 │  scholarhub_shortlist         (EXISTING — ShortlistData)                     │
 │  scholarhub_tracker           (NEW — ApplicationTracker)                     │
 │  scholarhub_alerts_config     (NEW — AlertsConfig)                           │
 │  scholarhub_alerts_sw_sub     (NEW — push subscription endpoint blob)        │
 │                                                                              │
 └──────────────────────────────────────────────────────────────────────────────┘
                        │
           ┌────────────┼────────────────────────────┐
           │            │                            │
           ▼            ▼                            ▼
     React hooks    Service Worker              Convex (minimal)
     (state mgmt)  (push delivery)           (subscription store)
```

---

## Component Boundaries

### 1. Storage Layer

**Purpose:** Single source of truth for all user state. All storage access goes through typed adapter objects, not direct `localStorage.getItem` calls.

**Existing pattern (already in codebase):**
```typescript
// lib/eligibility/profile-storage.ts
export interface ProfileStorage {
  getProfile(): StudentProfile | null;
  saveProfile(profile: StudentProfile): void;
  clearProfile(): void;
  hasProfile(): boolean;
}

export class LocalStorageProfileAdapter implements ProfileStorage { ... }
export const profileStorage: ProfileStorage = new LocalStorageProfileAdapter();
```

**New stores must follow the same adapter pattern:**

```typescript
// lib/tracker/tracker-storage.ts
export interface TrackerStorage {
  getTracker(): ApplicationTracker | null;
  saveTracker(tracker: ApplicationTracker): void;
  clearTracker(): void;
}

export class LocalStorageTrackerAdapter implements TrackerStorage { ... }
export const trackerStorage: TrackerStorage = new LocalStorageTrackerAdapter();
```

This pattern is the Clerk migration seam. When Clerk auth is added, replace `LocalStorageTrackerAdapter` with `ConvexTrackerAdapter` that calls a Convex mutation on write. The hook consumers see no change.

**localStorage key registry (all keys owned here, not scattered):**

| Key | Type | Description |
|-----|------|-------------|
| `scholarhub_student_profile` | `StudentProfile` | Eligibility profile (existing) |
| `scholarhub_shortlist` | `ShortlistData` | University/country shortlist (existing) |
| `scholarhub_nationality` | `string` | Saved nationality for directory filter (existing) |
| `scholarhub_tracker` | `ApplicationTracker` | Kanban application tracker (new) |
| `scholarhub_alerts_config` | `AlertsConfig` | Alert preferences + subscribed deadlines (new) |
| `scholarhub_push_subscription` | `SerializedPushSubscription \| null` | VAPID push endpoint blob (new) |

---

### 2. Application Tracker (Kanban)

**Data model:**

```typescript
// lib/tracker/types.ts
export type TrackerStage =
  | "researching"
  | "preparing"
  | "submitted"
  | "interview"
  | "result";

export interface TrackerEntry {
  scholarshipSlug: string;
  scholarshipTitle: string;   // denormalized for offline display
  stage: TrackerStage;
  addedAt: number;            // unix ms
  updatedAt: number;
  notes?: string;
  resultOutcome?: "awarded" | "rejected" | "waitlisted";
}

export interface ApplicationTracker {
  entries: TrackerEntry[];
  version: number;            // for migration
}
```

**Why denormalize the title:** Static JSON is loaded async. The tracker must display names while `staticData` is still loading (or if it ever fails to fetch). Title is a low-churn field — safe to snapshot at add time.

**Kanban stage transitions (pure function):**

```typescript
// lib/tracker/tracker-engine.ts
export function moveToStage(
  tracker: ApplicationTracker,
  slug: string,
  newStage: TrackerStage,
): ApplicationTracker { ... }

export function addEntry(
  tracker: ApplicationTracker,
  entry: Omit<TrackerEntry, "addedAt" | "updatedAt">,
): ApplicationTracker { ... }

export function removeEntry(
  tracker: ApplicationTracker,
  slug: string,
): ApplicationTracker { ... }
```

These are pure functions. The hook wraps them with storage persistence:

```typescript
// hooks/useApplicationTracker.ts
export function useApplicationTracker() {
  const [tracker, setTracker] = useState<ApplicationTracker>(...)
  // SSR-safe hydration with hydrated flag (same pattern as useStudentProfile)
  const move = (slug, stage) => {
    const next = moveToStage(tracker, slug, stage);
    trackerStorage.saveTracker(next);
    setTracker(next);
  };
  ...
}
```

**Integration with existing data:**
- On detail pages (`routes/scholarships/$slug.tsx`): add a "Track This" button that calls `useApplicationTracker().add(slug, title)`.
- On shortlist page: show tracker stage badge alongside existing dream/target/safety tiers.
- Tracker page is a new route: `/tracker` with Kanban columns.

---

### 3. Client-Side Scoring Engines

Both engines are pure functions that consume `StudentProfile` + a `ScholarshipSummary` from static data. No async. No Convex.

**Readiness Engine:**

```typescript
// lib/scoring/readiness-engine.ts
export interface ReadinessDimension {
  dimension: string;     // e.g., "IELTS", "GPA", "SOP"
  status: "met" | "gap" | "unknown";
  message: string;       // e.g., "Your IELTS 7.0 meets minimum 6.5"
  actionItem?: string;   // e.g., "Retake IELTS to reach 7.0"
}

export interface ReadinessScore {
  overallPercent: number;   // 0-100
  dimensions: ReadinessDimension[];
  criticalGaps: string[];   // dimension names blocking eligibility
}

export function computeReadiness(
  scholarship: ScholarshipSummary,
  profile: StudentProfile,
): ReadinessScore { ... }
```

**Value Engine:**

```typescript
// lib/scoring/value-engine.ts
export interface ValueBreakdown {
  tuitionCoverage: number | null;   // USD per year
  stipendAnnual: number | null;
  durationYears: number | null;
  totalValue: number | null;
  coveragePercent: number | null;   // vs estimated cost of destination
  breakdown: string[];              // human-readable lines
}

export function computeValue(
  scholarship: ScholarshipSummary,
  destinationCountry?: string,
): ValueBreakdown { ... }
```

Both engines are called in `useMemo` inside the component that needs them — no global state. They are fast (single-scholarship computation), so no Web Worker is needed. If profiling later shows scoring across 5,700 scholarships in batch (e.g., for the recommendations section) causes jank, the `scoreAllScholarships` call can be moved to a Web Worker at that point. Do not pre-optimize.

---

### 4. Push Notification Architecture

This is the most architecturally complex new feature. The constraints are:

1. No user auth — subscriptions cannot be tied to a user ID.
2. Deadline checks must happen even when the tab is closed.
3. The Notification Triggers API (TimestampTrigger) was abandoned by Chrome and has no cross-browser support — **it cannot be used**.
4. A backend component is required to send a push message to a stored subscription endpoint.

**Chosen architecture: Hybrid — in-app scheduling + optional server push**

Two notification modes, deployed independently:

**Mode A: In-App Local Notifications (Phase 1, no backend required)**

When the user has the site open (or in a background tab), a `useDeadlineAlerts` hook fires `Notification.requestPermission()` and then uses the SW `showNotification()` API directly from the page context when a deadline is within the configured window.

This covers the primary use case: a student monitors their shortlisted scholarships from the same browser.

```
User opens app
    │
useDeadlineAlerts hook
    │
    ├── reads AlertsConfig from localStorage
    ├── reads ApplicationTracker from localStorage
    ├── cross-references deadline timestamps from staticData
    ├── checks if any deadline is within alertWindow (e.g., 7 days)
    └── if yes AND Notification.permission === "granted":
            navigator.serviceWorker.ready
                .then(reg => reg.showNotification(title, options))
```

**Mode B: Background Push via Convex Action (Phase 2, backend required)**

For notifications when the browser is closed, a VAPID push subscription must be stored server-side and triggered by a scheduled Convex action.

```
Registration flow:
  User opts into alerts
    │
  Client: PushManager.subscribe({ applicationServerKey: VAPID_PUBLIC_KEY })
    │
  Client: sends PushSubscription JSON blob to Convex mutation
    │
  Convex: stores in push_subscriptions table (anonymous, no user ID)
    │
  Cron (weekly or daily): Convex action reads upcoming deadlines,
        iterates subscriptions, calls web-push npm package,
        sends push to browser push service endpoint

Delivery flow:
  Convex action → POST to subscription.endpoint (Google/Mozilla push service)
    │
  Browser push service → Service Worker push event
    │
  SW onpush handler → registration.showNotification(...)
```

**Convex schema additions for Mode B:**

```typescript
push_subscriptions: defineTable({
  endpoint: v.string(),           // push service URL
  p256dh: v.string(),             // browser public key
  auth: v.string(),               // auth secret
  subscribedDeadlines: v.array(v.string()),  // scholarship slugs to watch
  createdAt: v.number(),
  lastDeliveredAt: v.optional(v.number()),
}).index("by_endpoint", ["endpoint"])
```

**Phase ordering recommendation:** Build Mode A first. Mode B adds the Convex schema + action + a cron. These are additive, not a rewrite.

**Service Worker file (`public/sw.js`):**

The SW handles two events:
- `push` — receives payload from Convex, displays notification
- `notificationclick` — routes user to the relevant scholarship detail page

The SW must be registered at the root scope (`/sw.js`) so it intercepts all pages. It has no access to localStorage (SW scope restriction). Notification data is passed via the push payload JSON body.

**Browser support:** Push API + Service Worker + Notifications are supported in all modern browsers. iOS Safari 16.4+ supports web push for installed PWAs. Firefox and Chrome desktop/Android are full-featured.

---

### 5. Calendar View

**Architecture:** Read-only view over staticData + localStorage (no new storage).

```
CalendarPage (/calendar)
    │
    ├── useStaticData()  — all scholarship deadline timestamps
    ├── useApplicationTracker() — tracked scholarships (highlight differently)
    ├── useLocalStorage("scholarhub_shortlist") — shortlisted items
    │
    ▼
deadlineEngine.groupByMonth(scholarships, filters)
    │
    ▼
MonthGrid component (custom build, not react-big-calendar)
    │
    ├── renders each month as a CSS grid (7 columns)
    ├── DeadlineChip per scholarship on its deadline date
    └── DeadlineChip colors: tracked=blue, shortlisted=yellow, other=grey
```

**Library decision:** Use `react-day-picker` (already compatible with the existing design system) with custom day cell rendering, not `react-big-calendar`. The calendar is not an event scheduler — it is a deadline-visualization read-only grid. `react-day-picker` is headless and composable; `react-big-calendar` carries Outlook/Google Calendar UI opinions that conflict with neo-brutalism.

**Seasonal insights:** Static text content based on month analysis of the dataset — no new computation needed. Pre-computed at build time alongside static JSON export and included in `StaticData.taxonomy`.

---

### 6. Guided Wizard Flow

**Architecture:** New multi-step funnel that terminates at the directory with filters pre-applied via URL search params. It does not replace the existing eligibility wizard.

```
/discover (new route)
    │
WizardShell (new, not reusing eligibility WizardShell)
    │
    Step 1: UniversityRankStep       (select prestige tier: gold/silver/bronze)
    Step 2: CountryStep              (select destination countries)
    Step 3: BudgetStep               (select funding type preference)
    Step 4: DegreeFieldStep          (select degree level + field of study)
    │
    ▼
navigate("/scholarships?tier=gold,silver&to=UK&funding=fully_funded&degree=master&field=computer_science")
```

**State machine:** Use `useReducer` with a discriminated union state type — not XState. The wizard has 4 linear steps with optional back-navigation. XState's overhead is unjustified for this complexity level.

```typescript
type WizardState =
  | { step: "rank"; data: Partial<WizardData> }
  | { step: "country"; data: Partial<WizardData> }
  | { step: "budget"; data: Partial<WizardData> }
  | { step: "degree_field"; data: Partial<WizardData> }
  | { step: "done"; data: WizardData };

type WizardAction =
  | { type: "SELECT_RANK"; tiers: string[] }
  | { type: "SELECT_COUNTRY"; countries: string[] }
  | { type: "SELECT_BUDGET"; funding: string }
  | { type: "SELECT_DEGREE_FIELD"; degree: string; fields: string[] }
  | { type: "BACK" }
  | { type: "SKIP" };
```

**Integration with existing directory:** The wizard terminates by navigating to `/scholarships` with URL search params. The existing `useScholarshipFilters` hook already parses those params — no changes needed there. The wizard is purely additive.

**Relationship to eligibility wizard:** The two wizards serve different intents:
- Eligibility wizard (`/eligibility`): "Am I eligible?" — profile-centric, saves to localStorage, terminates at scored results.
- Discovery wizard (`/discover`): "Help me find scholarships" — session-only state, terminates at filtered directory.

Do not merge them.

---

### 7. Enhanced Filtering (University Rank + Value-Based)

**Architecture:** Additive changes to existing `useScholarshipFilters` and `filterScholarships`.

New filter params added to the URL schema:
- `tier` — already exists (`gold`, `silver`, `bronze`, `unranked`)
- `min_value` — minimum total scholarship value in USD (new)
- `uni_rank` — university ranking tier (new, when rank data added to ScholarshipSummary)

Value filter is applied client-side in `filterScholarships()` using `computeValue()` results. Since `computeValue` is fast (no I/O), it can run inline in the filter pass without memoization overhead.

**No Convex changes needed.** All filtering happens against staticData.

---

## Data Flow Summary

```
STATIC JSON (source of truth for scholarship data)
      │
      ├─► filterScholarships()          — directory, calendar, recommendations
      ├─► scoreAllScholarships()         — eligibility results
      ├─► computeReadiness()             — per-scholarship readiness card
      ├─► computeValue()                 — value calculator + directory filter
      └─► deadlineEngine.groupByMonth()  — calendar view

localStorage (source of truth for user state)
      │
      ├─► scholarhub_student_profile    — eligibility wizard + match scoring
      ├─► scholarhub_shortlist           — shortlist builder
      ├─► scholarhub_tracker             — application Kanban
      └─► scholarhub_alerts_config       — alert preferences

Convex (admin + write operations + push subscription store)
      │
      ├─► scholarship CRUD (admin)
      ├─► push_subscriptions table (Mode B push alerts only)
      └─► scheduled action for push delivery
```

---

## Clerk Migration Path

The migration path is already partially coded. The following adapters need Clerk-aware replacements when auth is added:

| Adapter | localStorage Key | Clerk Replacement |
|---------|-----------------|-------------------|
| `LocalStorageProfileAdapter` | `scholarhub_student_profile` | `ConvexProfileAdapter` — read/write via `convex/userProfile` table keyed by Clerk user ID |
| `LocalStorageTrackerAdapter` | `scholarhub_tracker` | `ConvexTrackerAdapter` — read/write via `convex/applicationTracker` table |
| `LocalStorageAlertsAdapter` | `scholarhub_alerts_config` | `ConvexAlertsAdapter` — combines with push subscription row |

**Migration safety:**
- All adapters implement a typed interface. No component or hook calls `localStorage` directly (after v2 cleanup — the shortlist route currently uses `useLocalStorage` directly and should be wrapped in the same adapter pattern before v2 ships).
- Add a one-time migration: on first Clerk login, read all localStorage keys and write to Convex. This is a single mutation. After migration, clear localStorage keys to avoid stale data.
- The push subscription table already stores anonymously — when Clerk arrives, add `userId` to the row and re-associate by endpoint match.

---

## Suggested Build Order

Dependencies flow upward. Build from the bottom of this list.

```
Phase 1 — Storage Foundations
  1. TrackerStorage adapter + ApplicationTracker types
  2. AlertsConfig types + LocalStorageAlertsAdapter
  3. useApplicationTracker hook (SSR-safe, hydrated flag)

Phase 2 — Computation Engines (no UI, testable in isolation)
  4. readiness-engine.ts (pure function, unit tests first)
  5. value-engine.ts (pure function)
  6. deadline-engine.ts (groupByMonth, pure function)

Phase 3 — Core New Pages (high value, no new infra)
  7. /tracker route — Kanban board consuming useApplicationTracker
  8. /calendar route — calendar grid consuming deadline-engine + staticData
  9. /discover route — guided wizard with useReducer state machine

Phase 4 — Detail Page Enhancements (reads from Phase 1+2)
  10. ReadinessScoreCard on scholarship detail pages
  11. ValueBreakdownCard on scholarship detail pages
  12. Enhanced directory filters (value filter, rank tier filter)

Phase 5 — Notification Infrastructure
  13. Service Worker registration + Notification.requestPermission() flow
  14. useDeadlineAlerts hook (Mode A: in-app)
  15. AlertsConfigPanel UI
  16. (Optional, separate phase) Mode B: Convex push_subscriptions table + action + cron
```

**Key dependency: Phase 1 before Phase 3.** The tracker Kanban (Phase 3) consumes the tracker hook (Phase 1). Everything else is independent once staticData is available.

**Phase 5 (notifications) can ship after Phase 3** without any dependencies. It adds a new surface (`/alerts` settings or a drawer), not a modification of existing ones.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Direct localStorage Access in Components
**What goes wrong:** Keys scattered across components, impossible to swap storage layer for Clerk.
**Prevention:** All localStorage access goes through typed adapter singletons in `lib/*/storage.ts` files. Components call hooks; hooks call adapters.

### Anti-Pattern 2: Calling Convex for Static Scholarship Data
**What goes wrong:** Exceeds free tier limits. Static JSON exists precisely to prevent this.
**Prevention:** All scholarship reads (`filterScholarships`, `getScholarshipBySlug`, etc.) operate on the `StaticData` object from `useStaticData()`. Only admin mutations and push subscription storage touch Convex.

### Anti-Pattern 3: Merging the Two Wizards
**What goes wrong:** Eligibility wizard saves profile state; discovery wizard is session-only. Merging creates coupling between profile persistence and browsing funnel.
**Prevention:** Keep separate routes, separate state machines, separate purposes.

### Anti-Pattern 4: Scheduling Notifications with setTimeout in a Service Worker
**What goes wrong:** Service Workers are terminated between events. `setTimeout` inside a SW is unreliable.
**Prevention:** Mode A uses in-page hook + `reg.showNotification()` when the page is open. Mode B uses Convex server-side cron. Never rely on SW-internal timers.

### Anti-Pattern 5: Computing Value/Readiness on Every Render
**What goes wrong:** These functions scan scholarship fields on every re-render.
**Prevention:** Wrap in `useMemo` with scholarship slug as the dependency key. Both functions are deterministic.

---

## Scalability Considerations

| Concern | Now (5,722 scholarships) | After Clerk (N users) |
|---------|--------------------------|----------------------|
| Client-side scoring | useMemo on full corpus, ~10ms | Same — runs client-side per user session |
| Push subscriptions | One row per browser subscription | One row per user once Clerk replaces anonymous subs |
| Calendar render | All deadlines loaded in memory | Same — staticData is cached globally |
| Value filter | Inline in filterScholarships pass | Same — pure function, no I/O |

The bottleneck at scale is push subscription fan-out (Mode B). If subscriptions reach 10K+, the Convex action must batch push sends to avoid rate limiting from browser push services. This is a Phase 5+ concern.

---

## Sources

- Codebase inspection: `src/lib/eligibility/profile-storage.ts` — adapter pattern already in place
- Codebase inspection: `src/hooks/useStudentProfile.ts` — SSR-safe hydration pattern
- Codebase inspection: `src/hooks/useEligibilityMatching.ts` — static-data-first hybrid pattern
- Codebase inspection: `convex/crons.ts` — Convex cron constraints on free plan
- [MDN: ServiceWorkerRegistration.showNotification()](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/showNotification) — MEDIUM confidence
- [Chrome: Notification Triggers API (abandoned)](https://developer.chrome.com/docs/web-platform/notification-triggers) — HIGH confidence (confirmed discontinued)
- [web.dev: Web Push Protocol](https://web.dev/articles/push-notifications-web-push-protocol) — HIGH confidence (VAPID server requirements confirmed)
- [Zustand: Persisting store data](https://zustand.docs.pmnd.rs/reference/integrations/persisting-store-data) — HIGH confidence (storage interface documented)
- [react-day-picker: Custom Components](https://daypicker.dev/guides/custom-components) — MEDIUM confidence
- [Builder.io: Best React calendar components 2025](https://www.builder.io/blog/best-react-calendar-component-ai) — MEDIUM confidence
