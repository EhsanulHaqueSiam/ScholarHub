# Phase 02: Application Tracker + Document Matrix - Research

**Researched:** 2026-04-03
**Domain:** Kanban drag-and-drop board, localStorage-persisted tracker state, document checklist system, CSV export
**Confidence:** HIGH

## Summary

Phase 02 builds a Kanban-style application tracker with five stages (Researching, Preparing, Submitted, Interview, Result), per-scholarship document checklists, a cross-scholarship document matrix, and CSV export. The implementation rests on three pillars already proven in the codebase: (1) the typed `StorageAdapter<T>` pattern from Phase 01 for localStorage persistence with versioned migration, (2) the `useLocalStorage` hook with error surfacing and cross-tab sync, and (3) the static JSON read path for scholarship data. No new architectural patterns are needed -- this phase extends the established infrastructure with dnd-kit for drag-and-drop, Sonner for toast feedback, and Zustand for coordinated state management.

The codebase inspection reveals all integration surfaces are well-defined: the `StickyBar` component accepts props and can be extended with a tracker icon-button, the `HeroSection` has a clear CTA placement after the "Apply Now" button, the `ScholarshipCard` has a `CardFooter` where a "Track This" action fits, and the `Navbar` has explicit NavLink slots in both desktop and mobile layouts. The Convex schema needs a `document_requirements` field added to the `scholarships` table for DOC-04 (admin-editable per-scholarship document checklists), but this is a small additive change -- no existing field modifications.

