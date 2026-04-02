# Domain Pitfalls

**Domain:** Scholarship platform — personalization, tracking, notifications, and calculators
**Researched:** 2026-04-02
**Scope:** v2 milestone features added to an existing SSR platform with localStorage-only storage, Convex free tier, and 5,700+ scholarships with variable data completeness

---

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

---

### Pitfall 1: localStorage Quota Exhausted Silently

**What goes wrong:**
The current `useLocalStorage` hook swallows `QuotaExceededError` silently (the catch block is empty). With v2, the platform will write tracker entries (5-15 applications, each with status, notes, dates, document checklist items), shortlist data, eligibility profile, and alert subscriptions — all to the same origin. On mobile Safari and iOS PWAs specifically, localStorage quotas can be as low as 5MB per origin, and private/incognito mode can reduce this further. When the write fails silently, the user believes their data was saved but it was not.

**Why it happens:**
The 5MB limit applies across all keys for the same origin. A tracker entry storing slug, status, notes, timestamps, checklist state, and computed scores for 15 scholarships easily grows to 50-100KB. Multiple features writing independently without a shared budget estimate creates accumulation risk. The current silent-fail pattern in `useLocalStorage` (line 27-29) and `LocalStorageProfileAdapter.saveProfile` (line 34-38) means no feature knows when the budget is full.

**Consequences:**
User loses all tracker data on a second device (localStorage is per-device). User adds notes to a tracker entry, sees no error, closes the tab, and the note is gone. Application readiness scores computed from a stale profile give wrong recommendations. On iOS, Private Browse disables localStorage entirely — the whole tracker is invisible.

**Prevention:**
1. Audit total localStorage usage before writing any new feature. Write a `getStorageEstimate()` utility that sums `JSON.stringify(localStorage).length` and surfaces a warning when above 3MB (60% of quota).
2. Upgrade the `useLocalStorage` hook to distinguish `QuotaExceededError` from other errors. Show a banner: "Storage almost full — some data may not be saved."
3. Define a storage budget allocation per key group: profile (~2KB), shortlist (~10KB), tracker (~100KB for 15 entries with notes), alerts (~5KB). Total: ~120KB — well within 5MB, but only if notes are capped.
4. Cap free-text notes fields to 500 characters with a visible counter.
5. Never store scholarship full objects in localStorage — only store slugs and reference the static JSON for detail data.

**Warning signs:**
- Any localStorage write that stores full scholarship objects (title, description, all fields) rather than just the slug
- A tracker entry data model with unbounded `notes` or `documents` arrays
- Missing error boundaries around localStorage-dependent UI

**Phase:** Address the storage audit utility and hook upgrade before any tracker or notes feature is built.

---

### Pitfall 2: Permanent Push Notification Block from Premature Permission Prompt

**What goes wrong:**
If the browser's native push permission dialog fires immediately on first visit to an "Alerts" page (or worse, on any page load), users dismiss or block it. A blocked permission can never be re-requested by JavaScript. Chrome 80+ applies a "quieter notifications" penalty to sites with high block rates — the permission UI becomes a tiny bell icon that most users never see. Industry average opt-in for web push is 10-17%; a poorly-timed prompt can push this below 5%.

**Why it happens:**
The natural implementation is: user clicks "Enable Alerts" → call `Notification.requestPermission()` → done. This fires the native browser dialog immediately, with no explanation of what alerts will be sent, how often, or how to turn them off.

**Consequences:**
Users who block once can never receive alerts from this origin, even if they change their mind. Chrome's quiet notification mode activates when the site's permission acceptance rate drops below its threshold. Safari on iOS requires the site to be installed as a home-screen PWA before push permission can even be granted — a constraint that will surprise most users if not explained first.

