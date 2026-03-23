---
phase: 05-admin-dashboard
plan: 02
subsystem: ui
tags: [tiptap, admin, route, stats-bar, stat-card, neo-brutalism, tanstack-router]

requires:
  - phase: 01-foundation
    provides: "shadcn component library (Card, Badge, Button), TanStack Router, Convex setup"
  - phase: 05-admin-dashboard plan 01
    provides: "admin.getAdminStats Convex query"
provides:
  - "Admin route layout at /admin with own header and desktop-only guard"
  - "StatsBar 4-column grid component for admin dashboard"
  - "StatCard component with prestige=unranked and left accent border"
  - "Destructive button variant for reject actions"
  - "TipTap packages installed for EditorialEditor in Plan 04"
affects: [05-03-review-queue, 05-04-editorial-editor, 05-05-source-trust]

tech-stack:
  added: ["@tiptap/react 3.20.4", "@tiptap/pm 3.20.4", "@tiptap/starter-kit 3.20.4", "@tiptap/extension-link 3.20.4", "@tiptap/extension-placeholder 3.20.4"]
  patterns: ["Admin layout with own header (not public Navbar)", "Desktop-only guard via lg:hidden/lg:flex", "Inline dark mode toggle without useTheme hook"]

key-files:
  created:
    - web/src/routes/admin/route.tsx
    - web/src/routes/admin/index.tsx
    - web/src/components/admin/StatsBar.tsx
    - web/src/components/admin/StatCard.tsx
  modified:
    - web/src/components/ui/button.tsx
    - web/package.json
    - web/convex/_generated/api.d.ts

key-decisions:
  - "Inline dark mode toggle in AdminHeader (no useTheme hook) matching Navbar pattern"
  - "Updated generated api.d.ts to include admin module for TypeScript compatibility"

patterns-established:
  - "Admin components live in web/src/components/admin/"
  - "Admin routes at web/src/routes/admin/ with own layout (no public Navbar)"
  - "StatCard uses Card prestige=unranked with border-l-4 border-l-main accent"

requirements-completed: [UIDX-04]

duration: 3min
completed: 2026-03-22
---

# Phase 05 Plan 02: Admin Foundation UI Summary

**TipTap installed, destructive button variant added, admin route layout with desktop-only guard and StatsBar/StatCard components at /admin**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-22T08:57:00Z
- **Completed:** 2026-03-22T09:00:10Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Installed all 5 TipTap packages at 3.20.4 (unblocks Plan 04 EditorialEditor)
- Added destructive button variant to Button CVA for reject actions
- Created admin route layout at /admin with own AdminHeader (no public Navbar), dark mode toggle, desktop-only 1024px guard
- Built StatsBar (4-column grid) and StatCard (prestige=unranked Card with left accent border) components

## Task Commits

Each task was committed atomically:

1. **Task 1: Install TipTap + add destructive button variant** - `58a012b` (feat)
2. **Task 2: Admin route layout + StatsBar + StatCard components** - `3425095` (feat)

## Files Created/Modified
- `web/package.json` - Added 5 @tiptap dependencies at 3.20.4
- `web/src/components/ui/button.tsx` - Added destructive variant (text-white bg-destructive)
- `web/src/routes/admin/route.tsx` - Admin layout with AdminHeader, desktop-only guard, dark mode toggle
- `web/src/routes/admin/index.tsx` - Admin dashboard page with getAdminStats query and StatsBar
- `web/src/components/admin/StatsBar.tsx` - 4-column stats grid (Total, Pending, Published Today, Source Health)
- `web/src/components/admin/StatCard.tsx` - Individual stat card with icon, value, label, accent border
- `web/convex/_generated/api.d.ts` - Added admin module import for TypeScript type checking

## Decisions Made
- Used inline dark mode toggle in AdminHeader, matching the existing Navbar pattern (useState + classList.toggle + localStorage)
- Updated generated api.d.ts to include admin module so TypeScript compiles cleanly; this will be overwritten by `npx convex dev` on next deploy

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated generated api.d.ts to include admin module**
- **Found during:** Task 2 (Admin route layout)
- **Issue:** The generated api.d.ts did not include the admin module, so `api.admin.getAdminStats` would cause a TypeScript error
- **Fix:** Added `import type * as admin from "../admin.js"` and `admin: typeof admin` to the fullApi declaration
- **Files modified:** web/convex/_generated/api.d.ts
- **Verification:** `npx tsc --noEmit` passes with no errors
- **Committed in:** 3425095 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary for TypeScript compilation. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Admin route structure ready for Plan 03 (ReviewQueue) to add queue components below StatsBar
- TipTap packages installed and ready for Plan 04 (EditorialEditor)
- Destructive button variant available for reject actions in Plans 03 and 05
- StatCard pattern established for consistent stat display

## Self-Check: PASSED

All created files verified on disk. All commit hashes found in git log. SUMMARY.md exists.

---
*Phase: 05-admin-dashboard*
*Completed: 2026-03-22*
