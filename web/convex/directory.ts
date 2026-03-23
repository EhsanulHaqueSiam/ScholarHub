import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import {
  degreeLevelValidator,
  fundingTypeValidator,
  prestigeTierValidator,
  scholarshipStatusValidator,
  scholarshipTypeValidator,
} from "./schema";
import { toScholarshipSummary } from "./scholarshipSummary";

const CACHED_COUNT_STATUSES = [
  "pending_review",
  "published",
  "rejected",
  "archived",
] as const;
const HOMEPAGE_FEATURED_CACHE_KEY = "featured_scholarships";
const HOMEPAGE_FEATURED_CACHE_TTL_MS = 60 * 60 * 1000;
const STATUS_COUNT_SCAN_CAP = 12000;
const BATCH_QUERY_SCAN_CAP = 600;

type CachedCountStatus = (typeof CACHED_COUNT_STATUSES)[number];

async function countScholarshipsByStatus(ctx: { db: any }, status: CachedCountStatus): Promise<number> {
  const rows = await ctx.db
    .query("scholarships")
    .withIndex("by_status", (q: any) => q.eq("status", status))
    .take(STATUS_COUNT_SCAN_CAP);
  return rows.length;
}

async function refreshCountCache(
  ctx: { db: any },
  status: CachedCountStatus,
): Promise<{ status: CachedCountStatus; count: number }> {
  const count = await countScholarshipsByStatus(ctx, status);
  const existing = await ctx.db
    .query("scholarship_counts")
    .withIndex("by_status", (q: any) => q.eq("status", status))
    .first();

  if (existing) {
    await ctx.db.patch(existing._id, {
      count,
      updated_at: Date.now(),
    });
  } else {
    await ctx.db.insert("scholarship_counts", {
      status,
      count,
      updated_at: Date.now(),
    });
  }

  return { status, count };
}

async function computeFeaturedScholarshipsDocs(
  ctx: { db: any },
  args: { nationalities?: string[]; limit: number },
) {
  const limit = Math.max(1, Math.min(args.limit, 20));

  // Query gold-tier scholarships first — cap at 50 to avoid unbounded reads
  const goldResults = await ctx.db
    .query("scholarships")
    .withIndex("by_status_prestige_deadline", (q: any) =>
      q.eq("status", "published").eq("prestige_tier", "gold"),
    )
    .take(50);

  // If not enough gold, get silver too — cap at 50
  let silverResults: typeof goldResults = [];
  if (goldResults.length < limit) {
    silverResults = await ctx.db
      .query("scholarships")
      .withIndex("by_status_prestige_deadline", (q: any) =>
        q.eq("status", "published").eq("prestige_tier", "silver"),
      )
      .take(50);
  }

  let combined = [...goldResults, ...silverResults];

  // Filter out expired scholarships
  const now = Date.now();
  combined = combined.filter((s) => !s.application_deadline || s.application_deadline > now);

  // Prioritize nationality-eligible scholarships
  if (args.nationalities && args.nationalities.length > 0) {
    const eligible = combined.filter((s) => {
      if (!s.eligibility_nationalities || s.eligibility_nationalities.length === 0) {
        return true; // open to all
      }
      return args.nationalities!.some((n) => s.eligibility_nationalities!.includes(n));
    });
    const ineligible = combined.filter((s) => {
      if (!s.eligibility_nationalities || s.eligibility_nationalities.length === 0) {
        return false; // already in eligible
      }
      return !args.nationalities!.some((n) => s.eligibility_nationalities!.includes(n));
    });
    combined = [...eligible, ...ineligible];
  }

  // Sort by deadline ascending (soonest first) within each group
  combined.sort((a, b) => {
    if (a.application_deadline && !b.application_deadline) return -1;
    if (!a.application_deadline && b.application_deadline) return 1;
    if (a.application_deadline && b.application_deadline) {
      return a.application_deadline - b.application_deadline;
    }
    return 0;
  });

  return combined;
}

/**
 * List scholarships with full search, multi-filter, sort, and pagination.
 *
 * Supports: text search, host country, nationality eligibility, degree level,
 * field of study, multi-select funding type, prestige tier, sort order,
 * closing-soon filter, and show/hide expired scholarships.
 *
 * Pagination uses Convex cursor-based pagination (20 results per page).
 */
