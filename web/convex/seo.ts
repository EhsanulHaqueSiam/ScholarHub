import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

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

type CountryStats = {
  total: number;
  fullyFunded: number;
  degreeLevels: string[];
  topFields: string[];
  closingSoon: number;
};

type DegreeStats = {
  total: number;
  fullyFunded: number;
  topCountries: string[];
  topFields: string[];
};

type Taxonomies = {
  topCountries: Array<{ code: string; count: number }>;
  allDegrees: Array<{ level: string; count: number }>;
};

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const SEO_CACHE_KEY = "global";
const SEO_CACHE_HARD_TTL_MS = 36 * 60 * 60 * 1000;
const SEO_REFRESH_LOCK_NAME = "seo.refreshSeoCaches";
const SEO_REFRESH_LOCK_LEASE_MS = 3 * 60 * 1000;

function isCacheUsable(updatedAt: number | undefined): boolean {
  if (!updatedAt) return false;
  return Date.now() - updatedAt <= SEO_CACHE_HARD_TTL_MS;
}

async function getPublishedScholarships(ctx: { db: any }): Promise<LandingScholarship[]> {
  const scholarships: LandingScholarship[] = [];
  let cursor: string | null = null;

  while (true) {
    const page = await ctx.db
      .query("scholarships")
      .withIndex("by_status", (q: any) => q.eq("status", "published"))
      .paginate({ cursor, numItems: 256 });

    scholarships.push(...(page.page as LandingScholarship[]));
    if (page.isDone) break;
    cursor = page.continueCursor;
  }

  return scholarships;
}

async function getCountryScholarships(
  ctx: { db: any },
  countryCode: string,
): Promise<LandingScholarship[]> {
  return await ctx.db
    .query("scholarships")
    .withIndex("by_country_status", (q: any) =>
      q.eq("host_country", countryCode).eq("status", "published"),
    )
    .collect();
}

