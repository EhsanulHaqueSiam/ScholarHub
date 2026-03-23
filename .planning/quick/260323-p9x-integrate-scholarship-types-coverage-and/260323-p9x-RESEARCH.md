# Quick Task 260323-p9x: Integrate Scholarship Types, Coverage, and Guidance - Research

**Researched:** 2026-03-23
**Domain:** Convex schema extension + React frontend UI enrichment
**Confidence:** HIGH

## Summary

This task adds scholarship type classification, two new coverage booleans, and application tips to the existing ScholarHub schema and UI. The codebase already has well-established patterns for every building block: enum validators in `schema.ts`, colored Badge variants in `badge.tsx` (CVA), coverage checklist grid in `FundingSection.tsx`, filter toggle buttons in `FilterPanel.tsx`, and triggered mutations in `aggregation.ts`. The work is primarily wiring new fields into existing patterns rather than inventing new ones.

**Primary recommendation:** Follow the existing validator + optional field + Badge variant pattern exactly. Add `scholarshipTypeValidator` alongside the existing `fundingTypeValidator`, extend the Badge CVA with 9 type-specific color variants, and create a `lib/scholarship-types.ts` knowledge base file containing type metadata, colors, display labels, and static tips.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Schema additions: `scholarship_type` enum, `coverage_books` + `coverage_research` booleans, `application_tips` field
- Backend: classification logic to derive scholarship_type from existing data (source category, tags, provider name)
- Frontend: colored pills on cards, coverage visual checklist on detail, timeline awareness, contextual tips
- 3 plans: schema+backend, frontend cards/directory, frontend detail+tips
- Type Display: Colored pills -- Government=blue, Merit=gold, Need-based=green, University=purple, Research=indigo, Country-specific=teal, Athletic=red, Subject-specific=orange. Max 2 pills per card. Same pills on detail HeroSection.
- Coverage UX: Grid of 6 items with check/cross icons on detail. All 6 always shown. On cards: compact "Covers: Tuition + Living + Travel" line.
- Tips Source: Static knowledge base + per-scholarship `application_tips` field override.
- Enum values: merit, need_based, government, university, country_specific, subject_specific, research, athletic, general
- New schema fields: `funding_books` (boolean), `funding_research` (boolean)
- Classification heuristics based on source category, tags, provider name

### Claude's Discretion
- None explicitly listed -- all decisions are locked

### Deferred Ideas (OUT OF SCOPE)
- None listed
</user_constraints>

## Codebase Patterns (Actionable Findings)

### 1. Schema Extension Pattern
**Confidence: HIGH** -- Direct codebase evidence

All enum validators follow the same pattern in `schema.ts`:
```typescript
export const scholarshipTypeValidator = v.union(
  v.literal("merit"),
  v.literal("need_based"),
  v.literal("government"),
  v.literal("university"),
  v.literal("country_specific"),
  v.literal("subject_specific"),
  v.literal("research"),
  v.literal("athletic"),
  v.literal("general"),
);
export type ScholarshipType = Infer<typeof scholarshipTypeValidator>;
```

New fields on `scholarships` table (all optional for backward compat):
- `scholarship_type: v.optional(scholarshipTypeValidator)`
- `funding_books: v.optional(v.boolean())`
- `funding_research: v.optional(v.boolean())`
- `application_tips: v.optional(v.string())`

Same fields on `raw_records` table (except `application_tips` which is scholarship-level only):
- `funding_books: v.optional(v.boolean())`
- `funding_research: v.optional(v.boolean())`

**Convex migration note:** Convex schema changes with optional fields are non-breaking. `npx convex dev` applies them instantly. No data migration needed -- existing docs just have `undefined` for new fields.

### 2. Search Index Impact
**Confidence: HIGH** -- Direct codebase evidence

Current search index on scholarships:
```typescript
.searchIndex("search_scholarships", {
  searchField: "search_text",
  filterFields: ["status", "host_country", "funding_type", "prestige_tier"],
})
```

**Decision needed:** Adding `scholarship_type` to `filterFields` would enable search-time filtering. Convex allows up to 16 filter fields on a search index. Currently at 4. The search index must be dropped and recreated when filterFields change -- Convex handles this automatically on `npx convex dev` but queries return no results during reindexing (usually seconds to minutes depending on data size).