**Primary recommendation:** Build the tracker storage adapter and Zustand store first (types + persistence), then layer the Kanban UI on top. Install dnd-kit + Sonner + Zustand as the three new dependencies. Use `useApplicationTracker` as the single hook interface for all tracker state access, matching the `useStudentProfile` pattern.

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
| TRACK-01 | User can add any scholarship to tracker from detail page or card | `TrackThisButton` component integrates into `HeroSection`, `StickyBar`, and `ScholarshipCard` via `useTrackerStore` |
| TRACK-02 | Kanban board with 5 stages: Researching, Preparing, Submitted, Interview, Result | `TrackerKanban` component using dnd-kit with `TrackerColumn` x 5, stage config from UI-SPEC |
| TRACK-03 | Drag-and-drop between stages (touch + keyboard) | dnd-kit `PointerSensor` + `KeyboardSensor` + `TouchSensor` with `MobileStageSelector` tap-to-move fallback |
| TRACK-04 | Each card shows deadline, document status, notes | `TrackerCard` component reading from `TrackerEntry` + static data join for deadline |
| TRACK-05 | Free-text notes per tracked scholarship | `NotesEditor` with 500-char limit, debounced auto-save via store |
| TRACK-06 | Tracker data persists in localStorage with versioned schema | `LocalStorageTrackerAdapter` implementing `StorageAdapter<ApplicationTracker>` with `_version: 1` |
| TRACK-07 | Export tracker data as CSV | `ExportCSVButton` using `Blob` + `URL.createObjectURL` -- no library needed |
| DOC-01 | Scholarship detail page shows standardized document checklist | `DocumentChecklist` component reading from static `DOCUMENT_TYPES` taxonomy + optional Convex override |
| DOC-02 | User can check off documents per scholarship (localStorage) | Checkbox state stored in `TrackerEntry.documentChecks` record, persisted via tracker store |
| DOC-03 | Cross-scholarship document overview with summary counts | `DocumentMatrix` grid component aggregating `documentChecks` across all tracker entries |
| DOC-04 | Document checklist data stored in Convex (admin-editable) with defaults | Add `document_requirements` field to Convex `scholarships` table; static JSON export includes it; client reads from static data with fallback to standard taxonomy |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@dnd-kit/core` | 6.3.1 | Drag-and-drop engine | Headless, actively maintained, Touch/Pointer/Keyboard sensors, no DOM opinions (works with neo-brutalism) |
| `@dnd-kit/sortable` | 10.0.0 | Sortable presets for column reordering | Provides `SortableContext` + `useSortable` for card ordering within/across columns |
| `@dnd-kit/utilities` | 3.2.2 | CSS transform/transition helpers | `CSS.Transform.toString()` for drag overlay positioning |
| `sonner` | 2.0.7 | Toast notifications | Zero deps, React 19 confirmed, Tailwind-compatible via `className` prop, 30M+ weekly downloads |
| `zustand` | 5.0.12 | Coordinated tracker state store | `persist` middleware handles localStorage serialization + SSR safety (`skipHydration`); Clerk migration swap point |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `date-fns` | 4.1.0 | Date formatting for deadlines and CSV timestamps | Use `format()` and `formatDistanceToNow()` for deadline display; already listed as future dependency in STACK.md |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| dnd-kit | `@hello-pangea/dnd` | Community fork of abandoned react-beautiful-dnd; less actively maintained, opinionated DOM structure |
| dnd-kit | `@atlaskit/pragmatic-drag-and-drop` | Atlassian's new library; heavier dependency tree, less community documentation |
| Zustand | React Context + `useLocalStorage` | No cross-tab sync, no built-in persistence middleware, no migration utilities; Zustand provides all three |
| Zustand | Jotai | `atomWithStorage` less ergonomic for the Clerk adapter swap path than Zustand `persist` custom storage |
| Hand-rolled CSV | `papaparse` | Unnecessary dependency for simple column export; `Blob` + manual CSV string is sufficient for 15 rows x 6 columns |

**Installation:**
```bash
cd web && npm install @dnd-kit/core@6.3.1 @dnd-kit/sortable@10.0.0 @dnd-kit/utilities@3.2.2 sonner@2.0.7 zustand@5.0.12 date-fns@4.1.0
```

**Version verification:** All versions confirmed against npm registry on 2026-04-03. Peer deps for all packages are compatible with React 19.2.

## Architecture Patterns

### Recommended Project Structure

```
src/
  lib/
    tracker/
      types.ts                  # TrackerStage, TrackerEntry, ApplicationTracker, DocumentCheck types
      tracker-store.ts          # Zustand store with persist middleware (primary state interface)
      tracker-engine.ts         # Pure functions: addEntry, removeEntry, moveToStage, updateNotes, toggleDocument
      tracker-csv.ts            # CSV export logic (pure function: entries -> CSV string)
      document-types.ts         # DOCUMENT_TYPES constant array + display config
  hooks/
    useTrackerStore.ts          # Re-export of Zustand store hook with SSR safety wrapper
  components/
    tracker/
      TrackerKanban.tsx          # Full Kanban board: DndContext + columns
      TrackerColumn.tsx          # Single droppable column: header + card list
      TrackerCard.tsx            # Draggable card: title, deadline, doc status, notes preview
      TrackerCardExpanded.tsx    # Expanded view: full notes, document checklist, stage selector
      MobileStageSelector.tsx   # Tap-to-move pill row for mobile
      TrackThisButton.tsx        # CTA for detail pages, cards, sticky bar
      DocumentChecklist.tsx      # Per-scholarship checkbox list
      DocumentMatrix.tsx         # Cross-scholarship summary grid
      TrackerEmptyState.tsx      # Empty state with CTA to browse scholarships
      ExportCSVButton.tsx        # CSV download trigger
      NotesEditor.tsx            # Textarea with char count and debounced save
      StageBadge.tsx             # Compact stage indicator badge
  routes/
    tracker.tsx                  # /tracker route (new)
```

### Pattern 1: Zustand Store with Persist Middleware

**What:** Single Zustand store manages all tracker state, persisted to localStorage via `persist` middleware with versioned migration.
**When to use:** For all tracker reads and writes. Components never call `localStorage` directly.
**Why:** Zustand `persist` provides: (a) automatic serialization/deserialization, (b) `skipHydration` for SSR safety, (c) built-in `version` + `migrate` function for schema evolution, (d) a `storage` interface that maps 1:1 to a future `ConvexStorageAdapter` for the Clerk migration.

```typescript
// lib/tracker/tracker-store.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ApplicationTracker, TrackerEntry, TrackerStage } from "./types";

