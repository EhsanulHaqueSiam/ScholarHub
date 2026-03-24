# Phase 1: Eligibility Analysis Funnel - Research

**Researched:** 2026-03-24
**Domain:** Multi-step wizard UI, client-side scoring, Convex reactive queries, TanStack Start file-based routing
**Confidence:** HIGH

## Summary

This phase builds a multi-step eligibility wizard at `/eligibility` and a results page at `/eligibility/results`. The codebase is a TanStack Start (SSR) + Convex + React 19 + Tailwind CSS v4 app with a neo-brutalism design system. Significant reusable infrastructure exists: `CountrySelector`, `useNationalityDetect`, `useLocalStorage`, `ScholarshipCard`, `FilterChips`, full ISO country mapping, 25 field-of-study categories, all degree levels, and an established pattern for URL-param-based state via Zod schemas + `useScholarshipFilters`.

The key architectural challenge is the hybrid compute model (D-20): Convex filters hard constraints server-side (nationality, degree level, deadline expiry), then the client scores soft matches (field of study, funding type, demographics) using a point-based tier system. The live match count on each wizard step (D-07) requires a lightweight Convex query that returns counts per step rather than full documents, keeping Convex read bandwidth low.

**Primary recommendation:** Build the wizard as a standalone feature module under `web/src/components/eligibility/` with its own `StudentProfile` type, localStorage adapter, and scoring engine. Use TanStack Router file-based routing for `/eligibility` and `/eligibility/results` with Zod-validated search params for URL sharing. Create a dedicated Convex query (`eligibility.ts`) that returns filtered counts and matched scholarship IDs to minimize bandwidth.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Multi-step wizard with 3 steps: Step 1 (About You: nationality, age, gender), Step 2 (Academics: degree, field, GPA, language scores), Step 3 (Preferences: destination countries, funding type)
- **D-02:** Conversational chat-style wizard with document upload is a FUTURE phase -- not in scope here
- **D-03:** Dedicated `/eligibility` route, not embedded in directory. Primary CTA on homepage + navigation link
- **D-04:** Slide transitions between steps (forward = slide left, back = slide right). Neo-brutalism bold borders frame each step
- **D-05:** Step bar with labels at top: 'About You' -> 'Academics' -> 'Preferences'. Shows current + completed steps
- **D-06:** Back button + clickable completed step labels for navigation. Preserves all entered data
- **D-07:** Live scholarship count updates on each step as user fills fields ('142 scholarships match so far'). Requires lightweight Convex query per change
- **D-08:** Required core fields: nationality, degree level, field of study. Optional extras: GPA, language scores (IELTS/TOEFL/PTE), age, gender, destination countries, funding type
- **D-09:** Nationality auto-detected via timezone (existing `useNationalityDetect`), user confirms or changes. Supports multiple nationalities (dual citizens)
- **D-10:** Field of study: multi-select from existing 25 categories, searchable dropdown. Pick 1-3 fields
- **D-11:** Language scores: numeric input per test type. IELTS 0-9, TOEFL 0-120, PTE 10-90. User selects which test(s) they have
- **D-12:** GPA: multi-scale selector -- user picks grading system (US 4.0, UK classification, percentage, etc.), enters score, system converts internally
- **D-13:** Destination countries: multi-select, pick 1-5 countries
- **D-14:** Demographics: sensitive presentation with explanation note. Gender includes non-binary + prefer not to say
- **D-15:** Brief privacy note at wizard start: 'Your data stays in your browser. Nothing is sent to our servers.'
- **D-16:** Tiered match system: Strong Match / Good Match / Partial Match / Possible Match (not exact percentages)
- **D-17:** Point-based threshold scoring -- assign points per dimension, then map to tiers: Strong 80%+, Good 50-79%, Partial 20-49%, Possible = unknown eligibility data
- **D-18:** Weight hierarchy: Nationality (heaviest) > Degree Level > Field of Study. Funding and demographics are preferences, not hard eligibility
- **D-19:** Scholarships with missing eligibility data included as 'Possible match -- eligibility not confirmed'. Separate section in results
- **D-20:** Hybrid compute: Convex filters by hard constraints (nationality, degree), client scores soft matches (field, funding, demographics)
- **D-21:** Exclude expired deadlines. Badge 'Closing Soon' for scholarships with < 30 days remaining
- **D-22:** Dedicated results page at `/eligibility/results` with encoded URL params for sharing (e.g., `?n=BD&d=master&f=cs,eng&dest=DE,NL`)
- **D-23:** Results grouped by tier sections with counts: 'Strong Matches (24)' > 'Good Matches (67)' > 'Partial Matches (31)' > 'Possible Matches (89)'. Each section collapsible
- **D-24:** Compact match indicators on each scholarship card: checkmarks/crosses for Nationality, Degree, Field, Language. Click to expand full breakdown
- **D-25:** Light filtering on results: sort by deadline, prestige, funding amount. Filter by funding type, scholarship type. Reuse existing FilterChips component
- **D-26:** Editable profile summary card at top of results. Click any field to edit inline, results update live
- **D-27:** Helpful empty state when no matches: show which criteria are too restrictive, suggest relaxing filters, link to full directory as fallback
- **D-28:** Prominent 'Browse all scholarships' link that opens directory with nationality/degree pre-filled from profile
- **D-29:** localStorage only for this phase. No Clerk, no Convex user profiles. URL params as backup for sharing
- **D-30:** Returning visitors see 'Welcome back' with option to view previous results or update profile. Skip wizard unless they want changes
- **D-31:** 'Start over' button on results page to clear localStorage profile and redirect to empty wizard
- **D-32:** Clean StudentProfile type interface -- localStorage adapter now, swap to Convex+Clerk adapter later. No Clerk code in this phase
- **D-33:** /eligibility: static title 'Check Your Scholarship Eligibility | ScholarHub', fixed OG image, Schema.org FAQPage
- **D-34:** /eligibility/results: dynamic title based on profile, e.g., '24 Scholarships for Bangladeshi Master's Students | ScholarHub'
- **D-35:** Pre-generate and index popular nationality+degree combinations for long-tail SEO. Noindex rare combinations
- **D-36:** Full-screen wizard steps with sticky nav on mobile. Step bar at top (scrolls away), Next/Back buttons sticky at bottom. Slide transitions. Native app feel
- **D-37:** Results: full-width stacked cards with sticky tier headers as user scrolls. Compact match indicators. Pull-to-refresh
- **D-38:** Full funnel event tracking: wizard_started, step_completed (with step name + fields filled), wizard_completed, results_viewed, scholarship_clicked_from_results, profile_edited, profile_cleared
- **D-39:** Abstract analytics layer (analytics.ts with trackEvent). Console.log in dev. Swap to PostHog later with one-line change. No PostHog dependency

