---
phase: 05-admin-dashboard
verified: 2026-03-22T16:30:00Z
status: gaps_found
score: 11/12 must-haves verified
re_verification: false
gaps:
  - truth: "Admin can change a source trust level and see affected scholarship count"
    status: partial
    reason: "SourceTrustManager shows affected count only AFTER the mutation fires (post-confirm), not before. The pre-confirmation dialog always shows a generic fallback. The countAffectedScholarships query exists in admin.ts but is never called by the component."
    artifacts:
      - path: "web/src/components/admin/SourceTrustManager.tsx"
        issue: "Lines 79-95: const pending = sources ? 0 : 0 — always sets pending to 0. The countAffectedScholarships query is never imported or called. The dialog shows 'will affect pending scholarships from this source' (generic) instead of the real count."
    missing:
      - "Import and call api.admin.countAffectedScholarships in SourceTrustManager before opening the dialog"
      - "Pass the real affectedCount to the AlertDialog description so the admin sees 'will affect N pending scholarships' before confirming"
human_verification:
  - test: "Navigate to /admin and interact with the full dashboard"
    expected: "Stats bar shows 4 cards. Review queue loads with status tabs. Clicking a row expands it. Approve/reject/edit buttons work. Bulk checkbox selection shows floating bar. Edit panel slides from right with all fields. TipTap editor accepts input with toolbar. Revision history collapses/expands. Source Trust view shows all sources with trust dropdowns."
    why_human: "Visual rendering, animation transitions, real-time Convex subscriptions, and interactive form behavior cannot be verified statically."
  - test: "Resize browser below 1024px while on /admin"
    expected: "See 'Admin dashboard requires a desktop browser (1024px minimum)' message instead of the dashboard."
    why_human: "Responsive breakpoint behavior requires a real browser."
  - test: "Change a source trust level and verify the correct affected count shows before confirming"
    expected: "Dialog should show 'will affect N pending scholarships' with an accurate N, not just a generic placeholder."
    why_human: "The pre-confirm affected count is currently 0 (the gap). After fixing, this needs human confirmation that the count is accurate."
---

# Phase 5: Admin Dashboard Verification Report

**Phase Goal:** Build admin dashboard for scholarship review, editorial editing with revision history, source trust management, and bulk operations
**Verified:** 2026-03-22T16:30:00Z
**Status:** gaps_found — 1 partial gap (affected count pre-confirm in SourceTrustManager)
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Admin queries return scholarship queue filtered by status with resolved source info | VERIFIED | `getReviewQueue` in `admin.ts` queries `by_status` index, resolves `source_ids` to name/category/trust_level, checks for `possible_duplicate` raw records |
| 2 | Admin can approve, reject, and edit scholarships through mutations | VERIFIED | `approveScholarship`, `rejectScholarship`, `updateScholarship` mutations exist and pass 7/7 admin tests |
| 3 | Bulk approve/reject handles batch with dedup check | VERIFIED | `bulkApprove` uses Set to deduplicate within batch plus DB query for published duplicates; returns `{approved, blocked}` |
| 4 | Source trust update triggers retroactive re-evaluation of pending scholarships | VERIFIED | `updateSourceTrust` schedules `reevaluateSourceScholarships` via `ctx.scheduler.runAfter(0, ...)` |
| 5 | Aggregation pipeline sets status based on source trust level and field completeness | VERIFIED | `createScholarship` calls `determineStatus(ctx, [record.source_id], {...})` — confirmed by 4 passing auto-publish tests in `aggregation.test.ts` |
| 6 | Duplicate scholarship cannot be approved when same match_key already published | VERIFIED | `approveScholarship` queries `by_match_key`, throws `"Cannot approve: a published scholarship with the same title and organization already exists. Duplicate ID: ${...}"` |
| 7 | TipTap dependencies are installed and importable | VERIFIED | `@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/extension-placeholder` all in `package.json` |
| 8 | Admin layout route renders without public navbar | VERIFIED | `route.tsx` renders its own `AdminHeader` inside `lg:flex` wrapper; `Outlet` is inside that wrapper, not inside the root Navbar |
| 9 | Admin stats bar displays four stat cards | VERIFIED | `StatsBar.tsx` renders 4 `StatCard` components with Total Scholarships, Pending Review, Published Today, Source Health in `grid grid-cols-4 gap-8` |
| 10 | Slide-out edit panel opens from the right at 40% viewport width | VERIFIED | `EditPanel.tsx` uses `w-[40%] min-w-[480px] max-w-[640px]` with `slide-in-from-right` animation |
| 11 | Save mutation creates revision history entries for changed fields | VERIFIED | `updateScholarship` iterates changed fields, inserts into `scholarship_revisions`; confirmed by `updateScholarship` test checking `old_value`/`new_value` |
| 12 | Admin can change a source trust level and see affected scholarship count | PARTIAL | `updateSourceTrust` mutation returns `affectedCount`, but `SourceTrustManager` shows the count only post-mutation, not in the pre-confirmation dialog |

**Score:** 11/12 truths verified (1 partial)

### Required Artifacts

