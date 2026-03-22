---
phase: quick
plan: 260322-hcw
type: execute
wave: 1
depends_on: []
files_modified:
  - web/convex/scraping.ts
autonomous: true
requirements: []
must_haves:
  truths:
    - "Published scholarships with missing important fields are demoted to pending_review"
    - "Scholarships with complete data remain published and unaffected"
    - "Demoted scholarships are no longer visible in the public directory"
  artifacts:
    - path: "web/convex/scraping.ts"
      provides: "demoteIncompleteScholarships mutation"
      exports: ["demoteIncompleteScholarships"]
  key_links:
    - from: "web/convex/scraping.ts"
      to: "scholarships table"
      via: "by_status index query + patch"
      pattern: 'q.eq\\("status",\\s*"published"\\)'
---

<objective>
Demote published scholarships that have missing important information to `pending_review` status, so they require admin review/fix before becoming public again.

Purpose: Improve public directory quality by hiding scholarships with incomplete data (missing description, application URL, unknown provider, generic country, missing slug) until an admin can enrich them.
Output: A Convex mutation `demoteIncompleteScholarships` in scraping.ts that can be run once to audit and demote, then reused as needed.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@web/convex/schema.ts
@web/convex/scraping.ts
@web/convex/directory.ts

<interfaces>
<!-- Key types and contracts the executor needs -->

From web/convex/schema.ts:
```typescript
export const scholarshipStatusValidator = v.union(
  v.literal("draft"),
  v.literal("pending_review"),
  v.literal("published"),
  v.literal("rejected"),
  v.literal("archived"),
);

// scholarships table fields (all optional ones are candidates for "missing info"):
// description: v.optional(v.string())
// slug: v.optional(v.string())
// application_url: v.optional(v.string())
// application_deadline: v.optional(v.number())
// application_deadline_text: v.optional(v.string())
// eligibility_nationalities: v.optional(v.array(v.string()))
// provider_organization: v.string()  -- required but may be "Unknown"
// host_country: v.string()           -- required but may be "International"
```

From web/convex/directory.ts:
```typescript
// All public queries filter by status === "published"
// Demoting to "pending_review" removes from all public-facing queries
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create demoteIncompleteScholarships mutation</name>
  <files>web/convex/scraping.ts</files>
  <action>
Add a new mutation `demoteIncompleteScholarships` to `web/convex/scraping.ts`. This mutation:

1. Queries all scholarships with `status === "published"` using the `by_status` index.
2. For each published scholarship, checks if it is missing important information. A scholarship is considered incomplete if ANY of these conditions are true:
   - `description` is undefined, null, or empty string (after trim)
   - `application_url` is undefined, null, or empty string (after trim)
   - `slug` is undefined, null, or empty string (after trim)
   - `provider_organization` equals `"Unknown"` (the fallback value from bulkPublishRawRecords)
   - `host_country` equals `"International"` (the fallback value from bulkPublishRawRecords)

3. For each incomplete scholarship, patches its `status` to `"pending_review"` and adds an `editorial_notes` field describing which fields are missing (e.g., "Auto-demoted: missing description, application_url").

4. Processes in batches (query with `.take(500)` to respect Convex limits) and returns a summary: `{ demoted: number, checked: number, reasons: Record<string, number> }` where `reasons` tallies each missing field type.

Use `mutation` (not `internalMutation`) so it can be called from the Convex dashboard for one-off execution. Accept an optional `dryRun` boolean arg (default false) that when true, returns the count and reasons without actually patching any records.

Import nothing new -- all validators/types already available in the file's scope.
  </action>
  <verify>
    <automated>cd /home/siam/Personal/ScholarHub/web && npx tsc --noEmit --project tsconfig.app.json 2>&1 | head -30</automated>
  </verify>
  <done>
    - `demoteIncompleteScholarships` mutation exists in scraping.ts
    - Accepts optional `dryRun` arg
    - Queries published scholarships, checks 5 completeness criteria
    - Patches incomplete ones to `pending_review` with editorial_notes explaining why
    - Returns `{ demoted, checked, reasons }` summary
    - TypeScript compiles without errors
  </done>
</task>

</tasks>

<verification>
- TypeScript compiles: `cd web && npx tsc --noEmit --project tsconfig.app.json`
- Mutation is exported and callable from Convex dashboard
- Existing tests still pass: `cd web && npx vitest run --reporter=verbose 2>&1 | tail -20`
</verification>

<success_criteria>
- New `demoteIncompleteScholarships` mutation added to scraping.ts
- Mutation checks published scholarships for 5 missing-info criteria
- Incomplete scholarships demoted to `pending_review` with editorial_notes
- Dry run mode available for safe pre-check
- No changes to schema or other files
- All existing tests pass
</success_criteria>

<output>
After completion, create `.planning/quick/260322-hcw-demote-public-scholarships-with-missing-/260322-hcw-SUMMARY.md`
</output>
