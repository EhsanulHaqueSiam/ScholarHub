# Phase 7: Scholarship Detail Page - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the complete scholarship detail view replacing the current placeholder. Each scholarship gets a comprehensive page showing all information a student needs to decide whether and how to apply — name, provider, eligibility, funding breakdown, deadline, application link, source attribution, and editorial tips. Related scholarships (DISC-03) belong to Phase 8.

</domain>

<decisions>
## Implementation Decisions

### Page layout & structure
- **Single scroll with card-based sections** — one continuous page with clear section headers: Overview, Eligibility, Funding, How to Apply, Sources
- Each section is a neo-brutalism card with bold borders
- **Section order**: Hero → Overview (description) → Eligibility (nationalities, degrees, fields) → Funding (breakdown, amount) → How to Apply (deadline, link, editorial tips) → Sources (attribution, verification)
- **No related scholarships** — that's Phase 8 (DISC-03)

### Hero section (above the fold)
- **Full hero with key decision info**: title, provider, prestige badge, country flag, deadline with urgency badge, degree levels, funding type
- Everything a student needs for a quick decision visible without scrolling
- Large prominent Apply button in hero area

### Sticky top bar
- **Slim bar sticks to top** as user scrolls, showing truncated scholarship name + Copy Link button + Apply Now button
- **Same behavior on desktop and mobile** — sticks to top on both, title truncates on small screens
- Appears after scrolling past the hero section

### Navigation
- **Breadcrumb-style back navigation** at the top: "Scholarships > PhD > Germany > DAAD Scholarship"
- Clicking breadcrumb segments goes back to filtered directory with state preserved from URL params

### Deadline & timezone display
- **Date + countdown + urgency badge**: "March 31, 2026 (12 days left)" with red/amber/green urgency badge
- **Timezone dual display**: show deadline in scholarship's timezone (e.g., "11:59 PM CET") with student's local equivalent ("That's 5:59 AM your time (UTC+6)") via browser timezone
- **Expired deadlines**: "Applications Closed" with expected reopen month if available ("Expected to reopen: September 2026")

### Eligibility nationalities display
- **Show first 10 nationalities** with flag emojis, then "+ 25 more countries" as clickable expand
- Expanded view shows full list grouped by region
- **"Open to All" scholarships**: prominent banner "Open to All Nationalities — Students from any country are eligible to apply" — no country list needed

### Funding breakdown display
- **Checklist with icons** for coverage: green checkmark for covered, grey X for not covered, dash for unknown
- Coverage items: Tuition, Living Allowance, Travel, Insurance
- **Award amount with range**: "$15,000 - $25,000 EUR per year" with period label. Fixed amounts show single value. No data shows "Varies by program"
- **Missing data handling**: show funding type badge prominently, coverage checklist shows dash for unknown items with "Not specified" label for null booleans

### Source attribution & trust signals
- **Footer section, low-key** — "Sources" card at bottom of page
- Source names as **clickable links** to original source pages (opens in new tab)
- **Source count as trust signal**: "Compiled from 3 sources"
- **Last verified** in relative + absolute format: "Verified 5 days ago (March 15, 2026)"
- **Stale data warning**: amber highlight if >30 days since verification with "This data may be outdated" note

### Editorial notes & tips
- **Callout box** styled distinctly with neo-brutalism bold border, different background, lightbulb icon
- Labeled "ScholarHub Tips" or "Editor's Notes"
- Positioned **inside the "How to Apply" section** — most actionable near application info
- **Rich text support** — store as markdown in `editorial_notes` field, render with simple markdown parser (bold, links, bullet lists)
- **When absent**: show subtle placeholder "Tips coming soon" — sets expectation for future content

### Copy/share
- **Copy link only** — no social share buttons (WhatsApp paste-a-link decided in Phase 06.1)
- Copy Link button lives **in the sticky top bar** next to Apply Now — always accessible while scrolling

### SEO & meta tags
- **Structured meta title**: "{Title} — {Funding Type} {Degree} Scholarship in {Country} | ScholarHub"
- **Expand Schema.org JSON-LD fully** — add eligibility details, degree levels, fields of study, funding breakdown, source attribution, and deadline timezone beyond what the placeholder already has

