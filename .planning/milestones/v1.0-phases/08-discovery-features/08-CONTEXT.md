# Phase 8: Discovery Features - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Students can discover scholarships through curated collections, compare options side-by-side, and find related scholarships from detail pages. Covers DISC-01 (curated collections), DISC-02 (scholarship comparison), DISC-03 (related scholarships). Includes admin tools for collection management, tag management, auto-tagging pipeline, and all public-facing discovery UI.

</domain>

<decisions>
## Implementation Decisions

### Collection Storage & Schema
- **D-01:** Hybrid storage — hardcoded seed collections stored in Convex table for admin editing without code deploys
- **D-02:** New `collections` Convex table with structured filter criteria fields: host_countries, degree_levels, funding_types, fields_of_study, prestige_tiers, tags (matching directory filter args)
- **D-03:** Filter logic: AND between filter types, OR within each type — same logic as directory listing
- **D-04:** Collections also support time-based criteria: deadline_before, deadline_after, added_since for dynamic collections
- **D-05:** Auto-generated slugs from collection name with admin override for SEO-friendly URLs
- **D-06:** Three statuses: draft (admin preview), active (public), archived (hidden)
- **D-07:** Featured flag — admin can mark 3-5 collections for homepage/directory promotion
- **D-08:** Emoji icon per collection — no file uploads, fits neo-brutalism aesthetic
- **D-09:** Manual sort order — admin controls display priority
- **D-10:** Markdown descriptions with rich text rendering
- **D-11:** Per-collection default sort order (e.g., "Top Fully Funded" → prestige sort, "Closing This Month" → deadline sort). Student can override via sort pills
- **D-12:** Cached scholarship_count field on collection, updated via triggers when scholarships change
- **D-13:** Unique visitor view counter using localStorage ID, debounced (once per session per collection)
- **D-14:** created_at + updated_at timestamps
- **D-15:** Scholarships naturally belong to multiple collections since membership is filter-based
- **D-16:** Live preview in admin — show matching scholarships when editing criteria

### Tag System
- **D-17:** Predefined + freeform tags — ~25-30 predefined tags across 5 categories, admin can create custom freeform tags with autocomplete
- **D-18:** 5 tag categories: Eligibility (no_gre, women_only, developing_countries, open_to_all, undergraduate_only), Subject (stem, arts_humanities, business, social_sciences, health_medical), Duration (short_term, full_degree, summer_program, exchange), Funding (merit_based, need_based, research_grant), Region (europe, asia, americas, africa, middle_east, oceania). 4-6 tags per category
- **D-19:** snake_case internal names + human-readable display labels (e.g., 'no_gre' → 'No GRE')
- **D-20:** Each predefined tag has a short description for tooltips and admin reference
- **D-21:** Tags grouped by category in admin UI
- **D-22:** Tags visible on scholarship detail page only (not on listing cards) — clickable outline badges in hero section, first 5 shown with '+N more' expand
- **D-23:** Subtle outline badges with thin neo-brutalism border, no fill. Tooltip shows tag description on hover/tap
- **D-24:** Tag click navigation: to collection page if matching collection exists, otherwise falls back to tag-filtered directory (/scholarships?tags=stem)
- **D-25:** Region tags (europe, asia, etc.) auto-assigned from scholarship host_country using existing region mapping

### Auto-tagging Pipeline
- **D-26:** Write-time auto-tagging during aggregation — same trigger-wrapped mutation pattern as prestige scoring
- **D-27:** Auto-detect categories (minimum): no_gre, women_only/women_priority, stem, developing_countries. Claude can add more during planning
- **D-28:** Tags flagged as 'suggested' — not auto-confirmed. Admin reviews and accepts/rejects
- **D-29:** Separate `suggested_tags` field on scholarships schema (each entry: { tag, reason, suggested_at }). Accepted tags move to confirmed `tags` field
- **D-30:** Store matched text snippet as reason for each suggestion (auditability)
- **D-31:** Additive only — auto-tagging never removes manually-assigned tags
- **D-32:** Both backfill (one-time migration script) + ongoing (aggregation-time for new data)
- **D-33:** High-confidence matching only for suggestions (exact phrases like "GRE not required")

### Tag Management (Admin)
- **D-34:** Tags input in existing scholarship edit panel — multi-select with autocomplete from existing tags
- **D-35:** Inline tag creation — type new tag name + Enter to create
- **D-36:** Bulk tagging via review queue bulk action (quick) + dedicated Tags tab (power operations with filter-then-tag)
- **D-37:** Suggested tags shown as yellow/amber outline badges in edit panel with accept (checkmark) and reject (X) buttons. Matched snippet on hover
- **D-38:** Tags tab in admin: grouped tag list with counts, filter-then-tag bulk interface, pending suggested tag review section
- **D-39:** Tags tab supports: delete/rename tags with impact warning ("used by N scholarships and M collections"), untagged scholarships filter

