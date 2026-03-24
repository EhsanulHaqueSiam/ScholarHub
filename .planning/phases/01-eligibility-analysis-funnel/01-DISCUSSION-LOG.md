# Phase 1: Eligibility Analysis Funnel - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-24
**Phase:** 01-eligibility-analysis-funnel
**Areas discussed:** Funnel steps & data collection, Matching & scoring logic, Results experience, Profile persistence, SEO & meta tags, Mobile experience, Analytics & tracking

---

## Funnel Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Multi-step wizard | One question per screen, progress bar, mobile-friendly | |
| Single-page form | All fields visible at once, faster for power users | |
| Conversational chat-style | Bot-like Q&A flow, trendy but harder to edit | |

**User's choice:** Multi-step wizard now, conversational chat-style with document upload as future phase (ultimate goal)
**Notes:** User wants both approaches — wizard first, chat later. Chat will support document upload for analysis.

---

## Step Count

| Option | Description | Selected |
|--------|-------------|----------|
| 3 steps | About You / Academics / Preferences | ✓ |
| 5+ steps | One field per screen, Typeform-style | |
| You decide | Claude groups fields | |

**User's choice:** 3 steps
**Notes:** None

---

## Placement

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated /eligibility route | Clean URL, SEO-friendly, shareable | ✓ |
| Modal/overlay on directory | Stays on directory page | |
| Homepage hero section | Wizard IS the homepage | |

**User's choice:** Dedicated /eligibility route
**Notes:** None

---

## Data Points

| Option | Description | Selected |
|--------|-------------|----------|
| Core eligibility (nationality, degree, field) | Minimum viable | ✓ |
| Academic profile (GPA, language scores) | IELTS/TOEFL/PTE + GPA | ✓ |
| Preferences (destination, funding type) | Where + how funded | ✓ |
| Demographics (age, gender, disability) | For targeted scholarships | ✓ |

**User's choice:** All four data point categories
**Notes:** Multi-select — comprehensive profile collection

---

## Validation

| Option | Description | Selected |
|--------|-------------|----------|
| All skippable | Only nationality required | |
| Required core, optional extras | Nationality + degree + field required, rest optional | ✓ |
| Everything required | Forces complete profile | |

**User's choice:** Required core, optional extras
**Notes:** None

---

## Nationality Input

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-detect + confirm | Pre-fill from timezone, supports dual citizens | ✓ |
| Always manual selection | No auto-detect | |
| You decide | Claude picks | |

**User's choice:** Auto-detect + confirm
**Notes:** None

---

## Progress UI

| Option | Description | Selected |
|--------|-------------|----------|
| Step bar with labels | Horizontal step bar with step names | ✓ |
| Simple progress bar | Thin bar showing percentage | |
| Step counter only | Just "Step 1 of 3" text | |

**User's choice:** Step bar with labels
**Notes:** None

---

## Navigation

| Option | Description | Selected |
|--------|-------------|----------|
| Back button + clickable steps | Both back button and click on step labels | ✓ |
| Back button only | One step at a time | |
| No going back | Linear only | |

**User's choice:** Back button + clickable steps
**Notes:** None

---

## Field of Study Input

| Option | Description | Selected |
|--------|-------------|----------|
| Multi-select from categories | 1-3 fields from existing 25 categories | ✓ |
| Free-text with suggestions | User types, system maps | |
| Single select only | Exactly one field | |

**User's choice:** Multi-select from categories
**Notes:** None

---

## Language Scores

| Option | Description | Selected |
|--------|-------------|----------|
| Numeric input per test type | Select test, enter score | ✓ |
| Proficiency level | Beginner/Intermediate/Advanced/Native | |
| You decide | Claude picks | |

**User's choice:** Numeric input per test type
**Notes:** None

---

## Destination Countries

| Option | Description | Selected |
|--------|-------------|----------|
| Multi-select destinations | Pick 1-5 countries | ✓ |
| Single destination | Pick one country | |
| Optional / Anywhere | Default anywhere, optionally narrow | |

**User's choice:** Multi-select destinations
**Notes:** None

---

## GPA Input

| Option | Description | Selected |
|--------|-------------|----------|
| Percentage scale with conversion hints | Universal percentage with GPA equivalents | |
| Multi-scale selector | Pick grading system, enter score, convert internally | ✓ |
| You decide | Claude picks | |

**User's choice:** Multi-scale selector
**Notes:** None

---

## Demographics Presentation

| Option | Description | Selected |
|--------|-------------|----------|
| Explain why we ask | Brief note about scholarship targeting, builds trust | ✓ |
| Standard form fields | Just label + input | |
| Skip demographics entirely | Don't collect | |

**User's choice:** Explain why we ask
**Notes:** None

---

## Transitions

