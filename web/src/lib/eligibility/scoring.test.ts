import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  scoreScholarship,
  scoreAllScholarships,
  isClosingSoon,
  DEFAULT_WEIGHTS,
} from "./scoring";
import type {
  StudentProfile,
  EligibilitySummary,
  ScoredScholarship,
} from "./types";

// Helper to create a base student profile
function makeProfile(
  overrides: Partial<StudentProfile> = {},
): StudentProfile {
  return {
    nationalities: ["BD"],
    degreeLevel: "master",
    fieldsOfStudy: ["Computer Science"],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

// Helper to create a base scholarship
function makeScholarship(
  overrides: Partial<EligibilitySummary> = {},
): EligibilitySummary {
  return {
    _id: "1",
    title: "Test Scholarship",
    slug: "test-scholarship",
    host_countries: ["DE"],
    degree_levels: ["master"],
    prestige_tier: "gold",
    ...overrides,
  };
}

describe("scoreScholarship", () => {
  it("scores a perfect match as Strong tier (~100 points)", () => {
    const profile = makeProfile({
      nationalities: ["BD"],
      degreeLevel: "master",
      fieldsOfStudy: ["Computer Science"],
      fundingPreference: "fully_funded",
      gender: "male",
    });

    const scholarship = makeScholarship({
      eligibility_nationalities: ["BD", "IN", "PK"],
      degree_levels: ["master", "phd"],
      fields_of_study: ["Computer Science", "Engineering"],
      funding_type: "fully_funded",
      gender_requirement: undefined, // no gender restriction
    });

    const result = scoreScholarship(scholarship, profile);

    expect(result.tier).toBe("strong");
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.breakdown.nationality).toBe("match");
    expect(result.breakdown.degree).toBe("match");
    expect(result.breakdown.field).toBe("match");
  });

  it("scores nationality + degree match with no field data as Good tier", () => {
    const profile = makeProfile({
      nationalities: ["BD"],
      degreeLevel: "master",
      fieldsOfStudy: ["Computer Science"],
    });

    const scholarship = makeScholarship({
      eligibility_nationalities: ["BD", "IN"],
      degree_levels: ["master"],
      fields_of_study: undefined, // no field data
      funding_type: undefined, // no funding data
      gender_requirement: undefined,
    });

    const result = scoreScholarship(scholarship, profile);

    // nationality (35) + degree (25) = 60 known points
    // field unknown, funding unknown => those count as unknown
    // With 2 unknowns (field, funding) but < 3, tier based on score
    expect(result.tier).toBe("good");
    expect(result.score).toBeGreaterThanOrEqual(50);
    expect(result.score).toBeLessThan(80);
    expect(result.breakdown.nationality).toBe("match");
    expect(result.breakdown.degree).toBe("match");
    expect(result.breakdown.field).toBe("unknown");
  });

  it("classifies as Possible when 3+ dimensions are unknown (D-19)", () => {
    const profile = makeProfile({
      nationalities: ["BD"],
      degreeLevel: "master",
      fieldsOfStudy: ["Computer Science"],
    });

    // Scholarship with very sparse data - only has title/slug/countries
    const scholarship = makeScholarship({
      eligibility_nationalities: undefined,
      degree_levels: [], // empty
      fields_of_study: undefined,
      funding_type: undefined,
      gender_requirement: undefined,
    });

    const result = scoreScholarship(scholarship, profile);

    // nationality unknown, degree unknown, field unknown, funding unknown = 4+ unknowns
    expect(result.tier).toBe("possible");
  });

  it("gives 0 nationality points when user nationality not in restricted list", () => {
    const profile = makeProfile({
      nationalities: ["BD"],
      degreeLevel: "master",
      fieldsOfStudy: ["Computer Science"],
    });

    const scholarship = makeScholarship({
      eligibility_nationalities: ["US", "GB", "CA"], // BD not included
      degree_levels: ["master"],
      fields_of_study: ["Computer Science"],
    });

    const result = scoreScholarship(scholarship, profile);

    expect(result.breakdown.nationality).toBe("no_match");
    // Score should be reduced by nationality weight (35 points)
    expect(result.score).toBeLessThan(70); // max possible without nationality = 65
  });

  it("gives full nationality points for open-to-all scholarship (no nationality restrictions)", () => {
    const profile = makeProfile({
      nationalities: ["BD"],
      degreeLevel: "master",
      fieldsOfStudy: ["Computer Science"],
    });

    const scholarship = makeScholarship({
      eligibility_nationalities: undefined, // no restriction = open to all
      degree_levels: ["master"],
      fields_of_study: ["Computer Science"],
    });

    const result = scoreScholarship(scholarship, profile);

    // "not_required" means scholarship has no restriction - full points
    expect(result.breakdown.nationality).toBe("not_required");
  });

  it("gives partial field points (10) when scholarship has no field restrictions (open to all)", () => {
    const profile = makeProfile({
      fieldsOfStudy: ["Computer Science"],
    });

    const scholarship = makeScholarship({
      eligibility_nationalities: ["BD"],
      degree_levels: ["master"],
      fields_of_study: [], // empty = open to all fields
    });

    const result = scoreScholarship(scholarship, profile);

    expect(result.breakdown.field).toBe("partial");
  });

  it("isClosingSoon returns true for deadline 15 days away", () => {
    const fifteenDays = 15 * 24 * 60 * 60 * 1000;
    const deadline = Date.now() + fifteenDays;

    expect(isClosingSoon(deadline)).toBe(true);
  });

  it("isClosingSoon returns false for deadline 45 days away", () => {
    const fortyFiveDays = 45 * 24 * 60 * 60 * 1000;
    const deadline = Date.now() + fortyFiveDays;

    expect(isClosingSoon(deadline)).toBe(false);
  });

  it("isClosingSoon returns false for undefined deadline", () => {
    expect(isClosingSoon(undefined)).toBe(false);
  });

  it("isClosingSoon returns false for expired deadline", () => {
    const pastDeadline = Date.now() - 24 * 60 * 60 * 1000;
    expect(isClosingSoon(pastDeadline)).toBe(false);
  });
});

describe("scoreAllScholarships", () => {
  it("groups results by tier correctly and sorts by score descending", () => {
    const profile = makeProfile({
      nationalities: ["BD"],
      degreeLevel: "master",
      fieldsOfStudy: ["Computer Science"],
      fundingPreference: "fully_funded",
      gender: "male",
    });

    const strongMatch = makeScholarship({
      _id: "strong",
      title: "Strong Scholarship",
      eligibility_nationalities: ["BD"],
      degree_levels: ["master"],
      fields_of_study: ["Computer Science"],
      funding_type: "fully_funded",
    });

    const goodMatch = makeScholarship({
      _id: "good",
      title: "Good Scholarship",
      eligibility_nationalities: ["BD"],
      degree_levels: ["master"],
      fields_of_study: undefined, // field unknown
      funding_type: undefined, // funding unknown
    });

    const partialMatch = makeScholarship({
      _id: "partial",
      title: "Partial Scholarship",
      eligibility_nationalities: ["US", "GB"], // nationality mismatch
      degree_levels: ["master"],
      fields_of_study: ["Computer Science"],
      funding_type: "fully_funded",
    });

    const possibleMatch = makeScholarship({
      _id: "possible",
      title: "Possible Scholarship",
      eligibility_nationalities: undefined,
      degree_levels: [],
      fields_of_study: undefined,
      funding_type: undefined,
    });

    const results = scoreAllScholarships(
      [strongMatch, goodMatch, partialMatch, possibleMatch],
      profile,
    );

    expect(results.strong.length).toBeGreaterThanOrEqual(1);
    expect(results.strong[0].scholarship._id).toBe("strong");

    expect(results.good.length).toBeGreaterThanOrEqual(1);

    // All tiers exist as keys
    expect(results).toHaveProperty("strong");
    expect(results).toHaveProperty("good");
    expect(results).toHaveProperty("partial");
    expect(results).toHaveProperty("possible");

    // Within each tier, items are sorted by score descending
    for (const tier of ["strong", "good", "partial", "possible"] as const) {
      const items = results[tier];
      for (let i = 1; i < items.length; i++) {
        expect(items[i].score).toBeLessThanOrEqual(items[i - 1].score);
      }
    }
  });
});

describe("DEFAULT_WEIGHTS", () => {
  it("sums to 100 and respects weight hierarchy (D-18)", () => {
    const sum =
      DEFAULT_WEIGHTS.nationality +
      DEFAULT_WEIGHTS.degree +
      DEFAULT_WEIGHTS.fieldOfStudy +
      DEFAULT_WEIGHTS.fundingType +
      DEFAULT_WEIGHTS.demographics;

    expect(sum).toBe(100);
    expect(DEFAULT_WEIGHTS.nationality).toBeGreaterThan(DEFAULT_WEIGHTS.degree);
    expect(DEFAULT_WEIGHTS.degree).toBeGreaterThan(
      DEFAULT_WEIGHTS.fieldOfStudy,
    );
  });
});
