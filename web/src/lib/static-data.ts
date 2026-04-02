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
  countryCaches: Array<{
    code: string;
    total: number;
    fullyFunded: number;
    degreeLevels: string[];
    topFields: string[];
    closingSoon: number;
  }>;
  degreeCaches: Array<{
    level: string;
    total: number;
    fullyFunded: number;
    topCountries: string[];
    topFields: string[];
  }>;
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
    // Browser path: fetch static JSON from public assets so we don't ship
    // a multi-megabyte JSON blob inside client JS bundles.
    if (!import.meta.env.SSR) {
      try {
        const base = import.meta.env.BASE_URL ?? "/";
        const normalizedBase = base.endsWith("/") ? base : `${base}/`;
        const url = `${normalizedBase}data/scholarships.json`;
        const response = await fetch(url, { cache: "force-cache" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        _cachedData = (await response.json()) as StaticData;
        return _cachedData;
      } catch {
        // Static JSON not available in public assets — app will fall back to Convex queries.
        return null;
      }
    }

    // SSR/server path: delegate to server-only loader.
    if (import.meta.env.SSR) {
      const { loadStaticDataFromModule } = await import("./static-data-server");
      const loaded = await loadStaticDataFromModule();
      if (loaded) _cachedData = loaded;
      return loaded;
    }

    return null;
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

/** Get multiple scholarship details by slug, preserving request order. */
export function getScholarshipsBySlugs(data: StaticData, slugs: string[]): any[] {
  return slugs
    .map((slug) => getScholarshipBySlug(data, slug))
    .filter((scholarship): scholarship is NonNullable<typeof scholarship> => scholarship !== null);
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
  const cached = data.countryCaches.find((c) => c.code === countryCode);
  return {
    stats: cached ?? {
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
  const cached = data.degreeCaches.find((c) => c.level === degreeLevel);
  return {
    stats: cached ?? {
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
    search?: string;
    hostCountries?: string[];
    nationalities?: string[];
    showIneligible?: boolean;
    degreeLevels?: string[];
    fieldsOfStudy?: string[];
    fundingTypes?: string[];
    prestigeTiers?: string[];
    scholarshipTypes?: string[];
    tags?: string[];
    deadlineBefore?: number;
    deadlineAfter?: number;
    addedSince?: number;
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
  const searchQuery = filters.search?.trim().toLowerCase() ?? "";
  const searchTokens = searchQuery
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const results = data.summaries.filter((s) => {
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
      const scholarshipTags = s.tags ?? [];
      if (!filters.tags.some((tag) => scholarshipTags.includes(tag))) return false;
    }

    if (filters.deadlineBefore !== undefined) {
      if (!s.application_deadline || s.application_deadline > filters.deadlineBefore) return false;
    }

    if (filters.deadlineAfter !== undefined) {
      if (!s.application_deadline || s.application_deadline < filters.deadlineAfter) return false;
    }

    if (filters.addedSince !== undefined) {
      if (s._creationTime < filters.addedSince) return false;
    }

    if (searchTokens.length > 0) {
      const haystack = [
        s.title,
        s.description ?? "",
        s.provider_organization,
        s.host_country,
        ...(s.fields_of_study ?? []),
        ...(s.tags ?? []),
      ]
        .join(" ")
        .toLowerCase();

      if (!searchTokens.every((token) => haystack.includes(token))) return false;
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
    deadlineBefore: collection.deadline_before,
    deadlineAfter: collection.deadline_after,
    addedSince: collection.added_since,
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

  const matchesCollectionFilters = (collection: StaticCollection): boolean => {
    if (collection.host_countries?.length && !collection.host_countries.includes(scholarship.host_country)) {
      return false;
    }

    if (collection.degree_levels?.length) {
      const scholarshipDegrees = scholarship.degree_levels ?? [];
      if (!scholarshipDegrees.some((dl: string) => collection.degree_levels!.includes(dl))) {
        return false;
      }
    }

    if (collection.funding_types?.length && !collection.funding_types.includes(scholarship.funding_type)) {
      return false;
    }

    if (collection.prestige_tiers?.length) {
      if (!scholarship.prestige_tier || !collection.prestige_tiers.includes(scholarship.prestige_tier)) {
        return false;
      }
    }

    if (collection.tags?.length) {
      const scholarshipTags = scholarship.tags ?? [];
      if (!collection.tags.some((tag) => scholarshipTags.includes(tag))) return false;
    }

    if (collection.fields_of_study?.length) {
      const scholarshipFields = scholarship.fields_of_study ?? [];
      if (!collection.fields_of_study.some((field) => scholarshipFields.includes(field))) {
        return false;
      }
    }

    if (collection.deadline_before !== undefined) {
      if (!scholarship.application_deadline || scholarship.application_deadline > collection.deadline_before) {
        return false;
      }
    }

    if (collection.deadline_after !== undefined) {
      if (!scholarship.application_deadline || scholarship.application_deadline < collection.deadline_after) {
        return false;
      }
    }

    if (collection.added_since !== undefined) {
      if (scholarship._creationTime < collection.added_since) return false;
    }

    return true;
  };

  return data.collections
    .filter((c) => c.status === "active")
    .filter((c) => matchesCollectionFilters(c))
    .map((c) => ({ name: c.name, slug: c.slug, emoji: c.emoji }));
}
