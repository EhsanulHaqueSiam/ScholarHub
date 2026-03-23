import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, mutation } from "./_generated/server";
import {
  scrapeMethodValidator,
  scrapeRunStatusValidator,
  sourceResultStatusValidator,
} from "./schema";

/**
 * Start a new scrape run. Returns the run ID.
 */
export const startRun = mutation({
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
export const completeRun = mutation({
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

    // Trigger aggregation pipeline for newly inserted raw_records
    if (args.status === "completed" && args.records_inserted > 0) {
      await ctx.scheduler.runAfter(0, internal.aggregation.aggregateBatch, {
        cursor: null,
        batchSize: 50,
        runId: args.run_id,
      });
    }
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
export const batchInsertRawRecords = mutation({
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
        funding_tuition: v.optional(v.boolean()),
        funding_living: v.optional(v.boolean()),
        funding_travel: v.optional(v.boolean()),
        funding_insurance: v.optional(v.boolean()),
        funding_books: v.optional(v.boolean()),
        funding_research: v.optional(v.boolean()),
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
export const recordSourceResult = mutation({
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
export const updateSourceHealth = mutation({
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
        return {
          consecutive_failures: 0,
          github_issue_number: existing.github_issue_number,
        };
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
        return { consecutive_failures: 0 };
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
        return {
          consecutive_failures: newFailures,
          github_issue_number: existing.github_issue_number,
        };
      } else {
        await ctx.db.insert("source_health", {
          source_id: args.source_id,
          status: "degraded",
          consecutive_failures: 1,
          last_failure: now,
          last_error_type: args.error_type,
          last_error_message: args.error_message,
        });
        return { consecutive_failures: 1 };
      }
    }
  },
});

/**
 * Deactivate a source after repeated failures or permanent-gone errors.
 * Sets source_health status to "deactivated" and marks source inactive.
 */
export const deactivateSource = internalMutation({
  args: {
    source_id: v.id("sources"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("source_health")
      .withIndex("by_source", (q) => q.eq("source_id", args.source_id))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: "deactivated",
        deactivation_reason: args.reason,
      });
    } else {
      await ctx.db.insert("source_health", {
        source_id: args.source_id,
        status: "deactivated",
        consecutive_failures: 0,
        deactivation_reason: args.reason,
      });
    }

    // Mark the source itself inactive
    await ctx.db.patch(args.source_id, { is_active: false });
  },
});

/**
 * Store the GitHub Issue number on a source's health record.
 * Used after creating a rot-detection issue to prevent duplicates.
 */
export const storeGitHubIssueNumber = internalMutation({
  args: {
    source_id: v.id("sources"),
    issue_number: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("source_health")
      .withIndex("by_source", (q) => q.eq("source_id", args.source_id))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        github_issue_number: args.issue_number,
      });
    } else {
      await ctx.db.insert("source_health", {
        source_id: args.source_id,
        status: "failing",
        consecutive_failures: 0,
        github_issue_number: args.issue_number,
      });
    }
  },
});

/**
 * Clear the GitHub Issue number from a source's health record.
 * Called when a previously-failing source recovers and the issue is closed.
 */
export const clearGitHubIssueNumber = internalMutation({
  args: {
    source_id: v.id("sources"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("source_health")
      .withIndex("by_source", (q) => q.eq("source_id", args.source_id))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        github_issue_number: undefined,
      });
    }
  },
});

/**
 * Update the last_scraped timestamp on a source (fulfills SCRP-07).
 */
export const updateLastScraped = mutation({
  args: {
    source_id: v.id("sources"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.source_id, {
      last_scraped: Date.now(),
    });
  },
});

/**
 * Bulk-promote raw_records to the scholarships table.
 * Processes up to `limit` unpromoted records (no canonical_id).
 * Returns count of promoted records for batching.
 */
