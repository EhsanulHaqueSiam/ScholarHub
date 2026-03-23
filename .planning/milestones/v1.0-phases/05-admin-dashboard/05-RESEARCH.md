# Phase 5: Admin Dashboard - Research

**Researched:** 2026-03-22
**Domain:** Admin CRUD dashboard (Convex mutations + React UI), rich text editing, auto-publish rules, revision tracking
**Confidence:** HIGH

## Summary

Phase 5 adds an admin dashboard for reviewing, editing, approving/rejecting, and publishing scraped scholarships. The existing codebase provides strong foundations: Convex schema already has scholarship statuses (draft, pending_review, published, rejected, archived), source trust levels (auto_publish, needs_review, blocked), TRUST_RANK hierarchy, and editorial_notes field. The aggregation pipeline currently hardcodes `status: "published"` in `createScholarship()` -- this must be modified to check source trust levels. The `demoteIncompleteScholarships` mutation provides a proven pattern for batch status changes with auto-generated editorial notes.

The frontend stack (TanStack Router, Radix UI, CVA, Tailwind) is well established. The admin dashboard needs new route files under `web/src/routes/admin/`, new Convex mutations in a dedicated `admin.ts` module, a `scholarship_revisions` table for change history, and TipTap for rich text editing of editorial notes. The existing `@radix-ui/react-dialog` (already installed) serves as the foundation for the slide-out edit panel (Sheet pattern). `@radix-ui/react-tabs` (already installed) powers the status tabs.

**Primary recommendation:** Build the admin backend mutations first (with isAdmin guard stub), then the auto-publish pipeline modification, then the frontend queue/edit UI, then TipTap editorial notes editor. Revision tracking and retroactive re-evaluation are the most complex pieces -- isolate them into separate tasks.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Default admin view is stats dashboard at top (total scholarships, pending count, published today, source health summary) with review queue below.
- **D-02:** Queue shows pending_review scholarships by default. Tabs for: Pending Review (count), Published, Rejected, Archived, All.
- **D-03:** Sorting: source trust level descending (government first), then newest first within same trust tier.
- **D-04:** Queue items are expandable rows -- compact by default (title, country, source, degree levels, deadline, status badge), click to expand inline and see all fields + action buttons.
- **D-05:** Bulk actions: individual checkboxes per row AND a "select all visible" toggle. When items selected, floating action bar appears with "Approve N selected" / "Reject N selected" buttons.
- **D-06:** Possible duplicates (match_status="possible_duplicate" on raw_records) surface as a warning badge on affected scholarships in the queue.
- **D-07:** No authentication for Phase 5 -- admin routes are open. This is dev-only. Auth will be added via Clerk in a future phase before going public.
- **D-08:** Despite no auth, Convex admin mutations include an `isAdmin(ctx)` guard stub that currently always returns true. When Clerk is added, the guard checks the auth token. Defense in depth -- easy to activate later without rewriting mutations.
- **D-09:** Admin accessed via hidden /admin URL. No admin link in navbar or footer. Public users don't know it exists.
- **D-10:** Click "Edit" on a scholarship opens a slide-out panel on the right (~40% width). Queue stays visible on the left. Fast context switching between items.
- **D-11:** All scholarship fields are editable by admin: title, description, country, host_country, degree_levels, application_deadline, funding_amount, application_url, eligibility, editorial_notes, status.
- **D-12:** Editorial notes use a WYSIWYG rich text editor (TipTap). Stores HTML or markdown. Rendered via existing react-markdown in the public-facing detail page.
- **D-13:** Full change history -- every edit stored as a revision with timestamp, field changed, old value, new value. Enables undo and audit trail. Stored in a new `scholarship_revisions` table.
- **D-14:** Auto-publish is evaluated during aggregation (Phase 4 mutations). When creating/updating a scholarship, check the highest-trust contributing source's trust_level: auto_publish -> status "published", needs_review -> status "pending_review", blocked -> status "rejected".
- **D-15:** Field completeness gate: even if source is auto_publish, scholarship must have all critical fields (title, description, host_country, application_url) to be published. Missing critical fields -> "pending_review" regardless of trust.
- **D-16:** Mixed trust resolution: if a scholarship has data from both auto_publish and needs_review sources, the highest trust level wins. If any contributing source is auto_publish and fields are complete, publish it.
- **D-17:** When admin changes a source's trust level (e.g., needs_review -> auto_publish), retroactively re-evaluate all pending_review scholarships from that source. Those now qualifying get auto-published in a batch operation.

