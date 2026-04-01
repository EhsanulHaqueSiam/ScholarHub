/**
 * Static data loader for the scholarship directory.
 *
 * Loads pre-exported JSON data instead of querying Convex on every page load.
 * Falls back gracefully if the JSON hasn't been generated yet.
 *
 * This eliminates ~20 useQuery hooks on public pages, reducing Convex
 * function calls to near-zero for reads.
 */

import type { ScholarshipSummary } from "./scholarship-summary";

// The JSON is imported as a static module (tree-shaken by Vite in production)
let _cachedData: StaticData | null = null;
let _loadPromise: Promise<StaticData> | null = null;

export interface StaticData {
  scholarships: any[];
  summaries: ScholarshipSummary[];
  slugIndex: Record<string, number>;
  collections: StaticCollection[];
  taxonomy: {
    topCountries: Array<{ code: string; count: number }>;
    allDegrees: Array<{ level: string; count: number }>;
  };
  countryCaches: Record<
    string,
    {
      total: number;
      fullyFunded: number;
      degreeLevels: string[];
      topFields: string[];
      closingSoon: number;
    }
  >;
  degreeCaches: Record<
    string,
    {
      total: number;
      fullyFunded: number;
      topCountries: string[];
      topFields: string[];
    }
  >;
  exportedAt: number;
}

export interface StaticCollection {
  _id: string;
  name: string;
  slug: string;
  emoji: string;
  description?: string;
  status: string;
  is_featured: boolean;
  sort_order: number;
  default_sort?: string;
  scholarship_count: number;
  host_countries?: string[];
  degree_levels?: string[];
  funding_types?: string[];
  prestige_tiers?: string[];
  tags?: string[];
  fields_of_study?: string[];
  deadline_before?: number;
  deadline_after?: number;
  added_since?: number;
}

/**
 * Load static data (cached after first call).
 * Returns null if data hasn't been exported yet.
 */
export async function loadStaticData(): Promise<StaticData | null> {
  if (_cachedData) return _cachedData;
  if (_loadPromise) return _loadPromise;

  _loadPromise = (async () => {
    try {
      const mod = await import("../data/scholarships.json");
      _cachedData = mod.default as StaticData;
      return _cachedData;
    } catch {
      // JSON not generated yet — app will fall back to Convex queries
      return null;
    }
  })();

  return _loadPromise;
}

/**
 * Synchronously get cached data (returns null if not yet loaded).
 */
export function getStaticData(): StaticData | null {
  return _cachedData;
}

/**
 * Check if static data is available and not stale (>7 days old).
 */
export function isStaticDataFresh(): boolean {
  if (!_cachedData) return false;
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  return Date.now() - _cachedData.exportedAt < sevenDays;
}

// ---- Query helpers (replace Convex useQuery calls) ----

/** Get scholarship detail by slug */
export function getScholarshipBySlug(data: StaticData, slug: string): any | null {
  const idx = data.slugIndex[slug];
  if (idx === undefined) return null;
  return data.scholarships[idx] ?? null;
}

/** Get featured scholarships (gold/silver tier, non-expired) */
export function getFeaturedScholarships(
  data: StaticData,
  limit = 6,
  nationalities?: string[],
): ScholarshipSummary[] {
  const now = Date.now();
  let candidates = data.summaries.filter(
    (s) =>
      (s.prestige_tier === "gold" || s.prestige_tier === "silver") &&
      (!s.application_deadline || s.application_deadline > now),
  );

  if (nationalities && nationalities.length > 0) {
    const eligible = candidates.filter((s) => {
      if (!s.eligibility_nationalities || s.eligibility_nationalities.length === 0) return true;
      return nationalities.some((n) => s.eligibility_nationalities!.includes(n));
    });
    const ineligible = candidates.filter((s) => {
      if (!s.eligibility_nationalities || s.eligibility_nationalities.length === 0) return false;
      return !nationalities.some((n) => s.eligibility_nationalities!.includes(n));
    });
    candidates = [...eligible, ...ineligible];
  }

  candidates.sort((a, b) => {
    if (a.application_deadline && !b.application_deadline) return -1;
    if (!a.application_deadline && b.application_deadline) return 1;
    if (a.application_deadline && b.application_deadline)
      return a.application_deadline - b.application_deadline;
    return 0;
  });

  return candidates.slice(0, limit);
}

