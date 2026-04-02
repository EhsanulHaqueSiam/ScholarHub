# Convex Quota Runbook

## Goal
Keep production Convex usage predictable and avoid runaway bandwidth/function-call incidents.

## Before every deploy
1. Run static export:
```bash
cd web
bun run export-data
```
2. Run readiness checks:
```bash
cd web
bun run quota:readiness
```
3. Ensure type/test baseline is clean:
```bash
cd web
bun tsc --noEmit
bun vitest run
```

## High-priority dashboard watchlist
Open Convex dashboard and check both `Function Calls` and `Database Bandwidth`.

### P0 (must stay controlled)
1. `aggregation.archiveExpired`
2. `directory.listScholarships`
3. `directory.searchSuggestions`
4. `admin.getReviewQueue`
5. `admin.getAdminStats`

### P1 (fallback pressure indicators)
1. `seo.getSitemapData`
2. `directory.getBySlug`
3. `seo.getCountryStats`
4. `seo.getDegreeStats`
5. `shortlist.suggestUniversities`
6. `eligibility.getMatchCount`
7. `eligibility.getEligibleScholarships`

## Expected post-optimization behavior
1. Public scholarship/collection routes should mostly use static JSON.
2. Crawler-facing routes (`/api/sitemap.xml`, `/api/og`) should mostly avoid Convex reads.
3. `archiveExpired` should run only as a bounded weekly chain and reject stale/no-runKey invocations.

## Incident thresholds (recommended)
1. `aggregation.archiveExpired` appears heavily outside scheduled window: investigate immediately.
2. `directory.listScholarships` or `directory.searchSuggestions` suddenly spikes: verify static export freshness.
3. `seo.getSitemapData` / `directory.getBySlug` / `seo.getCountryStats` / `seo.getDegreeStats` spikes: verify API static fallback path is active.
4. `admin.getReviewQueue` bandwidth jumps after admin activity: verify list limits and includeResolvedSources behavior.

## Quick incident checklist
1. Confirm static data age:
```bash
cd web
bun run quota:readiness
```
2. Confirm archive run key sync in code:
   - `convex/aggregation.ts` `ARCHIVE_RUN_KEY`
   - `convex/crons.ts` `archive_expired` payload `runKey`
3. Verify no old deployment is still scheduling stale internal jobs.
4. If needed, temporarily pause high-cost admin workflows until traffic normalizes.
