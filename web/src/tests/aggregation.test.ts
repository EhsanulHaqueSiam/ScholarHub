// @vitest-environment edge-runtime

import { anyApi } from "convex/server";
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "../../convex/schema";

const modules = import.meta.glob("../../convex/**/*.*s");

/**
 * Helper to create a test source via the upsertSource mutation.
 */
async function createSource(
  t: any,
  overrides: Partial<{
    name: string;
    category: string;
    url: string;
  }> = {},
) {
  return await t.mutation(anyApi.sources.upsertSource, {
    name: overrides.name ?? "Test Source",
    url: overrides.url ?? `https://example-${Date.now()}-${Math.random()}.com`,
    category: (overrides.category ?? "aggregator") as any,
    scrape_method: "scrape" as const,
    scrape_frequency_hours: 24,
    wave: 1,
    is_active: true,
  });
}

/**
 * Helper to insert a raw_record directly into the database.
 */
async function insertRawRecord(t: any, sourceId: any, overrides: Partial<any> = {}) {
  return await t.run(async (ctx: any) => {
    return await ctx.db.insert("raw_records", {
      source_id: sourceId,
      title: overrides.title ?? "Test Scholarship",
      provider_organization: overrides.provider_organization ?? "Test Org",
      host_country: overrides.host_country ?? "DE",
      degree_levels: overrides.degree_levels ?? ["master"],
      description: overrides.description ?? "Test description",
      funding_type: overrides.funding_type ?? "fully_funded",
      source_url: overrides.source_url ?? "https://example.com",
      scraped_at: overrides.scraped_at ?? Date.now(),
      application_deadline: overrides.application_deadline ?? undefined,
      application_url: overrides.application_url ?? undefined,
      ...overrides,
    });
  });
}

