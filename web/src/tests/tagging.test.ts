// @vitest-environment edge-runtime

import { anyApi } from "convex/server";
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "../../convex/schema";

const modules = import.meta.glob("../../convex/**/*.*s");

async function createSource(t: any) {
  return await t.mutation(anyApi.sources.upsertSource, {
    name: `Tagging Source ${Date.now()}-${Math.random()}`,
    url: `https://tagging-${Date.now()}-${Math.random()}.example.com`,
    category: "aggregator",
    scrape_method: "scrape",
    trust_level: "needs_review",
    scrape_frequency_hours: 24,
    wave: 1,
    is_active: true,
  });
}

describe("Tag suggestion backfill", () => {
  it("processes published scholarships across paginated batches", async () => {
    const t = convexTest(schema, modules);
    const sourceId = await createSource(t);

    await t.run(async (ctx: any) => {
      for (let i = 0; i < 75; i++) {
        await ctx.db.insert("scholarships", {
          title: `No GRE Scholarship ${i}`,
          slug: `no-gre-scholarship-${i}`,
          description: "GRE not required for admission.",
          provider_organization: "Tagging Org",
          host_country: "US",
          degree_levels: ["master"],
          funding_type: "partial",
          status: "published",
          source_ids: [sourceId],
        });
      }
    });

    let cursor: string | null = null;
    let processed = 0;
    let iterations = 0;
    while (true) {
      const result = await t.mutation(anyApi.tagging.backfillSuggestedTags, {
        cursor,
        batchSize: 50,
      });
      processed += result.processed;
      iterations += 1;
      if (result.complete) break;
      cursor = result.nextCursor;
      expect(iterations).toBeLessThan(10);
    }

    expect(iterations).toBeGreaterThan(1);
    expect(processed).toBe(75);

    const scholarships = await t.run(async (ctx: any) => {
      return await ctx.db.query("scholarships").collect();
    });
    expect(scholarships).toHaveLength(75);
    for (const scholarship of scholarships) {
      expect((scholarship.suggested_tags ?? []).length).toBeGreaterThan(0);
    }
  });
});