### Claude's Discretion
- Loading skeleton design for results
- Exact point values for each matching dimension
- Exact spacing, typography, and neo-brutalism styling details
- Error state handling for Convex query failures
- GPA conversion table between grading systems
- Which nationality+degree combinations to pre-generate for SEO indexing
- Transition animation duration and easing

### Deferred Ideas (OUT OF SCOPE)
- Conversational chat-style eligibility wizard with document upload for analysis -- future phase
- PostHog analytics integration -- future phase, abstract analytics layer prepared
- Clerk-backed user profiles -- future phase, clean interface designed for migration
- Email alerts for newly matching scholarships -- requires user accounts
- Scholarship detail page match indicators (show match status when profile exists) -- could be separate enhancement
</user_constraints>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.4 | UI framework | Already in use, project standard |
| TanStack Start | 1.167.1 | SSR framework with file-based routing | Already powers all routes |
| TanStack Router | 1.167.5 | Client routing with search params validation | URL param patterns established |
| Convex | 1.33.1 | Backend-as-a-service (real-time queries) | All data queries use Convex |
| Tailwind CSS | 4.2.2 | Styling | Neo-brutalism design system built on it |
| Zod | 4.3.6 | Search param validation / type schemas | Used by existing filter system |
| class-variance-authority | 0.7.1 | Component variant styling | Used by Button, Card, Badge |
| Radix UI (Popover, Select, Dialog) | Various | Accessible primitives | CountrySelector, FilterPanel patterns |
| lucide-react | 0.577.0 | Icons | Used project-wide |
| i18n-iso-countries | 7.14.0 | ISO country names and codes | Used by countries.ts |

### No New Dependencies Required

This phase requires **zero new npm packages**. All functionality is achievable with the existing stack:

- **Wizard step transitions:** CSS transitions/animations with Tailwind classes (no framer-motion needed for slide transitions)
- **Multi-step form state:** React useState + context (no form library needed for 3-step wizard)
- **localStorage persistence:** Existing `useLocalStorage` hook handles serialization/SSR safety
- **URL param encoding:** Existing Zod + TanStack Router validateSearch pattern
- **Scoring engine:** Pure TypeScript function, no external dependency
- **Analytics abstraction:** Simple module with `trackEvent(name, properties)` function

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS transitions for slides | framer-motion | Adds 30KB+ for a simple slide. CSS `transform: translateX()` with `transition` is sufficient for slide-left/slide-right |
| useState for wizard state | react-hook-form | Overkill for 3-step wizard with ~12 fields. useState with a single StudentProfile object is simpler |
| Custom scoring | Algolia/Meilisearch | Full-text search overkill. Point-based scoring on pre-filtered results is trivial client-side logic |