/** Get all active collections */
export function getAllCollections(data: StaticData): StaticCollection[] {
  return data.collections
    .filter((c) => c.status === "active")
    .sort((a, b) => a.sort_order - b.sort_order);
}

/** Get featured collections */
export function getFeaturedCollections(data: StaticData): StaticCollection[] {
  return data.collections
    .filter((c) => c.is_featured && c.status === "active")
    .sort((a, b) => a.sort_order - b.sort_order)
    .slice(0, 6);
}

/** Get collection by slug */
export function getCollectionBySlug(data: StaticData, slug: string): StaticCollection | null {
  return data.collections.find((c) => c.slug === slug && c.status === "active") ?? null;
}

/** Get country landing data */
export function getCountryLandingData(data: StaticData, countryCode: string) {
  return {
    stats: data.countryCaches[countryCode] ?? {
      total: 0,
      fullyFunded: 0,
      degreeLevels: [],
      topFields: [],
      closingSoon: 0,
    },
    topCountries: data.taxonomy.topCountries,
    allDegrees: data.taxonomy.allDegrees,
  };
}

/** Get degree landing data */
export function getDegreeLandingData(data: StaticData, degreeLevel: string) {
  return {
    stats: data.degreeCaches[degreeLevel] ?? {
      total: 0,
      fullyFunded: 0,
      topCountries: [],
      topFields: [],
    },
    topCountries: data.taxonomy.topCountries,
    allDegrees: data.taxonomy.allDegrees,
  };
}

/** Filter scholarships with all directory filters */
export function filterScholarships(
  data: StaticData,
  filters: {
    hostCountries?: string[];
    nationalities?: string[];
    showIneligible?: boolean;
    degreeLevels?: string[];
    fieldsOfStudy?: string[];
    fundingTypes?: string[];
    prestigeTiers?: string[];
    scholarshipTypes?: string[];
    tags?: string[];
    showClosed?: boolean;
    closingSoon?: boolean;
    sort?: string;
    limit?: number;
    offset?: number;
  },
): { scholarships: ScholarshipSummary[]; total: number } {
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  const showClosed = filters.showClosed ?? true;

  let results = data.summaries.filter((s) => {
    if (!showClosed && s.application_deadline && s.application_deadline < now) return false;

    if (filters.closingSoon) {
      if (!s.application_deadline) return false;
      if (s.application_deadline <= now || s.application_deadline >= now + thirtyDays) return false;
    }

    if (filters.hostCountries?.length) {
      if (!filters.hostCountries.includes(s.host_country)) return false;
    }

    if (filters.nationalities?.length && !filters.showIneligible) {
      if (s.eligibility_nationalities?.length) {
        if (!filters.nationalities.some((n) => s.eligibility_nationalities!.includes(n)))
          return false;
      }
    }

    if (filters.degreeLevels?.length) {
      if (!s.degree_levels?.length) return false;
      if (!filters.degreeLevels.some((dl) => s.degree_levels.includes(dl))) return false;
    }

    if (filters.fieldsOfStudy?.length) {
      if (!s.fields_of_study?.length) return false;
      if (!filters.fieldsOfStudy.some((f) => s.fields_of_study!.includes(f))) return false;
    }

    if (filters.fundingTypes?.length) {
      if (!filters.fundingTypes.includes(s.funding_type)) return false;
    }

    if (filters.prestigeTiers?.length) {
      if (!s.prestige_tier || !filters.prestigeTiers.includes(s.prestige_tier)) return false;
    }

    if (filters.scholarshipTypes?.length) {
      if (!s.scholarship_type || !filters.scholarshipTypes.includes(s.scholarship_type))
        return false;
    }

    if (filters.tags?.length) {
      // Tags aren't in the summary — skip or check full doc
    }

    return true;
  });

  // Sort
  const sort = filters.sort ?? "deadline";
  if (sort === "prestige") {
    const tierOrder: Record<string, number> = { gold: 0, silver: 1, bronze: 2, unranked: 3 };
    results.sort(
      (a, b) =>
        (tierOrder[a.prestige_tier ?? "unranked"] ?? 3) -
        (tierOrder[b.prestige_tier ?? "unranked"] ?? 3),
    );
  } else if (sort === "newest") {
    results.sort((a, b) => b._creationTime - a._creationTime);
  } else {
    // deadline sort
    results.sort((a, b) => {
      if (a.application_deadline && !b.application_deadline) return -1;
      if (!a.application_deadline && b.application_deadline) return 1;
      if (a.application_deadline && b.application_deadline)
        return a.application_deadline - b.application_deadline;
      return 0;
    });
  }

  const total = results.length;
  const offset = filters.offset ?? 0;
  const limit = filters.limit ?? 20;
  const page = results.slice(offset, offset + limit);

  return { scholarships: page, total };
}