export const listScholarships = query({
  args: {
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
    status: v.optional(scholarshipStatusValidator),
    hostCountries: v.optional(v.array(v.string())),
    nationalities: v.optional(v.array(v.string())),
    showIneligible: v.optional(v.boolean()),
    degreeLevels: v.optional(v.array(degreeLevelValidator)),
    fieldsOfStudy: v.optional(v.array(v.string())),
    fundingTypes: v.optional(v.array(fundingTypeValidator)),
    prestigeTiers: v.optional(v.array(prestigeTierValidator)),
    scholarshipTypes: v.optional(v.array(scholarshipTypeValidator)),
    sort: v.optional(v.string()),
    showClosed: v.optional(v.boolean()),
    closingSoon: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const status = args.status ?? "published";
    const sort = args.sort ?? "deadline";
    const showClosed = args.showClosed ?? false;
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    // --- Search path: full-text search ---
    if (args.search && args.search.trim().length > 0) {
      const searchQuery = ctx.db
        .query("scholarships")
        .withSearchIndex("search_scholarships", (q) => {
          let sq = q.search("search_text", args.search!).eq("status", status);

          // Single-value funding_type can be pushed into the search index
          if (args.fundingTypes && args.fundingTypes.length === 1) {
            sq = sq.eq("funding_type", args.fundingTypes[0]);
          }

          // Single-value prestige_tier can be pushed into the search index
          if (args.prestigeTiers && args.prestigeTiers.length === 1) {
            sq = sq.eq("prestige_tier", args.prestigeTiers[0]);
          }

          // Single host country can be pushed into the search index
          if (args.hostCountries && args.hostCountries.length === 1) {
            sq = sq.eq("host_country", args.hostCountries[0]);
          }

          // Single-value scholarship_type can be pushed into the search index
          if (args.scholarshipTypes && args.scholarshipTypes.length === 1) {
            sq = sq.eq("scholarship_type", args.scholarshipTypes[0]);
          }

          return sq;
        });

      // Search index doesn't support .filter() or pagination natively the same way,
      // so we take a capped set and post-filter then manually paginate.
      // Cap at 1000 to avoid reading the entire table on broad searches.
      const allResults = await searchQuery.take(1000);
      const filtered = applyPostFilters(allResults, {
        hostCountries:
          args.hostCountries && args.hostCountries.length > 1 ? args.hostCountries : undefined,
        nationalities: args.nationalities,
        showIneligible: args.showIneligible,
        degreeLevels: args.degreeLevels,
        fieldsOfStudy: args.fieldsOfStudy,
        fundingTypes:
          args.fundingTypes && args.fundingTypes.length > 1 ? args.fundingTypes : undefined,
        prestigeTiers:
          args.prestigeTiers && args.prestigeTiers.length > 1 ? args.prestigeTiers : undefined,
        scholarshipTypes:
          args.scholarshipTypes && args.scholarshipTypes.length > 1
            ? args.scholarshipTypes
            : undefined,
        showClosed,
        closingSoon: args.closingSoon,
        now,
        thirtyDays,
      });

      // Manual pagination for search results
      const numItems = args.paginationOpts.numItems;
      const cursor = args.paginationOpts.cursor;
      const startIndex = cursor ? Number.parseInt(cursor, 10) : 0;
      const page = filtered.slice(startIndex, startIndex + numItems);
      const nextCursor =
        startIndex + numItems < filtered.length ? String(startIndex + numItems) : null;

      return {
        page: page.map((doc) => toScholarshipSummary(doc)),
        isDone: nextCursor === null,
        continueCursor: nextCursor ?? "",
      };
    }

    // --- Non-search path: index-based queries ---
    function buildFilteredQuery() {
      let baseQuery;

      if (sort === "prestige") {
        baseQuery = ctx.db
          .query("scholarships")
          .withIndex("by_status_prestige_deadline", (q) => q.eq("status", status));
      } else if (sort === "newest") {
        baseQuery = ctx.db
          .query("scholarships")
          .withIndex("by_status", (q) => q.eq("status", status))
          .order("desc");
      } else {
        baseQuery = ctx.db
          .query("scholarships")
          .withIndex("by_status_deadline", (q) => q.eq("status", status));
      }

      return baseQuery.filter((q) => {
        const conditions = [];

        if (args.hostCountries && args.hostCountries.length > 0) {
          conditions.push(
            q.or(...args.hostCountries.map((country) => q.eq(q.field("host_country"), country))),
          );
        }

        if (args.fundingTypes && args.fundingTypes.length > 0) {
          conditions.push(
            q.or(...args.fundingTypes.map((ft) => q.eq(q.field("funding_type"), ft))),
          );
        }

        if (args.prestigeTiers && args.prestigeTiers.length > 0) {
          conditions.push(
            q.or(...args.prestigeTiers.map((tier) => q.eq(q.field("prestige_tier"), tier))),
          );
        }

        if (args.scholarshipTypes && args.scholarshipTypes.length > 0) {
          conditions.push(
            q.or(...args.scholarshipTypes.map((st) => q.eq(q.field("scholarship_type"), st))),
          );
        }

        if (!showClosed) {
          conditions.push(q.neq(q.field("status"), "archived"));
          conditions.push(
            q.or(
              q.eq(q.field("application_deadline"), undefined),
              q.gte(q.field("application_deadline"), Date.now()),
            ),
          );
        }

        if (args.closingSoon) {
          const closingSoonEnd = Date.now() + thirtyDays;
          conditions.push(q.gt(q.field("application_deadline"), Date.now()));
          conditions.push(q.lt(q.field("application_deadline"), closingSoonEnd));
        }

        if (conditions.length === 0) return true;
        if (conditions.length === 1) return conditions[0];
        return q.and(...conditions);
      });
    }

    // Paginate the filtered query
    const paginatedResults = await buildFilteredQuery().paginate(args.paginationOpts);

    // Post-filter for nationality eligibility and degree/field (array operations not supported in .filter())
    let page = paginatedResults.page;

    if (args.nationalities && args.nationalities.length > 0 && !args.showIneligible) {
      page = page.filter((doc) => {
        // Open to all: no nationality restrictions
        if (!doc.eligibility_nationalities || doc.eligibility_nationalities.length === 0) {
          return true;
        }
        // Check if any user nationality is in the eligibility list
        return args.nationalities!.some((n) => doc.eligibility_nationalities!.includes(n));
      });
    }

    if (args.degreeLevels && args.degreeLevels.length > 0) {
      page = page.filter((doc) => {
        if (!doc.degree_levels || doc.degree_levels.length === 0) return false;
        return args.degreeLevels!.some((dl) => doc.degree_levels.includes(dl));
      });
    }

    if (args.fieldsOfStudy && args.fieldsOfStudy.length > 0) {
      page = page.filter((doc) => {
        if (!doc.fields_of_study || doc.fields_of_study.length === 0) return false;
        return args.fieldsOfStudy!.some((f) => doc.fields_of_study!.includes(f));
      });
    }

    return {
      ...paginatedResults,
      page: page.map((doc) => toScholarshipSummary(doc)),
    };
  },
});

