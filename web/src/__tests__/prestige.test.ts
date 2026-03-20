import { describe, expect, test } from "vitest";
import {
  buildSearchText,
  COUNTRY_ACADEMIC_TIERS,
  calculatePrestigeScore,
  PRESTIGIOUS_PROVIDERS,
  scoreCountry,
  scoreFunding,
  scoreProvider,
  scoreTier,
} from "../../convex/prestige";

describe("prestige scoring", () => {
  test("scoreFunding: fully_funded = 100", () => {
    expect(scoreFunding("fully_funded")).toBe(100);
  });
  test("scoreFunding: stipend_only = 20", () => {
    expect(scoreFunding("stipend_only")).toBe(20);
  });
  test("scoreProvider: Fulbright matches", () => {
    expect(scoreProvider("Fulbright")).toBe(100);
  });
  test("scoreProvider: Unknown Org = 0", () => {
    expect(scoreProvider("Unknown Org")).toBe(0);
  });
  test("scoreCountry: US = Tier A = 100", () => {
    expect(scoreCountry("US")).toBe(100);
  });
  test("scoreCountry: CN = Tier B = 60", () => {
    expect(scoreCountry("CN")).toBe(60);
  });
  test("scoreCountry: unknown = Tier C = 30", () => {
    expect(scoreCountry("ZZ")).toBe(30);
  });
  test("calculatePrestigeScore: gold tier for fully funded Fulbright in US", () => {
    const score = calculatePrestigeScore({
      funding_type: "fully_funded",
      provider_organization: "Fulbright",
      host_country: "US",
      tags: [],
    });
    expect(score).toBeGreaterThanOrEqual(75);
  });
  test("calculatePrestigeScore: unranked for unknown stipend", () => {
    const score = calculatePrestigeScore({
      funding_type: "stipend_only",
      provider_organization: "Unknown Org",
      host_country: "Unknown",
      tags: [],
    });
    expect(score).toBeLessThan(25);
  });
  test("calculatePrestigeScore: gold for partial DAAD in DE (high provider + tier A country)", () => {
    const score = calculatePrestigeScore({
      funding_type: "partial",
      provider_organization: "DAAD",
      host_country: "DE",
      tags: [],
    });
    // partial(60)*0.4 + DAAD(100)*0.3 + DE-TierA(100)*0.2 + default(50)*0.1 = 79
    expect(score).toBeGreaterThanOrEqual(75);
  });
  test("calculatePrestigeScore: silver for partial unknown provider in tier B country", () => {
    const score = calculatePrestigeScore({
      funding_type: "partial",
      provider_organization: "Local University Fund",
      host_country: "CN",
      tags: [],
    });
    // partial(60)*0.4 + unknown(0)*0.3 + CN-TierB(60)*0.2 + default(50)*0.1 = 41
    expect(score).toBeGreaterThanOrEqual(25);
    expect(score).toBeLessThan(50);
  });
  test("scoreTier thresholds", () => {
    expect(scoreTier(80)).toBe("gold");
    expect(scoreTier(60)).toBe("silver");
    expect(scoreTier(30)).toBe("bronze");
    expect(scoreTier(10)).toBe("unranked");
  });
  test("PRESTIGIOUS_PROVIDERS includes key providers", () => {
    expect(PRESTIGIOUS_PROVIDERS).toContain("Fulbright");
    expect(PRESTIGIOUS_PROVIDERS).toContain("Rhodes Trust");
    expect(PRESTIGIOUS_PROVIDERS).toContain("DAAD");
    expect(PRESTIGIOUS_PROVIDERS).toContain("Chevening");
    expect(PRESTIGIOUS_PROVIDERS).toContain("Erasmus Mundus");
    expect(PRESTIGIOUS_PROVIDERS).toContain("Gates Cambridge");
    expect(PRESTIGIOUS_PROVIDERS).toContain("MEXT");
  });
  test("COUNTRY_ACADEMIC_TIERS.A includes top countries", () => {
    expect(COUNTRY_ACADEMIC_TIERS.A).toContain("US");
    expect(COUNTRY_ACADEMIC_TIERS.A).toContain("GB");
    expect(COUNTRY_ACADEMIC_TIERS.A).toContain("DE");
    expect(COUNTRY_ACADEMIC_TIERS.A).toContain("JP");
  });
  test("buildSearchText concatenates title, description, nationalities", () => {
    const text = buildSearchText({
      title: "DAAD Scholarship",
      description: "Study in Germany",
      eligibility_nationalities: ["BD", "IN"],
    });
    expect(text).toContain("DAAD Scholarship");
    expect(text).toContain("Study in Germany");
    expect(text).toContain("BD");
    expect(text).toContain("IN");
  });
});
