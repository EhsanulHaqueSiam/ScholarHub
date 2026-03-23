# Quick Task 260324-1ap: Full Neo-Brutalism UI/UX Redesign — Summary

**Status:** Complete
**Date:** 2026-03-24

## Changes Made

### Task 1: Design Tokens + Base UI Components
- **Border radius:** 5px → 0px (hard corners, authentic neo-brutalism)
- **Shadow offset:** 4px → 6px (bolder, more dramatic)
- **New accent palette:** Bright yellow, hot pink, electric lime, sky blue (light + dark mode)
- **Grid dots:** Larger (r=2), warmer/more visible colors
- **Noise texture:** `.noise-texture` utility class for subtle grain overlay
- **Button:** Font changed to `font-heading font-bold`, added `accent` variant, hover brightness boost
- **Badge:** Text size improved from `text-xs` to `text-[13px]`, added `accent` variant

### Task 2: Admin Dashboard Neo-Brutalism Overhaul
- **Admin header:** h-12 → h-16, 4px border, 6px bottom shadow, accent-colored "Admin" text
- **View switcher tabs:** Thin underlines → bold pill buttons with borders and shadows
- **StatCards:** Removed Card wrapper, added colored backgrounds (accent/10), top-4 main border, larger typography (3xl value, sm label), size-10 icons
- **StatsBar:** Responsive grid (2-col mobile, 4-col desktop), matching skeleton styles
- **ReviewQueue tabs:** Same pill-button treatment as view switcher
- **QueueRow:** Individual card-like blocks with 2px borders, bold hover (shadow + translate), accent selection indicator with left border
- **Expanded row:** Different background color (bg-background vs secondary), 2px top border
- **Chevron button:** Added border and hover state
- **SourceTrustManager:** Bolder table headers (text-sm, font-bold), chunkier rows (py-4, 2px borders), hover accent tint, inactive grayscale filter
- **BulkActionBar:** h-14 → h-16, 4px top border, 6px top shadow
- **CollectionsManager:** Matching bulk action bar updates

### Task 3: Public-Facing Directory Polish
- **Navbar:** Added 6px bottom shadow for bold double-line effect
- **Hero heading:** 32px/48px → 36px/56px, colorful accent words (pink "International", yellow "Scholarships")
- **Results count badge:** Accent yellow background with shadow
- **SearchBar:** 3px border (from 2px), h-14 (from h-12), bolder placeholder styling, matching dropdown border
- **ScholarshipCard:** Playful -0.5deg hover rotation, bolder degree chips (2px border, heading font, secondary bg)
- **Pagination:** Current page scaled 110%, non-current hover rotation -1deg, page info styled as neo-brutalism badge

## Files Modified (17)

| File | Changes |
|------|---------|
| `web/src/index.css` | Design tokens, accent colors, grid dots, noise texture |
| `web/src/components/ui/button.tsx` | Font, accent variant, hover brightness |
| `web/src/components/ui/card.tsx` | (Inherits token changes) |
| `web/src/components/ui/badge.tsx` | Text size, accent variant |
| `web/src/routes/admin/route.tsx` | Bold header with shadow and accent |
| `web/src/routes/admin/index.tsx` | Pill-button view switcher |
| `web/src/components/admin/StatCard.tsx` | Full redesign with accent bg |
| `web/src/components/admin/StatsBar.tsx` | Responsive grid, matching skeletons |
| `web/src/components/admin/ReviewQueue.tsx` | Pill-button tabs |
| `web/src/components/admin/QueueRow.tsx` | Card-like rows, bold hover/selection |
| `web/src/components/admin/SourceTrustManager.tsx` | Bolder table, hover states |
| `web/src/components/admin/BulkActionBar.tsx` | Taller, bolder shadow |
| `web/src/components/admin/CollectionsManager.tsx` | Matching bulk bar |
| `web/src/components/layout/Navbar.tsx` | Bottom shadow |
| `web/src/routes/scholarships/index.tsx` | Hero sizing, accent words, count badge |
| `web/src/components/directory/ScholarshipCard.tsx` | Hover rotation, bolder chips |
| `web/src/components/directory/SearchBar.tsx` | Thicker border, taller input |
| `web/src/components/directory/Pagination.tsx` | Hover rotation, current scale, styled info |

## Verification

- TypeScript: `npx tsc --noEmit` — 0 errors
- Build: `npm run build` — success (351ms)
