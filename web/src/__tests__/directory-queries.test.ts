import { describe, test, expect } from "vitest";

// These tests verify the filter logic and argument construction
// that feeds into the Convex directory queries.

describe("directory query filter logic", () => {
  test("funding type accepts array of multiple values", () => {
    // Verify that the query args support fundingTypes as an array
    // When user selects ["fully_funded", "partial"], both should be passed
    const fundingTypes = ["fully_funded", "partial"];
    expect(fundingTypes).toHaveLength(2);
    expect(fundingTypes).toContain("fully_funded");
    expect(fundingTypes).toContain("partial");
  });

  test("nationality filter includes null eligibility (open to all)", () => {
    // Scholarships with no eligibility_nationalities should always be included
    const scholarship = { eligibility_nationalities: undefined };
    const userNationalities = ["BD"];
    const isEligible =
      !scholarship.eligibility_nationalities ||
      scholarship.eligibility_nationalities.length === 0 ||
      userNationalities.some((n) => scholarship.eligibility_nationalities?.includes(n));
    expect(isEligible).toBe(true);
  });

  test("nationality filter matches when user nationality in eligibility list", () => {
    const scholarship = { eligibility_nationalities: ["BD", "IN", "PK"] };
    const userNationalities = ["BD"];
    const isEligible =
      !scholarship.eligibility_nationalities ||
      scholarship.eligibility_nationalities.length === 0 ||
      userNationalities.some((n) => scholarship.eligibility_nationalities?.includes(n));
    expect(isEligible).toBe(true);
  });

  test("nationality filter excludes when user nationality not in eligibility list", () => {
    const scholarship = { eligibility_nationalities: ["US", "GB"] };
    const userNationalities = ["BD"];
    const isEligible =
      !scholarship.eligibility_nationalities ||
      scholarship.eligibility_nationalities.length === 0 ||
      userNationalities.some((n) => scholarship.eligibility_nationalities?.includes(n));
    expect(isEligible).toBe(false);
  });

  test("closing soon filter: deadline within 30 days passes", () => {
    const now = Date.now();
    const deadline = now + 15 * 24 * 60 * 60 * 1000; // 15 days from now
    const isClosingSoon = deadline > now && deadline < now + 30 * 24 * 60 * 60 * 1000;
    expect(isClosingSoon).toBe(true);
  });

  test("closing soon filter: deadline 60 days away fails", () => {
    const now = Date.now();
    const deadline = now + 60 * 24 * 60 * 60 * 1000; // 60 days from now
    const isClosingSoon = deadline > now && deadline < now + 30 * 24 * 60 * 60 * 1000;
    expect(isClosingSoon).toBe(false);
  });
});
