/**
 * Admin dashboard queries and mutations.
 *
 * Provides:
 * - getAdminStats: Dashboard statistics (counts by status, source health)
 * - getReviewQueue: Filtered scholarship queue with resolved sources
 * - approveScholarship / rejectScholarship: Single-item status changes
 * - bulkApprove / bulkReject: Batch status changes with dedup enforcement
 * - updateScholarship: Edit with revision tracking
 * - getRevisionHistory: Audit trail for a scholarship
 * - updateSourceTrust: Change source trust level with retroactive re-evaluation
 * - reevaluateSourceScholarships: Internal batch re-evaluation after trust change
 */

import { v } from "convex/values";
import { customCtx, customMutation } from "convex-helpers/server/customFunctions";
import { internal } from "./_generated/api";
import {
  mutation,
  query,
  internalMutation as rawInternalMutation,
  mutation as rawMutation,
} from "./_generated/server";
import { determineStatus, hasRequiredFields, isAdmin } from "./adminHelpers";
import { scholarshipStatusValidator, trustLevelValidator } from "./schema";
import { wrapDB } from "./triggers";

const triggeredMutation = customMutation(rawMutation, customCtx(wrapDB));
const triggeredInternalMutation = customMutation(rawInternalMutation, customCtx(wrapDB));

// ---------- Queries ----------

/**
 * Get admin dashboard statistics.
 * Counts scholarships by status, today's published count, and source health summary.
 */
export const getAdminStats = query({
  args: {},
  handler: async (ctx) => {
    // Count scholarships by status
    const pending = await ctx.db
      .query("scholarships")
      .withIndex("by_status", (q) => q.eq("status", "pending_review"))
      .take(10000);

    const published = await ctx.db
      .query("scholarships")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .take(10000);

    const rejected = await ctx.db
      .query("scholarships")
      .withIndex("by_status", (q) => q.eq("status", "rejected"))
      .take(10000);

    const archived = await ctx.db
      .query("scholarships")
      .withIndex("by_status", (q) => q.eq("status", "archived"))
      .take(10000);

    const total = pending.length + published.length + rejected.length + archived.length;

    // Count published today
    const oneDayAgo = Date.now() - 86400000;
    const publishedToday = published.filter((s) => s._creationTime > oneDayAgo).length;

    // Source health counts
    const healthRecords = await ctx.db.query("source_health").collect();
    const sourceHealth = {
      healthy: healthRecords.filter((h) => h.status === "healthy").length,
      degraded: healthRecords.filter((h) => h.status === "degraded").length,
      failing: healthRecords.filter((h) => h.status === "failing" || h.status === "deactivated")
        .length,
    };

    return {
      total,
      pending: pending.length,
      published: published.length,
      rejected: rejected.length,
      publishedToday,
      sourceHealth,
    };
  },
});

/**
 * Get the review queue: scholarships filtered by status with resolved source info.
 * Enriches each scholarship with resolved_sources and has_possible_duplicate flag.
 */
export const getReviewQueue = query({
  args: {
    status: v.optional(scholarshipStatusValidator),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 200;

    let scholarships;
    if (args.status) {
      scholarships = await ctx.db
        .query("scholarships")
        .withIndex("by_status", (q) => q.eq("status", args.status))
        .take(limit);
    } else {
      // No status filter = return all scholarships
      scholarships = await ctx.db.query("scholarships").take(limit);
    }

    // Enrich each scholarship with source info and duplicate flags
    const enriched = await Promise.all(
      scholarships.map(async (scholarship) => {
        // Resolve source details
        const resolved_sources = await Promise.all(
          scholarship.source_ids.map(async (sourceId) => {
            const source = await ctx.db.get(sourceId);
            if (!source) return null;
            return {
              _id: source._id,
              name: source.name,
              category: source.category,
              trust_level: source.trust_level,
            };
          }),
        );

        // Check for possible duplicate raw_records
        const linkedRecords = await ctx.db
          .query("raw_records")
          .withIndex("by_canonical", (q) => q.eq("canonical_id", scholarship._id))
          .collect();

        const has_possible_duplicate = linkedRecords.some(
          (r) => r.match_status === "possible_duplicate",
        );

        return {
          ...scholarship,
          resolved_sources: resolved_sources.filter(Boolean),
          has_possible_duplicate,
        };
      }),
    );

    return enriched;
  },
});

/**
 * Get revision history for a scholarship, sorted by changed_at descending.
 */
export const getRevisionHistory = query({
  args: {
    scholarshipId: v.id("scholarships"),
  },
  handler: async (ctx, args) => {
    const revisions = await ctx.db
      .query("scholarship_revisions")
      .withIndex("by_scholarship", (q) => q.eq("scholarship_id", args.scholarshipId))
      .collect();

    // Sort by changed_at descending (most recent first)
    return revisions.sort((a, b) => b.changed_at - a.changed_at);
  },
});

