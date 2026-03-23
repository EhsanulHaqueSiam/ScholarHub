# Phase 5: Admin Dashboard - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

A solo admin can efficiently review, edit, approve/reject, and publish scraped scholarships through a streamlined dashboard — with trusted sources auto-publishing. Accessed via hidden /admin URL. No student-facing features. No auth in this phase (dev only) but mutation guards stubbed for future Clerk integration.

Existing state: Phase 4 aggregation pipeline creates scholarships as "published" by default, with `demoteIncompleteScholarships` moving incomplete ones to "pending_review". Source trust levels exist on the sources table but aren't used in publish decisions yet. `editorial_notes` field exists on scholarships. `dashboard.ts` has operational queries (recent runs, source health).

</domain>

<decisions>
## Implementation Decisions

### Review queue workflow
- **D-01:** Default admin view is stats dashboard at top (total scholarships, pending count, published today, source health summary) with review queue below.
- **D-02:** Queue shows pending_review scholarships by default. Tabs for: Pending Review (count), Published, Rejected, Archived, All.
- **D-03:** Sorting: source trust level descending (government first), then newest first within same trust tier.
- **D-04:** Queue items are expandable rows — compact by default (title, country, source, degree levels, deadline, status badge), click to expand inline and see all fields + action buttons.
- **D-05:** Bulk actions: individual checkboxes per row AND a "select all visible" toggle. When items selected, floating action bar appears with "Approve N selected" / "Reject N selected" buttons.
- **D-06:** Possible duplicates (match_status="possible_duplicate" on raw_records) surface as a warning badge on affected scholarships in the queue.

### Auth & access control
- **D-07:** No authentication for Phase 5 — admin routes are open. This is dev-only. Auth will be added via Clerk in a future phase before going public.
- **D-08:** Despite no auth, Convex admin mutations include an `isAdmin(ctx)` guard stub that currently always returns true. When Clerk is added, the guard checks the auth token. Defense in depth — easy to activate later without rewriting mutations.
- **D-09:** Admin accessed via hidden /admin URL. No admin link in navbar or footer. Public users don't know it exists.

### Editorial notes & editing UX
- **D-10:** Click "Edit" on a scholarship opens a slide-out panel on the right (~40% width). Queue stays visible on the left. Fast context switching between items.
- **D-11:** All scholarship fields are editable by admin: title, description, country, host_country, degree_levels, application_deadline, funding_amount, application_url, eligibility, editorial_notes, status.
- **D-12:** Editorial notes use a WYSIWYG rich text editor (TipTap). Stores HTML or markdown. Rendered via existing react-markdown in the public-facing detail page.
- **D-13:** Full change history — every edit stored as a revision with timestamp, field changed, old value, new value. Enables undo and audit trail. Stored in a new `scholarship_revisions` table.

### Auto-publish rules
- **D-14:** Auto-publish is evaluated during aggregation (Phase 4 mutations). When creating/updating a scholarship, check the highest-trust contributing source's trust_level: auto_publish → status "published", needs_review → status "pending_review", blocked → status "rejected".
- **D-15:** Field completeness gate: even if source is auto_publish, scholarship must have all critical fields (title, description, host_country, application_url) to be published. Missing critical fields → "pending_review" regardless of trust.
- **D-16:** Mixed trust resolution: if a scholarship has data from both auto_publish and needs_review sources, the highest trust level wins. If any contributing source is auto_publish and fields are complete, publish it.
- **D-17:** When admin changes a source's trust level (e.g., needs_review → auto_publish), retroactively re-evaluate all pending_review scholarships from that source. Those now qualifying get auto-published in a batch operation.

### Claude's Discretion
- Exact TipTap editor configuration and toolbar buttons
- Stats dashboard layout and chart types
- Revision history UI (modal, panel, or expandable section)
- Filter options beyond status tabs (country, source, date range)
- Pagination strategy for queue (offset vs cursor)
- Exact field validation rules for the edit form
- How to handle the "rejected" status — soft delete vs visible in archive

</decisions>

