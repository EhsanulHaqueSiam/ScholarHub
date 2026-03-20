import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import {
  scrapeMethodValidator,
  scrapeRunStatusValidator,
  sourceResultStatusValidator,
} from "./schema";

/**
 * Start a new scrape run. Returns the run ID.
 */
export const startRun = internalMutation({
  args: {
    triggered_by: v.string(),
    sources_targeted: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("scrape_runs", {
      started_at: Date.now(),
      status: "running",
      triggered_by: args.triggered_by,
      sources_targeted: args.sources_targeted,
      sources_completed: 0,
      sources_failed: 0,
      records_inserted: 0,
      records_updated: 0,
      records_unchanged: 0,
    });
  },
});

/**
 * Complete a scrape run with final statistics.
 */
export const completeRun = internalMutation({
  args: {
    run_id: v.id("scrape_runs"),
    status: scrapeRunStatusValidator,
    sources_completed: v.number(),
    sources_failed: v.number(),
    records_inserted: v.number(),
    records_updated: v.number(),
    records_unchanged: v.number(),
    duration_seconds: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.run_id, {
      completed_at: Date.now(),
      status: args.status,
      sources_completed: args.sources_completed,
      sources_failed: args.sources_failed,
      records_inserted: args.records_inserted,
      records_updated: args.records_updated,
      records_unchanged: args.records_unchanged,
      duration_seconds: args.duration_seconds,
    });
  },
});

// Fields to compare for change detection
const TRACKED_FIELDS = [
  "title",
  "description",
  "host_country",
  "application_deadline",
  "award_amount",
  "source_url",
] as const;

/**
 * Batch insert/update raw records with upsert+dedup logic.
 * For each record: checks by_source_external index for existing.
 * If existing, computes field-level diff and logs changes.
 * If new, inserts with scraped_at timestamp.
 */
