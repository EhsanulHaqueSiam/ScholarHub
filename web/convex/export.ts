/**
 * Single bulk export query for static JSON generation.
 *
 * Returns ALL public-facing data in one Convex call so the build-time
 * export script only needs 1 function call total. The exported JSON
 * replaces ~20 useQuery hooks on public pages.
 */

import { query } from "./_generated/server";
import { toScholarshipSummary } from "./scholarshipSummary";

const EXPORT_SCAN_CAP = 8000;

export const getAllPublicData = query({
  args: {},
  handler: async (ctx) => {
    // 1. All published scholarships (full documents for detail pages + summaries for lists)
    const published = await ctx.db
      .query("scholarships")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .take(EXPORT_SCAN_CAP);

    // 2. All active collections
    const collections = await ctx.db
      .query("collections")
      .withIndex("by_sort_order", (q) => q.eq("status", "active"))
      .collect();

    // 3. SEO taxonomy cache
    const taxonomyCache = await ctx.db
      .query("seo_taxonomy_cache")
      .withIndex("by_key", (q: any) => q.eq("key", "global"))
      .first();

    // 4. Country caches
    const countryCaches = await ctx.db.query("seo_country_cache").collect();

    // 5. Degree caches
    const degreeCaches = await ctx.db.query("seo_degree_cache").collect();

    // 6. Resolve sources for attribution (lean: just name + url)
    const sourceIds = new Set<string>();
    for (const s of published) {
      for (const id of s.source_ids) {
        sourceIds.add(String(id));
      }
    }
    const sourceMap: Record<string, { name: string; url: string }> = {};
    for (const id of sourceIds) {
      const source = await ctx.db.get(id as any);
      if (source) {
        sourceMap[id] = { name: source.name, url: source.url };
      }
    }

    // Build scholarship detail records (full data for slug-based lookup)
    const scholarshipDetails = published.map((s) => ({
      ...s,
      resolved_sources: s.source_ids
        .map((id) => sourceMap[String(id)])
        .filter(Boolean),
    }));

    // Build summaries for list pages
    const summaries = published.map((s) => toScholarshipSummary(s));

    // Build slug index for O(1) detail lookup
    const slugIndex: Record<string, number> = {};
    for (let i = 0; i < published.length; i++) {
      const slug = published[i].slug;
      if (slug) slugIndex[slug] = i;
    }

    return {
      scholarships: scholarshipDetails,
      summaries,
      slugIndex,
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
      countryCaches: Object.fromEntries(
        countryCaches.map((c) => [
          c.country_code,
          {
            total: c.total,
            fullyFunded: c.fully_funded,
            degreeLevels: c.degree_levels,
            topFields: c.top_fields,
            closingSoon: c.closing_soon,
          },
        ]),
      ),
      degreeCaches: Object.fromEntries(
        degreeCaches.map((c) => [
          c.degree_level,
          {
            total: c.total,
            fullyFunded: c.fully_funded,
            topCountries: c.top_countries,
            topFields: c.top_fields,
          },
        ]),
      ),
      exportedAt: Date.now(),
    };
  },
});