### Claude's Discretion
- Exact TipTap editor configuration and toolbar buttons
- Stats dashboard layout and chart types
- Revision history UI (modal, panel, or expandable section)
- Filter options beyond status tabs (country, source, date range)
- Pagination strategy for queue (offset vs cursor)
- Exact field validation rules for the edit form
- How to handle the "rejected" status -- soft delete vs visible in archive

### Deferred Ideas (OUT OF SCOPE)
- Clerk authentication integration -- future phase before public launch
- Admin link in navbar (only after auth exists)
- Source-level dashboard with scrape logs and error details -- future enhancement
- Splitting incorrectly merged records -- mentioned in Phase 4 deferred ideas
- Notification when new scholarships need review -- future enhancement
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ADMN-01 | Admin can view review queue of pending scraped scholarships | Convex `by_status` index supports efficient pending_review queries; Radix Tabs for status switching; expandable row pattern from ScholarshipListItem |
| ADMN-02 | Admin can edit any scholarship field | Slide-out Sheet panel (Radix Dialog); TipTap for editorial_notes; `scholarship_revisions` table for change history |
| ADMN-03 | Admin can approve or reject scholarships with single action | Admin mutations with isAdmin guard stub; trigger-wrapped mutations auto-update prestige/search_text |
| ADMN-04 | Admin can bulk-approve or bulk-reject multiple scholarships | Floating action bar with selection state; batch mutation pattern from existing `demoteIncompleteScholarships` |
| ADMN-05 | Admin can configure source trust levels | Source trust update mutation with retroactive re-evaluation (D-17); existing `upsertSource` mutation pattern |
| ADMN-06 | Trusted sources auto-publish scholarships without manual review | Modify `createScholarship()` in aggregation.ts to check source trust + field completeness (D-14/D-15/D-16) |
| ADMN-07 | Admin can add editorial notes and tips per scholarship (rich text) | TipTap editor with StarterKit; store as HTML; render via existing react-markdown in EditorialTips.tsx |
| ADMN-08 | No duplicate scholarships can be published (dedup enforced at publish) | Match key system already exists; add publish-boundary dedup check in approve mutation |
| UIDX-04 | Use frontend-design skill for all UI implementation | Neo-brutalism design system with existing Card/Badge/Button CVA variants; Tailwind utility classes |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| convex | 1.33.1 | Backend queries/mutations | Project standard -- all backend logic |
| convex-helpers | 0.1.114 | Custom mutations, triggers | Trigger-wrapped mutations for prestige auto-compute |
| @tanstack/react-router | 1.167.5 | File-based routing | Project standard -- new `/admin` route tree |
| @radix-ui/react-dialog | 1.1.15 | Sheet/slide-out panel | Already installed; basis for edit panel |
| @radix-ui/react-tabs | 1.1.13 | Status tabs | Already installed; Pending/Published/Rejected/etc. tabs |
| react-markdown | 10.1.0 | Render editorial notes | Already renders editorial_notes in detail page |
| lucide-react | 0.577.0 | Icons | Project standard icon library |

### New Dependencies
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tiptap/react | 3.20.4 | React WYSIWYG editor bindings | Editorial notes editor (D-12) |
| @tiptap/pm | 3.20.4 | ProseMirror peer dependency | Required by TipTap |
| @tiptap/starter-kit | 3.20.4 | Common extensions bundle | Paragraphs, headings, bold, italic, lists, blockquote, code |
| @tiptap/extension-link | 3.20.4 | Link extension | Adding links in editorial notes |
| @tiptap/extension-placeholder | 3.20.4 | Placeholder text | "Add tips for applicants..." placeholder |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| TipTap | Lexical (Meta) | TipTap is user's locked decision (D-12); TipTap has better headless/unstyled approach matching project's neo-brutalism |
| Radix Dialog (as Sheet) | vaul (drawer) | Radix Dialog already installed; Sheet is just a Dialog with slide-from-right animation -- no new dependency needed |
| @radix-ui/react-checkbox | Custom checkbox (manual) | Project already uses manual checkbox pattern in FilterPanel.tsx -- consistent, no new dependency |

**Installation:**
```bash
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-placeholder
```

**Version verification:** All TipTap packages verified at 3.20.4 via `npm view` on 2026-03-22. Radix Dialog confirmed at 1.1.15, Tabs at 1.1.13.

