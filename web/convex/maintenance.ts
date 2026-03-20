import { internalMutation } from "./_generated/server";

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
const BATCH_SIZE = 100;

/**
 * Delete raw_records older than 90 days.
 * Processes in batches to avoid Convex timeout.
 */
export const cleanupOldRecords = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - NINETY_DAYS_MS;
    let deleted = 0;

    // Query records by scrape_run (ordered by _creationTime as fallback)
    const oldRecords = await ctx.db
      .query("raw_records")
      .filter((q) => q.lt(q.field("scraped_at"), cutoff))
      .take(BATCH_SIZE);

    for (const record of oldRecords) {
      await ctx.db.delete(record._id);
      deleted++;
    }

    return { deleted };
  },
});

/**
 * Delete change_log entries older than 90 days.
 * Processes in batches to avoid Convex timeout.
 */
export const cleanupChangeLog = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - NINETY_DAYS_MS;
    let deleted = 0;

    const oldEntries = await ctx.db
      .query("change_log")
      .withIndex("by_changed_at")
      .filter((q) => q.lt(q.field("changed_at"), cutoff))
      .take(BATCH_SIZE);

    for (const entry of oldEntries) {
      await ctx.db.delete(entry._id);
      deleted++;
    }

    return { deleted };
  },
});
