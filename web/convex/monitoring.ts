import { internalQuery } from "./_generated/server";

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

/**
 * Query whether the heartbeat is stale (no successful run in 48h).
 */
export const getStaleHeartbeat = internalQuery({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - FORTY_EIGHT_HOURS_MS;

    const recentRun = await ctx.db
      .query("scrape_runs")
      .withIndex("by_started_at")
      .order("desc")
      .filter((q) => q.eq(q.field("status"), "completed"))
      .first();

    return !recentRun || recentRun.started_at < cutoff;
  },
});
