import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get the 10 most recent scrape runs with computed duration.
 */
export const getRecentRuns = query({
  args: {},
  handler: async (ctx) => {
    const runs = await ctx.db
      .query("scrape_runs")
      .withIndex("by_started_at")
      .order("desc")
      .take(10);

    return runs.map((run) => ({
      ...run,
      computed_duration: run.completed_at
        ? Math.round((run.completed_at - run.started_at) / 1000)
        : null,
    }));
  },
});

/**
 * Get all source health records joined with source names.
 * Sorted by status: failing first, then degraded, healthy, deactivated.
 */
export const getSourceHealth = query({
  args: {},
  handler: async (ctx) => {
    const healthRecords = await ctx.db.query("source_health").collect();

    const statusOrder: Record<string, number> = {
      failing: 0,
      deactivated: 1,
      degraded: 2,
      healthy: 3,
    };

    const withNames = await Promise.all(
      healthRecords.map(async (record) => {
        const source = await ctx.db.get(record.source_id);
        return {
          ...record,
          source_name: source?.name ?? "Unknown",
          source_url: source?.url,
        };
      }),
    );

    return withNames.sort(
      (a, b) => (statusOrder[a.status] ?? 4) - (statusOrder[b.status] ?? 4),
    );
  },
});

/**
 * Get sources with "failing" or "deactivated" health status.
 */
export const getFailingSources = query({
  args: {},
  handler: async (ctx) => {
    const failing = await ctx.db
      .query("source_health")
      .withIndex("by_status", (q) => q.eq("status", "failing"))
      .collect();

    const deactivated = await ctx.db
      .query("source_health")
      .withIndex("by_status", (q) => q.eq("status", "deactivated"))
      .collect();

    const all = [...failing, ...deactivated];

    return await Promise.all(
      all.map(async (record) => {
        const source = await ctx.db.get(record.source_id);
        return {
          ...record,
          source_name: source?.name ?? "Unknown",
          source_url: source?.url,
        };
      }),
    );
  },
});

/**
 * Get stats for a single scrape run including all per-source results.
 */
export const getRunStats = query({
  args: {
    run_id: v.id("scrape_runs"),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.run_id);
    if (!run) {
      return null;
    }

    const sourceResults = await ctx.db
      .query("scrape_run_sources")
      .withIndex("by_run", (q) => q.eq("run_id", args.run_id))
      .collect();

    const withNames = await Promise.all(
      sourceResults.map(async (result) => {
        const source = await ctx.db.get(result.source_id);
        return {
          ...result,
          source_name: source?.name ?? "Unknown",
        };
      }),
    );

    return {
      run,
      source_results: withNames,
    };
  },
});