export const batchInsertRawRecords = internalMutation({
  args: {
    run_id: v.id("scrape_runs"),
    records: v.array(
      v.object({
        source_id: v.id("sources"),
        external_id: v.optional(v.string()),
        title: v.string(),
        description: v.optional(v.string()),
        provider_organization: v.optional(v.string()),
        host_country: v.optional(v.string()),
        eligibility_nationalities: v.optional(v.array(v.string())),
        degree_levels: v.optional(v.array(v.string())),
        fields_of_study: v.optional(v.array(v.string())),
        funding_type: v.optional(v.string()),
        award_amount: v.optional(v.string()),
        award_currency: v.optional(v.string()),
        application_deadline: v.optional(v.string()),
        application_url: v.optional(v.string()),
        source_url: v.string(),
        raw_data: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    let inserted = 0;
    let updated = 0;
    let unchanged = 0;

    for (const record of args.records) {
      // Look for existing record by source + external_id
      const existing = record.external_id
        ? await ctx.db
            .query("raw_records")
            .withIndex("by_source_external", (q) =>
              q.eq("source_id", record.source_id).eq("external_id", record.external_id),
            )
            .first()
        : null;

      if (existing) {
        // Compute field-level diff
        const changes: Array<{
          field_name: string;
          old_value: string | undefined;
          new_value: string | undefined;
        }> = [];

        for (const field of TRACKED_FIELDS) {
          const oldVal = existing[field];
          const newVal = record[field as keyof typeof record];
          const oldStr = oldVal != null ? String(oldVal) : undefined;
          const newStr = newVal != null ? String(newVal) : undefined;
          if (oldStr !== newStr) {
            changes.push({
              field_name: field,
              old_value: oldStr,
              new_value: newStr,
            });
          }
        }

        if (changes.length > 0) {
          // Log changes
          const now = Date.now();
          for (const change of changes) {
            await ctx.db.insert("change_log", {
              record_id: existing._id,
              source_id: record.source_id,
              run_id: args.run_id,
              changed_at: now,
              field_name: change.field_name,
              old_value: change.old_value,
              new_value: change.new_value,
            });
          }

          // Patch existing record
          await ctx.db.patch(existing._id, {
            ...record,
            scraped_at: Date.now(),
            scrape_run_id: args.run_id,
          });
          updated++;
        } else {
          unchanged++;
        }
      } else {
        // Insert new record
        await ctx.db.insert("raw_records", {
          ...record,
          scraped_at: Date.now(),
          scrape_run_id: args.run_id,
        });
        inserted++;
      }
    }

    return { inserted, updated, unchanged };
  },
});

/**
 * Record the result of scraping a single source within a run.
 */
export const recordSourceResult = internalMutation({
  args: {
    run_id: v.id("scrape_runs"),
    source_id: v.id("sources"),
    status: sourceResultStatusValidator,
    method_used: scrapeMethodValidator,
    records_found: v.number(),
    records_new: v.number(),
    records_updated: v.number(),
    records_unchanged: v.number(),
    duration_seconds: v.number(),
    bytes_downloaded: v.optional(v.number()),
    error_type: v.optional(v.string()),
    error_message: v.optional(v.string()),
    fallback_used: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("scrape_run_sources", args);
  },
});

/**
 * Update health tracking for a source after a scrape attempt.
 * Upserts by source_id. On success: resets failures, updates yield.
 * On failure: increments failures, sets status to "failing" if >= 5.
 */
export const updateSourceHealth = internalMutation({
  args: {
    source_id: v.id("sources"),
    success: v.boolean(),
    records_found: v.optional(v.number()),
    error_type: v.optional(v.string()),
    error_message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("source_health")
      .withIndex("by_source", (q) => q.eq("source_id", args.source_id))
      .first();

    const now = Date.now();

    if (args.success) {
      const currentYield = args.records_found ?? 0;

      if (existing) {
        // Calculate rolling average yield
        const prevAvg = existing.avg_yield ?? currentYield;
        const newAvg = Math.round((prevAvg * 0.7 + currentYield * 0.3) * 100) / 100;

        // Determine health status based on yield
        const isHealthy = currentYield >= newAvg * 0.5;
        const status = isHealthy ? "healthy" : "degraded";

        // Determine yield trend
        let yieldTrend = existing.yield_trend ?? "stable";
        if (currentYield > prevAvg * 1.1) {
          yieldTrend = "increasing";
        } else if (currentYield < prevAvg * 0.9) {
          yieldTrend = "decreasing";
        } else {
          yieldTrend = "stable";
        }

        await ctx.db.patch(existing._id, {
          status: status as "healthy" | "degraded",
          consecutive_failures: 0,
          last_success: now,
          last_yield: currentYield,
          avg_yield: newAvg,
          yield_trend: yieldTrend,
          last_error_type: undefined,
          last_error_message: undefined,
        });
      } else {
        await ctx.db.insert("source_health", {
          source_id: args.source_id,
          status: "healthy",
          consecutive_failures: 0,
          last_success: now,
          last_yield: currentYield,
          avg_yield: currentYield,
          yield_trend: "stable",
        });
      }
    } else {
      // Failure path
      if (existing) {
        const newFailures = existing.consecutive_failures + 1;
        const status = newFailures >= 5 ? "failing" : existing.status;

        await ctx.db.patch(existing._id, {
          status: status as "healthy" | "degraded" | "failing" | "deactivated",
          consecutive_failures: newFailures,
          last_failure: now,
          last_error_type: args.error_type,
          last_error_message: args.error_message,
        });
      } else {
        await ctx.db.insert("source_health", {
          source_id: args.source_id,
          status: "degraded",
          consecutive_failures: 1,
          last_failure: now,
          last_error_type: args.error_type,
          last_error_message: args.error_message,
        });
      }
    }
  },
});

/**
 * Update the last_scraped timestamp on a source (fulfills SCRP-07).
 */
export const updateLastScraped = internalMutation({
  args: {
    source_id: v.id("sources"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.source_id, {
      last_scraped: Date.now(),
    });
  },
});