interface TrackerState {
  entries: TrackerEntry[];
  // Actions
  addEntry: (slug: string, title: string) => void;
  removeEntry: (slug: string) => void;
  moveToStage: (slug: string, stage: TrackerStage) => void;
  updateNotes: (slug: string, notes: string) => void;
  toggleDocument: (slug: string, docType: string, checked: boolean) => void;
  isTracked: (slug: string) => boolean;
  getEntry: (slug: string) => TrackerEntry | undefined;
  clearAll: () => void;
}

export const useTrackerStore = create<TrackerState>()(
  persist(
    (set, get) => ({
      entries: [],
      addEntry: (slug, title) =>
        set((state) => ({
          entries: [
            ...state.entries,
            {
              scholarshipSlug: slug,
              scholarshipTitle: title,
              stage: "researching",
              addedAt: Date.now(),
              updatedAt: Date.now(),
              documentChecks: {},
            },
          ],
        })),
      removeEntry: (slug) =>
        set((state) => ({
          entries: state.entries.filter((e) => e.scholarshipSlug !== slug),
        })),
      moveToStage: (slug, stage) =>
        set((state) => ({
          entries: state.entries.map((e) =>
            e.scholarshipSlug === slug
              ? { ...e, stage, updatedAt: Date.now() }
              : e
          ),
        })),
      updateNotes: (slug, notes) =>
        set((state) => ({
          entries: state.entries.map((e) =>
            e.scholarshipSlug === slug
              ? { ...e, notes, updatedAt: Date.now() }
              : e
          ),
        })),
      toggleDocument: (slug, docType, checked) =>
        set((state) => ({
          entries: state.entries.map((e) =>
            e.scholarshipSlug === slug
              ? {
                  ...e,
                  documentChecks: { ...e.documentChecks, [docType]: checked },
                  updatedAt: Date.now(),
                }
              : e
          ),
        })),
      isTracked: (slug) =>
        get().entries.some((e) => e.scholarshipSlug === slug),
      getEntry: (slug) =>
        get().entries.find((e) => e.scholarshipSlug === slug),
      clearAll: () => set({ entries: [] }),
    }),
    {
      name: "scholarhub_tracker",
      version: 1,
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        }
      ),
      skipHydration: true, // SSR safety -- hydrate in useEffect
      migrate: (persisted, version) => {
        // Future migrations go here
        return persisted as TrackerState;
      },
    }
  )
);
```

### Pattern 2: SSR-Safe Store Hydration

**What:** Zustand stores with `skipHydration: true` are hydrated client-side via `useEffect`, preventing SSR hydration mismatches.
**When to use:** Every component that reads tracker state.
**Why:** TanStack Start renders server-side; `localStorage` does not exist there. The `useStudentProfile` hook already uses this exact pattern (`hydrated` flag + `useEffect`).

```typescript
// hooks/useTrackerStore.ts
import { useEffect, useState } from "react";
import { useTrackerStore as useStore } from "@/lib/tracker/tracker-store";

export function useTrackerHydration() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    useStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  return hydrated;
}

// Re-export the store hook for convenience
export { useStore as useTrackerStore };
```

### Pattern 3: dnd-kit Kanban Column Architecture

**What:** `DndContext` wraps the entire board; each column is a `useDroppable`; each card is a `useDraggable`. A `DragOverlay` renders the dragged card's ghost.
**When to use:** The `/tracker` route desktop layout.
**Why:** dnd-kit's sensor system (PointerSensor + KeyboardSensor + TouchSensor) handles mouse, keyboard, and touch inputs out of the box. The `onDragEnd` handler maps `over.id` (column ID) to a `moveToStage` call.

```typescript
// Simplified Kanban DndContext pattern
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";