**Prevention:**
1. Use a double-permission flow: show a custom in-app modal first ("Get deadline reminders for your tracked scholarships — 1-2 alerts per application, turn off any time"). Only call `Notification.requestPermission()` after the user clicks "Yes, enable" in the custom modal.
2. Only surface the alerts opt-in after the user has added at least one scholarship to the tracker. At that moment the value proposition is concrete.
3. Show a clear "how to undo" explanation: "You can disable these in your browser settings at any time."
4. For iOS: detect `navigator.standalone === false` and show a specific instruction: "To receive deadline alerts on iPhone, first add this site to your Home Screen."
5. Check `Notification.permission === 'denied'` before showing the enable button and replace it with a help link instead.

**Warning signs:**
- Any code path that calls `Notification.requestPermission()` without a preceding custom confirmation step
- An "Enable Notifications" button on a page that users land on without having interacted with the tracker

**Phase:** Before the alerts feature ships, the double-permission flow must be spec'd and built into the UI design.

---

### Pitfall 3: localStorage Schema Version Drift Breaks Existing Users

**What goes wrong:**
The tracker, profile, and shortlist each evolve across phases. A user who saved data under v1 schema (e.g., `status: "researching"`) visits after a v2 schema change (e.g., status values renamed to `"Researching"` with capital letter, or a required field `added_at` is expected but missing). The `JSON.parse` returns the old shape, TypeScript types lie (they describe the new shape), and the UI crashes or shows garbage.

**Why it happens:**
The existing `useLocalStorage` hook does `JSON.parse(stored)` and casts directly to `T` with no validation (shortlist.tsx line 120, profile-storage.ts line 26). There is no version field in any stored object. As features evolve, the stored shape will diverge from the TypeScript types used in rendering.

**Consequences:**
For a solo student, losing tracker data mid-application season is severe — they may have deadline dates and document checklists stored nowhere else. A runtime crash on the tracker page is effectively a data loss event from the user's perspective.

**Prevention:**
1. Add a `_version` field to every localStorage object from day one: `{ _version: 1, ...data }`.
2. Write a `migrateV1toV2(data)` function when schemas change, called at read time if `_version < CURRENT_VERSION`.
3. Use a Zod schema or manual guard function at parse time: if validation fails, show a recovery UI ("Your saved data is from an older version — tap to reset") rather than crashing.
4. The existing `safeData` guard pattern in `ShortlistPage` (lines 122-126) is the right instinct — extend it to every localStorage consumer.
5. Test schema migrations explicitly: write a stored JSON blob in the old shape, load the app, confirm it migrates cleanly.

**Warning signs:**
- Any `localStorage.setItem(key, JSON.stringify(data))` followed by `const x = JSON.parse(stored) as T` with no validation
- Schema changes in TypeScript types that are not accompanied by a migration function

**Phase:** Implement versioning before shipping tracker. The profile already lacks a version field — add it before v2 profile edits land.

---

### Pitfall 4: SSR / Hydration Mismatch from localStorage Reads

**What goes wrong:**
TanStack Start renders routes on the server. Server has no `window`, no `localStorage`. Any component that reads localStorage synchronously during render (e.g., to show a "You have 3 tracked scholarships" count in a navbar badge) will render differently on the server (null/empty) and on the client (populated), causing a React hydration mismatch warning or crash. This is particularly dangerous for the eligibility wizard results page and any "Recommended for You" section on the homepage that reads the stored profile.

**Why it happens:**
The existing `LocalStorageProfileAdapter` correctly returns null server-side (line 21-22 of `profile-storage.ts`). But new features may not follow the same pattern. A `useLocalStorage` hook initialized with `useState(() => JSON.parse(localStorage.getItem(key)))` (without the `typeof window === "undefined"` guard) crashes on the server entirely.

**Consequences:**
Netlify SSR deployments break with 500 errors (this already happened once per the git history: `efffd17 Fix Netlify SSR 500`). The existing hook already has the `typeof window === "undefined"` guard, but any new hook or direct `localStorage` call added without it will reintroduce the bug.

**Prevention:**
1. Never read localStorage outside of `useEffect`, `useState` initializer with window guard, or a hook that already has the guard.
2. For server-rendered pages with personalized sections ("Recommended for You"), render the generic version server-side and replace with personalized content client-side after hydration using a `useHydrated` flag.
3. Add a lint rule or code review checklist item: "Any new localStorage access must have typeof window guard."
4. Use TanStack Start's `createClientOnlyFn` for any utility that touches localStorage.

