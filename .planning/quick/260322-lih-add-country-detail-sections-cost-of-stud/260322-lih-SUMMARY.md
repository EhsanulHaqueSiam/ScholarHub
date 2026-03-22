---
phase: quick
plan: 260322-lih
subsystem: ui
tags: [react, country-data, scholarships, neo-brutalism, convex]

# Dependency graph
requires:
  - phase: 06.1
    provides: "Directory listing with listScholarshipsBatch query and ScholarshipCard component"
provides:
  - "Country detail page with 4 info sections for 15 popular destinations"
  - "CountryScholarships component for country-filtered scholarship listings"
  - "Improved funding amount display on ScholarshipCard and ScholarshipListItem"
affects: [directory, country-pages]

# Tech tracking
tech-stack:
  added: []
  patterns: [static-country-data-map, country-section-components]

key-files:
  created:
    - web/src/lib/country-data.ts
    - web/src/components/country/CostOfStudyingSection.tsx
    - web/src/components/country/AdmissionVisaSection.tsx
    - web/src/components/country/IntakePeriodsSection.tsx
    - web/src/components/country/PostStudyWorkSection.tsx
    - web/src/components/country/CountryScholarships.tsx
  modified:
    - web/src/routes/scholarships/country/$country.tsx
    - web/src/components/directory/ScholarshipCard.tsx
    - web/src/components/directory/ScholarshipListItem.tsx

key-decisions:
  - "Static country data in TypeScript map (not Convex) since data changes rarely and avoids query overhead"
  - "CountryScholarships uses listScholarshipsBatch with hostCountries filter for single-country pages"
  - "Banknote icon with font-heading text-sm on separate line for funding amounts in cards"

patterns-established:
  - "Country section components: each takes CountryData + countryName, uses Card with aria-labelledby"

requirements-completed: []

# Metrics
duration: 5min
completed: 2026-03-22
---

# Quick Task 260322-lih: Country Detail Sections Summary

**Country detail pages with tuition costs, visa requirements, intake periods, post-study work info for 15 destinations, plus country-filtered scholarship listings and improved funding display on cards**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-22T09:34:58Z
- **Completed:** 2026-03-22T09:40:09Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Static data file with tuition ranges, living costs, admission/visa requirements, intake periods, and post-study work info for all 15 popular destinations (US, GB, DE, CA, AU, FR, NL, JP, SE, CH, KR, SG, NZ, IE, DK)
- Four reusable section components (CostOfStudying, AdmissionVisa, IntakePeriods, PostStudyWork) following neo-brutalism design system
- Full country landing page composing all sections with hero, disclaimer, and graceful fallback for unsupported countries
- CountryScholarships component using Convex listScholarshipsBatch with hostCountries filter
- Funding amount display improved on both ScholarshipCard and ScholarshipListItem with Banknote icon and prominent styling

## Task Commits

Each task was committed atomically:

1. **Task 1: Create country data file and section components** - `2f61a38` (feat)
2. **Task 2: Build country page and improve card funding display** - `cb725e0` (feat)

## Files Created/Modified
- `web/src/lib/country-data.ts` - CountryData interface + COUNTRY_DATA map for 15 countries + getCountryData helper
- `web/src/components/country/CostOfStudyingSection.tsx` - Tuition ranges grid and living cost breakdown with Intl.NumberFormat
- `web/src/components/country/AdmissionVisaSection.tsx` - Admission requirements and language score table + visa documents checklist
- `web/src/components/country/IntakePeriodsSection.tsx` - Visual intake cards with main intake Badge highlight
- `web/src/components/country/PostStudyWorkSection.tsx` - Post-study work visa details with conditions list
- `web/src/components/country/CountryScholarships.tsx` - Country-filtered scholarship grid using listScholarshipsBatch
- `web/src/routes/scholarships/country/$country.tsx` - Full country landing page (rewritten from stub)
- `web/src/components/directory/ScholarshipCard.tsx` - Banknote icon + font-heading text-sm on separate line for funding
- `web/src/components/directory/ScholarshipListItem.tsx` - Same funding display improvement as ScholarshipCard

## Decisions Made
- Used static TypeScript data map instead of database storage since country info changes rarely and avoids Convex query overhead per page load
- CountryScholarships uses listScholarshipsBatch (not listScholarships) to get a flat array without cursor pagination
- Multi-country scholarships (host_country = "Multiple") won't appear on individual country pages -- acceptable given current single-value schema
- Wider page container (max-w-5xl) to accommodate data-rich sections with two-column grids

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None - all sections are wired to real static data; CountryScholarships is wired to Convex query.

## Next Steps
- Visit `/scholarships/country/US`, `/scholarships/country/DE`, `/scholarships/country/JP` to verify sections render with accurate data
- Visit `/scholarships` to confirm cards show funding amounts more prominently with icon

## Self-Check: PASSED

All 9 files verified present. Both task commits (2f61a38, cb725e0) confirmed in git log. TypeScript and build both pass cleanly.

---
*Quick task: 260322-lih*
*Completed: 2026-03-22*