/**
 * Get a single scholarship for editing in the admin panel.
 */
export const getScholarshipForEdit = query({
  args: { scholarshipId: v.id("scholarships") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.scholarshipId);
  },
});

/**
 * Get all sources for the Source Trust Manager.
 * Returns all sources with their trust levels and categories.
 */
export const getAllSources = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("sources").collect();
  },
});

/**
 * Count pending scholarships affected by a source trust level change.
 * Used by SourceTrustManager to show impact before confirming.
 */
export const countAffectedScholarships = query({
  args: { sourceId: v.id("sources") },
  handler: async (ctx, args) => {
    const pendingScholarships = await ctx.db
      .query("scholarships")
      .withIndex("by_status", (q) => q.eq("status", "pending_review"))
      .take(10000);

    return pendingScholarships.filter((s) => s.source_ids.includes(args.sourceId)).length;
  },
});

// ---------- Mutations ----------

/**
 * Approve a single scholarship (pending_review -> published).
 * ADMN-08: Blocks approval if a published scholarship with the same match_key exists.
 */
export const approveScholarship = triggeredMutation({
  args: {
    scholarshipId: v.id("scholarships"),
  },
  handler: async (ctx, args) => {
    await isAdmin(ctx);

    const scholarship = await ctx.db.get(args.scholarshipId);
    if (!scholarship) throw new Error("Scholarship not found");
    if (scholarship.status !== "pending_review") {
      throw new Error(`Cannot approve scholarship with status "${scholarship.status}"`);
    }

    // ADMN-08: Dedup check - prevent approving if same match_key already published
    if (scholarship.match_key) {
      const existing = await ctx.db
        .query("scholarships")
        .withIndex("by_match_key", (q) => q.eq("match_key", scholarship.match_key))
        .collect();

      const publishedDuplicate = existing.find(
        (s) => s._id !== args.scholarshipId && s.status === "published",
      );

      if (publishedDuplicate) {
        throw new Error(
          `Cannot approve: a published scholarship with the same title and organization already exists. Duplicate ID: ${publishedDuplicate._id}`,
        );
      }
    }

    await ctx.db.patch(args.scholarshipId, { status: "published" });
  },
});

/**
 * Reject a single scholarship.
 */
export const rejectScholarship = triggeredMutation({
  args: {
    scholarshipId: v.id("scholarships"),
  },
  handler: async (ctx, args) => {
    await isAdmin(ctx);

    const scholarship = await ctx.db.get(args.scholarshipId);
    if (!scholarship) throw new Error("Scholarship not found");

    await ctx.db.patch(args.scholarshipId, { status: "rejected" });
  },
});

/**
 * Bulk approve multiple scholarships.
 * Enforces dedup within the batch (Set of approved match_keys) and against existing published.
 * Returns counts of approved and blocked items.
 */
export const bulkApprove = triggeredMutation({
  args: {
    scholarshipIds: v.array(v.id("scholarships")),
  },
  handler: async (ctx, args) => {
    await isAdmin(ctx);

    let approved = 0;
    let blocked = 0;
    const approvedMatchKeys = new Set<string>();

    for (const scholarshipId of args.scholarshipIds) {
      const scholarship = await ctx.db.get(scholarshipId);
      if (!scholarship || scholarship.status !== "pending_review") {
        blocked++;
        continue;
      }

      // Dedup check against existing published scholarships
      if (scholarship.match_key) {
        const existing = await ctx.db
          .query("scholarships")
          .withIndex("by_match_key", (q) => q.eq("match_key", scholarship.match_key))
          .collect();

        const publishedDuplicate = existing.find(
          (s) => s._id !== scholarshipId && s.status === "published",
        );

        if (publishedDuplicate) {
          blocked++;
          continue;
        }

        // Dedup check within the current batch
        if (approvedMatchKeys.has(scholarship.match_key)) {
          blocked++;
          continue;
        }

        approvedMatchKeys.add(scholarship.match_key);
      }

      await ctx.db.patch(scholarshipId, { status: "published" });
      approved++;
    }

    return { approved, blocked };
  },
});

/**
 * Bulk reject multiple scholarships.
 * Returns count of rejected items.
 */
export const bulkReject = triggeredMutation({
  args: {
    scholarshipIds: v.array(v.id("scholarships")),
  },
  handler: async (ctx, args) => {
    await isAdmin(ctx);

    let rejected = 0;
    for (const scholarshipId of args.scholarshipIds) {
      const scholarship = await ctx.db.get(scholarshipId);
      if (!scholarship) continue;

      await ctx.db.patch(scholarshipId, { status: "rejected" });
      rejected++;
    }

    return { rejected };
  },
});

