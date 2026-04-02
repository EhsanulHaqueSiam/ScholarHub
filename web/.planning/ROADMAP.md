# Roadmap: ScholarHub v2

## Overview

ScholarHub v2 transforms the existing scholarship discovery platform into a full application preparation companion. Nine phases build on each other: storage foundations first (everything depends on them), then the tracker and document matrix (highest table stakes), then calendar and discovery tools, then detail-page computation engines, then recommendations and essay guidance, and finally notifications (which require existing tracker data to be meaningful). Every phase delivers a complete, verifiable capability that reduces one or more student anxieties.

## Milestones

- [x] **v1.0 MVP** - Scholarship discovery, filtering, comparison, eligibility wizard, admin (shipped)
- [ ] **v2.0 Application Toolkit** - Phases 1-9 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: Storage Foundations** - Harden localStorage infrastructure so all v2 features inherit safe, versioned, cross-tab-synced storage
- [ ] **Phase 2: Application Tracker + Document Matrix** - Kanban board to track 5-15 applications through named stages, with per-scholarship document checklists
- [ ] **Phase 3: Scholarship Calendar** - Monthly deadline calendar showing shortlisted and tracked scholarships with urgency colors and seasonal insights
- [ ] **Phase 4: Discovery Wizard + Enhanced Filters** - Guided multi-step wizard (rank → country → budget → results) and enhanced directory filters for rank and value
- [ ] **Phase 5: Country Comparison** - Side-by-side comparison of 2-3 countries showing cost of living, work rights, visa difficulty, and scholarship availability
- [ ] **Phase 6: Readiness Score + Value Calculator** - Per-scholarship readiness gap analysis and total value breakdown on detail pages
- [ ] **Phase 7: Similar Suggestions + Competitiveness Data** - Reach/match/safety suggestion tiers and acceptance rate / competitiveness tier badges on detail pages
- [ ] **Phase 8: Recommendations + Essay Guidance** - "Recommended for You" feed on the directory, plus per-scholarship-type SOP/essay guidance pages
- [ ] **Phase 9: Notifications** - In-app and browser deadline reminders with a double-permission opt-in flow

## Phase Details

### Phase 1: Storage Foundations
**Goal**: All localStorage infrastructure is safe, versioned, and cross-tab-synced before any feature builds on top of it
**Depends on**: Nothing (first phase)
**Requirements**: STORE-01, STORE-02, STORE-03, STORE-04
**Success Criteria** (what must be TRUE):
  1. When localStorage fills up, a visible error banner appears instead of the write silently failing
  2. Every stored object (profile, shortlist, tracker, alerts) has a `_version` field that triggers a migration function on read
  3. The shortlist reads and writes through a typed `StorageAdapter` interface matching the eligibility profile pattern — no component calls `localStorage` directly
  4. Data written in one browser tab is visible in another tab without a page reload
**Plans**: TBD

### Phase 2: Application Tracker + Document Matrix
**Goal**: Students can track their applications through named stages and see required documents per scholarship
**Depends on**: Phase 1
**Requirements**: TRACK-01, TRACK-02, TRACK-03, TRACK-04, TRACK-05, TRACK-06, TRACK-07, DOC-01, DOC-02, DOC-03, DOC-04
**Success Criteria** (what must be TRUE):
  1. User can add a scholarship to the tracker from any detail page or scholarship card, and it appears in the Kanban board
  2. User can drag and drop (or tap to move on mobile) scholarships between the five stages: Researching, Preparing, Submitted, Interview, Accepted/Rejected
  3. Each tracker card shows the scholarship deadline, document checklist completion status, and any notes the user has written
  4. User can check off individual documents (transcripts, SOP, CV, etc.) per scholarship and the state persists across sessions
  5. A cross-scholarship summary tells the user how many tracked scholarships require each document type (e.g., "8 of 12 need a recommendation letter")
  6. User can export all tracker data as a CSV file for backup
**Plans**: TBD
**UI hint**: yes

### Phase 3: Scholarship Calendar
**Goal**: Students can see all upcoming deadlines for their shortlisted and tracked scholarships in a monthly calendar view
**Depends on**: Phase 2
**Requirements**: CAL-01, CAL-02, CAL-03, CAL-04, CAL-05
**Success Criteria** (what must be TRUE):
  1. A `/calendar` page shows a monthly grid with scholarship deadlines rendered on their due dates
  2. Deadline entries are color-coded by urgency (critical / warning / open) matching existing design tokens
  3. Clicking a calendar entry navigates to the scholarship detail page
  4. A contextual insight appears when the current month has multiple deadlines (e.g., "October is busy — you have 5 deadlines this month")
  5. The calendar only shows scholarships the user has shortlisted or tracked — not all 5,700+
**Plans**: TBD
**UI hint**: yes

### Phase 4: Discovery Wizard + Enhanced Filters
**Goal**: New users can navigate scholarships through a guided wizard, and power users get rank and value filters in the existing directory
**Depends on**: Phase 1
**Requirements**: DISC-01, DISC-02, DISC-03, DISC-04, DISC-05, DISC-06
**Success Criteria** (what must be TRUE):
  1. A `/discover` page presents a 3-step wizard (university rank preference → country → budget/preferences) and terminates at the directory with filters pre-applied
  2. Navigating back through the wizard restores each step's selections (URL-encoded state, shareable link)
  3. A "University rank tier" filter appears in the existing directory filter panel and narrows results correctly
  4. A "Filter by value" option lets users sort or filter the directory by total scholarship value
  5. The discovery wizard and the existing eligibility wizard remain separate pages with separate intents
