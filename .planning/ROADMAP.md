# Roadmap: ScholarHub

## Milestones

- ✅ **v1.0 MVP** — Phases 1-10 (shipped 2026-03-23) — [Archive](milestones/v1.0-ROADMAP.md)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-10) — SHIPPED 2026-03-23</summary>

- [x] Phase 1: Foundation (2/2 plans) — Monorepo scaffold, Convex schema, Netlify deployment
- [x] Phase 2: Source Discovery (3/3 plans) — 201 scholarship sources cataloged
- [x] Phase 3: Scraping Pipeline (9/9 plans) — 6 scraper types, monitoring, GitHub Actions CI/CD
- [x] Phase 4: Data Aggregation (2/2 plans) — Deduplication, merging, cycle tracking
- [x] Phase 5: Admin Dashboard (6/6 plans) — Review queue, trust levels, editorial notes
- [x] Phase 6: Public Directory — ABSORBED INTO Phase 06.1
- [x] Phase 06.1: Public Directory + Prestige (7/7 plans) — SSR directory, filtering, prestige scoring
- [x] Phase 7: Scholarship Detail Page (3/3 plans) — Full detail view with all fields
- [x] Phase 8: Discovery Features (8/8 plans) — Collections, comparison, related scholarships
- [x] Phase 9: SEO & Growth (3/3 plans) — JSON-LD, landing pages, OG images, sitemap
- [x] Phase 10: Study Australia Scrapers (2/2 plans) — InertiaScraper, new configs

**Total: 10 phases, 45 plans, 68/69 requirements (1 deferred)**

</details>

- ✅ **v1.1 Eligibility** — Phase 1 (shipped 2026-03-24) — Eligibility wizard with match scoring

## Progress

| Milestone | Phases | Plans | Status | Shipped |
|-----------|--------|-------|--------|---------|
| v1.0 MVP | 10 | 45 | Complete | 2026-03-23 |
| v1.1 Eligibility | 1 | 8 | Complete | 2026-03-24 |
| v2.0 Application Hub | 9 | — | In Progress | — |

---

## v2.0 — Application Hub

**Vision:** Transform ScholarHub from a discovery tool into a full application preparation platform. Reduce student anxiety through personalized guidance, tracking tools, and transparent competitiveness data.

**56 requirements across 12 categories | 9 phases**

---

### Phase 01: Storage Foundations

**Goal:** Safe, versioned, cross-tab-synced localStorage infrastructure before any feature builds on it
**Requirements:** STORE-01, STORE-02, STORE-03, STORE-04
**Depends on:** None (prerequisite for all v2 phases)
**UI hint:** no

**Success Criteria:**
1. When localStorage fills up, a visible error banner appears instead of the write silently failing
2. Every stored object has a `_version` field that triggers migration on read
3. Shortlist reads/writes through a typed `StorageAdapter` — no component calls `localStorage` directly
4. Data written in one tab is visible in another without a page reload

---

### Phase 02: Application Tracker + Document Matrix

**Goal:** Kanban board for 5-15 applications with per-scholarship document checklists
**Requirements:** TRACK-01, TRACK-02, TRACK-03, TRACK-04, TRACK-05, TRACK-06, TRACK-07, DOC-01, DOC-02, DOC-03, DOC-04
**Depends on:** Phase 01 (storage adapters)
**UI hint:** yes
**Plans:** 6/6 plans complete

Plans:
- [x] 02-01-PLAN.md — TDD: Tracker data layer (types, Zustand store, engine functions, CSV export)
- [x] 02-02-PLAN.md — Install dependencies + Sonner Toaster + Convex schema extension (DOC-04)
- [x] 02-03-PLAN.md — Kanban board UI (TrackerKanban, columns, cards, mobile stage selector, /tracker route)
- [x] 02-04-PLAN.md — TrackThisButton integration into detail page, sticky bar, and directory cards
- [x] 02-05-PLAN.md — Detail components (notes editor, document checklist, expanded card, document matrix, CSV export button)
- [x] 02-06-PLAN.md — End-to-end verification checkpoint

**Success Criteria:**
1. User can add a scholarship to the tracker from any detail page or card
2. User can drag-and-drop (or tap-to-move on mobile) between five stages
3. Each tracker card shows deadline, document checklist status, and notes
4. Cross-scholarship summary shows how many tracked scholarships need each document type
5. User can export tracker data as CSV

---

### Phase 03: Scholarship Calendar

**Goal:** Monthly deadline calendar for shortlisted/tracked scholarships with seasonal insights
**Requirements:** CAL-01, CAL-02, CAL-03, CAL-04, CAL-05
**Depends on:** Phase 02 (tracker data for calendar overlay)
**UI hint:** yes
**Plans:** 2 plans

