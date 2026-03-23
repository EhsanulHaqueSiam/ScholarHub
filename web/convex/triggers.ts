import { Triggers } from "convex-helpers/server/triggers";
import type { DataModel } from "./_generated/dataModel";
import { classifyScholarshipType } from "./classification";
import { buildSearchText, calculatePrestigeScore, scoreTier } from "./prestige";
import { computeRelatedIds } from "./related";
import { computeAutoTags } from "./tagging";

const triggers = new Triggers<DataModel>();

triggers.register("scholarships", async (ctx, change) => {
  if (change.operation === "delete") return;

  const doc = change.newDoc;
  const oldDoc = change.oldDoc;

  // --- Prestige scoring ---
  const score = calculatePrestigeScore({
    funding_type: doc.funding_type,
    provider_organization: doc.provider_organization,
    host_country: doc.host_country,
    tags: doc.tags ?? [],
  });
  const tier = scoreTier(score);
  const searchText = buildSearchText({
    title: doc.title,
    description: doc.description,
    eligibility_nationalities: doc.eligibility_nationalities,
  });

  const prestigeChanged =
    doc.prestige_score !== score || doc.prestige_tier !== tier || doc.search_text !== searchText;

  // --- Auto-tagging (D-26) ---
  const newSuggestions = computeAutoTags({
    title: doc.title,
    description: doc.description,
    eligibility_nationalities: doc.eligibility_nationalities,
    degree_levels: doc.degree_levels,
    fields_of_study: doc.fields_of_study,
    host_country: doc.host_country,
    tags: doc.tags,
    suggested_tags: doc.suggested_tags,
  });
  const hasSuggestions = newSuggestions.length > 0;

  // --- Related scholarships (D-76) ---
  // Only recompute on insert or when key fields changed
  let newRelatedIds: any[] | null = null;
  const shouldRecomputeRelated =
    change.operation === "insert" ||
    (oldDoc &&
      (oldDoc.provider_organization !== doc.provider_organization ||
        oldDoc.host_country !== doc.host_country ||
        JSON.stringify(oldDoc.degree_levels) !== JSON.stringify(doc.degree_levels) ||
        oldDoc.funding_type !== doc.funding_type ||
        JSON.stringify(oldDoc.tags) !== JSON.stringify(doc.tags)));

  if (shouldRecomputeRelated) {
    newRelatedIds = await computeRelatedIds(ctx, {
      _id: doc._id,
      provider_organization: doc.provider_organization,
      host_country: doc.host_country,
      degree_levels: doc.degree_levels,
      funding_type: doc.funding_type,
      tags: doc.tags,
      status: doc.status,
    });
  }

  // --- Scholarship type classification ---
  // Re-classify when tags change or on insert (when no type yet)
  const shouldReclassify =
    change.operation === "insert" ||
    !doc.scholarship_type ||
    (oldDoc && JSON.stringify(oldDoc.tags) !== JSON.stringify(doc.tags));

  let newType: string | null = null;
  if (shouldReclassify) {
    let sourceCategory: string | undefined;
    if (doc.source_ids.length > 0) {
      const source = await ctx.db.get(doc.source_ids[0]);
      sourceCategory = source?.category;
    }

    const classified = classifyScholarshipType(
      sourceCategory,
      doc.tags ?? undefined,
      doc.provider_organization,
      doc.description,
    );

    if (classified !== doc.scholarship_type) {
      newType = classified;
    }
  }

  // --- Build patch ---
  const patch: Record<string, any> = {};

  if (prestigeChanged) {
    patch.prestige_score = score;
    patch.prestige_tier = tier;
    patch.search_text = searchText;
  }

  if (hasSuggestions) {
    patch.suggested_tags = [...(doc.suggested_tags ?? []), ...newSuggestions];
  }

  if (newRelatedIds !== null && JSON.stringify(newRelatedIds) !== JSON.stringify(doc.related_ids)) {
    patch.related_ids = newRelatedIds;
  }

  if (newType !== null) {
    patch.scholarship_type = newType;
  }

  // Only patch if something changed to avoid infinite trigger loops
  if (Object.keys(patch).length > 0) {
    await ctx.db.patch(doc._id, patch);
  }
});

// Export the customMutation wrapper that includes triggers
export const { wrapDB, wrapDatabaseWriter } = triggers;
