import { describe, expect, it } from "vitest";
import {
  DEFAULT_RELATED_WEIGHTS,
  intersectionSize,
  scoreRelated,
} from "../../convex/related";

describe("related scholarships scoring", () => {
  const baseSource = {
    provider_organization: "DAAD",
    host_country: "DE",
    degree_levels: ["master", "phd"],
    funding_type: "fully_funded",
    tags: ["stem", "europe", "no_gre", "merit_based", "research_grant"],
  };

  describe("intersectionSize", () => {
    it("counts common elements between two arrays", () => {
      expect(intersectionSize(["a", "b", "c"], ["b", "c", "d"])).toBe(2);
    });

    it("returns 0 for disjoint arrays", () => {
      expect(intersectionSize(["a", "b"], ["c", "d"])).toBe(0);
    });

    it("returns full length for identical arrays", () => {
      expect(intersectionSize(["a", "b"], ["a", "b"])).toBe(2);
    });

    it("handles empty arrays", () => {
      expect(intersectionSize([], ["a"])).toBe(0);
      expect(intersectionSize(["a"], [])).toBe(0);
      expect(intersectionSize([], [])).toBe(0);
    });
  });

  describe("scoreRelated", () => {
    it("gives provider weight (35) for same provider", () => {
      const candidate = {
        ...baseSource,
        host_country: "FR",
        degree_levels: ["bachelor"],
        funding_type: "partial",
        tags: [],
      };

      const score = scoreRelated(baseSource, candidate);
      // Provider: 35, Country: 0, Degree: 0/2 = 0, Funding: 0, Tags: 0/5 = 0
      expect(score).toBe(DEFAULT_RELATED_WEIGHTS.provider);
    });

    it("gives country weight (25) for same country", () => {
      const candidate = {
        provider_organization: "Other Org",
        host_country: "DE",
        degree_levels: ["bachelor"],
        funding_type: "partial",
        tags: [] as string[],
      };

      const score = scoreRelated(baseSource, candidate);
      // Provider: 0, Country: 25, Degree: 0/2 = 0, Funding: 0, Tags: 0/5 = 0
      expect(score).toBe(DEFAULT_RELATED_WEIGHTS.country);
    });

    it("gives full degree weight for exact degree match", () => {
      const candidate = {
        provider_organization: "Other Org",
        host_country: "FR",
        degree_levels: ["master", "phd"],
        funding_type: "partial",
        tags: [] as string[],
      };

      const score = scoreRelated(baseSource, candidate);
      // Provider: 0, Country: 0, Degree: 2/2 * 15 = 15, Funding: 0, Tags: 0/5 = 0
      expect(score).toBe(DEFAULT_RELATED_WEIGHTS.degree);
    });

    it("gives proportional degree weight for partial overlap", () => {
      const candidate = {
        provider_organization: "Other Org",
        host_country: "FR",
        degree_levels: ["master"],
        funding_type: "partial",
        tags: [] as string[],
      };

      const score = scoreRelated(baseSource, candidate);
      // Provider: 0, Country: 0, Degree: 1/2 * 15 = 7.5, Funding: 0, Tags: 0/5 = 0
      expect(score).toBe(7.5);
    });

    it("gives funding weight for same funding type", () => {
      const candidate = {
        provider_organization: "Other Org",
        host_country: "FR",
        degree_levels: ["bachelor"],
        funding_type: "fully_funded",
        tags: [] as string[],
      };

      const score = scoreRelated(baseSource, candidate);
      // Provider: 0, Country: 0, Degree: 0/2 = 0, Funding: 15, Tags: 0/5 = 0
      expect(score).toBe(DEFAULT_RELATED_WEIGHTS.funding);
    });

    it("gives proportional tag weight for partial tag overlap", () => {
      const candidate = {
        provider_organization: "Other Org",
        host_country: "FR",
        degree_levels: ["bachelor"],
        funding_type: "partial",
        tags: ["stem", "europe", "no_gre"],
      };

      const score = scoreRelated(baseSource, candidate);
      // Provider: 0, Country: 0, Degree: 0/2 = 0, Funding: 0, Tags: 3/5 * 10 = 6
      expect(score).toBe(6);
    });

    it("gives full score for identical scholarships (minus self)", () => {
      const score = scoreRelated(baseSource, baseSource);
      // Provider: 35, Country: 25, Degree: 2/2 * 15 = 15, Funding: 15, Tags: 5/5 * 10 = 10
      expect(score).toBe(100);
    });

    it("gives 0 for completely different scholarships", () => {
      const candidate = {
        provider_organization: "Different Org",
        host_country: "JP",
        degree_levels: ["bachelor"],
        funding_type: "stipend_only",
        tags: ["arts_humanities"] as string[],
      };

      const score = scoreRelated(baseSource, candidate);
      expect(score).toBe(0);
    });

    it("handles null/empty tags gracefully", () => {
      const sourceNoTags = { ...baseSource, tags: null };
      const candidateNoTags = {
        provider_organization: "DAAD",
        host_country: "FR",
        degree_levels: ["bachelor"],
        funding_type: "partial",
        tags: null as string[] | null,
      };

      const score = scoreRelated(sourceNoTags, candidateNoTags);
      // Provider: 35, no tags to compare
      expect(score).toBe(35);
    });

    it("respects custom weights", () => {
      const customWeights = {
        provider: 50,
        country: 20,
        degree: 10,
        funding: 10,
        tags: 10,
      };

      const candidate = {
        provider_organization: "DAAD",
        host_country: "FR",
        degree_levels: ["bachelor"],
        funding_type: "partial",
        tags: [] as string[],
      };

      const score = scoreRelated(baseSource, candidate, customWeights);
      // Provider: 50, Country: 0, Degree: 0/2 = 0, Funding: 0, Tags: 0/5 = 0
      expect(score).toBe(50);
    });
  });

  describe("DEFAULT_RELATED_WEIGHTS", () => {
    it("has all 5 weight factors", () => {
      expect(DEFAULT_RELATED_WEIGHTS).toHaveProperty("provider");
      expect(DEFAULT_RELATED_WEIGHTS).toHaveProperty("country");
      expect(DEFAULT_RELATED_WEIGHTS).toHaveProperty("degree");
      expect(DEFAULT_RELATED_WEIGHTS).toHaveProperty("funding");
      expect(DEFAULT_RELATED_WEIGHTS).toHaveProperty("tags");
    });

    it("weights sum to 100", () => {
      const sum = Object.values(DEFAULT_RELATED_WEIGHTS).reduce((a, b) => a + b, 0);
      expect(sum).toBe(100);
    });
  });
});
