// @vitest-environment edge-runtime

import { anyApi } from "convex/server";
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "../../convex/schema";

const modules = import.meta.glob("../../convex/**/*.*s");

async function createSource(t: any) {
  return await t.mutation(anyApi.sources.upsertSource, {
    name: `SEO Source ${Date.now()}-${Math.random()}`,
    url: `https://seo-${Date.now()}-${Math.random()}.example.com`,
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
    host_country: string;
    degree_levels: string[];
    funding_type: "fully_funded" | "partial" | "tuition_waiver" | "stipend_only";
    fields_of_study: string[];
    application_deadline: number;
  }> = {},
) {
  return await t.run(async (ctx: any) => {
    return await ctx.db.insert("scholarships", {
      title: overrides.title ?? `SEO Test ${Date.now()}-${Math.random()}`,
      slug: overrides.slug ?? `seo-test-${Date.now()}-${Math.random()}`,
      provider_organization: "SEO Org",
      host_country: overrides.host_country ?? "US",
      degree_levels: overrides.degree_levels ?? ["master"],
      funding_type: overrides.funding_type ?? "partial",
      fields_of_study: overrides.fields_of_study ?? ["Engineering"],
      application_deadline: overrides.application_deadline,
      status: "published",
      source_ids: [sourceId],
      application_url: "https://example.com/apply",
    });
  });
}

describe("SEO cache refresh", () => {
  it("builds taxonomy/country/degree caches and serves landing data", async () => {
    const t = convexTest(schema, modules);
    const sourceId = await createSource(t);
    const soon = Date.now() + 7 * 24 * 60 * 60 * 1000;

    await insertScholarship(t, sourceId, {
      title: "US Master Scholarship A",
      slug: "us-master-a",
      host_country: "US",
      degree_levels: ["master"],
      funding_type: "fully_funded",
      fields_of_study: ["Engineering"],
      application_deadline: soon,
    });

    await insertScholarship(t, sourceId, {
      title: "US Master Scholarship B",
      slug: "us-master-b",
      host_country: "US",
      degree_levels: ["master", "phd"],
      funding_type: "partial",
      fields_of_study: ["Computer Science"],
      application_deadline: soon,
    });

    await insertScholarship(t, sourceId, {
      title: "CA PhD Scholarship",
      slug: "ca-phd",
      host_country: "CA",
      degree_levels: ["phd"],
      funding_type: "partial",
      fields_of_study: ["Physics"],
      application_deadline: soon,
    });

    const refresh = await t.mutation(anyApi.seo.refreshSeoCaches, {});
    expect(refresh.skipped).toBe(false);

    const taxonomies = await t.query(anyApi.seo.getLandingTaxonomies, {});
    const usEntry = taxonomies.topCountries.find((c: any) => c.code === "US");
    expect(usEntry?.count).toBe(2);

    const countryLanding = await t.query(anyApi.seo.getCountryLandingData, { countryCode: "US" });
    expect(countryLanding.stats.total).toBe(2);
    expect(countryLanding.stats.fullyFunded).toBe(1);

    const degreeLanding = await t.query(anyApi.seo.getDegreeLandingData, { degreeLevel: "master" });
    expect(degreeLanding.stats.total).toBe(2);
    expect(degreeLanding.stats.topCountries[0]).toBe("US");
  });
});
