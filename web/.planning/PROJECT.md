# ScholarHub

## What This Is

A scholarship discovery and application preparation platform for international students. Aggregates 5,700+ scholarships from 80+ sources, surfaces per-subject tuition/coverage data, and helps students find, evaluate, and prepare applications for scholarships they're eligible for. Designed to reduce student anxiety through transparency, actionable checklists, and personalized guidance.

## Core Value

Help students confidently find and apply to scholarships they qualify for — reducing the anxiety of "am I eligible?", "what are my chances?", and "will I mess up the application?" through clear data, preparation tools, and personalized recommendations.

## Requirements

### Validated

- ✓ Scholarship discovery with search, filter, sort across 5,700+ published scholarships — v1.0
- ✓ Prestige-tiered scholarship cards with deadline urgency indicators — v1.0
- ✓ Neo-brutalism design system (Archivo Black, Inter, 0px radius, 6px shadows) — v1.0
- ✓ Multi-filter directory: country, degree, field, funding type, prestige, scholarship type, tags — v1.0
- ✓ Scholarship detail pages: hero, overview, eligibility, subjects, funding, country info, tips, sources — v1.0
- ✓ Per-subject tuition rates and scholarship coverage amounts — v1.1
- ✓ Side-by-side scholarship comparison tool — v1.0
- ✓ Shortlist builder with dream/target/safety tiers (localStorage) — v1.0
- ✓ Eligibility wizard with multi-step profile and match scoring — v1.0
- ✓ Curated collections (admin-managed, filter-based) — v1.0
- ✓ Admin dashboard: review queue, editing, revision tracking, source management — v1.0
- ✓ Python scraping pipeline: 80+ sources, direct + webhook ingestion — v1.0
- ✓ SEO: JSON-LD structured data, OG image generation, sitemaps, country/degree landing pages — v1.0
- ✓ Analytics: GA4 + 8 tracking platforms — v1.0
- ✓ Static JSON export for zero-cost public reads with Convex fallback — v1.0
- ✓ Related scholarships recommendations — v1.0
- ✓ Application tips per scholarship (admin-authored) — v1.0

### Active

- [ ] Personalized recommendation system — "Recommended for You" section using stored eligibility profile
- [ ] Application tracker / Kanban board — track 5-15 applications through Researching → Preparing → Submitted → Interview → Result stages (localStorage)
- [ ] Scholarship alerts / notifications — browser push + in-app reminders for deadlines and new matches, leverage existing expected_reopen_month data
- [ ] Document requirement matrix — standardized checklist per scholarship (transcripts, recommendations, SOP, CV, language scores, financial docs)
- [ ] SOP/essay guidance — common prompts by scholarship type, strong application characteristics, template structures
- [ ] Scholarship calendar view — monthly calendar with deadline visualization, shortlist overlay, seasonal insights
- [ ] Country comparison tool — side-by-side: cost of living, post-study work, visa difficulty, scholarship availability
- [ ] Improved "Similar" suggestions — "easier to get" alternatives, "also consider" for over/under-reaching students
- [ ] Application readiness score — per-scholarship scoring against user profile (GPA, IELTS, nationality), concrete action items
- [ ] Scholarship value calculator — total value over duration (tuition + stipend + benefits), percentage of total cost covered
- [ ] Filter by value + guided wizard flow — university rank filter, multi-step funnel (rank → country → budget), plus enhanced directory filters
- [ ] Competitiveness/acceptance rate data — manually researched acceptance rates, application volume estimates, tier classification (highly competitive / moderate / accessible)

### Out of Scope

- User authentication (Clerk) — future milestone, all features designed for localStorage now with Clerk upgrade path
- Community Q&A / user comments — requires auth for spam/moderation
- Email notifications — requires auth for email delivery
- Collaborative filtering ("students like you applied to...") — requires usage data that doesn't exist yet
- Mobile native app — web-only for now

## Context

- **Stage**: v1.0 shipped and live on Netlify. Convex free tier previously exceeded (2026-03-25) — budget-sensitive optimization applied.
- **Tech stack**: TanStack Start (SSR) + Convex + React 19 + Tailwind v4 + Vite 8. Python scraping pipeline.
- **Data**: 5,722 published scholarships, 3,200 with per-subject details, 25 fields of study, 20+ host countries.
- **Auth plan**: Clerk integration planned for a future milestone. All v2 features must work with localStorage and be designed so Clerk can replace the storage layer later.
- **User flow insight**: Students naturally search: university rankings → filter by country → filter by personal preferences (money, eligibility). Both a guided wizard flow and enhanced directory filters should serve this.
- **Student anxiety model**: The five core anxieties are eligibility uncertainty, chance assessment, deadline/process fear, post-application black hole, and "can someone like me get this?" representation gap.

## Constraints

- **No auth**: All features must work with localStorage. Design data models so they can migrate to Clerk-backed user storage later.
- **Convex budget**: Static JSON remains primary read path. Minimize Convex function calls. New features should prefer client-side computation where possible.
- **Data quality**: Competitiveness/acceptance rate data requires manual research — not all scholarships will have it initially. Features must degrade gracefully.
- **Design system**: Neo-brutalism must be maintained across all new features. Use existing tokens, Card/Badge primitives, accent color palette.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| No auth this milestone | Focus on features, Clerk integration is a standalone effort | — Pending |
| localStorage for tracker/profile | Works without auth, migrates to Clerk later | — Pending |
| Defer Community Q&A | Requires auth for moderation; build after Clerk | — Pending |
| Manual acceptance rate research | More accurate than estimation; covers top scholarships first | — Pending |
| Both wizard + directory filters | Guided flow for new users, power filters for returning users | — Pending |
| Browser push for alerts | No email without auth; push notifications work anonymously | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-03 after initialization*
