# Phase 8: Discovery Features - Research

**Researched:** 2026-03-23
**Domain:** Curated collections, scholarship comparison, related scholarships, tag system, auto-tagging pipeline
**Confidence:** HIGH

## Summary

Phase 8 adds three major discovery features on top of the existing Convex + TanStack Start + neo-brutalism stack: (1) admin-managed curated collections with auto-populating filter-based membership, (2) side-by-side scholarship comparison with shareable URLs, and (3) related scholarships on detail pages using multi-factor scoring. A comprehensive tag system underpins collections and enriches scholarship metadata.

The implementation builds entirely on existing patterns. The Convex trigger-wrapped mutation pattern (already used for prestige scoring and search text) extends naturally to auto-tagging, related_ids precomputation, and collection count caching. The admin dashboard's React state tab switching extends with Collections and Tags tabs. The directory's `listScholarshipsBatch` query pattern reuses for collection detail pages. The FeaturedRow horizontal scroll pattern reuses for featured collections. No new libraries are needed -- everything uses the existing stack (Convex, TanStack Router, CVA, Radix, Lucide).

The phase is large (113 decisions in CONTEXT.md) but technically straightforward since every pattern has a proven precedent in earlier phases. The primary complexity is in the sheer number of new UI components, Convex queries/mutations, and schema additions -- not in unfamiliar technology.

**Primary recommendation:** Decompose into backend-first waves (schema + tags + auto-tagging + related scoring), then admin UI (collection CRUD + tag management), then public UI (collection browsing + comparison + tag display + related section). Keep each plan to 2-3 tasks maximum per project velocity norms.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01 through D-16: Collection schema as hybrid Convex table with structured filter criteria, auto-generated slugs, 3 statuses, featured flag, emoji icons, manual sort order, markdown descriptions, per-collection default sort, cached scholarship_count, view counter, timestamps
- D-17 through D-25: Predefined + freeform tag system with 5 categories, ~25-30 tags, snake_case names, tag descriptions, tooltips, detail-page-only display as outline badges, tag click navigation
- D-26 through D-33: Write-time auto-tagging via trigger pattern, suggested tags with accept/reject, separate suggested_tags field, matched text snippets, additive only, backfill + ongoing, high-confidence keyword matching
- D-34 through D-39: Tag management in admin -- multi-select with autocomplete, inline creation, bulk tagging, suggested tag review, tags tab with grouped list and filter-then-tag
- D-40 through D-53: Collection browsing -- featured row on /scholarships, full browse at /collections, navbar link, collection cards with emoji/name/count/description, collection detail reusing directory listing, copy link, simple grid, empty state, horizontal scroll mobile
- D-54 through D-67: Comparison -- checkboxes on cards, dedicated /scholarships/compare page with slug-based URLs, session-only React context, difference highlighting, search-to-add, related suggestions, empty state, SEO, mobile horizontal scroll table, single batch query
- D-68 through D-80: Related scholarships -- multi-factor scoring (provider 35%, country 25%, degree 15%, funding 15%, tags 10%), admin-configurable weights, proportional overlap, 4-6 compact cards, precomputed related_ids, exclude expired, deterministic
- D-81 through D-84: Admin collections/tags tabs extending existing tab switcher
- D-85 through D-87: File-based routing for /collections, /collections/$slug, /scholarships/compare
- D-88 through D-94: Performance -- minimize queries, debounced view counter, cached counts, precomputed related_ids, single batch queries, SSR loading
- D-95 through D-97: 10 seed collections with specified emojis, filters, and sort orders
- D-98 through D-102: WCAG AA accessibility for comparison table, keyboard support, ARIA live regions, focus indicators, reduced motion
- D-103 through D-105: Dark mode using existing CSS vars
- D-106 through D-108: Error handling -- inline error + retry, missing compare scholarships warning, skeleton loading
- D-109: Full test coverage -- backend logic + UI component tests
- D-110 through D-112: Mobile -- fixed bottom compare bar, single column collection cards, tags flex-wrap
- D-113: SEO prep -- route structure + basic meta titles only (Phase 9 for full SEO)

### Claude's Discretion
- Collection ordering method (drag-and-drop vs numeric input)
- Comparison fields selection and comparison bar design
- Winner/recommendation summary on compare page
- Featured collections row personalization by nationality
- Sort display label on collection detail page
- Tags section label in hero (with or without "Tags:" label)
- Empty state for no related scholarships (hide section vs show message)
- Additional auto-tag categories beyond the initial 4

