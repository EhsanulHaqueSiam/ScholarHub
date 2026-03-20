import { internalMutation, internalQuery } from "./_generated/server";

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

/**
 * Check heartbeat: log a warning if no successful scrape run
 * in the last 48 hours. Runs as a cron job.
 */
export const checkHeartbeat = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - FORTY_EIGHT_HOURS_MS;

    // Check for any completed run in the last 48 hours
    const recentRun = await ctx.db
      .query("scrape_runs")
      .withIndex("by_started_at")
      .order("desc")
      .filter((q) => q.eq(q.field("status"), "completed"))
      .first();

    if (!recentRun || recentRun.started_at < cutoff) {
      console.warn(
        "[HEARTBEAT] No successful scrape run in the last 48 hours. Pipeline may be stalled.",
      );
    }
  },
});

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