const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  useSensor(KeyboardSensor),
  useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
);

function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;
  if (!over) return;
  const slug = active.id as string;
  const newStage = over.id as TrackerStage;
  moveToStage(slug, newStage);
  toast.success(`Moved to ${STAGE_CONFIG[newStage].label}`);
}
```

### Pattern 4: StorageAdapter Compatibility

**What:** The Zustand store's `persist` storage interface is compatible with the existing `StorageAdapter<T>` pattern from Phase 01. The Clerk migration path is: replace `createJSONStorage(() => localStorage)` with a custom Convex-backed storage adapter.
**When to use:** When designing the persistence layer.
**Why:** Maintains the Clerk migration seam already coded into `ProfileStorage`. The tracker store must follow the same upgrade path.

### Anti-Patterns to Avoid

- **Direct localStorage access in components:** All state flows through the Zustand store. Components call `useTrackerStore()`, never `localStorage.getItem("scholarhub_tracker")`.
- **Calling Convex for tracker reads:** Tracker state is 100% client-side localStorage. Convex is only touched for the `document_requirements` field in the scholarships table (DOC-04), which is exported to static JSON and read from there.
- **Storing full scholarship objects in tracker:** Only store `scholarshipSlug` + denormalized `scholarshipTitle`. The slug is joined against static data at render time for deadline, funding, and other fields. This keeps localStorage payload small (~2KB for 15 entries vs ~50KB for full objects).
- **Using dnd-kit's alpha `@dnd-kit/react` (0.3.2):** Not production-ready. Use the stable `@dnd-kit/core@6.3.1` + `@dnd-kit/sortable@10.0.0`.
- **Long-press for mobile drag:** Conflicts with scroll. Use tap-to-expand + `MobileStageSelector` pill row instead, as specified in the UI-SPEC.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-and-drop with touch + keyboard accessibility | Custom pointer event handlers | dnd-kit sensors + `DragOverlay` | Edge cases: scroll interference, keyboard navigation, screen reader announcements, touch delay calibration |
| Toast notifications with auto-dismiss | Custom portal + timeout manager | Sonner `toast()` | Stacking, duplicate prevention, swipe-to-dismiss, reduced motion, promise toasts |
| Persistent state with SSR safety + migration | Custom `useLocalStorage` + manual `JSON.parse` | Zustand `persist` middleware | Handles `skipHydration`, `version` + `migrate()`, custom `storage` adapter for Clerk swap |
| CSV generation | `papaparse` or `csv-stringify` | Hand-rolled `Blob` + `URL.createObjectURL` | Only 15 rows x 6 columns; a library is overkill. Escape commas/quotes in field values manually. |
| Date formatting | Manual `Date` manipulation | `date-fns` `format()` + `formatDistanceToNow()` | Locale-safe, tree-shakeable, already listed as project dependency for future phases |

**Key insight:** dnd-kit is the critical "don't hand-roll" item. Touch + keyboard + screen reader accessible drag-and-drop has dozens of edge cases (scroll container detection, activation constraints, collision detection algorithms, overlay positioning). Building this from scratch would take longer than the entire phase.

## Common Pitfalls

### Pitfall 1: SSR Hydration Mismatch from Store Reads

**What goes wrong:** Components read tracker state synchronously during SSR, producing different HTML than the client hydration pass. TanStack Start renders on Netlify's server -- `localStorage` does not exist there.
**Why it happens:** Default Zustand `persist` rehydrates synchronously from localStorage. Without `skipHydration`, the server renders with empty state while the client renders with stored state.
**How to avoid:** Set `skipHydration: true` on the store. Call `useStore.persist.rehydrate()` inside a `useEffect` on mount. Show skeleton/loading state until `hydrated === true`. This is the exact pattern already used in `useStudentProfile`.
**Warning signs:** Netlify deploy logs show "Hydration failed because the initial UI does not match what was rendered on the server."

### Pitfall 2: Drag-and-Drop Conflicts with Mobile Scroll

**What goes wrong:** Touch drag activates when the user is trying to scroll the page, creating a frustrating mobile experience.
**Why it happens:** `PointerSensor` with no activation constraint fires on any pointer down. `TouchSensor` with no delay fires immediately.
**How to avoid:** Configure `TouchSensor` with `activationConstraint: { delay: 250, tolerance: 5 }`. On mobile (< 1024px), do NOT render drag handles at all -- use the tap-to-expand + `MobileStageSelector` approach from the UI-SPEC instead.
**Warning signs:** Users on touch devices accidentally drag cards when trying to scroll.

### Pitfall 3: localStorage Quota Exhaustion

**What goes wrong:** Writing tracker data fails silently, and the user loses their application tracking state.
**Why it happens:** The Zustand `persist` middleware does not surface `QuotaExceededError` by default. If other storage consumers (shortlist, profile, nationality) have used most of the ~5MB quota, tracker writes fail silently.
**How to avoid:** Wrap the Zustand store's `storage` option with error detection. Use the existing `StorageErrorBanner` component from Phase 01 to surface quota errors. Cap notes at 500 characters (UI-SPEC already specifies this). Store only slugs + minimal metadata -- never full scholarship objects.
**Warning signs:** `StorageErrorBanner` appears; user reports tracker data not persisting.

### Pitfall 4: Cross-Tab State Desync

**What goes wrong:** User opens `/tracker` in two tabs. Adds a scholarship in Tab A. Tab B still shows old state.
**Why it happens:** Zustand `persist` does not listen for `storage` events by default.
**How to avoid:** Use Zustand's `onRehydrateStorage` callback to listen for `storage` events, or add a manual `window.addEventListener("storage", ...)` listener in the store config. The existing `useLocalStorage` hook already handles this -- the Zustand store must match that behavior.
**Warning signs:** User sees stale data in one tab after making changes in another.

### Pitfall 5: Stale Denormalized Title

**What goes wrong:** A scholarship title changes in the Convex DB (admin edit), but the tracker still shows the old denormalized title.
**Why it happens:** `scholarshipTitle` is snapshotted at add-time for offline display.
**How to avoid:** On render, attempt to resolve the slug against static data. If the static data title differs from the stored title, update the store entry lazily. Fall back to the stored title if static data is not yet loaded or the scholarship was removed.
**Warning signs:** Tracker shows a different title than the detail page for the same scholarship.

### Pitfall 6: Convex Schema Migration for DOC-04

**What goes wrong:** Adding `document_requirements` to the Convex scholarships table requires careful handling since there are 5,700+ existing records without this field.
**Why it happens:** Convex schema changes are applied to all documents, but existing documents won't have the new field.
**How to avoid:** Make `document_requirements` optional in the schema (`v.optional(...)`). The static JSON export script must include the field when present. Client-side code falls back to the standard `DOCUMENT_TYPES` taxonomy when `document_requirements` is absent for a scholarship.
**Warning signs:** Convex deployment fails due to schema validation errors on existing documents.

## Code Examples

### TrackerEntry Type Definition

```typescript
// lib/tracker/types.ts
import type { VersionedData } from "@/lib/storage/types";

