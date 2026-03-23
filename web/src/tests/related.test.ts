// @vitest-environment edge-runtime

import { anyApi } from "convex/server";
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "../../convex/schema";

const modules = import.meta.glob("../../convex/**/*.*s");

async function createSource(t: any) {
  return await t.mutation(anyApi.sources.upsertSource, {
    name: `Related Source ${Date.now()}-${Math.random()}`,
    url: `https://related-${Date.now()}-${Math.random()}.example.com`,
    category: "aggregator",
    scrape_method: "scrape",
    trust_level: "needs_review",
    scrape_frequency_hours: 24,
    wave: 1,
    is_active: true,
  });
}

async function insertScholarship(
  t: any,
  sourceId: any,
  overrides: Partial<{
    title: string;
    slug: string;
    provider_organization: string;
    host_country: string;
    degree_levels: string[];
    funding_type: "fully_funded" | "partial" | "tuition_waiver" | "stipend_only";
  }> = {},
) {
  return await t.run(async (ctx: any) => {
    return await ctx.db.insert("scholarships", {
      title: overrides.title ?? `Related Test ${Date.now()}-${Math.random()}`,
      slug: overrides.slug ?? `related-test-${Date.now()}-${Math.random()}`,
      provider_organization: overrides.provider_organization ?? "Test Org",
      host_country: overrides.host_country ?? "US",
      degree_levels: overrides.degree_levels ?? ["master"],
      funding_type: overrides.funding_type ?? "partial",
      status: "published",
      source_ids: [sourceId],
      application_url: "https://example.com/apply",
    });
  });
}

describe("Related refresh", () => {
  it("refreshes related_ids without crashing and writes related links", async () => {
    const t = convexTest(schema, modules);
    const sourceId = await createSource(t);

    await insertScholarship(t, sourceId, {
      title: "Alpha Scholarship",
      slug: "alpha-scholarship",
      provider_organization: "Org A",
      host_country: "US",
      degree_levels: ["master"],
      funding_type: "partial",
    });

    await insertScholarship(t, sourceId, {
      title: "Beta Scholarship",
      slug: "beta-scholarship",
      provider_organization: "Org B",
      host_country: "US",
      degree_levels: ["master"],
      funding_type: "partial",
    });

    await insertScholarship(t, sourceId, {
      title: "Gamma Scholarship",
      slug: "gamma-scholarship",
      provider_organization: "Org C",
      host_country: "US",
      degree_levels: ["master"],
      funding_type: "partial",
    });

    const result = await t.mutation(anyApi.related.refreshAllRelatedIds, {
      cursor: undefined,
      processed: 0,
    });

    expect(result.complete).toBe(true);
    expect(result.processed).toBe(3);

    const scholarships = await t.run(async (ctx: any) => {
      return await ctx.db.query("scholarships").collect();
    });

    expect(scholarships).toHaveLength(3);
    for (const scholarship of scholarships) {
      expect(Array.isArray(scholarship.related_ids)).toBe(true);
      expect((scholarship.related_ids ?? []).length).toBeGreaterThan(0);
    }
  });
});