### Deferred Ideas (OUT OF SCOPE)
- Full collection SEO (structured data, OG images, auto-generated meta descriptions, sitemap) -- Phase 9
- Data-driven popular destinations -- future enhancement
- PostHog analytics for collection views/clicks -- v2
- Student accounts for saving/bookmarking collections -- v2
- AI-powered auto-tagging with LLM analysis -- future, keyword matching for now
- Collection recommendations based on browsing history -- requires student accounts
- Collaborative comparison (share + annotate) -- future enhancement
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DISC-01 | Curated collections -- admin-created, tag-based, auto-populating lists | Collections Convex table with structured filter criteria, admin CRUD via Collections tab, public browsing at /collections and featured row on /scholarships, tag system for filter-based membership |
| DISC-02 | Scholarship comparison -- side-by-side comparison of 2-3 scholarships | CompareContext React context, compare checkboxes on cards, /scholarships/compare route with slug-based URLs, ComparisonTable with difference highlighting, single batch Convex query |
| DISC-03 | Related scholarships shown on detail page | Multi-factor scoring algorithm (provider/country/degree/funding/tags), precomputed related_ids via trigger + daily cron, RelatedScholarships section after SourcesSection, compact cards |
</phase_requirements>

## Standard Stack

### Core (Already Installed -- No New Dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| convex | ^1.33.1 | Backend database, queries, mutations, crons, triggers | Already the backend -- all new tables/queries/mutations use same patterns |
| convex-helpers | ^0.1.114 | Triggers for auto-tagging, related_ids precomputation, collection count caching | Already used for prestige triggers -- same `customMutation(rawMutation, customCtx(wrapDB))` pattern |
| @tanstack/react-router | ^1.167.5 | File-based routing for /collections, /collections/$slug, /scholarships/compare | Already the router -- new routes follow established file-based pattern |
| @tanstack/react-start | ^1.167.1 | SSR for collection pages | Already configured for SSR |
| class-variance-authority | ^0.7.1 | Variants for collection cards, tag badges, compare bar | Already used for card prestige variants and badge variants |
| @radix-ui/react-dialog | ^1.1.15 | Collection edit slide-out sheet (same as EditPanel) | Already used for EditPanel |
| @radix-ui/react-tooltip | ^1.2.8 | Tag description tooltips | Already installed |
| @radix-ui/react-popover | ^1.1.15 | Search-to-add dropdown in comparison page | Already used for CountrySelector |
| lucide-react | ^0.577.0 | Icons for compare, collections, tags UI | Already installed |
| react-markdown | ^10.1.0 | Markdown rendering for collection descriptions (D-10) | Already installed for editorial notes |
| zod | ^4.3.6 | Route search param validation for /collections, /scholarships?tags= | Already used for scholarship search schema |
| vitest | ^4.1.0 | Testing framework for backend logic and UI component tests | Already configured with jsdom environment |
| convex-test | ^0.0.41 | Convex query/mutation testing | Already used for existing tests |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| React Context for compare state | Zustand/Jotai | D-56 specifies session-only state cleared on refresh -- React Context is simpler, no added dep |
| Numeric sort order input | @dnd-kit for drag-and-drop | Numeric input is simpler, fewer edge cases, matches admin's low-frequency use. Recommend numeric input |
| Custom tag autocomplete | @radix-ui/react-combobox | Radix Popover + input is sufficient (same pattern as CountrySelector), no new dep needed |

**Installation:** No new packages needed. The existing stack covers all requirements.

## Architecture Patterns

### New Convex Modules

```
web/convex/
  collections.ts       # Collections CRUD queries + mutations (admin + public)
  tags.ts              # Tag management queries + mutations (admin)
  tagging.ts           # Auto-tagging rules + backfill migration
  related.ts           # Related scholarships scoring + precomputation
  comparison.ts        # Batch query for comparison page
```

### New Route Structure

```
web/src/routes/
  collections/
    index.tsx           # /collections browse page
    $slug.tsx           # /collections/$slug detail page
  scholarships/
    compare.tsx         # /scholarships/compare (MUST register before $slug catch-all)
```

### New Component Structure

```
web/src/components/
  collections/
    CollectionCard.tsx          # Grid card with emoji, name, count, description
    FeaturedCollectionsRow.tsx   # Horizontal scroll row for /scholarships
    CollectionHeader.tsx        # Detail page header (emoji, name, description, count)
  comparison/
    CompareContext.tsx           # React context provider for compare state
    CompareCheckbox.tsx          # Checkbox overlay for cards
    CompareBar.tsx               # Floating bottom bar with selected scholarships
    ComparisonTable.tsx          # Side-by-side table with difference highlighting
    SearchToAdd.tsx              # Popover search to add scholarship to comparison
  detail/
    TagBadges.tsx                # Outline tag badges for hero section
    RelatedScholarships.tsx      # "Similar Scholarships" section
  admin/
    CollectionsManager.tsx       # Collections tab -- table list + edit sheet
    CollectionEditForm.tsx       # Create/edit collection form with live preview
    TagsManager.tsx              # Tags tab -- grouped list, filter-then-tag, pending review
    SuggestedTagReview.tsx       # Accept/reject suggested tags with reason tooltip
```