## Architecture Patterns

### Recommended Project Structure
```
web/
├── convex/
│   ├── admin.ts                    # Admin queries + mutations (review queue, approve, reject, edit, bulk ops)
│   ├── adminHelpers.ts             # isAdmin guard, field completeness check, dedup check helpers
│   ├── aggregation.ts              # MODIFIED: createScholarship() checks source trust + completeness
│   ├── schema.ts                   # MODIFIED: add scholarship_revisions table
│   └── sources.ts                  # MODIFIED: updateSourceTrust mutation with retroactive re-eval
├── src/
│   ├── routes/
│   │   └── admin/
│   │       ├── index.tsx           # Admin dashboard: stats + review queue
│   │       └── route.tsx           # Admin layout (no navbar, minimal chrome)
│   ├── components/
│   │   └── admin/
│   │       ├── StatsBar.tsx        # Top stats cards (total, pending, published today, source health)
│   │       ├── ReviewQueue.tsx     # Main queue with tabs, sorting, pagination
│   │       ├── QueueRow.tsx        # Expandable scholarship row (compact + expanded states)
│   │       ├── BulkActionBar.tsx   # Floating bar when items selected
│   │       ├── EditPanel.tsx       # Slide-out sheet for editing scholarship
│   │       ├── EditForm.tsx        # All-fields edit form inside the panel
│   │       ├── EditorialEditor.tsx # TipTap WYSIWYG editor wrapper
│   │       ├── RevisionHistory.tsx # Change history display
│   │       ├── SourceTrustManager.tsx # Source trust level configuration
│   │       └── DuplicateBadge.tsx  # Warning badge for possible duplicates
│   └── hooks/
│       └── useAdminSelection.ts    # Bulk selection state management
```

### Pattern 1: isAdmin Guard Stub
**What:** Every admin mutation starts with an authorization check that currently returns true
**When to use:** All admin mutations (approve, reject, edit, bulk ops, trust level changes)
**Example:**
```typescript
// Source: D-08 decision + Convex custom functions pattern
import { mutation, query } from "./_generated/server";

// Guard stub -- returns true now, checks Clerk auth token later
async function isAdmin(ctx: any): Promise<boolean> {
  // Phase 5: always allow (no auth)
  // Future: const identity = await ctx.auth.getUserIdentity();
  // return identity?.tokenIdentifier === ADMIN_TOKEN;
  return true;
}

export const approveScholarship = mutation({
  args: { scholarshipId: v.id("scholarships") },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx))) throw new Error("Unauthorized");
    // ... mutation logic
  },
});
```

### Pattern 2: Trigger-Wrapped Admin Mutations
**What:** Admin mutations that modify scholarships MUST use the trigger-wrapped mutation pattern
**When to use:** Any mutation that patches scholarship documents (approve, reject, edit)
**Why:** Triggers auto-compute prestige_score, prestige_tier, and search_text on every write
**Example:**
```typescript
// Source: existing triggers.ts and aggregation.ts pattern
import { customCtx, customMutation } from "convex-helpers/server/customFunctions";
import { internalMutation as rawInternalMutation } from "./_generated/server";
import { wrapDB } from "./triggers";

const triggeredInternalMutation = customMutation(rawInternalMutation, customCtx(wrapDB));

// For public admin mutations called from the client:
// Option A: Create triggeredPublicMutation using rawMutation
import { mutation as rawMutation } from "./_generated/server";
const triggeredMutation = customMutation(rawMutation, customCtx(wrapDB));

// Option B: Use internalMutation + thin public wrapper (more boilerplate)
```

**Important nuance:** The existing codebase uses `triggeredInternalMutation` (wrapping `rawInternalMutation`). Admin mutations called from the client need public mutations. The cleanest approach is Option A: create a `triggeredMutation` by applying `customMutation(rawMutation, customCtx(wrapDB))` to the public mutation export.