| Option | Description | Selected |
|--------|-------------|----------|
| Slide transitions | Carousel-style, left/right | ✓ |
| Fade transitions | Subtle fade between steps | |
| No animation | Instant swap | |
| You decide | Claude picks | |

**User's choice:** Slide transitions
**Notes:** None

---

## Live Count

| Option | Description | Selected |
|--------|-------------|----------|
| Live count on each step | Updates as fields change, requires Convex query | ✓ |
| Count only on final step | Show after all steps complete | |
| No count until results | Reveal on results page only | |

**User's choice:** Live count on each step
**Notes:** None

---

## Match Type

| Option | Description | Selected |
|--------|-------------|----------|
| Percentage match score | 0-100% per scholarship | |
| Binary eligible/not eligible | Simple yes/no | |
| Tiered match | Strong/Good/Partial with colors | ✓ |

**User's choice:** Tiered match (Strong/Good/Partial)
**Notes:** None

---

## Unknown Data Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Include as 'Possible match' | Separate category, eligibility not confirmed | ✓ |
| Exclude unknowns | Only confirmed matches | |
| Mix in with results | Treat missing as matching | |

**User's choice:** Include as 'Possible match'
**Notes:** None

---

## Weight Hierarchy

| Option | Description | Selected |
|--------|-------------|----------|
| Nationality > Degree > Field | Hardest constraint first | ✓ |
| Equal weight across all | All dimensions equal | |
| You decide | Claude determines from data | |

**User's choice:** Nationality > Degree > Field
**Notes:** None

---

## Tier Thresholds

| Option | Description | Selected |
|--------|-------------|----------|
| Hard constraint based | Tiers based on which hard constraints match | |
| Point-based thresholds | Assign points, Strong 80%+, Good 50-79%, Partial 20-49% | ✓ |
| You decide | Claude determines | |

**User's choice:** Point-based thresholds
**Notes:** None

---

## Compute Location

| Option | Description | Selected |
|--------|-------------|----------|
| Convex query | Server-side filtering + scoring | |
| Client-side scoring | Fetch all, score in browser | |
| Hybrid | Convex filters hard constraints, client scores soft matches | ✓ |

**User's choice:** Hybrid
**Notes:** None

---

## Deadline Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Exclude expired, highlight closing soon | Only open scholarships, badge < 30 days | ✓ |
| Show all with deadline status | Include expired grayed out | |
| You decide | Claude handles | |

**User's choice:** Exclude expired, highlight closing soon
**Notes:** None

---

## Results Page Location

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated /eligibility/results | New route, shareable URL | ✓ |
| Redirect to directory with filters | Reuse existing directory | |
| Inline results below wizard | Same page, wizard collapses | |

**User's choice:** Dedicated /eligibility/results
**Notes:** None

---

## Results Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Tier sections with counts | Collapsible sections per tier | ✓ |
| Single list sorted by match quality | One list, tier as badge | |
| Tab-based per tier | Tabs for each tier | |

**User's choice:** Tier sections with counts
**Notes:** None

---

## Match Detail on Cards

| Option | Description | Selected |
|--------|-------------|----------|
| Compact match indicators | Small icons: check/cross per dimension, expandable | ✓ |
| Full breakdown on card | Complete analysis on card | |
| No breakdown on card | Just tier badge | |

**User's choice:** Compact match indicators
**Notes:** None

---

## Result Filters

| Option | Description | Selected |
|--------|-------------|----------|
| Light filtering | Sort by deadline/prestige/funding, filter by type | ✓ |
| Full directory filters | Import entire FilterPanel | |
| No additional filters | Just tier groups | |

**User's choice:** Light filtering
**Notes:** None

---

## Empty State

| Option | Description | Selected |
|--------|-------------|----------|
| Helpful empty state with suggestions | Show restrictive criteria, suggest relaxing | ✓ |
| Simple 'no results' message | Generic empty state | |
| You decide | Claude designs | |

**User's choice:** Helpful empty state with suggestions
**Notes:** None

---

## Profile Editing from Results

| Option | Description | Selected |
|--------|-------------|----------|
| Editable summary card at top | Click field to edit inline, results update live | ✓ |
| Link back to wizard | Button returns to wizard | |
| No editing from results | Must restart wizard | |

**User's choice:** Editable summary card at top
**Notes:** None

---

## URL Sharing

| Option | Description | Selected |
|--------|-------------|----------|
| Encoded URL params | Compact params in URL, bookmarkable | ✓ |
| Share button generates link | Explicit share action | |
| No sharing | Session-only results | |

**User's choice:** Encoded URL params
**Notes:** None

---

## Profile Storage