**Plans**: TBD
**UI hint**: yes

### Phase 5: Country Comparison
**Goal**: Students can select 2-3 countries and compare them side-by-side on the dimensions that matter for study-abroad decisions
**Depends on**: Phase 1
**Requirements**: COUNTRY-01, COUNTRY-02, COUNTRY-03, COUNTRY-04
**Success Criteria** (what must be TRUE):
  1. A `/compare-countries` page lets the user select 2-3 countries and renders a side-by-side comparison table
  2. The comparison shows cost of living, post-study work rights, visa difficulty, scholarship count, and average tuition for each country
  3. The comparison is reachable from any country landing page
  4. All data is sourced from the existing `country-data.ts` and `study_info` fields — no new Convex queries
**Plans**: TBD
**UI hint**: yes

### Phase 6: Readiness Score + Value Calculator
**Goal**: Students can see exactly where their profile meets or falls short of each scholarship's requirements, and how much each scholarship is actually worth
**Depends on**: Phase 1
**Requirements**: READY-01, READY-02, READY-03, READY-04, READY-05, VALUE-01, VALUE-02, VALUE-03, VALUE-04, VALUE-05
**Success Criteria** (what must be TRUE):
  1. Each scholarship detail page shows a readiness card listing named gaps (e.g., "IELTS 7.0 meets minimum 6.5") and concrete action items for any gaps — only when the user has a saved eligibility profile
  2. The readiness card outputs named gaps and actions, not a single numeric score
  3. Each scholarship detail page shows a value breakdown card: tuition covered + stipend + travel + insurance + duration, with a "covers approximately X% of total estimated expenses" line
  4. The value card never sums across different currencies; multi-currency scholarships show each currency separately with a disclaimer
  5. When data is incomplete, the value card shows "Estimated based on available data" rather than hiding entirely
**Plans**: TBD
**UI hint**: yes

### Phase 7: Similar Suggestions + Competitiveness Data
**Goal**: Students see reach/match/safety alternatives on detail pages and can assess how competitive each scholarship is
**Depends on**: Phase 1
**Requirements**: SIM-01, SIM-02, SIM-03, COMP-01, COMP-02, COMP-03, COMP-04, COMP-05, COMP-06
**Success Criteria** (what must be TRUE):
  1. Each scholarship detail page shows an "Easier to get" section with lower-prestige alternatives in the same country and field
  2. An "Also consider" section surfaces reach or match alternatives based on the user's profile, when a profile exists
  3. Each scholarship detail page shows a competitiveness tier badge (Highly Competitive / Competitive / Moderate / Accessible) when data is available
  4. Acceptance rate and application volume estimates appear on the detail page when the scholarship has that data (manually researched for top 100 gold/silver scholarships)
  5. When competitiveness data is absent, the page shows "Competitiveness data not yet available" rather than an empty section
**Plans**: TBD
**UI hint**: yes

### Phase 8: Recommendations + Essay Guidance
**Goal**: Students with saved profiles see personalized scholarship recommendations on the directory, and every scholarship links to relevant SOP/essay guidance by type
**Depends on**: Phase 1
**Requirements**: RECO-01, RECO-02, RECO-03, RECO-04, ESSAY-01, ESSAY-02, ESSAY-03, ESSAY-04
**Success Criteria** (what must be TRUE):
  1. The directory page shows a "Recommended for You" section when an eligibility profile is saved, ranking scholarships by match score using the existing scoring engine
  2. User can dismiss individual recommendations and they do not reappear in the same or future sessions
  3. A "New matches since last visit" count appears when new scholarships have been added since the user's last visit that match their profile
  4. Each scholarship type (government, merit, need-based, etc.) has a guidance page with common essay prompts and what reviewers look for — no AI-generated essays, guidance only
  5. Each scholarship detail page links to the relevant essay guidance page based on its scholarship type
**Plans**: TBD
**UI hint**: yes

### Phase 9: Notifications
**Goal**: Students receive timely deadline reminders in-app and via browser notifications after explicitly opting in
**Depends on**: Phase 2
**Requirements**: ALERT-01, ALERT-02, ALERT-03, ALERT-04, ALERT-05, ALERT-06
**Success Criteria** (what must be TRUE):
  1. User can set a reminder for any scholarship deadline (configurable days in advance) and the reminder fires as a Sonner toast when the app is open
  2. A browser notification fires for due reminders when the browser Notification API has permission — in-app only (no background push)
  3. Before the native permission dialog appears, a custom modal explains what alerts will be sent and lets the user opt in or decline
  4. When new scholarships matching the user's profile have appeared since last visit, an alert fires on page load without any additional setup
  5. User can toggle notification types on/off in a preferences panel, and those preferences persist across sessions
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Storage Foundations | 0/TBD | Not started | - |
| 2. Application Tracker + Document Matrix | 0/TBD | Not started | - |
| 3. Scholarship Calendar | 0/TBD | Not started | - |
| 4. Discovery Wizard + Enhanced Filters | 0/TBD | Not started | - |
| 5. Country Comparison | 0/TBD | Not started | - |
| 6. Readiness Score + Value Calculator | 0/TBD | Not started | - |
| 7. Similar Suggestions + Competitiveness Data | 0/TBD | Not started | - |
| 8. Recommendations + Essay Guidance | 0/TBD | Not started | - |
| 9. Notifications | 0/TBD | Not started | - |