### Collection Browsing (Public)
- **D-40:** Dual placement — featured collections row on /scholarships (below FeaturedRow, above results) + full browse page at /collections
- **D-41:** 4-6 featured collections in horizontal scrollable row on /scholarships with 'View all collections →' link
- **D-42:** Navbar: add 'Collections' link alongside existing 'Scholarships' and 'Closing Soon'
- **D-43:** Collection cards: large emoji, bold name, live scholarship count badge, 1-2 line description. Neo-brutalism card with bold border. Grid layout (3-col desktop, 1-col mobile)
- **D-44:** Collection detail page: prominent header (emoji, name, markdown description, count badge) + reused directory scholarship listing with sort pills, grid/list view toggle, pagination
- **D-45:** Copy link button on collection pages — consistent share pattern
- **D-46:** /collections browse page: simple grid of all active collections sorted by admin priority, no filtering
- **D-47:** Empty state with neo-brutalism illustration: "Collections coming soon! Browse all scholarships instead."
- **D-48:** Horizontal scroll for featured collections row on mobile
- **D-49:** Basic page title for /collections: "Scholarship Collections | ScholarHub"
- **D-50:** Scholarship detail page shows which collections it belongs to (as tag badges in hero section)
- **D-51:** Featured collections row on /scholarships — personalization at Claude's discretion
- **D-52:** Sort display on collection detail — Claude's discretion
- **D-53:** Label for tags section in hero — Claude's discretion

### Scholarship Comparison
- **D-54:** Compare entry points: checkbox on directory cards (hover on desktop, always visible on mobile) + 'Add to Compare' button on detail pages. Max 3 selections
- **D-55:** Dedicated comparison page at /scholarships/compare?s=slug1,slug2,slug3 — shareable URL with scholarship slugs
- **D-56:** Session-only state — React context provider, cleared on page refresh
- **D-57:** Difference highlighting — fields that differ between compared scholarships get subtle visual highlight
- **D-58:** Both Apply button + link to detail page per scholarship column
- **D-59:** Search-to-add: if comparing 1-2, 'Add scholarship' button opens search dropdown to find and add another
- **D-60:** Related suggestions below comparison table — 3-4 similar scholarships the student might want to compare next
- **D-61:** Empty state with guidance: "Select 2-3 scholarships to compare side-by-side" + 'Browse scholarships' link + illustration
- **D-62:** Comparison page SEO: indexable by search engines, slug-based URLs, dynamic OG tags with scholarship names, basic Schema.org structured data
- **D-63:** Title format: "X vs Y Scholarship Comparison | ScholarHub" (full names even for 3-way)
- **D-64:** Mobile comparison: horizontal scroll table with sticky first column (field names)
- **D-65:** Single batch Convex query for comparison — one round-trip for all 2-3 scholarships
- **D-66:** Comparison fields and floating compare bar design — Claude's discretion
- **D-67:** Winner/recommendation summary — Claude's discretion

### Related Scholarships (Detail Page)
- **D-68:** Multi-factor scoring: Provider 35%, Country 25%, Degree 15%, Funding 15%, Tags 10%
- **D-69:** Scoring weights admin-configurable — stored in Convex, adjustable via dashboard
- **D-70:** Same provider prioritized — students interested in one provider likely want their full offering
- **D-71:** Proportional degree overlap — PhD+Masters overlapping with Masters only = 50% of degree weight
- **D-72:** Proportional tag overlap — 3 shared tags out of 5 = 60% of tag weight
- **D-73:** 4-6 compact cards showing: title, country flag, deadline badge, funding type, prestige badge (no description snippet)
- **D-74:** "Similar Scholarships" heading
- **D-75:** After Sources section, before footer — last content section on detail page
- **D-76:** Precompute related_ids on write (hybrid): triggers on the changed scholarship + daily cron for reverse updates
- **D-77:** Exclude expired scholarships — only show actionable alternatives
- **D-78:** Deterministic results — same related scholarships each visit, predictable and cacheable
- **D-79:** Compare checkbox on related scholarship cards — same as directory cards, consistent UX
- **D-80:** Empty state for no related scholarships — Claude's discretion

### Admin Navigation
- **D-81:** Extend existing React state-based tab switching — add 'Collections' and 'Tags' tabs alongside 'Review Queue' and 'Sources'
- **D-82:** Collection admin: table list (Name | Status | Scholarships | Sort Order | Actions), slide-out sheet for create/edit (same pattern as EditPanel), bulk actions (archive/activate) reusing BulkActionBar
- **D-83:** Collection admin preview: matching scholarship list in edit form + 'Preview' link to open public view
- **D-84:** Collection ordering method (drag-and-drop vs numeric input) — Claude's discretion