| Option | Description | Selected |
|--------|-------------|----------|
| LocalStorage only | Browser storage, no auth needed | ✓ |
| URL params only | Stateless, long URLs | |
| Convex anonymous profiles | Server-side with anonymous ID | |

**User's choice:** LocalStorage only
**Notes:** None

---

## Return Visit UX

| Option | Description | Selected |
|--------|-------------|----------|
| Resume from results | Welcome back, skip wizard | ✓ |
| Always show wizard | Start at step 1, pre-fill | |
| You decide | Claude picks | |

**User's choice:** Resume from results
**Notes:** None

---

## Clear Profile

| Option | Description | Selected |
|--------|-------------|----------|
| Clear button on results page | 'Start over' button, clears storage | ✓ |
| Clear in settings/footer | Less prominent location | |
| You decide | Claude handles | |

**User's choice:** Clear button on results page
**Notes:** None

---

## Future-Proofing for Clerk

| Option | Description | Selected |
|--------|-------------|----------|
| Clean interface now, migrate later | StudentProfile type, localStorage adapter | ✓ |
| Add Convex schema now | Create table, use later | |
| Don't think about it yet | Refactor when Clerk ships | |

**User's choice:** Clean interface now, migrate later
**Notes:** None

---

## Privacy Note

| Option | Description | Selected |
|--------|-------------|----------|
| Brief note at start | One-line 'data stays in browser' | ✓ |
| No privacy note | Skip it | |
| Detailed privacy section | Full explanation | |

**User's choice:** Brief note at start
**Notes:** None

---

## Entry Points

| Option | Description | Selected |
|--------|-------------|----------|
| Homepage CTA + nav link | Button on hero + navigation | ✓ |
| Nav link only | Just in navigation | |
| Homepage hero only | Big CTA, no nav | |

**User's choice:** Homepage CTA + nav link
**Notes:** None

---

## Directory Link from Results

| Option | Description | Selected |
|--------|-------------|----------|
| Prominent link with pre-filled filters | Opens directory with profile filters applied | ✓ |
| Simple link to directory | No pre-filling | |
| You decide | Claude handles | |

**User's choice:** Prominent link with pre-filled filters
**Notes:** None

---

## SEO Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Static for /eligibility, dynamic for results | Fixed title on wizard, dynamic on results | ✓ |
| Static for both | Fixed meta, results noindex | |
| You decide | Claude handles | |

**User's choice:** Static for /eligibility, dynamic for results
**Notes:** None

---

## Results Indexing

| Option | Description | Selected |
|--------|-------------|----------|
| Index popular combinations | Pre-generate top nationality+degree combos | ✓ |
| Noindex all results | Only /eligibility indexed | |
| Index all results | Every combination | |

**User's choice:** Index popular combinations
**Notes:** None

---

## Mobile Wizard

| Option | Description | Selected |
|--------|-------------|----------|
| Full-screen steps with sticky nav | Each step full viewport, buttons sticky at bottom | ✓ |
| Same as desktop, just responsive | Scaled down layout | |
| Bottom sheet wizard | Overlay bottom sheet | |

**User's choice:** Full-screen steps with sticky nav
**Notes:** None

---

## Mobile Results

| Option | Description | Selected |
|--------|-------------|----------|
| Stacked cards with tier headers | Full-width cards, sticky tier headers | ✓ |
| List view on mobile | Compact one-line items | |
| Same as desktop | Responsive grid | |

**User's choice:** Stacked cards with tier headers
**Notes:** None

---

## Analytics Events

| Option | Description | Selected |
|--------|-------------|----------|
| Full funnel tracking | wizard_started, step_completed, etc. | ✓ |
| Basic completion tracking | Started + completed only | |
| You decide | Claude designs | |
| Skip analytics for now | No tracking code | |

**User's choice:** Full funnel tracking
**Notes:** None

---

## Analytics Implementation

| Option | Description | Selected |
|--------|-------------|----------|
| Abstract analytics layer | analytics.ts with trackEvent, console.log in dev | ✓ |
| Install PostHog now | Full PostHog SDK | |
| You decide | Claude picks | |

**User's choice:** Abstract analytics layer
**Notes:** None

---

## Claude's Discretion

- Loading skeleton design for results
- Exact point values for each matching dimension
- Exact spacing, typography, and neo-brutalism styling details
- Error state handling for Convex query failures
- GPA conversion table between grading systems
- Which nationality+degree combinations to pre-generate for SEO indexing
- Transition animation duration and easing

## Deferred Ideas

- Conversational chat-style eligibility wizard with document upload for analysis (user's ultimate goal — future phase)
- PostHog analytics integration (future phase, abstract layer prepared)
- Clerk-backed user profiles (future phase, clean interface designed for migration)
- Email alerts for newly matching scholarships (requires user accounts)
- Scholarship detail page match indicators when profile exists