**Warning signs:**
- `localStorage.getItem` called outside of a hook that has window guard
- A route's `loader` function trying to read localStorage (loaders run on server)
- Netlify function logs showing `ReferenceError: localStorage is not defined`

**Phase:** Enforce before any new localStorage-dependent feature is built.

---

### Pitfall 5: Convex Function Calls from New Features Blowing Free Tier Budget

**What goes wrong:**
The current architecture uses static JSON as primary read path and falls back to Convex only when static data is unavailable. New features (tracker notes sync, alert subscription persistence, recommendation engine) may be tempted to use Convex reactivity for real-time updates. Each `useQuery` subscription on a public page is an active Convex connection. The free tier has 1M function calls/month. With 5,700 scholarships, even light usage can spike quickly if new features use Convex reads for data that could be client-side.

**Why it happens:**
Convex's developer experience encourages `useQuery` for everything. The reactive paradigm makes it easy to accidentally subscribe to live updates where a one-time static read would suffice. The previous free-tier breach (2026-03-25) happened before v2 features were added.

**Consequences:**
Another Convex free tier breach during exam season (high user activity) brings down the platform for all users. Upgrading to paid Convex tier adds ongoing operating cost.

**Prevention:**
1. All tracker, profile, and alert data lives in localStorage only — zero Convex reads/writes for user-specific state in v2.
2. The recommendation engine runs client-side against the static JSON, using the profile from localStorage. No Convex query.
3. The value calculator runs client-side against static JSON funding fields.
4. Browser push notifications use a static VAPID key and store subscriptions in localStorage — they do not require a Convex subscription record for v2.
5. Before adding any new `useQuery` call, ask: "Can this be computed client-side from the static JSON?"
6. The existing pattern (skip Convex query when staticData is available) must be extended to all new features.

**Warning signs:**
- A `useQuery` that fires on every page load for data that doesn't change per-user
- Storing tracker state in Convex without explicit decision to absorb the cost
- Any new feature that requires a Convex mutation for anonymous users

**Phase:** Enforce as a constraint before writing any new data-fetching code.

---

## Moderate Pitfalls

---

### Pitfall 6: Incomplete Acceptance Rate Data Creates False Confidence

**What goes wrong:**
The competitiveness/acceptance rate data is manually researched and will initially cover only top scholarships. If the UI shows an "Acceptance Rate: 5%" badge for Chevening but shows nothing for a less-known scholarship, users infer the unlabeled one is less competitive — which may be false. Worse, showing a blank or "N/A" acceptance rate next to a percentage is inconsistent and looks unfinished.

**Why it happens:**
Displaying a field when present and hiding it when absent (the simplest implementation) creates implicit meaning: absence reads as "no data" which users conflate with "not competitive."

**Prevention:**
1. Only show acceptance rate UI elements when the data is present. No empty placeholders, no "N/A" badges.
2. When showing competitiveness classification (highly competitive / moderate / accessible), make it explicit this is based on available data and not all scholarships are classified yet.
3. Separate the "Acceptance Rate" data field from the "Competitiveness Tier" classification. The tier can be set manually even without exact numbers.
4. On the tracker, do not show an "estimated odds" feature until enough scholarships have data to make comparisons meaningful.

**Warning signs:**
- A component that renders `{scholarship.acceptance_rate ?? "N/A"}` without additional context text
- Acceptance rate shown for <20% of scholarships in the directory

**Phase:** Address in the acceptance rate data phase. Design the display pattern before the data collection starts.

---

### Pitfall 7: Drag-and-Drop on Mobile is Broken by Default

**What goes wrong:**
The existing shortlist uses native HTML5 drag-and-drop (`draggable`, `onDragStart`, `onDrop`). This does not work on touch screens. If the application tracker uses a Kanban board, the same pattern will fail on mobile — silently. Students accessing from phones (a likely majority of the target demographic — international students often primary-device on mobile) will not be able to reorder stages.

