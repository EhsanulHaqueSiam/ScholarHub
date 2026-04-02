# Feature Landscape: ScholarHub v2

**Domain:** Scholarship discovery and application management platform for international students
**Researched:** 2026-04-03
**Confidence:** MEDIUM-HIGH (competitor analysis + UX research + student pain point data)

---

## Context: The Five Student Anxieties

Research confirms ScholarHub's own model. Every feature below maps to one or more of these:

1. **Eligibility uncertainty** — "Am I even qualified for this?"
2. **Chance assessment** — "What are my odds? Is it worth applying?"
3. **Deadline/process fear** — "Will I miss something or mess up the application?"
4. **Post-application black hole** — "What do I do now? What's next?"
5. **Representation gap** — "Can someone like me actually get this?"

Good features address one anxiety directly. Great features address two or three.

---

## Table Stakes

Features users expect. Missing = product feels incomplete or untrustworthy.

| Feature | Why Expected | Anxiety Addressed | Complexity | Notes |
|---------|--------------|-------------------|------------|-------|
| Personalized recommendations ("For You" feed) | Every major competitor (Fastweb, ScholarshipOwl, Bold.org) does profile-based matching. Users expect results tailored to them within seconds of signup. | Eligibility uncertainty | Low-Med | ScholarHub already has eligibility wizard + profile data in localStorage. This is mostly a filtering/scoring layer on top of existing data. |
| Application tracker with named stages | Students track 5-20 concurrent applications. Without a tracker, they use spreadsheets. Going Merry, Scholarships360, and ScholarshipOwl all provide this. | Deadline/process fear, post-application black hole | Low-Med | localStorage is sufficient. Stages: Researching → Preparing → Submitted → Interview → Result → Offer. Kanban or list view. |
| Deadline reminders / alerts | UX research found push notifications were "extremely important" — cited as the #1 missing feature in scholarship apps students actually used. | Deadline/process fear | Medium | Browser push via Web Push API + Service Worker. No email (no auth). Must degrade gracefully when push is denied. |
| Document checklist per scholarship | Users overwhelmed by "what do I need for this one?" Scholarship requirements vary significantly (transcripts vs IELTS vs financial docs vs reference letters). | Deadline/process fear | Low-Med | Standardized taxonomy: transcript, SOP, CV, financial docs, language score, reference letters, portfolio, photo, passport copy. Per-scholarship checklist drawn from stored data. |
| Scholarship calendar with deadline visualization | Students miss deadlines because opportunities are scattered. UX research confirmed calendar/planner was the most requested missing feature in competing apps. | Deadline/process fear | Medium | Monthly view with deadline markers. High value even as a read-only view. Shortlist overlay is the differentiator. |
| Readiness / match score per scholarship | ScholarshipOwl and eligibility-focused platforms all show match % or "you qualify" signals. Without this, users can't prioritize. | Eligibility uncertainty, chance assessment | Medium | Per-scholarship score against stored profile (GPA, IELTS, nationality, degree level). Must degrade gracefully when profile is incomplete. |
| Scholarship value calculator | Students need to understand real financial impact: tuition + stipend + benefits vs total cost of study. "Fully funded" is meaningless without context. | Chance assessment (is it worth applying?) | Low-Med | Inputs: tuition coverage + stipend + duration. Cross-referenced against country cost-of-living data already in the system. |
| Improved "similar" suggestions | Competitors (ScholarshipOwl's "low competition" filter, ProFellow's "Fulbright alternatives") all surface fallback/related options. Dead-end detail pages lose users. | Eligibility uncertainty, representation gap | Low | Three tiers: reach (harder), match (similar), safety (easier alternatives). Uses existing prestige/funding data. |

---

## Differentiators

Features that set ScholarHub apart. Not universally expected, but meaningfully valued.

| Feature | Value Proposition | Anxiety Addressed | Complexity | Notes |
|---------|-------------------|-------------------|------------|-------|
| Application readiness score with concrete action items | Most platforms show a match % but don't tell you what to do about a gap. "Your IELTS (6.5) is 0.5 below the 7.0 requirement — here's what to do." | Eligibility uncertainty, representation gap | Medium | Gap analysis: profile value vs scholarship requirement. Output: specific named gaps + suggested actions. Requires good profile and requirement data. |
| SOP / essay guidance by scholarship type | Essay anxiety is a leading reason students abandon applications. Going Merry bundled essays by similarity — now shut down. No major platform does strong per-scholarship-type guidance. | Deadline/process fear | Low-Med | Taxonomy: government (Chevening, DAAD, Fulbright), university-funded, need-based, merit-based, field-specific. For each: typical prompts, strong application traits, word count, format tips. No templates — guidance only. Templates commoditize you. |
| Country comparison tool (interactive) | Mastersportal and dedicated comparison tools exist, but none are integrated with scholarship search. Students comparing UK vs Germany vs Netherlands have to leave the platform to research cost of living. | Chance assessment | Medium | Columns: average tuition range, cost of living index, post-study work visa duration, NHS/healthcare access, visa difficulty rating, number of scholarships in ScholarHub database. 2-3 countries side-by-side. |
| Competitiveness / acceptance rate data | No scholarship platform (for students) surfaces acceptance rates. Students apply blindly. Even rough tier classification (highly competitive / moderate / accessible) is rare and valuable. | Chance assessment, representation gap | High | Data must be manually researched. Initial coverage: top 50-100 scholarships. Must degrade gracefully (show nothing rather than a wrong number). Critical accuracy requirement. |
| Guided wizard flow (rank → country → budget) | ScholarHub's own user research confirms students naturally filter in this order. Most platforms drop users into a filter panel with no guidance. A wizard funnel for new/uncertain users reduces abandonment. | Eligibility uncertainty, deadline/process fear | Medium | 3-4 step wizard. Step 1: university ranking preference. Step 2: target countries. Step 3: funding need (full/partial/any). Step 4: results with profile. Distinct from the existing eligibility wizard. |
| Calendar with shortlist overlay and seasonal insights | Basic deadline calendars exist. What doesn't exist: overlaying your own shortlist onto a month view, plus seasonal pattern callouts ("January–March is peak European scholarship season"). | Deadline/process fear | Medium-High | Requires integration between shortlist, tracker, and calendar. The seasonal insights are content, not code — high trust signal. |

