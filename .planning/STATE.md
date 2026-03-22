---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
stopped_at: Completed 05-02-PLAN.md
last_updated: "2026-03-22T09:01:34.206Z"
last_activity: 2026-03-22
progress:
  total_phases: 11
  completed_phases: 7
  total_plans: 33
  completed_plans: 29
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-20)

**Core value:** Students can discover every relevant international scholarship in one place, with reliable, enriched information they can't easily find elsewhere.
**Current focus:** Phase 05 — admin-dashboard

## Current Position

Phase: 05 (admin-dashboard) — EXECUTING
Plan: 2 of 5

## Performance Metrics

**Velocity:**

- Total plans completed: 3
- Average duration: 10.7min
- Total execution time: 0.53 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 2 | 25min | 12.5min |

**Recent Trend:**

- Last 5 plans: 01-01(11min), 01-02(14min), 02-01(7min), 02-02(4min)
- Trend: accelerating

*Updated after each plan completion*
| Phase 02 P01 | 7min | 2 tasks | 12 files |
| Phase 02 P02 | 4min | 2 tasks | 7 files |
| Phase 02 P03 | 7min | 1 tasks | 5 files |
| Phase 03 P01 | 6min | 2 tasks | 19 files |
| Phase 03 P02 | 7min | 2 tasks | 14 files |
| Phase 03 P03 | 7min | 2 tasks | 12 files |
| Phase 03 P04 | 4min | 2 tasks | 6 files |
| Phase 03 P05 | 7min | 2 tasks | 8 files |
| Phase 03 P06 | 4min | 2 tasks | 203 files |
| Phase 03 P07 | 6min | 2 tasks | 6 files |
| Phase 03 P09 | 1min | 1 tasks | 3 files |
| Phase 03 P08 | 3min | 2 tasks | 3 files |
| Phase 06.1 P01 | 9min | 2 tasks | 8 files |
| Phase 06.1 P02 | 9min | 3 tasks | 8 files |
| Phase 06.1 P04 | 5min | 2 tasks | 8 files |
| Phase 06.1 P03 | 5 | 3 tasks | 5 files |
| Phase 06.1 P06 | 10min | 2 tasks | 8 files |
| Phase 06.1 P05 | 5min | 3 tasks | 9 files |
| Phase 06.1 P07 | 5min | 2 tasks | 18 files |
| Phase 07 P01 | 9min | 3 tasks | 7 files |
| Phase 07 P02 | 4min | 3 tasks | 10 files |
| Phase 07 P03 | 2min | 1 tasks | 2 files |
| Phase 10 P01 | 3min | 2 tasks | 6 files |
| Phase 10 P02 | 2min | 2 tasks | 4 files |
| Phase 04 P01 | 2min | 2 tasks | 3 files |
| Phase 04 P02 | 6min | 2 tasks | 4 files |
| Phase 05 P02 | 3min | 2 tasks | 7 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: Scraping/data phases (1-4) come before any frontend work -- real data first
- [Roadmap]: UIDX-04 (frontend-design skill) assigned to Phase 5 as first UI phase
- [Roadmap]: INFR-04 (monitoring) grouped with scraping pipeline, not as separate phase
- [Roadmap]: Source discovery is its own phase -- catalog must exist before scraping begins
- [01-01]: Used v.union(v.literal()) for all Convex enum validators -- runtime + compile-time safety
- [01-01]: Excluded auto-generated routeTree.gen.ts from Biome checks
- [01-01]: Added hatchling build system for Python package to enable proper imports
- [01-02]: Created neobrutalism components manually from registry source since shadcn CLI lacked --registry flag
- [01-02]: Added @ path alias in tsconfig and vite for shadcn import conventions
- [01-02]: Exported HomePage for direct test import rather than accessing via Route.options.component
- [Phase 02]: Used anyApi from convex/server with import.meta.glob for convex-test since codegen requires auth
- [Phase 02]: Created convex/_generated files manually for type-safe testing without live deployment
- [Phase 02]: Added rss as 4th scrapeMethodValidator option for RSS/Atom feed sources
- [02-02]: Added scripts/ ruff T20 ignore for CLI print output
- [02-02]: Region mapping covers 40+ countries to 6 high-level regions for stats aggregation
- [Phase 02]: 201 sources cataloged across 4 categories (aggregators, official_programs, government, foundations) with wave-based organization
- [Phase 03]: Used runtime_checkable Protocol for SourceConfig to allow isinstance checks at config discovery time
- [Phase 03]: All scraping mutations use internalMutation -- called via admin auth from Python SDK
- [Phase 03]: Added jsonld and ajax to scrapeMethodValidator for full method hierarchy
- [Phase 03]: HMAC-SHA256 webhook verification using Web Crypto API for Convex runtime compatibility
- [Phase 03-02]: Used dayfirst=True in dateutil parser for DD/MM/YYYY international date formats
- [Phase 03-02]: Script/style tag content stripped via regex before bleach processing for defense-in-depth sanitization
- [Phase 03-02]: Country normalization uses manual overrides dict before pycountry fuzzy search for common variants
- [Phase 03-03]: All scrapers are config-driven via SourceConfig protocol -- no per-source spider classes needed
- [Phase 03-03]: AJAX method aliases to ApiScraper since AJAX endpoints serve JSON like REST APIs
- [Phase 03-03]: Test mocking uses real Scrapling Selector for CSS parsing while mocking HTTP fetch layer
- [Phase 03-04]: RotDetector alerts exactly at consecutive_failures == 5 to prevent duplicate GitHub Issues
- [Phase 03-04]: Error types 404/410 trigger immediate source deactivation as permanent-gone indicators
- [Phase 03-04]: HeartbeatMonitor delegates staleness check to Convex query rather than client-side calculation
- [Phase 03-06]: Used field(default_factory=lambda: {...}) for mutable dict defaults instead of __post_init__ pattern
- [Phase 03-06]: Mastercard Foundation Scholars Program duplicate name resolved with _fnd suffix on source_id
- [Phase 03-05]: Pipeline groups sources by method (api, jsonld, ajax, rss, scrape, scrapling) for efficient batch execution
- [Phase 03-05]: CLI uses lazy imports inside click commands to avoid loading Convex client for --help and dry-run
- [Phase 03-05]: LocalBuffer doubles as dry-run output store and Convex downtime resilience layer
- [Phase 03-06]: Auth-required sources get full config files with auth_config flag; pipeline runner skips them
- [Phase 03-07]: Workflow dispatch inputs passed via env vars for GitHub Actions injection safety
- [Phase 03-07]: Seed script uses batch insert pattern (50 records/call) matching pipeline behavior
- [Phase 03-09]: RssScraper updated to check selectors['feed_url'] as override since config.url is the listing page for fallback scraping
- [Phase 03-08]: updateSourceHealth mutation now returns {consecutive_failures, github_issue_number} for runner decision logic
- [Phase 06.1]: Replaced TanStackRouterVite with tanstackStart() plugin for SSR support
- [Phase 06.1]: Deleted index.html and main.tsx - HTML shell rendered by __root.tsx in SSR
- [Phase 06.1]: ConvexProvider wraps QueryClientProvider in root for reactive + SSR query support
- [Phase 06.1]: Prestige scoring uses 4 weighted factors: funding(40%), provider(30%), country(20%), competitiveness(10%)
- [Phase 06.1]: Write-time triggers via convex-helpers Triggers pattern auto-recalculate prestige on every scholarship write
- [Phase 06.1]: Search index replaced: search_title_description -> search_scholarships on denormalized search_text field
- [Phase 06.1]: Card uses CVA cardVariants with prestige prop for gold/silver/bronze/unranked background tints
- [Phase 06.1]: Badge extended with 9 new variants: 3 prestige, 4 urgency, new (pulse), limitedInfo
- [Phase 06.1]: Installed lucide-react for icon components (Sun/Moon/Menu/Copy/ArrowUp) across directory UI
- [Phase 06.1]: Dual query path: search index for text search, compound indexes for non-search listing
- [Phase 06.1]: Multi-select funding type: single value pushed to search index, multi-value post-filtered
- [Phase 06.1]: Nationality eligibility uses post-filter because Convex filter expressions cannot do array.includes
- [Phase 06.1]: Manual cursor pagination for search results since Convex search index returns all via collect()
- [Phase 06.1]: Homepage redirects to /scholarships via TanStack Router beforeLoad throw redirect
- [Phase 06.1]: Schema.org JSON-LD uses @type Scholarship with provider, studyLocation, eligibleRegion, MonetaryAmount
- [Phase 06.1]: Phase 9 route placeholders use prefixed paths /scholarships/country/$country and /scholarships/degree/$degree to avoid $slug collision
- [Phase 06.1]: Error boundary wraps results area with inline retry, not full-page error
- [Phase 06.1]: CountrySelector uses Radix Popover (not Select) for multi-select with checkbox indicators and searchable list
- [Phase 06.1]: EligibilityFilterBar compact mode auto-activates when both nationality and destinations are set
- [Phase 06.1]: FilterPanel uses Radix Dialog as bottom sheet on mobile with slide-in-from-bottom animation
- [Phase 06.1]: QuickFilters "Open Now" is derived state (absence of closing_soon and show_closed)
- [Phase 07]: Broadened formatFundingAmount param type to inline object for cross-component reuse
- [Phase 07]: getScholarshipDetail is a new query alongside getBySlug for backward compatibility
- [Phase 07]: useCountdown initializes to null for SSR hydration safety; useIsHeroVisible defaults to true to avoid sticky bar flash
- [Phase 07]: HowToApplySection uses useEffect+useState for timezone display to avoid SSR hydration mismatch
- [Phase 07]: EditorialTips restricts react-markdown to safe elements via allowedElements whitelist (p, strong, em, a, ul, ol, li)
- [Phase 07]: StickyBar visibility inverted: visible=true means hero IS visible so bar hides via -translate-y-full
- [Phase 07]: Updated generated api.ts to include directory module for typed api import replacing anyApi pattern
- [Phase 10]: Dedicated InertiaScraper class for Inertia.js two-step protocol (version fetch + JSON pagination)
- [Phase 10]: map_study_australia_record as module-level helper for direct testing and reuse
- [Phase 10]: Scholarships config uses populated field_mappings from research (not empty dict from plan) to pass existing test_all_configs_have_field_mappings
- [Phase 10]: Provider config separate from scholarships for independent scrape frequency and future enrichment
- [Phase 04]: 3-field match key (title|org|country) with separate degree overlap check per D-01/Pitfall 4
- [Phase 04]: Pure helper functions separated from Convex mutations for testability without convex-test
- [Phase 04]: parseDeadlineToTimestamp bridges string-to-number gap for raw_records deadline field
- [Phase 04]: Year-aware cycle detection: same match_key + different year creates separate scholarship entries with previous_cycle_id link instead of merging
- [Phase 04]: take() instead of paginate() for unpromoted raw_records: canonical_id set during processing invalidates cursor-based pagination
- [Phase 04]: Trigger-wrapped internalMutation via customMutation(rawInternalMutation, customCtx(wrapDB)) for auto-computing prestige/search_text on aggregation writes
- [Phase 05]: Inline dark mode toggle in AdminHeader matching Navbar pattern, no separate useTheme hook
- [Phase 05]: Updated generated api.d.ts to include admin module for TypeScript compatibility