describe("aggregateBatch", () => {
  it("merges multi-source records into one canonical entry", async () => {
    const t = convexTest(schema, modules);

    // Create two sources with different trust levels
    const sourceA = await createSource(t, {
      name: "Gov Source",
      category: "government",
      url: "https://gov-source.example.com",
    });
    const sourceB = await createSource(t, {
      name: "Agg Source",
      category: "aggregator",
      url: "https://agg-source.example.com",
    });

    // Insert raw_record from government source
    await insertRawRecord(t, sourceA, {
      title: "DAAD Scholarship 2025",
      provider_organization: "DAAD",
      host_country: "DE",
      degree_levels: ["master"],
      description: "Government description of DAAD",
    });

    // Insert raw_record from aggregator source -- similar title
    await insertRawRecord(t, sourceB, {
      title: "DAAD Scholarship Programme 2025",
      provider_organization: "DAAD",
      host_country: "DE",
      degree_levels: ["master", "phd"],
      description: "Aggregator description",
      source_url: "https://agg.example.com",
    });

    // Run aggregation
    await t.mutation(anyApi.aggregation.aggregateBatch, {
      cursor: null,
      batchSize: 50,
    });

    // Expect exactly 1 scholarship (merged)
    const scholarships = await t.run(async (ctx: any) => {
      return await ctx.db.query("scholarships").collect();
    });
    expect(scholarships).toHaveLength(1);

    const scholarship = scholarships[0];

    // Should have both source IDs
    expect(scholarship.source_ids).toContain(sourceA);
    expect(scholarship.source_ids).toContain(sourceB);

    // Degree levels should be union: master + phd
    expect(scholarship.degree_levels).toContain("master");
    expect(scholarship.degree_levels).toContain("phd");

    // Both raw_records should have canonical_id set
    const rawRecords = await t.run(async (ctx: any) => {
      return await ctx.db.query("raw_records").collect();
    });
    for (const rr of rawRecords) {
      expect(rr.canonical_id).toBe(scholarship._id);
    }
  });

  it("composite match detects cross-source duplicates", async () => {
    const t = convexTest(schema, modules);

    const sourceA = await createSource(t, {
      name: "Source A",
      category: "government",
      url: "https://a.example.com",
    });
    const sourceB = await createSource(t, {
      name: "Source B",
      category: "aggregator",
      url: "https://b.example.com",
    });

    // Insert first record and run aggregation
    await insertRawRecord(t, sourceA, {
      title: "Chevening Awards 2025",
      provider_organization: "FCDO",
      host_country: "GB",
      degree_levels: ["master"],
    });
    await t.mutation(anyApi.aggregation.aggregateBatch, {
      cursor: null,
      batchSize: 50,
    });

    // Insert second record with slightly different title but same normalized key
    await insertRawRecord(t, sourceB, {
      title: "Chevening Scholarship 2025",
      provider_organization: "FCDO",
      host_country: "GB",
      degree_levels: ["master"],
      source_url: "https://b.example.com/chevening",
    });
    await t.mutation(anyApi.aggregation.aggregateBatch, {
      cursor: null,
      batchSize: 50,
    });

    // Should have 1 scholarship total (both normalize to same match_key)
    const scholarships = await t.run(async (ctx: any) => {
      return await ctx.db.query("scholarships").collect();
    });
    expect(scholarships).toHaveLength(1);
  });

  it("richest field wins per trust hierarchy", async () => {
    const t = convexTest(schema, modules);

    const govSource = await createSource(t, {
      name: "Gov",
      category: "government",
      url: "https://gov.example.com",
    });
    const aggSource = await createSource(t, {
      name: "Agg",
      category: "aggregator",
      url: "https://agg.example.com",
    });

    // Insert from aggregator first
    await insertRawRecord(t, aggSource, {
      title: "Test Scholarship 2025",
      provider_organization: "TestOrg",
      host_country: "US",
      degree_levels: ["master"],
      description: "Short desc",
      source_url: "https://agg.example.com/test",
    });
    await t.mutation(anyApi.aggregation.aggregateBatch, {
      cursor: null,
      batchSize: 50,
    });

    // Insert from government source with richer description
    await insertRawRecord(t, govSource, {
      title: "Test Scholarship 2025",
      provider_organization: "TestOrg",
      host_country: "US",
      degree_levels: ["master"],
      description: "Detailed government description with more info",
      source_url: "https://gov.example.com/test",
    });
    await t.mutation(anyApi.aggregation.aggregateBatch, {
      cursor: null,
      batchSize: 50,
    });

    // The canonical scholarship's description should be from the government source
    const scholarships = await t.run(async (ctx: any) => {
      return await ctx.db.query("scholarships").collect();
    });
    expect(scholarships).toHaveLength(1);
    expect(scholarships[0].description).toBe("Detailed government description with more info");
  });

  it("preserves raw_records with canonical_id link", async () => {
    const t = convexTest(schema, modules);

    const source = await createSource(t, {
      name: "Src",
      url: "https://src.example.com",
    });
    await insertRawRecord(t, source, {
      title: "Preserve Test 2025",
      provider_organization: "Org",
      host_country: "US",
      degree_levels: ["bachelor"],
    });

    await t.mutation(anyApi.aggregation.aggregateBatch, {
      cursor: null,
      batchSize: 50,
    });

    // Raw record should still exist with canonical_id set
    const rawRecords = await t.run(async (ctx: any) => {
      return await ctx.db.query("raw_records").collect();
    });
    expect(rawRecords).toHaveLength(1);
    expect(rawRecords[0].canonical_id).toBeDefined();

    // Scholarship should reference the source
    const scholarships = await t.run(async (ctx: any) => {
      return await ctx.db.query("scholarships").collect();
    });
    expect(scholarships).toHaveLength(1);
    expect(scholarships[0].source_ids).toContain(source);
  });

  it("flags possible_duplicate for 3-of-4 field match without degree overlap", async () => {
    const t = convexTest(schema, modules);

    const source = await createSource(t, {
      name: "Dup Source",
      url: "https://dup.example.com",
    });

    // Insert first record with bachelor degree
    await insertRawRecord(t, source, {
      title: "Test Scholarship 2025",
      provider_organization: "Org",
      host_country: "US",
      degree_levels: ["bachelor"],
    });
    await t.mutation(anyApi.aggregation.aggregateBatch, {
      cursor: null,
      batchSize: 50,
    });

    // Insert second record with phd degree (NO overlap)
    await insertRawRecord(t, source, {
      title: "Test Scholarship 2025",
      provider_organization: "Org",
      host_country: "US",
      degree_levels: ["phd"],
      source_url: "https://dup.example.com/2",
    });
    await t.mutation(anyApi.aggregation.aggregateBatch, {
      cursor: null,
      batchSize: 50,
    });

    // Should have 2 separate scholarships (no degree overlap = no merge per D-03)
    const scholarships = await t.run(async (ctx: any) => {
      return await ctx.db.query("scholarships").collect();
    });
    expect(scholarships).toHaveLength(2);

    // Second raw_record should be flagged as possible_duplicate
    const rawRecords = await t.run(async (ctx: any) => {
      return await ctx.db.query("raw_records").collect();
    });
    const possibleDup = rawRecords.find((r: any) => r.match_status === "possible_duplicate");
    expect(possibleDup).toBeDefined();
  });

  it("detects cyclical scholarships and links via previous_cycle_id", async () => {
    const t = convexTest(schema, modules);

    const source = await createSource(t, {
      name: "Cycle Source",
      url: "https://cycle.example.com",
    });

    // Insert 2025 scholarship
    await insertRawRecord(t, source, {
      title: "DAAD Scholarship 2025",
      provider_organization: "DAAD",
      host_country: "DE",
      degree_levels: ["master"],
      application_deadline: "2025-10-15",
    });
    await t.mutation(anyApi.aggregation.aggregateBatch, {
      cursor: null,
      batchSize: 50,
    });

    // Insert 2026 scholarship (new cycle)
    await insertRawRecord(t, source, {
      title: "DAAD Scholarship 2026",
      provider_organization: "DAAD",
      host_country: "DE",
      degree_levels: ["master"],
      application_deadline: "2026-10-15",
      source_url: "https://cycle.example.com/2026",
    });
    await t.mutation(anyApi.aggregation.aggregateBatch, {
      cursor: null,
      batchSize: 50,
    });

    // Should have 2 scholarships (different years = different entries)
    const scholarships = await t.run(async (ctx: any) => {
      return await ctx.db.query("scholarships").collect();
    });
    expect(scholarships).toHaveLength(2);

    // Sort by creation time to identify 2025 and 2026
    const sorted = scholarships.sort((a: any, b: any) => a._creationTime - b._creationTime);
    const scholarship2025 = sorted[0];
    const scholarship2026 = sorted[1];

    // 2026 should point to 2025 via previous_cycle_id
    expect(scholarship2026.previous_cycle_id).toBe(scholarship2025._id);

    // 2025 should be archived
    expect(scholarship2025.status).toBe("archived");
  });

  it("auto-archives expired scholarships with expected_reopen_month", async () => {
    const t = convexTest(schema, modules);

    const source = await createSource(t, {
      name: "Expired Source",
      url: "https://expired.example.com",
    });

    // Insert raw_record with deadline 60 days ago
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const deadlineStr = sixtyDaysAgo.toISOString().split("T")[0];

    await insertRawRecord(t, source, {
      title: "Expired Scholarship 2025",
      provider_organization: "ExpOrg",
      host_country: "US",
      degree_levels: ["master"],
      application_deadline: deadlineStr,
    });

    await t.mutation(anyApi.aggregation.aggregateBatch, {
      cursor: null,
      batchSize: 50,
    });

    // The scholarship should be archived
    const scholarships = await t.run(async (ctx: any) => {
      return await ctx.db.query("scholarships").collect();
    });
    expect(scholarships).toHaveLength(1);
    expect(scholarships[0].status).toBe("archived");
    expect(scholarships[0].expected_reopen_month).toBeDefined();
  });
});

