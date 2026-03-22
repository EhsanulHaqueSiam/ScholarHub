---
phase: 05-admin-dashboard
plan: 04
subsystem: ui
tags: [react, radix-dialog, tiptap, wysiwyg, dompurify, revision-history, slide-out-panel, rich-text]

# Dependency graph
requires:
  - phase: 05-admin-dashboard
    plan: 01
    provides: "Admin mutations (updateScholarship, getRevisionHistory, getScholarshipForEdit)"
  - phase: 05-admin-dashboard
    plan: 02
    provides: "Admin layout, header, stats bar, route structure"
provides:
  - "EditPanel: Right slide-out sheet for scholarship editing (Radix Dialog)"
  - "EditForm: All-fields edit form with dirty state tracking and save-only-changed-fields"
  - "EditorialEditor: TipTap WYSIWYG editor with toolbar (Bold, Italic, Link, Lists, Headings)"
  - "RevisionHistory: Collapsible timeline of field-level changes"
  - "Dual-format EditorialTips: HTML (DOMPurify-sanitized) and markdown rendering"
affects: [05-05]

# Tech tracking
tech-stack:
  added: [dompurify, "@types/dompurify"]
  patterns:
    - "TipTap editor with StarterKit + Link + Placeholder for admin rich text editing"
    - "DOMPurify sanitization with strict whitelist for admin-generated HTML content"
    - "Dual-format detection (isHtml) for backward-compatible editorial note rendering"
    - "Radix Dialog as right slide-out Sheet with slide-in-from-right animation"
    - "Dirty state tracking via JSON.stringify comparison with save-only-changed-fields pattern"

key-files:
  created:
    - "web/src/components/admin/EditPanel.tsx"
    - "web/src/components/admin/EditForm.tsx"
    - "web/src/components/admin/EditorialEditor.tsx"
    - "web/src/components/admin/RevisionHistory.tsx"
  modified:
    - "web/src/components/detail/EditorialTips.tsx"
    - "web/convex/admin.ts"

key-decisions:
  - "Used window.confirm for unsaved changes prompt -- simple, reliable, no extra Radix AlertDialog dependency needed"
  - "DOMPurify with strict ALLOWED_TAGS whitelist for defense-in-depth on admin-controlled TipTap HTML"
  - "isHtml detection uses regex for HTML tag presence -- covers TipTap output and plain text/markdown distinction"

patterns-established:
  - "Slide-out panel pattern: Radix Dialog with fixed inset-y-0 right-0, 40% width, min/max constraints"
  - "Form dirty tracking: JSON.stringify comparison of current vs initial values"
  - "Save-only-changed-fields: diff form values against initial, send only changed fields to mutation"
  - "TipTap toolbar pattern: array of button configs with action, icon, isActive, aria-label"

requirements-completed: [ADMN-02, ADMN-07]

# Metrics
duration: 4min
completed: 2026-03-22
---

# Phase 05 Plan 04: Edit Panel & Editorial Editor Summary

**Slide-out edit panel with TipTap rich text editor, revision history timeline, and DOMPurify-sanitized dual-format editorial note rendering**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-22T09:06:32Z
- **Completed:** 2026-03-22T09:10:45Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Built slide-out EditPanel using Radix Dialog as Sheet with 40% viewport width, unsaved changes protection
- Created all-fields EditForm covering 16 scholarship fields with dirty state tracking and save-only-changed-fields optimization
- Integrated TipTap WYSIWYG editor (StarterKit + Link + Placeholder) with 7-button toolbar for editorial notes
- Added collapsible RevisionHistory timeline showing field-level changes with timestamps
- Updated public EditorialTips to detect and render both HTML (TipTap) and markdown (auto-notes) content with DOMPurify sanitization

## Task Commits

Each task was committed atomically:

1. **Task 1: EditPanel + EditForm with all scholarship fields** - `dde8f28` (feat)
2. **Task 2: TipTap EditorialEditor + RevisionHistory + dual-format EditorialTips** - `2699981` (feat)

## Files Created/Modified
- `web/src/components/admin/EditPanel.tsx` - Right slide-out sheet using Radix Dialog, sticky header, scrollable body, unsaved changes prompt
- `web/src/components/admin/EditForm.tsx` - All 16 editable scholarship fields, dirty tracking, save-only-changed-fields via updateScholarship mutation
- `web/src/components/admin/EditorialEditor.tsx` - TipTap WYSIWYG wrapper with toolbar (Bold, Italic, Link, Lists, H2, H3), placeholder text
- `web/src/components/admin/RevisionHistory.tsx` - Collapsible timeline of field changes with dots, timestamps, old/new values
- `web/src/components/detail/EditorialTips.tsx` - Updated with isHtml detection, DOMPurify sanitization for HTML, existing react-markdown for markdown
- `web/convex/admin.ts` - Added getScholarshipForEdit query (also added by parallel 05-03 agent)

## Decisions Made
- Used window.confirm for unsaved changes prompt instead of Radix AlertDialog -- simpler, no extra UI component needed
- DOMPurify with strict ALLOWED_TAGS whitelist (p, strong, em, a, ul, ol, li, h2, h3, br) for defense-in-depth XSS protection
- isHtml detection via regex checks for HTML tag presence -- reliable distinction between TipTap output and plain text/markdown
- Form dirty state tracked via JSON.stringify comparison -- simple and effective for this use case

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All editing components ready: EditPanel, EditForm, EditorialEditor, RevisionHistory
- Components are designed to be composed into the admin queue view (Plan 05 will wire QueueRow "Edit" button to EditPanel)
- Public detail page EditorialTips now handles both HTML and markdown editorial notes

## Self-Check: PASSED

All 6 files found. Both commits (dde8f28, 2699981) verified. Summary file exists.

---
*Phase: 05-admin-dashboard*
*Completed: 2026-03-22*
