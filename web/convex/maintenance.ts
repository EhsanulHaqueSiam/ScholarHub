import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { MAX_RAW_DATA_CHARS } from "./scraping";

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

/**
 * Backfill raw_records to keep raw_data bounded for read-cost control.
 * This trims legacy oversized payloads created before compactRawData existed.
 */
export const trimRawPayloads = internalMutation({
  args: {
    cursor: v.optional(v.string()),
    processed: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const page = await ctx.db.query("raw_records").paginate({
      cursor: args.cursor ?? null,
      numItems: BATCH_SIZE,
    });

    let trimmed = 0;
    for (const record of page.page) {
      if (record.raw_data && record.raw_data.length > MAX_RAW_DATA_CHARS) {
        await ctx.db.patch(record._id, {
          raw_data: record.raw_data.slice(0, MAX_RAW_DATA_CHARS),
        });
        trimmed += 1;
      }
    }

    const processed = (args.processed ?? 0) + page.page.length;
    if (!page.isDone) {
      await ctx.scheduler.runAfter(0, internal.maintenance.trimRawPayloads, {
        cursor: page.continueCursor,
        processed,
      });
    }

    return { processed, trimmed, complete: page.isDone };
  },
});