/**
 * Get featured scholarships: up to 6 gold/silver scholarships sorted by deadline.
 * Prioritizes nationality-eligible scholarships when nationalities are provided.
 */
export const getFeaturedScholarships = query({
  args: {
    nationalities: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(args.limit ?? 6, 20));
    const isPersonalized = !!(args.nationalities && args.nationalities.length > 0);

    // Hot path for homepage: use cached non-personalized featured IDs.
    if (!isPersonalized) {
      const cached = await ctx.db
        .query("homepage_cache")
        .withIndex("by_key", (q: any) => q.eq("key", HOMEPAGE_FEATURED_CACHE_KEY))
        .first();

      if (cached && Date.now() - cached.updated_at <= HOMEPAGE_FEATURED_CACHE_TTL_MS) {
        const hydrated = (
          await Promise.all(cached.scholarship_ids.slice(0, limit + 8).map((id: any) => ctx.db.get(id)))
        ).filter(
          (doc): doc is NonNullable<typeof doc> =>
            !!doc &&
            doc.status === "published" &&
            (!doc.application_deadline || doc.application_deadline > Date.now()),
        );

        if (hydrated.length >= limit) {
          return hydrated.slice(0, limit).map((doc) => toScholarshipSummary(doc));
        }
      }
    }

    const combined = await computeFeaturedScholarshipsDocs(ctx, {
      nationalities: args.nationalities,
      limit,
    });
    return combined.slice(0, limit).map((doc) => toScholarshipSummary(doc));
  },
});

/**
 * Refresh homepage featured scholarship cache.
 * Called by cron and scrape-complete hooks.
 */
