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
    const existing = await ctx.db
      .query("sources")
      .withIndex("by_url", (q) => q.eq("url", args.url))
      .first();

    const data = {
      ...args,
      trust_level: args.trust_level ?? ("needs_review" as const),
      auth_required: args.auth_required ?? false,
      has_api: args.has_api ?? false,
      consecutive_failures: 0,
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    }
    return await ctx.db.insert("sources", data);
  },
});
