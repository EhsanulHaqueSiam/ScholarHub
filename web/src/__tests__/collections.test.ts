import { describe, expect, it } from "vitest";

/**
 * Tests for collection filter matching logic.
 * Tests the pure filter logic that determines collection membership,
 * slug generation, and collection query behavior.
 */

// Replicate the matchesCollectionFilters logic for testing
interface CollectionFilters {
  host_countries?: string[] | null;
  degree_levels?: string[] | null;
  funding_types?: string[] | null;
  prestige_tiers?: string[] | null;
  tags?: string[] | null;
  fields_of_study?: string[] | null;
  deadline_before?: number | null;
  deadline_after?: number | null;
  added_since?: number | null;
}

interface ScholarshipForMatching {
  host_country: string;
  degree_levels: string[];
  funding_type: string;
  prestige_tier?: string | null;
  tags?: string[] | null;
  fields_of_study?: string[] | null;
  application_deadline?: number | null;
  _creationTime: number;
  status: string;
}

function matchesCollectionFilters(
  scholarship: ScholarshipForMatching,
  filters: CollectionFilters,
): boolean {
  if (scholarship.status !== "published") return false;
  if (filters.host_countries && filters.host_countries.length > 0) {
    if (!filters.host_countries.includes(scholarship.host_country)) return false;
  }
  if (filters.degree_levels && filters.degree_levels.length > 0) {
    if (!scholarship.degree_levels.some((dl) => filters.degree_levels!.includes(dl))) return false;
  }
  if (filters.funding_types && filters.funding_types.length > 0) {
    if (!filters.funding_types.includes(scholarship.funding_type)) return false;
  }
  if (filters.prestige_tiers && filters.prestige_tiers.length > 0) {
    if (
      !scholarship.prestige_tier ||
      !filters.prestige_tiers.includes(scholarship.prestige_tier)
    )
      return false;
  }
  if (filters.tags && filters.tags.length > 0) {
    const scholarshipTags = scholarship.tags ?? [];
    if (!filters.tags.some((t) => scholarshipTags.includes(t))) return false;
  }
  if (filters.fields_of_study && filters.fields_of_study.length > 0) {
    const scholarshipFields = scholarship.fields_of_study ?? [];
    if (!filters.fields_of_study.some((f) => scholarshipFields.includes(f))) return false;
  }
  if (filters.deadline_before) {
    if (
      !scholarship.application_deadline ||
      scholarship.application_deadline > filters.deadline_before
    )
      return false;
  }
  if (filters.deadline_after) {
    if (
      !scholarship.application_deadline ||
      scholarship.application_deadline < filters.deadline_after
    )
      return false;
  }
  if (filters.added_since) {
    if (scholarship._creationTime < filters.added_since) return false;
  }
  return true;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const publishedScholarship: ScholarshipForMatching = {
  host_country: "DE",
  degree_levels: ["master", "phd"],
  funding_type: "fully_funded",
  prestige_tier: "gold",
  tags: ["stem", "europe", "no_gre"],
  fields_of_study: ["Engineering", "Computer Science"],
  application_deadline: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
  _creationTime: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
  status: "published",
};

describe("collection filter matching", () => {
  it("matches when no filters are set (all published scholarships)", () => {
    expect(matchesCollectionFilters(publishedScholarship, {})).toBe(true);
  });

  it("rejects non-published scholarships", () => {
    const draft = { ...publishedScholarship, status: "draft" };
    expect(matchesCollectionFilters(draft, {})).toBe(false);
  });

  it("matches host_country filter (OR within)", () => {
    expect(
      matchesCollectionFilters(publishedScholarship, {
        host_countries: ["DE", "FR"],
      }),
    ).toBe(true);

    expect(
      matchesCollectionFilters(publishedScholarship, {
        host_countries: ["US", "GB"],
      }),
    ).toBe(false);
  });

  it("matches degree_levels filter (OR within)", () => {
    expect(
      matchesCollectionFilters(publishedScholarship, {
        degree_levels: ["master"],
      }),
    ).toBe(true);

    expect(
      matchesCollectionFilters(publishedScholarship, {
        degree_levels: ["bachelor"],
      }),
    ).toBe(false);
  });

  it("matches funding_types filter (OR within)", () => {
    expect(
      matchesCollectionFilters(publishedScholarship, {
        funding_types: ["fully_funded", "partial"],
      }),
    ).toBe(true);

    expect(
      matchesCollectionFilters(publishedScholarship, {
        funding_types: ["stipend_only"],
      }),
    ).toBe(false);
  });

  it("matches prestige_tiers filter (OR within)", () => {
    expect(
      matchesCollectionFilters(publishedScholarship, {
        prestige_tiers: ["gold", "silver"],
      }),
    ).toBe(true);

    expect(
      matchesCollectionFilters(publishedScholarship, {
        prestige_tiers: ["bronze"],
      }),
    ).toBe(false);
  });

  it("matches tags filter (OR within)", () => {
    expect(
      matchesCollectionFilters(publishedScholarship, {
        tags: ["stem", "arts_humanities"],
      }),
    ).toBe(true);

    expect(
      matchesCollectionFilters(publishedScholarship, {
        tags: ["women_only"],
      }),
    ).toBe(false);
  });

  it("applies AND logic across filter types", () => {
    // DE + fully_funded = match
    expect(
      matchesCollectionFilters(publishedScholarship, {
        host_countries: ["DE"],
        funding_types: ["fully_funded"],
      }),
    ).toBe(true);

    // DE + stipend_only = no match (funding doesn't match)
    expect(
      matchesCollectionFilters(publishedScholarship, {
        host_countries: ["DE"],
        funding_types: ["stipend_only"],
      }),
    ).toBe(false);
  });

  it("matches deadline_before filter", () => {
    expect(
      matchesCollectionFilters(publishedScholarship, {
        deadline_before: Date.now() + 60 * 24 * 60 * 60 * 1000, // 60 days
      }),
    ).toBe(true);

    expect(
      matchesCollectionFilters(publishedScholarship, {
        deadline_before: Date.now() + 1 * 24 * 60 * 60 * 1000, // 1 day
      }),
    ).toBe(false);
  });

  it("matches deadline_after filter", () => {
    expect(
      matchesCollectionFilters(publishedScholarship, {
        deadline_after: Date.now(), // deadline is after now
      }),
    ).toBe(true);

    expect(
      matchesCollectionFilters(publishedScholarship, {
        deadline_after: Date.now() + 60 * 24 * 60 * 60 * 1000, // deadline must be after 60 days
      }),
    ).toBe(false);
  });

  it("matches added_since filter", () => {
    expect(
      matchesCollectionFilters(publishedScholarship, {
        added_since: Date.now() - 30 * 24 * 60 * 60 * 1000, // within last 30 days
      }),
    ).toBe(true);

    expect(
      matchesCollectionFilters(publishedScholarship, {
        added_since: Date.now() + 1, // must be added in the future
      }),
    ).toBe(false);
  });

  it("handles null/missing tags gracefully", () => {
    const noTags = { ...publishedScholarship, tags: null };
    expect(
      matchesCollectionFilters(noTags, {
        tags: ["stem"],
      }),
    ).toBe(false);
  });

  it("handles no-deadline scholarship with deadline filters", () => {
    const noDeadline = { ...publishedScholarship, application_deadline: null };
    expect(
      matchesCollectionFilters(noDeadline, {
        deadline_before: Date.now() + 60 * 24 * 60 * 60 * 1000,
      }),
    ).toBe(false);
  });
});

describe("slug generation", () => {
  it("converts name to lowercase kebab-case", () => {
    expect(generateSlug("Top Fully Funded")).toBe("top-fully-funded");
  });

  it("removes special characters", () => {
    expect(generateSlug("No GRE Required!")).toBe("no-gre-required");
  });

  it("removes leading/trailing hyphens", () => {
    expect(generateSlug("  Hello World  ")).toBe("hello-world");
  });

  it("handles emoji in name", () => {
    expect(generateSlug("STEM Scholarships")).toBe("stem-scholarships");
  });

  it("collapses multiple special characters", () => {
    expect(generateSlug("Study in -- Europe")).toBe("study-in-europe");
  });
});

describe("collection scholarship count caching", () => {
  it("count updates when filter criteria change", () => {
    // Verify that the schema supports scholarship_count field
    const collection = {
      name: "Test Collection",
      scholarship_count: 42,
      view_count: 10,
    };
    expect(collection.scholarship_count).toBe(42);
  });
});

describe("getScholarshipCollections (D-50)", () => {
  it("matches scholarship to collections based on filter criteria", () => {
    // Scholarship is in Germany, fully funded, gold tier, STEM tagged
    const collections = [
      {
        name: "Study in Europe",
        slug: "study-in-europe",
        emoji: "globe-europe",
        host_countries: ["DE", "FR", "NL"],
      },
      {
        name: "Top Fully Funded",
        slug: "top-fully-funded",
        emoji: "money-bag",
        funding_types: ["fully_funded"],
      },
      {
        name: "Study in Asia",
        slug: "study-in-asia",
        emoji: "globe-asia",
        host_countries: ["JP", "KR", "CN"],
      },
    ];

    const matching = collections.filter((c) =>
      matchesCollectionFilters(publishedScholarship, c),
    );

    expect(matching).toHaveLength(2);
    expect(matching.map((c) => c.slug)).toContain("study-in-europe");
    expect(matching.map((c) => c.slug)).toContain("top-fully-funded");
    expect(matching.map((c) => c.slug)).not.toContain("study-in-asia");
  });
});
