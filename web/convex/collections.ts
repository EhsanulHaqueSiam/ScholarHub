/**
 * Collection CRUD queries and mutations.
 *
 * Collections are admin-managed, filter-based curated lists of scholarships.
 * Membership is determined by matching a scholarship's fields against the
 * collection's filter criteria (host_countries, degree_levels, funding_types,
 * prestige_tiers, tags, deadline_before/after, added_since).
 *
 * Provides:
 * - Public: getCollectionBySlug, getCollectionScholarships, getFeaturedCollections, getAllCollections
 * - Public: recordCollectionView, getScholarshipCollections (D-50)
 * - Admin: getAdminCollections, createCollection, updateCollection, deleteCollection
 * - Admin: bulkUpdateCollectionStatus, getCollectionPreview
 */

import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import {
  collectionStatusValidator,
  degreeLevelValidator,
  fundingTypeValidator,
  prestigeTierValidator,
} from "./schema";

// ---- Helper: Check if a scholarship matches a collection's filter criteria ----

interface CollectionFilters {
  host_countries?: string[] | null;
  degree_levels?: string[] | null;
  funding_types?: string[] | null;
  prestige_tiers?: string[] | null;
  tags?: string[] | null;
  fields_of_study?: string[] | null;
  deadline_before?: number | null;
  deadline_after?: number | null;
  added_since?: number | null;
}

interface ScholarshipForMatching {
  host_country: string;
  degree_levels: string[];
  funding_type: string;
  prestige_tier?: string | null;
  tags?: string[] | null;
  fields_of_study?: string[] | null;
  application_deadline?: number | null;
  _creationTime: number;
  status: string;
}

/**
 * Check if a single scholarship matches a collection's filter criteria.
 * AND between filter types, OR within each type.
 */
function matchesCollectionFilters(
  scholarship: ScholarshipForMatching,
  filters: CollectionFilters,
): boolean {
  // Status must be published
  if (scholarship.status !== "published") return false;

  // Host countries (OR within)
  if (filters.host_countries && filters.host_countries.length > 0) {
    if (!filters.host_countries.includes(scholarship.host_country)) return false;
  }

  // Degree levels (OR within)
  if (filters.degree_levels && filters.degree_levels.length > 0) {
    if (!scholarship.degree_levels.some((dl) => filters.degree_levels!.includes(dl))) return false;
  }

  // Funding types (OR within)
  if (filters.funding_types && filters.funding_types.length > 0) {
    if (!filters.funding_types.includes(scholarship.funding_type)) return false;
  }

  // Prestige tiers (OR within)
  if (filters.prestige_tiers && filters.prestige_tiers.length > 0) {
    if (!scholarship.prestige_tier || !filters.prestige_tiers.includes(scholarship.prestige_tier))
      return false;
  }

  // Tags (OR within -- scholarship must have at least one matching tag)
  if (filters.tags && filters.tags.length > 0) {
    const scholarshipTags = scholarship.tags ?? [];
    if (!filters.tags.some((t) => scholarshipTags.includes(t))) return false;
  }

  // Fields of study (OR within)
  if (filters.fields_of_study && filters.fields_of_study.length > 0) {
    const scholarshipFields = scholarship.fields_of_study ?? [];
    if (!filters.fields_of_study.some((f) => scholarshipFields.includes(f))) return false;
  }

  // Deadline before (scholarship deadline must be before this date)
  if (filters.deadline_before) {
    if (
      !scholarship.application_deadline ||
      scholarship.application_deadline > filters.deadline_before
    )
      return false;
  }

  // Deadline after (scholarship deadline must be after this date)
  if (filters.deadline_after) {
    if (
      !scholarship.application_deadline ||
      scholarship.application_deadline < filters.deadline_after
    )
      return false;
  }

  // Added since (scholarship creation time must be after this date)
  if (filters.added_since) {
    if (scholarship._creationTime < filters.added_since) return false;
  }

  return true;
}

/**
 * Count matching scholarships for a collection's filter criteria.
 */
async function countMatchingScholarships(
  ctx: { db: any },
  filters: CollectionFilters,
): Promise<number> {
  const published = await ctx.db
    .query("scholarships")
    .withIndex("by_status", (q: any) => q.eq("status", "published"))
    .take(10000);

  return published.filter((s: any) => matchesCollectionFilters(s, filters)).length;
}

// ---- Slug generation ----

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ---- Public Queries ----

/**
 * Get a single collection by its slug (public, active only).
 */
