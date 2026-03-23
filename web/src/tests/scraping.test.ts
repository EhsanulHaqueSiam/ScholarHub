// @vitest-environment edge-runtime

import { anyApi } from "convex/server";
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "../../convex/schema";

const modules = import.meta.glob("../../convex/**/*.*s");

async function createSource(t: any) {
  return await t.mutation(anyApi.sources.upsertSource, {
    name: `Scraping Source ${Date.now()}-${Math.random()}`,
    url: `https://scraping-${Date.now()}-${Math.random()}.example.com`,
    category: "aggregator",
    scrape_method: "scrape",
    trust_level: "needs_review",
    scrape_frequency_hours: 24,
    wave: 1,
    is_active: true,
  });
}

describe("Scraping ingestion", () => {
  it("truncates large raw_data payloads before persisting raw_records", async () => {
    const t = convexTest(schema, modules);
    const sourceId = await createSource(t);

    const runId = await t.mutation(anyApi.scraping.startRun, {
      triggered_by: "test",
      sources_targeted: 1,
    });

    const hugeRawData = "x".repeat(20000);

    const result = await t.mutation(anyApi.scraping.batchInsertRawRecords, {
      run_id: runId,
      records: [
        {
          source_id: sourceId,
          title: "Large Raw Data Record",
          source_url: "https://example.com/raw",
          raw_data: hugeRawData,
        },
      ],
    });

    expect(result.inserted).toBe(1);

    const stored = await t.run(async (ctx: any) => {
      return await ctx.db
        .query("raw_records")
        .withIndex("by_source", (q: any) => q.eq("source_id", sourceId))
        .first();
    });

    expect(stored).toBeTruthy();
    expect(stored.raw_data).toBeTruthy();
    expect(stored.raw_data.length).toBe(2048);
  });
});