## Architecture Patterns

### Recommended Project Structure
```
web/src/
  routes/
    eligibility/
      index.tsx              # /eligibility wizard page
      results.tsx            # /eligibility/results page
  components/
    eligibility/
      WizardShell.tsx        # Step container, progress bar, navigation
      StepAboutYou.tsx       # Step 1: nationality, age, gender
      StepAcademics.tsx      # Step 2: degree, field, GPA, language
      StepPreferences.tsx    # Step 3: destinations, funding type
      LiveMatchCount.tsx     # Real-time count badge during wizard
      ResultsTierSection.tsx # Collapsible tier group (Strong/Good/Partial/Possible)
      MatchIndicators.tsx    # Check/cross indicators on scholarship cards
      ProfileSummaryCard.tsx # Editable profile card at top of results
      EligibilityCTA.tsx     # CTA button for homepage/nav integration
  lib/
    eligibility/
      types.ts               # StudentProfile, MatchTier, ScoredScholarship
      scoring.ts             # Point-based scoring engine
      profile-storage.ts     # localStorage adapter (swappable interface)
      url-params.ts          # Compact URL encoding/decoding for sharing
      gpa-scales.ts          # GPA conversion tables
    analytics.ts             # Abstract trackEvent layer
  hooks/
    useStudentProfile.ts     # Profile state management hook
    useEligibilityMatching.ts # Orchestrates Convex query + client scoring
web/convex/
  eligibility.ts             # Dedicated Convex queries for eligibility matching
```

### Pattern 1: Hybrid Compute (Server Filter + Client Score)
**What:** Convex handles hard constraint filtering (nationality eligibility, degree level match, deadline exclusion). Client receives filtered results and applies point-based soft scoring (field match, funding preference, demographics).
**When to use:** For the eligibility matching flow where D-20 specifies hybrid compute.
**Why:** Keeps Convex read counts bounded (only published, non-expired scholarships matching nationality + degree) while allowing instant client-side re-scoring when soft preferences change.

```typescript
// web/convex/eligibility.ts
// Server-side: filter by hard constraints, return lean documents
export const getEligibleScholarships = query({
  args: {
    nationalities: v.array(v.string()),
    degreeLevels: v.array(degreeLevelValidator),
    // No soft filters here -- client handles scoring
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    // Use existing index patterns from directory.ts
    const results = await ctx.db
      .query("scholarships")
      .withIndex("by_status_deadline", (q) => q.eq("status", "published"))
      .take(600); // Capped scan

    // Post-filter: nationality eligibility + degree match + not expired
    return results.filter((s) => {
      if (s.application_deadline && s.application_deadline < now) return false;
      // Nationality: open-to-all or matches user nationality
      const natMatch = !s.eligibility_nationalities ||
        s.eligibility_nationalities.length === 0 ||
        args.nationalities.some((n) => s.eligibility_nationalities!.includes(n));
      // Degree: matches at least one user degree level
      const degMatch = args.degreeLevels.some((d) => s.degree_levels.includes(d));
      return natMatch && degMatch;
    }).map(toEligibilitySummary);
  },
});
```

```typescript
// web/src/lib/eligibility/scoring.ts
// Client-side: score each scholarship against full profile
export type MatchTier = "strong" | "good" | "partial" | "possible";

interface ScoringWeights {
  nationality: number;  // Heaviest (D-18)
  degree: number;
  fieldOfStudy: number;
  fundingType: number;
  demographics: number;
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  nationality: 35,     // 35 points
  degree: 25,          // 25 points
  fieldOfStudy: 20,    // 20 points
  fundingType: 10,     // 10 points
  demographics: 10,    // 10 points
};                     // Total: 100 points

export function scoreScholarship(
  scholarship: EligibilitySummary,
  profile: StudentProfile,
): { tier: MatchTier; score: number; breakdown: MatchBreakdown } {
  let earned = 0;
  let possible = 0;
  const breakdown: MatchBreakdown = {};

  // Nationality (35 pts) -- already server-filtered, so always matches
  // But track for breakdown display
  possible += DEFAULT_WEIGHTS.nationality;
  if (/* nationality matches */) {
    earned += DEFAULT_WEIGHTS.nationality;
    breakdown.nationality = "match";
  }

  // ... similar for each dimension

  const percentage = possible > 0 ? (earned / possible) * 100 : 0;
  const tier: MatchTier =
    percentage >= 80 ? "strong" :
    percentage >= 50 ? "good" :
    percentage >= 20 ? "partial" : "possible";

  return { tier, score: percentage, breakdown };
}
```

### Pattern 2: Profile Storage Adapter
**What:** Clean interface for StudentProfile storage that currently uses localStorage but can be swapped to Convex+Clerk later (D-32).
**When to use:** All profile read/write operations.

