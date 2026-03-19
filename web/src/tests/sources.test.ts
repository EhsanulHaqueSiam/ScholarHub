// @vitest-environment edge-runtime

import { anyApi } from "convex/server";
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "../../convex/schema";

const modules = import.meta.glob("../../convex/**/*.*s");

describe("upsertSource", () => {
  it("creates a new source when URL not found", async () => {
    const t = convexTest(schema, modules);
    const id = await t.mutation(anyApi.sources.upsertSource, {
      name: "Test Source",
      url: "https://example.com/scholarships",
      category: "aggregator" as const,
      scrape_method: "scrape" as const,
      scrape_frequency_hours: 24,
      wave: 1,
      is_active: true,
    });
    expect(id).toBeDefined();

    const source = await t.run(async (ctx) => {
      return await ctx.db.get(id);
    });
    expect(source?.name).toBe("Test Source");
    expect(source?.trust_level).toBe("needs_review");
    expect(source?.consecutive_failures).toBe(0);
  });

  it("updates existing source when URL matches", async () => {
    const t = convexTest(schema, modules);
    // Create initial
    await t.mutation(anyApi.sources.upsertSource, {
      name: "Original",
      url: "https://example.com",
      category: "aggregator" as const,
      scrape_method: "scrape" as const,
      scrape_frequency_hours: 24,
      wave: 1,
      is_active: true,
    });
    // Upsert with same URL
    await t.mutation(anyApi.sources.upsertSource, {
      name: "Updated",
      url: "https://example.com",
      category: "aggregator" as const,
      scrape_method: "api" as const,
      scrape_frequency_hours: 12,
      wave: 1,
      is_active: true,
    });
    // Verify only one source exists with updated name
    const sources = await t.run(async (ctx) => {
      return await ctx.db.query("sources").collect();
    });
    expect(sources).toHaveLength(1);
    expect(sources[0].name).toBe("Updated");
    expect(sources[0].scrape_method).toBe("api");
  });

  it("handles optional fields with defaults", async () => {
    const t = convexTest(schema, modules);
    const id = await t.mutation(anyApi.sources.upsertSource, {
      name: "Minimal Source",
      url: "https://minimal.example.com",
      category: "foundation" as const,
      scrape_method: "scrape" as const,
      scrape_frequency_hours: 720,
      wave: 7,
      is_active: true,
    });

    const source = await t.run(async (ctx) => {
      return await ctx.db.get(id);
    });
    expect(source?.auth_required).toBe(false);
    expect(source?.has_api).toBe(false);
    expect(source?.trust_level).toBe("needs_review");
    expect(source?.consecutive_failures).toBe(0);
  });

  it("accepts rss as a valid scrape_method", async () => {
    const t = convexTest(schema, modules);
    const id = await t.mutation(anyApi.sources.upsertSource, {
      name: "RSS Feed Source",
      url: "https://feeds.example.com/scholarships",
      category: "official_program" as const,
      scrape_method: "rss" as const,
      scrape_frequency_hours: 24,
      wave: 6,
      is_active: true,
    });
    expect(id).toBeDefined();

    const source = await t.run(async (ctx) => {
      return await ctx.db.get(id);
    });
    expect(source?.scrape_method).toBe("rss");
  });
});