export const refreshHomepageCache = internalMutation({
  args: {},
  handler: async (ctx) => {
    const docs = await computeFeaturedScholarshipsDocs(ctx, { limit: 12 });
    const scholarship_ids = docs.slice(0, 12).map((doc) => doc._id);
    const existing = await ctx.db
      .query("homepage_cache")
      .withIndex("by_key", (q: any) => q.eq("key", HOMEPAGE_FEATURED_CACHE_KEY))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        scholarship_ids,
        updated_at: Date.now(),
      });
    } else {
      await ctx.db.insert("homepage_cache", {
        key: HOMEPAGE_FEATURED_CACHE_KEY,
        scholarship_ids,
        updated_at: Date.now(),
      });
    }

    return { refreshed: true, featuredCount: scholarship_ids.length };
  },
});

/**
 * Get total count of published (or specified status) scholarships.
 */
export const getScholarshipCount = query({
  args: {
    status: v.optional(scholarshipStatusValidator),
  },
  handler: async (ctx, args) => {
    const status = (args.status ?? "published") as CachedCountStatus;
    const cached = await ctx.db
      .query("scholarship_counts")
      .withIndex("by_status", (q) => q.eq("status", status))
      .first();

    if (cached) return cached.count;
    return await countScholarshipsByStatus(ctx, status);
  },
});

/**
 * Refresh cached scholarship counts by status.
 * If status is omitted, refreshes all statuses used by the directory.
 */
export const refreshScholarshipCountCache = mutation({
  args: {
    status: v.optional(scholarshipStatusValidator),
  },
  handler: async (ctx, args) => {
    const statuses = args.status
      ? [args.status as CachedCountStatus]
      : [...CACHED_COUNT_STATUSES];
    const results = await Promise.all(statuses.map((status) => refreshCountCache(ctx, status)));
    return {
      refreshed: results.length,
      results,
    };
  },
});

/**
 * Internal variant for cron jobs and post-ingestion scheduling.
 */
export const refreshScholarshipCountCacheInternal = internalMutation({
  args: {
    status: v.optional(scholarshipStatusValidator),
  },
  handler: async (ctx, args) => {
    const statuses = args.status
      ? [args.status as CachedCountStatus]
      : [...CACHED_COUNT_STATUSES];
    const results = await Promise.all(statuses.map((status) => refreshCountCache(ctx, status)));
    return {
      refreshed: results.length,
      results,
    };
  },
});

/**
 * List scholarships as a flat batch (no cursor pagination).
 * Loads up to `limit` scholarships with all filters applied.
 * Client handles page slicing. Avoids usePaginatedQuery issues.
 */