**Why it happens:**
HTML5 drag-and-drop is mouse/pointer event based. Touch screens do not fire `dragstart`/`dragover`/`drop` events.

**Prevention:**
1. Use `dnd-kit` for any new drag-and-drop UI. It supports Pointer, Touch, and Keyboard sensors natively.
2. For the Kanban tracker specifically: also provide tap-to-move alternative (a dropdown or stage selector on each card) as an accessible fallback.
3. If refactoring the shortlist drag-and-drop is out of scope, at minimum add the tap-to-move tier buttons that already exist in `UniCard` — those work on mobile.

**Warning signs:**
- Any `draggable` attribute or `onDragStart`/`onDrop` handlers on elements intended for mobile use
- No touch event testing before shipping any drag interface

**Phase:** Before the Kanban tracker is built.

---

### Pitfall 8: Push Subscription Lost When User Clears Browser Data

**What goes wrong:**
A push subscription (the `PushSubscription` object) is tied to the service worker and browser storage. When a user clears site data, the subscription endpoint becomes invalid. The stored subscription in localStorage is also cleared. The user believes they have alerts enabled (they remember enabling them) but receives nothing. There is no server-side subscription record to cross-check against.

**Why it happens:**
Without a backend subscription store, there is no way to detect stale subscriptions. The service worker's push subscription is invalidated server-side (the push service endpoint expires) but localStorage still shows `alerts_enabled: true`.

**Prevention:**
1. On each page load (or at most once per session), call `registration.pushManager.getSubscription()` and verify it matches the stored subscription. If null (subscription was cleared), show a "Re-enable alerts" nudge.
2. Store the subscription endpoint alongside the `alerts_enabled` flag. If the endpoint no longer matches, treat it as disabled.
3. Make "alerts currently enabled" state reflect the live push subscription status, not just the stored flag.

**Warning signs:**
- `alerts_enabled: true` in localStorage with no corresponding subscription endpoint check on load
- Alert feature with no subscription-validity verification step

**Phase:** Build subscription validation into the alerts feature from day one.

---

### Pitfall 9: Value Calculator Shows Misleading Totals for Incomplete Funding Data

**What goes wrong:**
The scholarship value calculator sums tuition + stipend + benefits over duration. Many scholarships in the dataset have `null` or missing `stipend_amount`, `duration_months`, or `tuition_coverage`. If these are treated as zero, the calculator shows artificially low totals. If they are excluded from the calculation and no warning is shown, the total looks complete but is actually partial.

**Why it happens:**
5,700 scholarships with varying data completeness (3,200 have per-subject details, ~2,500 do not) means any aggregate calculation has significant missing data. Summing only present values and presenting the result as "total scholarship value" is misleading.

**Prevention:**
1. Show a "calculated from available data" disclaimer when any component of the total is missing.
2. Display which components were included in the calculation (e.g., "Tuition: included, Stipend: not available, Living costs: estimated").
3. Never show a value calculator result without indicating what percentage of the scholarship's components are represented.
4. For scholarships with no structured funding data, show a "View funding details" link rather than a $0 or blank total.

**Warning signs:**
- `(scholarship.tuition_coverage ?? 0) + (scholarship.stipend_amount ?? 0)` without a "data incomplete" flag
- Value calculator shown on a scholarship detail page with all-null funding fields

**Phase:** Address in the value calculator feature design before implementation.

---

### Pitfall 10: Multi-Step Wizard State Lost on Browser Back

**What goes wrong:**
The guided wizard flow (university rank → country → budget → results) accumulates selections across steps. If a user presses the browser Back button mid-flow, the route unmounts and the wizard state is lost. They land on the previous route and the wizard resets on next entry.

**Why it happens:**
Wizard state typically lives in `useState`, which does not survive route changes. TanStack Router's URL-based navigation (the existing `url-params.ts` pattern in the eligibility wizard) survives Back, but requires encoding all selections in the URL — which works for the eligibility wizard but needs to be intentionally applied to the new guided flow.

