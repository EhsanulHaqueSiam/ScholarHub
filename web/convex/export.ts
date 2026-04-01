/**
 * Bulk export queries for static JSON generation.
 *
 * Split into separate queries to stay under Convex's 1024-field return limit.
 * The export script calls these sequentially (3 calls total).
 */

import { v } from "convex/values";
import { query } from "./_generated/server";
import { toScholarshipSummary } from "./scholarshipSummary";

const EXPORT_SCAN_CAP = 8000;

/**
 * Export published scholarships in pages (avoids field-count limit).
 * Call with page=0, page=1, etc. until result.hasMore is false.
 */
export const getScholarshipsPage = query({
  args: { page: v.number() },
  handler: async (ctx, { page }) => {
    const PAGE_SIZE = 200;
    const offset = page * PAGE_SIZE;

    const published = await ctx.db
      .query("scholarships")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .take(offset + PAGE_SIZE);

    const slice = published.slice(offset, offset + PAGE_SIZE);

    // Resolve sources for this page
    const sourceIds = new Set<string>();
    for (const s of slice) {
      for (const id of s.source_ids) sourceIds.add(String(id));
    }
    const sourceMap: Record<string, { name: string; url: string }> = {};
    for (const id of sourceIds) {
      const source = await ctx.db.get(id as any);
      if (source) sourceMap[id] = { name: source.name, url: source.url };
    }

    const scholarships = slice.map((s) => ({
      ...s,
      resolved_sources: s.source_ids
        .map((id) => sourceMap[String(id)])
        .filter(Boolean),
    }));

    const summaries = slice.map((s) => toScholarshipSummary(s));

    return {
      scholarships,
      summaries,
      hasMore: slice.length === PAGE_SIZE,
    };
  },
});

/**
 * Export collections + SEO caches (small, fits in one call).
 */
export const getMetadata = query({
  args: {},
  handler: async (ctx) => {
    const collections = await ctx.db
      .query("collections")
      .withIndex("by_sort_order", (q) => q.eq("status", "active"))
      .take(200);

    const taxonomyCache = await ctx.db
      .query("seo_taxonomy_cache")
      .withIndex("by_key", (q: any) => q.eq("key", "global"))
      .first();

    const countryCaches = await ctx.db.query("seo_country_cache").take(200);
    const degreeCaches = await ctx.db.query("seo_degree_cache").take(50);

    return {
      collections: collections.map((c) => ({
        _id: c._id,
        name: c.name,
        slug: c.slug,
        emoji: c.emoji,
        description: c.description,
        status: c.status,
        is_featured: c.is_featured,
        sort_order: c.sort_order,
        default_sort: c.default_sort,
        scholarship_count: c.scholarship_count,
        host_countries: c.host_countries,
        degree_levels: c.degree_levels,
        funding_types: c.funding_types,
        prestige_tiers: c.prestige_tiers,
        tags: c.tags,
        fields_of_study: c.fields_of_study,
        deadline_before: c.deadline_before,
        deadline_after: c.deadline_after,
        added_since: c.added_since,
      })),
      taxonomy: taxonomyCache
        ? {
            topCountries: taxonomyCache.top_countries,
            allDegrees: taxonomyCache.all_degrees,
          }
        : { topCountries: [], allDegrees: [] },
      countryCaches: countryCaches.map((c) => ({
        code: c.country_code,
        total: c.total,
        fullyFunded: c.fully_funded,
        degreeLevels: c.degree_levels,
        topFields: c.top_fields,
        closingSoon: c.closing_soon,
      })),
      degreeCaches: degreeCaches.map((c) => ({
        level: c.degree_level,
        total: c.total,
        fullyFunded: c.fully_funded,
        topCountries: c.top_countries,
        topFields: c.top_fields,
      })),
    };
  },
});
