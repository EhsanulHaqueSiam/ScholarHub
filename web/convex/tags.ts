/**
 * Tag management queries and mutations.
 *
 * Provides full CRUD surface for scholarship tags:
 * - getAllTags: Aggregate tag usage counts across all published scholarships
 * - getScholarshipTags: Get tags and suggested tags for a specific scholarship
 * - addTagToScholarship / removeTag: Single tag operations
 * - renameTag / deleteTag: Global tag operations with batch processing
 * - bulkAddTags: Apply multiple tags to multiple scholarships
 * - acceptSuggestedTag / rejectSuggestedTag: Suggested tag review workflow
 */

import { v } from "convex/values";
import { customCtx, customMutation } from "convex-helpers/server/customFunctions";
import { internal } from "./_generated/api";
import {
  query,
  mutation as rawMutation,
  internalMutation as rawInternalMutation,
} from "./_generated/server";
import { wrapDB } from "./triggers";
import { ALL_TAGS } from "../src/lib/tags";

const triggeredMutation = customMutation(rawMutation, customCtx(wrapDB));

// ---- Queries ----

/**
 * Get all tags with usage counts across published scholarships.
 * Includes predefined tags that have 0 usage.
 */
export const getAllTags = query({
  args: {},
  handler: async (ctx) => {
    const published = await ctx.db
      .query("scholarships")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .take(10000);

    // Count tag usage
    const tagCounts = new Map<string, number>();
    for (const scholarship of published) {
      for (const tag of scholarship.tags ?? []) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }
    }

    // Ensure predefined tags are always included
    for (const tagDef of ALL_TAGS) {
      if (!tagCounts.has(tagDef.id)) {
        tagCounts.set(tagDef.id, 0);
      }
    }

    // Sort by count descending
    const result = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);

    return result;
  },
});

/**
 * Get tags and suggested tags for a specific scholarship.
 */
export const getScholarshipTags = query({
  args: { scholarshipId: v.id("scholarships") },
  handler: async (ctx, args) => {
    const scholarship = await ctx.db.get(args.scholarshipId);
    if (!scholarship) return { tags: [], suggested_tags: [] };

    return {
      tags: scholarship.tags ?? [],
      suggested_tags: scholarship.suggested_tags ?? [],
    };
  },
});

// ---- Mutations ----

/**
 * Add a tag to a scholarship.
 * Uses trigger-wrapped mutation so prestige/search_text recomputes.
 */
export const addTagToScholarship = triggeredMutation({
  args: {
    scholarshipId: v.id("scholarships"),
    tag: v.string(),
  },
  handler: async (ctx, args) => {
    const scholarship = await ctx.db.get(args.scholarshipId);
    if (!scholarship) throw new Error("Scholarship not found");

    const currentTags = scholarship.tags ?? [];
    if (currentTags.includes(args.tag)) return; // Already present

    await ctx.db.patch(args.scholarshipId, {
      tags: [...currentTags, args.tag],
    });
  },
});

/**
 * Remove a tag from a scholarship.
 * Uses trigger-wrapped mutation so prestige/search_text recomputes.
 */
export const removeTag = triggeredMutation({
  args: {
    scholarshipId: v.id("scholarships"),
    tag: v.string(),
  },
  handler: async (ctx, args) => {
    const scholarship = await ctx.db.get(args.scholarshipId);
    if (!scholarship) throw new Error("Scholarship not found");

    const currentTags = scholarship.tags ?? [];
    await ctx.db.patch(args.scholarshipId, {
      tags: currentTags.filter((t) => t !== args.tag),
    });
  },
});

/**
 * Rename a tag globally across all scholarships and collections.
 * Processes in batches of 50 with scheduler for remaining.
 */
export const renameTag = rawInternalMutation({
  args: {
    oldTag: v.string(),
    newTag: v.string(),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = 50;
    let processed = 0;

    // Get all scholarships (bounded)
    const scholarships = await ctx.db
      .query("scholarships")
      .take(batchSize);

    for (const scholarship of scholarships) {
      const tags = scholarship.tags ?? [];
      if (tags.includes(args.oldTag)) {
        const newTags = tags.map((t) => (t === args.oldTag ? args.newTag : t));
        await ctx.db.patch(scholarship._id, { tags: newTags });
        processed++;
      }
    }

    // Also update collection filter criteria
    const collections = await ctx.db.query("collections").collect();
    for (const collection of collections) {
      const collTags = collection.tags ?? [];
      if (collTags.includes(args.oldTag)) {
        await ctx.db.patch(collection._id, {
          tags: collTags.map((t) => (t === args.oldTag ? args.newTag : t)),
        });
      }
    }

    // If batch was full, schedule next batch
    if (scholarships.length === batchSize) {
      await ctx.scheduler.runAfter(0, internal.tags.renameTag, {
        oldTag: args.oldTag,
        newTag: args.newTag,
      });
    }

    return { processed };
  },
});