export const listScholarshipsBatch = query({
  args: {
    limit: v.optional(v.number()),
    search: v.optional(v.string()),
    status: v.optional(scholarshipStatusValidator),
    hostCountries: v.optional(v.array(v.string())),
    nationalities: v.optional(v.array(v.string())),
    showIneligible: v.optional(v.boolean()),
    degreeLevels: v.optional(v.array(degreeLevelValidator)),
    fieldsOfStudy: v.optional(v.array(v.string())),
    fundingTypes: v.optional(v.array(fundingTypeValidator)),
    prestigeTiers: v.optional(v.array(prestigeTierValidator)),
    scholarshipTypes: v.optional(v.array(scholarshipTypeValidator)),
    tags: v.optional(v.array(v.string())),
    sort: v.optional(v.string()),
    showClosed: v.optional(v.boolean()),
    closingSoon: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const status = args.status ?? "published";
    const sort = args.sort ?? "deadline";
    const showClosed = args.showClosed ?? false;
    const maxResults = args.limit ?? 200;
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    if (args.search && args.search.trim().length > 0) {
      const searchQuery = ctx.db
        .query("scholarships")
        .withSearchIndex("search_scholarships", (q) => {
          let sq = q.search("search_text", args.search!).eq("status", status);

          if (args.fundingTypes && args.fundingTypes.length === 1) {
            sq = sq.eq("funding_type", args.fundingTypes[0]);
          }
          if (args.prestigeTiers && args.prestigeTiers.length === 1) {
            sq = sq.eq("prestige_tier", args.prestigeTiers[0]);
          }
          if (args.hostCountries && args.hostCountries.length === 1) {
            sq = sq.eq("host_country", args.hostCountries[0]);
          }
          if (args.scholarshipTypes && args.scholarshipTypes.length === 1) {
            sq = sq.eq("scholarship_type", args.scholarshipTypes[0]);
          }
          return sq;
        });

      const searchCap = Math.min(800, Math.max(maxResults * 6, 120));
      let results = applyPostFilters(await searchQuery.take(searchCap), {
        hostCountries:
          args.hostCountries && args.hostCountries.length > 1 ? args.hostCountries : undefined,
        nationalities: args.nationalities,
        showIneligible: args.showIneligible,
        degreeLevels: args.degreeLevels,
        fieldsOfStudy: args.fieldsOfStudy,
        fundingTypes:
          args.fundingTypes && args.fundingTypes.length > 1 ? args.fundingTypes : undefined,
        prestigeTiers:
          args.prestigeTiers && args.prestigeTiers.length > 1 ? args.prestigeTiers : undefined,
        scholarshipTypes:
          args.scholarshipTypes && args.scholarshipTypes.length > 1
            ? args.scholarshipTypes
            : undefined,
        showClosed,
        closingSoon: args.closingSoon,
        now,
        thirtyDays,
      });

      if (args.tags && args.tags.length > 0) {
        results = results.filter((doc) => {
          if (!doc.tags || doc.tags.length === 0) return false;
          return args.tags!.some((t) => doc.tags!.includes(t));
        });
      }

      return results.slice(0, maxResults).map((doc) => toScholarshipSummary(doc));
    }

    // Build base query with sort
    let baseQuery;
    if (sort === "prestige") {
      baseQuery = ctx.db
        .query("scholarships")
        .withIndex("by_status_prestige_deadline", (q) => q.eq("status", status));
    } else if (sort === "newest") {
      baseQuery = ctx.db
        .query("scholarships")
        .withIndex("by_status", (q) => q.eq("status", status))
        .order("desc");
    } else {
      baseQuery = ctx.db
        .query("scholarships")
        .withIndex("by_status_deadline", (q) => q.eq("status", status));
    }

    // Apply database-level filters
    const filtered = baseQuery.filter((q) => {
      const conditions = [];

      if (args.hostCountries && args.hostCountries.length > 0) {
        conditions.push(q.or(...args.hostCountries.map((c) => q.eq(q.field("host_country"), c))));
      }

      if (args.fundingTypes && args.fundingTypes.length > 0) {
        conditions.push(q.or(...args.fundingTypes.map((ft) => q.eq(q.field("funding_type"), ft))));
      }

      if (args.prestigeTiers && args.prestigeTiers.length > 0) {
        conditions.push(q.or(...args.prestigeTiers.map((t) => q.eq(q.field("prestige_tier"), t))));
      }

      if (args.scholarshipTypes && args.scholarshipTypes.length > 0) {
        conditions.push(
          q.or(...args.scholarshipTypes.map((st) => q.eq(q.field("scholarship_type"), st))),
        );
      }

      if (!showClosed) {
        conditions.push(q.neq(q.field("status"), "archived"));
        conditions.push(
          q.or(
            q.eq(q.field("application_deadline"), undefined),
            q.gte(q.field("application_deadline"), now),
          ),
        );
      }

      if (conditions.length === 0) return true;
      if (conditions.length === 1) return conditions[0];
      return q.and(...conditions);
    });

    const scanLimit = Math.min(BATCH_QUERY_SCAN_CAP, Math.max(maxResults * 6, 80));
    const baseResults = await filtered.take(scanLimit);

    let postFiltered = applyPostFilters(baseResults, {
      // Already pushed into db-level filter above.
      hostCountries: undefined,
      fundingTypes: undefined,
      prestigeTiers: undefined,
      scholarshipTypes: undefined,
      nationalities: args.nationalities,
      showIneligible: args.showIneligible,
      degreeLevels: args.degreeLevels,
      fieldsOfStudy: args.fieldsOfStudy,
      showClosed,
      closingSoon: args.closingSoon,
      now,
      thirtyDays,
    });

    if (args.tags && args.tags.length > 0) {
      postFiltered = postFiltered.filter((doc) => {
        if (!doc.tags || doc.tags.length === 0) return false;
        return args.tags!.some((t) => doc.tags!.includes(t));
      });
    }

    return postFiltered.slice(0, maxResults).map((doc) => toScholarshipSummary(doc));
  },
});

/**
 * Lightweight search suggestions for autocomplete dropdown.
 * Returns max 5 results with id, title, host_country, and slug.
 */
export const searchSuggestions = query({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.query || args.query.trim().length === 0) {
      return [];
    }

    const results = await ctx.db
      .query("scholarships")
      .withSearchIndex("search_scholarships", (q) =>
        q.search("search_text", args.query).eq("status", "published"),
      )
      .take(5);

    return results.map((r) => ({
      _id: r._id,
      title: r.title,
      host_country: r.host_country,
      slug: r.slug,
    }));
  },
});