function computeTaxonomies(scholarships: LandingScholarship[]): Taxonomies {
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

function computeCountryStats(countryScholarships: LandingScholarship[]): CountryStats {
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

function computeDegreeStats(scholarships: LandingScholarship[], degreeLevel: string): DegreeStats {
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

function countryStatsFromCache(doc: any): CountryStats {
  return {
    total: doc.total,
    fullyFunded: doc.fully_funded,
    degreeLevels: doc.degree_levels,
    topFields: doc.top_fields,
    closingSoon: doc.closing_soon,
  };
}

function degreeStatsFromCache(doc: any): DegreeStats {
  return {
    total: doc.total,
    fullyFunded: doc.fully_funded,
    topCountries: doc.top_countries,
    topFields: doc.top_fields,
  };
}

function taxonomiesFromCache(doc: any): Taxonomies {
  return {
    topCountries: doc.top_countries,
    allDegrees: doc.all_degrees,
  };
}

async function getTaxonomyCacheDoc(ctx: { db: any }) {
  return await ctx.db
    .query("seo_taxonomy_cache")
    .withIndex("by_key", (q: any) => q.eq("key", SEO_CACHE_KEY))
    .first();
}

async function acquireSeoRefreshLock(
  ctx: any,
  owner: string,
): Promise<{ acquired: boolean; lockId?: any }> {
  const now = Date.now();
  const existing = await ctx.db
    .query("pipeline_locks")
    .withIndex("by_name", (q: any) => q.eq("name", SEO_REFRESH_LOCK_NAME))
    .first();

  if (!existing) {
    const lockId = await ctx.db.insert("pipeline_locks", {
      name: SEO_REFRESH_LOCK_NAME,
      owner,
      lease_expires_at: now + SEO_REFRESH_LOCK_LEASE_MS,
      updated_at: now,
    });
    return { acquired: true, lockId };
  }

  if (existing.lease_expires_at > now && existing.owner !== owner) {
    return { acquired: false, lockId: existing._id };
  }

  await ctx.db.patch(existing._id, {
    owner,
    lease_expires_at: now + SEO_REFRESH_LOCK_LEASE_MS,
    updated_at: now,
  });

  return { acquired: true, lockId: existing._id };
}

async function releaseSeoRefreshLock(ctx: any, lockId: any, owner: string): Promise<void> {
  if (!lockId) return;
  const existing = await ctx.db.get(lockId);
  if (!existing || existing.owner !== owner) return;
  await ctx.db.patch(lockId, {
    lease_expires_at: 0,
    updated_at: Date.now(),
  });
}

/**
 * Recompute and upsert all SEO cache tables in one pass.
 * Triggered by cron + scrape completion hooks.
 */
export const refreshSeoCaches = internalMutation({
  args: {},
  handler: async (ctx) => {
    const owner = `seo-refresh:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
    const lock = await acquireSeoRefreshLock(ctx, owner);
    if (!lock.acquired) {
      return { skipped: true, reason: "lock_busy" as const };
    }

    try {
      const scholarships = await getPublishedScholarships(ctx);
      const now = Date.now();

      const countryCounts: Record<string, number> = {};
      const degreeCounts: Record<string, number> = {};

      const countryAggByCode = new Map<
        string,
        {
          total: number;
          fullyFunded: number;
          degreeLevels: Set<string>;
          fieldCounts: Map<string, number>;
          closingSoon: number;
        }
      >();

      const degreeAggByLevel = new Map<
        string,
        {
          total: number;
          fullyFunded: number;
          countryCounts: Map<string, number>;
          fieldCounts: Map<string, number>;
        }
      >();

      for (const scholarship of scholarships) {
        countryCounts[scholarship.host_country] = (countryCounts[scholarship.host_country] ?? 0) + 1;

        let countryAgg = countryAggByCode.get(scholarship.host_country);
        if (!countryAgg) {
          countryAgg = {
            total: 0,
            fullyFunded: 0,
            degreeLevels: new Set<string>(),
            fieldCounts: new Map<string, number>(),
            closingSoon: 0,
          };
          countryAggByCode.set(scholarship.host_country, countryAgg);
        }

        countryAgg.total += 1;
        if (scholarship.funding_type === "fully_funded") countryAgg.fullyFunded += 1;
        for (const dl of scholarship.degree_levels) {
          countryAgg.degreeLevels.add(dl);
          degreeCounts[dl] = (degreeCounts[dl] ?? 0) + 1;

          let degreeAgg = degreeAggByLevel.get(dl);
          if (!degreeAgg) {
            degreeAgg = {
              total: 0,
              fullyFunded: 0,
              countryCounts: new Map<string, number>(),
              fieldCounts: new Map<string, number>(),
            };
            degreeAggByLevel.set(dl, degreeAgg);
          }

          degreeAgg.total += 1;
          if (scholarship.funding_type === "fully_funded") degreeAgg.fullyFunded += 1;
          degreeAgg.countryCounts.set(
            scholarship.host_country,
            (degreeAgg.countryCounts.get(scholarship.host_country) ?? 0) + 1,
          );

          for (const f of scholarship.fields_of_study ?? []) {
            degreeAgg.fieldCounts.set(f, (degreeAgg.fieldCounts.get(f) ?? 0) + 1);
          }
        }

        for (const f of scholarship.fields_of_study ?? []) {
          countryAgg.fieldCounts.set(f, (countryAgg.fieldCounts.get(f) ?? 0) + 1);
        }

        if (
          scholarship.application_deadline &&
          scholarship.application_deadline > now &&
          scholarship.application_deadline < now + THIRTY_DAYS_MS
        ) {
          countryAgg.closingSoon += 1;
        }
      }

      const topCountries = Object.entries(countryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([code, count]) => ({ code, count }));

      const allDegrees = Object.entries(degreeCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([level, count]) => ({ level, count }));

      const existingTaxonomy = await getTaxonomyCacheDoc(ctx);
      if (existingTaxonomy) {
        await ctx.db.patch(existingTaxonomy._id, {
          top_countries: topCountries,
          all_degrees: allDegrees,
          updated_at: now,
        });
      } else {
        await ctx.db.insert("seo_taxonomy_cache", {
          key: SEO_CACHE_KEY,
          top_countries: topCountries,
          all_degrees: allDegrees,
          updated_at: now,
        });
      }

      const existingCountryDocs = await ctx.db.query("seo_country_cache").collect();
      const existingCountryByCode = new Map(existingCountryDocs.map((doc: any) => [doc.country_code, doc]));
      const seenCountries = new Set<string>();

      for (const [countryCode, agg] of countryAggByCode) {
        seenCountries.add(countryCode);

        const topFields = [...agg.fieldCounts.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([field]) => field);

        const payload = {
          country_code: countryCode,
          total: agg.total,
          fully_funded: agg.fullyFunded,
          degree_levels: [...agg.degreeLevels].sort(),
          top_fields: topFields,
          closing_soon: agg.closingSoon,
          updated_at: now,
        };

        const existing = existingCountryByCode.get(countryCode);
        if (existing) {
          await ctx.db.patch(existing._id, payload);
        } else {
          await ctx.db.insert("seo_country_cache", payload);
        }
      }

      for (const existing of existingCountryDocs) {
        if (!seenCountries.has(existing.country_code)) {
          await ctx.db.delete(existing._id);
        }
      }

      const existingDegreeDocs = await ctx.db.query("seo_degree_cache").collect();
      const existingDegreeByLevel = new Map(existingDegreeDocs.map((doc: any) => [doc.degree_level, doc]));
      const seenDegrees = new Set<string>();

      for (const [degreeLevel, agg] of degreeAggByLevel) {
        seenDegrees.add(degreeLevel);

        const topCountriesForDegree = [...agg.countryCounts.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([country]) => country);

        const topFields = [...agg.fieldCounts.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([field]) => field);

        const payload = {
          degree_level: degreeLevel,
          total: agg.total,
          fully_funded: agg.fullyFunded,
          top_countries: topCountriesForDegree,
          top_fields: topFields,
          updated_at: now,
        };

        const existing = existingDegreeByLevel.get(degreeLevel);
        if (existing) {
          await ctx.db.patch(existing._id, payload);
        } else {
          await ctx.db.insert("seo_degree_cache", payload);
        }
      }

      for (const existing of existingDegreeDocs) {
        if (!seenDegrees.has(existing.degree_level)) {
          await ctx.db.delete(existing._id);
        }
      }

      return {
        skipped: false,
        published: scholarships.length,
        countries: countryAggByCode.size,
        degrees: degreeAggByLevel.size,
      };
    } finally {
      await releaseSeoRefreshLock(ctx, lock.lockId, owner);
    }
  },
});

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

    const taxonomyCache = await getTaxonomyCacheDoc(ctx);
    const taxonomies =
      taxonomyCache && isCacheUsable(taxonomyCache.updated_at)
        ? taxonomiesFromCache(taxonomyCache)
        : computeTaxonomies(scholarships);

    const slugs = scholarships.map((s) => ({
      slug: s.slug ?? s._id,
      lastModified: s.last_verified ?? s._creationTime,
    }));

    return {
      slugs,
      topCountries: taxonomies.topCountries,
      allDegrees: taxonomies.allDegrees,
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
    const cached = await ctx.db
      .query("seo_country_cache")
      .withIndex("by_country_code", (q: any) => q.eq("country_code", countryCode))
      .first();

    if (cached && isCacheUsable(cached.updated_at)) {
      return countryStatsFromCache(cached);
    }

    return computeCountryStats(await getCountryScholarships(ctx, countryCode));
  },
});

/**
 * Get aggregated stats for a degree landing page.
 * Returns total count, fully funded count, top countries, and top fields.
 */
export const getDegreeStats = query({
  args: { degreeLevel: v.string() },
  handler: async (ctx, { degreeLevel }) => {
    const cached = await ctx.db
      .query("seo_degree_cache")
      .withIndex("by_degree_level", (q: any) => q.eq("degree_level", degreeLevel))
      .first();

    if (cached && isCacheUsable(cached.updated_at)) {
      return degreeStatsFromCache(cached);
    }

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
    const cached = await getTaxonomyCacheDoc(ctx);
    if (cached && isCacheUsable(cached.updated_at)) {
      return taxonomiesFromCache(cached);
    }

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
    const [countryCache, taxonomyCache] = await Promise.all([
      ctx.db
        .query("seo_country_cache")
        .withIndex("by_country_code", (q: any) => q.eq("country_code", countryCode))
        .first(),
      getTaxonomyCacheDoc(ctx),
    ]);

    const stats =
      countryCache && isCacheUsable(countryCache.updated_at)
        ? countryStatsFromCache(countryCache)
        : computeCountryStats(await getCountryScholarships(ctx, countryCode));

    let taxonomies: Taxonomies;
    if (taxonomyCache && isCacheUsable(taxonomyCache.updated_at)) {
      taxonomies = taxonomiesFromCache(taxonomyCache);
    } else {
      taxonomies = computeTaxonomies(await getPublishedScholarships(ctx));
    }

    return {
      stats,
      topCountries: taxonomies.topCountries,
      allDegrees: taxonomies.allDegrees,
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
    const [degreeCache, taxonomyCache] = await Promise.all([
      ctx.db
        .query("seo_degree_cache")
        .withIndex("by_degree_level", (q: any) => q.eq("degree_level", degreeLevel))
        .first(),
      getTaxonomyCacheDoc(ctx),
    ]);

    let stats: DegreeStats;
    if (degreeCache && isCacheUsable(degreeCache.updated_at)) {
      stats = degreeStatsFromCache(degreeCache);
    } else {
      stats = computeDegreeStats(await getPublishedScholarships(ctx), degreeLevel);
    }

    let taxonomies: Taxonomies;
    if (taxonomyCache && isCacheUsable(taxonomyCache.updated_at)) {
      taxonomies = taxonomiesFromCache(taxonomyCache);
    } else {
      taxonomies = computeTaxonomies(await getPublishedScholarships(ctx));
    }

    return {
      stats,
      topCountries: taxonomies.topCountries,
      allDegrees: taxonomies.allDegrees,
    };
  },
});

/**
 * Get top 20 countries by published scholarship count.
 * Used for sitemap and cross-linking between country pages.
 */
export const getTopCountries = query({
  handler: async (ctx) => {
    const cached = await getTaxonomyCacheDoc(ctx);
    if (cached && isCacheUsable(cached.updated_at)) {
      return cached.top_countries;
    }

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
    const cached = await getTaxonomyCacheDoc(ctx);
    if (cached && isCacheUsable(cached.updated_at)) {
      return cached.all_degrees;
    }

    const scholarships = await getPublishedScholarships(ctx);
    return computeTaxonomies(scholarships).allDegrees;
  },
});