### Pattern 3: Slide-Out Sheet from Radix Dialog
**What:** Build a Sheet component using the already-installed `@radix-ui/react-dialog`
**When to use:** Edit panel (D-10)
**Example:**
```typescript
// Source: Radix Dialog docs + shadcn/ui Sheet pattern
import * as Dialog from "@radix-ui/react-dialog";

function Sheet({ children, open, onOpenChange }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-overlay z-40" />
        <Dialog.Content className={cn(
          "fixed inset-y-0 right-0 z-50 w-[40%] min-w-[400px]",
          "bg-secondary-background border-l-2 border-border shadow-shadow",
          "overflow-y-auto p-6",
          "animate-in slide-in-from-right duration-300"
        )}>
          <Dialog.Close asChild>
            <button type="button" className="absolute top-4 right-4" aria-label="Close">
              <X className="size-5" />
            </button>
          </Dialog.Close>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

### Pattern 4: Revision Tracking
**What:** Store every field change in a `scholarship_revisions` table
**When to use:** Every admin edit to a scholarship (D-13)
**Example:**
```typescript
// Schema addition
scholarship_revisions: defineTable({
  scholarship_id: v.id("scholarships"),
  field_name: v.string(),
  old_value: v.optional(v.string()),
  new_value: v.optional(v.string()),
  changed_at: v.number(),
  changed_by: v.optional(v.string()), // future: user ID from Clerk
})
  .index("by_scholarship", ["scholarship_id", "changed_at"])
  .index("by_changed_at", ["changed_at"]),
