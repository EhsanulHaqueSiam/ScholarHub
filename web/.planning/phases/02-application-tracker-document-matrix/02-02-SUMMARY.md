---
phase: 02-application-tracker-document-matrix
plan: 02
subsystem: infra
tags: [dnd-kit, sonner, zustand, date-fns, convex-schema, toaster]

# Dependency graph
requires: []
provides:
  - "@dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities installed for Kanban drag-and-drop"
  - "sonner Toaster rendered globally in app root with neo-brutalism styling"
  - "zustand installed for client state management"
  - "date-fns installed for calendar localization"
  - "document_requirements optional field on Convex scholarships table"
  - "ScholarshipSummary includes document_requirements in both server and client interfaces"
affects: [02-01, 02-03, 02-04, 02-05, 02-06]

# Tech tracking
tech-stack:
  added: ["@dnd-kit/core@6.3.1", "@dnd-kit/sortable@10.0.0", "@dnd-kit/utilities@3.2.2", "sonner@2.0.7", "zustand@5.0.12", "date-fns@4.1.0"]
  patterns: ["Global Toaster with neo-brutalism className overrides via toastOptions"]

key-files:
  created: []
  modified: ["web/package.json", "web/src/routes/__root.tsx", "web/convex/schema.ts", "web/convex/scholarshipSummary.ts", "web/src/lib/scholarship-summary.ts"]

key-decisions:
  - "Toaster positioned bottom-right with neo-brutalism class styling matching existing design tokens"
  - "document_requirements stored as v.optional(v.array(v.string())) for flexibility"

patterns-established:
  - "Sonner toast notifications: import { toast } from 'sonner' to use anywhere in the app"

requirements-completed: [DOC-04, TRACK-06]

# Metrics
duration: 2m 36s
completed: 2026-04-03
---

# Phase 02 Plan 02: Dependencies, Toaster, and Schema Extension Summary

**Installed 6 Phase 02 dependencies, added Sonner Toaster with neo-brutalism styling to app root, and extended Convex schema with document_requirements field**

## Performance

- **Duration:** 2m 36s
- **Started:** 2026-04-02T20:45:26Z
- **Completed:** 2026-04-02T20:48:02Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Installed all 6 Phase 02 dependencies at exact validated versions (dnd-kit, sonner, zustand, date-fns)
- Added global Sonner Toaster to __root.tsx with neo-brutalism border, shadow, and font styling
- Extended Convex scholarships table with document_requirements optional array field
- Updated ScholarshipSummary interface and mapping in both server and client mirrors

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Phase 02 Dependencies** - `6ee2a87` (chore)
2. **Task 2: Add Sonner Toaster to App Root + Convex Schema Extension** - `c5ce681` (feat)

## Files Created/Modified
- `web/package.json` - Added 6 new dependencies for Phase 02 features
- `web/package-lock.json` - Lock file updated with 1104 new packages
- `web/src/routes/__root.tsx` - Added Sonner Toaster import and component with neo-brutalism styling
- `web/convex/schema.ts` - Added document_requirements optional field to scholarships table
- `web/convex/scholarshipSummary.ts` - Added document_requirements to interface and toScholarshipSummary mapping
- `web/src/lib/scholarship-summary.ts` - Added document_requirements to client-side ScholarshipSummary interface

## Decisions Made
- Toaster positioned bottom-right with className override using existing CSS custom properties (border-border, shadow-shadow, bg-secondary-background, text-foreground, font-base) -- consistent with neo-brutalism design system
- document_requirements stored as simple string array -- flexible enough for DOC-04 taxonomy while keeping schema lightweight
- Added field after study_info in schema (as specified) to maintain logical grouping of admin-editable fields

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All dependencies installed and importable for Plans 03-06
- Sonner toast notifications available app-wide via `import { toast } from 'sonner'`
- Convex schema ready for document_requirements CRUD operations
- 250 tests pass with zero regressions

## Self-Check: PASSED

All files exist. All commits verified (6ee2a87, c5ce681).

---
*Phase: 02-application-tracker-document-matrix*
*Completed: 2026-04-03*
