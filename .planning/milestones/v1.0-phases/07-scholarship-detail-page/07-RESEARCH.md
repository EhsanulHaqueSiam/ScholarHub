# Phase 7: Scholarship Detail Page - Research

**Researched:** 2026-03-20
**Domain:** React detail page, markdown rendering, timezone display, SEO structured data, scroll-aware UI
**Confidence:** HIGH

## Summary

Phase 7 replaces the current placeholder scholarship detail page (`web/src/routes/scholarships/$slug.tsx`) with a comprehensive, section-based layout. The existing codebase is well-structured for this: the Convex schema already contains all required fields (funding booleans, editorial_notes, source_ids, last_verified, eligibility_nationalities, expected_reopen_month), the design system has prestige/urgency badges, and shared utility functions exist for formatting funding amounts, country flags, and deadline urgency.

The main technical challenges are: (1) resolving source_ids to source names/URLs for attribution display, which requires a new Convex query or modification of `getBySlug`; (2) rendering markdown editorial notes safely; (3) timezone-aware deadline display using the browser's Intl API; (4) implementing a sticky top bar that appears after scrolling past the hero section using IntersectionObserver; and (5) expanding the Schema.org JSON-LD to include eligibility, degree, funding, and deadline details.

**Primary recommendation:** Build as a single-file route replacement of `$slug.tsx` with extracted section components, one new Convex query for source resolution, a lightweight markdown renderer for editorial notes, and browser-native APIs (IntersectionObserver, Intl.DateTimeFormat) for scroll behavior and timezone display. No heavy new dependencies needed.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Page layout**: Single scroll with card-based sections. Section order: Hero -> Overview (description) -> Eligibility (nationalities, degrees, fields) -> Funding (breakdown, amount) -> How to Apply (deadline, link, editorial tips) -> Sources (attribution, verification)
- **Hero section**: Full hero with key decision info (title, provider, prestige badge, country flag, deadline urgency badge, degree levels, funding type) + large Apply button
- **Sticky top bar**: Slim bar sticks to top after scrolling past hero, showing truncated scholarship name + Copy Link + Apply Now. Same behavior desktop/mobile
- **Breadcrumb navigation**: "Scholarships > PhD > Germany > DAAD Scholarship" at top, clicking segments goes back to filtered directory with state preserved from URL params
- **Deadline display**: Date + countdown + urgency badge ("March 31, 2026 (12 days left)") with timezone dual display (scholarship timezone + student's local time). Expired: "Applications Closed" with expected reopen month
- **Eligibility nationalities**: Show first 10 with flag emojis, "+N more countries" clickable expand. Expanded grouped by region. "Open to All" gets prominent banner
- **Funding breakdown**: Checklist with icons (green check/grey X/dash for unknown). Coverage items: Tuition, Living Allowance, Travel, Insurance. Award amount with range. "Varies by program" for no data
- **Source attribution**: Footer card with clickable source name links (new tab), source count trust signal, last verified relative+absolute, stale data warning >30 days
- **Editorial notes**: Callout box with lightbulb icon, labeled "ScholarHub Tips", inside "How to Apply" section. Rich text via markdown (bold, links, bullets). "Tips coming soon" placeholder when absent
- **Copy/share**: Copy link only in sticky top bar (no social share buttons)
- **SEO meta title**: "{Title} -- {Funding Type} {Degree} Scholarship in {Country} | ScholarHub"
- **Schema.org JSON-LD**: Expand with eligibility, degree levels, fields, funding breakdown, source attribution, deadline timezone
- **No related scholarships**: Deferred to Phase 8 (DISC-03)

### Claude's Discretion
- Exact neo-brutalism card styling for each section
- Loading skeleton design for the detail page
- Exact spacing and typography hierarchy
- Dark mode adaptation for detail page sections
- Breadcrumb truncation strategy on mobile
- How to detect/handle deadline timezone when not stored in database
- Markdown parser library choice for editorial notes
- Region grouping logic for expanded nationality list

### Deferred Ideas (OUT OF SCOPE)
- Related scholarships on detail page -- Phase 8 (DISC-03)
- Social share buttons (Twitter, Facebook, LinkedIn) -- decided copy-link-only in Phase 06.1
- Student accounts for saving/bookmarking scholarships -- v2 (ACCT requirements)
- Application tracking features -- out of scope per REQUIREMENTS.md
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DTLP-01 | Detail page shows scholarship name, provider/organization, host country | Hero section: title, provider text, country flag+name badge. All fields exist on scholarship document. |
| DTLP-02 | Detail page shows eligible nationalities | Eligibility section: first 10 with flags via `getCountryFlag()`, expand button, region grouping. `eligibility_nationalities` field is `string[]` of ISO codes. |
| DTLP-03 | Detail page shows degree level(s) and field(s) of study | Eligibility section: `degree_levels` array and `fields_of_study` array from schema. Display as badge chips. |
| DTLP-04 | Detail page shows funding coverage breakdown | Funding section: `funding_tuition`, `funding_living`, `funding_travel`, `funding_insurance` booleans. Checklist with check/X/dash icons. |
| DTLP-05 | Detail page shows award amount (range or fixed, with currency) | Funding section: reuse `formatFundingAmount()` from ScholarshipCard. `award_amount_min`, `award_amount_max`, `award_currency` fields. |
| DTLP-06 | Detail page shows application deadline with timezone awareness | Hero + How to Apply: Intl.DateTimeFormat with timeZone option for dual display. `application_deadline` is epoch ms. Browser timezone via `Intl.DateTimeFormat().resolvedOptions().timeZone`. |
| DTLP-07 | Detail page shows direct link to official application page | How to Apply section: `application_url` field. Large Apply button in hero + sticky bar. Opens in new tab. |
| DTLP-08 | Detail page shows source attribution | Sources section: resolve `source_ids` (array of Convex IDs) to source name+URL via new query. Display as clickable links. |
| DTLP-09 | Detail page shows "last verified" date | Sources section: `last_verified` epoch ms field. Format as relative + absolute ("Verified 5 days ago (March 15, 2026)"). Stale warning >30 days. |
| DTLP-10 | Detail page shows admin editorial notes/tips when available | How to Apply section: `editorial_notes` string field (markdown). Render with simple markdown parser. "Tips coming soon" placeholder when null. |
| DTLP-11 | Detail page shows description/overview (rich text) | Overview section: `description` string field. Render as paragraph text (currently plain text in DB). |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react | ^19.2.4 | UI framework | Already in project |
| @tanstack/react-router | ^1.167.5 | File-based routing, `createFileRoute`, `head()` for meta | Already in project, $slug route exists |
| convex | ^1.33.1 | Backend queries, real-time subscriptions | Already in project, `getBySlug` query exists |
| class-variance-authority | ^0.7.1 | Component variant styling | Already in project, used for Card and Badge |
| lucide-react | ^0.577.0 | Icons (Check, X, Copy, ExternalLink, Clock, Lightbulb, etc.) | Already in project |
| i18n-iso-countries | ^7.14.0 | Country name/flag lookups | Already in project |
| zod | ^4.3.6 | URL search params validation | Already in project for filter schema |

### New (Recommended)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-markdown | 10.1.0 | Render editorial_notes markdown as React components | For DTLP-10 editorial notes rendering. Safe by default (no raw HTML injection). ~45KB gzipped. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-markdown | Custom regex parser | react-markdown handles edge cases (nested lists, link targets, XSS). Custom parser breaks on complex markdown. |
| react-markdown | marked + HTML string rendering | marked is faster but requires HTML sanitization and loses React component control. react-markdown outputs React elements directly -- safer approach. |
| react-markdown | Simple string replace for bold/links/lists only | Would work for basic editorial notes but breaks when admin writes slightly complex markdown. react-markdown is safe and correct for minimal overhead. |
| react-intersection-observer | Native IntersectionObserver in useEffect | Native API is sufficient for a single sticky bar observation. No need for a library for one observer. |

**Installation:**
```bash
cd web && npm install react-markdown
```

**Version verification:**
- react-markdown: 10.1.0 (verified via npm view, 2026-03-20)
- All other libraries are already installed at the versions listed in package.json

## Architecture Patterns

### Recommended Project Structure
```
web/src/
  routes/scholarships/
    $slug.tsx              # Main detail page (REWRITE existing placeholder)
  components/detail/       # NEW: detail page section components
    HeroSection.tsx        # Hero: title, provider, badges, apply button
    StickyBar.tsx          # Sticky top bar: name + copy link + apply
    Breadcrumb.tsx         # Breadcrumb navigation
    OverviewSection.tsx    # Description/overview text
    EligibilitySection.tsx # Nationalities, degrees, fields
    FundingSection.tsx     # Funding checklist, award amount
    HowToApplySection.tsx  # Deadline, apply link, editorial tips
    SourcesSection.tsx     # Source attribution, last verified
    EditorialTips.tsx      # ScholarHub Tips callout with markdown
  lib/
    shared.ts              # NEW: extracted helpers from ScholarshipCard (formatFundingAmount, formatFundingType, urgency maps)
    regions.ts             # NEW: country-to-region mapping for nationality grouping
    deadline.ts            # NEW: deadline formatting, countdown, timezone dual display
  convex/
    directory.ts           # MODIFY: add source resolution to getBySlug or new getScholarshipDetail query
```

### Pattern 1: Section Component Architecture
**What:** Each card section is a standalone component receiving typed props from the parent route.
**When to use:** Always for the detail page -- keeps $slug.tsx manageable and each section testable.
**Example:**
```typescript
// Source: project convention from ScholarshipCard.tsx pattern
interface FundingSectionProps {
  fundingType: string;
  fundingTuition: boolean | undefined;
  fundingLiving: boolean | undefined;
  fundingTravel: boolean | undefined;
  fundingInsurance: boolean | undefined;
  awardAmountMin: number | undefined;
  awardAmountMax: number | undefined;
  awardCurrency: string | undefined;
}

export function FundingSection(props: FundingSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Funding</CardTitle>
      </CardHeader>
      <CardContent>
        <FundingChecklist {...props} />
        <AwardAmount {...props} />
      </CardContent>
    </Card>
  );
}
```

### Pattern 2: IntersectionObserver for Sticky Bar
**What:** Use native IntersectionObserver API in a useEffect to detect when hero section leaves viewport, then show sticky bar.
**When to use:** For the sticky top bar that appears after scrolling past the hero.
**Example:**
```typescript
// Source: Native Web API + React pattern
function useIsHeroVisible(heroRef: React.RefObject<HTMLElement | null>) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [heroRef]);

  return isVisible;
}

// In component:
const heroRef = useRef<HTMLDivElement>(null);
const isHeroVisible = useIsHeroVisible(heroRef);
// Show sticky bar when !isHeroVisible
```

### Pattern 3: Convex Query with Source Resolution
**What:** Extend or create a new query that returns scholarship data WITH resolved source names/URLs.
**When to use:** For DTLP-08 source attribution display.
**Example:**
```typescript
// Source: Convex documentation pattern for joining related data
export const getScholarshipDetail = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const scholarship = await ctx.db
      .query("scholarships")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (!scholarship) return null;

    // Resolve source_ids to source name + URL
    const sources = await Promise.all(
      scholarship.source_ids.map(async (id) => {
        const source = await ctx.db.get(id);
        return source ? { name: source.name, url: source.url } : null;
      })
    );

    return {
      ...scholarship,
      resolved_sources: sources.filter(Boolean),
    };
  },
});
```

### Pattern 4: Timezone Dual Display
**What:** Show deadline in a reference timezone (e.g., CET for German scholarships) and the user's local timezone side by side using Intl.DateTimeFormat.
**When to use:** For DTLP-06 deadline timezone awareness.
**Example:**
```typescript
// Source: MDN Intl.DateTimeFormat documentation
function formatDeadlineDual(deadlineMs: number) {
  const date = new Date(deadlineMs);
  const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Format in user's local timezone
  const localFormat = new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: userTz,
  });

  // Countdown calculation
  const diffMs = deadlineMs - Date.now();
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return {
    formattedDate: localFormat.format(date),
    daysLeft,
    userTimezone: userTz,
    isExpired: diffMs < 0,
  };
}
```

### Pattern 5: Extract Shared Helpers from ScholarshipCard
**What:** Move `formatFundingAmount`, `formatFundingType`, urgency maps out of ScholarshipCard into a shared lib.
**When to use:** Before building detail page, to avoid duplication.
**Example:**
```typescript
// web/src/lib/shared.ts -- extracted from ScholarshipCard.tsx
export { formatFundingAmount, formatFundingType, urgencyVariantMap, urgencyLabelMap, hasLimitedInfo };
```

### Anti-Patterns to Avoid
- **Monolithic $slug.tsx:** Do NOT put all section HTML in one file. Extract section components for readability and testability.
- **Client-side source fetching in useEffect:** Do NOT fetch sources separately from the scholarship. Resolve in a single Convex query to avoid waterfall.
- **scroll event listener for sticky bar:** Do NOT use `window.addEventListener('scroll')` -- use IntersectionObserver for better performance.
- **Raw HTML injection for markdown:** Do NOT use `marked` + innerHTML. Use react-markdown for safe React component output.
- **Hardcoded timezone assumptions:** Do NOT assume the scholarship deadline is in any specific timezone. Use the browser's detected timezone and show only what we know.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Markdown to React | Custom regex parser for bold/links/lists | react-markdown | Edge cases: nested formatting, link sanitization, list nesting, code blocks. Regex breaks. |
| Country flags | Unicode codepoint math | `getCountryFlag()` from `@/lib/countries` | Already exists and handles all ISO codes correctly |
| Deadline urgency | Manual date math with hardcoded thresholds | `getDeadlineUrgency()` from `@/lib/filters` | Already exists, already tested, consistent with directory cards |
| Currency formatting | Manual string concatenation | `Intl.NumberFormat` via `formatFundingAmount()` | Already exists in ScholarshipCard, handles locale and currency symbol |
| Scroll detection | scroll event listener with throttle | IntersectionObserver API (native) | IntersectionObserver is async, performant, and requires no throttling. |
| Country-to-region mapping | Manual switch/case per country | Static data map (see regions.ts pattern below) | UN M49 regional grouping is standardized and covers all ISO codes |
| Relative date formatting | Manual "X days ago" string building | `Intl.RelativeTimeFormat` | Built-in browser API, handles pluralization and locale correctly |

**Key insight:** Most of the "hard" parts of this phase already have solutions in the codebase (`formatFundingAmount`, `getCountryFlag`, `getDeadlineUrgency`, urgency badge variants) or in browser APIs (IntersectionObserver, Intl.DateTimeFormat, Intl.RelativeTimeFormat). The main new code is layout/composition.

## Common Pitfalls

### Pitfall 1: Source ID Resolution Waterfall
**What goes wrong:** Fetching the scholarship first, then firing N separate queries for each source_id in a useEffect creates a loading waterfall.
**Why it happens:** The current `getBySlug` query returns raw `source_ids` (Convex ID references) without resolving them.
**How to avoid:** Create a single `getScholarshipDetail` query in Convex that resolves source_ids to source names/URLs server-side using `Promise.all(ids.map(id => ctx.db.get(id)))`.
**Warning signs:** Multiple loading states, visible flicker as sources load after scholarship data.

### Pitfall 2: Timezone Display When No Timezone Stored
**What goes wrong:** The schema stores `application_deadline` as epoch milliseconds (UTC) but has no explicit timezone field. Trying to show "11:59 PM CET" is impossible without knowing the scholarship's intended timezone.
**Why it happens:** The database stores when the deadline is (UTC epoch) but not which timezone was the source timezone.
**How to avoid:** Show the deadline date in the user's local timezone only. Use `Intl.DateTimeFormat` with the browser's timezone. Display format: "March 31, 2026 at 11:59 PM (your time)" with the user's timezone abbreviation. Do NOT fabricate a scholarship timezone that doesn't exist in the data.
**Warning signs:** Displaying "CET" or "EST" when there's no source timezone data to justify it.

### Pitfall 3: Hydration Mismatch on Countdown
**What goes wrong:** SSR renders "12 days left" but client hydrates moments later with a different value, causing React hydration errors.
**Why it happens:** TanStack Start does SSR, and Date.now() differs between server and client render.
**How to avoid:** Render countdown in a client-only component (suppress SSR), or use `useEffect` + `useState` to calculate countdown only on mount. The initial render should show the formatted date only, then update with countdown after hydration.
**Warning signs:** Console errors about hydration mismatch, "12 days left" flickering to "11 days left" on load.

### Pitfall 4: Breadcrumb State Reconstruction
**What goes wrong:** Breadcrumb shows "Scholarships > PhD > Germany > DAAD" but clicking "PhD" or "Germany" doesn't restore the filter state the user had.
**Why it happens:** The detail page URL is `/scholarships/daad-scholarship` with no filter context. The breadcrumb needs to reconstruct search params.
**How to avoid:** Pass filter context as URL search params on the detail page link (e.g., `?from=scholarships&degree=phd&to=DE`). Breadcrumb reads these params and builds links back to `/scholarships?degree=phd&to=DE`. Alternatively, use `window.history.state` or a referrer approach, but URL params are most reliable.
**Warning signs:** Breadcrumb links go to unfiltered directory, losing the user's filter context.

### Pitfall 5: "Open to All" vs Empty Nationalities
**What goes wrong:** Displaying "Open to All Nationalities" when the data is actually just missing/null rather than explicitly universal.
**Why it happens:** `eligibility_nationalities` being `undefined` or `[]` could mean "open to all" OR "data not collected."
**How to avoid:** Distinguish between the two cases. If `eligibility_nationalities` is undefined/null, it is likely missing data -- show "Eligibility information not available." If it is an empty array `[]`, treat as "Open to All." Treat populated array as the explicit list. Check the seed data convention to confirm.
**Warning signs:** Showing "Open to All" for scholarships that clearly have nationality restrictions (just missing data).

### Pitfall 6: Copy Link in Sticky Bar During SSR
**What goes wrong:** `navigator.clipboard` and `window.location.origin` are not available during SSR.
**Why it happens:** TanStack Start renders on the server where browser APIs don't exist.
**How to avoid:** Guard clipboard and window access with `typeof window !== 'undefined'` checks, or wrap in useEffect/event handler (which only runs client-side). The copy handler is already an onClick so it is fine, but generating the URL string needs a guard.
**Warning signs:** SSR build errors, undefined window references.

## Code Examples

### Deadline Countdown with Hydration Safety
```typescript
// Source: React pattern for client-only dynamic values
function useCountdown(deadlineMs: number | undefined) {
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!deadlineMs) return;
    const calculate = () => {
      const diff = deadlineMs - Date.now();
      setDaysLeft(Math.ceil(diff / (1000 * 60 * 60 * 24)));
    };
    calculate();
    const interval = setInterval(calculate, 60 * 1000); // Update every minute
    return () => clearInterval(interval);
  }, [deadlineMs]);

  return daysLeft;
}
```

### Region Grouping for Nationality Expand
```typescript
// Source: UN M49 standard regional groupings
const REGION_MAP: Record<string, string> = {
  // Africa
  DZ: "Africa", EG: "Africa", ET: "Africa", GH: "Africa", KE: "Africa",
  MA: "Africa", NG: "Africa", ZA: "Africa", TZ: "Africa", UG: "Africa",
  // Asia
  BD: "Asia", CN: "Asia", IN: "Asia", ID: "Asia", JP: "Asia",
  MY: "Asia", NP: "Asia", PK: "Asia", PH: "Asia", KR: "Asia",
  SG: "Asia", LK: "Asia", TH: "Asia", TR: "Asia", VN: "Asia",
  // Europe
  AT: "Europe", BE: "Europe", CZ: "Europe", DK: "Europe", FI: "Europe",
  FR: "Europe", DE: "Europe", GR: "Europe", HU: "Europe", IE: "Europe",
  IT: "Europe", NL: "Europe", NO: "Europe", PL: "Europe", PT: "Europe",
  ES: "Europe", SE: "Europe", CH: "Europe", GB: "Europe",
  // Americas
  AR: "Americas", BR: "Americas", CA: "Americas", CL: "Americas",
  MX: "Americas", US: "Americas",
  // Oceania
  AU: "Oceania", NZ: "Oceania",
  // Middle East
  AE: "Middle East", JO: "Middle East", LB: "Middle East", SA: "Middle East",
};

function getRegion(countryCode: string): string {
  return REGION_MAP[countryCode.toUpperCase()] ?? "Other";
}

function groupByRegion(countryCodes: string[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  for (const code of countryCodes) {
    const region = getRegion(code);
    if (!groups[region]) groups[region] = [];
    groups[region].push(code);
  }
  return groups;
}
```

### Relative + Absolute Date Formatting
```typescript
// Source: Intl.RelativeTimeFormat MDN docs
function formatLastVerified(timestampMs: number | undefined): {
  relative: string;
  absolute: string;
  isStale: boolean;
} | null {
  if (!timestampMs) return null;

  const now = Date.now();
  const diffMs = now - timestampMs;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const isStale = diffDays > 30;

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const relative = rtf.format(-diffDays, "day");

  const dtf = new Intl.DateTimeFormat("en-US", { dateStyle: "long" });
  const absolute = dtf.format(new Date(timestampMs));

  return { relative, absolute, isStale };
}
// Output: { relative: "5 days ago", absolute: "March 15, 2026", isStale: false }
```

### Funding Checklist Component
```typescript
// Source: Project convention (CVA + Lucide icons)
import { Check, X, Minus } from "lucide-react";

function FundingItem({
  label,
  covered,
}: { label: string; covered: boolean | undefined }) {
  return (
    <div className="flex items-center gap-2">
      {covered === true && (
        <Check className="size-4 text-urgency-open" aria-label="Covered" />
      )}
      {covered === false && (
        <X className="size-4 text-urgency-closed" aria-label="Not covered" />
      )}
      {covered === undefined && (
        <Minus className="size-4 text-foreground/40" aria-label="Not specified" />
      )}
      <span className={cn(
        "text-sm",
        covered === undefined && "text-foreground/50"
      )}>
        {label}
        {covered === undefined && " (Not specified)"}
      </span>
    </div>
  );
}
```

### Breadcrumb with Filter State Preservation
```typescript
// Source: TanStack Router + project URL param convention
import { Link } from "@tanstack/react-router";

function DetailBreadcrumb({
  scholarshipTitle,
}: {
  scholarshipTitle: string;
}) {
  // Read referrer filter params passed via URL
  const search = Route.useSearch();

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
      <Link
        to="/scholarships"
        search={search}
        className="hover:underline underline-offset-4"
      >
        Scholarships
      </Link>
      <span className="text-foreground/40">&gt;</span>
      <span className="truncate max-w-[200px]">{scholarshipTitle}</span>
    </nav>
  );
}
```

### Meta Tags with Dynamic Content
```typescript
// Source: TanStack Router head() pattern from existing $slug.tsx
export const Route = createFileRoute("/scholarships/$slug")({
  head: ({ params }) => {
    return {
      meta: [
        {
          title: `Scholarship Details | ScholarHub`,
          // NOTE: head() runs before component, so scholarship data
          // may not be available. Use params.slug as fallback.
          // Dynamic title update happens in component via document.title
        },
      ],
    };
  },
  component: ScholarshipDetailPage,
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| scroll event listener + throttle | IntersectionObserver API | Widely supported since 2020+ | No throttle/debounce needed, browser-optimized |
| moment.js for timezone display | Intl.DateTimeFormat with timeZone option | Intl API mature since 2022+ | Zero dependency, built into all modern browsers |
| moment.fromNow() for relative dates | Intl.RelativeTimeFormat | Available since Chrome 71+ (2018) | Zero dependency, locale-aware |
| marked + DOMPurify for markdown | react-markdown (uses micromark internally) | react-markdown v9+ (2024) | Safe by default, outputs React elements, no HTML parsing needed |
| Custom JSON-LD builder | Schema.org Scholarship type + JSON-LD | Schema.org has no official "Scholarship" type | Use combination of Grant/EducationalOccupationalProgram or custom @type "Scholarship" (existing project pattern) |

**Deprecated/outdated:**
- `anyApi` import used in current placeholder: Should be replaced with typed API import from `convex/_generated/api` once getScholarshipDetail is created
- Placeholder "Full detail page coming in Phase 7" div: Will be removed entirely

## Open Questions

1. **Deadline Timezone Interpretation**
   - What we know: `application_deadline` is stored as epoch ms (UTC). No timezone field exists in the schema.
   - What's unclear: Whether deadline times in the seed data represent midnight UTC, or the original source's local timezone converted to UTC.
   - Recommendation: Display the deadline date in the user's local timezone with their timezone label. Do NOT show a "scholarship timezone" since we don't have one. If this data is added later (e.g., `application_deadline_tz` field), the display can be enhanced. This is Claude's discretion per CONTEXT.md.

2. **"Open to All" vs Missing Data Convention**
   - What we know: `eligibility_nationalities` is `v.optional(v.array(v.string()))`. It can be undefined, empty array, or populated.
   - What's unclear: Whether undefined means "open to all" or "data not collected."
   - Recommendation: Treat undefined/null as "data not available" (show nothing or "Check official page"). Treat empty array `[]` as "Open to All Nationalities." Treat populated array as the explicit list. Check the seed data to confirm this convention.

3. **Breadcrumb State Preservation Strategy**
   - What we know: Directory page uses URL search params (`?degree=phd&to=DE`). Detail page URL is `/scholarships/$slug`.
   - What's unclear: Whether to pass the full filter state as search params on the detail page URL or use another mechanism.
   - Recommendation: Pass minimal referrer params on the detail link (e.g., `?ref=directory&degree=phd&to=DE`). Breadcrumb reads these and builds back-links. This keeps URLs shareable while preserving context.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.0 + @testing-library/react 16.3.2 |
| Config file | `web/vitest.config.ts` |
| Quick run command | `cd web && npx vitest run --reporter=verbose` |
| Full suite command | `cd web && npx vitest run --reporter=verbose` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DTLP-01 | Hero shows title, provider, country | unit | `cd web && npx vitest run src/__tests__/detail-sections.test.tsx -t "hero"` | No -- Wave 0 |
| DTLP-02 | Nationality list display + expand + open to all | unit | `cd web && npx vitest run src/__tests__/detail-sections.test.tsx -t "eligibility"` | No -- Wave 0 |
| DTLP-03 | Degree levels and fields of study display | unit | `cd web && npx vitest run src/__tests__/detail-sections.test.tsx -t "eligibility"` | No -- Wave 0 |
| DTLP-04 | Funding coverage checklist rendering | unit | `cd web && npx vitest run src/__tests__/detail-sections.test.tsx -t "funding"` | No -- Wave 0 |
| DTLP-05 | Award amount formatting with range/currency | unit | `cd web && npx vitest run src/__tests__/detail-helpers.test.ts -t "formatFunding"` | No -- Wave 0 |
| DTLP-06 | Deadline countdown and timezone display | unit | `cd web && npx vitest run src/__tests__/detail-helpers.test.ts -t "deadline"` | No -- Wave 0 |
| DTLP-07 | Apply button links to application_url | unit | `cd web && npx vitest run src/__tests__/detail-sections.test.tsx -t "apply"` | No -- Wave 0 |
| DTLP-08 | Source attribution with resolved names/URLs | unit (Convex) | `cd web && npx vitest run src/__tests__/detail-query.test.ts -t "source"` | No -- Wave 0 |
| DTLP-09 | Last verified date display + stale warning | unit | `cd web && npx vitest run src/__tests__/detail-helpers.test.ts -t "verified"` | No -- Wave 0 |
| DTLP-10 | Editorial notes markdown rendering + placeholder | unit | `cd web && npx vitest run src/__tests__/detail-sections.test.tsx -t "editorial"` | No -- Wave 0 |
| DTLP-11 | Description/overview rendering | unit | `cd web && npx vitest run src/__tests__/detail-sections.test.tsx -t "overview"` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `cd web && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd web && npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `web/src/__tests__/detail-sections.test.tsx` -- covers DTLP-01, DTLP-02, DTLP-03, DTLP-04, DTLP-07, DTLP-10, DTLP-11
- [ ] `web/src/__tests__/detail-helpers.test.ts` -- covers DTLP-05, DTLP-06, DTLP-09 (pure function tests for formatting helpers)
- [ ] `web/src/__tests__/detail-query.test.ts` -- covers DTLP-08 (Convex query test for source resolution)

## Sources

### Primary (HIGH confidence)
- Existing codebase: `web/convex/schema.ts` -- scholarship table with all DTLP fields verified
- Existing codebase: `web/src/routes/scholarships/$slug.tsx` -- current placeholder to be replaced
- Existing codebase: `web/src/components/directory/ScholarshipCard.tsx` -- reusable helpers verified
- Existing codebase: `web/convex/directory.ts` -- getBySlug query verified, source resolution gap identified
- [MDN Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat) -- timezone display API
- [MDN IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver) -- scroll detection API

### Secondary (MEDIUM confidence)
- npm registry: react-markdown 10.1.0 verified via `npm view`
- [react-markdown GitHub](https://github.com/remarkjs/react-markdown) -- safe markdown rendering, uses micromark
- [Schema.org Grant type](https://schema.org/Grant) -- closest Schema.org type for scholarship funding
- [Smashing Magazine: Dynamic Header with Intersection Observer](https://www.smashingmagazine.com/2021/07/dynamic-header-intersection-observer/) -- sticky bar pattern

### Tertiary (LOW confidence)
- Region grouping logic: hand-built from UN M49 standard. Should be validated against the actual nationality codes in the database to ensure all countries are covered.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed except react-markdown (verified version)
- Architecture: HIGH -- follows existing project patterns (CVA, Convex queries, section components)
- Pitfalls: HIGH -- verified against existing codebase (SSR, source resolution, timezone limitations)

**Research date:** 2026-03-20
**Valid until:** 2026-04-20 (stable domain, no breaking changes expected)
