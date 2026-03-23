// @vitest-environment edge-runtime

import { anyApi } from "convex/server";
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "../../convex/schema";

const modules = import.meta.glob("../../convex/**/*.*s");

async function createSource(t: any) {
  return await t.mutation(anyApi.sources.upsertSource, {
    name: `Collection Source ${Date.now()}-${Math.random()}`,
    url: `https://collections-${Date.now()}-${Math.random()}.example.com`,
    category: "aggregator",
    scrape_method: "scrape",
    trust_level: "needs_review",
    scrape_frequency_hours: 24,
    wave: 1,
    is_active: true,
  });
}

describe("Collection count recompute", () => {
  it("recomputes all active collections across paginated batches", async () => {
    const t = convexTest(schema, modules);
    const sourceId = await createSource(t);
    const now = Date.now();

    await t.run(async (ctx: any) => {
      await ctx.db.insert("scholarships", {
        title: "Collection Count Scholarship",
        slug: "collection-count-scholarship",
        description: "collection count",
        provider_organization: "Collection Org",
        host_country: "US",
        degree_levels: ["master"],
        funding_type: "partial",
        status: "published",
        source_ids: [sourceId],
      });

      for (let i = 0; i < 55; i++) {
        await ctx.db.insert("collections", {
          name: `Collection ${i}`,
          slug: `collection-${i}`,
          emoji: "c",
          status: "active",
          is_featured: false,
          sort_order: i,
          scholarship_count: 0,
          view_count: 0,
          created_at: now + i,
          updated_at: now + i,
        });
      }
    });

    let cursor: string | null = null;
    while (true) {
      const result = await t.mutation(anyApi.collections.recomputeAllCounts, {
        cursor,
      });
      if (result.complete) break;
      cursor = result.nextCursor;
    }

    const collections = await t.run(async (ctx: any) => {
      return await ctx.db
        .query("collections")
        .withIndex("by_status", (q: any) => q.eq("status", "active"))
        .collect();
    });

    expect(collections).toHaveLength(55);
    for (const collection of collections) {
      expect(collection.scholarship_count).toBe(1);
    }
  });
});
