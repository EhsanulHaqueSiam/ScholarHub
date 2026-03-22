---
phase: quick
plan: 260322-hky
type: execute
wave: 1
depends_on: []
files_modified:
  - web/src/routes/scholarships/index.tsx
autonomous: true
requirements: []
must_haves:
  truths:
    - "Desktop pagination replaces content: clicking page 2 shows only items 21-40, not 1-40"
    - "Mobile 'Show More' keeps accumulative behavior: clicking loads more appends items"
    - "Desktop page navigation scrolls to #results after page change"
    - "Results count text accurately reflects what is displayed"
  artifacts:
    - path: "web/src/routes/scholarships/index.tsx"
      provides: "Dual pagination behavior: page-based on desktop, accumulative on mobile"
  key_links:
    - from: "DesktopPagination onPageChange"
      to: "results slice logic"
      via: "currentPage state drives different slice per viewport"
      pattern: "slice\\(.*currentPage"
---

<objective>
Fix desktop pagination to replace page content instead of appending. Currently both desktop
and mobile use the same accumulative "load more" slicing logic (slice(0, currentPage * PAGE_SIZE)),
but desktop shows numbered page buttons (1, 2, 3...) that users expect to navigate between
distinct pages of content.

Purpose: Desktop users clicking "page 2" should see items 21-40, not items 1-40. Mobile keeps
infinite-scroll-style "Show More" behavior.

Output: Updated scholarships/index.tsx with viewport-aware pagination slicing.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@web/src/routes/scholarships/index.tsx
@web/src/components/directory/Pagination.tsx
@web/src/hooks/useScholarshipFilters.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Implement viewport-aware pagination slicing</name>
  <files>web/src/routes/scholarships/index.tsx</files>
  <action>
In ScholarshipsDirectory component, make these changes:

1. Add a boolean state to track whether the user is on a desktop-sized viewport.
   Use a simple matchMedia approach (no external library needed):
   ```
   const [isDesktop, setIsDesktop] = useState(false);
   useEffect(() => {
     const mql = window.matchMedia("(min-width: 1024px)");
     setIsDesktop(mql.matches);
     const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
     mql.addEventListener("change", handler);
     return () => mql.removeEventListener("change", handler);
   }, []);
   ```
   Note: the 1024px breakpoint matches the `lg:` Tailwind breakpoint used for showing/hiding
   the desktop pagination (`hidden lg:block` on line 299) and hiding the mobile "Show More"
   button (`lg:hidden` on line 287).

2. Change the `results` useMemo (currently line 126-129) to use two different slicing strategies:
   - Desktop (isDesktop=true): `allResults.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)`
     This shows ONLY the current page's items (e.g., page 2 = items 21-40).
   - Mobile (isDesktop=false): `allResults.slice(0, currentPage * PAGE_SIZE)`
     This keeps the accumulative "load more" behavior (page 2 = items 1-40).
   Add `isDesktop` to the useMemo dependency array.

3. Update `hasMore` (currently line 132): On desktop, hasMore should be false (desktop uses
   numbered pagination, not "Show More"). On mobile, keep existing logic.
   ```
   const hasMore = !isDesktop && results ? results.length < totalAvailable : false;
   ```

4. Update the "Showing all X matching scholarships" text (currently line 305-308): change to
   show accurate count for the current page view. Replace with:
   ```
   {hasResults && (
     <p className="text-center text-sm text-foreground/60 mt-4">
       Showing {results.length} of {totalAvailable} matching scholarships
     </p>
   )}
   ```
   Remove the `!hasMore &&` condition since desktop always shows this text.
  </action>
  <verify>
    <automated>cd /home/siam/Personal/ScholarHub/web && npx tsc --noEmit --pretty 2>&1 | tail -20</automated>
  </verify>
  <done>
    - Desktop (lg+): DesktopPagination page buttons navigate between distinct pages; clicking page 2
      shows only items 21-40, clicking page 1 shows items 1-20.
    - Mobile (below lg): "Show More" button still works accumulatively, appending the next 20 items.
    - TypeScript compiles without errors.
    - Results count text accurately reflects displayed vs total items.
  </done>
</task>

</tasks>

<verification>
- TypeScript compiles: `cd web && npx tsc --noEmit`
- Visual check: On desktop viewport, clicking page 2 replaces content (items 21-40 only, not 1-40)
- Visual check: On mobile viewport, "Show More" still appends items
- Pagination component still shows correct total page count
</verification>

<success_criteria>
Desktop pagination replaces content per-page (page N shows items (N-1)*20+1 through N*20).
Mobile "Show More" continues to accumulate results. No TypeScript errors.
</success_criteria>

<output>
After completion, create `.planning/quick/260322-hky-fix-desktop-pagination-to-replace-conten/260322-hky-SUMMARY.md`
</output>