export const getCollectionBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const collection = await ctx.db
      .query("collections")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!collection || collection.status !== "active") return null;
    return collection;
  },
});

/**
 * Get scholarships belonging to a collection, with sort and pagination.
 * Uses the collection's filter criteria to determine membership.
 */
export const getCollectionScholarships = query({
  args: {
    slug: v.string(),
    sort: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const collection = await ctx.db
      .query("collections")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!collection) return { scholarships: [], total: 0 };

    const sort = args.sort ?? collection.default_sort ?? "deadline";
    const limit = args.limit ?? 20;
    const offset = args.offset ?? 0;

    // Query published scholarships with appropriate index
    let baseQuery;
    if (sort === "prestige") {
      baseQuery = ctx.db
        .query("scholarships")
        .withIndex("by_status_prestige_deadline", (q) => q.eq("status", "published"));
    } else if (sort === "newest") {
      baseQuery = ctx.db
        .query("scholarships")
        .withIndex("by_status", (q) => q.eq("status", "published"))
        .order("desc");
    } else {
      // Default: deadline sort
      baseQuery = ctx.db
        .query("scholarships")
        .withIndex("by_status_deadline", (q) => q.eq("status", "published"));
    }

    // Take a bounded set and post-filter
    const allResults = await baseQuery.take(500);
    const now = Date.now();

    const filtered = allResults.filter((s) => {
      // Exclude expired unless showing closed
      if (s.application_deadline && s.application_deadline < now) return false;
      return matchesCollectionFilters(s, collection);
    });

    const total = filtered.length;
    const scholarships = filtered.slice(offset, offset + limit);

    return { scholarships, total };
  },
});

/**
 * Get featured collections for display on the directory page.
 */
export const getFeaturedCollections = query({
  args: {},
  handler: async (ctx) => {
    const collections = await ctx.db
      .query("collections")
      .withIndex("by_featured", (q) => q.eq("is_featured", true).eq("status", "active"))
      .take(6);

    // Sort by sort_order
    return collections.sort((a, b) => a.sort_order - b.sort_order);
  },
});

/**
 * Get all active collections for the browse page.
 */
export const getAllCollections = query({
  args: {},
  handler: async (ctx) => {
    const collections = await ctx.db
      .query("collections")
      .withIndex("by_sort_order", (q) => q.eq("status", "active"))
      .collect();

    return collections;
  },
});

/**
 * Record a collection view (debounced by client).
 */
export const recordCollectionView = mutation({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const collection = await ctx.db
      .query("collections")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (collection) {
      await ctx.db.patch(collection._id, {
        view_count: collection.view_count + 1,
      });
    }
  },
});

/**
 * Find which collections a scholarship belongs to (D-50).
 * Tests a single scholarship against all active collections' filter criteria.
 */
export const getScholarshipCollections = query({
  args: { scholarshipId: v.id("scholarships") },
  handler: async (ctx, args) => {
    const scholarship = await ctx.db.get(args.scholarshipId);
    if (!scholarship) return [];

    const activeCollections = await ctx.db
      .query("collections")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    return activeCollections
      .filter((collection) => matchesCollectionFilters(scholarship as any, collection))
      .map((c) => ({
        name: c.name,
        slug: c.slug,
        emoji: c.emoji,
      }));
  },
});

// ---- Admin Queries ----

/**
 * Get all collections for admin (any status).
 */
export const getAdminCollections = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("collections").collect();
  },
});

// ---- Admin Mutations ----

/**
 * Create a new collection.
 * Auto-generates slug from name, checks uniqueness, computes initial scholarship_count.
 */
export const createCollection = mutation({
  args: {
    name: v.string(),
    emoji: v.string(),
    description: v.optional(v.string()),
    status: collectionStatusValidator,
    is_featured: v.boolean(),
    sort_order: v.number(),
    default_sort: v.optional(v.string()),
    host_countries: v.optional(v.array(v.string())),
    degree_levels: v.optional(v.array(degreeLevelValidator)),
    funding_types: v.optional(v.array(fundingTypeValidator)),
    fields_of_study: v.optional(v.array(v.string())),
    prestige_tiers: v.optional(v.array(prestigeTierValidator)),
    tags: v.optional(v.array(v.string())),
    deadline_before: v.optional(v.number()),
    deadline_after: v.optional(v.number()),
    added_since: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const slug = generateSlug(args.name);

    // Check slug uniqueness
    const existing = await ctx.db
      .query("collections")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    if (existing) {
      throw new Error(`A collection with slug "${slug}" already exists`);
    }

    // Compute initial scholarship count
    const count = await countMatchingScholarships(ctx, args);
    const now = Date.now();

    const id = await ctx.db.insert("collections", {
      ...args,
      slug,
      scholarship_count: count,
      view_count: 0,
      created_at: now,
      updated_at: now,
    });

    return id;
  },
});