```typescript
// web/src/lib/eligibility/profile-storage.ts
export interface ProfileStorage {
  getProfile(): StudentProfile | null;
  saveProfile(profile: StudentProfile): void;
  clearProfile(): void;
  hasProfile(): boolean;
}

// Current implementation
export class LocalStorageProfileAdapter implements ProfileStorage {
  private key = "scholarhub_student_profile";

  getProfile(): StudentProfile | null {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(this.key);
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  }

  saveProfile(profile: StudentProfile): void {
    localStorage.setItem(this.key, JSON.stringify(profile));
  }

  clearProfile(): void {
    localStorage.removeItem(this.key);
  }

  hasProfile(): boolean {
    return this.getProfile() !== null;
  }
}

// Export singleton for current phase
export const profileStorage = new LocalStorageProfileAdapter();
```

### Pattern 3: TanStack Router File-Based Routes with Search Params
**What:** Follow the exact same pattern used by `/scholarships/index.tsx` for route definition with Zod-validated search params.
**When to use:** For `/eligibility` and `/eligibility/results` routes.

```typescript
// web/src/routes/eligibility/results.tsx
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

export const eligibilityResultsSearchSchema = z.object({
  n: z.string().optional(),      // nationalities: "BD,IN"
  d: z.string().optional(),      // degree: "master"
  f: z.string().optional(),      // fields: "cs,eng"
  dest: z.string().optional(),   // destinations: "DE,NL"
  gpa: z.string().optional(),    // "4.0:us" (score:scale)
  lang: z.string().optional(),   // "ielts:7.5,toefl:100"
  fund: z.string().optional(),   // funding: "fully_funded"
  sort: z.enum(["deadline", "prestige", "amount"]).optional(),
  ft: z.string().optional(),     // filter funding type
  st: z.string().optional(),     // filter scholarship type
});

export const Route = createFileRoute("/eligibility/results")({
  validateSearch: eligibilityResultsSearchSchema,
  head: ({ search }) => {
    // Dynamic title per D-34
    const title = buildResultsTitle(search);
    return buildPageMeta({ title, description, canonicalPath: "/eligibility/results" });
  },
  component: EligibilityResults,
});
```

### Pattern 4: Slide Transition with CSS
**What:** Forward = slide left, backward = slide right using CSS transitions (D-04).
**When to use:** Wizard step navigation.

```typescript
// CSS approach using Tailwind utility classes + CSS transitions
// Container wraps steps with overflow-hidden
// Each step uses transform + transition for slide animation
const slideClasses = {
  enter: direction === "forward" ? "translate-x-full" : "-translate-x-full",
  active: "translate-x-0",
  exit: direction === "forward" ? "-translate-x-full" : "translate-x-full",
};

// Recommended: 300ms ease-out for natural feel
// <div className="transition-transform duration-300 ease-out">
```

### Pattern 5: Abstract Analytics Layer
**What:** Thin analytics abstraction per D-39 that logs to console in dev and can swap to PostHog with a one-line change.
**When to use:** All funnel tracking events (D-38).

```typescript
// web/src/lib/analytics.ts
type EventName =
  | "wizard_started"
  | "step_completed"
  | "wizard_completed"
  | "results_viewed"
  | "scholarship_clicked_from_results"
  | "profile_edited"
  | "profile_cleared";

interface AnalyticsProvider {
  track(event: EventName, properties?: Record<string, unknown>): void;
  identify(userId: string, traits?: Record<string, unknown>): void;
}

class ConsoleAnalytics implements AnalyticsProvider {
  track(event: EventName, properties?: Record<string, unknown>) {
    if (import.meta.env.DEV) {
      console.log(`[Analytics] ${event}`, properties);
    }
  }
  identify(userId: string, traits?: Record<string, unknown>) {
    if (import.meta.env.DEV) {
      console.log(`[Analytics] identify`, userId, traits);
    }
  }
}

// Swap this line to PostHog later
export const analytics: AnalyticsProvider = new ConsoleAnalytics();
```

