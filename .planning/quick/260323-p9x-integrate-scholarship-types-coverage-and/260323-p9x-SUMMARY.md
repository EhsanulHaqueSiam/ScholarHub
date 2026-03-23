---
phase: quick-260323-p9x
plan: 01
subsystem: schema-frontend
tags: [scholarship-types, coverage, classification, filtering, tips]
dependency_graph:
  requires: []
  provides: [scholarship-type-taxonomy, coverage-grid, type-filtering, application-tips]
  affects: [schema, aggregation, triggers, directory, cards, detail-page, filters]
tech_stack:
  added: []
  patterns: [classification-heuristic, badge-variant-system, css-custom-properties, static-knowledge-base]
key_files:
  created:
    - web/convex/classification.ts
    - web/src/lib/scholarship-types.ts
    - web/src/components/detail/ApplicationTipsSection.tsx
  modified:
    - web/convex/schema.ts
    - web/convex/aggregation.ts
    - web/convex/triggers.ts
    - web/convex/admin.ts
    - web/convex/directory.ts
    - web/convex/scraping.ts
    - web/src/index.css
    - web/src/components/ui/badge.tsx
    - web/src/components/directory/ScholarshipCard.tsx
    - web/src/components/directory/ScholarshipListItem.tsx
    - web/src/lib/filters.ts
    - web/src/hooks/useScholarshipFilters.ts
    - web/src/components/directory/FilterPanel.tsx
    - web/src/components/directory/FilterChips.tsx
    - web/src/lib/shared.ts
    - web/src/components/detail/HeroSection.tsx
    - web/src/components/detail/FundingSection.tsx
    - web/src/routes/scholarships/$slug.tsx
decisions:
  - Used heuristic classification engine (source category > tags > provider > description) rather than ML
  - Classification runs at create-time in aggregation AND re-triggers on tag changes via trigger
  - Backfill mutation uses self-scheduling batched pattern (50 per batch)
  - Type pills placed in existing badge row (not separate row) to avoid card height bloat
  - Coverage line uses compact format with truncation at 3+ items
  - 2-column grid for 6 coverage items on detail page
  - ApplicationTipsSection shows custom tips with priority, static as supplementary
metrics:
  duration: 13m
  completed: 2026-03-23
  tasks: 3
  files: 21
---

# Quick Task 260323-p9x: Integrate Scholarship Types, Coverage, and Guidance Summary

Scholarship type taxonomy with 9-value enum, heuristic classification engine, 8 colored type badge variants, expanded 6-item coverage tracking, directory type filter, and contextual application tips section on detail pages.

## What Was Built

### Task 1: Schema + Classification Engine + Query Filtering
- **Schema extensions**: Added `scholarshipTypeValidator` (9 types: merit, need_based, government, university, country_specific, subject_specific, research, athletic, general), `scholarship_type`, `funding_books`, `funding_research`, `application_tips` fields to scholarships table; `funding_books`, `funding_research` to raw_records table; `scholarship_type` to search index filterFields
- **Classification engine** (`web/convex/classification.ts`): Heuristic classifier using 4-tier signal priority: source category (most reliable) > tags > provider name > description keywords
- **Aggregation integration**: `createScholarship` calls classifier on new scholarships; `mergeIntoScholarship` OR-merges new funding booleans; `backfillScholarshipTypes` batched mutation for existing data
- **Trigger integration**: Re-classifies on insert or when tags change, with infinite loop guard
- **Query filtering**: Both `listScholarships` and `listScholarshipsBatch` accept `scholarshipTypes` with search index single-value optimization and post-filter for multi-value
- **Admin**: `updateScholarship` accepts all 4 new fields
- **Scraping**: `batchInsertRawRecords` accepts all 6 funding booleans

### Task 2: Frontend Type Pills + Coverage Line + Directory Filtering
- **Knowledge base** (`web/src/lib/scholarship-types.ts`): Single source of truth with `SCHOLARSHIP_TYPE_META` (labels, badge variants, tips, coverage tips), `getCoveredItems`, `formatCoverageCompact`, `getApplicationTip`, `getCoverageTip`
- **CSS custom properties**: 16 oklch color variables for 8 types (badge + border) in light and dark modes, registered in @theme inline block
- **Badge variants**: 8 type-specific variants added to `badge.tsx` CVA system
- **Card enhancements**: Type pill badge in badge row + compact coverage text ("Covers: Tuition + Living + Travel") in funding area on both `ScholarshipCard` and `ScholarshipListItem`
- **Filter integration**: `type` URL param in search schema, `SCHOLARSHIP_TYPES` constant with 8 options, `useScholarshipFilters` parses/passes `scholarshipTypes`, FilterPanel has Scholarship Type section (first position), FilterChips supports type removal

### Task 3: Detail Page Enhancements
- **HeroSection**: Type pill badge in badge row (after prestige, before country)
- **FundingSection**: Extended from 4 to 6 coverage items (Books & Materials, Research Expenses) in 2-column grid layout with contextual coverage tip below grid
- **ApplicationTipsSection** (new component): Shows per-scholarship custom tips with priority; falls back to static type-based tips; when custom tips exist, static tip shown as supplementary below divider
- **$slug.tsx**: Wires `scholarshipType`, `fundingBooks`, `fundingResearch`, `applicationTips` to all detail components

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | 33cff55 | feat(quick-260323-p9x): schema extensions, classification engine, query filtering, and backfill |
| 2 | 5cbf630 | feat(quick-260323-p9x): frontend type pills, coverage line, and directory filtering |
| 3 | aa9fac9 | feat(quick-260323-p9x): detail page type pills, expanded coverage grid, and application tips |

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - all data paths are wired. Scholarship type will be `undefined` for existing scholarships until the `backfillScholarshipTypes` mutation is run.

## Verification

- `npx tsc --noEmit`: Clean (0 errors)
- `npx vite build`: Production build succeeds
- All 3 tasks committed individually with proper scope

## Self-Check: PASSED

- All 21 files verified as existing on disk
- All 3 commit hashes found in git log