export const bulkPublishRawRecords = mutation({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.limit ?? 100;
    const VALID_DEGREES = new Set(["bachelor", "master", "phd", "postdoc"]);
    const VALID_FUNDING = new Set(["fully_funded", "partial", "tuition_waiver", "stipend_only"]);

    // Find raw_records without canonical_id (not yet promoted)
    // Use by_canonical index: undefined values sort FIRST in Convex indexes,
    // so unpromoted records appear at the start — no full table scan needed.
    const candidates = await ctx.db.query("raw_records").withIndex("by_canonical").take(batchSize);
    const unpromoted = candidates.filter((r) => !r.canonical_id);

    let promoted = 0;
    let skipped = 0;

    for (const raw of unpromoted) {
      // Skip records without required fields
      if (!raw.title || !raw.title.trim()) {
        skipped++;
        continue;
      }

      // Generate slug from title
      const slug = raw.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 80);

      // Check for duplicate slug
      const existing = await ctx.db
        .query("scholarships")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first();

      if (existing) {
        // Link raw_record to existing scholarship
        await ctx.db.patch(raw._id, { canonical_id: existing._id });
        skipped++;
        continue;
      }

      // Map degree_levels (validate against enum)
      let degreeLevels: Array<"bachelor" | "master" | "phd" | "postdoc"> = [];
      if (raw.degree_levels && Array.isArray(raw.degree_levels)) {
        degreeLevels = raw.degree_levels.filter((d: string) =>
          VALID_DEGREES.has(d.toLowerCase()),
        ) as Array<"bachelor" | "master" | "phd" | "postdoc">;
      }
      if (degreeLevels.length === 0) {
        degreeLevels = ["master"]; // Default
      }

      // Map funding_type
      let fundingType: "fully_funded" | "partial" | "tuition_waiver" | "stipend_only" = "partial";
      if (raw.funding_type && VALID_FUNDING.has(raw.funding_type)) {
        fundingType = raw.funding_type as typeof fundingType;
      } else if (
        raw.award_amount &&
        (raw.award_amount.toLowerCase().includes("full") ||
          raw.award_amount.toLowerCase().includes("100%"))
      ) {
        fundingType = "fully_funded";
      }

      // Build search text
      const searchText = [raw.title, raw.description, raw.provider_organization, raw.host_country]
        .filter(Boolean)
        .join(" ")
        .slice(0, 1000);

      const scholarshipId = await ctx.db.insert("scholarships", {
        title: raw.title.trim(),
        slug,
        description: raw.description || undefined,
        provider_organization: raw.provider_organization || "Unknown",
        host_country: raw.host_country || "International",
        degree_levels: degreeLevels,
        funding_type: fundingType,
        application_url: raw.application_url || raw.source_url,
        application_deadline_text: raw.application_deadline || undefined,
        status: "published",
        source_ids: [raw.source_id],
        search_text: searchText,
        last_verified: Date.now(),
      });

      // Link raw_record back to canonical scholarship
      await ctx.db.patch(raw._id, { canonical_id: scholarshipId });
      promoted++;
    }

    return { promoted, skipped, remaining: unpromoted.length - promoted - skipped };
  },
});

/**
 * Demote published scholarships with missing important information to pending_review.
 * Checks for: missing description, application_url, slug, "Unknown" provider, "International" country.
 * Supports dryRun mode to preview what would be demoted without making changes.
 */
export const demoteIncompleteScholarships = mutation({
  args: {
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const isDryRun = args.dryRun ?? false;
    let checked = 0;
    let demoted = 0;
    const reasons: Record<string, number> = {};

    const published = await ctx.db
      .query("scholarships")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .take(500);

    for (const scholarship of published) {
      checked++;
      const missingFields: string[] = [];

      // Check description
      if (
        scholarship.description === undefined ||
        scholarship.description === null ||
        scholarship.description.trim() === ""
      ) {
        missingFields.push("description");
      }

      // Check application_url
      if (
        scholarship.application_url === undefined ||
        scholarship.application_url === null ||
        scholarship.application_url.trim() === ""
      ) {
        missingFields.push("application_url");
      }

      // Check slug
      if (
        scholarship.slug === undefined ||
        scholarship.slug === null ||
        scholarship.slug.trim() === ""
      ) {
        missingFields.push("slug");
      }

      // Check provider_organization fallback value
      if (scholarship.provider_organization === "Unknown") {
        missingFields.push("provider_organization");
      }

      // Check host_country fallback value
      if (scholarship.host_country === "International") {
        missingFields.push("host_country");
      }

      if (missingFields.length > 0) {
        // Tally each reason
        for (const field of missingFields) {
          reasons[field] = (reasons[field] ?? 0) + 1;
        }

        if (!isDryRun) {
          await ctx.db.patch(scholarship._id, {
            status: "pending_review",
            editorial_notes: `Auto-demoted: missing ${missingFields.join(", ")}`,
          });
        }
        demoted++;
      }
    }

    return { demoted, checked, reasons };
  },
});
