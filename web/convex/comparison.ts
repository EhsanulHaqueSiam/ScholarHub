/**
 * Scholarship comparison batch query.
 *
 * Single Convex query for fetching 1-3 scholarships by slug
 * for the side-by-side comparison page.
 * Returns full scholarship docs with resolved source attribution.
 */

import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Get 1-3 scholarships for comparison, each with resolved sources.
 * Single round-trip query per D-65/D-94.
 */
export const getComparisonScholarships = query({
  args: {
    slugs: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.slugs.length === 0 || args.slugs.length > 3) {
      throw new Error("Compare requires 1-3 scholarship slugs");
    }

    const results = await Promise.all(
      args.slugs.map(async (slug) => {
        const scholarship = await ctx.db
          .query("scholarships")
          .withIndex("by_slug", (q) => q.eq("slug", slug))
          .first();

        if (!scholarship) return null;

        // Resolve source_ids to source name + URL for attribution
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

    return results.filter((r): r is NonNullable<typeof r> => r !== null);
  },
});
