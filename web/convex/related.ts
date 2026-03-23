/**
 * Related scholarships scoring algorithm and precomputation.
 *
 * Multi-factor weighted scoring: Provider 35%, Country 25%, Degree 15%, Funding 15%, Tags 10%.
 * Weights are admin-configurable via the related_weights table.
 * Related IDs are precomputed on write and stored on each scholarship.
 */

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, mutation, query } from "./_generated/server";

// ---- Constants ----

export const DEFAULT_RELATED_WEIGHTS = {
  provider: 35,
  country: 25,
  degree: 15,
  funding: 15,
  tags: 10,
};

export type RelatedWeights = typeof DEFAULT_RELATED_WEIGHTS;
const MAX_COUNTRY_CANDIDATES = 40;
const MAX_GLOBAL_CANDIDATES = 30;
const RELATED_REFRESH_BATCH_SIZE = 60;

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

  // Blend same-country candidates with global fallback for better relevance
  // and lower read amplification than repeatedly scanning broad status lists.
  const [sameCountryCandidates, globalCandidates] = await Promise.all([
    ctx.db
      .query("scholarships")
      .withIndex("by_country_status", (q: any) =>
        q.eq("host_country", doc.host_country).eq("status", "published"),
      )
      .take(MAX_COUNTRY_CANDIDATES),
    ctx.db
      .query("scholarships")
      .withIndex("by_status", (q: any) => q.eq("status", "published"))
      .take(MAX_GLOBAL_CANDIDATES),
  ]);

  const candidatesById = new Map<any, any>();
  for (const candidate of sameCountryCandidates) {
    candidatesById.set(candidate._id, candidate);
  }
  for (const candidate of globalCandidates) {
    candidatesById.set(candidate._id, candidate);
  }
  const candidates = [...candidatesById.values()];

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

// ---- Internal: Cron-driven batch refresh ----

/**
 * Refresh related_ids for all published scholarships.
 * Called by daily cron to keep related scholarships up-to-date.
 * Processes in batches of 100, self-schedules continuation.
 */
export const refreshAllRelatedIds = internalMutation({
  args: {
    cursor: v.optional(v.string()),
    processed: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("scholarships")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .paginate({
        cursor: args.cursor ?? null,
        numItems: RELATED_REFRESH_BATCH_SIZE,
      });

    const scholarships = page.page;
    if (scholarships.length === 0) {
      return { processed: args.processed ?? 0, complete: true };
    }

    for (const scholarship of scholarships) {
      const newRelatedIds = await computeRelatedIds(ctx, scholarship);
      const current = scholarship.related_ids ?? [];
      const changed =
        current.length !== newRelatedIds.length || current.some((id, i) => id !== newRelatedIds[i]);

      if (changed) {
        await ctx.db.patch(scholarship._id, { related_ids: newRelatedIds });
      }
    }

    const processed = (args.processed ?? 0) + scholarships.length;
    if (!page.isDone) {
      await ctx.scheduler.runAfter(0, internal.related.refreshAllRelatedIds, {
        cursor: page.continueCursor,
        processed,
      });
    }

    return { processed, complete: page.isDone };
  },
});
