# Phase 1: Eligibility Analysis Funnel - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Build a multi-step eligibility wizard at `/eligibility` where students provide their profile (nationality, degree, field of study, GPA, language scores, preferences, demographics) and receive matched scholarships grouped by eligibility tiers (Strong/Good/Partial/Possible) on a dedicated results page at `/eligibility/results`. Profile stored in localStorage, shareable via URL params.

</domain>

<decisions>
## Implementation Decisions

### Funnel Structure
- **D-01:** Multi-step wizard with 3 steps: Step 1 (About You: nationality, age, gender), Step 2 (Academics: degree, field, GPA, language scores), Step 3 (Preferences: destination countries, funding type)
- **D-02:** Conversational chat-style wizard with document upload is a FUTURE phase — not in scope here
- **D-03:** Dedicated `/eligibility` route, not embedded in directory. Primary CTA on homepage + navigation link
- **D-04:** Slide transitions between steps (forward = slide left, back = slide right). Neo-brutalism bold borders frame each step
- **D-05:** Step bar with labels at top: 'About You' -> 'Academics' -> 'Preferences'. Shows current + completed steps
- **D-06:** Back button + clickable completed step labels for navigation. Preserves all entered data
- **D-07:** Live scholarship count updates on each step as user fills fields ('142 scholarships match so far'). Requires lightweight Convex query per change

### Data Collection
- **D-08:** Required core fields: nationality, degree level, field of study. Optional extras: GPA, language scores (IELTS/TOEFL/PTE), age, gender, destination countries, funding type
- **D-09:** Nationality auto-detected via timezone (existing `useNationalityDetect`), user confirms or changes. Supports multiple nationalities (dual citizens)
- **D-10:** Field of study: multi-select from existing 25 categories, searchable dropdown. Pick 1-3 fields
- **D-11:** Language scores: numeric input per test type. IELTS 0-9, TOEFL 0-120, PTE 10-90. User selects which test(s) they have
- **D-12:** GPA: multi-scale selector — user picks grading system (US 4.0, UK classification, percentage, etc.), enters score, system converts internally
- **D-13:** Destination countries: multi-select, pick 1-5 countries
- **D-14:** Demographics: sensitive presentation with explanation note ('Some scholarships target specific groups — answering helps us find more matches for you'). Gender includes non-binary + prefer not to say
- **D-15:** Brief privacy note at wizard start: 'Your data stays in your browser. Nothing is sent to our servers.'

### Matching & Scoring Logic
- **D-16:** Tiered match system: Strong Match / Good Match / Partial Match / Possible Match (not exact percentages)
- **D-17:** Point-based threshold scoring — assign points per dimension, then map to tiers: Strong 80%+, Good 50-79%, Partial 20-49%, Possible = unknown eligibility data
- **D-18:** Weight hierarchy: Nationality (heaviest) > Degree Level > Field of Study. Funding and demographics are preferences, not hard eligibility
- **D-19:** Scholarships with missing eligibility data included as 'Possible match — eligibility not confirmed'. Separate section in results
- **D-20:** Hybrid compute: Convex filters by hard constraints (nationality, degree), client scores soft matches (field, funding, demographics)
- **D-21:** Exclude expired deadlines. Badge 'Closing Soon' for scholarships with < 30 days remaining

### Results Experience
- **D-22:** Dedicated results page at `/eligibility/results` with encoded URL params for sharing (e.g., `?n=BD&d=master&f=cs,eng&dest=DE,NL`)
- **D-23:** Results grouped by tier sections with counts: 'Strong Matches (24)' > 'Good Matches (67)' > 'Partial Matches (31)' > 'Possible Matches (89)'. Each section collapsible
- **D-24:** Compact match indicators on each scholarship card: checkmarks/crosses for Nationality, Degree, Field, Language. Click to expand full breakdown
- **D-25:** Light filtering on results: sort by deadline, prestige, funding amount. Filter by funding type, scholarship type. Reuse existing FilterChips component
- **D-26:** Editable profile summary card at top of results. Click any field to edit inline, results update live
- **D-27:** Helpful empty state when no matches: show which criteria are too restrictive, suggest relaxing filters, link to full directory as fallback
- **D-28:** Prominent 'Browse all scholarships' link that opens directory with nationality/degree pre-filled from profile

### Profile Persistence
- **D-29:** localStorage only for this phase. No Clerk, no Convex user profiles. URL params as backup for sharing
- **D-30:** Returning visitors see 'Welcome back' with option to view previous results or update profile. Skip wizard unless they want changes
- **D-31:** 'Start over' button on results page to clear localStorage profile and redirect to empty wizard
- **D-32:** Clean StudentProfile type interface — localStorage adapter now, swap to Convex+Clerk adapter later. No Clerk code in this phase

