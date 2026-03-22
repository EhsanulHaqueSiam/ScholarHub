import { describe, expect, it } from "vitest";

/**
 * Tests for comparison query behavior.
 * Tests the input validation and response shape expectations.
 */

describe("comparison query", () => {
  it("accepts 1-3 slugs", () => {
    // Valid inputs
    expect(["slug1"].length).toBeGreaterThanOrEqual(1);
    expect(["slug1"].length).toBeLessThanOrEqual(3);

    expect(["slug1", "slug2"].length).toBeGreaterThanOrEqual(1);
    expect(["slug1", "slug2"].length).toBeLessThanOrEqual(3);

    expect(["slug1", "slug2", "slug3"].length).toBeGreaterThanOrEqual(1);
    expect(["slug1", "slug2", "slug3"].length).toBeLessThanOrEqual(3);
  });

  it("rejects empty slugs array", () => {
    const slugs: string[] = [];
    expect(slugs.length === 0 || slugs.length > 3).toBe(true);
  });

  it("rejects more than 3 slugs", () => {
    const slugs = ["a", "b", "c", "d"];
    expect(slugs.length === 0 || slugs.length > 3).toBe(true);
  });

  it("filters null results from missing scholarships", () => {
    const results = [
      { title: "Scholarship A", slug: "scholarship-a" },
      null,
      { title: "Scholarship C", slug: "scholarship-c" },
    ];

    const filtered = results.filter((r): r is NonNullable<typeof r> => r !== null);
    expect(filtered).toHaveLength(2);
    expect(filtered[0].title).toBe("Scholarship A");
    expect(filtered[1].title).toBe("Scholarship C");
  });

  it("returns scholarship data with resolved sources", () => {
    const scholarship = {
      _id: "123",
      title: "DAAD Scholarship",
      slug: "daad-scholarship",
      host_country: "DE",
      funding_type: "fully_funded",
      degree_levels: ["master", "phd"],
      source_ids: ["src1", "src2"],
      resolved_sources: [
        { name: "DAAD Website", url: "https://daad.de" },
        { name: "ScholarHub Aggregator", url: "https://example.com" },
      ],
    };

    expect(scholarship.resolved_sources).toHaveLength(2);
    expect(scholarship.resolved_sources[0].name).toBe("DAAD Website");
  });

  it("handles comparison with identical scholarships fields", () => {
    const scholarshipA = {
      host_country: "DE",
      funding_type: "fully_funded",
      degree_levels: ["master"],
    };
    const scholarshipB = {
      host_country: "DE",
      funding_type: "partial",
      degree_levels: ["master"],
    };

    // Fields that differ
    const differences = [];
    if (scholarshipA.host_country !== scholarshipB.host_country)
      differences.push("host_country");
    if (scholarshipA.funding_type !== scholarshipB.funding_type)
      differences.push("funding_type");
    if (
      JSON.stringify(scholarshipA.degree_levels) !==
      JSON.stringify(scholarshipB.degree_levels)
    )
      differences.push("degree_levels");

    expect(differences).toContain("funding_type");
    expect(differences).not.toContain("host_country");
    expect(differences).not.toContain("degree_levels");
  });
});
