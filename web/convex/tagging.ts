/**
 * Auto-tagging rules and backfill for the scholarship tag system.
 *
 * High-confidence keyword matching detects tags from scholarship text fields.
 * Suggestions are stored separately and require admin acceptance.
 */

import { v } from "convex/values";
import { internalMutation as rawInternalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { getRegion } from "../src/lib/regions";

// ---- Tag Rule Definitions ----

export interface TagRule {
  tag: string;
  patterns: RegExp[];
  fields: (
    | "title"
    | "description"
    | "eligibility_nationalities"
    | "degree_levels"
    | "fields_of_study"
  )[];
}

export const AUTO_TAG_RULES: TagRule[] = [
  {
    tag: "no_gre",
    patterns: [/gre\s*(is\s*)?(not\s+)?required/i, /no\s+gre/i, /gre\s*waived/i, /without\s+gre/i],
    fields: ["description", "title"],
  },
  {
    tag: "women_only",
    patterns: [/women\s+only/i, /female\s+only/i, /exclusively\s+for\s+women/i, /for\s+women\b/i],
    fields: ["description", "title"],
  },
  {
    tag: "stem",
    patterns: [/\bstem\b/i, /science.*technology.*engineering/i, /engineering.*science/i],
    fields: ["title", "description", "fields_of_study"],
  },
  {
    tag: "developing_countries",
    patterns: [/developing\s+(countr|nation)/i, /low[\s-]income\s+countr/i, /global\s+south/i],
    fields: ["description", "title", "eligibility_nationalities"],
  },
  {
    tag: "full_degree",
    patterns: [/full[\s-]?degree/i, /entire\s+degree/i, /complete\s+(degree|program)/i],
    fields: ["description", "title"],
  },
  {
    tag: "merit_based",
    patterns: [/merit[\s-]based/i, /academic\s+merit/i, /academic\s+excellence/i],
    fields: ["description", "title"],
  },
  {
    tag: "need_based",
    patterns: [/need[\s-]based/i, /financial\s+need/i],
    fields: ["description", "title"],
  },
  {
    tag: "research_grant",
    patterns: [/research\s+grant/i, /research\s+funding/i, /dissertation\s+grant/i],
    fields: ["description", "title"],
  },
];

// ---- Region name to tag ID mapping ----

const REGION_TO_TAG: Record<string, string> = {
  Europe: "europe",
  Asia: "asia",
  Americas: "americas",
  Africa: "africa",
  "Middle East": "middle_east",
  Oceania: "oceania",
};

// ---- Types ----

export interface TagSuggestion {
  tag: string;
  reason: string;
  suggested_at: number;
}

interface ScholarshipForTagging {
  title: string;
  description?: string | null;
  eligibility_nationalities?: string[] | null;
  degree_levels?: string[] | null;
  fields_of_study?: string[] | null;
  host_country: string;
  tags?: string[] | null;
}

// ---- Pure Functions ----

/**
 * Get the string value(s) for a given field from a scholarship document.
 * Arrays are joined into a single string for pattern matching.
 */
function getFieldValues(
  doc: ScholarshipForTagging,
  field: TagRule["fields"][number],
): string {
  switch (field) {
    case "title":
      return doc.title ?? "";
    case "description":
      return doc.description ?? "";
    case "eligibility_nationalities":
      return (doc.eligibility_nationalities ?? []).join(" ");
    case "degree_levels":
      return (doc.degree_levels ?? []).join(" ");
    case "fields_of_study":
      return (doc.fields_of_study ?? []).join(" ");
    default:
      return "";
  }
}

/**
 * Compute suggested tags for a scholarship based on auto-tagging rules.
 * Returns all suggestions including those that may overlap with existing tags/suggestions.
 * Caller is responsible for filtering out already-present tags.
 */
export function computeSuggestedTags(doc: ScholarshipForTagging): TagSuggestion[] {
  const existingTags = new Set(doc.tags ?? []);
  const suggestions: TagSuggestion[] = [];
  const now = Date.now();

  // Rule-based keyword matching
  for (const rule of AUTO_TAG_RULES) {
    if (existingTags.has(rule.tag)) continue;

    let matchedReason: string | null = null;

    for (const field of rule.fields) {
      const value = getFieldValues(doc, field);
      if (!value) continue;

      for (const pattern of rule.patterns) {
        const match = value.match(pattern);
        if (match) {
          matchedReason = `Matched "${match[0]}" in ${field}`;
          break;
        }
      }
      if (matchedReason) break;
    }

    if (matchedReason) {
      suggestions.push({
        tag: rule.tag,
        reason: matchedReason,
        suggested_at: now,
      });
    }
  }

  // Region auto-detection from host_country
  if (doc.host_country) {
    const region = getRegion(doc.host_country);
    const regionTag = REGION_TO_TAG[region];
    if (regionTag && !existingTags.has(regionTag)) {
      suggestions.push({
        tag: regionTag,
        reason: `Host country "${doc.host_country}" is in ${region}`,
        suggested_at: now,
      });
    }
  }

  return suggestions;
}

/**
 * Compute only NEW auto-tag suggestions not already in the doc's suggested_tags.
 * Used by triggers to avoid re-suggesting already-pending tags.
 */
export function computeAutoTags(
  doc: ScholarshipForTagging & {
    suggested_tags?: Array<{ tag: string; reason: string; suggested_at: number }> | null;
  },
): TagSuggestion[] {
  const existingSuggested = new Set((doc.suggested_tags ?? []).map((s) => s.tag));
  const allSuggestions = computeSuggestedTags(doc);
  return allSuggestions.filter((s) => !existingSuggested.has(s.tag));
}

// ---- Convex Mutations ----

/**
 * Backfill suggested tags for published scholarships.
 * Processes 50 at a time using scheduler for batching.
 */
export const backfillSuggestedTags = rawInternalMutation({
  args: {
    cursor: v.optional(v.string()),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? 50;
    let processed = 0;

    const scholarships = await ctx.db
      .query("scholarships")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .take(batchSize);

    for (const scholarship of scholarships) {
      const newSuggestions = computeSuggestedTags({
        title: scholarship.title,
        description: scholarship.description,
        eligibility_nationalities: scholarship.eligibility_nationalities,
        degree_levels: scholarship.degree_levels,
        fields_of_study: scholarship.fields_of_study,
        host_country: scholarship.host_country,
        tags: scholarship.tags,
      });

      // Filter out already-suggested tags
      const existingSuggested = new Set(
        (scholarship.suggested_tags ?? []).map((s) => s.tag),
      );
      const trulyNew = newSuggestions.filter((s) => !existingSuggested.has(s.tag));

      if (trulyNew.length > 0) {
        await ctx.db.patch(scholarship._id, {
          suggested_tags: [...(scholarship.suggested_tags ?? []), ...trulyNew],
        });
        processed++;
      }
    }

    // If batch was full, schedule next batch
    if (scholarships.length === batchSize) {
      await ctx.scheduler.runAfter(0, internal.tagging.backfillSuggestedTags, {
        batchSize,
      });
    }

    return { processed };
  },
});