### SEO & Meta Tags
- **D-33:** /eligibility: static title 'Check Your Scholarship Eligibility | ScholarHub', fixed OG image, Schema.org FAQPage
- **D-34:** /eligibility/results: dynamic title based on profile, e.g., '24 Scholarships for Bangladeshi Master's Students | ScholarHub'
- **D-35:** Pre-generate and index popular nationality+degree combinations for long-tail SEO. Noindex rare combinations

### Mobile Experience
- **D-36:** Full-screen wizard steps with sticky nav on mobile. Step bar at top (scrolls away), Next/Back buttons sticky at bottom. Slide transitions. Native app feel
- **D-37:** Results: full-width stacked cards with sticky tier headers as user scrolls. Compact match indicators. Pull-to-refresh

### Analytics & Tracking
- **D-38:** Full funnel event tracking: wizard_started, step_completed (with step name + fields filled), wizard_completed, results_viewed, scholarship_clicked_from_results, profile_edited, profile_cleared
- **D-39:** Abstract analytics layer (analytics.ts with trackEvent). Console.log in dev. Swap to PostHog later with one-line change. No PostHog dependency

### Claude's Discretion
- Loading skeleton design for results
- Exact point values for each matching dimension
- Exact spacing, typography, and neo-brutalism styling details
- Error state handling for Convex query failures
- GPA conversion table between grading systems
- Which nationality+degree combinations to pre-generate for SEO indexing
- Transition animation duration and easing

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured in decisions above. Key codebase references for pattern consistency:

### Schema & Data
- `web/convex/schema.ts` — Scholarship eligibility fields (eligibility_nationalities, degree_levels, fields_of_study, funding_type, language scores)
- `web/convex/directory.ts` — Existing query implementation for filtering by nationality eligibility

### Existing Filter System
- `web/src/lib/filters.ts` — Filter schema, constants, 25 field-of-study categories
- `web/src/hooks/useScholarshipFilters.ts` — Filter state management + URL params pattern
- `web/src/hooks/useNationalityDetect.ts` — Timezone-based nationality auto-detection

### UI Components
- `web/src/components/directory/EligibilityFilterBar.tsx` — Nationality + destination filter UI pattern
- `web/src/components/directory/FilterChips.tsx` — Reusable filter chip component for results filtering
- `web/src/components/directory/ScholarshipCard.tsx` — Card component to extend with match indicators
- `web/src/components/detail/EligibilitySection.tsx` — Eligibility display patterns (nationality grouping, degree badges)

### Data Libraries
- `web/src/lib/countries.ts` — ISO country mapping, flags, regional grouping
- `web/src/lib/tags.ts` — Eligibility-relevant tags (no_gre, women_only, developing_countries)
- `web/src/lib/country-data.ts` — Per-country tuition, visa, language requirements

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `EligibilityFilterBar`: Nationality + destination selection UI — reuse pattern for wizard step 1 and 3
- `useNationalityDetect` hook: Timezone-based nationality auto-detection — use directly in wizard step 1
- `useScholarshipFilters` hook: URL param parsing + filter state — adapt pattern for profile URL encoding
- `FilterChips` component: Tag-style filter display — reuse for results page light filtering
- `ScholarshipCard` component: Existing card design — extend with match tier badge and compact indicators
- `countries.ts` library: Full ISO mapping, flags, regions — use for nationality and destination dropdowns

### Established Patterns
- Neo-brutalism design: bold borders, high contrast, distinctive shadows — all wizard UI must follow this
- Convex query pattern: server-side filtering with client-side pagination — extend for eligibility matching
- URL-based state: existing filter system uses URL params — same approach for profile sharing
- SSR via TanStack Start: server-rendered meta tags — use for dynamic SEO on results page

### Integration Points
- Homepage: Add 'Check Your Eligibility' CTA button to hero section
- Navigation: Add /eligibility link to main nav
- Directory: 'Browse all scholarships' link from results pre-fills directory filters
- Scholarship detail page: Could show match indicators if profile exists in localStorage

</code_context>

<specifics>
## Specific Ideas

- Live count on each wizard step is a key engagement hook — must feel instant, not laggy
- Results URL encoding should be compact (short param names: n=, d=, f=, dest=) for shareability
- 'Welcome back' flow for returning visitors should feel personalized, not like a form reset
- The wizard should feel like a guided experience, not a boring form — neo-brutalism styling should make each step visually interesting

</specifics>

<deferred>
## Deferred Ideas

- Conversational chat-style eligibility wizard with document upload for analysis — future phase (user's ultimate goal)
- PostHog analytics integration — future phase, abstract analytics layer prepared
- Clerk-backed user profiles — future phase, clean interface designed for migration
- Email alerts for newly matching scholarships — requires user accounts
- Scholarship detail page match indicators (show match status when profile exists) — could be separate enhancement

</deferred>

---

*Phase: 01-eligibility-analysis-funnel*
*Context gathered: 2026-03-24*
