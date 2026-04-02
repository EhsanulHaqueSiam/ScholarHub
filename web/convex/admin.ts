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
import { determineStatus, hasAdminAccess, hasRequiredFields, isAdmin } from "./adminHelpers";
import {
  scholarshipStatusValidator,
  scholarshipTypeValidator,
  trustLevelValidator,
} from "./schema";
import { wrapDB } from "./triggers";

const triggeredMutation = customMutation(rawMutation, customCtx(wrapDB));
const triggeredInternalMutation = customMutation(rawInternalMutation, customCtx(wrapDB));
const ADMIN_REVIEW_QUEUE_MAX_LIMIT = 100;
const ADMIN_PUBLISHED_RECENT_SCAN_CAP = 500;
const ADMIN_PENDING_SOURCE_SCAN_CAP = 2000;
const ADMIN_DUP_CHECK_PER_SCHOLARSHIP_CAP = 8;
const ADMIN_SOURCE_LIST_MAX_LIMIT = 1200;
const ADMIN_REVIEW_TEXT_PREVIEW_CHARS = 420;
const ADMIN_DASHBOARD_STATUSES = ["pending_review", "published", "rejected", "archived"] as const;
type AdminDashboardStatus = (typeof ADMIN_DASHBOARD_STATUSES)[number];

async function getCachedStatusCounts(
  ctx: { db: any },
): Promise<Record<AdminDashboardStatus, number | null>> {
  const rows = await Promise.all(
    ADMIN_DASHBOARD_STATUSES.map(async (status) => {
      const row = await ctx.db
        .query("scholarship_counts")
        .withIndex("by_status", (q: any) => q.eq("status", status))
        .first();
      return [status, row?.count ?? null] as const;
    }),
  );

  return {
    pending_review: rows[0][1],
    published: rows[1][1],
    rejected: rows[2][1],
    archived: rows[3][1],
  };
}

async function countPublishedSince(ctx: { db: any }, sinceTs: number): Promise<number> {
  const rows = await ctx.db
    .query("scholarships")
    .withIndex("by_status", (q: any) => q.eq("status", "published"))
    .order("desc")
    .take(ADMIN_PUBLISHED_RECENT_SCAN_CAP);

  let total = 0;
  for (const scholarship of rows) {
    if (scholarship._creationTime > sinceTs) {
      total += 1;
    } else {
      break;
    }
  }
  return total;
}

async function countPendingScholarshipsForSource(ctx: { db: any }, sourceId: any): Promise<number> {
  const rows = await ctx.db
    .query("scholarships")
    .withIndex("by_status", (q: any) => q.eq("status", "pending_review"))
    .take(ADMIN_PENDING_SOURCE_SCAN_CAP);

  let total = 0;
  for (const scholarship of rows) {
    if (scholarship.source_ids.includes(sourceId)) {
      total += 1;
    }
  }
  return total;
}

function toQueuePreviewText(value?: string | null): string | undefined {
  if (!value) return undefined;
  if (value.length <= ADMIN_REVIEW_TEXT_PREVIEW_CHARS) return value;
  return `${value.slice(0, ADMIN_REVIEW_TEXT_PREVIEW_CHARS).trimEnd()}...`;
}

// ---------- Queries ----------

/**
 * Check whether current viewer can access admin features.
 * Returns boolean without throwing.
 */
export const getAdminAccess = query({
  args: {},
  handler: async (ctx) => {
    return await hasAdminAccess(ctx);
  },
});

/**
 * Get admin dashboard statistics.
 * Counts scholarships by status, today's published count, and source health summary.
 */