### Claude's Discretion
- Exact neo-brutalism card styling for each section
- Loading skeleton design for the detail page
- Exact spacing and typography hierarchy
- Dark mode adaptation for detail page sections
- Breadcrumb truncation strategy on mobile
- How to detect/handle deadline timezone when not stored in database
- Markdown parser library choice for editorial notes
- Region grouping logic for expanded nationality list

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — DTLP-01 through DTLP-11 (scholarship detail page requirements)
- `.planning/ROADMAP.md` — Phase 7 success criteria and dependency on Phase 06.1

### Prior phase context
- `.planning/phases/06.1-country-eligibility-filtering-university-tier-list-prestige-highlighting/06.1-CONTEXT.md` — Directory design decisions, prestige system, neo-brutalism patterns, copy link pattern, eligibility filter, country display conventions

### Existing implementation
- `web/src/routes/scholarships/$slug.tsx` — Current placeholder detail page with getBySlug query, JSON-LD, loading/404 states, prestige badge, country flag
- `web/src/components/directory/ScholarshipCard.tsx` — Reusable helpers: formatFundingAmount, formatFundingType, urgency maps, copy link pattern
- `web/convex/schema.ts` — Scholarships table with all needed fields (funding coverage booleans, award amounts, editorial_notes, source_ids, last_verified, eligibility_nationalities)
- `web/src/lib/prestige.ts` — Prestige label/tooltip helpers
- `web/src/lib/countries.ts` — Country flag/name helpers
- `web/src/lib/filters.ts` — Deadline urgency and isNew helpers
- `web/src/components/ui/card.tsx` — Card component with prestige CVA variants
- `web/src/components/ui/badge.tsx` — Badge with prestige/urgency/new/limitedInfo variants
- `web/src/components/layout/Navbar.tsx` — Shared navbar component
- `web/src/index.css` — Neo-brutalism design system (oklch colors, Archivo Black/Inter fonts, 2px borders, 4px shadows)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ScholarshipCard.tsx`: `formatFundingAmount()`, `formatFundingType()`, urgency variant/label maps, `hasLimitedInfo()` — extract to shared lib for reuse in detail page
- `card.tsx`: Card with prestige CVA variants (gold/silver/bronze/unranked background tints) — reuse for section cards
- `badge.tsx`: 9 variants (3 prestige, 4 urgency, new, limitedInfo) — reuse all on detail page
- `countries.ts`: `getCountryFlag()`, `getCountryName()` — reuse for nationality list display
- `filters.ts`: `getDeadlineUrgency()`, `isNew()` — reuse for deadline display
- `prestige.ts`: `getPrestigeLabel()`, `getPrestigeTooltip()` — reuse in hero
- Navbar and BackToTop components — reuse as-is
- Copy link pattern from ScholarshipCard — reuse for sticky bar

### Established Patterns
- CVA (class-variance-authority) for component variants
- Convex `anyApi` for untyped queries (used in placeholder)
- TanStack Router `createFileRoute` with `head()` for meta tags
- Schema.org JSON-LD via script tag with trusted DB content for SEO structured data
- `cn()` utility for conditional class merging
- Lucide React icons (Check, Copy, Sun, Moon, Menu, ArrowUp already installed)

### Integration Points
- `convex/directory.ts` → `getBySlug` query already exists — may need to join source names for attribution
- `scholarships.source_ids` → need to resolve to source names/URLs for attribution display
- TanStack Router params → `$slug` route already wired
- URL query params from directory → breadcrumb reconstruction

</code_context>

<specifics>
## Specific Ideas

- Sticky bar should feel like job listing sites (Indeed, LinkedIn Jobs) — always-accessible apply action
- Funding checklist should be scannable at a glance — green/red/grey immediately communicates coverage
- "ScholarHub Tips" callout should feel like insider knowledge — a friend who applied before giving you advice
- Nationality display with flag emojis continues the pattern from directory cards — consistent visual language
- "Compiled from 3 sources" is a quiet trust signal — implies thoroughness without being boastful
- Placeholder "Tips coming soon" when no editorial notes — sets expectation that ScholarHub adds value beyond aggregation

</specifics>

<deferred>
## Deferred Ideas

- Related scholarships on detail page — Phase 8 (DISC-03)
- Social share buttons (Twitter, Facebook, LinkedIn) — decided copy-link-only in Phase 06.1
- Student accounts for saving/bookmarking scholarships — v2 (ACCT requirements)
- Application tracking features — out of scope per REQUIREMENTS.md

</deferred>

---

*Phase: 07-scholarship-detail-page*
*Context gathered: 2026-03-20*