export type TrackerStage =
  | "researching"
  | "preparing"
  | "submitted"
  | "interview"
  | "result";

export type ResultOutcome = "awarded" | "rejected" | "waitlisted";

export interface TrackerEntry {
  scholarshipSlug: string;
  scholarshipTitle: string;   // denormalized for offline display
  stage: TrackerStage;
  resultOutcome?: ResultOutcome;
  addedAt: number;            // unix ms
  updatedAt: number;
  notes?: string;             // max 500 chars
  documentChecks: Record<string, boolean>; // docType -> checked
}

export interface ApplicationTracker extends VersionedData {
  entries: TrackerEntry[];
}
```

### Document Types Taxonomy

```typescript
// lib/tracker/document-types.ts
export const DOCUMENT_TYPES = [
  "transcripts",
  "recommendation_letters",
  "statement_of_purpose",
  "cv_resume",
  "language_test_scores",
  "financial_documents",
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  transcripts: "Transcripts",
  recommendation_letters: "Recommendation Letters",
  statement_of_purpose: "Statement of Purpose",
  cv_resume: "CV / Resume",
  language_test_scores: "Language Test Scores",
  financial_documents: "Financial Documents",
};
```

### CSV Export (No Library)

```typescript
// lib/tracker/tracker-csv.ts
import { format } from "date-fns";
import type { TrackerEntry } from "./types";
import { DOCUMENT_TYPES } from "./document-types";

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function generateCSV(entries: TrackerEntry[]): string {
  const headers = ["Title", "Stage", "Deadline", "Notes", "Documents Completed", "Date Added"];
  const rows = entries.map((e) => {
    const docsCompleted = DOCUMENT_TYPES.filter((d) => e.documentChecks[d]).length;
    const docsTotal = DOCUMENT_TYPES.length;
    return [
      escapeCSV(e.scholarshipTitle),
      e.stage,
      "", // deadline populated from static data at call site
      escapeCSV(e.notes ?? ""),
      `${docsCompleted}/${docsTotal}`,
      format(new Date(e.addedAt), "yyyy-MM-dd"),
    ].join(",");
  });
  return [headers.join(","), ...rows].join("\n");
}

