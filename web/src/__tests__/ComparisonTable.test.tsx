import { describe, expect, test } from "vitest";
import { isDifferent, renderField } from "../components/comparison/ComparisonTable";

// Minimal scholarship mock for testing helper functions
function makeScholarship(overrides: Record<string, unknown> = {}) {
  return {
    _id: overrides._id ?? "test_id_1",
    _creationTime: 1700000000000,
    title: "Test Scholarship",
    slug: "test-scholarship",
    provider_organization: "Test Org",
    host_country: "DE",
    degree_levels: ["master"],
    funding_type: "fully_funded",
    status: "published",
    source_ids: [],
    ...overrides,
  } as Parameters<typeof isDifferent>[1];
}

describe("isDifferent", () => {
  test("returns false when only one scholarship", () => {
    const s = makeScholarship();
    expect(isDifferent("host_country", s, [s])).toBe(false);
  });

  test("returns false when all values are the same", () => {
    const s1 = makeScholarship({ _id: "a" });
    const s2 = makeScholarship({ _id: "b" });
    expect(isDifferent("host_country", s1, [s1, s2])).toBe(false);
  });

  test("returns true when field values differ between scholarships", () => {
    const s1 = makeScholarship({ _id: "a", host_country: "DE" });
    const s2 = makeScholarship({ _id: "b", host_country: "US" });
    expect(isDifferent("host_country", s1, [s1, s2])).toBe(true);
  });

  test("handles array fields with sorted comparison", () => {
    const s1 = makeScholarship({ _id: "a", degree_levels: ["master", "phd"] });
    const s2 = makeScholarship({ _id: "b", degree_levels: ["phd", "master"] });
    // Same elements, different order -- should be considered same
    expect(isDifferent("degree_levels", s1, [s1, s2])).toBe(false);
  });

  test("detects different arrays", () => {
    const s1 = makeScholarship({ _id: "a", degree_levels: ["master"] });
    const s2 = makeScholarship({ _id: "b", degree_levels: ["phd"] });
    expect(isDifferent("degree_levels", s1, [s1, s2])).toBe(true);
  });

  test("handles null/undefined values", () => {
    const s1 = makeScholarship({ _id: "a", application_deadline: 1700000000000 });
    const s2 = makeScholarship({ _id: "b", application_deadline: undefined });
    expect(isDifferent("application_deadline", s1, [s1, s2])).toBe(true);
  });

  test("award_amount uses formatFundingAmount for comparison", () => {
    const s1 = makeScholarship({ _id: "a", award_amount_max: 10000, award_currency: "USD" });
    const s2 = makeScholarship({ _id: "b", award_amount_max: 20000, award_currency: "USD" });
    expect(isDifferent("award_amount", s1, [s1, s2])).toBe(true);
  });

  test("award_amount same values are not different", () => {
    const s1 = makeScholarship({ _id: "a", award_amount_max: 10000 });
    const s2 = makeScholarship({ _id: "b", award_amount_max: 10000 });
    expect(isDifferent("award_amount", s1, [s1, s2])).toBe(false);
  });
});

describe("renderField", () => {
  test("renders host_country with flag and name", () => {
    const s = makeScholarship({ host_country: "DE" });
    const result = renderField({ key: "host_country", label: "Host Country" }, s);
    // renderField returns a React element; check it's not null
    expect(result).toBeTruthy();
  });

  test("renders provider_organization as text", () => {
    const s = makeScholarship({ provider_organization: "DAAD" });
    const result = renderField({ key: "provider_organization", label: "Provider" }, s);
    expect(result).toBeTruthy();
  });

  test("renders funding_type formatted", () => {
    const s = makeScholarship({ funding_type: "fully_funded" });
    const result = renderField({ key: "funding_type", label: "Funding Type" }, s);
    expect(result).toBeTruthy();
  });

  test("renders placeholder for missing fields", () => {
    const s = makeScholarship({ fields_of_study: undefined });
    const result = renderField({ key: "fields_of_study", label: "Fields of Study" }, s);
    expect(result).toBeTruthy();
  });

  test("renders prestige tier badge for non-unranked", () => {
    const s = makeScholarship({ prestige_tier: "gold" });
    const result = renderField({ key: "prestige_tier", label: "Prestige Tier" }, s);
    expect(result).toBeTruthy();
  });

  test("renders tags with count", () => {
    const s = makeScholarship({ tags: ["stem", "women", "engineering", "research", "international"] });
    const result = renderField({ key: "tags", label: "Tags" }, s);
    expect(result).toBeTruthy();
  });
});
