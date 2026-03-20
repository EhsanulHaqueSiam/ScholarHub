import { Triggers } from "convex-helpers/server/triggers";
import type { DataModel } from "./_generated/dataModel";
import { calculatePrestigeScore, scoreTier, buildSearchText } from "./prestige";

const triggers = new Triggers<DataModel>();

triggers.register("scholarships", async (ctx, change) => {
  if (change.operation === "delete") return;

  const doc = change.newDoc;
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

  // Only patch if values changed to avoid infinite trigger loops
  if (
    doc.prestige_score !== score ||
    doc.prestige_tier !== tier ||
    doc.search_text !== searchText
  ) {
    await ctx.db.patch(doc._id, {
      prestige_score: score,
      prestige_tier: tier,
      search_text: searchText,
    });
  }
});

// Export the customMutation wrapper that includes triggers
export const { wrapDB, wrapDatabaseWriter } = triggers;