/**
 * Update a scholarship with revision tracking.
 * Records each changed field in scholarship_revisions for audit trail.
 */
export const updateScholarship = triggeredMutation({
  args: {
    scholarshipId: v.id("scholarships"),
    updates: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      host_country: v.optional(v.string()),
      eligibility_nationalities: v.optional(v.array(v.string())),
      degree_levels: v.optional(
        v.array(
          v.union(
            v.literal("bachelor"),
            v.literal("master"),
            v.literal("phd"),
            v.literal("postdoc"),
          ),
        ),
      ),
      fields_of_study: v.optional(v.array(v.string())),
      funding_type: v.optional(
        v.union(
          v.literal("fully_funded"),
          v.literal("partial"),
          v.literal("tuition_waiver"),
          v.literal("stipend_only"),
        ),
      ),
      funding_tuition: v.optional(v.boolean()),
      funding_living: v.optional(v.boolean()),
      funding_travel: v.optional(v.boolean()),
      funding_insurance: v.optional(v.boolean()),
      award_amount_min: v.optional(v.number()),
      award_amount_max: v.optional(v.number()),
      award_currency: v.optional(v.string()),
      application_deadline: v.optional(v.number()),
      application_deadline_text: v.optional(v.string()),
      application_url: v.optional(v.string()),
      editorial_notes: v.optional(v.string()),
      status: v.optional(scholarshipStatusValidator),
      provider_organization: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    await isAdmin(ctx);

    const existing = await ctx.db.get(args.scholarshipId);
    if (!existing) throw new Error("Scholarship not found");

    const now = Date.now();

    // Record revisions for each changed field
    for (const [key, newValue] of Object.entries(args.updates)) {
      if (newValue === undefined) continue;

      const oldValue = (existing as any)[key];
      const oldStr = oldValue !== undefined && oldValue !== null ? String(oldValue) : undefined;
      const newStr = newValue !== undefined && newValue !== null ? String(newValue) : undefined;

      if (oldStr !== newStr) {
        await ctx.db.insert("scholarship_revisions", {
          scholarship_id: args.scholarshipId,
          field_name: key,
          old_value: oldStr,
          new_value: newStr,
          changed_at: now,
        });
      }
    }

    // Apply the updates
    await ctx.db.patch(args.scholarshipId, args.updates);
  },
});

/**
 * Update a source's trust level and trigger retroactive re-evaluation.
 * Counts affected pending_review scholarships and schedules batch re-evaluation.
 */
export const updateSourceTrust = mutation({
  args: {
    sourceId: v.id("sources"),
    trustLevel: trustLevelValidator,
  },
  handler: async (ctx, args) => {
    await isAdmin(ctx);

    // Update the source trust level
    await ctx.db.patch(args.sourceId, { trust_level: args.trustLevel });

    // Count pending_review scholarships that include this source
    const pendingScholarships = await ctx.db
      .query("scholarships")
      .withIndex("by_status", (q) => q.eq("status", "pending_review"))
      .take(10000);

    const affected = pendingScholarships.filter((s) => s.source_ids.includes(args.sourceId));

    // Schedule retroactive re-evaluation
    await ctx.scheduler.runAfter(0, internal.admin.reevaluateSourceScholarships, {
      sourceId: args.sourceId,
    });

    return { updated: true, affectedCount: affected.length };
  },
});

/**
 * Retroactive re-evaluation of pending scholarships after a source trust change.
 * Promotes qualifying scholarships to "published" in batches.
 */
export const reevaluateSourceScholarships = triggeredInternalMutation({
  args: {
    sourceId: v.id("sources"),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? 50;
    let promoted = 0;

    // Get pending_review scholarships
    const pendingScholarships = await ctx.db
      .query("scholarships")
      .withIndex("by_status", (q) => q.eq("status", "pending_review"))
      .take(batchSize);

    for (const scholarship of pendingScholarships) {
      // Only re-evaluate scholarships that include this source
      if (!scholarship.source_ids.includes(args.sourceId)) continue;

      const newStatus = await determineStatus(ctx, scholarship.source_ids, {
        title: scholarship.title,
        description: scholarship.description,
        host_country: scholarship.host_country,
        application_url: scholarship.application_url,
      });

      if (newStatus === "published" && hasRequiredFields(scholarship)) {
        await ctx.db.patch(scholarship._id, { status: "published" });
        promoted++;
      }
    }

    // If batch was full, schedule next batch
    if (pendingScholarships.length === batchSize) {
      await ctx.scheduler.runAfter(0, internal.admin.reevaluateSourceScholarships, {
        sourceId: args.sourceId,
        batchSize,
      });
    }

    return { promoted };
  },
});