**Recommendation:** Add `scholarship_type` to `filterFields` now. The directory query already has the single-value optimization pattern (lines 122-129 of directory.ts):
```typescript
if (args.scholarshipTypes && args.scholarshipTypes.length === 1) {
  sq = sq.eq("scholarship_type", args.scholarshipTypes[0]);
}
```

### 3. Badge Variant System
**Confidence: HIGH** -- Direct codebase evidence

`badge.tsx` uses CVA (class-variance-authority). New type variants follow the same pattern. The existing color system uses oklch in `index.css`. For scholarship types, use Tailwind arbitrary values or add CSS custom properties.

**Recommended approach:** Add CSS custom properties for each type color (like prestige tiers), then add Badge variants:
```typescript
// In badge.tsx variants
scholarshipGovernment: "bg-[var(--type-government)] text-white border-[var(--type-government-border)] font-heading",
scholarshipMerit: "bg-[var(--type-merit)] text-black border-[var(--type-merit-border)] font-heading",
// ... etc
```

**Color mapping (oklch values for neo-brutalism):**
| Type | Color | Light bg oklch | Border oklch |
|------|-------|----------------|--------------|
| government | Blue | oklch(75% 0.12 240) | oklch(50% 0.16 240) |
| merit | Gold | oklch(80% 0.14 85) | oklch(55% 0.18 85) |
| need_based | Green | oklch(75% 0.14 155) | oklch(50% 0.18 155) |
| university | Purple | oklch(75% 0.12 300) | oklch(50% 0.16 300) |
| research | Indigo | oklch(72% 0.14 275) | oklch(48% 0.18 275) |
| country_specific | Teal | oklch(75% 0.10 195) | oklch(50% 0.14 195) |
| athletic | Red | oklch(72% 0.16 25) | oklch(48% 0.20 25) |
| subject_specific | Orange | oklch(78% 0.14 60) | oklch(52% 0.18 60) |
| general | Neutral | secondary-background | border |

### 4. Card Enhancement Points
**Confidence: HIGH** -- Direct codebase evidence

`ScholarshipCard.tsx` layout (line 103-150):
1. `CardHeader` -- Title + Provider (line 103-109)
2. `CardContent` badge row -- Prestige + Urgency + New + LimitedInfo (line 112-121)
3. `CardContent` -- Description + Degrees + Funding (line 124-151)
4. `CardFooter` -- Copy Link (line 154-175)

**Type pills placement:** After CardHeader, before existing badge row. Add a new flex row:
```tsx
{/* Scholarship type pills - max 2 */}
{scholarship.scholarship_type && scholarship.scholarship_type !== "general" && (
  <CardContent className="flex flex-wrap gap-1.5 -mt-2">
    <Badge variant={typeVariantMap[scholarship.scholarship_type]}>
      {typeLabels[scholarship.scholarship_type]}
    </Badge>
  </CardContent>
)}
```

**Coverage line placement:** Inside the funding area (after funding type label), as a compact text line:
```tsx
<span className="text-xs text-foreground/70">
  Covers: {getCoverageList(scholarship).join(" + ")}
</span>
```

`ScholarshipListItem.tsx` needs the same additions in its badge row (line 150-162).

### 5. FundingSection Enhancement
**Confidence: HIGH** -- Direct codebase evidence

`FundingSection.tsx` already has a `COVERAGE_ITEMS` array (line 17-22) and a `CoverageIcon` component (line 24-36) that handles true/false/undefined states. Extending is trivial:

```typescript
const COVERAGE_ITEMS = [
  { key: "tuition", label: "Tuition" },
  { key: "living", label: "Living Allowance" },
  { key: "travel", label: "Travel" },
  { key: "insurance", label: "Insurance" },
  { key: "books", label: "Books & Materials" },       // NEW
  { key: "research", label: "Research Expenses" },    // NEW
] as const;
```

The section accepts individual booleans as props. Add `fundingBooks` and `fundingResearch` to the interface.

**Grid layout change:** Current is vertical list. Switch to 2-column grid for 6 items:
```tsx
<div className="grid grid-cols-2 gap-2">
```

### 6. Classification Logic Location
**Confidence: HIGH** -- Architecture decision