/**
 * Update a collection.
 * Recomputes scholarship_count if filter criteria changed.
 */
export const updateCollection = mutation({
  args: {
    collectionId: v.id("collections"),
    updates: v.object({
      name: v.optional(v.string()),
      emoji: v.optional(v.string()),
      description: v.optional(v.string()),
      status: v.optional(collectionStatusValidator),
      is_featured: v.optional(v.boolean()),
      sort_order: v.optional(v.number()),
      default_sort: v.optional(v.string()),
      host_countries: v.optional(v.array(v.string())),
      degree_levels: v.optional(v.array(degreeLevelValidator)),
      funding_types: v.optional(v.array(fundingTypeValidator)),
      fields_of_study: v.optional(v.array(v.string())),
      prestige_tiers: v.optional(v.array(prestigeTierValidator)),
      tags: v.optional(v.array(v.string())),
      deadline_before: v.optional(v.number()),
      deadline_after: v.optional(v.number()),
      added_since: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.collectionId);
    if (!existing) throw new Error("Collection not found");

    // Merge updates with existing to compute new count
    const merged = { ...existing, ...args.updates };
    const count = await countMatchingScholarships(ctx, merged);

    await ctx.db.patch(args.collectionId, {
      ...args.updates,
      scholarship_count: count,
      updated_at: Date.now(),
    });
  },
});

/**
 * Delete a collection.
 */
export const deleteCollection = mutation({
  args: { collectionId: v.id("collections") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.collectionId);
    if (!existing) throw new Error("Collection not found");
    await ctx.db.delete(args.collectionId);
  },
});

/**
 * Bulk update collection status.
 */
export const bulkUpdateCollectionStatus = mutation({
  args: {
    collectionIds: v.array(v.id("collections")),
    status: collectionStatusValidator,
  },
  handler: async (ctx, args) => {
    for (const id of args.collectionIds) {
      await ctx.db.patch(id, {
        status: args.status,
        updated_at: Date.now(),
      });
    }
    return { updated: args.collectionIds.length };
  },
});

/**
 * Preview matching scholarships for ad-hoc filter criteria (admin edit form).
 * Returns count + first 5 matching scholarships.
 */
export const getCollectionPreview = query({
  args: {
    host_countries: v.optional(v.array(v.string())),
    degree_levels: v.optional(v.array(degreeLevelValidator)),
    funding_types: v.optional(v.array(fundingTypeValidator)),
    fields_of_study: v.optional(v.array(v.string())),
    prestige_tiers: v.optional(v.array(prestigeTierValidator)),
    tags: v.optional(v.array(v.string())),
    deadline_before: v.optional(v.number()),
    deadline_after: v.optional(v.number()),
    added_since: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const published = await ctx.db
      .query("scholarships")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .take(500);

    const now = Date.now();
    const matching = published.filter((s) => {
      if (s.application_deadline && s.application_deadline < now) return false;
      return matchesCollectionFilters(s as any, args);
    });

    return {
      count: matching.length,
      preview: matching.slice(0, 5).map((s) => ({
        _id: s._id,
        title: s.title,
        host_country: s.host_country,
        funding_type: s.funding_type,
        prestige_tier: s.prestige_tier,
      })),
    };
  },
});

// ---- Internal: Cron-driven batch recompute ----

/**
 * Recompute scholarship_count for all active collections.
 * Called by daily cron for eventual consistency (D-90).
 * Paginates through collections in batches of 50.
 */
export const recomputeAllCounts = internalMutation({
  args: {
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const collections = await ctx.db
      .query("collections")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .take(50);

    const published = await ctx.db
      .query("scholarships")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .take(5000);

    const now = Date.now();
    for (const collection of collections) {
      const count = published.filter((s) => {
        if (s.application_deadline && s.application_deadline < now) return false;
        return matchesCollectionFilters(s as any, collection);
      }).length;

      if (count !== collection.scholarship_count) {
        await ctx.db.patch(collection._id, { scholarship_count: count });
      }
    }
  },
});