export const getAdminStats = query({
  args: {},
  handler: async (ctx) => {
    await isAdmin(ctx);

    const oneDayAgo = Date.now() - 86400000;
    const cachedCounts = await getCachedStatusCounts(ctx);
    const [publishedToday] = await Promise.all([countPublishedSince(ctx, oneDayAgo)]);

    // Cache-only status totals: avoid full-table fallback scans in this hot query.
    const pending = cachedCounts.pending_review ?? 0;
    const published = cachedCounts.published ?? 0;
    const rejected = cachedCounts.rejected ?? 0;
    const archived = cachedCounts.archived ?? 0;

    const total = pending + published + rejected + archived;

    // Derive source health from the lightweight sources table to avoid repeatedly
    // reading large source_health error payloads on every admin dashboard refresh.
    const sources = await ctx.db
      .query("sources")
      .withIndex("by_name")
      .take(ADMIN_SOURCE_LIST_MAX_LIMIT);

    let healthy = 0;
    let degraded = 0;
    let failing = 0;

    for (const source of sources) {
      if (!source.is_active) {
        failing += 1;
        continue;
      }
      const failures = source.consecutive_failures ?? 0;
      if (failures <= 0) {
        healthy += 1;
      } else if (failures < 3) {
        degraded += 1;
      } else {
        failing += 1;
      }
    }

    const sourceHealth = {
      healthy,
      degraded,
      failing,
      total: sources.length,
    };

    return {
      total,
      pending,
      published,
      rejected,
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
    includePossibleDuplicate: v.optional(v.boolean()),
    includeResolvedSources: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await isAdmin(ctx);

    const limit = Math.max(1, Math.min(args.limit ?? 200, ADMIN_REVIEW_QUEUE_MAX_LIMIT));
    const includePossibleDuplicate = args.includePossibleDuplicate ?? true;
    const includeResolvedSources =
      args.includeResolvedSources ??
      !(args.status === "published" && includePossibleDuplicate === false);

    const scholarships = args.status
      ? await ctx.db
        .query("scholarships")
        .withIndex("by_status", (q) => q.eq("status", args.status))
        .take(limit)
      : // No status filter = newest first, bounded.
        await ctx.db.query("scholarships").order("desc").take(limit);

    const sourceMap = new Map<string, any>();
    if (includeResolvedSources) {
      const uniqueSourceIds = [...new Set(scholarships.flatMap((s) => s.source_ids.map(String)))];
      await Promise.all(
        uniqueSourceIds.map(async (sourceId) => {
          const source = await ctx.db.get(sourceId);
          if (source) sourceMap.set(sourceId, source);
        }),
      );
    }

    const pendingScholarshipIdsForDupCheck = includePossibleDuplicate
      ? scholarships.filter((s) => s.status === "pending_review").map((s) => s._id)
      : [];

    const possibleDuplicateIds = new Set<string>();
    if (includePossibleDuplicate && pendingScholarshipIdsForDupCheck.length > 0) {
      // Query only the pending scholarships currently on screen instead of scanning
      // a large global possible-duplicate set from raw_records (which can carry heavy raw_data).
      await Promise.all(
        pendingScholarshipIdsForDupCheck.map(async (scholarshipId) => {
          const rawRows = await ctx.db
            .query("raw_records")
            .withIndex("by_canonical", (q) => q.eq("canonical_id", scholarshipId))
            .order("desc")
            .take(ADMIN_DUP_CHECK_PER_SCHOLARSHIP_CAP);

          if (rawRows.some((row) => row.match_status === "possible_duplicate")) {
            possibleDuplicateIds.add(String(scholarshipId));
          }
        }),
      );
    }

    const enriched = scholarships.map((scholarship) => {
      const resolved_sources = includeResolvedSources
        ? scholarship.source_ids
            .map((sourceId) => {
              const source = sourceMap.get(String(sourceId));
              if (!source) return null;
              return {
                _id: source._id,
                name: source.name,
                category: source.category,
                trust_level: source.trust_level,
              };
            })
            .filter((s): s is NonNullable<typeof s> => s !== null)
        : [];

      const has_possible_duplicate =
        includePossibleDuplicate &&
        scholarship.status === "pending_review" &&
        possibleDuplicateIds.has(String(scholarship._id));

      return {
        _id: scholarship._id,
        _creationTime: scholarship._creationTime,
        title: scholarship.title,
        slug: scholarship.slug,
        status: scholarship.status,
        host_country: scholarship.host_country,
        degree_levels: scholarship.degree_levels,
        application_deadline: scholarship.application_deadline,
        application_deadline_text: scholarship.application_deadline_text,
        description: toQueuePreviewText(scholarship.description),
        fields_of_study: scholarship.fields_of_study,
        eligibility_nationalities: scholarship.eligibility_nationalities,
        funding_type: scholarship.funding_type,
        funding_amount_min: scholarship.award_amount_min,
        funding_amount_max: scholarship.award_amount_max,
        award_currency: scholarship.award_currency,
        application_url: scholarship.application_url,
        editorial_notes: toQueuePreviewText(scholarship.editorial_notes),
        match_key: scholarship.match_key,
        source_ids: scholarship.source_ids,
        tags: scholarship.tags,
        suggested_tags: scholarship.suggested_tags,
        resolved_sources,
        has_possible_duplicate,
      };
    });

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
    await isAdmin(ctx);

    return await ctx.db
      .query("scholarship_revisions")
      .withIndex("by_scholarship", (q) => q.eq("scholarship_id", args.scholarshipId))
      .order("desc")
      .take(200);
  },
});

/**
 * Get a single scholarship for editing in the admin panel.
 */
export const getScholarshipForEdit = query({
  args: { scholarshipId: v.id("scholarships") },
  handler: async (ctx, args) => {
    await isAdmin(ctx);

    return await ctx.db.get(args.scholarshipId);
  },
});

/**
 * Get all sources for the Source Trust Manager.
 * Returns all sources with their trust levels and categories.
 */
export const getAllSources = query({
  args: {
    activeOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await isAdmin(ctx);

    const limit = Math.max(1, Math.min(args.limit ?? ADMIN_SOURCE_LIST_MAX_LIMIT, ADMIN_SOURCE_LIST_MAX_LIMIT));
    if (args.activeOnly) {
      return await ctx.db
        .query("sources")
        .withIndex("by_active_category", (q) => q.eq("is_active", true))
        .take(limit);
    }

    return await ctx.db.query("sources").withIndex("by_name").take(limit);
  },
});

/**
 * Count pending scholarships affected by a source trust level change.
 * Used by SourceTrustManager to show impact before confirming.
 */
export const countAffectedScholarships = query({
  args: { sourceId: v.id("sources") },
  handler: async (ctx, args) => {
    await isAdmin(ctx);

    return await countPendingScholarshipsForSource(ctx, args.sourceId);
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
        .take(25);

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
          .take(25);

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
      funding_books: v.optional(v.boolean()),
      funding_research: v.optional(v.boolean()),
      scholarship_type: v.optional(scholarshipTypeValidator),
      application_tips: v.optional(v.string()),
      award_amount_min: v.optional(v.number()),
      award_amount_max: v.optional(v.number()),
      award_currency: v.optional(v.string()),
      application_deadline: v.optional(v.number()),
      application_deadline_text: v.optional(v.string()),
      application_url: v.optional(v.string()),
      editorial_notes: v.optional(v.string()),
      status: v.optional(scholarshipStatusValidator),
      provider_organization: v.optional(v.string()),
      study_info: v.optional(
        v.object({
          tuition_undergrad: v.optional(v.string()),
          tuition_postgrad: v.optional(v.string()),
          tuition_phd: v.optional(v.string()),
          tuition_mba: v.optional(v.string()),
          living_cost_note: v.optional(v.string()),
          cost_accommodation: v.optional(v.string()),
          cost_food: v.optional(v.string()),
          cost_transport: v.optional(v.string()),
          cost_utilities: v.optional(v.string()),
          admission_requirements: v.optional(v.string()),
          lang_ielts: v.optional(v.string()),
          lang_toefl: v.optional(v.string()),
          lang_pte: v.optional(v.string()),
          visa_documents: v.optional(v.string()),
          intake_main_name: v.optional(v.string()),
          intake_main_months: v.optional(v.string()),
          intake_secondary_name: v.optional(v.string()),
          intake_secondary_months: v.optional(v.string()),
          post_study_visa: v.optional(v.string()),
          post_study_duration: v.optional(v.string()),
          post_study_description: v.optional(v.string()),
        }),
      ),
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

    const affectedCount = await countPendingScholarshipsForSource(ctx, args.sourceId);

    // Schedule retroactive re-evaluation
    await ctx.scheduler.runAfter(0, internal.admin.reevaluateSourceScholarships, {
      sourceId: args.sourceId,
      batchSize: 50,
      cursor: undefined,
      processed: 0,
    });

    return { updated: true, affectedCount };
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
    cursor: v.optional(v.string()),
    processed: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = Math.max(1, Math.min(args.batchSize ?? 50, 100));
    let promoted = 0;

    const page = await ctx.db
      .query("scholarships")
      .withIndex("by_status", (q) => q.eq("status", "pending_review"))
      .paginate({
        cursor: args.cursor ?? null,
        numItems: batchSize,
      });

    const pendingScholarships = page.page;
    if (pendingScholarships.length === 0) {
      return {
        promoted: 0,
        processed: args.processed ?? 0,
        complete: true,
        nextCursor: null,
      };
    }

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

    const processed = (args.processed ?? 0) + pendingScholarships.length;
    if (!page.isDone) {
      await ctx.scheduler.runAfter(500, internal.admin.reevaluateSourceScholarships, {
        sourceId: args.sourceId,
        batchSize,
        cursor: page.continueCursor,
        processed,
      });
    }

    return {
      promoted,
      processed,
      complete: page.isDone,
      nextCursor: page.isDone ? null : page.continueCursor,
    };
  },
});