describe("archiveExpired", () => {
  it("archives published scholarships past deadline + 30 days", async () => {
    const t = convexTest(schema, modules);

    // Directly insert a scholarship with a deadline 45 days ago
    const fortyFiveDaysAgo = Date.now() - 45 * 24 * 60 * 60 * 1000;

    await t.run(async (ctx: any) => {
      await ctx.db.insert("scholarships", {
        title: "Old Scholarship",
        slug: "old-scholarship",
        description: "Test",
        provider_organization: "TestOrg",
        host_country: "US",
        degree_levels: ["master"],
        funding_type: "fully_funded",
        status: "published",
        source_ids: [],
        application_deadline: fortyFiveDaysAgo,
      });
    });

    await t.mutation(anyApi.aggregation.archiveExpired, {
      cursor: null,
    });

    const scholarships = await t.run(async (ctx: any) => {
      return await ctx.db.query("scholarships").collect();
    });
    expect(scholarships).toHaveLength(1);
    expect(scholarships[0].status).toBe("archived");
    expect(scholarships[0].expected_reopen_month).toBeDefined();
  });

  it("does not archive scholarships within 30 days of deadline", async () => {
    const t = convexTest(schema, modules);

    // Insert a scholarship with deadline 10 days ago
    const tenDaysAgo = Date.now() - 10 * 24 * 60 * 60 * 1000;

    await t.run(async (ctx: any) => {
      await ctx.db.insert("scholarships", {
        title: "Recent Scholarship",
        slug: "recent-scholarship",
        description: "Test",
        provider_organization: "TestOrg",
        host_country: "US",
        degree_levels: ["master"],
        funding_type: "fully_funded",
        status: "published",
        source_ids: [],
        application_deadline: tenDaysAgo,
      });
    });

    await t.mutation(anyApi.aggregation.archiveExpired, {
      cursor: null,
    });

    const scholarships = await t.run(async (ctx: any) => {
      return await ctx.db.query("scholarships").collect();
    });
    expect(scholarships).toHaveLength(1);
    expect(scholarships[0].status).toBe("published");
  });
});