### Anti-Patterns to Avoid
- **Fetching full scholarship documents for count queries:** D-07 needs live counts during wizard. Use a dedicated lightweight Convex query that returns only counts, not full documents.
- **Using `usePaginatedQuery` for eligibility results:** The results need full client-side scoring and tier grouping. Use `useQuery` with a batch query that returns all matching scholarships at once (capped at ~600) so the client can score and group them.
- **Storing the scoring logic on the server:** D-20 explicitly says hybrid compute. Client scoring enables instant re-computation when the profile edits inline (D-26) without round-tripping to Convex.
- **Building form validation with a heavy library:** 12 fields across 3 steps. Simple `useState` with inline validation is cleaner than react-hook-form for this scope.
- **Creating separate Convex queries per wizard step:** One parameterized query covers all steps. Just add/remove filter args as the user progresses.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Country selection dropdown | Custom dropdown with search | Existing `CountrySelector` component | Already handles search, popular list, multi-select, max limits, flag display, accessible markup |
| Nationality auto-detection | Browser geolocation API | Existing `useNationalityDetect` hook | Already handles timezone-to-country mapping, localStorage dismissal, SSR safety |
| ISO country data | Manual country list | Existing `i18n-iso-countries` + `countries.ts` utilities | Complete ISO 3166, flag generation, name lookup, code lookup all ready |
| URL search param parsing | Manual `URLSearchParams` | Existing Zod schema + TanStack Router `validateSearch` | Type-safe, validated, SSR-safe, matches project conventions |
| localStorage with SSR safety | Raw `localStorage.getItem` | Existing `useLocalStorage` hook | Handles server-side rendering (returns default when window undefined), JSON serialization |
| Scholarship card display | New card component | Extend existing `ScholarshipCard` with optional match indicators prop | Maintains design consistency, already handles prestige tiers, deadline urgency, funding display |
| Filter chip display on results | New filter UI | Adapt existing `FilterChips` component pattern | Already has remove-pill and clear-all patterns |
| SEO meta tags | Manual head tag manipulation | Existing `buildPageMeta` + `buildFaqJsonLd` helpers | SSR-safe, canonical URL generation, OG image integration all proven |

**Key insight:** The v1.0 codebase already has ~80% of the UI primitives this phase needs. The real work is in the scoring engine, wizard step flow, and Convex eligibility query -- not in building UI components from scratch.

## Common Pitfalls

### Pitfall 1: Convex Read Bandwidth Explosion from Live Count Queries
**What goes wrong:** D-07 requires live scholarship count updates as the user fills each field. If the query re-runs on every keystroke and scans all published scholarships, it will blow through Convex free-tier read limits.
**Why it happens:** Convex queries are reactive -- they re-execute when arguments change. An unbounded scan of all scholarships per field change creates excessive reads.
**How to avoid:**
1. Debounce the query arguments by 300-500ms so typing does not trigger per-character.
2. Use a lightweight count query that only returns `{ count: number }` rather than full documents.
3. Cap the scan at a reasonable limit (e.g., 600 scholarships) using `.take(600)` as the existing `listScholarshipsBatch` does.
4. Consider a two-phase approach: show a cached approximate count during wizard, then run the full query only when navigating to results.
**Warning signs:** Convex dashboard shows high document reads per second, or the count badge flickers.

### Pitfall 2: SSR Hydration Mismatch with localStorage
**What goes wrong:** The wizard checks localStorage for returning visitors (D-30) to show "Welcome back". On the server during SSR, localStorage is undefined, producing different HTML than the client renders.
**Why it happens:** TanStack Start SSR renders components server-side where `window`/`localStorage` do not exist.
**How to avoid:**
1. Use the existing `useLocalStorage` hook pattern which returns defaults during SSR.
2. Render the "Welcome back" UI only after a client-side effect confirms hydration (use a `useEffect` + `useState(false)` guard that flips to `true` on mount).
3. For the route-level `head()` function, never read localStorage -- it runs on the server. Only use search params for dynamic titles (D-34).
**Warning signs:** React hydration warnings in console, flash of wrong content.

### Pitfall 3: URL Param Encoding Too Verbose for Sharing
**What goes wrong:** Full parameter names create long, ugly URLs that are hard to share on social media or messaging.
**Why it happens:** Using descriptive keys like `nationality=BD&degreeLevel=master&fieldOfStudy=computer_science,engineering`.
**How to avoid:** Use compact keys per D-22: `?n=BD&d=master&f=cs,eng&dest=DE,NL`. Map field-of-study values to short codes (e.g., "Computer Science" -> "cs"). Keep total URL under 200 characters for the common case.
**Warning signs:** URL exceeds browser URL bar width, truncated in share previews.

### Pitfall 4: Stale Results After Profile Edit on Results Page
**What goes wrong:** D-26 allows inline editing of profile fields on the results page. If the Convex query arguments are not properly derived from the current profile state, results may not update.
**Why it happens:** Memoized query args hold a stale reference to the profile.
**How to avoid:** Derive Convex query args directly from the current profile state using `useMemo` with proper dependency arrays. The pattern in `useScholarshipFilters` (lines 53-111) demonstrates the correct memoization approach with `.join()` for array deps.
**Warning signs:** Editing a field on the results page does not change the scholarship list.

