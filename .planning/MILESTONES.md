# Milestones

## v1.0 MVP (Shipped: 2026-03-23)

**Phases completed:** 10 phases, 45 plans, 95 tasks

**Key accomplishments:**

- Vite+React+TanStack Router+Tailwind v4+Convex web scaffold with 3-table schema (sources, raw_records, scholarships), Python/Scrapy scraping environment, and Vitest/Biome/Ruff tooling
- Neo-brutalism "Coming Soon" placeholder with shadcn Card/Badge/Button components, 4 HomePage unit tests, and GitHub Actions CI/CD (lint+typecheck on PRs, deploy on push to main)
- Convex schema extended with wave/auth/api fields, upsertSource mutation with URL-based upsert, JSON Schema (Draft 2020-12) validation, and full TDD test coverage via convex-test and pytest
- Three CLI scripts (seed, validate, stats) for source catalog workflow with async URL validation, JSON Schema CI enforcement, and TDD test coverage
- 201 scholarship sources across 4 JSON files (46 aggregators, 78 official programs, 47 government, 30 foundations) with MUST_HAVE.md tracking 27 essential sources, all passing JSON Schema validation
- Scrapling-based Python package with SourceConfig protocol, 4 new Convex tables for run tracking/health/change-log, batch upsert mutations, dashboard queries, cron cleanup, and HMAC webhook endpoint
- Complete ingestion pipeline with Convex client, batch accumulation, country/date/currency normalization via pycountry+dateutil, quality flagging, within-source dedup, field-level diffing, plus utility modules for UA rotation, retry, sanitization, and fuzzy selector recovery -- all with 57 passing TDD tests
- 6 config-driven scrapers (API, JSON-LD, RSS, HTML via Scrapling Fetcher, Stealthy via StealthyFetcher, AJAX alias) with shared BaseScraper ABC, factory function, pagination support, cutoff filtering, and 13 passing tests
- Source health tracking with rot detection (consecutive failures + yield drops), GitHub Issue auto-create/close via gh CLI, and pipeline heartbeat monitoring
- Pipeline orchestrator with frequency scheduling, method grouping, local buffer, and 7-command CLI for scrape run lifecycle management
- 201 source config dataclass modules with category-specific selectors, field mappings, and pagination across 4 source categories
- GitHub Actions scrape workflow (daily + dispatch), CI config validation, test seed script, and three documentation files covering config authoring, operations, and architecture
- Pipeline runner failure path calls should_deactivate for source deactivation, stores/checks GitHub Issue numbers to prevent duplicates, and auto-closes issues on source recovery
- Scholars4Dev and FindAPhD configs assigned primary_method='rss' with feed_url selectors, closing the dead-code gap for RssScraper
- Match key schema fields + 10 pure aggregation helper functions (normalization, matching, merging, cycle detection, archival) with 44 unit tests via TDD
- Trigger-wrapped aggregation mutations (batch dedup, trust-weighted merge, cycle detection, auto-archive) with completeRun post-scrape trigger and daily archive cron, all verified by 9 convex-test integration tests
- Complete admin backend with trust-based auto-publish, dedup-enforced approval, revision tracking, and retroactive re-evaluation on source trust changes
- TipTap installed, destructive button variant added, admin route layout with desktop-only guard and StatsBar/StatCard components at /admin
- Review queue with tabbed status switching, expandable rows with approve/reject actions, bulk selection via floating action bar, and duplicate warning badges
- Slide-out edit panel with TipTap rich text editor, revision history timeline, and DOMPurify-sanitized dual-format editorial note rendering
- SourceTrustManager with trust level dropdowns and retroactive re-evaluation, EditPanel wired to QueueRow edit button, admin view switcher for queue/sources
- Live countAffectedScholarships query wired into SourceTrustManager pre-confirmation dialog replacing dead stub
- TanStack Start SSR framework replacing SPA entry with streaming HTML, ConvexQueryClient for SSR hydration, Netlify deployment, and dark mode FOUC prevention via ScriptOnce
- 4-factor prestige scoring system with write-time triggers, country data module with 70+ timezone mappings, Zod filter schema, and oklch design tokens for prestige tiers and deadline urgency
- Convex directory queries with full-text search, 7-dimension filtering (country, nationality, degree, field, funding multi-select, prestige, deadline), 4 sort orders, cursor-based pagination, plus client-side hooks bridging URL state to query args with timezone nationality auto-detection
- Card/Badge with CVA prestige and urgency variants, ScholarshipCard grid with tinted backgrounds and deadline badges, list view, loading skeleton, neo-brutalism empty state SVG, Navbar with dark mode toggle, and BackToTop scroll button
- 9 interactive filter/search/sort components: SearchBar with Convex suggestion dropdown, CountrySelector with flag emojis and multi-select, EligibilityFilterBar with compact mode, NationalityBanner with timezone detection, FilterPanel sidebar/bottom-sheet, FilterChips, QuickFilters, SortPills, ViewToggle -- all wired to URL state via useScholarshipFilters hook
- Full directory page at /scholarships with hero, search, filters, featured row, paginated results, dynamic meta tags, Schema.org JSON-LD on detail page, closing-soon route, and Phase 9 country/degree route placeholders
- WCAG AA accessibility pass with aria-labels, focus indicators, error boundary with retry, copy-link clipboard feedback, RTL logical properties, and reduced motion handling across entire directory
- Shared formatting helpers, deadline/timezone hooks, region grouping, and Convex source-resolution query for scholarship detail page
- 10 detail page section components with prestige-aware hero, nationality region grouping, funding coverage checklist, markdown editorial tips, and source attribution with stale detection
- Complete $slug.tsx rewrite wiring 10 section components, expanded Schema.org JSON-LD, structured meta titles, breadcrumb filter context, and sticky bar scroll behavior
- Collections schema + tag system with auto-tagging rules + related scoring algorithm + comparison batch query + full tag/collection CRUD mutations + trigger wiring for auto-computation
- CSS custom properties for comparison/tag styling, badge tag and tagSuggested CVA variants, and Navbar Collections link as foundational atoms for Phase 8 discovery features
- Admin CRUD for collections (table + slide-out edit form with live preview) and tags (grouped list, suggested review, bulk tagging) with per-scholarship tag editing and 4-tab admin dashboard
- Session-only compare context with max-3 selection, accessible checkbox overlay on scholarship cards, and floating compare bar with ARIA live announcements
- Public collection browsing with /collections browse page, /collections/$slug detail page, FeaturedCollectionsRow on directory, and Navbar link
- Side-by-side comparison table with difference highlighting, search-to-add, and shareable /scholarships/compare route
- Tag badges with tooltips, collection membership badges (D-50), and Similar Scholarships section with compact compare-enabled cards on the scholarship detail page
- 10 seed collections with daily cron refresh, tag-filtered directory, and complete Phase 8 discovery feature wiring
- SEO library with Schema.org Grant JSON-LD, OG/Twitter meta builders, data-driven landing content generators, sitemap XML utility, 5 Convex SEO queries, and root-level GA4/GSC integration
- All 7 public routes enhanced with Grant/BreadcrumbList/FAQPage/ItemList JSON-LD, canonical URLs, OG/Twitter meta, and data-driven country+degree landing pages with stats, FAQ, and cross-links
- Dynamic sitemap.xml, robots.txt, and branded OG image generation via TanStack Start server routes with satori + resvg-js
- InertiaScraper with Inertia.js JSON protocol, 409 version mismatch retry, and Study Australia field mapping
- Inertia.js API configs for Study Australia scholarships (1024) and providers (2281), replacing broken 404 config

---
