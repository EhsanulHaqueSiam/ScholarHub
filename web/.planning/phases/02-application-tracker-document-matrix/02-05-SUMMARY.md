---
phase: 02-application-tracker-document-matrix
plan: 05
subsystem: ui
tags: [react, zustand, tracker, document-checklist, csv-export, neo-brutalism]

# Dependency graph
requires:
  - phase: 02-01
    provides: Zustand tracker store with updateNotes, toggleDocument, moveToStage, removeEntry actions
  - phase: 02-03
    provides: TrackerKanban, TrackerCard, TrackerColumn, MobileStageSelector, TrackerEmptyState components
provides:
  - NotesEditor component with 500-char debounced auto-save
  - DocumentChecklist component with per-scholarship toggles and readOnly mode
  - TrackerCardExpanded modal with stage selector, documents, notes, remove
  - DocumentMatrix cross-scholarship document overview grid
  - ExportCSVButton for immediate CSV download
  - DocumentChecklist on scholarship detail page (DOC-01)
  - StorageErrorBanner integration on tracker route
affects: [02-06, scholarship-detail-page]

# Tech tracking
tech-stack:
  added: []
  patterns: [expanded-card-overlay-pattern, debounced-autosave-pattern, read-only-checklist-for-untracked]

key-files:
  created:
    - src/components/tracker/NotesEditor.tsx
    - src/components/tracker/DocumentChecklist.tsx
    - src/components/tracker/TrackerCardExpanded.tsx
    - src/components/tracker/DocumentMatrix.tsx
    - src/components/tracker/ExportCSVButton.tsx
  modified:
    - src/routes/tracker.tsx
    - src/components/tracker/TrackerKanban.tsx
    - src/routes/scholarships/$slug.tsx

key-decisions:
  - "Expanded card renders as fixed overlay with backdrop click dismiss and Escape key handler"
  - "DocumentChecklist on detail page shows read-only preview with hint text when scholarship is not tracked"
  - "DocumentMatrix summary row shows top 2 unchecked document types to avoid info overload"

patterns-established:
  - "Overlay pattern: fixed inset-0 z-50 bg-foreground/20 with stopPropagation inner div"
  - "Debounced auto-save: local state + useEffect setTimeout 500ms to store action"
  - "ReadOnly checklist: same component, disabled prop, different wrapping for untracked state"

requirements-completed: [TRACK-05, TRACK-07, DOC-01, DOC-02, DOC-03]

# Metrics
duration: 4min
completed: 2026-04-03
---

# Phase 02 Plan 05: Tracker Detail Components Summary

**NotesEditor, DocumentChecklist, TrackerCardExpanded, DocumentMatrix, ExportCSVButton with detail page DOC-01 integration**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-02T21:06:45Z
- **Completed:** 2026-04-02T21:10:38Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Built all 5 tracker detail components (NotesEditor, DocumentChecklist, TrackerCardExpanded, DocumentMatrix, ExportCSVButton)
- Wired expanded card overlay into TrackerKanban with backdrop dismiss and Escape key
- Integrated DocumentChecklist on scholarship detail page with interactive mode (tracked) and read-only preview (untracked) per DOC-01
- Added StorageErrorBanner and ExportCSVButton to tracker route
- All 347 tests pass, TypeScript compiles clean

## Task Commits

Each task was committed atomically:

1. **Task 1: NotesEditor + DocumentChecklist + TrackerCardExpanded** - `04192e2` (feat)
2. **Task 2: DocumentMatrix + ExportCSVButton + Wire into Tracker Route + Detail Page DocumentChecklist** - `970ecf9` (feat)

## Files Created/Modified
- `src/components/tracker/NotesEditor.tsx` - Textarea with 500-char limit, debounced 500ms auto-save to store
- `src/components/tracker/DocumentChecklist.tsx` - Per-scholarship checkbox list with 6 document types, readOnly prop, summary count
- `src/components/tracker/TrackerCardExpanded.tsx` - Full expanded card with stage selector, documents, notes, remove button, Escape dismiss
- `src/components/tracker/DocumentMatrix.tsx` - Cross-scholarship document overview grid with sticky first column, check indicators, summary row
- `src/components/tracker/ExportCSVButton.tsx` - CSV export trigger with Download icon, disabled when empty
- `src/routes/tracker.tsx` - Added ExportCSVButton, DocumentMatrix, StorageErrorBanner integration
- `src/components/tracker/TrackerKanban.tsx` - Added expanded card overlay, onExpand wiring to cards
- `src/routes/scholarships/$slug.tsx` - DocumentChecklist section with tracked/untracked modes (DOC-01)

## Decisions Made
- Expanded card uses fixed overlay pattern (inset-0 z-50) rather than inline expansion -- simpler implementation, works on both desktop and mobile
- DocumentChecklist on detail page shows read-only preview with hint text when scholarship is not tracked -- encourages tracking without hiding document types
- DocumentMatrix shows top 2 most common unchecked documents in summary text to avoid information overload

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 12 tracker components exist in src/components/tracker/
- Plan 06 (final wiring and polish) can proceed
- Document checklist is live on both tracker and detail pages
- CSV export functional with immediate download

## Self-Check: PASSED

- All 8 files verified present on disk
- Both commit hashes (04192e2, 970ecf9) found in git log
- TypeScript compiles clean
- 347/347 tests pass

---
*Phase: 02-application-tracker-document-matrix*
*Plan: 05*
*Completed: 2026-04-03*
