import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Get all published scholarship slugs with last-modified timestamps.
 * Used by sitemap generation to produce a complete URL list.
 */
export const getAllPublishedSlugs = query({
  handler: async (ctx) => {
    const scholarships = await ctx.db
      .query("scholarships")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();

    return scholarships.map((s) => ({
      slug: s.slug ?? s._id,
      lastModified: s.last_verified ?? s._creationTime,
    }));
  },
});

/**
 * Get aggregated stats for a country landing page.
 * Returns total count, fully funded count, unique degree levels,
 * top fields of study, and count of scholarships closing within 30 days.
 */
export const getCountryStats = query({
  args: { countryCode: v.string() },
  handler: async (ctx, { countryCode }) => {
    const scholarships = await ctx.db
      .query("scholarships")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();

    const countryScholarships = scholarships.filter(
      (s) => s.host_country === countryCode,
    );

    const total = countryScholarships.length;
    const fullyFunded = countryScholarships.filter(
      (s) => s.funding_type === "fully_funded",
    ).length;

    // Unique degree levels
    const degreeLevelSet = new Set<string>();
    for (const s of countryScholarships) {
      for (const dl of s.degree_levels) {
        degreeLevelSet.add(dl);
      }
    }
    const degreeLevels = [...degreeLevelSet];

    // Top 5 fields of study by frequency
    const fieldCounts: Record<string, number> = {};
    for (const s of countryScholarships) {
      if (s.fields_of_study) {
        for (const f of s.fields_of_study) {
          fieldCounts[f] = (fieldCounts[f] ?? 0) + 1;
        }
      }
    }
    const topFields = Object.entries(fieldCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([field]) => field);

    // Closing within 30 days
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const closingSoon = countryScholarships.filter(
      (s) =>
        s.application_deadline &&
        s.application_deadline > now &&
        s.application_deadline < now + thirtyDays,
    ).length;

    return { total, fullyFunded, degreeLevels, topFields, closingSoon };
  },
});

/**
 * Get aggregated stats for a degree landing page.
 * Returns total count, fully funded count, top countries, and top fields.
 */
export const getDegreeStats = query({
  args: { degreeLevel: v.string() },
  handler: async (ctx, { degreeLevel }) => {
    const scholarships = await ctx.db
      .query("scholarships")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();

    const degreeScholarships = scholarships.filter((s) =>
      s.degree_levels.includes(degreeLevel as "bachelor" | "master" | "phd" | "postdoc"),
    );

    const total = degreeScholarships.length;
    const fullyFunded = degreeScholarships.filter(
      (s) => s.funding_type === "fully_funded",
    ).length;

    // Top 5 countries by frequency
    const countryCounts: Record<string, number> = {};
    for (const s of degreeScholarships) {
      countryCounts[s.host_country] =
        (countryCounts[s.host_country] ?? 0) + 1;
    }
    const topCountries = Object.entries(countryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([country]) => country);

    // Top 5 fields of study
    const fieldCounts: Record<string, number> = {};
    for (const s of degreeScholarships) {
      if (s.fields_of_study) {
        for (const f of s.fields_of_study) {
          fieldCounts[f] = (fieldCounts[f] ?? 0) + 1;
        }
      }
    }
    const topFields = Object.entries(fieldCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([field]) => field);

    return { total, fullyFunded, topCountries, topFields };
  },
});

/**
 * Get top 20 countries by published scholarship count.
 * Used for sitemap and cross-linking between country pages.
 */
export const getTopCountries = query({
  handler: async (ctx) => {
    const scholarships = await ctx.db
      .query("scholarships")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();

    const countryCounts: Record<string, number> = {};
    for (const s of scholarships) {
      countryCounts[s.host_country] =
        (countryCounts[s.host_country] ?? 0) + 1;
    }

    return Object.entries(countryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([code, count]) => ({ code, count }));
  },
});

/**
 * Get all unique degree levels with counts from published scholarships.
 * Used for sitemap and cross-linking between degree pages.
 */
export const getAllDegrees = query({
  handler: async (ctx) => {
    const scholarships = await ctx.db
      .query("scholarships")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();

    const degreeCounts: Record<string, number> = {};
    for (const s of scholarships) {
      for (const dl of s.degree_levels) {
        degreeCounts[dl] = (degreeCounts[dl] ?? 0) + 1;
      }
    }

    return Object.entries(degreeCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([level, count]) => ({ level, count }));
  },
});