### Routing
- **D-85:** /collections and /collections/$slug — top-level routes, file-based routing (collections/index.tsx, collections/$slug.tsx)
- **D-86:** /scholarships/compare — registered before /$slug catch-all route
- **D-87:** /scholarships?tags=stem,no_gre — tag filter as URL query param on directory

### Performance & Convex Free Tier
- **D-88:** Minimize queries aggressively — caching, precomputation, and batch strategies prioritized
- **D-89:** Debounced view counter — once per session per collection via localStorage
- **D-90:** Cached scholarship_count on collections — updated via triggers
- **D-91:** Precomputed related_ids on scholarships — hybrid trigger + daily cron
- **D-92:** Single query for all collections + cached counts on browse page
- **D-93:** Eager SSR loading for featured collections row via TanStack Start
- **D-94:** Single batch query for comparison page (one round-trip for all scholarships)

### Seed Collections (Launch Set)
- **D-95:** 10 seed collections:
  1. 💰 Top Fully Funded (funding=fully_funded, sort=prestige)
  2. 🌍 Study in Europe (region=europe)
  3. 🌏 Study in Asia (region=asia)
  4. 🌎 Study in North America (region=americas)
  5. 📚 No GRE Required (tags=no_gre)
  6. 🔬 STEM Scholarships (tags=stem)
  7. 🏆 Government Scholarships (tag-based)
  8. 👩‍🎓 For Women (tags=women_only)
  9. ⏳ Closing This Month (deadline-based)
  10. ✨ Recently Added (added_since-based)
- **D-96:** First 5-6 collections marked as featured on /scholarships page
- **D-97:** Context-appropriate default sort per collection

### Accessibility
- **D-98:** WCAG AA comparison table with semantic `<table>`, proper `<th>` scope attributes, ARIA labels
- **D-99:** Full keyboard support for compare checkboxes — Tab focusable, Space/Enter toggleable
- **D-100:** ARIA live region (aria-live='polite') on compare bar for screen reader announcements
- **D-101:** Focusable collection cards with visible focus indicators
- **D-102:** Respect prefers-reduced-motion for all animations

### Dark Mode
- **D-103:** Comparison table uses existing CSS vars with muted difference highlights in dark mode
- **D-104:** Compare bar matches sticky bar and FilterPanel dark mode patterns
- **D-105:** Tag outline badges: light border on dark background

### Error Handling & Loading
- **D-106:** Inline error + retry pattern — consistent with directory
- **D-107:** Missing compare scholarships: show available ones + warning banner
- **D-108:** Content-shaped skeleton loading for all new pages (grid, table, card shapes)

### Testing
- **D-109:** Full coverage — backend logic tests (auto-tagging rules, related scoring algorithm, collection filter matching, comparison batch query) + UI component tests (CollectionCard, ComparisonTable, CompareBar, TagBadge, etc.)

### Mobile
- **D-110:** Fixed bottom compare bar on mobile
- **D-111:** Single column collection cards on mobile browse page
- **D-112:** Tags wrap (flex-wrap) in hero on mobile

### SEO Prep for Phase 9
- **D-113:** Route structure + basic meta titles only in Phase 8. Structured data, OG images, auto-generated meta descriptions, sitemap inclusion deferred to Phase 9

### Claude's Discretion
- Collection ordering method (drag-and-drop vs numeric input)
- Comparison fields selection and comparison bar design
- Winner/recommendation summary on compare page
- Featured collections row personalization by nationality
- Sort display label on collection detail page
- Tags section label in hero (with or without "Tags:" label)
- Empty state for no related scholarships (hide section vs show message)
- Additional auto-tag categories beyond the initial 4

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — DISC-01 (curated collections), DISC-02 (comparison), DISC-03 (related scholarships)
- `.planning/ROADMAP.md` — Phase 8 success criteria and dependencies

### Prior phase context
- `.planning/phases/06.1-country-eligibility-filtering-university-tier-list-prestige-highlighting/06.1-CONTEXT.md` — Directory design decisions, prestige system, neo-brutalism patterns, copy link pattern, eligibility filter, URL state management, FeaturedRow, filter panel, card/badge CVA variants
- `.planning/phases/07-scholarship-detail-page/07-CONTEXT.md` — Detail page sections, sticky bar, breadcrumb, hero section, editorial tips, sources section, Schema.org JSON-LD