### Pattern 1: Trigger-Wrapped Mutations for Auto-Computation

**What:** Extend the existing trigger system to auto-compute tags, related_ids, and collection counts on write.
**When to use:** Any scholarship field change that should cascade to computed fields.
**How it works:** The existing `triggers.ts` registers a callback on "scholarships" table. Extend it to also compute `suggested_tags` (auto-tagging) and `related_ids` (related scholarships) alongside prestige/search_text.

```typescript
// In triggers.ts -- extend existing trigger
triggers.register("scholarships", async (ctx, change) => {
  if (change.operation === "delete") return;
  const doc = change.newDoc;

  // Existing: prestige + search_text
  const score = calculatePrestigeScore({...});
  const tier = scoreTier(score);
  const searchText = buildSearchText({...});

  // NEW: Auto-tagging (suggested tags)
  const suggestedTags = computeSuggestedTags(doc);

  // NEW: Related scholarships
  const relatedIds = await computeRelatedIds(ctx, doc);

  const patches: Record<string, unknown> = {};
  if (doc.prestige_score !== score) patches.prestige_score = score;
  if (doc.prestige_tier !== tier) patches.prestige_tier = tier;
  if (doc.search_text !== searchText) patches.search_text = searchText;
  // Only patch suggested_tags if new suggestions found
  if (suggestedTags.length > 0 && !arraysEqual(doc.suggested_tags, suggestedTags)) {
    patches.suggested_tags = suggestedTags;
  }
  if (!arraysEqual(doc.related_ids, relatedIds)) {
    patches.related_ids = relatedIds;
  }

  if (Object.keys(patches).length > 0) {
    await ctx.db.patch(doc._id, patches);
  }
});
```

**Important consideration:** The trigger fires on every scholarship write. Auto-tagging is lightweight (keyword matching -- no LLM). Related scoring queries other scholarships, so it must be bounded (take(50) candidates). Both should guard against infinite loops by checking if values actually changed before patching.

### Pattern 2: Collection Filter Execution

**What:** Collections store filter criteria declaratively. At query time, execute these filters against the scholarships table using the same index-based query patterns as listScholarshipsBatch.
**When to use:** Collection detail pages, collection scholarship counts.

```typescript
// In collections.ts
export const getCollectionScholarships = query({
  args: {
    slug: v.string(),
    sort: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const collection = await ctx.db
      .query("collections")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (!collection) return null;

    // Build query from collection filter criteria
    // Reuse same index-based filtering as directory.ts
    const sort = args.sort ?? collection.default_sort ?? "deadline";
    // ... apply host_countries, degree_levels, funding_types, tags filters
  },
});
```

### Pattern 3: Compare Context Provider

**What:** React Context for session-only compare state. Wraps the app at router level.
**When to use:** Any page where compare checkboxes appear (directory, detail, collection detail, related cards).

```typescript
// CompareContext.tsx
interface CompareState {
  selectedSlugs: string[];
  addToCompare: (slug: string, title: string) => void;
  removeFromCompare: (slug: string) => void;
  clearCompare: () => void;
  isSelected: (slug: string) => boolean;
  isFull: boolean; // max 3
}

const CompareContext = createContext<CompareState | null>(null);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = useState<Map<string, string>>(new Map());
  // ... provider value
}
```

### Pattern 4: Related Scholarships Scoring Algorithm

**What:** Multi-factor weighted scoring to find similar scholarships.
**When to use:** Precomputed on scholarship write, stored as `related_ids` field.

```typescript
// In related.ts
export function scoreRelated(
  source: Scholarship,
  candidate: Scholarship,
  weights: RelatedWeights,
): number {
  let score = 0;

  // Provider match (35%) -- exact string match
  if (source.provider_organization === candidate.provider_organization) {
    score += weights.provider; // 35
  }

  // Country match (25%) -- exact match
  if (source.host_country === candidate.host_country) {
    score += weights.country; // 25
  }

  // Degree overlap (15%) -- proportional
  const degreeOverlap = intersectionSize(source.degree_levels, candidate.degree_levels)
    / Math.max(source.degree_levels.length, 1);
  score += degreeOverlap * weights.degree; // 15

  // Funding match (15%) -- exact match
  if (source.funding_type === candidate.funding_type) {
    score += weights.funding; // 15
  }

  // Tag overlap (10%) -- proportional
  const sourceTags = source.tags ?? [];
  const candidateTags = candidate.tags ?? [];
  if (sourceTags.length > 0) {
    const tagOverlap = intersectionSize(sourceTags, candidateTags)
      / sourceTags.length;
    score += tagOverlap * weights.tags; // 10
  }

  return score;
}
```