### Pitfall 5: Accessibility Gaps in Multi-Step Wizard
**What goes wrong:** Screen readers cannot determine wizard progress, step navigation is keyboard-inaccessible, or focus is not managed when switching steps.
**Why it happens:** Custom wizard UIs often lack ARIA patterns for step-by-step flows.
**How to avoid:**
1. Use `aria-current="step"` on the active step indicator.
2. Announce step changes with `aria-live="polite"` on the step content region.
3. Move focus to the first input of the new step after navigation.
4. Use `role="group"` with `aria-label` for each step form section.
5. Ensure all interactive elements have min 44x44px touch targets (already established in `CountrySelector` and `Navbar` patterns).
**Warning signs:** Tab navigation skips inputs, screen reader does not announce step changes.

### Pitfall 6: GPA Scale Conversion Inaccuracy
**What goes wrong:** Converting between grading systems (US 4.0, UK classification, percentage, German 1.0-5.0) introduces inaccuracy that causes false negative matches.
**Why it happens:** Grading systems are not linearly convertible. A UK "2:1" spans 60-69%, which maps to different GPA ranges at different US universities.
**How to avoid:** Use broad equivalence bands rather than precise conversion. For eligibility matching purposes, map all scales to a 4-tier quality band: Excellent, Good, Average, Below Average. This is sufficient for "does the GPA meet the scholarship's minimum" checks. Store the original value + scale, not the converted value.
**Warning signs:** Users report scholarship matches that require higher GPAs than they have, or miss scholarships they qualify for.

## Code Examples

### StudentProfile Type Interface (D-32)
```typescript
// web/src/lib/eligibility/types.ts
export interface StudentProfile {
  // Step 1: About You
  nationalities: string[];           // ISO 2-letter codes, supports dual citizens
  age?: number;
  gender?: "male" | "female" | "non_binary" | "prefer_not_to_say";

  // Step 2: Academics
  degreeLevel: "bachelor" | "master" | "phd" | "postdoc";
  fieldsOfStudy: string[];           // 1-3 from FIELDS_OF_STUDY constants
  gpa?: {
    value: number;
    scale: GpaScale;
  };
  languageScores?: {
    ielts?: number;    // 0-9
    toefl?: number;    // 0-120
    pte?: number;      // 10-90
  };

  // Step 3: Preferences
  destinationCountries?: string[];   // ISO 2-letter codes, 1-5
  fundingPreference?: "fully_funded" | "partial" | "tuition_waiver" | "stipend_only";

  // Metadata
  createdAt: number;
  updatedAt: number;
}

export type GpaScale = "us_4" | "uk_class" | "percentage" | "german" | "australian" | "indian_10";

export type MatchTier = "strong" | "good" | "partial" | "possible";

export interface MatchBreakdown {
  nationality: "match" | "no_match" | "unknown";
  degree: "match" | "no_match" | "unknown";
  field: "match" | "partial" | "no_match" | "unknown";
  language: "match" | "no_match" | "unknown" | "not_required";
}

export interface ScoredScholarship {
  scholarship: EligibilitySummary;
  tier: MatchTier;
  score: number;          // 0-100
  breakdown: MatchBreakdown;
}
```

### GPA Scale Conversion Bands
```typescript
// web/src/lib/eligibility/gpa-scales.ts
export const GPA_SCALES = {
  us_4: { label: "US 4.0 Scale", min: 0, max: 4.0, step: 0.1 },
  uk_class: { label: "UK Classification", min: 0, max: 100, step: 1,
    bands: ["First (70+)", "2:1 (60-69)", "2:2 (50-59)", "Third (40-49)"] },
  percentage: { label: "Percentage", min: 0, max: 100, step: 1 },
  german: { label: "German Scale (1.0-5.0)", min: 1.0, max: 5.0, step: 0.1 },
  australian: { label: "Australian GPA (7.0)", min: 0, max: 7.0, step: 0.1 },
  indian_10: { label: "Indian CGPA (10.0)", min: 0, max: 10.0, step: 0.1 },
} as const;

// Convert to normalized 0-100 quality band for matching
export function normalizeGpa(value: number, scale: GpaScale): number {
  switch (scale) {
    case "us_4": return (value / 4.0) * 100;
    case "uk_class": return value;  // already percentage
    case "percentage": return value;
    case "german": return ((5.0 - value) / 4.0) * 100;  // inverted
    case "australian": return (value / 7.0) * 100;
    case "indian_10": return (value / 10.0) * 100;
  }
}
```