### Existing implementation
- `web/convex/schema.ts` — Scholarships table with `tags` field (optional string array), prestige fields, search index, all validators. New `collections` table to be added
- `web/convex/directory.ts` — listScholarships query with full search/filter/sort/pagination. Collection detail pages reuse this query pattern
- `web/convex/prestige.ts` — Prestige scoring with `scoreCompetitiveness(tags)`. Auto-tagging follows same write-time trigger pattern
- `web/convex/triggers.ts` — Trigger-wrapped mutations for auto-computing prestige/search_text. Auto-tagging and related_ids use same pattern
- `web/convex/admin.ts` — Admin mutations (approve, reject, edit, bulk ops, trust levels). Extend with collection CRUD, tag management, suggested tag review
- `web/src/components/directory/ScholarshipCard.tsx` — Card component to extend with compare checkbox
- `web/src/components/directory/ScholarshipListItem.tsx` — List view component to extend with compare checkbox
- `web/src/components/directory/FeaturedRow.tsx` — Featured scholarships row. Collections row follows same horizontal scroll pattern
- `web/src/components/detail/HeroSection.tsx` — Hero section to extend with tag badges
- `web/src/components/detail/SourcesSection.tsx` — Last current section. "Similar Scholarships" section added after this
- `web/src/routes/scholarships/$slug.tsx` — Detail page route. Add related scholarships section
- `web/src/routes/scholarships/index.tsx` — Directory route. Add featured collections row
- `web/src/components/admin/` — Admin components. Add Collections tab, Tags tab
- `web/src/components/ui/badge.tsx` — Badge with 9 variants. Extend with tag outline variant
- `web/src/lib/regions.ts` — Region grouping helpers for auto-assigning region tags from host_country
- `web/src/index.css` — Neo-brutalism design system. Add tag badge, compare bar, collection card styles

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ScholarshipCard.tsx` / `ScholarshipListItem.tsx`: Extend with compare checkbox overlay
- `FeaturedRow.tsx`: Horizontal scroll pattern for featured collections row
- `badge.tsx`: Extend with tag outline variant (thin border, no fill)
- `card.tsx`: Card with prestige CVA variants — reuse for collection cards
- `filters.ts`: Deadline urgency helpers — reuse for comparison table deadline display
- `prestige.ts` (lib): Prestige label/tooltip helpers — reuse in comparison table
- `countries.ts`: Country flag/name helpers — reuse in comparison table and related cards
- `regions.ts`: Region grouping — reuse for auto-assigning region tags
- `BulkActionBar` pattern: Reuse for collection bulk operations and tag bulk action in review queue
- `EditPanel` pattern: Slide-out sheet for collection create/edit form
- `EmptyState.tsx`: Neo-brutalism empty state — reuse for collections browse, comparison empty state
- `SkeletonCard.tsx`: Skeleton loading pattern — create matching skeletons for new pages

### Established Patterns
- CVA (class-variance-authority) for component variants — use for collection cards, tag badges
- Convex trigger-wrapped mutations — use for auto-tagging, related_ids precomputation, collection count updates
- React state for admin view switching — extend with Collections and Tags tabs
- Convex `v.union(v.literal())` for enum validators — use for collection status validator
- TanStack Router file-based routing — create collections/index.tsx, collections/$slug.tsx, scholarships/compare.tsx
- localStorage for session-level state — use for compare debounce and view counter
- Copy link pattern from ScholarshipCard/StickyBar — reuse for collection and comparison pages

### Integration Points
- Convex scholarships.tags field → collection auto-population, tag display on detail page
- Convex aggregation pipeline → auto-tagging at write time
- /scholarships route → featured collections row insertion
- /scholarships/$slug detail page → related scholarships section, tag badges in hero
- Admin dashboard → Collections tab, Tags tab, tag bulk action in review queue
- Navbar → add 'Collections' link
- URL query params → /scholarships?tags= for tag-filtered directory view

</code_context>

<specifics>
## Specific Ideas

- Collections should feel like curated playlists — "Top Fully Funded 2026" is a playlist of the best fully funded scholarships, auto-updated as new ones are published
- Compare feature should feel like price comparison sites — clear table, highlighted differences, easy to spot which scholarship offers more
- Suggested tags with yellow badges and accept/reject is like a smart assistant that pre-screens scholarships for the admin
- "Similar Scholarships" section at the bottom of detail pages encourages deeper exploration — student reads about DAAD, sees other German scholarships they might also like
- Emoji icons on collections add personality without complexity — fits neo-brutalism's bold, unapologetic aesthetic
- Filter-then-tag bulk interface lets admin retroactively tag hundreds of existing scholarships efficiently

</specifics>

<deferred>
## Deferred Ideas

- Full collection SEO (structured data, OG images, auto-generated meta descriptions, sitemap) — Phase 9
- Data-driven popular destinations (query Convex for most-scholarship countries) — future enhancement
- PostHog analytics for collection views/clicks — v2
- Student accounts for saving/bookmarking collections — v2 (ACCT requirements)
- AI-powered auto-tagging with LLM analysis — future enhancement, keyword matching for now
- Collection recommendations based on browsing history — requires student accounts
- Collaborative comparison (share + annotate comparisons) — future enhancement

</deferred>

---

*Phase: 08-discovery-features*
*Context gathered: 2026-03-23*