---

## Anti-Features

Features to explicitly NOT build in this milestone.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Full SOP / essay templates | Tempts students to copy-paste, undermining their applications. Also creates legal/plagiarism risk perception. Competitors who do this (ScholarshipOwl, various essay mills) are associated with low-quality outcomes. | Guidance on structure and what evaluators look for — not fill-in-the-blank templates. |
| AI essay writing / generation | High LLM cost, no auth to gate usage, plagiarism association, and scholarship committees are now trained to detect AI. Introducing this destroys trust. | Guidance on strong application characteristics per scholarship type. Let the student write it. |
| Collaborative "students like you also applied to" | Requires cross-user behavioral data that doesn't exist. Faking it with static data is misleading. | Use prestige tiers and acceptance rate data to suggest similar-profile opportunities instead. |
| Email notifications | No auth = no email address. Building a subscription/notification system without auth adds significant complexity for low return. | Browser push notifications cover the urgent deadline use case without auth. |
| Community Q&A / discussion | Requires auth for spam/moderation. Without auth, becomes unusable quickly. | Link to relevant Reddit communities (r/gradadmissions, country-specific subs) as social proof. |
| Native mobile app | Out of scope per PROJECT.md. PWA with web push covers the mobile notification use case. | PWA manifest + push notifications handle the critical mobile use cases. |
| Auto-application submission | Bold.org does this for its own hosted scholarships. ScholarHub is an aggregator — applications go to external sites. Auto-submission to external systems is not feasible and legally risky. | Deep links to official application pages. "Apply Now" as the CTA. |
| Financial need assessment / FAFSA-style calculator | Requires sensitive financial data, adds complexity without clear value for international students whose need is assessed differently per country/scholarship. | Show which scholarships are need-based vs merit-based as a filter. |
| Acceptance rate from unreliable sources | Displaying a wrong acceptance rate (e.g., scraped from a blog) is more harmful than displaying nothing. It drives poor prioritization decisions. | Manual research only, with source citation. Show "data not available" when uncertain. |

---

## Feature Dependencies

```
Eligibility Profile (localStorage) ─┬─> Personalized Recommendations
                                     ├─> Application Readiness Score (gap analysis)
                                     ├─> Guided Wizard (pre-fills answers)
                                     └─> Match % on card / detail page

Shortlist (localStorage) ─────────> Calendar Overlay (which deadlines to highlight)
                                  └─> Application Tracker (pre-populated scholarship list)

Application Tracker ──────────────> Calendar View (stage-aware deadline colors)
                                  └─> Push Notification triggers (X days before deadline)

Push Notifications ───────────────> Requires Service Worker registration
                                  └─> Requires explicit user opt-in (browser permission)

Scholarship Data (tuition/stipend) > Value Calculator
                                  └─> Readiness Score (financial match)

Country Data (cost of living) ────> Value Calculator (% of costs covered)
                                  └─> Country Comparison Tool

Competitiveness Data (manual) ────> Improved "Similar" suggestions (safety tier)
                                  └─> Readiness Score (tier-aware difficulty signal)

Document Checklist ───────────────> Application Tracker (documents → stage transitions)
                                  └─> SOP Guidance (which checklist items need writing)

SOP Guidance ─────────────────────> Depends on scholarship type taxonomy
                                  └─> Informed by Document Checklist (essay identified)
```

---

## MVP Recommendation

For a focused first pass that ships value quickly and validates the highest-anxiety features:

**Ship first (highest anxiety reduction, lowest dependency chain):**
1. Personalized Recommendations — profile already exists, this is a filter layer
2. Improved "Similar" Suggestions — low complexity, immediate UX value on detail pages
3. Application Tracker (Kanban/list) — table stakes, localStorage, no dependencies
4. Document Checklist per scholarship — low complexity, standalone, high practical value

