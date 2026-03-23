// @vitest-environment edge-runtime

import { anyApi } from "convex/server";
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "../../convex/schema";

const modules = import.meta.glob("../../convex/**/*.*s");

async function createSource(t: any) {
  return await t.mutation(anyApi.sources.upsertSource, {
    name: `Tag Source ${Date.now()}-${Math.random()}`,
    url: `https://tags-${Date.now()}-${Math.random()}.example.com`,
    category: "aggregator",
    scrape_method: "scrape",
    trust_level: "needs_review",
    scrape_frequency_hours: 24,
    wave: 1,
    is_active: true,
  });
}

describe("Tag batch mutations", () => {
  it("renames and deletes tags across paginated scholarship batches", async () => {
    const t = convexTest(schema, modules);
    const sourceId = await createSource(t);
    const now = Date.now();

    await t.run(async (ctx: any) => {
      for (let i = 0; i < 75; i++) {
        await ctx.db.insert("scholarships", {
          title: `Tag Scholarship ${i}`,
          slug: `tag-scholarship-${i}`,
          description: "tag test",
          provider_organization: "Tag Org",
          host_country: "US",
          degree_levels: ["master"],
          funding_type: "partial",
          status: "published",
          source_ids: [sourceId],
          tags: ["legacy_tag", "shared_tag"],
        });
      }

      await ctx.db.insert("collections", {
        name: "Tag Collection",
        slug: "tag-collection",
        emoji: "tag",
        status: "active",
        is_featured: false,
        sort_order: 1,
        scholarship_count: 0,
        view_count: 0,
        tags: ["legacy_tag", "shared_tag"],
        created_at: now,
        updated_at: now,
      });
    });

    // Drive internal pagination manually in tests (scheduler is intentionally skipped).
    let renameCursor: string | null = null;
    while (true) {
      const result = await t.mutation(anyApi.tags.renameTag, {
        oldTag: "legacy_tag",
        newTag: "modern_tag",
        cursor: renameCursor,
        collectionsUpdated: renameCursor !== null,
      });
      if (result.complete) break;
      renameCursor = result.nextCursor;
    }

    let deleteCursor: string | null = null;
    while (true) {
      const result = await t.mutation(anyApi.tags.deleteTag, {
        tag: "shared_tag",
        cursor: deleteCursor,
        collectionsUpdated: deleteCursor !== null,
      });
      if (result.complete) break;
      deleteCursor = result.nextCursor;
    }

    const scholarships = await t.run(async (ctx: any) => {
      return await ctx.db.query("scholarships").collect();
    });

    expect(scholarships).toHaveLength(75);
    for (const scholarship of scholarships) {
      expect(scholarship.tags).toContain("modern_tag");
      expect(scholarship.tags).not.toContain("legacy_tag");
      expect(scholarship.tags).not.toContain("shared_tag");
    }

    const collection = await t.run(async (ctx: any) => {
      return await ctx.db
        .query("collections")
        .withIndex("by_slug", (q: any) => q.eq("slug", "tag-collection"))
        .first();
    });
    expect(collection).toBeTruthy();
    expect(collection.tags).toContain("modern_tag");
    expect(collection.tags).not.toContain("legacy_tag");
    expect(collection.tags).not.toContain("shared_tag");
  });
});