```

### Pattern 5: Auto-Publish in Aggregation Pipeline
**What:** Modify `createScholarship()` to determine status based on source trust level and field completeness
**When to use:** During aggregation batch processing (D-14, D-15, D-16)
**Example:**
```typescript
// In aggregation.ts createScholarship() -- replace hardcoded "published"
async function determineStatus(
  ctx: any,
  record: any,
): Promise<"published" | "pending_review" | "rejected"> {
  const source = await ctx.db.get(record.source_id);
  if (!source) return "pending_review";

  // D-14: Check source trust level
  const trustLevel = source.trust_level; // auto_publish | needs_review | blocked

  if (trustLevel === "blocked") return "rejected";
  if (trustLevel === "needs_review") return "pending_review";

  // D-15: auto_publish requires field completeness
  if (trustLevel === "auto_publish") {
    const hasTitle = record.title?.trim();
    const hasDescription = record.description?.trim();
    const hasCountry = record.host_country && record.host_country !== "International";
    const hasUrl = record.application_url?.trim();
    if (hasTitle && hasDescription && hasCountry && hasUrl) return "published";
    return "pending_review"; // incomplete despite trusted source
  }

  return "pending_review"; // default safe
}
```

### Pattern 6: Retroactive Re-evaluation (D-17)
**What:** When a source's trust level changes, batch-process affected pending scholarships
**When to use:** After admin changes a source's trust level
**Example:**
```typescript
// Batch re-evaluation pattern (same as aggregateBatch scheduling)
export const reevaluateSourceScholarships = triggeredInternalMutation({
  args: {
    sourceId: v.id("sources"),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? 50;
    const source = await ctx.db.get(args.sourceId);
    if (!source) return;

    // Find pending_review scholarships that include this source
    const pending = await ctx.db
      .query("scholarships")
      .withIndex("by_status", (q) => q.eq("status", "pending_review"))
      .take(batchSize);

    let promoted = 0;
    for (const scholarship of pending) {
      if (!scholarship.source_ids.includes(args.sourceId)) continue;
      // Re-evaluate using the updated trust level
      // ... field completeness check, highest trust among all sources
      // If qualifies: patch status to "published"
      promoted++;
    }

    // Schedule next batch if needed
    if (pending.length === batchSize) {
      await ctx.scheduler.runAfter(0, internal.admin.reevaluateSourceScholarships, {
        sourceId: args.sourceId,
        batchSize,
      });
    }
  },
});
```

### Anti-Patterns to Avoid
- **Direct scholarship patches without triggers:** Never `ctx.db.patch(scholarshipId, {...})` in admin mutations without the trigger wrapper. Missing this causes stale prestige tiers and broken search.
- **Client-side status changes:** Never change scholarship status from the frontend. All status transitions must go through Convex mutations with the isAdmin guard.
- **Unbounded queries for queue:** Never `.collect()` all pending_review scholarships. Use `.take(limit)` with pagination. The queue could have hundreds or thousands of items.
- **Storing TipTap JSON in database:** Store HTML string in editorial_notes, not TipTap's internal JSON format. The public detail page uses react-markdown to render it -- keeping it as a string ensures the public rendering path stays simple.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Rich text editor | Custom contenteditable | TipTap (@tiptap/react + starter-kit) | Selection handling, undo/redo, cross-browser compatibility, paste sanitization are deceptively complex |
| Slide-out panel | Custom absolute-positioned div | Radix Dialog as Sheet | Focus trapping, escape-to-close, overlay click-away, screen reader announcements, scroll locking |
| Checkbox accessibility | Custom div with onClick | Native checkbox + visual overlay (FilterPanel pattern) | Screen readers, keyboard navigation, form semantics |
| Debounced autosave | Custom setTimeout/clearTimeout | None needed -- explicit Save button | Admin edits are deliberate; autosave risks accidental publishes |
| Sorting by trust level | Custom sort with DB queries | Query with `.take()` + client-side sort by source trust rank | Convex doesn't support multi-field composite sorts with joins; the review queue is small enough for client sort |

**Key insight:** The admin queue likely has <500 pending items at any time. Client-side sorting after fetching a batch is perfectly fine. Don't over-engineer server-side sorting with complex index arrangements.

## Common Pitfalls

### Pitfall 1: Triggers Not Firing on Public Mutations
**What goes wrong:** Admin edits a scholarship via a public `mutation()`, but prestige_score and search_text don't update because the trigger pattern only wraps `internalMutation`.
**Why it happens:** The existing trigger setup uses `customMutation(rawInternalMutation, customCtx(wrapDB))` which only creates triggered internal mutations. Public mutations bypass triggers.
**How to avoid:** Either (a) make admin mutations as internalMutations called by a thin public mutation wrapper, or (b) create a `triggeredPublicMutation` using `customMutation(rawMutation, customCtx(wrapDB))` imported from the non-internal `_generated/server`. Option (b) is cleaner.
**Warning signs:** After editing a scholarship, its prestige badge doesn't change, or it disappears from search results.

### Pitfall 2: Dedup Check at Approve Time vs Aggregation Time
**What goes wrong:** Admin approves a scholarship, but a duplicate is already published. Or two scholarships get approved in a bulk action and they're duplicates of each other.
**Why it happens:** ADMN-08 requires dedup at the publish boundary, but the existing match_key dedup only runs during aggregation.
**How to avoid:** The approve mutation must check: "Is there already a published scholarship with the same match_key?" If yes, block the approval and surface the conflict to the admin. For bulk approvals, check all in the batch against each other AND against existing published records.
**Warning signs:** Duplicate scholarships appearing in the public directory.

### Pitfall 3: Retroactive Re-evaluation (D-17) Hitting Convex Limits
**What goes wrong:** Admin changes a source's trust level to auto_publish, and the retroactive re-evaluation tries to process thousands of pending_review scholarships in one mutation, exceeding Convex's 10MB write limit or 60-second timeout.
**Why it happens:** A high-volume source like an aggregator could have hundreds of linked scholarships.
**How to avoid:** Use the same batch-and-schedule pattern as `aggregateBatch`: process N scholarships per mutation, then `ctx.scheduler.runAfter(0, ...)` for the next batch. The existing codebase already uses this pattern in aggregation.ts and scraping.ts.
**Warning signs:** Mutation timeout errors after changing a source's trust level.

### Pitfall 4: Expandable Row State Management
**What goes wrong:** Expanding a row re-fetches data or causes the entire queue to re-render, losing scroll position and other expanded states.
**Why it happens:** Convex reactive queries re-render on any data change. If the expanded row data comes from a separate query, each expand triggers a new subscription.
**How to avoid:** Load all data needed for both compact and expanded views in the initial queue query. Use local React state (useState) for which rows are expanded -- don't put expansion state in the URL or Convex.
**Warning signs:** Flickering, scroll jumps, or visible loading spinners when expanding rows.

### Pitfall 5: TipTap Content Format Mismatch
**What goes wrong:** TipTap stores content as HTML, but the existing EditorialTips component uses react-markdown expecting markdown format.
**Why it happens:** D-12 says "Stores HTML or markdown" but the existing rendering path uses react-markdown which expects markdown.
**How to avoid:** Store editorial_notes as HTML from TipTap. For the public-facing EditorialTips component, detect if content is HTML (starts with `<`) and render it as sanitized HTML, OR use TipTap's markdown extension to convert to markdown before saving. Simplest approach: store as HTML and update EditorialTips to handle both HTML and markdown content. For HTML content, use a lightweight sanitizer and render directly. For existing markdown content (from `demoteIncompleteScholarships` auto-notes), continue using react-markdown. This dual-render approach handles both formats gracefully.
**Warning signs:** Raw HTML tags showing as text in the public detail page.

### Pitfall 6: Missing Source Join for Trust-Based Sorting (D-03)
**What goes wrong:** The review queue needs to sort by source trust level, but scholarships don't store trust level directly -- they store `source_ids` (array of references).
**Why it happens:** Convex doesn't support joins in index queries. You can't sort scholarships by their source's trust_level at the database level.
**How to avoid:** After fetching pending_review scholarships, resolve source_ids to sources, find the highest-trust source category, then sort client-side using the existing `TRUST_RANK` map from aggregationHelpers.ts.
**Warning signs:** Queue items not sorted by trust level as specified in D-03.

## Code Examples

### Admin Queue Query with Source Resolution
```typescript
// Source: Existing directory.ts listScholarshipsBatch pattern + dashboard.ts source resolution
export const getReviewQueue = query({
  args: {
    status: v.optional(scholarshipStatusValidator),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const status = args.status ?? "pending_review";
    const limit = args.limit ?? 100;

    const scholarships = await ctx.db
      .query("scholarships")
      .withIndex("by_status", (q) => q.eq("status", status))
      .take(limit);

    // Resolve sources for trust-level sorting and display
    return await Promise.all(
      scholarships.map(async (s) => {
        const sources = await Promise.all(
          s.source_ids.map(async (sid) => {
            const source = await ctx.db.get(sid);
            return source
              ? { _id: source._id, name: source.name, category: source.category, trust_level: source.trust_level }
              : null;
          }),
        );
        // Check for possible duplicates in raw_records
        const rawRecords = await ctx.db
          .query("raw_records")
          .withIndex("by_canonical", (q) => q.eq("canonical_id", s._id))
          .take(50);
        const hasPossibleDuplicate = rawRecords.some(
          (r) => r.match_status === "possible_duplicate"
        );
        return {
          ...s,
          resolved_sources: sources.filter(Boolean),
          has_possible_duplicate: hasPossibleDuplicate,
        };
      }),
    );
  },
});
```

### Scholarship Edit with Revision Tracking
```typescript
// Source: D-13 decision + existing change_log pattern in scraping.ts
export const updateScholarship = triggeredMutation({
  args: {
    scholarshipId: v.id("scholarships"),
    updates: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      // ... all editable fields
      editorial_notes: v.optional(v.string()),
      status: v.optional(scholarshipStatusValidator),
    }),
  },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx))) throw new Error("Unauthorized");

    const existing = await ctx.db.get(args.scholarshipId);
    if (!existing) throw new Error("Scholarship not found");

    const now = Date.now();

    // Record revisions for each changed field
    for (const [field, newValue] of Object.entries(args.updates)) {
      if (newValue === undefined) continue;
      const oldValue = (existing as any)[field];
      if (String(oldValue ?? "") !== String(newValue ?? "")) {
        await ctx.db.insert("scholarship_revisions", {
          scholarship_id: args.scholarshipId,
          field_name: field,
          old_value: oldValue != null ? String(oldValue) : undefined,
          new_value: newValue != null ? String(newValue) : undefined,
          changed_at: now,
          changed_by: undefined, // future: from Clerk identity
        });
      }
    }

    // Apply the updates (triggers will auto-compute prestige + search_text)
    await ctx.db.patch(args.scholarshipId, args.updates);
  },
});
```

### TipTap Editor Component
```typescript
// Source: TipTap React docs (tiptap.dev/docs/editor/getting-started/install/react)
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";