export function downloadCSV(csvContent: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `scholarhub-applications-${format(new Date(), "yyyy-MM-dd")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
```

### Sonner Toaster Setup

```typescript
// In __root.tsx, add Toaster inside the <body> alongside existing providers:
import { Toaster } from "sonner";

// Inside RootComponent body:
<Toaster
  position="bottom-right"
  toastOptions={{
    className: "border-2 border-border shadow-shadow bg-secondary-background text-foreground font-base",
    duration: 3000,
  }}
/>
```

### Convex Schema Addition for DOC-04

```typescript
// In convex/schema.ts, add to the scholarships table:
document_requirements: v.optional(
  v.array(v.string()) // e.g., ["transcripts", "recommendation_letters", "statement_of_purpose"]
),
```

## Integration Points (Existing Codebase)

### Files That Need Modification

| File | Change | Reason |
|------|--------|--------|
| `src/routes/__root.tsx` | Add `<Toaster />` from Sonner | Global toast provider for tracker feedback |
| `src/components/layout/Navbar.tsx` | Add `/tracker` NavLink (desktop + mobile) | Navigation to tracker page |
| `src/components/detail/HeroSection.tsx` | Add `TrackThisButton` after "Apply Now" | TRACK-01: add from detail page |
| `src/components/detail/StickyBar.tsx` | Add tracker icon-button to actions row | TRACK-01: sticky bar integration |
| `src/components/directory/ScholarshipCard.tsx` | Add `TrackThisButton` in `CardFooter` | TRACK-01: add from card |
| `src/routes/scholarships/$slug.tsx` | Pass tracker state to HeroSection + StickyBar | Wire up tracking state |
| `convex/schema.ts` | Add `document_requirements` optional field | DOC-04: admin-editable doc checklists |
| Static JSON export script | Include `document_requirements` in export | DOC-04: client reads from static data |

### Files That Are Read-Only References

| File | Used For |
|------|----------|
| `src/lib/storage/types.ts` | `StorageAdapter<T>`, `VersionedData`, `MigrationConfig` types |
| `src/lib/storage/migrate.ts` | `migrateData()` function pattern (reference for Zustand `migrate`) |
| `src/lib/storage/errors.ts` | `classifyStorageError()` for quota error detection |
| `src/hooks/useStudentProfile.ts` | SSR-safe hydration pattern to replicate |
| `src/lib/eligibility/profile-storage.ts` | `StorageAdapter` implementation pattern |
| `src/hooks/useStaticData.ts` | Static data loading hook (for slug-to-deadline resolution) |
| `src/lib/scholarship-summary.ts` | `ScholarshipSummary` interface (deadline field location) |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `react-beautiful-dnd` | `@dnd-kit/core` 6.x | 2022 (rbd abandoned) | dnd-kit is the standard for new React DnD projects |
| Direct `localStorage` in components | Zustand `persist` middleware | Zustand 4.x+ (2023) | Centralized state, SSR safety, migration built-in |
| Custom toast portals | Sonner 2.x | 2024 | Zero-dep, Tailwind-compatible, promise toasts |
| `@dnd-kit/react` alpha | `@dnd-kit/core` stable | `@dnd-kit/react` 0.3.2 still alpha (2025) | Use stable 6.3.1 core, not alpha |

**Deprecated/outdated:**
- `react-beautiful-dnd`: Abandoned by Atlassian in 2022. Do not use.
- `hello-pangea/dnd`: Community fork of the above. Use dnd-kit instead.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1 |
| Config file | `web/vitest.config.ts` |
| Quick run command | `cd web && npx vitest run src/lib/tracker/ --reporter=verbose` |
| Full suite command | `cd web && npx vitest run` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TRACK-01 | addEntry adds scholarship to tracker | unit | `npx vitest run src/lib/tracker/tracker-store.test.ts -t "addEntry"` | Wave 0 |
| TRACK-02 | Entries grouped by stage | unit | `npx vitest run src/lib/tracker/tracker-engine.test.ts -t "groupByStage"` | Wave 0 |
| TRACK-03 | moveToStage transitions correctly | unit | `npx vitest run src/lib/tracker/tracker-store.test.ts -t "moveToStage"` | Wave 0 |
| TRACK-04 | TrackerEntry contains deadline + doc status | unit | `npx vitest run src/lib/tracker/tracker-engine.test.ts -t "entry fields"` | Wave 0 |
| TRACK-05 | updateNotes persists within 500 char limit | unit | `npx vitest run src/lib/tracker/tracker-store.test.ts -t "updateNotes"` | Wave 0 |
| TRACK-06 | Store persists and migrates versioned data | unit | `npx vitest run src/lib/tracker/tracker-store.test.ts -t "persist"` | Wave 0 |
| TRACK-07 | CSV export generates valid output | unit | `npx vitest run src/lib/tracker/tracker-csv.test.ts` | Wave 0 |
| DOC-01 | DOCUMENT_TYPES constant contains 6 types | unit | `npx vitest run src/lib/tracker/document-types.test.ts` | Wave 0 |
| DOC-02 | toggleDocument sets check state | unit | `npx vitest run src/lib/tracker/tracker-store.test.ts -t "toggleDocument"` | Wave 0 |
| DOC-03 | Document matrix aggregation across entries | unit | `npx vitest run src/lib/tracker/tracker-engine.test.ts -t "matrix"` | Wave 0 |
| DOC-04 | Convex schema accepts document_requirements | unit | `npx vitest run src/tests/schema.test.ts` | Existing (extend) |

### Sampling Rate

- **Per task commit:** `cd web && npx vitest run src/lib/tracker/ --reporter=verbose`
- **Per wave merge:** `cd web && npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/lib/tracker/tracker-store.test.ts` -- covers TRACK-01, 03, 05, 06, DOC-02
- [ ] `src/lib/tracker/tracker-engine.test.ts` -- covers TRACK-02, 04, DOC-03
- [ ] `src/lib/tracker/tracker-csv.test.ts` -- covers TRACK-07
- [ ] `src/lib/tracker/document-types.test.ts` -- covers DOC-01

## Project Constraints (from CLAUDE.md)

- **Git commits:** Do NOT add `Co-Authored-By: Claude` line to commit messages. Keep commit messages clean.
- **GSD workflow:** All changes routed through `/gsd:*` commands. No direct repo edits outside GSD workflow.
- **No auth:** All features must work with localStorage. Design data models for future Clerk migration.
- **Convex budget:** Static JSON remains primary read path. Minimize Convex function calls. New features prefer client-side computation.
- **Neo-brutalism design:** 0px border-radius, 2px borders, 6px offset shadows. Use existing tokens and Card/Badge/Button primitives.
- **Technology guidance from CLAUDE.md:** Specifies `@dnd-kit` for DnD, `zustand` for state, `sonner` for toasts.

## Open Questions

1. **Sonner neo-brutalism styling**
   - What we know: Sonner accepts `className` and `toastOptions` for styling. Neo-brutalism requires 0px border-radius, 2px borders, 6px offset shadows.
   - What's unclear: Whether Sonner's internal elements (close button, progress bar) can be fully overridden without `!important` hacks.
   - Recommendation: Test Sonner styling in Wave 1 during the `<Toaster>` setup task. If overrides are insufficient, use `unstyled` prop and provide fully custom toast markup.

2. **Zustand `persist` error surfacing**
   - What we know: Zustand `persist` silently fails on `QuotaExceededError`. The existing `StorageErrorBanner` component exists from Phase 01.
   - What's unclear: The exact API for wrapping Zustand's storage with error detection.
   - Recommendation: Create a custom `createErrorAwareStorage()` wrapper that catches `setItem` errors and sets an error flag on the store. The `StorageErrorBanner` reads this flag.

3. **DOC-04 Convex static JSON export integration**
   - What we know: The static JSON export script must include `document_requirements` from the scholarships table. The field is optional and most scholarships won't have it initially.
   - What's unclear: The exact export script location and modification points.
   - Recommendation: Locate the export script during Wave 1 and add the field to the JSON output. Client code uses `DOCUMENT_TYPES` as fallback when the field is absent.

## Sources

### Primary (HIGH confidence)

- npm registry -- `@dnd-kit/core@6.3.1`, `@dnd-kit/sortable@10.0.0`, `@dnd-kit/utilities@3.2.2`, `sonner@2.0.7`, `zustand@5.0.12`, `date-fns@4.1.0` -- all versions and peer deps verified 2026-04-03
- Codebase inspection -- `src/lib/storage/types.ts` (StorageAdapter pattern), `src/hooks/useStudentProfile.ts` (SSR hydration pattern), `src/hooks/useLocalStorage.ts` (error surfacing + cross-tab sync), `src/components/ui/card.tsx` (Card prestige variants), `src/components/detail/StickyBar.tsx` (integration surface), `src/components/detail/HeroSection.tsx` (CTA placement), `src/components/directory/ScholarshipCard.tsx` (card footer integration), `src/components/layout/Navbar.tsx` (NavLink slots), `convex/schema.ts` (scholarships table structure)
- Project research -- `web/.planning/research/STACK.md` (verified library recommendations), `web/.planning/research/ARCHITECTURE.md` (data flow, component boundaries, anti-patterns)

### Secondary (MEDIUM confidence)

- UI-SPEC -- `web/.planning/phases/02-application-tracker-document-matrix/02-UI-SPEC.md` (component inventory, interaction contract, state contract, copywriting, accessibility)
- Zustand persist docs -- `skipHydration`, `version`, `migrate`, custom `storage` adapter interface

### Tertiary (LOW confidence)

- None -- all findings verified against codebase or npm registry

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all versions verified on npm registry; peer deps confirmed for React 19.2; existing project research (STACK.md) corroborates all choices
- Architecture: HIGH -- all patterns based on direct codebase inspection of existing storage adapter, hydration, and static data patterns
- Pitfalls: HIGH -- pitfalls 1 (SSR mismatch) and 3 (quota) verified against existing codebase incidents and Phase 01 hardening work; pitfall 2 (touch scroll) verified against dnd-kit sensor docs

**Research date:** 2026-04-03
**Valid until:** 2026-05-03 (30 days -- stable domain, no fast-moving dependencies)
