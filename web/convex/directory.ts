import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { query } from "./_generated/server";
import {
  degreeLevelValidator,
  fundingTypeValidator,
  prestigeTierValidator,
  scholarshipStatusValidator,
} from "./schema";

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

          return sq;
        });

      // Search index doesn't support .filter() or pagination natively the same way,
      // so we collect and post-filter then manually paginate
      const allResults = await searchQuery.collect();
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
        page,
        isDone: nextCursor === null,
        continueCursor: nextCursor ?? "",
      };
    }

    // --- Non-search path: index-based queries ---
    let baseQuery;

    if (sort === "prestige") {
      // Sort by prestige tier: gold first, then silver, bronze, unranked
      baseQuery = ctx.db
        .query("scholarships")
        .withIndex("by_status_prestige_deadline", (q) => q.eq("status", status));
    } else if (sort === "newest") {
      // Sort by creation time descending (newest first)
      baseQuery = ctx.db
        .query("scholarships")
        .withIndex("by_status", (q) => q.eq("status", status))
        .order("desc");
    } else {
      // Default: sort by deadline ascending (soonest first)
      baseQuery = ctx.db
        .query("scholarships")
        .withIndex("by_status_deadline", (q) => q.eq("status", status));
    }

    // Apply post-filters via .filter()
    const filteredQuery = baseQuery.filter((q) => {
      const conditions = [];

      // Host country filter (OR logic)
      if (args.hostCountries && args.hostCountries.length > 0) {
        conditions.push(
          q.or(...args.hostCountries.map((country) => q.eq(q.field("host_country"), country))),
        );
      }

      // Nationality eligibility filter
      if (args.nationalities && args.nationalities.length > 0 && !args.showIneligible) {
        // Include scholarships where eligibility_nationalities is undefined/empty (open to all)
        // OR where at least one user nationality matches
        // Note: Convex filter expressions can't do array.includes, so we handle this in post-filter
        // For now, we skip this in the index filter and do it in post-processing below
      }

      // Funding type filter (OR logic, multi-select)
      if (args.fundingTypes && args.fundingTypes.length > 0) {
        conditions.push(q.or(...args.fundingTypes.map((ft) => q.eq(q.field("funding_type"), ft))));
      }

      // Prestige tier filter (OR logic)
      if (args.prestigeTiers && args.prestigeTiers.length > 0) {
        conditions.push(
          q.or(...args.prestigeTiers.map((tier) => q.eq(q.field("prestige_tier"), tier))),
        );
      }

      // Show closed filter: exclude archived/expired when showClosed is false
      if (!showClosed) {
        conditions.push(q.neq(q.field("status"), "archived"));
        conditions.push(
          q.or(
            q.eq(q.field("application_deadline"), undefined),
            q.gte(q.field("application_deadline"), Date.now()),
          ),
        );
      }

      // Closing soon filter: deadline within 30 days
      if (args.closingSoon) {
        const closingSoonEnd = Date.now() + thirtyDays;
        conditions.push(q.gt(q.field("application_deadline"), Date.now()));
        conditions.push(q.lt(q.field("application_deadline"), closingSoonEnd));
      }

      if (conditions.length === 0) return true;
      if (conditions.length === 1) return conditions[0];
      return q.and(...conditions);
    });

    // Paginate the filtered query
    const paginatedResults = await filteredQuery.paginate(args.paginationOpts);

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
      page,
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
    const limit = args.limit ?? 6;

    // Query gold-tier scholarships first
    const goldResults = await ctx.db
      .query("scholarships")
      .withIndex("by_status_prestige_deadline", (q) =>
        q.eq("status", "published").eq("prestige_tier", "gold"),
      )
      .collect();

    // If not enough gold, get silver too
    let silverResults: typeof goldResults = [];
    if (goldResults.length < limit) {
      silverResults = await ctx.db
        .query("scholarships")
        .withIndex("by_status_prestige_deadline", (q) =>
          q.eq("status", "published").eq("prestige_tier", "silver"),
        )
        .collect();
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
      // Scholarships with deadlines come before those without
      if (a.application_deadline && !b.application_deadline) return -1;
      if (!a.application_deadline && b.application_deadline) return 1;
      if (a.application_deadline && b.application_deadline) {
        return a.application_deadline - b.application_deadline;
      }
      return 0;
    });

    return combined.slice(0, limit);
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
    const status = args.status ?? "published";
    const results = await ctx.db
      .query("scholarships")
      .withIndex("by_status", (q) => q.eq("status", status))
      .collect();
    return results.length;
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