| Artifact | Provided | Status | Details |
|----------|----------|--------|---------|
| `web/convex/admin.ts` | Admin queries and mutations | VERIFIED | 15 exports: getAdminStats, getReviewQueue, getRevisionHistory, getScholarshipForEdit, getAllSources, countAffectedScholarships, approveScholarship, rejectScholarship, bulkApprove, bulkReject, updateScholarship, updateSourceTrust, reevaluateSourceScholarships; ~499 lines |
| `web/convex/adminHelpers.ts` | isAdmin, hasRequiredFields, determineStatus | VERIFIED | All 3 functions exported and correct |
| `web/convex/schema.ts` | scholarship_revisions table | VERIFIED | Table at line 272 with `by_scholarship` and `by_changed_at` indexes |
| `web/src/tests/admin.test.ts` | Admin mutation tests | VERIFIED | 7 tests covering getReviewQueue, approveScholarship (incl. dedup), bulkApprove, bulkReject, updateScholarship (revision tracking), updateSourceTrust; all pass |
| `web/src/routes/admin/route.tsx` | Admin layout, no public navbar | VERIFIED | Has AdminHeader, desktop-only guard, `Outlet` |
| `web/src/routes/admin/index.tsx` | Admin dashboard page | VERIFIED | StatsBar + ReviewQueue/SourceTrustManager view switcher + EditPanel |
| `web/src/components/admin/StatsBar.tsx` | 4-column stats grid | VERIFIED | Correct grid layout and all 4 stat labels |
| `web/src/components/admin/StatCard.tsx` | Individual stat card | VERIFIED | `border-l-4 border-l-main`, `text-2xl font-heading` present |
| `web/src/components/admin/ReviewQueue.tsx` | Tabbed queue | VERIFIED | 5 tabs, pagination, trust-based sorting, select-all |
| `web/src/components/admin/QueueRow.tsx` | Expandable row | VERIFIED | Compact/expanded states, approve/reject/edit actions with dedup error display |
| `web/src/components/admin/BulkActionBar.tsx` | Floating bulk actions | VERIFIED | `fixed bottom-0 inset-x-0`, `role="toolbar"`, bulkApprove/bulkReject wired |
| `web/src/hooks/useAdminSelection.ts` | Selection state | VERIFIED | toggle, selectAll, deselectAll, isSelected all implemented |
| `web/src/components/admin/EditPanel.tsx` | Right slide-out sheet | VERIFIED | `w-[40%] min-w-[480px]`, dirty state guard via `window.confirm` |
| `web/src/components/admin/EditForm.tsx` | All-fields edit form | VERIFIED | All 16 fields, api.admin.updateScholarship, Save Changes, Close Panel, dirty tracking |
| `web/src/components/admin/EditorialEditor.tsx` | TipTap WYSIWYG | VERIFIED | StarterKit, Link, Placeholder; 7 toolbar buttons with `aria-pressed`, `aria-label="Editorial notes editor"` |
| `web/src/components/admin/RevisionHistory.tsx` | Change history timeline | VERIFIED | useQuery(api.admin.getRevisionHistory), Change History label, `max-h-[300px]`, `bg-main` dot |
| `web/src/components/admin/SourceTrustManager.tsx` | Source trust config | PARTIAL | Core wiring exists; confirmation dialog shows generic fallback count instead of real affected count |
| `web/src/components/admin/DuplicateBadge.tsx` | Duplicate warning badge | VERIFIED | `urgencyWarning` variant, "Possible duplicate" text, AlertTriangle icon |
| `web/src/components/detail/EditorialTips.tsx` | Dual-format rendering | VERIFIED | `isHtml` detection, DOMPurify HTML branch, existing Markdown branch |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `web/convex/admin.ts` | `web/convex/triggers.ts` | `customMutation(rawMutation, customCtx(wrapDB))` | WIRED | Lines 28-29 confirmed |
| `web/convex/aggregation.ts` | `web/convex/adminHelpers.ts` | `determineStatus` called in `createScholarship` | WIRED | Lines 14 (import) and 430 (call) confirmed |
| `web/src/components/admin/ReviewQueue.tsx` | `web/convex/admin.ts` | `useQuery(api.admin.getReviewQueue)` | WIRED | Line 69 |
| `web/src/components/admin/QueueRow.tsx` | `web/convex/admin.ts` | `useMutation` for approve/reject | WIRED | Lines 108-109 |
| `web/src/components/admin/BulkActionBar.tsx` | `web/convex/admin.ts` | `useMutation` for bulkApprove/bulkReject | WIRED | Lines 15-16 |
| `web/src/components/admin/EditForm.tsx` | `web/convex/admin.ts` | `useMutation(api.admin.updateScholarship)` | WIRED | Line 108 |
| `web/src/components/admin/RevisionHistory.tsx` | `web/convex/admin.ts` | `useQuery(api.admin.getRevisionHistory)` | WIRED | Line 38 |
| `web/src/components/admin/EditorialEditor.tsx` | `@tiptap/react` | `useEditor` hook | WIRED | Line 31 |
| `web/src/components/admin/SourceTrustManager.tsx` | `web/convex/admin.ts` | `useMutation(api.admin.updateSourceTrust)` | WIRED | Line 34 |
| `web/src/components/admin/SourceTrustManager.tsx` | `web/convex/admin.ts` | `useQuery(api.admin.countAffectedScholarships)` | NOT_WIRED | The `countAffectedScholarships` query exists in admin.ts but is never imported or called in SourceTrustManager |
| `web/src/components/admin/QueueRow.tsx` | `web/src/components/admin/EditPanel.tsx` | `onEdit` callback | WIRED | `onEdit` prop called at line 447 ("Edit" button) |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| ADMN-01 | 05-01, 05-03 | Admin can view review queue of pending scraped scholarships | SATISFIED | `getReviewQueue` query + `ReviewQueue.tsx` component with status tabs |
| ADMN-02 | 05-01, 05-04 | Admin can edit any scholarship field | SATISFIED | `updateScholarship` mutation + `EditForm.tsx` with all 16 fields |
| ADMN-03 | 05-01, 05-03 | Admin can approve or reject with single action | SATISFIED | `approveScholarship`/`rejectScholarship` + `QueueRow.tsx` action buttons |
| ADMN-04 | 05-01, 05-03 | Admin can bulk-approve or bulk-reject | SATISFIED | `bulkApprove`/`bulkReject` + `BulkActionBar.tsx` |
| ADMN-05 | 05-01, 05-05 | Admin can configure source trust levels | PARTIALLY SATISFIED | `updateSourceTrust` works; `SourceTrustManager` shows sources and allows changes but pre-confirm count is always generic |
| ADMN-06 | 05-01, 05-05 | Trusted sources auto-publish without manual review | SATISFIED | `determineStatus` in `adminHelpers.ts`, wired into `aggregation.ts`; 4 auto-publish tests pass |
| ADMN-07 | 05-04 | Admin can add editorial notes and tips (rich text) | SATISFIED | TipTap `EditorialEditor` wired into `EditForm`; `EditorialTips` on public page handles HTML+markdown |
| ADMN-08 | 05-01, 05-03 | No duplicate scholarships can be published | SATISFIED | Dedup enforced in `approveScholarship`, `bulkApprove`; throws with match_key error; test at line 111 passes |
| UIDX-04 | 05-02 | Use frontend-design skill for all UI implementation | SATISFIED | Neo-brutalism design tokens (border-2 border-border, shadow-shadow, font-heading, bg-main) used consistently across all admin components |