### Anti-Patterns to Avoid
- **Unbounded queries in triggers:** Always `.take(N)` when querying candidates in trigger callbacks. Never `.collect()` the entire scholarships table for related scoring.
- **Redundant real-time subscriptions:** Collections should use cached `scholarship_count` field, not a live count query. Each subscription costs Convex bandwidth.
- **Client-side collection filtering:** Collection membership should be resolved server-side via Convex query, not by fetching all scholarships and filtering in the browser.
- **String-based tag matching without normalization:** Always use snake_case internal names for tag matching. Display labels are for UI only.
- **Trigger infinite loops:** The trigger must check if computed values actually changed before patching. Otherwise patch triggers trigger triggers trigger triggers...

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Slide-out edit forms | Custom modal/sheet | Radix Dialog (same as EditPanel) | Focus trap, body scroll lock, animations, a11y all handled |
| Tag autocomplete | Custom dropdown with keyboard nav | Radix Popover + input (CountrySelector pattern) | Keyboard navigation, screen reader support, positioning |
| Horizontal scroll with arrows | Custom scroll observer | FeaturedRow pattern (copy the ref+ResizeObserver pattern) | Scroll state detection, reduced motion support, arrow button show/hide |
| URL search param management | Manual URLSearchParams | TanStack Router validateSearch + useSearch (filters.ts pattern) | Type-safe, synced with route, back/forward button support |
| Tooltip for tag descriptions | Custom hover div | Radix Tooltip (already installed) | Accessible, positioned correctly, touch support, delay |
| Confirm dialogs for destructive actions | window.confirm | Radix AlertDialog (BulkActionBar pattern) | Accessible, styled consistently, non-blocking |
| Markdown rendering | Custom parser | react-markdown (already used in EditorialTips) | Security (allowedElements whitelist), nested list support |

**Key insight:** Every UI pattern needed in Phase 8 has a direct precedent in earlier phases. The rule is: find the existing implementation, copy the pattern, adapt to new context. No new libraries, no new architectural patterns.

## Common Pitfalls

### Pitfall 1: Trigger Performance with Related Scoring
**What goes wrong:** Related scoring in the trigger queries N scholarships for every scholarship write, creating O(N) reads per write during bulk aggregation.
**Why it happens:** The trigger fires on every scholarship patch, including during batch aggregation of 50+ records.
**How to avoid:** Two strategies: (1) In triggers, only compute related_ids if `tags` or key fields actually changed (compare oldDoc vs newDoc). (2) Use daily cron for reverse updates -- when scholarship A changes, A's related_ids update immediately, but B's related_ids (which might now include A) update at next cron run.
**Warning signs:** Slow aggregation batches, Convex function timeout errors during pipeline runs.

### Pitfall 2: Compare Route vs $slug Catch-All Collision
**What goes wrong:** TanStack Router matches `/scholarships/compare` as `$slug = "compare"` instead of the dedicated compare route.
**Why it happens:** The `$slug` dynamic segment in `scholarships/$slug.tsx` catches everything. Route registration order matters.
**How to avoid:** File-based routing resolves this -- TanStack Router matches static segments before dynamic ones. `compare.tsx` (static) will match before `$slug.tsx` (dynamic). Verify after creating the file that `routeTree.gen.ts` registers compare before $slug.
**Warning signs:** Navigating to /scholarships/compare shows "Scholarship Not Found" detail page.