/**
 * Get a single scholarship by its slug.
 * Used for the scholarship detail page and Schema.org JSON-LD structured data.
 */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return await ctx.db
      .query("scholarships")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
  },
});

/**
 * Get a single scholarship by slug with resolved source attribution.
 * Returns the full scholarship document plus resolved_sources array
 * containing { name, url } for each source_id.
 *
 * Used by the scholarship detail page for DTLP-08 (source attribution).
 */
export const getScholarshipDetail = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const scholarship = await ctx.db
      .query("scholarships")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    if (!scholarship) return null;

    // Resolve source_ids to source name + URL for attribution display
    const resolvedSources = await Promise.all(
      scholarship.source_ids.map(async (sourceId) => {
        const source = await ctx.db.get(sourceId);
        return source ? { name: source.name, url: source.url } : null;
      }),
    );

    return {
      ...scholarship,
      resolved_sources: resolvedSources.filter(
        (s): s is { name: string; url: string } => s !== null,
      ),
    };
  },
});

// --- Helper: Post-filter for search path results ---

interface PostFilterOptions {
  hostCountries?: string[];
  nationalities?: string[];
  showIneligible?: boolean;
  degreeLevels?: string[];
  fieldsOfStudy?: string[];
  fundingTypes?: string[];
  prestigeTiers?: string[];
  scholarshipTypes?: string[];
  showClosed: boolean;
  closingSoon?: boolean;
  now: number;
  thirtyDays: number;
}

function applyPostFilters<
  T extends {
    host_country: string;
    eligibility_nationalities?: string[] | null;
    degree_levels: string[];
    fields_of_study?: string[] | null;
    funding_type: string;
    prestige_tier?: string | null;
    scholarship_type?: string | null;
    application_deadline?: number | null;
    status: string;
  },
>(docs: T[], opts: PostFilterOptions): T[] {
  let filtered = docs;

  // Host country filter (multi-value OR)
  if (opts.hostCountries && opts.hostCountries.length > 0) {
    filtered = filtered.filter((d) => opts.hostCountries!.includes(d.host_country));
  }

  // Nationality eligibility filter
  if (opts.nationalities && opts.nationalities.length > 0 && !opts.showIneligible) {
    filtered = filtered.filter((d) => {
      if (!d.eligibility_nationalities || d.eligibility_nationalities.length === 0) {
        return true; // open to all
      }
      return opts.nationalities!.some((n) => d.eligibility_nationalities!.includes(n));
    });
  }

  // Degree level filter (OR logic)
  if (opts.degreeLevels && opts.degreeLevels.length > 0) {
    filtered = filtered.filter((d) => {
      if (!d.degree_levels || d.degree_levels.length === 0) return false;
      return opts.degreeLevels!.some((dl) => d.degree_levels.includes(dl));
    });
  }

  // Field of study filter (OR logic)
  if (opts.fieldsOfStudy && opts.fieldsOfStudy.length > 0) {
    filtered = filtered.filter((d) => {
      if (!d.fields_of_study || d.fields_of_study.length === 0) return false;
      return opts.fieldsOfStudy!.some((f) => d.fields_of_study!.includes(f));
    });
  }

  // Funding type filter (multi-value OR, already single-value handled by search index)
  if (opts.fundingTypes && opts.fundingTypes.length > 0) {
    filtered = filtered.filter((d) => opts.fundingTypes!.includes(d.funding_type));
  }

  // Prestige tier filter (multi-value OR, already single-value handled by search index)
  if (opts.prestigeTiers && opts.prestigeTiers.length > 0) {
    filtered = filtered.filter((d) =>
      d.prestige_tier ? opts.prestigeTiers!.includes(d.prestige_tier) : false,
    );
  }

  // Scholarship type filter (multi-value OR)
  if (opts.scholarshipTypes && opts.scholarshipTypes.length > 0) {
    filtered = filtered.filter((d) =>
      d.scholarship_type ? opts.scholarshipTypes!.includes(d.scholarship_type) : false,
    );
  }

  // Show closed filter
  if (!opts.showClosed) {
    filtered = filtered.filter((d) => {
      if (d.status === "archived") return false;
      if (d.application_deadline && d.application_deadline < opts.now) return false;
      return true;
    });
  }

  // Closing soon filter
  if (opts.closingSoon) {
    filtered = filtered.filter((d) => {
      if (!d.application_deadline) return false;
      return (
        d.application_deadline > opts.now && d.application_deadline < opts.now + opts.thirtyDays
      );
    });
  }

  return filtered;
}