### Anti-Patterns Found

| File | Lines | Pattern | Severity | Impact |
|------|-------|---------|----------|--------|
| `web/src/components/admin/SourceTrustManager.tsx` | 79-95 | `const pending = sources ? 0 : 0` — always evaluates to 0; sets `affectedCount` to 0 before dialog opens; `countAffectedScholarships` query never called | Warning | Pre-confirm dialog shows generic "will affect pending scholarships from this source" instead of actual count; UX is misleading but core mutation works correctly |

### Human Verification Required

#### 1. Full Admin Dashboard Visual Walkthrough

**Test:** Start dev server (`cd web && npm run dev`), navigate to `/admin`.
**Expected:** Stats bar shows 4 cards. Review queue loads with Pending Review/Published/Rejected/Archived/All tabs. Click a row to expand — all fields visible plus Approve/Reject/Edit buttons. Click "Edit" — slide-out panel opens from right. TipTap toolbar functional. Bulk checkbox selection shows floating bottom bar. "Source Trust" tab shows source table with dropdowns.
**Why human:** Visual rendering, Convex real-time subscriptions, and animation transitions cannot be verified statically.

#### 2. Desktop-Only Guard

**Test:** Resize browser to under 1024px while on `/admin`.
**Expected:** The main dashboard disappears and "Admin dashboard requires a desktop browser (1024px minimum)." message is shown.
**Why human:** CSS responsive breakpoint behavior requires a real browser.

#### 3. Pre-Confirm Affected Count (after gap fix)

**Test:** After fixing the `countAffectedScholarships` wiring, change a source trust level and verify the dialog count is accurate.
**Expected:** Dialog shows "Changing trust level to [X] will affect N pending scholarships" where N is correct.
**Why human:** Requires real data in the database to verify count accuracy.

### Gaps Summary

There is one partial gap blocking a requirement claim:

**ADMN-05 / Pre-confirm affected count (SourceTrustManager):** The `countAffectedScholarships` query was correctly implemented in `admin.ts` but the `SourceTrustManager` component never calls it. Lines 79-95 of `SourceTrustManager.tsx` stub the affected count as `0` with a comment explaining the workaround. The confirmation dialog therefore always shows "will affect pending scholarships from this source" (generic fallback) instead of "will affect N pending scholarships". The mutation itself works correctly — `updateSourceTrust` returns the real `affectedCount` post-mutation and retroactive re-evaluation is properly scheduled.

The fix requires adding `useQuery(api.admin.countAffectedScholarships, confirmingSource ? { sourceId: confirmingSource.id } : "skip")` and displaying that value in the AlertDialog description before the user confirms.

---

_Verified: 2026-03-22T16:30:00Z_
_Verifier: Claude (gsd-verifier)_
