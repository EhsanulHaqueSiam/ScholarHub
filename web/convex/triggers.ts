import { Triggers } from "convex-helpers/server/triggers";
import type { DataModel } from "./_generated/dataModel";
import { buildSearchText, calculatePrestigeScore, scoreTier } from "./prestige";

const triggers = new Triggers<DataModel>();

triggers.register("scholarships", async (_ctx, change) => {
  // Only compute prestige + search_text on admin edits (not pipeline writes).
  // Pipeline writes (direct mode) already have these computed in Python.
  // This keeps triggers near-zero cost for the bulk ingestion path.
  if (change.operation !== "update") return;

  const doc = change.newDoc;
  const oldDoc = change.oldDoc;
  if (!oldDoc) return;

  // Skip if key scoring fields haven't changed (avoid double-write on pipeline patches)
  const scoringFieldsChanged =
    oldDoc.funding_type !== doc.funding_type ||
    oldDoc.provider_organization !== doc.provider_organization ||
    oldDoc.host_country !== doc.host_country ||
    JSON.stringify(oldDoc.tags) !== JSON.stringify(doc.tags) ||
    oldDoc.title !== doc.title ||
    oldDoc.description !== doc.description;

  if (!scoringFieldsChanged) return;

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

  const changed =
    doc.prestige_score !== score || doc.prestige_tier !== tier || doc.search_text !== searchText;

  if (changed) {
    await _ctx.db.patch(doc._id, {
      prestige_score: score,
      prestige_tier: tier,
      search_text: searchText,
    });
  }
});

// Export the customMutation wrapper that includes triggers
export const { wrapDB, wrapDatabaseWriter } = triggers;
