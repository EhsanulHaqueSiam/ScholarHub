import { v } from "convex/values";
import type { QueryCtx } from "./_generated/server";
import { query } from "./_generated/server";

type LandingScholarship = {
  _id: string;
  _creationTime: number;
  slug?: string;
  last_verified?: number;
  host_country: string;
  degree_levels: string[];
  fields_of_study?: string[] | null;
  funding_type: string;
  application_deadline?: number | null;
};

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

async function getPublishedScholarships(ctx: QueryCtx): Promise<LandingScholarship[]> {
  return await ctx.db
    .query("scholarships")
    .withIndex("by_status", (q) => q.eq("status", "published"))
    .collect();
}

function computeTaxonomies(scholarships: LandingScholarship[]) {
  const countryCounts: Record<string, number> = {};
  const degreeCounts: Record<string, number> = {};

  for (const s of scholarships) {
    countryCounts[s.host_country] = (countryCounts[s.host_country] ?? 0) + 1;
    for (const dl of s.degree_levels) {
      degreeCounts[dl] = (degreeCounts[dl] ?? 0) + 1;
    }
  }

  const topCountries = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([code, count]) => ({ code, count }));

  const allDegrees = Object.entries(degreeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([level, count]) => ({ level, count }));

  return { topCountries, allDegrees };
}

function computeCountryStats(countryScholarships: LandingScholarship[]) {
  const total = countryScholarships.length;
  const fullyFunded = countryScholarships.filter((s) => s.funding_type === "fully_funded").length;

  const degreeLevelSet = new Set<string>();
  for (const s of countryScholarships) {
    for (const dl of s.degree_levels) {
      degreeLevelSet.add(dl);
    }
  }
  const degreeLevels = [...degreeLevelSet];

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

  const now = Date.now();
  const closingSoon = countryScholarships.filter(
    (s) => s.application_deadline && s.application_deadline > now && s.application_deadline < now + THIRTY_DAYS_MS,
  ).length;

  return { total, fullyFunded, degreeLevels, topFields, closingSoon };
}

function computeDegreeStats(scholarships: LandingScholarship[], degreeLevel: string) {
  const degreeScholarships = scholarships.filter((s) => s.degree_levels.includes(degreeLevel));

  const total = degreeScholarships.length;
  const fullyFunded = degreeScholarships.filter((s) => s.funding_type === "fully_funded").length;

  const countryCounts: Record<string, number> = {};
  for (const s of degreeScholarships) {
    countryCounts[s.host_country] = (countryCounts[s.host_country] ?? 0) + 1;
  }
  const topCountries = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([country]) => country);

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
}

/**
 * Get all published scholarship slugs with last-modified timestamps.
 * Used by sitemap generation to produce a complete URL list.
 */
export const getAllPublishedSlugs = query({
  handler: async (ctx) => {
    const scholarships = await getPublishedScholarships(ctx);

    return scholarships.map((s) => ({
      slug: s.slug ?? s._id,
      lastModified: s.last_verified ?? s._creationTime,
    }));
  },
});

/**
 * Get all sitemap data in one query call.
 * Includes published slugs plus landing taxonomies to minimize Convex call count.
 */
export const getSitemapData = query({
  handler: async (ctx) => {
    const scholarships = await getPublishedScholarships(ctx);
    const { topCountries, allDegrees } = computeTaxonomies(scholarships);

    const slugs = scholarships.map((s) => ({
      slug: s.slug ?? s._id,
      lastModified: s.last_verified ?? s._creationTime,
    }));

    return {
      slugs,
      topCountries,
      allDegrees,
    };
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
    const countryScholarships = await ctx.db
      .query("scholarships")
      .withIndex("by_country_status", (q) => q.eq("host_country", countryCode).eq("status", "published"))
      .collect();

    return computeCountryStats(countryScholarships);
  },
});

/**
 * Get aggregated stats for a degree landing page.
 * Returns total count, fully funded count, top countries, and top fields.
 */
export const getDegreeStats = query({
  args: { degreeLevel: v.string() },
  handler: async (ctx, { degreeLevel }) => {
    const scholarships = await getPublishedScholarships(ctx);
    return computeDegreeStats(scholarships, degreeLevel);
  },
});

/**
 * Get shared taxonomies for landing pages: top countries and all degree levels.
 * Used to avoid two separate Convex queries on SEO landing pages and sitemap generation.
 */
export const getLandingTaxonomies = query({
  handler: async (ctx) => {
    const scholarships = await getPublishedScholarships(ctx);
    return computeTaxonomies(scholarships);
  },
});

/**
 * Get all country landing page data in one query call.
 * Combines country stats with shared cross-link taxonomies.
 */
export const getCountryLandingData = query({
  args: { countryCode: v.string() },
  handler: async (ctx, { countryCode }) => {
    const [countryScholarships, scholarships] = await Promise.all([
      ctx.db
        .query("scholarships")
        .withIndex("by_country_status", (q) =>
          q.eq("host_country", countryCode).eq("status", "published"),
        )
        .collect(),
      getPublishedScholarships(ctx),
    ]);

    const { topCountries, allDegrees } = computeTaxonomies(scholarships);
    return {
      stats: computeCountryStats(countryScholarships),
      topCountries,
      allDegrees,
    };
  },
});

/**
 * Get all degree landing page data in one query call.
 * Combines degree stats with shared cross-link taxonomies.
 */
export const getDegreeLandingData = query({
  args: { degreeLevel: v.string() },
  handler: async (ctx, { degreeLevel }) => {
    const scholarships = await getPublishedScholarships(ctx);
    const { topCountries, allDegrees } = computeTaxonomies(scholarships);
    return {
      stats: computeDegreeStats(scholarships, degreeLevel),
      topCountries,
      allDegrees,
    };
  },
});

/**
 * Get top 20 countries by published scholarship count.
 * Used for sitemap and cross-linking between country pages.
 */
export const getTopCountries = query({
  handler: async (ctx) => {
    const scholarships = await getPublishedScholarships(ctx);
    return computeTaxonomies(scholarships).topCountries;
  },
});

/**
 * Get all unique degree levels with counts from published scholarships.
 * Used for sitemap and cross-linking between degree pages.
 */
export const getAllDegrees = query({
  handler: async (ctx) => {
    const scholarships = await getPublishedScholarships(ctx);
    return computeTaxonomies(scholarships).allDegrees;
  },
});
