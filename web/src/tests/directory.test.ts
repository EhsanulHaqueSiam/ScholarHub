// @vitest-environment edge-runtime

import { anyApi } from "convex/server";
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "../../convex/schema";

const modules = import.meta.glob("../../convex/**/*.*s");

async function createSource(t: any) {
  return await t.mutation(anyApi.sources.upsertSource, {
    name: `Directory Source ${Date.now()}-${Math.random()}`,
    url: `https://directory-${Date.now()}-${Math.random()}.example.com`,
    category: "aggregator",
    scrape_method: "scrape",
    trust_level: "needs_review",
    scrape_frequency_hours: 24,
    wave: 1,
    is_active: true,
  });
}

async function insertScholarship(t: any, sourceId: any, status: any = "published") {
  return await t.run(async (ctx: any) => {
    return await ctx.db.insert("scholarships", {
      title: `Count Test ${Date.now()}-${Math.random()}`,
      slug: `count-test-${Date.now()}-${Math.random()}`,
      provider_organization: "Count Org",
      host_country: "DE",
      degree_levels: ["master"],
      funding_type: "partial",
      status,
      source_ids: [sourceId],
      application_url: "https://example.com/apply",
    });
  });
}

describe("Directory count cache", () => {
  it("uses cached scholarship counts after cache warmup", async () => {
    const t = convexTest(schema, modules);
    const sourceId = await createSource(t);

    await insertScholarship(t, sourceId, "published");
    await insertScholarship(t, sourceId, "published");

    // Fallback path (no cache yet) still returns accurate count.
    const initial = await t.query(anyApi.directory.getScholarshipCount, {
      status: "published",
    });
    expect(initial).toBe(2);

    await t.mutation(anyApi.directory.refreshScholarshipCountCache, {
      status: "published",
    });

    // Add one more published record after cache warmup.
    await insertScholarship(t, sourceId, "published");

    // Should return cached value until refresh runs again.
    const cached = await t.query(anyApi.directory.getScholarshipCount, {
      status: "published",
    });
    expect(cached).toBe(2);

    // After explicit refresh, cache reflects latest total.
    await t.mutation(anyApi.directory.refreshScholarshipCountCache, {
      status: "published",
    });
    const refreshed = await t.query(anyApi.directory.getScholarshipCount, {
      status: "published",
    });
    expect(refreshed).toBe(3);
  });
});

