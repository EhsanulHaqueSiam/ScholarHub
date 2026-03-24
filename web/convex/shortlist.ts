import { v } from "convex/values";
import { query } from "./_generated/server";

export const suggestUniversities = query({
  args: { search: v.string() },
  handler: async (ctx, { search }) => {
    const term = search.trim();
    if (term.length < 2) return [];

    const results = await ctx.db
      .query("scholarships")
      .withSearchIndex("search_scholarships", (q) =>
        q.search("search_text", term).eq("status", "published"),
      )
      .take(200);

    const termLower = term.toLowerCase();
    const providers = new Map<string, { name: string; count: number; countries: string[] }>();

    for (const s of results) {
      const provider = s.provider_organization;
      if (!provider.toLowerCase().includes(termLower)) continue;

      const key = provider.toLowerCase();
      const existing = providers.get(key);
      if (existing) {
        existing.count++;
        if (s.host_country && !existing.countries.includes(s.host_country)) {
          existing.countries.push(s.host_country);
        }
      } else {
        providers.set(key, {
          name: provider,
          count: 1,
          countries: s.host_country ? [s.host_country] : [],
        });
      }
    }

    return Array.from(providers.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  },
});

export const countryScholarshipCounts = query({
  handler: async (ctx) => {
    const caches = await ctx.db.query("seo_country_cache").collect();
    const counts: Record<string, number> = {};
    for (const c of caches) {
      counts[c.country_code] = c.total;
    }
    return counts;
  },
});