### Lightweight Convex Count Query for Live Match Count (D-07)
```typescript
// web/convex/eligibility.ts
export const getMatchCount = query({
  args: {
    nationalities: v.optional(v.array(v.string())),
    degreeLevels: v.optional(v.array(degreeLevelValidator)),
    fieldsOfStudy: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const results = await ctx.db
      .query("scholarships")
      .withIndex("by_status_deadline", (q) => q.eq("status", "published"))
      .take(600);

    let count = 0;
    for (const s of results) {
      if (s.application_deadline && s.application_deadline < now) continue;

      if (args.nationalities && args.nationalities.length > 0) {
        if (s.eligibility_nationalities && s.eligibility_nationalities.length > 0) {
          if (!args.nationalities.some((n) => s.eligibility_nationalities!.includes(n))) continue;
        }
      }

      if (args.degreeLevels && args.degreeLevels.length > 0) {
        if (!args.degreeLevels.some((d) => s.degree_levels.includes(d))) continue;
      }

      if (args.fieldsOfStudy && args.fieldsOfStudy.length > 0) {
        if (s.fields_of_study && s.fields_of_study.length > 0) {
          if (!args.fieldsOfStudy.some((f) => s.fields_of_study!.includes(f))) continue;
        }
      }

      count++;
    }

    return { count };
  },
});
```

### URL Param Encoding/Decoding for Compact Sharing (D-22)
```typescript
// web/src/lib/eligibility/url-params.ts

// Short codes for fields of study (first 2-3 chars or abbreviation)
const FIELD_SHORT_CODES: Record<string, string> = {
  "Agriculture": "agr", "Architecture": "arc", "Arts & Humanities": "art",
  "Business & Management": "biz", "Computer Science": "cs", "Economics": "eco",
  "Education": "edu", "Engineering": "eng", "Environmental Science": "env",
  "Health Sciences": "hsc", "International Relations": "ir", "Law": "law",
  "Mathematics": "math", "Media & Communication": "med", "Medicine": "med",
  "Natural Sciences": "nsc", "Nursing": "nur", "Pharmacy": "pha",
  "Philosophy": "phi", "Political Science": "pol", "Psychology": "psy",
  "Public Health": "ph", "Social Sciences": "ssc", "Technology": "tec",
  "Veterinary Science": "vet",
};

export function profileToUrlParams(profile: StudentProfile): Record<string, string> {
  const params: Record<string, string> = {};
  if (profile.nationalities.length > 0) params.n = profile.nationalities.join(",");
  if (profile.degreeLevel) params.d = profile.degreeLevel;
  if (profile.fieldsOfStudy.length > 0) {
    params.f = profile.fieldsOfStudy
      .map((f) => FIELD_SHORT_CODES[f] ?? f.slice(0, 3).toLowerCase())
      .join(",");
  }
  if (profile.destinationCountries?.length) params.dest = profile.destinationCountries.join(",");
  // ... additional params
  return params;
}

export function urlParamsToProfile(params: Record<string, string>): Partial<StudentProfile> {
  // Reverse mapping
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Convex `usePaginatedQuery` for all listings | `listScholarshipsBatch` with flat `.take()` for bounded reads | Already in codebase | The batch query pattern (directory.ts L473-636) is better for eligibility results since we need all matches at once for client scoring |
| React 18 concurrent features | React 19 with use() hook | Already on React 19.2.4 | Can use `use()` for suspense-based data loading if needed, but Convex `useQuery` already handles this |
| Zod v3 | Zod v4 (4.3.6) | Already migrated | Schema definition syntax may differ slightly from v3 examples online |

**Deprecated/outdated:**
- Nothing relevant to this phase. The project is already on latest versions of all dependencies.

## Project Constraints (from CLAUDE.md)

- **Git commits:** Do NOT add `Co-Authored-By: Claude` line to commit messages. Keep commit messages clean without Claude attribution.
- **Design system:** Neo-brutalism with bold borders, high contrast, distinctive shadows. All new UI must follow this.
- **Routing:** TanStack Start file-based routing under `web/src/routes/`
- **Backend:** Convex for all server-side data operations. No custom API endpoints.
- **Styling:** Tailwind CSS v4 with project's custom theme tokens (colors, spacing, border-radius as `rounded-base`, shadow as `shadow-shadow`)
- **Component conventions:** `cva` for variant styling, Radix UI primitives for accessibility, `lucide-react` for icons
- **UI phase:** `workflow.ui_phase` is true, meaning visual verification via playwright-cli will be available during implementation

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 + @testing-library/react 16.3.2 |
| Config file | `web/vitest.config.ts` |
| Quick run command | `cd web && npx vitest run --reporter=verbose` |
| Full suite command | `cd web && npx vitest run --coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| D-17 | Point-based scoring produces correct tiers (Strong 80%+, Good 50-79%, Partial 20-49%, Possible) | unit | `cd web && npx vitest run src/lib/eligibility/scoring.test.ts -x` | Wave 0 |
| D-18 | Weight hierarchy: nationality > degree > field | unit | `cd web && npx vitest run src/lib/eligibility/scoring.test.ts -x` | Wave 0 |
| D-22 | URL param encoding/decoding round-trips correctly | unit | `cd web && npx vitest run src/lib/eligibility/url-params.test.ts -x` | Wave 0 |
| D-12 | GPA scale conversion normalizes correctly across all scales | unit | `cd web && npx vitest run src/lib/eligibility/gpa-scales.test.ts -x` | Wave 0 |
| D-32 | Profile storage adapter saves/loads/clears correctly | unit | `cd web && npx vitest run src/lib/eligibility/profile-storage.test.ts -x` | Wave 0 |
| D-38 | Analytics trackEvent fires correct event names and properties | unit | `cd web && npx vitest run src/lib/analytics.test.ts -x` | Wave 0 |
| D-04 | Wizard step transitions (visual) | manual + playwright | Visual via playwright-cli | N/A |
| D-07 | Live count updates as fields change | integration | Manual via dev server | N/A |
| D-30 | Returning visitors see welcome back flow | integration | Manual via localStorage manipulation | N/A |

