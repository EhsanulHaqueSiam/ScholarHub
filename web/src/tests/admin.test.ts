// @vitest-environment edge-runtime

import { anyApi } from "convex/server";
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "../../convex/schema";

const modules = import.meta.glob("../../convex/**/*.*s");

/**
 * Helper to create a source with specific trust level.
 */
async function createSource(
  t: any,
  overrides: Partial<{
    name: string;
    category: string;
    url: string;
    trust_level: string;
  }> = {},
) {
  return await t.mutation(anyApi.sources.upsertSource, {
    name: overrides.name ?? "Test Source",
    url: overrides.url ?? `https://example-${Date.now()}-${Math.random()}.com`,
    category: (overrides.category ?? "aggregator") as any,
    scrape_method: "scrape" as const,
    trust_level: (overrides.trust_level ?? "needs_review") as any,
    scrape_frequency_hours: 24,
    wave: 1,
    is_active: true,
  });
}

/**
 * Helper to insert a scholarship directly.
 */
async function insertScholarship(
  t: any,
  sourceId: any,
  overrides: Partial<any> = {},
) {
  return await t.run(async (ctx: any) => {
    return await ctx.db.insert("scholarships", {
      title: overrides.title ?? "Test Scholarship",
      slug: overrides.slug ?? `test-scholarship-${Date.now()}-${Math.random()}`,
      description: overrides.description ?? "A test scholarship",
      provider_organization: overrides.provider_organization ?? "Test Org",
      host_country: overrides.host_country ?? "DE",
      degree_levels: overrides.degree_levels ?? ["master"],
      funding_type: overrides.funding_type ?? "fully_funded",
      status: overrides.status ?? "pending_review",
      source_ids: overrides.source_ids ?? [sourceId],
      match_key: overrides.match_key ?? `test|test org|de`,
      application_url: overrides.application_url ?? "https://example.com/apply",
      ...overrides,
    });
  });
}

