/**
 * Direct scholarship ingestion — bypasses raw_records + aggregation pipeline.
 *
 * Python does all enrichment (country inference, org inference, tag generation,
 * degree inference, dedup) locally and writes directly to the scholarships table.
 * Eliminates: raw_records writes, aggregation self-scheduling, enrichment pipeline,
 * change_log writes.
 *
 * Expected to replace the raw_records → aggregation → enrichPublish flow for
 * free-plan Convex deployments.
 */

import { v } from "convex/values";
import { customCtx, customMutation } from "convex-helpers/server/customFunctions";
import { mutation as rawMutation } from "./_generated/server";
import { wrapDB } from "./triggers";

const triggeredMutation = customMutation(rawMutation, customCtx(wrapDB));

const VALID_DEGREES = ["bachelor", "master", "phd", "postdoc"] as const;
const VALID_FUNDING = ["fully_funded", "partial", "tuition_waiver", "stipend_only"] as const;

/**
 * Directly upsert scholarships from the Python pipeline.
 * Each record is fully enriched — no server-side processing needed.
 * Dedup by match_key: update existing or insert new.
 */
export const upsertBatch = triggeredMutation({
  args: {
    records: v.array(
      v.object({
        title: v.string(),
        slug: v.string(),
        match_key: v.string(),
        description: v.optional(v.string()),
        provider_organization: v.string(),
        host_country: v.string(),
        eligibility_nationalities: v.optional(v.array(v.string())),
        degree_levels: v.array(
          v.union(
            v.literal("bachelor"),
            v.literal("master"),
            v.literal("phd"),
            v.literal("postdoc"),
          ),
        ),
        fields_of_study: v.optional(v.array(v.string())),
        funding_type: v.union(
          v.literal("fully_funded"),
          v.literal("partial"),
          v.literal("tuition_waiver"),
          v.literal("stipend_only"),
        ),
        funding_tuition: v.optional(v.boolean()),
        funding_living: v.optional(v.boolean()),
        funding_travel: v.optional(v.boolean()),
        funding_insurance: v.optional(v.boolean()),
        application_deadline: v.optional(v.number()),
        application_deadline_text: v.optional(v.string()),
        application_url: v.optional(v.string()),
        source_url: v.string(),
        source_id: v.id("sources"),
        tags: v.optional(v.array(v.string())),
        scholarship_type: v.optional(v.string()),
        award_amount_min: v.optional(v.number()),
        award_amount_max: v.optional(v.number()),
        award_currency: v.optional(v.string()),
        prestige_score: v.optional(v.number()),
        prestige_tier: v.optional(v.string()),
        search_text: v.optional(v.string()),
        status: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const record of args.records) {
      // Dedup by match_key
      const existing = await ctx.db
        .query("scholarships")
        .withIndex("by_match_key", (q) => q.eq("match_key", record.match_key))
        .first();

      if (existing) {
        // Update existing scholarship with fresher data
        const patch: Record<string, any> = {
          last_verified: Date.now(),
        };

        // Only update fields that have values (don't overwrite with undefined)
        if (record.description && (!existing.description || record.description.length > existing.description.length)) {
          patch.description = record.description;
        }
        if (record.application_url) patch.application_url = record.application_url;
        if (record.application_deadline) patch.application_deadline = record.application_deadline;
        if (record.application_deadline_text) patch.application_deadline_text = record.application_deadline_text;
        if (record.award_amount_min) patch.award_amount_min = record.award_amount_min;
        if (record.award_amount_max) patch.award_amount_max = record.award_amount_max;
        if (record.award_currency) patch.award_currency = record.award_currency;
        if (record.tags && record.tags.length > 0) {
          // Merge tags
          const merged = new Set([...(existing.tags ?? []), ...record.tags]);
          patch.tags = [...merged];
        }
        if (record.eligibility_nationalities && record.eligibility_nationalities.length > 0) {
          const merged = new Set([
            ...(existing.eligibility_nationalities ?? []),
            ...record.eligibility_nationalities,
          ]);
          patch.eligibility_nationalities = [...merged];
        }
        if (record.fields_of_study && record.fields_of_study.length > 0) {
          const merged = new Set([
            ...(existing.fields_of_study ?? []),
            ...record.fields_of_study,
          ]);
          patch.fields_of_study = [...merged];
        }
        // Add source if not already present
        if (!existing.source_ids.includes(record.source_id)) {
          patch.source_ids = [...existing.source_ids, record.source_id];
        }

        await ctx.db.patch(existing._id, patch);
        updated++;
      } else {
        // Check slug collision
        let slug = record.slug;
        const existingSlug = await ctx.db
          .query("scholarships")
          .withIndex("by_slug", (q) => q.eq("slug", slug))
          .first();
        if (existingSlug) {
          slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
        }

        await ctx.db.insert("scholarships", {
          title: record.title,
          slug,
          match_key: record.match_key,
          description: record.description,
          provider_organization: record.provider_organization,
          host_country: record.host_country,
          eligibility_nationalities: record.eligibility_nationalities,
          degree_levels: record.degree_levels,
          fields_of_study: record.fields_of_study,
          funding_type: record.funding_type,
          funding_tuition: record.funding_tuition,
          funding_living: record.funding_living,
          funding_travel: record.funding_travel,
          funding_insurance: record.funding_insurance,
          application_deadline: record.application_deadline,
          application_deadline_text: record.application_deadline_text,
          application_url: record.application_url ?? record.source_url,
          source_ids: [record.source_id],
          tags: record.tags,
          scholarship_type: record.scholarship_type as any,
          award_amount_min: record.award_amount_min,
          award_amount_max: record.award_amount_max,
          award_currency: record.award_currency,
          prestige_score: record.prestige_score,
          prestige_tier: record.prestige_tier as any,
          search_text: record.search_text,
          status: (record.status as any) ?? "pending_review",
          last_verified: Date.now(),
        });
        inserted++;
      }
    }

    return { inserted, updated, skipped };
  },
});
