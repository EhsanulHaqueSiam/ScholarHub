import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { scrapeMethodValidator, sourceCategoryValidator, trustLevelValidator } from "./schema";

export const getByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sources")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
  },
});

export const getByUrl = query({
  args: { url: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sources")
      .withIndex("by_url", (q) => q.eq("url", args.url))
      .first();
  },
});

export const resetLastScraped = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const source = await ctx.db
      .query("sources")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
    if (source) {
      await ctx.db.patch(source._id, { last_scraped: undefined });
    }
  },
});

export const upsertSource = mutation({
  args: {
    name: v.string(),
    url: v.string(),
    category: sourceCategoryValidator,
    scrape_method: scrapeMethodValidator,
    trust_level: v.optional(trustLevelValidator),
    scrape_frequency_hours: v.number(),
    wave: v.number(),
    is_active: v.boolean(),
    auth_required: v.optional(v.boolean()),
    has_api: v.optional(v.boolean()),
    estimated_volume: v.optional(v.string()),
    geographic_coverage: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Prefer name-based upsert to keep stable source IDs when URLs change.
    const existingByName = await ctx.db
      .query("sources")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    const existingByUrl = existingByName
      ? null
      : await ctx.db
          .query("sources")
          .withIndex("by_url", (q) => q.eq("url", args.url))
          .first();

    const existing = existingByName ?? existingByUrl;
    const baseData = {
      ...args,
      trust_level: args.trust_level ?? ("needs_review" as const),
      auth_required: args.auth_required ?? false,
      has_api: args.has_api ?? false,
    };

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...baseData,
        // Preserve health continuity across catalog refreshes.
        consecutive_failures: existing.consecutive_failures ?? 0,
      });
      return existing._id;
    }

    return await ctx.db.insert("sources", {
      ...baseData,
      consecutive_failures: 0,
    });
  },
});

/**
 * Reactivate a source after URL/config fixes.
 * Resets failure streak and health status so scheduler can pick it up again.
 */
export const reactivateSource = mutation({
  args: {
    source_id: v.id("sources"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.source_id, {
      is_active: true,
      consecutive_failures: 0,
    });

    const health = await ctx.db
      .query("source_health")
      .withIndex("by_source", (q) => q.eq("source_id", args.source_id))
      .first();

    const now = Date.now();
    if (health) {
      await ctx.db.patch(health._id, {
        status: "healthy",
        consecutive_failures: 0,
        deactivation_reason: undefined,
        last_failure: undefined,
        last_error_type: undefined,
        last_error_message: undefined,
        last_success: health.last_success ?? now,
      });
    } else {
      await ctx.db.insert("source_health", {
        source_id: args.source_id,
        status: "healthy",
        consecutive_failures: 0,
        last_success: now,
      });
    }
  },
});