describe("Admin queries and mutations", () => {
  describe("getAdminStats", () => {
    it("returns status and source-health counts via aggregated pass", async () => {
      const t = convexTest(schema, modules);

      const sourceA = await createSource(t, {
        name: "Stats Source A",
        url: "https://stats-a.example.com",
      });
      const sourceB = await createSource(t, {
        name: "Stats Source B",
        url: "https://stats-b.example.com",
      });

      await insertScholarship(t, sourceA, {
        title: "Pending Stats",
        status: "pending_review",
        match_key: "pending stats|test org|de",
      });
      await insertScholarship(t, sourceA, {
        title: "Published Stats",
        status: "published",
        match_key: "published stats|test org|de",
      });
      await insertScholarship(t, sourceB, {
        title: "Rejected Stats",
        status: "rejected",
        match_key: "rejected stats|test org|de",
      });
      await insertScholarship(t, sourceB, {
        title: "Archived Stats",
        status: "archived",
        match_key: "archived stats|test org|de",
      });
      // Draft should not contribute to total (existing behavior).
      await insertScholarship(t, sourceB, {
        title: "Draft Stats",
        status: "draft",
        match_key: "draft stats|test org|de",
      });

      await t.run(async (ctx: any) => {
        await ctx.db.insert("source_health", {
          source_id: sourceA,
          status: "healthy",
          consecutive_failures: 0,
        });
        await ctx.db.insert("source_health", {
          source_id: sourceB,
          status: "degraded",
          consecutive_failures: 2,
        });
        await ctx.db.insert("source_health", {
          source_id: sourceB,
          status: "deactivated",
          consecutive_failures: 8,
        });
      });

      const stats = await t.query(anyApi.admin.getAdminStats, {});

      expect(stats.total).toBe(4);
      expect(stats.pending).toBe(1);
      expect(stats.published).toBe(1);
      expect(stats.rejected).toBe(1);
      expect(stats.publishedToday).toBe(1);
      expect(stats.sourceHealth).toEqual({
        healthy: 1,
        degraded: 1,
        failing: 1,
      });
    });
  });

  describe("getReviewQueue", () => {
    it("returns pending_review scholarships with resolved_sources", async () => {
      const t = convexTest(schema, modules);

      const sourceId = await createSource(t, {
        name: "Gov Source",
        category: "government",
        trust_level: "needs_review",
        url: "https://gov.example.com",
      });

      await insertScholarship(t, sourceId, {
        title: "Test Review Scholarship",
        status: "pending_review",
        match_key: "test review|test org|de",
      });

      const queue = await t.query(anyApi.admin.getReviewQueue, {});

      expect(queue).toHaveLength(1);
      expect(queue[0].title).toBe("Test Review Scholarship");
      expect(queue[0].resolved_sources).toHaveLength(1);
      expect(queue[0].resolved_sources[0].name).toBe("Gov Source");
      expect(queue[0].resolved_sources[0].category).toBe("government");
      expect(queue[0].resolved_sources[0].trust_level).toBe("needs_review");
    });

    it("sets has_possible_duplicate using indexed canonical+match lookup", async () => {
      const t = convexTest(schema, modules);

      const sourceId = await createSource(t, {
        name: "Dup Source",
        category: "aggregator",
        trust_level: "needs_review",
        url: "https://dup.example.com",
      });

      const scholarshipId = await insertScholarship(t, sourceId, {
        title: "Dup Candidate",
        status: "pending_review",
        match_key: "dup candidate|test org|de",
      });

      await t.run(async (ctx: any) => {
        await ctx.db.insert("raw_records", {
          source_id: sourceId,
          title: "Dup Candidate Raw",
          source_url: "https://dup.example.com/raw",
          scraped_at: Date.now(),
          canonical_id: scholarshipId,
          match_status: "possible_duplicate",
        });
      });

      const queue = await t.query(anyApi.admin.getReviewQueue, {
        status: "pending_review",
      });

      expect(queue).toHaveLength(1);
      expect(queue[0].has_possible_duplicate).toBe(true);
    });
  });

  describe("approveScholarship", () => {
    it("changes status from pending_review to published", async () => {
      const t = convexTest(schema, modules);

      const sourceId = await createSource(t, {
        url: "https://approve-test.example.com",
      });
      const scholarshipId = await insertScholarship(t, sourceId, {
        status: "pending_review",
        match_key: "approve test|test org|de",
      });

      await t.mutation(anyApi.admin.approveScholarship, {
        scholarshipId,
      });

      const scholarship = await t.run(async (ctx: any) => {
        return await ctx.db.get(scholarshipId);
      });
      expect(scholarship.status).toBe("published");
    });

    it("blocks when duplicate match_key already published (ADMN-08)", async () => {
      const t = convexTest(schema, modules);

      const sourceId = await createSource(t, {
        url: "https://dedup-test.example.com",
      });

      // Create a published scholarship
      await insertScholarship(t, sourceId, {
        title: "Duplicate Test",
        status: "published",
        match_key: "duplicate test|test org|de",
        slug: "duplicate-test-published",
      });

      // Create a pending one with same match_key
      const pendingId = await insertScholarship(t, sourceId, {
        title: "Duplicate Test Pending",
        status: "pending_review",
        match_key: "duplicate test|test org|de",
        slug: "duplicate-test-pending",
      });

      // Should throw dedup error
      await expect(
        t.mutation(anyApi.admin.approveScholarship, {
          scholarshipId: pendingId,
        }),
      ).rejects.toThrow(
        "Cannot approve: a published scholarship with the same title and organization already exists",
      );
    });
  });

  describe("bulkApprove", () => {
    it("approves valid entries and blocks duplicates", async () => {
      const t = convexTest(schema, modules);

      const sourceId = await createSource(t, {
        url: "https://bulk-test.example.com",
      });

      // Create a published scholarship with match_key A
      await insertScholarship(t, sourceId, {
        title: "Existing Published",
        status: "published",
        match_key: "existing|test org|de",
        slug: "existing-published",
      });

      // Create two pending scholarships: one with unique key, one with duplicate key
      const uniqueId = await insertScholarship(t, sourceId, {
        title: "Unique Pending",
        status: "pending_review",
        match_key: "unique|test org|de",
        slug: "unique-pending",
      });

      const dupId = await insertScholarship(t, sourceId, {
        title: "Duplicate Pending",
        status: "pending_review",
        match_key: "existing|test org|de",
        slug: "duplicate-pending",
      });

      const result = await t.mutation(anyApi.admin.bulkApprove, {
        scholarshipIds: [uniqueId, dupId],
      });

      expect(result.approved).toBe(1);
      expect(result.blocked).toBe(1);

      // Verify the unique one was approved
      const uniqueScholarship = await t.run(async (ctx: any) => {
        return await ctx.db.get(uniqueId);
      });
      expect(uniqueScholarship.status).toBe("published");

      // Verify the duplicate one was blocked
      const dupScholarship = await t.run(async (ctx: any) => {
        return await ctx.db.get(dupId);
      });
      expect(dupScholarship.status).toBe("pending_review");
    });
  });

  describe("bulkReject", () => {
    it("rejects all specified scholarships", async () => {
      const t = convexTest(schema, modules);

      const sourceId = await createSource(t, {
        url: "https://reject-test.example.com",
      });

      const id1 = await insertScholarship(t, sourceId, {
        status: "pending_review",
        match_key: "reject1|test org|de",
        slug: "reject-1",
      });
      const id2 = await insertScholarship(t, sourceId, {
        status: "pending_review",
        match_key: "reject2|test org|de",
        slug: "reject-2",
      });

      const result = await t.mutation(anyApi.admin.bulkReject, {
        scholarshipIds: [id1, id2],
      });

      expect(result.rejected).toBe(2);

      const s1 = await t.run(async (ctx: any) => ctx.db.get(id1));
      const s2 = await t.run(async (ctx: any) => ctx.db.get(id2));
      expect(s1.status).toBe("rejected");
      expect(s2.status).toBe("rejected");
    });
  });

  describe("updateScholarship", () => {
    it("creates revision records in scholarship_revisions", async () => {
      const t = convexTest(schema, modules);

      const sourceId = await createSource(t, {
        url: "https://revision-test.example.com",
      });
      const scholarshipId = await insertScholarship(t, sourceId, {
        title: "Original Title",
        description: "Original Description",
        status: "pending_review",
        match_key: "revision|test org|de",
      });

      await t.mutation(anyApi.admin.updateScholarship, {
        scholarshipId,
        updates: {
          title: "Updated Title",
          description: "Updated Description",
        },
      });

      // Check the scholarship was updated
      const updated = await t.run(async (ctx: any) => ctx.db.get(scholarshipId));
      expect(updated.title).toBe("Updated Title");
      expect(updated.description).toBe("Updated Description");

      // Check revision records were created
      const revisions = await t.run(async (ctx: any) => {
        return await ctx.db.query("scholarship_revisions").collect();
      });

      expect(revisions.length).toBeGreaterThanOrEqual(2);

      const titleRevision = revisions.find((r: any) => r.field_name === "title");
      expect(titleRevision).toBeDefined();
      expect(titleRevision.old_value).toBe("Original Title");
      expect(titleRevision.new_value).toBe("Updated Title");

      const descRevision = revisions.find((r: any) => r.field_name === "description");
      expect(descRevision).toBeDefined();
      expect(descRevision.old_value).toBe("Original Description");
      expect(descRevision.new_value).toBe("Updated Description");
    });
  });

  describe("updateSourceTrust", () => {
    it("updates the source trust_level field", async () => {
      const t = convexTest(schema, modules);

      const sourceId = await createSource(t, {
        trust_level: "needs_review",
        url: "https://trust-test.example.com",
      });

      const result = await t.mutation(anyApi.admin.updateSourceTrust, {
        sourceId,
        trustLevel: "auto_publish" as any,
      });

      expect(result.updated).toBe(true);

      const source = await t.run(async (ctx: any) => ctx.db.get(sourceId));
      expect(source.trust_level).toBe("auto_publish");
    });
  });
});