function EditorialEditor({
  content,
  onChange,
}: {
  content: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Add tips for applicants..." }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <div className="border-2 border-border rounded-base">
      {/* Toolbar: Bold, Italic, Link, BulletList, OrderedList */}
      <div className="flex gap-1 p-2 border-b-2 border-border">
        <button type="button" onClick={() => editor?.chain().focus().toggleBold().run()}
          className={cn("p-1.5 rounded-base", editor?.isActive("bold") && "bg-main text-main-foreground")}>
          <Bold className="size-4" />
        </button>
        {/* ... more toolbar buttons */}
      </div>
      <EditorContent editor={editor} className="prose p-4 min-h-[120px]" />
    </div>
  );
}
```

### Bulk Action Pattern
```typescript
// Source: existing demoteIncompleteScholarships pattern in scraping.ts
export const bulkApprove = triggeredMutation({
  args: {
    scholarshipIds: v.array(v.id("scholarships")),
  },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx))) throw new Error("Unauthorized");
    let approved = 0;
    let blocked = 0;

    for (const id of args.scholarshipIds) {
      const scholarship = await ctx.db.get(id);
      if (!scholarship || scholarship.status !== "pending_review") continue;

      // ADMN-08: Dedup check at publish boundary
      if (scholarship.match_key) {
        const existing = await ctx.db
          .query("scholarships")
          .withIndex("by_match_key", (q) => q.eq("match_key", scholarship.match_key))
          .filter((q) => q.eq(q.field("status"), "published"))
          .first();
        if (existing) {
          blocked++;
          continue; // skip -- duplicate already published
        }
      }

      await ctx.db.patch(id, { status: "published" });
      approved++;
    }

    return { approved, blocked };
  },
});
```

### Stats Dashboard Query
```typescript
// Source: existing dashboard.ts getRecentRuns/getSourceHealth patterns
export const getAdminStats = query({
  args: {},
  handler: async (ctx) => {
    // Count by status (bounded queries)
    const pending = await ctx.db
      .query("scholarships")
      .withIndex("by_status", (q) => q.eq("status", "pending_review"))
      .take(10000);
    const published = await ctx.db
      .query("scholarships")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .take(10000);
    const rejected = await ctx.db
      .query("scholarships")
      .withIndex("by_status", (q) => q.eq("status", "rejected"))
      .take(10000);

    // Published today (created in last 24h with published status)
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const publishedToday = published.filter(
      (s) => s._creationTime > oneDayAgo
    ).length;

    // Source health summary
    const healthRecords = await ctx.db.query("source_health").collect();
    const sourceHealth = {
      healthy: healthRecords.filter((h) => h.status === "healthy").length,
      degraded: healthRecords.filter((h) => h.status === "degraded").length,
      failing: healthRecords.filter((h) => h.status === "failing").length,
    };

    return {
      total: pending.length + published.length + rejected.length,
      pending: pending.length,
      published: published.length,
      rejected: rejected.length,
      publishedToday,
      sourceHealth,
    };
  },
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| TipTap v2 | TipTap v3 (3.20.x) | Late 2025 | Major API changes; v3 is current. Extensions are same import paths but internal changes |
| Convex usePaginatedQuery | Batch + client-side pagination | Project decision (Phase 6.1) | Project already uses batch queries with `.take()` + client slicing |
| Middleware-based auth | Custom function wrappers | Convex best practice | Convex has no middleware -- use `customMutation` wrappers or manual checks at mutation start |

**Deprecated/outdated:**
- TipTap v2: Do not use v2 APIs or import paths. The project will install v3 (3.20.4).
- `usePaginatedQuery` from Convex: The project already migrated away from this in Phase 6.1. Use `useQuery` with batch queries and client-side pagination.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 + convex-test 0.0.41 |
| Config file | `web/vitest.config.ts` |
| Quick run command | `cd web && npx vitest run --reporter=verbose` |
| Full suite command | `cd web && npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ADMN-01 | getReviewQueue returns pending scholarships with resolved sources | unit (convex-test) | `cd web && npx vitest run src/tests/admin.test.ts -t "getReviewQueue" -x` | Wave 0 |
| ADMN-02 | updateScholarship patches fields and creates revision records | unit (convex-test) | `cd web && npx vitest run src/tests/admin.test.ts -t "updateScholarship" -x` | Wave 0 |
| ADMN-03 | approveScholarship changes status, rejectScholarship changes status | unit (convex-test) | `cd web && npx vitest run src/tests/admin.test.ts -t "approve" -x` | Wave 0 |
| ADMN-04 | bulkApprove/bulkReject process multiple scholarships | unit (convex-test) | `cd web && npx vitest run src/tests/admin.test.ts -t "bulk" -x` | Wave 0 |
| ADMN-05 | updateSourceTrust changes trust level and triggers re-evaluation | unit (convex-test) | `cd web && npx vitest run src/tests/admin.test.ts -t "trust" -x` | Wave 0 |
| ADMN-06 | Auto-publish: createScholarship uses source trust + completeness gate | unit (convex-test) | `cd web && npx vitest run src/tests/aggregation.test.ts -t "auto-publish" -x` | Wave 0 |
| ADMN-07 | TipTap editorial notes stored as HTML, rendered in detail page | manual | Manual: edit note, verify public rendering | manual-only: requires browser interaction with WYSIWYG |
| ADMN-08 | Dedup at publish boundary blocks duplicate approval | unit (convex-test) | `cd web && npx vitest run src/tests/admin.test.ts -t "dedup" -x` | Wave 0 |
| UIDX-04 | UI uses neo-brutalism components (Card, Badge, Button variants) | manual | Manual: visual inspection of admin UI | manual-only: design/visual check |

### Sampling Rate
- **Per task commit:** `cd web && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd web && npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `web/src/tests/admin.test.ts` -- covers ADMN-01 through ADMN-05, ADMN-08
- [ ] Update `web/src/tests/aggregation.test.ts` -- add auto-publish tests for ADMN-06
- [ ] Framework install: `npm install @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-placeholder` -- new dependency

## Open Questions

1. **TipTap HTML vs Markdown storage**
   - What we know: TipTap outputs HTML natively. The existing EditorialTips.tsx uses react-markdown expecting markdown.
   - What's unclear: Whether to store as HTML and change the renderer, or convert TipTap output to markdown before saving.
   - Recommendation: Store as HTML (TipTap's native format). Update EditorialTips.tsx to detect if content is HTML (starts with `<`) and render it with a sanitized HTML approach. Markdown content from existing `demoteIncompleteScholarships` auto-notes continues to work via react-markdown. This dual-render approach handles both formats gracefully.

2. **Trigger-wrapped public mutations**
   - What we know: Existing trigger pattern wraps `rawInternalMutation`. Admin mutations need to be called from the client (public).
   - What's unclear: Whether to create a `triggeredPublicMutation` variant or use a public-to-internal mutation forwarding pattern.
   - Recommendation: Create a `triggeredPublicMutation` by importing `mutation as rawMutation` from `_generated/server` and applying `customMutation(rawMutation, customCtx(wrapDB))`. This is the cleanest approach and avoids the scheduler indirection.

3. **Queue pagination under load**
   - What we know: Current scholarship count is in the hundreds. Pending_review count after `demoteIncompleteScholarships` could be 50-200+.
   - What's unclear: Whether client-side pagination of 200 items will be fast enough, or if we need server-side pagination.
   - Recommendation: Use `.take(200)` with client-side pagination (20 per page). This matches the existing `listScholarshipsBatch` pattern. If queue grows beyond 200, add cursor-based pagination later.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `web/convex/schema.ts` -- scholarships table, sources table, existing validators and indexes
- Existing codebase: `web/convex/aggregation.ts` -- `createScholarship()` function (line 415: hardcodes `status: "published"`)
- Existing codebase: `web/convex/aggregationHelpers.ts` -- `TRUST_RANK`, `getTrustRank()`, field resolution
- Existing codebase: `web/convex/scraping.ts` -- `demoteIncompleteScholarships` (batch status change pattern)
- Existing codebase: `web/convex/triggers.ts` -- trigger-wrapped mutation pattern
- Existing codebase: `web/convex/dashboard.ts` -- operational query patterns
- Existing codebase: `web/src/components/detail/EditorialTips.tsx` -- react-markdown rendering
- Existing codebase: `web/src/components/directory/FilterPanel.tsx` -- manual checkbox pattern, mobile bottom sheet
- [TipTap React docs](https://tiptap.dev/docs/editor/getting-started/install/react) -- installation, useEditor hook
- [TipTap persistence docs](https://tiptap.dev/docs/editor/core-concepts/persistence) -- HTML/JSON output formats

### Secondary (MEDIUM confidence)
- [TipTap npm](https://www.npmjs.com/package/@tiptap/react) -- version 3.20.4 verified
- [Radix Dialog docs](https://www.radix-ui.com/primitives/docs/components/dialog) -- Sheet pattern from Dialog primitive
- [Convex custom functions](https://stack.convex.dev/custom-functions) -- customMutation wrapper pattern
- [Convex authorization patterns](https://stack.convex.dev/authorization) -- auth guard best practices

### Tertiary (LOW confidence)
- None -- all findings verified against codebase or official docs.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries verified against npm registry and existing codebase patterns
- Architecture: HIGH -- patterns directly extend existing codebase (trigger-wrapped mutations, batch queries, Radix primitives)
- Pitfalls: HIGH -- identified from actual code analysis (trigger scope, dedup gaps, Convex mutation limits)
- Auto-publish logic: HIGH -- existing `createScholarship()` code reviewed line-by-line; modification path is clear

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable -- all core libraries are mature, no fast-moving dependencies)