<specifics>
## Specific Ideas

- The aggregation pipeline (Phase 4) needs a small modification to check source trust levels when setting scholarship status — currently it hardcodes "published" for all new scholarships.
- The `demoteIncompleteScholarships` mutation already exists and auto-generates editorial notes for incomplete scholarships — this pattern should be extended for the completeness gate in D-15.
- The slide-out edit panel should feel fast — open instantly, no loading spinner. Prefetch scholarship data when hovering over the Edit button.
- Expandable rows should show the source provenance: "Data from: DAAD (gov), ScholarshipPortal (aggregator)" with trust badges.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Schema & data model
- `web/convex/schema.ts` — scholarships table (status, editorial_notes, source_ids, match_key), sources table (trust_level, category, is_active), raw_records table (canonical_id, match_status)
- `web/convex/aggregation.ts` — aggregateBatch (where auto-publish logic needs to be added), archiveExpired, backfillMatchKeys
- `web/convex/aggregationHelpers.ts` — normalizeTitle, computeMatchKey, resolveField, TRUST_RANK, getTrustRank (source category → numeric rank)

### Existing operational queries
- `web/convex/dashboard.ts` — getRecentRuns, getSourceHealth, getFailingSources, getRunStats (extend for admin views)
- `web/convex/scraping.ts` — demoteIncompleteScholarships (pattern for field completeness checks + editorial notes)
- `web/convex/sources.ts` — upsertSource (update trust_level), resetLastScraped

### Frontend patterns
- `web/src/components/ui/` — Card, Badge (with prestige/urgency variants), Button (existing component library)
- `web/src/components/detail/EditorialTips.tsx` — react-markdown rendering of editorial_notes (existing pattern)
- `web/src/components/directory/FilterPanel.tsx` — filtering UI pattern
- `web/src/components/directory/Pagination.tsx` — pagination component

### Design system
- `web/src/components/ui/badge.tsx` — urgency variants (critical, warning, open, closed) for status badges
- `web/src/components/ui/card.tsx` — card with prestige variants for scholarship display

### Requirements
- `.planning/REQUIREMENTS.md` — ADMN-01 through ADMN-08, UIDX-04

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `dashboard.ts` queries: getRecentRuns, getSourceHealth already provide operational data — extend for admin stats
- `demoteIncompleteScholarships` in scraping.ts: pattern for batch status changes with editorial note generation
- Badge component with urgency variants: ready for status badges (pending=warning, published=open, rejected=critical)
- Card component with expandable patterns: used in directory, adaptable for admin queue rows
- react-markdown: already rendering editorial_notes in EditorialTips component
- `TRUST_RANK` and `getTrustRank()`: source trust scoring already implemented in aggregationHelpers.ts

### Established Patterns
- Convex internal mutations with `customMutation(rawInternalMutation, customCtx(wrapDB))` for trigger-aware writes
- Batch processing via `ctx.scheduler.runAfter(0, ...)` for large operations (used in aggregation)
- TanStack Router file-based routing: new routes go in `web/src/routes/admin/`
- Radix UI primitives + CVA for component variants

### Integration Points
- `aggregation.ts` → modify `aggregateBatch` to check source trust level when setting status (D-14, D-15, D-16)
- `sources.ts` → `upsertSource` mutation triggers retroactive re-evaluation when trust_level changes (D-17)
- New `/admin` route tree: index (stats + queue), edit panel as overlay/sheet component
- New `scholarship_revisions` table in schema for change history (D-13)
- New admin mutations: approve, reject, bulkApprove, bulkReject, updateScholarship, updateSourceTrust

</code_context>

<deferred>
## Deferred Ideas

- Clerk authentication integration — future phase before public launch
- Admin link in navbar (only after auth exists)
- Source-level dashboard with scrape logs and error details — future enhancement
- Splitting incorrectly merged records — mentioned in Phase 4 deferred ideas
- Notification when new scholarships need review — future enhancement

</deferred>

---

*Phase: 05-admin-dashboard*
*Context gathered: 2026-03-22*
