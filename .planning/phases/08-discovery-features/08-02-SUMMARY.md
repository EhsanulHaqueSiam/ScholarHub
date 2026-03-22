---
phase: 08-discovery-features
plan: 02
subsystem: ui
tags: [css-variables, cva, badge, navbar, neo-brutalism, design-tokens]

# Dependency graph
requires:
  - phase: 06.1-country-eligibility-filtering-university-tier-list-prestige-highlighting
    provides: "Badge CVA variants (11 existing), Navbar with Scholarships/Closing Soon links, CSS design system with oklch variables"
provides:
  - "8 new CSS custom properties for comparison highlighting, tag outlines, and suggested tag amber styling"
  - "Badge tag variant (outline-only, no fill, thin border) for tag display on detail pages"
  - "Badge tagSuggested variant (amber outline + light fill) for suggested tag review in admin"
  - "Navbar Collections link between Scholarships and Closing Soon"
affects: [08-03, 08-04, 08-05, 08-06, 08-07, 08-08]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CSS variable-based dark mode for Phase 8 tokens (same .dark override pattern as prestige/urgency vars)"
    - "Badge CVA variant referencing CSS variables via border-[var(--name)] syntax"

key-files:
  created: []
  modified:
    - "web/src/index.css"
    - "web/src/components/ui/badge.tsx"
    - "web/src/components/layout/Navbar.tsx"

key-decisions:
  - "Dark mode badge variants reference same CSS variable names since .dark class overrides the variable values in index.css"
  - "Collections link added to both desktop and mobile nav menus for consistency"

patterns-established:
  - "Phase 8 CSS variables follow same oklch naming convention as prestige/urgency variables"
  - "Tag badge variants use CSS variable references instead of Tailwind color utilities for dark mode compatibility"

requirements-completed: [DISC-01, DISC-02]

# Metrics
duration: 3min
completed: 2026-03-23
---

# Phase 8 Plan 02: CSS Design Tokens & UI Atoms Summary

**CSS custom properties for comparison/tag styling, badge tag and tagSuggested CVA variants, and Navbar Collections link as foundational atoms for Phase 8 discovery features**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-22T19:08:45Z
- **Completed:** 2026-03-22T19:11:46Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Added 8 CSS custom properties (4 light mode, 4 dark mode) for comparison difference highlighting, tag outline badges, and suggested tag amber styling
- Extended Badge component to 13 total variants with new tag (outline-only) and tagSuggested (amber outline + fill) variants
- Added Collections navigation link between Scholarships and Closing Soon in both desktop and mobile Navbar

## Task Commits

Each task was committed atomically:

1. **Task 1: CSS variables for Phase 8 design tokens** - `efe5984` (feat)
2. **Task 2: Badge tag variants + Navbar Collections link** - `067f245` (feat)

## Files Created/Modified
- `web/src/index.css` - Added --compare-diff-bg, --tag-outline-border, --tag-suggested-border, --tag-suggested-bg in both :root and .dark blocks
- `web/src/components/ui/badge.tsx` - Added tag and tagSuggested CVA variants after limitedInfo
- `web/src/components/layout/Navbar.tsx` - Added Collections NavLink in desktop nav and mobile dropdown menu

## Decisions Made
- Dark mode badge variants reference same CSS variable names (e.g., `border-[var(--tag-outline-border)]` with `dark:border-[var(--tag-outline-border)]`) because the `.dark` class overrides the variable values in index.css, not Tailwind's dark: prefix with different values
- Collections link added to both desktop NavLink section and mobile dropdown Link section for full responsive coverage

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- CSS design tokens ready for ComparisonTable (--compare-diff-bg), TagBadges (--tag-outline-border), and SuggestedTagReview (--tag-suggested-*) components
- Badge tag/tagSuggested variants importable by all Phase 8 components
- Navbar Collections link ready for /collections route wiring
- All 93 existing tests pass with these changes

## Self-Check: PASSED

All files exist, all commits verified.

---
*Phase: 08-discovery-features*
*Completed: 2026-03-23*