### Pitfall 3: Collection Count Cache Staleness
**What goes wrong:** The `scholarship_count` on collections becomes stale when scholarships are added/removed/status-changed without updating all affected collections.
**Why it happens:** A scholarship might match multiple collections. When it changes status from published to archived, all matching collections need count updates.
**How to avoid:** Trigger on scholarship writes should recompute counts for affected collections. However, checking all collections per scholarship write is expensive. Better approach: batch recount via cron (daily) with trigger-based update only for the most recently edited collection. Accept eventual consistency for counts (they're display-only).
**Warning signs:** Collection cards showing incorrect count badges.

### Pitfall 4: Tag Array Post-Filtering Performance
**What goes wrong:** Filtering scholarships by tags requires array-includes logic, which Convex filter expressions don't support natively (same as nationality eligibility).
**Why it happens:** Convex `.filter()` operates on scalar fields, not array containment.
**How to avoid:** Use the same post-filter pattern as nationality eligibility in `directory.ts`. Fetch with index (by_status_deadline), then post-filter for tag membership. For collection queries, the filter criteria map to existing indexed fields (host_country, funding_type, prestige_tier) -- tags are the only post-filter.
**Warning signs:** Empty results when filtering by tags despite matching scholarships existing.

### Pitfall 5: Schema Migration for New Fields
**What goes wrong:** Adding `suggested_tags`, `related_ids`, `tags` (already optional) to scholarships schema, and creating the `collections` table requires schema push before any code referencing these fields.
**Why it happens:** Convex schema validation rejects writes to undefined fields.
**How to avoid:** Schema changes must deploy first. Plan Wave 0 as schema + core backend before any UI that reads these fields. All new fields on `scholarships` should be `v.optional()` for backward compatibility.
**Warning signs:** "Schema validation failed" errors in Convex dashboard.

### Pitfall 6: Comparison Page SSR Hydration
**What goes wrong:** Comparison page URL contains slug params (`?s=slug1,slug2`). If SSR renders with no data and client hydrates with data, layout shift occurs.
**Why it happens:** TanStack Start SSR renders the initial HTML before Convex queries resolve.
**How to avoid:** Use skeleton loading (DetailSkeleton pattern) for comparison page. The empty state should render server-side when no slugs provided. When slugs are present, show content-shaped skeleton until the batch query resolves.
**Warning signs:** Flash of empty state before comparison table renders.

### Pitfall 7: Auto-Tagging Backfill Scale
**What goes wrong:** One-time backfill of suggested_tags for all existing scholarships hits Convex function execution limits.
**Why it happens:** Processing hundreds of scholarships in one mutation exceeds the 10-second Convex function timeout.
**How to avoid:** Use the same batch + scheduler pattern as `archiveExpired` and `reevaluateSourceScholarships`. Process 50 records per batch, schedule next batch via `ctx.scheduler.runAfter(0, ...)`.
**Warning signs:** Backfill mutation timing out, partial tagging.

## Code Examples

### Collections Schema Addition

```typescript
// In schema.ts -- new collections table + schema changes to scholarships

export const collectionStatusValidator = v.union(
  v.literal("draft"),
  v.literal("active"),
  v.literal("archived"),
);

// Add to scholarships table:
// suggested_tags: v.optional(v.array(v.object({
//   tag: v.string(),
//   reason: v.string(),
//   suggested_at: v.number(),
// }))),
// related_ids: v.optional(v.array(v.id("scholarships"))),

// New collections table:
collections: defineTable({
  name: v.string(),
  slug: v.string(),
  emoji: v.string(),
  description: v.optional(v.string()),  // markdown
  status: collectionStatusValidator,
  is_featured: v.boolean(),
  sort_order: v.number(),
  default_sort: v.optional(v.string()),  // "deadline" | "prestige" | "newest"
  // Filter criteria (AND between types, OR within)
  host_countries: v.optional(v.array(v.string())),
  degree_levels: v.optional(v.array(degreeLevelValidator)),
  funding_types: v.optional(v.array(fundingTypeValidator)),
  fields_of_study: v.optional(v.array(v.string())),
  prestige_tiers: v.optional(v.array(prestigeTierValidator)),
  tags: v.optional(v.array(v.string())),
  // Time-based criteria
  deadline_before: v.optional(v.number()),
  deadline_after: v.optional(v.number()),
  added_since: v.optional(v.number()),
  // Cached stats
  scholarship_count: v.number(),
  view_count: v.number(),
  // Timestamps
  created_at: v.number(),
  updated_at: v.number(),
})
  .index("by_slug", ["slug"])
  .index("by_status", ["status"])
  .index("by_featured", ["is_featured", "status"])
  .index("by_sort_order", ["status", "sort_order"]),
```

### Tag Constants Definition

```typescript
// In tags.ts (convex) or lib/tags.ts (shared)
export const TAG_CATEGORIES = {
  eligibility: {
    label: "Eligibility",
    tags: [
      { id: "no_gre", label: "No GRE", description: "No GRE score required for application" },
      { id: "women_only", label: "Women Only", description: "Exclusively for women/female applicants" },
      { id: "developing_countries", label: "Developing Countries", description: "Open to applicants from developing nations" },
      { id: "open_to_all", label: "Open to All", description: "No nationality or demographic restrictions" },
      { id: "undergraduate_only", label: "Undergraduate Only", description: "Available only for undergraduate students" },
    ],
  },
  subject: {
    label: "Subject",
    tags: [
      { id: "stem", label: "STEM", description: "Science, Technology, Engineering, Mathematics" },
      { id: "arts_humanities", label: "Arts & Humanities", description: "Literature, history, philosophy, languages, fine arts" },
      { id: "business", label: "Business", description: "MBA, management, finance, accounting" },
      { id: "social_sciences", label: "Social Sciences", description: "Sociology, psychology, political science, anthropology" },
      { id: "health_medical", label: "Health & Medical", description: "Medicine, nursing, public health, biomedical sciences" },
    ],
  },
  duration: {
    label: "Duration",
    tags: [
      { id: "short_term", label: "Short Term", description: "Programs under 6 months" },
      { id: "full_degree", label: "Full Degree", description: "Covers entire degree program duration" },
      { id: "summer_program", label: "Summer Program", description: "Summer semester or vacation period programs" },
      { id: "exchange", label: "Exchange", description: "Student exchange or semester abroad programs" },
    ],
  },
  funding: {
    label: "Funding",
    tags: [
      { id: "merit_based", label: "Merit Based", description: "Awarded based on academic or professional merit" },
      { id: "need_based", label: "Need Based", description: "Financial need considered in selection" },
      { id: "research_grant", label: "Research Grant", description: "Funding for research projects or dissertations" },
    ],
  },
  region: {
    label: "Region",
    tags: [
      { id: "europe", label: "Europe", description: "Scholarships in European countries" },
      { id: "asia", label: "Asia", description: "Scholarships in Asian countries" },
      { id: "americas", label: "Americas", description: "Scholarships in North/South America" },
      { id: "africa", label: "Africa", description: "Scholarships in African countries" },
      { id: "middle_east", label: "Middle East", description: "Scholarships in Middle Eastern countries" },
      { id: "oceania", label: "Oceania", description: "Scholarships in Australia, NZ, Pacific Islands" },
    ],
  },
} as const;
```

### Auto-Tagging Rules (High-Confidence Keyword Matching)

```typescript
// In tagging.ts
interface TagRule {
  tag: string;
  patterns: RegExp[];
  fields: ("title" | "description" | "eligibility_nationalities" | "degree_levels" | "fields_of_study")[];
}

const AUTO_TAG_RULES: TagRule[] = [
  {
    tag: "no_gre",
    patterns: [/gre\s*(is\s*)?(not\s+)?required/i, /no\s+gre/i, /gre\s*waived/i, /without\s+gre/i],
    fields: ["description", "title"],
  },
  {
    tag: "women_only",
    patterns: [/women\s+only/i, /female\s+only/i, /exclusively\s+for\s+women/i, /for\s+women/i],
    fields: ["description", "title"],
  },
  {
    tag: "stem",
    patterns: [/\bstem\b/i, /science.*technology.*engineering/i, /engineering\s+and\s+technology/i],
    fields: ["title", "description", "fields_of_study"],
  },
  {
    tag: "developing_countries",
    patterns: [/developing\s+(countries|nations|world)/i, /low[- ]income\s+countr/i, /global\s+south/i],
    fields: ["description", "title"],
  },
  // Additional rules Claude can add during implementation:
  {
    tag: "merit_based",
    patterns: [/merit[- ]based/i, /academic\s+excellence/i, /outstanding\s+academic/i],
    fields: ["description", "title"],
  },
  {
    tag: "research_grant",
    patterns: [/research\s+(grant|fellowship|fund)/i, /doctoral\s+research/i, /dissertation\s+fund/i],
    fields: ["description", "title"],
  },
];

// Region tags auto-assigned from host_country using existing REGION_MAP
function autoAssignRegionTag(hostCountry: string): string | null {
  const region = REGION_MAP[hostCountry.toUpperCase()];
  if (!region) return null;
  const regionTagMap: Record<string, string> = {
    "Europe": "europe",
    "Asia": "asia",
    "Americas": "americas",
    "Africa": "africa",
    "Middle East": "middle_east",
    "Oceania": "oceania",
  };
  return regionTagMap[region] ?? null;
}
```

### Comparison Batch Query

```typescript
// In comparison.ts (convex)
export const getComparisonScholarships = query({
  args: {
    slugs: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.slugs.length < 2 || args.slugs.length > 3) return [];

    // Single round-trip: parallel lookups by slug
    const results = await Promise.all(
      args.slugs.map((slug) =>
        ctx.db
          .query("scholarships")
          .withIndex("by_slug", (q) => q.eq("slug", slug))
          .first()
      ),
    );

    return results.filter(
      (s): s is NonNullable<typeof s> =>
        s !== null && s.status === "published",
    );
  },
});
```

### Compare Context Provider

```typescript
// In CompareContext.tsx
export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = useState<Map<string, string>>(new Map());
  // Map<slug, title> for display in compare bar

  const addToCompare = useCallback((slug: string, title: string) => {
    setSelected((prev) => {
      if (prev.size >= 3) return prev; // max 3
      const next = new Map(prev);
      next.set(slug, title);
      return next;
    });
  }, []);

  const removeFromCompare = useCallback((slug: string) => {
    setSelected((prev) => {
      const next = new Map(prev);
      next.delete(slug);
      return next;
    });
  }, []);

  const isSelected = useCallback(
    (slug: string) => selected.has(slug),
    [selected],
  );

  return (
    <CompareContext.Provider
      value={{
        selectedSlugs: Array.from(selected.keys()),
        selectedItems: Array.from(selected.entries()).map(([slug, title]) => ({ slug, title })),
        addToCompare,
        removeFromCompare,
        clearCompare: () => setSelected(new Map()),
        isSelected,
        isFull: selected.size >= 3,
        count: selected.size,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual tag curation only | Keyword-based auto-tag suggestions + manual review | This phase | Dramatically reduces admin workload for tagging hundreds of scholarships |
| No discovery beyond search/filter | Curated collections + comparison + related | This phase | Students find scholarships through multiple entry points, not just search |
| Separate queries per item | Batch queries for comparison + cached counts | This phase | Minimizes Convex free tier function call consumption |

**Deprecated/outdated:**
- None. All existing patterns remain valid and are extended, not replaced.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.0 + convex-test 0.0.41 |
| Config file | `web/vitest.config.ts` |
| Quick run command | `cd web && npx vitest run --reporter=verbose` |
| Full suite command | `cd web && npx vitest run --reporter=verbose --coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DISC-01a | Collection filter matching returns correct scholarships | unit | `cd web && npx vitest run src/__tests__/collections.test.ts -t "filter matching"` | Wave 0 |
| DISC-01b | Collection CRUD mutations (create, update, archive) | unit | `cd web && npx vitest run src/__tests__/collections.test.ts -t "CRUD"` | Wave 0 |
| DISC-01c | Auto-tagging rules match expected keywords | unit | `cd web && npx vitest run src/__tests__/tagging.test.ts` | Wave 0 |
| DISC-01d | Collection scholarship count caching | unit | `cd web && npx vitest run src/__tests__/collections.test.ts -t "count"` | Wave 0 |
| DISC-02a | Comparison batch query returns correct scholarships | unit | `cd web && npx vitest run src/__tests__/comparison.test.ts` | Wave 0 |
| DISC-02b | ComparisonTable renders differences highlighted | unit | `cd web && npx vitest run src/__tests__/ComparisonTable.test.tsx` | Wave 0 |
| DISC-03a | Related scoring algorithm produces correct rankings | unit | `cd web && npx vitest run src/__tests__/related.test.ts` | Wave 0 |
| DISC-03b | Related scoring excludes expired scholarships | unit | `cd web && npx vitest run src/__tests__/related.test.ts -t "expired"` | Wave 0 |
| DISC-03c | Proportional degree/tag overlap scoring | unit | `cd web && npx vitest run src/__tests__/related.test.ts -t "proportional"` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd web && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd web && npx vitest run --reporter=verbose --coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `web/src/__tests__/collections.test.ts` -- covers DISC-01 collection logic
- [ ] `web/src/__tests__/tagging.test.ts` -- covers auto-tagging rule matching
- [ ] `web/src/__tests__/comparison.test.ts` -- covers comparison batch query
- [ ] `web/src/__tests__/related.test.ts` -- covers related scoring algorithm
- [ ] `web/src/__tests__/ComparisonTable.test.tsx` -- covers comparison UI

## Discretion Recommendations

### Collection Ordering: Numeric Input (not drag-and-drop)
**Recommendation:** Use simple numeric input field (1-99) for collection sort order.
**Rationale:** Admin operates on 10-15 collections max. Numeric input is simpler to implement, works in slide-out sheet, persists naturally to `sort_order` field. Drag-and-drop requires @dnd-kit, complex state management, and doesn't add value at this scale.

### Comparison Fields
**Recommendation:** Show these fields in comparison table rows:
1. Provider/Organization
2. Host Country (with flag)
3. Degree Levels
4. Funding Type + Coverage (tuition/living/travel/insurance checkmarks)
5. Award Amount
6. Application Deadline (with urgency badge)
7. Fields of Study
8. Eligibility (nationality count or "Open to All")
9. Prestige Tier

### Compare Bar Design
**Recommendation:** Fixed bottom bar (same positioning as BulkActionBar) showing selected scholarship titles with remove (X) buttons, "Compare" primary button, and count indicator. On mobile: fixed bottom with slightly taller height for touch targets.

### Winner/Recommendation Summary
**Recommendation:** Skip for now. Declaring a "winner" is subjective and could mislead students. The difference highlighting already makes it easy to compare. Defer to future enhancement if user feedback requests it.

### Featured Collections Personalization
**Recommendation:** No personalization by nationality in Phase 8. Show the same featured collections to everyone based on admin sort order. Nationality-based personalization is complex (which collections are relevant to which nationalities?) and the admin's featured flag + sort order already curates the experience.

### Sort Display on Collection Detail
**Recommendation:** Show active sort as a label next to sort pills: "Sorted by: Prestige" (derived from collection's default_sort). When user changes sort, the label updates. Reuse existing SortPills component.

### Tags Section Label in Hero
**Recommendation:** No explicit "Tags:" label. The outline badge styling is visually distinct enough from other badges. Adding a label wastes space. If needed for accessibility, use `aria-label="Tags"` on the containing div.

### Empty State for No Related Scholarships
**Recommendation:** Hide the section entirely. If a scholarship has no related results, showing "No similar scholarships found" adds no value and creates visual noise. The section simply doesn't render.

### Additional Auto-Tag Categories
**Recommendation:** Add `merit_based` and `research_grant` to the initial auto-tagging rules (6 total: no_gre, women_only, stem, developing_countries, merit_based, research_grant). Region tags auto-assign from host_country using existing REGION_MAP. These 6 + region auto-assignment cover the most useful tags without over-tagging.

## Open Questions

1. **Related Scoring Performance at Scale**
   - What we know: Scoring requires querying candidate scholarships for each source. With 1000+ scholarships, finding candidates by provider/country/degree is bounded by take(50).
   - What's unclear: Whether 50 candidates is sufficient for quality results, or whether provider-first then country-first candidate pools should be merged.
   - Recommendation: Start with take(50) candidates ordered by same provider, then same country, then same funding type. Monitor quality manually. The daily cron handles reverse updates.

2. **Collection Time-Based Filters (deadline_before, deadline_after, added_since)**
   - What we know: Collections like "Closing This Month" need deadline_before = end-of-month, which changes monthly.
   - What's unclear: Whether these time thresholds should be stored as absolute timestamps or relative (e.g., "30 days from now").
   - Recommendation: Store as relative descriptors (e.g., `deadline_window: "30_days"` or `added_window: "14_days"`) and compute the actual timestamp at query time. This way "Closing This Month" always shows current deadlines without manual updates.

3. **Convex Generated API Types After Adding New Modules**
   - What we know: Previous phases manually updated `_generated/api.d.ts` to include new modules (admin, directory).
   - What's unclear: Whether running `npx convex dev` will auto-regenerate correctly with the new modules (collections, tags, tagging, related, comparison).
   - Recommendation: After creating new Convex modules, run `npx convex dev` to regenerate. If auto-generation fails, manually add module type imports to `api.d.ts` following the existing pattern.

## Sources

### Primary (HIGH confidence)
- Existing codebase analysis: `web/convex/schema.ts`, `web/convex/triggers.ts`, `web/convex/prestige.ts`, `web/convex/admin.ts`, `web/convex/directory.ts`, `web/convex/aggregation.ts`
- Existing UI patterns: `FeaturedRow.tsx`, `ScholarshipCard.tsx`, `EditPanel.tsx`, `BulkActionBar.tsx`, `HeroSection.tsx`, `EmptyState.tsx`, `badge.tsx`, `card.tsx`
- Existing routing: `web/src/routes/scholarships/index.tsx`, `web/src/routes/scholarships/$slug.tsx`, `web/src/routes/admin/index.tsx`
- Project decisions: `08-CONTEXT.md` (113 decisions covering every aspect of the phase)

### Secondary (MEDIUM confidence)
- TanStack Router file-based routing -- static segments (compare.tsx) matched before dynamic ($slug.tsx) per TanStack Router docs
- Convex trigger-wrapped mutations -- verified pattern working in production via prestige scoring

### Tertiary (LOW confidence)
- None. All findings verified against existing working codebase.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new deps, everything already installed and proven
- Architecture: HIGH -- every pattern has a direct precedent in existing codebase
- Pitfalls: HIGH -- identified from actual project history (nationality post-filtering, trigger loops, batch pagination)
- Scoring algorithm: MEDIUM -- weights from CONTEXT.md decisions, but proportional overlap logic needs unit testing

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (stable -- no moving targets, all patterns established)