### Sampling Rate
- **Per task commit:** `cd web && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd web && npx vitest run --coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `web/src/lib/eligibility/scoring.test.ts` -- covers D-17, D-18, D-19
- [ ] `web/src/lib/eligibility/url-params.test.ts` -- covers D-22
- [ ] `web/src/lib/eligibility/gpa-scales.test.ts` -- covers D-12
- [ ] `web/src/lib/eligibility/profile-storage.test.ts` -- covers D-32
- [ ] `web/src/lib/analytics.test.ts` -- covers D-38, D-39
- [ ] `web/tests/setup.ts` -- already exists with `@testing-library/jest-dom/vitest`

## Open Questions

1. **Convex scan cap for eligibility query**
   - What we know: Existing `listScholarshipsBatch` uses `BATCH_QUERY_SCAN_CAP = 600`. Current published scholarship count is ~2400+.
   - What's unclear: Whether 600 is sufficient to cover all nationality+degree filtered results, or if a higher cap is needed.
   - Recommendation: Start with 600, monitor actual result counts. If nationality+degree filtering typically returns <200, the cap is fine. If it returns >500, increase to 1000 and add pagination to client scoring.

2. **SEO pre-generation for popular combinations (D-35)**
   - What we know: The decision calls for pre-generating popular nationality+degree pages for long-tail SEO.
   - What's unclear: How many combinations to pre-generate, and whether TanStack Start supports static pre-rendering for specific routes.
   - Recommendation: Start with the top 15 nationalities x 4 degree levels = 60 combinations. Implement via server-side rendering with proper meta tags. Use `noindex` for less common combinations. Defer actual static pre-generation to a later optimization if SSR performance is sufficient.

3. **Pull-to-refresh on mobile results (D-37)**
   - What we know: The decision mentions pull-to-refresh for mobile results.
   - What's unclear: Browser-native pull-to-refresh already exists; a custom implementation adds significant complexity.
   - Recommendation: Rely on browser-native pull-to-refresh (which reloads the page and re-fetches Convex data naturally). Do not build a custom pull-to-refresh mechanism.

## Sources

### Primary (HIGH confidence)
- Codebase inspection of all canonical reference files listed in CONTEXT.md
- `web/convex/schema.ts` -- scholarship data model, indexes, validators
- `web/convex/directory.ts` -- existing query patterns, scan caps, post-filtering approach
- `web/src/lib/filters.ts` -- field-of-study categories, degree levels, Zod schema
- `web/src/hooks/useScholarshipFilters.ts` -- URL param state management pattern
- `web/src/hooks/useNationalityDetect.ts` -- timezone-based nationality detection
- `web/src/hooks/useLocalStorage.ts` -- SSR-safe localStorage hook
- `web/src/components/directory/CountrySelector.tsx` -- reusable country dropdown
- `web/src/components/directory/ScholarshipCard.tsx` -- card component to extend
- `web/src/components/directory/FilterChips.tsx` -- filter pill component
- `web/src/lib/seo/meta.ts` + `json-ld.ts` -- SEO infrastructure
- `web/package.json` -- dependency versions verified
- `web/vitest.config.ts` -- test configuration

### Secondary (MEDIUM confidence)
- Convex free-tier limits and read bandwidth considerations (based on project knowledge of Convex pricing model)
- CSS slide transition approach (standard CSS transform + transition, widely documented)

### Tertiary (LOW confidence)
- Exact optimal scan cap value (600 vs higher) -- needs empirical validation with actual data distribution

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all dependencies are already installed, no new packages needed
- Architecture: HIGH -- patterns directly mirror established codebase conventions
- Pitfalls: HIGH -- derived from actual codebase analysis and Convex-specific experience
- Scoring engine design: MEDIUM -- point values are Claude's discretion, may need tuning
- SEO pre-generation approach: LOW -- D-35 is architecturally complex, details deferred to implementation

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable -- no dependency upgrades expected)