/**
 * Public mutation wrapper for renameTag that schedules the internal mutation.
 */
export const renameTagPublic = rawMutation({
  args: {
    oldTag: v.string(),
    newTag: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.scheduler.runAfter(0, internal.tags.renameTag, {
      oldTag: args.oldTag,
      newTag: args.newTag,
    });
  },
});

/**
 * Delete a tag globally from all scholarships and collections.
 * Returns count of affected scholarships.
 */
export const deleteTag = rawInternalMutation({
  args: {
    tag: v.string(),
  },
  handler: async (ctx, args) => {
    const batchSize = 50;
    let affected = 0;

    const scholarships = await ctx.db
      .query("scholarships")
      .take(batchSize);

    for (const scholarship of scholarships) {
      const tags = scholarship.tags ?? [];
      if (tags.includes(args.tag)) {
        await ctx.db.patch(scholarship._id, {
          tags: tags.filter((t) => t !== args.tag),
        });
        affected++;
      }
    }

    // Also remove from collection filter criteria
    const collections = await ctx.db.query("collections").collect();
    for (const collection of collections) {
      const collTags = collection.tags ?? [];
      if (collTags.includes(args.tag)) {
        await ctx.db.patch(collection._id, {
          tags: collTags.filter((t) => t !== args.tag),
        });
      }
    }

    // If batch was full, schedule next batch
    if (scholarships.length === batchSize) {
      await ctx.scheduler.runAfter(0, internal.tags.deleteTag, {
        tag: args.tag,
      });
    }

    return { affected };
  },
});

/**
 * Public mutation wrapper for deleteTag that schedules the internal mutation.
 */
export const deleteTagPublic = rawMutation({
  args: {
    tag: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.scheduler.runAfter(0, internal.tags.deleteTag, {
      tag: args.tag,
    });
  },
});

/**
 * Bulk add tags to multiple scholarships.
 * Uses trigger-wrapped mutation so prestige/search_text recomputes.
 */
export const bulkAddTags = triggeredMutation({
  args: {
    scholarshipIds: v.array(v.id("scholarships")),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    let updated = 0;

    for (const scholarshipId of args.scholarshipIds) {
      const scholarship = await ctx.db.get(scholarshipId);
      if (!scholarship) continue;

      const currentTags = new Set(scholarship.tags ?? []);
      const newTags = args.tags.filter((t) => !currentTags.has(t));

      if (newTags.length > 0) {
        await ctx.db.patch(scholarshipId, {
          tags: [...(scholarship.tags ?? []), ...newTags],
        });
        updated++;
      }
    }

    return { updated };
  },
});

/**
 * Accept a suggested tag -- move from suggested_tags to tags.
 * Uses trigger-wrapped mutation so prestige/search_text recomputes.
 */
export const acceptSuggestedTag = triggeredMutation({
  args: {
    scholarshipId: v.id("scholarships"),
    tag: v.string(),
  },
  handler: async (ctx, args) => {
    const scholarship = await ctx.db.get(args.scholarshipId);
    if (!scholarship) throw new Error("Scholarship not found");

    const suggestedTags = scholarship.suggested_tags ?? [];
    const currentTags = scholarship.tags ?? [];

    // Remove from suggested
    const newSuggested = suggestedTags.filter((s) => s.tag !== args.tag);

    // Add to confirmed tags if not already present
    const newTags = currentTags.includes(args.tag)
      ? currentTags
      : [...currentTags, args.tag];

    await ctx.db.patch(args.scholarshipId, {
      suggested_tags: newSuggested,
      tags: newTags,
    });
  },
});

/**
 * Reject a suggested tag -- remove from suggested_tags without adding to tags.
 */
export const rejectSuggestedTag = rawMutation({
  args: {
    scholarshipId: v.id("scholarships"),
    tag: v.string(),
  },
  handler: async (ctx, args) => {
    const scholarship = await ctx.db.get(args.scholarshipId);
    if (!scholarship) throw new Error("Scholarship not found");

    const suggestedTags = scholarship.suggested_tags ?? [];
    await ctx.db.patch(args.scholarshipId, {
      suggested_tags: suggestedTags.filter((s) => s.tag !== args.tag),
    });
  },
});
