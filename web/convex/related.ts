/**
 * Related scholarships scoring algorithm and precomputation.
 *
 * Multi-factor weighted scoring: Provider 35%, Country 25%, Degree 15%, Funding 15%, Tags 10%.
 * Weights are admin-configurable via the related_weights table.
 * Related IDs are precomputed on write and stored on each scholarship.
 */

import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

// ---- Constants ----

export const DEFAULT_RELATED_WEIGHTS = {
  provider: 35,
  country: 25,
  degree: 15,
  funding: 15,
  tags: 10,
};

export type RelatedWeights = typeof DEFAULT_RELATED_WEIGHTS;

// ---- Pure Functions ----

/**
 * Count common elements between two arrays.
 */
export function intersectionSize(a: string[], b: string[]): number {
  const setB = new Set(b);
  return a.filter((item) => setB.has(item)).length;
}

/**
 * Score how related a candidate scholarship is to a source scholarship.
 * Returns a weighted score (0-100 range).
 */
export function scoreRelated(
  source: {
    provider_organization: string;
    host_country: string;
    degree_levels: string[];
    funding_type: string;
    tags?: string[] | null;
  },
  candidate: {
    provider_organization: string;
    host_country: string;
    degree_levels: string[];
    funding_type: string;
    tags?: string[] | null;
  },
  weights: RelatedWeights = DEFAULT_RELATED_WEIGHTS,
): number {
  let score = 0;

  // Provider match (exact string match)
  if (source.provider_organization === candidate.provider_organization) {
    score += weights.provider;
  }

  // Country match (exact string match)
  if (source.host_country === candidate.host_country) {
    score += weights.country;
  }

  // Degree overlap (proportional)
  if (source.degree_levels.length > 0) {
    const overlap = intersectionSize(source.degree_levels, candidate.degree_levels);
    score += (overlap / Math.max(source.degree_levels.length, 1)) * weights.degree;
  }

  // Funding match (exact)
  if (source.funding_type === candidate.funding_type) {
    score += weights.funding;
  }

  // Tag overlap (proportional)
  const sourceTags = source.tags ?? [];
  const candidateTags = candidate.tags ?? [];
  if (sourceTags.length > 0) {
    const overlap = intersectionSize(sourceTags, candidateTags);
    score += (overlap / sourceTags.length) * weights.tags;
  }

  return score;
}

/**
 * Compute related scholarship IDs for a given scholarship document.
 * Queries published scholarships, scores each, returns top 6.
 */
export async function computeRelatedIds(
  ctx: { db: any },
  doc: {
    _id: any;
    provider_organization: string;
    host_country: string;
    degree_levels: string[];
    funding_type: string;
    tags?: string[] | null;
    status?: string;
  },
  weightsOverride?: RelatedWeights,
): Promise<any[]> {
  // Get weights from table or use defaults
  let weights = weightsOverride;
  if (!weights) {
    const storedWeights = await ctx.db.query("related_weights").first();
    weights = storedWeights
      ? {
          provider: storedWeights.provider,
          country: storedWeights.country,
          degree: storedWeights.degree,
          funding: storedWeights.funding,
          tags: storedWeights.tags,
        }
      : DEFAULT_RELATED_WEIGHTS;
  }

  // Query published scholarships (bounded to 50 per anti-pattern warning)
  const candidates = await ctx.db
    .query("scholarships")
    .withIndex("by_status", (q: any) => q.eq("status", "published"))
    .take(50);

  const now = Date.now();

  // Score and filter candidates
  const scored = candidates
    .filter((c: any) => {
      // Exclude self
      if (c._id === doc._id) return false;
      // Exclude expired
      if (c.application_deadline && c.application_deadline < now) return false;
      // Exclude archived
      if (c.status === "archived") return false;
      return true;
    })
    .map((c: any) => ({
      id: c._id,
      score: scoreRelated(
        {
          provider_organization: doc.provider_organization,
          host_country: doc.host_country,
          degree_levels: doc.degree_levels,
          funding_type: doc.funding_type,
          tags: doc.tags,
        },
        {
          provider_organization: c.provider_organization,
          host_country: c.host_country,
          degree_levels: c.degree_levels,
          funding_type: c.funding_type,
          tags: c.tags,
        },
        weights,
      ),
    }))
    .filter((item: { score: number }) => item.score > 0);

  // Sort by score descending, take top 6
  scored.sort((a: { score: number }, b: { score: number }) => b.score - a.score);
  return scored.slice(0, 6).map((item: { id: any }) => item.id);
}

// ---- Convex Queries ----

/**
 * Get related scholarships for a given scholarship.
 * Reads precomputed related_ids and fetches each document.
 */
export const getRelatedScholarships = query({
  args: { scholarshipId: v.id("scholarships") },
  handler: async (ctx, args) => {
    const scholarship = await ctx.db.get(args.scholarshipId);
    if (!scholarship || !scholarship.related_ids) return [];

    const related = await Promise.all(
      scholarship.related_ids.map(async (id) => {
        const doc = await ctx.db.get(id);
        // Only return published, non-expired scholarships
        if (!doc || doc.status !== "published") return null;
        if (doc.application_deadline && doc.application_deadline < Date.now()) return null;
        return doc;
      }),
    );

    return related.filter((r): r is NonNullable<typeof r> => r !== null);
  },
});

/**
 * Get current related weights configuration for admin.
 */
export const getRelatedWeights = query({
  args: {},
  handler: async (ctx) => {
    const stored = await ctx.db.query("related_weights").first();
    return stored ?? { ...DEFAULT_RELATED_WEIGHTS, updated_at: 0 };
  },
});

/**
 * Update related weights configuration (admin only).
 */
export const updateRelatedWeights = mutation({
  args: {
    provider: v.number(),
    country: v.number(),
    degree: v.number(),
    funding: v.number(),
    tags: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("related_weights").first();
    const data = {
      provider: args.provider,
      country: args.country,
      degree: args.degree,
      funding: args.funding,
      tags: args.tags,
      updated_at: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
    } else {
      await ctx.db.insert("related_weights", data);
    }
  },
});

// ---- Internal Mutations (for cron jobs) ----

/**
 * Refresh related_ids for all published scholarships (Pitfall 1: reverse updates).
 * Called by daily cron. Processes in batches of 50, schedules next batch if more.
 */
export const refreshAllRelatedIds = internalMutation({
  args: {
    cursor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = 50;
    const startIndex = args.cursor ?? 0;

    // Get all published scholarships for this batch
    const allPublished = await ctx.db
      .query("scholarships")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .take(startIndex + batchSize);

    const batch = allPublished.slice(startIndex, startIndex + batchSize);
    if (batch.length === 0) return { processed: 0, done: true };

    let updated = 0;

    for (const scholarship of batch) {
      const newRelatedIds = await computeRelatedIds(ctx, scholarship);
      const currentIds = scholarship.related_ids ?? [];

      // Only patch if changed
      const changed =
        newRelatedIds.length !== currentIds.length ||
        newRelatedIds.some((id, i) => id !== currentIds[i]);

      if (changed) {
        await ctx.db.patch(scholarship._id, { related_ids: newRelatedIds });
        updated++;
      }
    }

    // Schedule next batch if there are more
    const nextIndex = startIndex + batchSize;
    if (batch.length === batchSize) {
      await ctx.scheduler.runAfter(0, internal.related.refreshAllRelatedIds, {
        cursor: nextIndex,
      });
    }

    return { processed: batch.length, updated, done: batch.length < batchSize };
  },
});
