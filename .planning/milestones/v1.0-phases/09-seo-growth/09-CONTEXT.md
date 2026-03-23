# Phase 9: SEO & Growth - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Scholarship pages are discoverable by search engines with proper structured data, and auto-generated landing pages drive organic traffic for country and degree-level searches. This phase enhances existing pages with rich Schema.org markup, builds technical SEO infrastructure (sitemap, robots.txt, canonicals, OG images), enriches landing page content for uniqueness, and adds analytics tracking.

</domain>

<decisions>
## Implementation Decisions

### Structured Data
- **D-01:** Full Schema.org suite — Scholarship + BreadcrumbList on all pages, FAQPage on landing pages, ItemList on collection/directory pages, Organization on homepage
- **D-02:** Collection pages (/collections/$slug) get ItemList markup with scholarship entries; comparison pages get ItemList for compared items
- **D-03:** Landing pages (country/degree) get auto-generated FAQ structured data with 3-5 data-driven questions (e.g., "How many scholarships in Germany?", "What degree levels available?")
- **D-04:** Scholarship detail page JSON-LD enhanced with: provider as Schema.org Organization (name, URL, country), eligibleRegion + educationalLevel + eligibilityDescription fields, applicationDeadline + application URL, BreadcrumbList (Home > Scholarships > Country > Scholarship Name)

### Landing Page SEO Strategy
- **D-05:** Dynamic stats + templated prose for content uniqueness — each page gets unique intro paragraph with real stats ("47 scholarships in Germany, 12 fully funded"), plus curated sections
- **D-06:** Cross-link sections on all landing pages — each country page links to related countries and relevant degree pages; each degree page links to top countries for that degree
- **D-07:** Page scope: Top 20 countries by scholarship count + all degree levels. Pages only for countries/degrees with at least some data presence

### Technical SEO Infrastructure
- **D-08:** Sitemap.xml — build-time static generation from Convex data during deploy. Includes all scholarship detail pages, landing pages, and collection pages
- **D-09:** Robots.txt — allow all public pages, disallow admin routes, reference sitemap location
- **D-10:** Canonical URLs — rel=canonical on all pages to prevent duplicate content from query params (?sort=, ?tags=, etc.)
- **D-11:** Open Graph + Twitter Cards — dynamic per-page OG images generated with title + key info overlaid (using satori or @vercel/og equivalent). All public pages get og:title, og:description, og:image, twitter:card meta tags
- **D-12:** Static HTML generation at build time for all landing pages — crawlers get pre-rendered HTML, fastest possible crawl experience

### URL Structure
- **D-13:** Country URLs use lowercase full names: /scholarships/country/germany, /scholarships/country/united-states (human-readable, SEO-friendly)
- **D-14:** Degree URLs use common search terms at top level: /scholarships/phd, /scholarships/masters, /scholarships/bachelors (matches user search behavior, short clean URLs)

### Content Uniqueness
- **D-15:** Each auto-generated landing page gets: unique stat summary (count, funding types, deadlines), 2-3 sentence templated intro with real data interpolated, auto-generated FAQ section, and cross-links
- **D-16:** Meta descriptions auto-generated with data templates: "Discover {count} scholarships in {country} for {year}. {top_funding_type} options available for {degree_levels}." Unique per page, scales automatically

### Performance & Rendering
- **D-17:** Lighthouse SEO score target: 90+ on all page types. Verified during phase verification
- **D-18:** Static HTML generation at build time for landing pages (country, degree) — requires build-time Convex data access

### Language & i18n
- **D-19:** English-only content, but add hreflang="en" tags as future-proofing. Minimal effort, signals language intent to Google

### Analytics & Tracking
- **D-20:** Google Search Console verification meta tag
- **D-21:** Google Analytics 4 setup for organic traffic tracking
- **D-22:** Structured data validation monitoring (Google Rich Results Test compatibility)

### OG Image Strategy
- **D-23:** Dynamic per-page OG images — scholarship pages show title + funding type + country flag, landing pages show country/degree + scholarship count, collection pages show collection name + emoji

### Claude's Discretion
- OG image generation library choice (satori, @vercel/og, or alternative for Netlify/non-Vercel stack)
- Exact templated prose wording for landing page intros
- FAQ question selection algorithm (which questions are most useful per page)
- Sitemap priority/changefreq values
- GA4 event tracking specifics beyond pageview

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing SEO Implementation
- `web/src/routes/scholarships/$slug.tsx` — Existing Schema.org JSON-LD (buildScholarshipJsonLd), meta title builder, head() pattern
- `web/src/routes/scholarships/country/$country.tsx` — Existing country landing page with meta tags and head() pattern
- `web/src/routes/scholarships/degree/$degree.tsx` — Existing degree landing page
- `web/src/routes/scholarships/compare.tsx` — Comparison page with basic meta

### Data Sources
- `web/src/lib/countries.ts` — Country name/flag utilities (getCountryName, getCountryFlag)
- `web/src/lib/country-data.ts` — Country-specific data (getCountryData)
- `web/convex/directory.ts` — Scholarship listing queries (data source for stats)
- `web/convex/collections.ts` — Collection queries (for ItemList markup)

### Layout & Components
- `web/src/routes/__root.tsx` — Root layout, provider wiring, global head config
- `web/src/components/layout/Navbar.tsx` — Navigation (breadcrumb source)
- `web/src/index.css` — Design tokens and CSS variables

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `buildScholarshipJsonLd()` in $slug.tsx — extend with provider, eligibility, application fields
- `buildMetaTitle()` in $slug.tsx — pattern for generating SEO titles
- TanStack Router `head()` function — established meta injection pattern
- `getCountryName()` / `getCountryFlag()` — country data utilities for templates
- `getCountryData()` — structured country info for landing page content

### Established Patterns
- TanStack Router `head: () => ({ meta: [...] })` for route-level meta tags
- JSON-LD injected via `<script type="application/ld+json">` in component body
- Convex queries for real-time data (scholarship counts, filters)

### Integration Points
- Country route: /scholarships/country/$country.tsx — enhance with richer content + structured data
- Degree route: /scholarships/degree/$degree.tsx — same enhancements
- Detail route: /scholarships/$slug.tsx — extend JSON-LD
- Root layout: __root.tsx — add global OG defaults, canonical, hreflang
- Build pipeline: Netlify build — add sitemap generation step
- Collections: /collections/$slug.tsx — add ItemList structured data

</code_context>

<specifics>
## Specific Ideas

- Dynamic OG images should show scholarship-specific info (title, funding type, country flag) — not just generic branding
- FAQ questions should be data-driven from actual scholarship data (counts, types, deadlines) — not static placeholder text
- Cross-linking should create a "web" of related pages (country ↔ degree ↔ collections) for topical authority
- Degree URLs at /scholarships/phd level (not nested under /degree/) for cleaner URLs matching search intent

</specifics>

<deferred>
## Deferred Ideas

- Multi-language content and full i18n routing (hreflang prep only in this phase)
- PostHog analytics integration (separate from GA4)
- AI-generated unique content per landing page (beyond templates)
- Social media auto-posting on new scholarships
- Google News / Discover optimization
- AMP pages for mobile search

</deferred>

---

*Phase: 09-seo-growth*
*Context gathered: 2026-03-23*