The aggregation pipeline in `aggregation.ts` creates/merges scholarships. Classification should happen as a write-time trigger in `triggers.ts` (like prestige scoring) OR as part of `createScholarship` / `mergeIntoScholarship` in aggregation.

**Recommendation:** Add classification to the trigger in `triggers.ts`. This ensures:
- All write paths (aggregation, admin edit, bulk import) get classification
- Existing scholarships get classified on next edit
- Clean separation of concerns

The trigger already loads doc fields needed for classification (tags, provider_organization). We need to resolve source category by looking up `source_ids[0]`.

**Alternative (simpler):** Add a `classifyScholarshipType` helper called from `createScholarship` and the trigger. The trigger approach requires a DB read for source category, which adds latency to every write.

**Simpler approach:** Backfill mutation + classify in `createScholarship` only. Admin can override manually. The trigger handles re-classification on tag/field changes.

### 7. Backfill Strategy
**Confidence: HIGH**

Existing pattern: `backfillMatchKeys` in `aggregation.ts` (line 145-178) shows the batched backfill pattern:
```typescript
export const backfillScholarshipTypes = triggeredInternalMutation({
  args: { cursor: v.union(v.string(), v.null()), batchSize: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const scholarships = await ctx.db.query("scholarships")
      .filter(q => q.eq(q.field("scholarship_type"), undefined))
      .take(args.batchSize ?? 50);
    // classify and patch each...
    if (scholarships.length === batchSize) { /* schedule next batch */ }
  },
});
```

### 8. Filter Integration
**Confidence: HIGH** -- Direct codebase evidence

Filter constants in `lib/filters.ts` follow a `{ value, label }` pattern. Add:
```typescript
export const SCHOLARSHIP_TYPES = [
  { value: "government", label: "Government" },
  { value: "merit", label: "Merit-Based" },
  { value: "need_based", label: "Need-Based" },
  { value: "university", label: "University" },
  { value: "research", label: "Research" },
  { value: "country_specific", label: "Country-Specific" },
  { value: "subject_specific", label: "Subject-Specific" },
  { value: "athletic", label: "Athletic" },
] as const;
```

`useScholarshipFilters.ts` needs a new `type` filter key. `FilterPanel.tsx` needs a new section (same toggle button pattern as funding type). URL param: `?type=government,merit`.

`listScholarshipsBatch` and `listScholarships` queries need a new `scholarshipTypes` arg with `.filter()` and search index eq.

### 9. Static Tips Knowledge Base
**Confidence: HIGH** -- Architecture pattern

Create `web/src/lib/scholarship-types.ts` as a single source of truth:
```typescript
export const SCHOLARSHIP_TYPE_META: Record<ScholarshipType, {
  label: string;
  color: string;        // CSS variable name
  badgeVariant: string;  // Badge component variant
  icon?: string;
  tip: string;           // Default static tip
  coverageTip?: string;  // Tip shown below coverage grid
}> = { ... };
```

This file is imported by:
- `ScholarshipCard.tsx` / `ScholarshipListItem.tsx` (label + variant)
- `HeroSection.tsx` (same pills)
- `FundingSection.tsx` (coverage tip below grid)
- `HowToApplySection.tsx` or new `ApplicationTipsSection.tsx` (tips display)
- `FilterPanel.tsx` / `filters.ts` (filter options)

### 10. Detail Page Tips Display
**Confidence: HIGH** -- Existing component pattern

`HowToApplySection.tsx` already renders `<EditorialTips>` for admin notes. Application tips should appear in a similar pattern, either:
- A new card section "Application Tips" between Funding and How to Apply
- Integrated into the existing HowToApplySection as a subsection

**Recommendation:** Add a new `ApplicationTipsSection.tsx` that shows:
1. Per-scholarship `application_tips` (if present) -- priority
2. Static tips from the knowledge base based on `scholarship_type`
3. Coverage-aware tips (e.g., "This scholarship does not cover living expenses. Budget X/month.")

### 11. Admin updateScholarship Mutation
**Confidence: HIGH** -- Direct codebase evidence

`admin.ts` line 447-506 shows `updateScholarship` accepts a deeply typed updates object. Must add:
- `scholarship_type: v.optional(scholarshipTypeValidator)`
- `funding_books: v.optional(v.boolean())`
- `funding_research: v.optional(v.boolean())`
- `application_tips: v.optional(v.string())`

