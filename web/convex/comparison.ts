import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Get full scholarship documents for side-by-side comparison.
 * Accepts an array of slugs and returns scholarship docs with resolved sources.
 * Used by /scholarships/compare route.
 */
export const getComparisonScholarships = query({
  args: { slugs: v.array(v.string()) },
  handler: async (ctx, args) => {
    if (args.slugs.length === 0) return [];

    const results = await Promise.all(
      args.slugs.slice(0, 3).map(async (slug) => {
        const scholarship = await ctx.db
          .query("scholarships")
          .withIndex("by_slug", (q) => q.eq("slug", slug))
          .first();

        if (!scholarship) return null;

        // Resolve source names for attribution
        const resolved_sources = await Promise.all(
          scholarship.source_ids.map(async (sourceId) => {
            const source = await ctx.db.get(sourceId);
            return source ? { name: source.name, url: source.url } : null;
          }),
        );

        return {
          ...scholarship,
          resolved_sources: resolved_sources.filter(
            (s): s is { name: string; url: string } => s !== null,
          ),
        };
      }),
    );

    return results.filter((r) => r !== null);
  },
});