/** Get related scholarships by scoring (same logic as related.ts) */
export function getRelatedScholarships(
  data: StaticData,
  scholarshipSlug: string,
  limit = 6,
): ScholarshipSummary[] {
  const idx = data.slugIndex[scholarshipSlug];
  if (idx === undefined) return [];

  const source = data.scholarships[idx];
  if (!source) return [];

  const now = Date.now();
  const scored = data.summaries
    .filter((s) => {
      if (s._id === source._id) return false;
      if (s.application_deadline && s.application_deadline < now) return false;
      return true;
    })
    .map((candidate) => {
      let score = 0;
      if (source.provider_organization === candidate.provider_organization) score += 35;
      if (source.host_country === candidate.host_country) score += 25;
      if (source.funding_type === candidate.funding_type) score += 15;
      // Degree overlap
      const srcDeg = source.degree_levels ?? [];
      const candDeg = candidate.degree_levels ?? [];
      if (srcDeg.length > 0) {
        const overlap = srcDeg.filter((d: string) => candDeg.includes(d)).length;
        score += (overlap / srcDeg.length) * 15;
      }
      return { scholarship: candidate, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map((item) => item.scholarship);
}

/** Get scholarships matching a collection's filters */
export function getCollectionScholarships(
  data: StaticData,
  collection: StaticCollection,
  options: { sort?: string; limit?: number; offset?: number } = {},
): { scholarships: ScholarshipSummary[]; total: number } {
  return filterScholarships(data, {
    hostCountries: collection.host_countries,
    degreeLevels: collection.degree_levels,
    fundingTypes: collection.funding_types,
    prestigeTiers: collection.prestige_tiers,
    tags: collection.tags,
    fieldsOfStudy: collection.fields_of_study,
    showClosed: false,
    sort: options.sort ?? collection.default_sort ?? "deadline",
    limit: options.limit ?? 20,
    offset: options.offset ?? 0,
  });
}

/** Get which collections a scholarship belongs to */
export function getScholarshipCollections(
  data: StaticData,
  scholarshipId: string,
): Array<{ name: string; slug: string; emoji: string }> {
  const scholarship = data.scholarships.find((s) => s._id === scholarshipId);
  if (!scholarship) return [];

  return data.collections
    .filter((c) => c.status === "active")
    .filter((c) => {
      if (c.host_countries?.length && !c.host_countries.includes(scholarship.host_country))
        return false;
      if (c.degree_levels?.length) {
        if (!scholarship.degree_levels?.some((dl: string) => c.degree_levels!.includes(dl)))
          return false;
      }
      if (c.funding_types?.length && !c.funding_types.includes(scholarship.funding_type))
        return false;
      return true;
    })
    .map((c) => ({ name: c.name, slug: c.slug, emoji: c.emoji }));
}
