# Requirements — ScholarHub v2

## v1 Requirements

### STORE — Storage Foundations
- [x] **STORE-01**: useLocalStorage hook surfaces QuotaExceededError to the user instead of silently swallowing it
- [x] **STORE-02**: All localStorage objects (profile, shortlist, tracker, alerts) have a `_version` field for schema migration
- [ ] **STORE-03**: Existing shortlist uses a typed StorageAdapter interface (matching eligibility profile pattern) for Clerk migration readiness
- [ ] **STORE-04**: Cross-tab storage event listener keeps data in sync across open tabs

### RECO — Personalized Recommendations
- [ ] **RECO-01**: User sees a "Recommended for You" section on the directory page when an eligibility profile exists in localStorage
- [ ] **RECO-02**: Recommendations are ranked by match score (reusing existing eligibility scoring engine)
- [ ] **RECO-03**: User can dismiss individual recommendations and they don't reappear
- [ ] **RECO-04**: "New matches since last visit" indicator shows count of new scholarships matching profile

### TRACK — Application Tracker
- [ ] **TRACK-01**: User can add any scholarship to their tracker from detail page or card
- [ ] **TRACK-02**: Tracker shows a Kanban board with stages: Researching → Preparing → Submitted → Interview → Accepted / Rejected
- [ ] **TRACK-03**: User can drag-and-drop scholarships between stages (works on touch devices via dnd-kit)
- [ ] **TRACK-04**: Each tracked scholarship shows its deadline, required documents status, and notes
- [ ] **TRACK-05**: User can add free-text notes per tracked scholarship
- [ ] **TRACK-06**: Tracker data persists in localStorage with versioned schema
- [ ] **TRACK-07**: User can export tracker data as CSV for backup

### ALERT — Scholarship Alerts
- [ ] **ALERT-01**: User can set a reminder for any scholarship deadline (X days before)
- [ ] **ALERT-02**: In-app toast notification (sonner) fires when a reminder is due and the app is open
- [ ] **ALERT-03**: Browser Notification API fires when the app is open and permission is granted
- [ ] **ALERT-04**: Double-permission pattern: custom modal explaining value before triggering native permission prompt
- [ ] **ALERT-05**: "New scholarships matching your profile" alert fires on page load when new matches exist since last visit
- [ ] **ALERT-06**: Notification preferences stored in localStorage with on/off toggles

### DOC — Document Requirement Matrix
- [ ] **DOC-01**: Each scholarship detail page shows a standardized document checklist (transcripts, recommendations, SOP, CV, language scores, financial docs)
- [ ] **DOC-02**: User can check off documents they've prepared (persists in localStorage per scholarship)
- [ ] **DOC-03**: Cross-scholarship document overview: "You need recommendation letters for 8 of your 12 tracked scholarships"
- [ ] **DOC-04**: Document checklist data is stored in Convex schema (admin-editable per scholarship) with sensible defaults by scholarship type

### ESSAY — SOP/Essay Guidance
- [ ] **ESSAY-01**: Each scholarship type (government, merit, need-based, etc.) has a guidance page with common essay prompts and what reviewers look for
- [ ] **ESSAY-02**: Scholarship detail page links to relevant guidance based on scholarship_type
- [ ] **ESSAY-03**: Guidance content is admin-authored markdown (stored in Convex or static content)
- [ ] **ESSAY-04**: No AI-generated essays or full templates — guidance only (ethical line)

### CAL — Scholarship Calendar
- [ ] **CAL-01**: Monthly calendar view shows deadlines for tracked/shortlisted scholarships
- [ ] **CAL-02**: Color-coded by urgency (critical/warning/open matching existing design tokens)
- [ ] **CAL-03**: Click a calendar event to navigate to scholarship detail page
- [ ] **CAL-04**: "Peak season" insights: "October is busy — you have 5 deadlines this month"
- [ ] **CAL-05**: Calendar renders only shortlisted/tracked scholarships (not all 5,700+)

### COUNTRY — Country Comparison
- [ ] **COUNTRY-01**: User can select 2-3 countries for side-by-side comparison
- [ ] **COUNTRY-02**: Comparison shows: cost of living, post-study work rights, visa difficulty, scholarship count, average tuition
- [ ] **COUNTRY-03**: Data sourced from existing country-data.ts + study_info fields
- [ ] **COUNTRY-04**: Accessible from country landing pages and as standalone /compare-countries route

### SIM — Improved Similar Suggestions
- [ ] **SIM-01**: "Easier to get" section shows lower-prestige alternatives in same country/field
- [ ] **SIM-02**: "Also consider" section for students who may be over- or under-reaching based on profile
- [ ] **SIM-03**: Similar suggestions factor in user's eligibility profile when available

### READY — Application Readiness Score
- [ ] **READY-01**: Per-scholarship readiness card on detail page showing user's profile vs requirements
- [ ] **READY-02**: Concrete gap analysis: "Your IELTS 7.0 meets the minimum 6.5 ✓" / "GPA 3.2 is below typical 3.5 — competitive but risky"
- [ ] **READY-03**: Action items generated from gaps: "Retake IELTS to improve chances" / "Get stronger recommendations"
- [ ] **READY-04**: Only shows when user has an eligibility profile saved
- [ ] **READY-05**: Outputs named gaps and actions, NOT a single numeric score

### VALUE — Scholarship Value Calculator
- [ ] **VALUE-01**: Per-scholarship value card showing total estimated value over study duration
- [ ] **VALUE-02**: Breakdown: tuition covered + stipend + travel + insurance + other benefits
- [ ] **VALUE-03**: "Covers approximately X% of total estimated expenses" based on country cost data
- [ ] **VALUE-04**: Never sums across different currencies — shows per-currency or single-currency with disclaimer
- [ ] **VALUE-05**: Graceful fallback when data is incomplete: "Estimated based on available data"

