// @vitest-environment edge-runtime

import { anyApi } from "convex/server";
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "../../convex/schema";

const modules = import.meta.glob("../../convex/**/*.*s");

async function createSource(
  t: any,
  overrides: Partial<{ name: string; trust_level: "auto_publish" | "needs_review" | "blocked" }> = {},
) {
  return await t.mutation(anyApi.sources.upsertSource, {
    name: overrides.name ?? `Admin Source ${Date.now()}-${Math.random()}`,
    url: `https://admin-${Date.now()}-${Math.random()}.example.com`,
    category: "aggregator",
    scrape_method: "scrape",
    trust_level: overrides.trust_level ?? "needs_review",
    scrape_frequency_hours: 24,
    wave: 1,
    is_active: true,
  });
}

describe("Admin query performance paths", () => {
  it("reevaluateSourceScholarships promotes only scholarships tied to the changed source", async () => {
    const t = convexTest(schema, modules);

    const otherSourceId = await createSource(t, { name: "Other Source", trust_level: "needs_review" });
    const targetSourceId = await createSource(t, {
      name: "Target Source",
      trust_level: "auto_publish",
    });

    await t.run(async (ctx: any) => {
      for (let i = 0; i < 5; i++) {
        await ctx.db.insert("scholarships", {
          title: `Pending Other ${i}`,
          slug: `pending-other-${i}`,
          description: "Pending",
          provider_organization: "Org",
          host_country: "US",
          degree_levels: ["master"],
          funding_type: "partial",
          application_url: "https://example.com/apply",
          status: "pending_review",
          source_ids: [otherSourceId],
        });
      }

      for (let i = 0; i < 3; i++) {
        await ctx.db.insert("scholarships", {
          title: `Pending Target ${i}`,
          slug: `pending-target-${i}`,
          description: "Pending",
          provider_organization: "Org",
          host_country: "US",
          degree_levels: ["master"],
          funding_type: "partial",
          application_url: "https://example.com/apply",
          status: "pending_review",
          source_ids: [targetSourceId],
        });
      }
    });

    const first = await t.mutation(anyApi.admin.reevaluateSourceScholarships, {
      sourceId: targetSourceId,
      batchSize: 50,
      cursor: undefined,
      processed: 0,
    });

    expect(first.complete).toBe(true);
    expect(first.promoted).toBe(3);

    const promotedCount = await t.run(async (ctx: any) => {
      const all = await ctx.db
        .query("scholarships")
        .withIndex("by_status", (q: any) => q.eq("status", "published"))
        .collect();
      return all.filter((s: any) => s.source_ids.includes(targetSourceId)).length;
    });

    expect(promotedCount).toBe(3);
  });

  it("getReviewQueue can skip duplicate checks when not needed", async () => {
    const t = convexTest(schema, modules);
    const sourceId = await createSource(t, { trust_level: "needs_review" });

    const scholarshipId = await t.run(async (ctx: any) => {
      return await ctx.db.insert("scholarships", {
        title: "Queue Duplicate Test",
        slug: "queue-duplicate-test",
        description: "Pending",
        provider_organization: "Org",
        host_country: "US",
        degree_levels: ["master"],
        funding_type: "partial",
        application_url: "https://example.com/apply",
        status: "pending_review",
        source_ids: [sourceId],
      });
    });

    await t.run(async (ctx: any) => {
      await ctx.db.insert("raw_records", {
        source_id: sourceId,
        title: "Queue Duplicate Raw",
        source_url: "https://example.com/raw",
        scraped_at: Date.now(),
        canonical_id: scholarshipId,
        match_status: "possible_duplicate",
      });
    });

    const withoutDupCheck = await t.query(anyApi.admin.getReviewQueue, {
      status: "pending_review",
      limit: 10,
      includePossibleDuplicate: false,
    });
    expect(withoutDupCheck[0].has_possible_duplicate).toBe(false);

    const withDupCheck = await t.query(anyApi.admin.getReviewQueue, {
      status: "pending_review",
      limit: 10,
      includePossibleDuplicate: true,
    });
    expect(withDupCheck[0].has_possible_duplicate).toBe(true);
  });
});