**Prevention:**
1. Store wizard step state in URL search params (as the eligibility wizard already does via `url-params.ts`). This makes the Back button restore the previous step.
2. Alternatively, store the in-progress wizard state in `sessionStorage` (not localStorage) so it survives tab refreshes but clears when the browser session ends.
3. Never rely on React state alone for multi-step flows that span navigations.

**Warning signs:**
- Wizard state stored only in `useState` with no URL or storage persistence
- No test for "press Back button mid-wizard, return, state is preserved"

**Phase:** Before the guided wizard flow is built.

---

### Pitfall 11: Cross-Tab State Desync for Tracker and Shortlist

**What goes wrong:**
A user has ScholarHub open in two tabs. They add a scholarship to the tracker in Tab A. Tab B does not update. They also use Tab B to add the same scholarship — no duplicate check fires because Tab B's state is stale. They end up with two tracker entries for the same scholarship, or worse, a tab's stale write overwrites the tab that had the more recent data.

**Why it happens:**
The `useLocalStorage` hook reads from localStorage on mount and writes on state change, but does not listen to the `storage` event that browsers fire when *another* tab modifies the same key. The current hook (27 lines) has no `storage` event listener.

**Prevention:**
1. Add a `window.addEventListener('storage', handler)` in the `useLocalStorage` hook's `useEffect` to re-read when another tab writes. The `storage` event does not fire in the writing tab — only in other tabs — so this is safe and efficient.
2. Use `useSyncExternalStore` for localStorage state to get React-native cross-tab reactivity.
3. For the tracker specifically, implement deduplication by slug at write time rather than relying on stale read state to prevent duplicates.

**Warning signs:**
- `useLocalStorage` hook has no `storage` event listener
- Tracker add logic that checks "does this slug already exist in state" without first re-reading from localStorage

**Phase:** Address in the tracker feature before shipping.

---

## Minor Pitfalls

---

### Pitfall 12: Notification Fatigue from Deadline Reminders

**What goes wrong:**
If deadline reminders fire too aggressively (e.g., 30-day, 14-day, 7-day, 1-day for every tracked scholarship), a student tracking 10 scholarships receives 40 notifications in a month. Studies show 64% of users delete or disable notifications from apps sending more than 5 per week. The user disables push, losing all alerts — worse outcome than never enabling them.

**Prevention:**
1. Default alert schedule: one reminder at 14 days before deadline only. Let users opt into more (7-day, 1-day) per scholarship.
2. Group multiple deadline reminders into a single notification when several deadlines fall in the same week: "3 scholarships close within 7 days."
3. Add a global "alert frequency" preference to the alerts settings.

**Phase:** Alert scheduling design phase.

---

### Pitfall 13: Currency Formatting in Value Calculator Breaks for Non-USD Scholarships

**What goes wrong:**
UK scholarships are in GBP, Australian scholarships in AUD, German scholarships may show amounts in EUR. If the value calculator uses `toLocaleString('en-US', { style: 'currency', currency: 'USD' })` for all values, it shows the wrong symbol for non-USD amounts. Using JavaScript floating-point arithmetic for currency totals also introduces rounding drift over long durations (e.g., monthly stipend * 48 months).

**Prevention:**
1. Carry the currency code alongside each amount field in the scholarship data. Never sum amounts across currencies.
2. When scholarships specify amounts in different currencies, show per-currency totals separately rather than attempting conversion (which would require live exchange rates).
3. Use `Intl.NumberFormat` with the scholarship's own currency code for display.
4. For duration calculations, use integer arithmetic (monthly amount in pence/cents * months, then divide for display).

**Phase:** Value calculator implementation phase.

---

### Pitfall 14: Neo-Brutalism Design Token Inconsistency in New Components

**What goes wrong:**
New feature components (Kanban board stages, alert toggle, calculator output) built by copying external component examples (shadcn/ui defaults, dnd-kit examples) bring in `rounded-lg`, `border`, `shadow-sm` — contradicting the zero-radius, heavy-border, 6px-shadow design system. The platform starts looking visually inconsistent.