The admin ReviewQueue UI at `components/admin/ReviewQueue.tsx` needs new fields exposed for editing.

### 12. HeroSection Integration
**Confidence: HIGH** -- Direct codebase evidence

`HeroSection.tsx` (line 50-64) has a badge row. Type pills go after prestige badge, before country:
```tsx
{/* Badge row */}
<div className="flex items-center gap-2 flex-wrap">
  {prestigeTier !== "unranked" && <Badge variant={prestigeTier}>...</Badge>}
  {scholarshipType && scholarshipType !== "general" && (
    <Badge variant={typeVariantMap[scholarshipType]}>
      {SCHOLARSHIP_TYPE_META[scholarshipType].label}
    </Badge>
  )}
  <Badge variant="neutral">...</Badge>  {/* country */}
  <Badge variant="neutral">{formatFundingType(fundingType)}</Badge>
</div>
```

HeroSection props need `scholarshipType?: ScholarshipType`.

## Common Pitfalls

### Pitfall 1: Search Index Reindexing Downtime
**What goes wrong:** Adding `scholarship_type` to searchIndex filterFields triggers reindexing. During reindexing, search queries may return empty results.
**How to avoid:** Deploy schema changes during low-traffic period. The reindex is fast (seconds to minutes for ~2400 docs). No user action needed.

### Pitfall 2: Trigger Infinite Loop
**What goes wrong:** Classification trigger sets `scholarship_type`, which fires the trigger again.
**How to avoid:** The existing trigger already handles this pattern (line 87-89 in triggers.ts): only patch if values actually changed. Follow the same guard.

### Pitfall 3: Card Height Bloat
**What goes wrong:** Adding type pills + coverage line makes cards taller, breaking grid alignment.
**How to avoid:** Keep coverage line as a single-line truncated string ("Covers: Tuition + Living + 2 more"). Type pills use `text-xs` size. Test with cards that have all badges active.

### Pitfall 4: Classification Accuracy on Sparse Data
**What goes wrong:** Many scholarships lack tags and have generic provider names, so heuristics default to "general" for most.
**How to avoid:** Use multiple signals: source category (most reliable), tags, provider name keywords, description keywords. Accept that "general" is fine for uncategorizable ones.

## Code Examples

### Coverage Helper for Cards
```typescript
// lib/scholarship-types.ts
export function getCoveredItems(scholarship: {
  funding_tuition?: boolean;
  funding_living?: boolean;
  funding_travel?: boolean;
  funding_insurance?: boolean;
  funding_books?: boolean;
  funding_research?: boolean;
}): string[] {
  const items: string[] = [];
  if (scholarship.funding_tuition) items.push("Tuition");
  if (scholarship.funding_living) items.push("Living");
  if (scholarship.funding_travel) items.push("Travel");
  if (scholarship.funding_insurance) items.push("Insurance");
  if (scholarship.funding_books) items.push("Books");
  if (scholarship.funding_research) items.push("Research");
  return items;
}

export function formatCoverageCompact(items: string[]): string | null {
  if (items.length === 0) return null;
  if (items.length <= 3) return `Covers: ${items.join(" + ")}`;
  return `Covers: ${items.slice(0, 2).join(" + ")} + ${items.length - 2} more`;
}
```

### Classification Heuristic
```typescript
// convex/classification.ts
export function classifyScholarshipType(
  sourceCategory: string | undefined,
  tags: string[] | undefined,
  providerOrg: string,
  description: string | undefined,
): ScholarshipType {
  const lowerTags = (tags ?? []).map(t => t.toLowerCase());
  const lowerDesc = (description ?? "").toLowerCase();
  const lowerOrg = providerOrg.toLowerCase();

  // Source category is most reliable signal
  if (sourceCategory === "government") return "government";
  if (sourceCategory === "university") return "university";
  if (sourceCategory === "foundation") {
    // Foundations can be merit, need-based, or research
    if (lowerTags.some(t => t.includes("need") || t.includes("financial"))) return "need_based";
    if (lowerTags.some(t => t.includes("research") || t.includes("phd"))) return "research";
    return "merit";
  }

  // Tag-based signals
  if (lowerTags.some(t => t.includes("merit") || t.includes("academic"))) return "merit";
  if (lowerTags.some(t => t.includes("need") || t.includes("financial"))) return "need_based";
  if (lowerTags.some(t => t.includes("research") || t.includes("phd"))) return "research";
  if (lowerTags.some(t => t.includes("athletic") || t.includes("sport"))) return "athletic";

  // Provider name signals
  if (lowerOrg.includes("government") || lowerOrg.includes("ministry")) return "government";

  // Description signals (lower confidence)
  if (lowerDesc.includes("based on financial need")) return "need_based";
  if (lowerDesc.includes("research grant") || lowerDesc.includes("research fellowship")) return "research";

  return "general";
}
```