### Pending Todos

None yet.

### Roadmap Evolution

- Phase 06.1 inserted after Phase 06: Country eligibility filtering, university tier list, prestige highlighting (INSERTED)
- Phase 10 added: Study Australia scrapers — remove broken scrapers, build comprehensive scrapers for scholarships/careers/providers/courses

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260321-i17 | Build Japan scholarship scrapers (studyinjapan.go.jp CSV + jpss.jp HTML) | 2026-03-21 | bf8b5dc | [260321-i17-build-japan-scholarship-scrapers-for-stu](./quick/260321-i17-build-japan-scholarship-scrapers-for-stu/) |
| 260322-hcw | Demote published scholarships with missing important info to pending_review | 2026-03-22 | 36f6528 | [260322-hcw-demote-public-scholarships-with-missing-](./quick/260322-hcw-demote-public-scholarships-with-missing-/) |
| 260322-hky | Fix desktop pagination to replace content instead of appending | 2026-03-22 | 8740ff2 | [260322-hky-fix-desktop-pagination-to-replace-conten](./quick/260322-hky-fix-desktop-pagination-to-replace-conten/) |

### Blockers/Concerns

- Scrapling spider framework is new (v0.4, Feb 2026) -- limited production reports at 1000+ source scale. Validate during Phase 3.
- Convex free tier (1M function calls/month) may be consumed by real-time subscriptions + scraping ingestion + admin + public traffic. Monitor from Phase 1.
- SEO for SPA may require SSR/SSG solution (TanStack Start or pre-rendering). Research needed before Phase 9.

## Session Continuity

Last session: 2026-03-22T09:01:34.203Z
Last activity: 2026-03-22
Stopped at: Completed 05-02-PLAN.md
Resume file: None