Plans:
- [ ] 03-01-PLAN.md — TDD: Calendar types + deadline engine (computeUrgency, getMonthData, localizer)
- [ ] 03-02-PLAN.md — Calendar UI components, /calendar route, navbar link, visual verification

**Success Criteria:**
1. Monthly calendar renders deadlines for tracked/shortlisted scholarships only
2. Events are color-coded by urgency matching existing design tokens
3. Clicking an event navigates to the scholarship detail page
4. "Peak season" insight banner shows when multiple deadlines cluster

---

### Phase 04: Discovery Wizard + Enhanced Filters

**Goal:** Guided rank/country/budget wizard plus university rank and value filters in directory
**Requirements:** DISC-01, DISC-02, DISC-03, DISC-04, DISC-05, DISC-06
**Depends on:** Phase 01 (URL params pattern)
**UI hint:** yes

**Success Criteria:**
1. Multi-step wizard at /discover guides users through rank → country → budget
2. Wizard state persists in URL params (shareable, back-button works)
3. Results page shows filtered scholarships with relevance ordering
4. University rank filter available in existing directory filter panel
5. Wizard and eligibility wizard are separate routes with different intents

---

### Phase 05: Country Comparison

**Goal:** Side-by-side 2-3 country comparison on study-abroad decision dimensions
**Requirements:** COUNTRY-01, COUNTRY-02, COUNTRY-03, COUNTRY-04
**Depends on:** None (uses existing country-data.ts)
**UI hint:** yes

**Success Criteria:**
1. User can select 2-3 countries for side-by-side comparison
2. Comparison shows cost of living, post-study work rights, visa difficulty, scholarship count
3. Data sourced from existing country-data.ts and study_info fields
4. Accessible from country landing pages and as standalone /compare-countries route

---

### Phase 06: Readiness Score + Value Calculator

**Goal:** Gap analysis cards and total value breakdown on scholarship detail pages
**Requirements:** READY-01, READY-02, READY-03, READY-04, READY-05, VALUE-01, VALUE-02, VALUE-03, VALUE-04, VALUE-05
**Depends on:** Phase 01 (profile storage for readiness)
**UI hint:** yes

**Success Criteria:**
1. Detail page shows readiness card with concrete gap analysis (not a numeric score)
2. Action items generated from gaps: "Retake IELTS to improve chances"
3. Value card shows total estimated value over study duration with breakdown
4. "Covers approximately X% of total expenses" shown based on country cost data
5. Both cards degrade gracefully when data is incomplete

---

### Phase 07: Similar Suggestions + Competitiveness Data

**Goal:** Reach/match/safety suggestion tiers and acceptance rate badges on detail pages
**Requirements:** SIM-01, SIM-02, SIM-03, COMP-01, COMP-02, COMP-03, COMP-04, COMP-05, COMP-06
**Depends on:** Phase 01 (profile for personalized suggestions)
**UI hint:** yes

**Success Criteria:**
1. "Easier to get" section shows lower-prestige alternatives in same country/field
2. "Also consider" section accounts for user profile when available
3. Competitiveness badge (Highly Competitive / Competitive / Moderate / Accessible) on detail pages
4. Acceptance rate and applicant volume displayed when available
5. Graceful "data not yet available" state for scholarships without competitiveness data

---

### Phase 08: Recommendations + Essay Guidance

**Goal:** Personalized "For You" feed on directory and per-type SOP guidance pages
**Requirements:** RECO-01, RECO-02, RECO-03, RECO-04, ESSAY-01, ESSAY-02, ESSAY-03, ESSAY-04
**Depends on:** Phase 01 (profile), Phase 06 (scoring engine)
**UI hint:** yes

**Success Criteria:**
1. "Recommended for You" section on directory page when eligibility profile exists
2. Recommendations ranked by match score using existing scoring engine
3. "New matches since last visit" count indicator on directory
4. Per-scholarship-type SOP guidance pages with common prompts and reviewer expectations
5. No AI-generated essays — guidance only

---

### Phase 09: Notifications

**Goal:** In-app and browser deadline reminders with double-permission opt-in
**Requirements:** ALERT-01, ALERT-02, ALERT-03, ALERT-04, ALERT-05, ALERT-06
**Depends on:** Phase 02 (tracker deadlines), Phase 08 (new matches)
**UI hint:** yes

**Success Criteria:**
1. Reminder fires as Sonner toast when the app is open on the due date
2. Browser notification fires when Notification API permission granted (in-app only, no background push)
3. Custom modal precedes native permission prompt — native dialog never fires cold
4. New-match alert fires on page load when profile matches exist since last visit
5. Notification type toggles persist across sessions