**Prevention:**
1. Any new component must use the existing token set: `rounded-base` (0px), `border-2 border-border`, `shadow-shadow`, `font-heading` for labels.
2. Keep a component checklist: no `rounded-*` (except `rounded-base`), no arbitrary shadow values, no Tailwind `ring-*` without matching neo-brutalism offset.
3. Copy the pattern of existing components (Card, Badge, Button in the codebase) as the reference, not external libraries.

**Phase:** Enforce as a design review gate on all new UI components.

---

### Pitfall 15: Service Worker Conflicts Between Push and Potential Future Caching

**What goes wrong:**
Registering a service worker at scope `/` for push notifications will intercept all network requests. If a caching strategy (e.g., Cache API for offline support) is later added to the same service worker, or if a different service worker is registered at a different scope, the behaviors can conflict. The push service worker at `/` has higher specificity than any child-scope worker.

**Prevention:**
1. Register the push service worker at `/sw.js` with `scope: '/'` but keep its `fetch` event handler empty (no caching logic) in v2.
2. Document explicitly that the service worker is push-only and must not add cache strategies without a cache invalidation plan.
3. Use a single service worker file — do not register multiple workers at the same origin.

**Phase:** Push notifications implementation phase.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Application tracker | localStorage schema drift (P3), cross-tab desync (P11), mobile drag-drop (P7) | Version field, storage event listener, dnd-kit |
| Push alerts | Premature permission prompt (P2), subscription loss on clear (P8), notification fatigue (P12) | Double-permission flow, subscription validation, default 14-day only |
| Value calculator | Incomplete data false totals (P9), currency formatting (P13) | "Calculated from available data" label, per-currency display |
| Guided wizard flow | State lost on Back navigation (P10), SSR hydration (P4) | URL params for wizard state, window guard on all localStorage reads |
| Recommendation engine | Convex budget (P5), hydration mismatch (P4) | Client-side only, static JSON, hydration flag |
| Acceptance rate data | Confidence misleading absent data (P6) | Only show when present, no N/A placeholders |
| All new features | SSR hydration (P4), localStorage quota (P1), Convex budget (P5) | Window guard audit, storage estimate utility, no-Convex rule for user state |

---

## Sources

- [MDN: Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) — MEDIUM confidence (official spec)
- [TrackJS: QuotaExceededError handling](https://trackjs.com/javascript-errors/failed-to-execute-setitem-on-storage/) — MEDIUM confidence
- [OneSignal: Web Push Opt-In Rates](https://onesignal.com/blog/boost-your-web-push-opt-in-rates/) — MEDIUM confidence (vendor data)
- [Chrome Developers: Web Push Rate Limits](https://developer.chrome.com/blog/web-push-rate-limits) — HIGH confidence (official)
- [TanStack Start: Hydration Errors](https://tanstack.com/start/latest/docs/framework/react/guide/hydration-errors) — HIGH confidence (official)
- [TanStack Start: Selective SSR](https://tanstack.com/start/latest/docs/framework/react/guide/selective-ssr) — HIGH confidence (official)
- [Convex: Free tier limits](https://docs.convex.dev/production/state/limits) — HIGH confidence (official)
- [iOS PWA Push Notifications 2025](https://pushpad.xyz/blog/ios-special-requirements-for-web-push-notifications) — MEDIUM confidence (vendor docs)
- [MagicBell: PWA iOS Limitations 2026](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide) — MEDIUM confidence
- [dnd-kit: Touch sensor support](https://dev.to/arshadayvid/how-to-implement-drag-and-drop-in-react-using-dnd-kit-204h) — MEDIUM confidence
- [Cross-Tab Sync with storage event](https://medium.com/@vinaykumarbr07/cross-tab-state-synchronization-in-react-using-the-browser-storage-event-14b6f1a97ea6) — MEDIUM confidence
- [Smashing Magazine: Graceful Degradation 2024](https://www.smashingmagazine.com/2024/12/importance-graceful-degradation-accessible-interface-design/) — MEDIUM confidence