**Ship second (medium complexity, medium dependency):**
5. Application Readiness Score — depends on profile completeness and requirement data quality
6. Scholarship Value Calculator — depends on tuition/stipend/country cost-of-living data
7. Calendar View (basic deadline view) — standalone, medium complexity
8. SOP/Essay Guidance — content work more than engineering

**Ship third (higher complexity, external dependencies):**
9. Push Notifications — requires Service Worker + push subscription infrastructure
10. Calendar + Shortlist Overlay — depends on tracker and shortlist integration
11. Guided Wizard Flow — medium engineering, high UX design effort
12. Country Comparison Tool — depends on country data completeness

**Defer with clear rationale:**
- Competitiveness/acceptance rate data: manual research dependency. Ship UI skeleton with "coming soon" graceful degradation; fill data over time.
- Calendar seasonal insights: pure content; schedule as a content task, not an engineering milestone.

---

## UX Patterns That Work for Anxious Students

Based on the Kimberly Tanny scholarship planner UX case study and ScholarshipOwl/Scholarships360 behavior research:

**Reduce overwhelm:**
- Progressive disclosure — show 3-5 recommendations, not 50
- Status indicators — clear "you qualify / you may qualify / you're missing X" signals rather than raw scores
- Completion progress bars on multi-step flows (wizard, document checklist)

**Build confidence:**
- Concrete gap analysis over abstract scores: "Your GPA (3.4) meets the 3.0 minimum" beats "Match: 85%"
- Show scholarship difficulty tier upfront (accessible / moderate / competitive) so students self-select appropriately
- Surface the acceptance-rate data even when it's a rough tier — uncertainty is more damaging than an approximate answer

**Reduce deadline fear:**
- Days-remaining countdown badges on cards and tracker rows
- Color-coded urgency: red (<14 days), amber (14-30 days), green (30+ days)
- Calendar view so students can see clustering of deadlines and plan ahead

**Reduce abandonment after submission:**
- Tracker stages beyond "Submitted" (Interview, Result, Offer) give students something to do
- Document checklist with check-off state persisted in localStorage gives closure

**Maintain trust:**
- Never show a number without a source or confidence indicator
- "Data not available" is better than a wrong number for acceptance rates
- Flag when scholarship data hasn't been recently verified (stale deadline warning)

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Table stakes identification | HIGH | Cross-validated across Fastweb, Bold.org, Scholarships360, ScholarshipOwl, Going Merry feature sets |
| Student pain points and anxieties | HIGH | UX case study (Kimberly Tanny) + ScholarshipOwl research + ScholarHub's own PROJECT.md model are consistent |
| Differentiator value | MEDIUM | Competitive gap analysis is solid; actual user uptake of differentiators unverified without A/B data |
| Competitiveness/acceptance rate feature | MEDIUM | No platform does this well for students — unclear if lack of supply means low demand or just high difficulty |
| Anti-feature rationale | HIGH | AI essay generation, collaborative filtering, and email-without-auth are well-documented wrong turns |
| UX patterns for anxiety reduction | MEDIUM | Case study data + platform observations, not ScholarHub-specific user research |

---

## Sources

- [Bold.org vs Fastweb Feature Comparison](https://bold.org/blog/bold-vs-fastweb/) — platform feature comparison
- [Top 9 Scholarship Websites 2026 — Scholarships360](https://scholarships360.org/scholarships/best-scholarship-websites/) — table stakes features, Smart Planner, Going Merry calendar
- [Scholarship Planner UX Case Study — Kimberly Tanny](https://www.kimberlytanny.com/scholarship-planner-case-study) — student pain points, feature priority rankings from usability testing
- [Hyper-Personalized UX for Scholarship Finders — ColorWhistle](https://colorwhistle.com/scholarship-finder-ux-university-websites/) — recommendation algorithm patterns, UX metrics
- [Scholarship Calendar as Financial-Aid Infrastructure](https://scholarshipsandgrants.us/financial-aid-101/scholarship-calendar/) — calendar deadline heatmap, ICS export, seasonal patterns
- [ScholarshipOwl — How It Works](https://scholarshipowl.com/blog/apply-for-scholarships/how-scholarshipowl-changes-the-scholarship-game/) — matching algorithm, weekly recommendations
- [Going Merry Shutdown Notice](https://goingmerry.com/) — Smart Planner and calendar features (platform now discontinued)
- [How to Build a Scholarship Application Calendar — Buddy4Study](https://www.buddy4study.com/article/scholarship-application-calendar) — calendar UX best practices
- [VisualPing Scholarship Alerts](https://visualping.io/blog/how-to-get-scholarships-alerts) — notification patterns for scholarship deadline monitoring
- [PWA Push Notifications Guide — MagicBell](https://www.magicbell.com/blog/using-push-notifications-in-pwas) — browser push implementation patterns
- [Predictive College Readiness Models — edAnalytics](https://www.edanalytics.org/blog/predictive-models-in-action-supporting-college-and-career-readiness) — readiness score calculation patterns
- [ScholarCalc — Scholarship Eligibility Calculator](https://www.scholarcalc.live/) — value calculator concept (GPA/income/destination inputs)