## Files to Modify (Complete List)

### Plan 1: Schema + Backend
| File | Change |
|------|--------|
| `web/convex/schema.ts` | Add `scholarshipTypeValidator`, new fields on scholarships + raw_records |
| `web/convex/aggregation.ts` | Import and call classifier in `createScholarship`, merge OR for new booleans in `mergeIntoScholarship`, add `backfillScholarshipTypes` mutation |
| `web/convex/triggers.ts` | Add classification re-trigger on tag/source changes |
| `web/convex/admin.ts` | Add new fields to `updateScholarship` args |
| `web/convex/directory.ts` | Add `scholarshipTypes` filter arg to `listScholarships` + `listScholarshipsBatch`, add to search index filterFields, add to `applyPostFilters` |
| `web/convex/scraping.ts` | Add `funding_books`, `funding_research` to `batchInsertRawRecords` record schema |
| NEW `web/convex/classification.ts` | `classifyScholarshipType()` helper |

### Plan 2: Frontend Cards + Directory
| File | Change |
|------|--------|
| NEW `web/src/lib/scholarship-types.ts` | Type metadata, colors, labels, coverage helpers |
| `web/src/index.css` | Add `--type-*` CSS custom properties (light + dark) |
| `web/src/components/ui/badge.tsx` | Add 9 scholarship type Badge variants |
| `web/src/components/directory/ScholarshipCard.tsx` | Add type pills + coverage compact line |
| `web/src/components/directory/ScholarshipListItem.tsx` | Add type pills + coverage compact line |
| `web/src/lib/filters.ts` | Add `SCHOLARSHIP_TYPES` constant, add `type` to search schema |
| `web/src/hooks/useScholarshipFilters.ts` | Add `type` filter parsing + queryArgs |
| `web/src/components/directory/FilterPanel.tsx` | Add Scholarship Type filter section |
| `web/src/components/directory/FilterChips.tsx` | Add type filter chip removal |
| `web/src/lib/shared.ts` | Add `formatScholarshipType()` helper |

### Plan 3: Frontend Detail + Tips
| File | Change |
|------|--------|
| `web/src/components/detail/HeroSection.tsx` | Add type pills to badge row |
| `web/src/components/detail/FundingSection.tsx` | Extend COVERAGE_ITEMS to 6, add grid layout, add contextual tip |
| NEW `web/src/components/detail/ApplicationTipsSection.tsx` | Tips display component |
| `web/src/routes/scholarships/$slug.tsx` | Pass new props, add ApplicationTipsSection |

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis of all files listed in `<files_to_read>`
- `web/convex/schema.ts` -- current validators and table definitions
- `web/convex/aggregation.ts` -- backfill and merge patterns
- `web/convex/triggers.ts` -- write-time trigger pattern
- `web/src/components/ui/badge.tsx` -- CVA variant system
- `web/src/components/detail/FundingSection.tsx` -- coverage checklist pattern
- `web/src/lib/filters.ts` -- filter constant pattern
- `web/src/hooks/useScholarshipFilters.ts` -- filter hook pattern
- `web/src/index.css` -- oklch color system

## Metadata

**Confidence breakdown:**
- Schema changes: HIGH -- existing patterns are clear, optional fields are non-breaking
- Classification logic: HIGH -- source categories and tags are available, heuristics are straightforward
- Frontend components: HIGH -- all patterns exist in codebase, just extending them
- Tips system: HIGH -- simple static data + conditional rendering

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (stable codebase patterns)