### DISC — Discovery Wizard + Filters
- [ ] **DISC-01**: Guided multi-step wizard flow at /discover: Step 1 (university rank preference) → Step 2 (country) → Step 3 (budget/preferences) → Results
- [ ] **DISC-02**: Wizard state persisted in URL params (shareable, back-button works)
- [ ] **DISC-03**: Results page shows filtered scholarships with relevance ordering
- [ ] **DISC-04**: University rank filter added to existing directory filter panel
- [ ] **DISC-05**: "Filter by value" option in directory: sort/filter by total scholarship value
- [ ] **DISC-06**: Wizard and existing eligibility wizard remain separate (different intents)

### COMP — Competitiveness Data
- [ ] **COMP-01**: Scholarship detail page shows competitiveness tier badge: Highly Competitive / Competitive / Moderate / Accessible
- [ ] **COMP-02**: Acceptance rate displayed when available (e.g., "~5% acceptance rate")
- [ ] **COMP-03**: Application volume estimate when available (e.g., "~50,000 applicants annually")
- [ ] **COMP-04**: Graceful "Competitiveness data not yet available" state for scholarships without data
- [ ] **COMP-05**: Competitiveness data stored in Convex schema (admin-editable fields)
- [ ] **COMP-06**: Initial data manually researched for top 100 scholarships (gold/silver prestige tier)

## v2 Requirements (Deferred)

- Email notifications (requires Clerk auth)
- Community Q&A / user comments (requires Clerk auth)
- Collaborative filtering recommendations (requires usage data)
- Server-side push notifications via VAPID/Convex cron (Mode B — after Mode A validated)
- Success stories / testimonials from past recipients (requires content pipeline)

## Out of Scope

- User authentication (Clerk) — separate milestone
- AI-generated essay content — ethical boundary, guidance only
- Mobile native app — web responsive is sufficient
- Full push notification infrastructure (Service Worker + VAPID) — blocked by Chrome Notification Triggers API abandonment; in-app + browser Notification API only
- Real-time collaborative features — no auth, no multi-user

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| STORE-01 | Phase 1 | Complete |
| STORE-02 | Phase 1 | Complete |
| STORE-03 | Phase 1 | Pending |
| STORE-04 | Phase 1 | Pending |
| TRACK-01 | Phase 2 | Pending |
| TRACK-02 | Phase 2 | Pending |
| TRACK-03 | Phase 2 | Pending |
| TRACK-04 | Phase 2 | Pending |
| TRACK-05 | Phase 2 | Pending |
| TRACK-06 | Phase 2 | Pending |
| TRACK-07 | Phase 2 | Pending |
| DOC-01 | Phase 2 | Pending |
| DOC-02 | Phase 2 | Pending |
| DOC-03 | Phase 2 | Pending |
| DOC-04 | Phase 2 | Pending |
| CAL-01 | Phase 3 | Pending |
| CAL-02 | Phase 3 | Pending |
| CAL-03 | Phase 3 | Pending |
| CAL-04 | Phase 3 | Pending |
| CAL-05 | Phase 3 | Pending |
| DISC-01 | Phase 4 | Pending |
| DISC-02 | Phase 4 | Pending |
| DISC-03 | Phase 4 | Pending |
| DISC-04 | Phase 4 | Pending |
| DISC-05 | Phase 4 | Pending |
| DISC-06 | Phase 4 | Pending |
| COUNTRY-01 | Phase 5 | Pending |
| COUNTRY-02 | Phase 5 | Pending |
| COUNTRY-03 | Phase 5 | Pending |
| COUNTRY-04 | Phase 5 | Pending |
| READY-01 | Phase 6 | Pending |
| READY-02 | Phase 6 | Pending |
| READY-03 | Phase 6 | Pending |
| READY-04 | Phase 6 | Pending |
| READY-05 | Phase 6 | Pending |
| VALUE-01 | Phase 6 | Pending |
| VALUE-02 | Phase 6 | Pending |
| VALUE-03 | Phase 6 | Pending |
| VALUE-04 | Phase 6 | Pending |
| VALUE-05 | Phase 6 | Pending |
| SIM-01 | Phase 7 | Pending |
| SIM-02 | Phase 7 | Pending |
| SIM-03 | Phase 7 | Pending |
| COMP-01 | Phase 7 | Pending |
| COMP-02 | Phase 7 | Pending |
| COMP-03 | Phase 7 | Pending |
| COMP-04 | Phase 7 | Pending |
| COMP-05 | Phase 7 | Pending |
| COMP-06 | Phase 7 | Pending |
| RECO-01 | Phase 8 | Pending |
| RECO-02 | Phase 8 | Pending |
| RECO-03 | Phase 8 | Pending |
| RECO-04 | Phase 8 | Pending |
| ESSAY-01 | Phase 8 | Pending |
| ESSAY-02 | Phase 8 | Pending |
| ESSAY-03 | Phase 8 | Pending |
| ESSAY-04 | Phase 8 | Pending |
| ALERT-01 | Phase 9 | Pending |
| ALERT-02 | Phase 9 | Pending |
| ALERT-03 | Phase 9 | Pending |
| ALERT-04 | Phase 9 | Pending |
| ALERT-05 | Phase 9 | Pending |
| ALERT-06 | Phase 9 | Pending |

**Coverage:** 63/63 requirements mapped across 9 phases

---
*Generated: 2026-04-03 | Traceability updated: 2026-04-03*
