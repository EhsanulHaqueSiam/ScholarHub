import { describe, expect, it } from "vitest";
import {
  AUTO_TAG_RULES,
  computeSuggestedTags,
  computeAutoTags,
} from "../../convex/tagging";

describe("auto-tagging rules", () => {
  describe("computeSuggestedTags", () => {
    it("detects no_gre from description containing 'GRE not required'", () => {
      const suggestions = computeSuggestedTags({
        title: "DAAD Scholarship",
        description: "This scholarship does not require GRE. GRE not required for admission.",
        host_country: "DE",
      });

      const noGre = suggestions.find((s) => s.tag === "no_gre");
      expect(noGre).toBeDefined();
      expect(noGre!.reason).toContain("Matched");
    });

    it("detects no_gre from 'No GRE' in title", () => {
      const suggestions = computeSuggestedTags({
        title: "No GRE Required Masters Programs",
        description: "Apply without standardized tests.",
        host_country: "US",
      });

      const noGre = suggestions.find((s) => s.tag === "no_gre");
      expect(noGre).toBeDefined();
    });

    it("detects women_only from title", () => {
      const suggestions = computeSuggestedTags({
        title: "Women Only Scholarship for STEM",
        description: "Supporting women in technology fields.",
        host_country: "GB",
      });

      const womenOnly = suggestions.find((s) => s.tag === "women_only");
      expect(womenOnly).toBeDefined();
      expect(womenOnly!.reason).toContain("title");
    });

    it("detects women_only from 'for women' in description", () => {
      const suggestions = computeSuggestedTags({
        title: "Graduate Scholarship",
        description: "This program is exclusively for women in engineering.",
        host_country: "US",
      });

      const womenOnly = suggestions.find((s) => s.tag === "women_only");
      expect(womenOnly).toBeDefined();
    });

    it("detects stem from fields_of_study", () => {
      const suggestions = computeSuggestedTags({
        title: "Engineering Scholarship",
        description: "Study engineering abroad.",
        fields_of_study: ["STEM", "Engineering"],
        host_country: "US",
      });

      const stem = suggestions.find((s) => s.tag === "stem");
      expect(stem).toBeDefined();
    });

    it("detects developing_countries from description", () => {
      const suggestions = computeSuggestedTags({
        title: "Global South Scholarship",
        description: "Available for students from developing countries worldwide.",
        host_country: "GB",
      });

      const devCountries = suggestions.find((s) => s.tag === "developing_countries");
      expect(devCountries).toBeDefined();
    });

    it("detects region tag from host_country DE -> europe", () => {
      const suggestions = computeSuggestedTags({
        title: "DAAD Scholarship",
        description: "Study in Germany.",
        host_country: "DE",
      });

      const europe = suggestions.find((s) => s.tag === "europe");
      expect(europe).toBeDefined();
      expect(europe!.reason).toContain("Europe");
    });

    it("detects region tag from host_country JP -> asia", () => {
      const suggestions = computeSuggestedTags({
        title: "MEXT Scholarship",
        description: "Study in Japan.",
        host_country: "JP",
      });

      const asia = suggestions.find((s) => s.tag === "asia");
      expect(asia).toBeDefined();
    });

    it("does not re-suggest tags already in doc.tags", () => {
      const suggestions = computeSuggestedTags({
        title: "No GRE Required Scholarship",
        description: "GRE waived for all applicants.",
        host_country: "US",
        tags: ["no_gre", "americas"],
      });

      expect(suggestions.find((s) => s.tag === "no_gre")).toBeUndefined();
      expect(suggestions.find((s) => s.tag === "americas")).toBeUndefined();
    });

    it("returns no suggestions for empty title/description", () => {
      const suggestions = computeSuggestedTags({
        title: "",
        description: "",
        host_country: "ZZ", // Unknown country, no region tag
      });

      // Only rule-based suggestions should be empty; unknown country returns no region
      expect(suggestions.length).toBe(0);
    });

    it("detects merit_based from description", () => {
      const suggestions = computeSuggestedTags({
        title: "Academic Excellence Award",
        description: "This merit-based scholarship rewards academic excellence.",
        host_country: "CA",
      });

      const merit = suggestions.find((s) => s.tag === "merit_based");
      expect(merit).toBeDefined();
    });

    it("detects research_grant from description", () => {
      const suggestions = computeSuggestedTags({
        title: "PhD Research Funding",
        description: "Dissertation grant for doctoral students in all fields.",
        host_country: "US",
      });

      const research = suggestions.find((s) => s.tag === "research_grant");
      expect(research).toBeDefined();
    });
  });

  describe("computeAutoTags", () => {
    it("filters out already-suggested tags", () => {
      const newSuggestions = computeAutoTags({
        title: "No GRE Required Scholarship",
        description: "GRE waived.",
        host_country: "US",
        suggested_tags: [
          { tag: "no_gre", reason: "Already suggested", suggested_at: 1000 },
        ],
      });

      expect(newSuggestions.find((s) => s.tag === "no_gre")).toBeUndefined();
      // Should still suggest americas region
      expect(newSuggestions.find((s) => s.tag === "americas")).toBeDefined();
    });

    it("returns all suggestions when no existing suggested_tags", () => {
      const newSuggestions = computeAutoTags({
        title: "No GRE Required",
        description: "For women from developing countries.",
        host_country: "GB",
      });

      expect(newSuggestions.length).toBeGreaterThan(0);
    });
  });

  describe("AUTO_TAG_RULES", () => {
    it("has at least 8 rules", () => {
      expect(AUTO_TAG_RULES.length).toBeGreaterThanOrEqual(8);
    });

    it("each rule has tag, patterns, and fields", () => {
      for (const rule of AUTO_TAG_RULES) {
        expect(rule.tag).toBeTruthy();
        expect(rule.patterns.length).toBeGreaterThan(0);
        expect(rule.fields.length).toBeGreaterThan(0);
      }
    });
  });
});
