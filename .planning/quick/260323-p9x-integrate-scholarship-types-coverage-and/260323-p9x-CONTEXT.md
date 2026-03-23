# Quick Task 260323-p9x: Integrate scholarship types, coverage, and guidance into website UI - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Task Boundary

Integrate scholarship type taxonomy, coverage info, and application guidance deeply into the ScholarHub website. Not a blog — contextual UI that shows scholarship types on cards and detail pages, what each covers, application timeline awareness, and smart contextual tips. Schema additions, backend classification, frontend components across directory/detail/country pages.

</domain>

<decisions>
## Implementation Decisions

### Scope: Full Integration
- Schema additions: `scholarship_type` enum, `coverage_books` + `coverage_research` booleans, `application_tips` field
- Backend: classification logic to derive scholarship_type from existing data (source category, tags, provider name)
- Frontend: colored pills on cards, coverage visual checklist on detail, timeline awareness, contextual tips
- 3 plans: schema+backend, frontend cards/directory, frontend detail+tips

### Type Display: Colored Pills
- Small colored badge pills below the title on ScholarshipCard
- Government=blue, Merit=gold, Need-based=green, University=purple, Research=indigo, Country-specific=teal, Athletic=red, Subject-specific=orange
- Max 2 pills per card to avoid clutter
- Same pills appear on detail page HeroSection

### Coverage UX: Visual Checklist
- Grid of 6 coverage items with check/cross icons on detail page
- Green check = covered, gray cross = not covered
- All 6 categories always shown: Tuition, Living, Travel, Insurance, Books, Research
- Contextual tip below the grid based on scholarship type
- On cards: compact "Covers: Tuition + Living + Travel" line

### Tips Source: Static + Per-Scholarship Override
- Static knowledge base mapped to scholarship_type + coverage combos as fallback
- Per-scholarship `application_tips` field for admin/scraper-populated custom tips
- Per-scholarship tips override static tips when available

</decisions>

<specifics>
## Specific Ideas

### Scholarship Type Enum Values
- `merit` — Academic achievement based
- `need_based` — Financial need based
- `government` — Government-funded programs (Chevening, Fulbright, etc.)
- `university` — University-specific awards
- `country_specific` — For students from specific countries/regions
- `subject_specific` — For specific fields of study
- `research` — Research/PhD focused
- `athletic` — Sports-based scholarships
- `general` — Default/uncategorized

### Coverage Booleans (existing + new)
- `funding_tuition` (exists)
- `funding_living` (exists)
- `funding_travel` (exists)
- `funding_insurance` (exists)
- `funding_books` (NEW)
- `funding_research` (NEW)

### Classification Heuristics
- source category = "government" → scholarship_type = "government"
- tags contain "merit" or "academic" → scholarship_type = "merit"
- tags contain "need" or "financial" → scholarship_type = "need_based"
- source category = "university" → scholarship_type = "university"
- tags contain "research" or "phd" → scholarship_type = "research"
- Fallback: "general"

### Static Tips by Type
- government: "Government scholarships often require embassy endorsement. Start 8-12 months early."
- merit: "Merit scholarships weigh GPA heavily. Include transcripts and strong recommendation letters."
- need_based: "Prepare financial documents: family income, tax statements, employment proofs."
- research: "A strong research proposal is essential. Contact potential supervisors before applying."
- university: "Check if the scholarship is automatic or requires separate application."
- athletic: "Highlight competitive achievements and get coach recommendations."
- general: "Apply for multiple scholarships to increase your chances."

</specifics>

<canonical_refs>
## Canonical References

- User-provided scholarship taxonomy with 10 types, 6 coverage categories, and application timeline
- Existing schema at `web/convex/schema.ts` with `funding_type`, `funding_tuition/living/travel/insurance` fields
- Existing `ScholarshipCard` component at `web/src/components/directory/ScholarshipCard.tsx`
- Existing detail sections at `web/src/components/detail/FundingSection.tsx`, `EligibilitySection.tsx`

</canonical_refs>
