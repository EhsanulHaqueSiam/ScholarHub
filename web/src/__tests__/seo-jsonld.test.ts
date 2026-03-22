import { describe, expect, it, vi } from "vitest";

// Mock getCountryName before import
vi.mock("@/lib/countries", () => ({
  getCountryName: (code: string) => {
    const names: Record<string, string> = {
      US: "United States",
      GB: "United Kingdom",
      DE: "Germany",
      AU: "Australia",
      BD: "Bangladesh",
      IN: "India",
    };
    return names[code] ?? code;
  },
}));

import {
  buildScholarshipJsonLd,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildItemListJsonLd,
  buildOrganizationJsonLd,
} from "@/lib/seo/json-ld";

describe("buildScholarshipJsonLd", () => {
  const baseScholarship = {
    _id: "abc123",
    title: "Test Scholarship",
    provider_organization: "Test University",
    host_country: "US",
    degree_levels: ["masters"],
    funding_type: "fully_funded",
  };

  it("returns object with @type Grant and @context", () => {
    const result = buildScholarshipJsonLd(baseScholarship);
    expect(result["@context"]).toBe("https://schema.org");
    expect(result["@type"]).toBe("Grant");
    expect(result.name).toBe("Test Scholarship");
  });

  it("includes provider as Organization", () => {
    const result = buildScholarshipJsonLd(baseScholarship);
    expect(result.provider).toEqual({
      "@type": "Organization",
      name: "Test University",
    });
    expect(result.funder).toEqual({
      "@type": "Organization",
      name: "Test University",
    });
  });

  it("includes applicationDeadline as ISO string when present", () => {
    const deadline = new Date("2026-06-15T00:00:00Z").getTime();
    const result = buildScholarshipJsonLd({
      ...baseScholarship,
      application_deadline: deadline,
    });
    expect(result.applicationDeadline).toBe(
      new Date(deadline).toISOString(),
    );
  });

  it("excludes applicationDeadline when null", () => {
    const result = buildScholarshipJsonLd({
      ...baseScholarship,
      application_deadline: null,
    });
    expect(result.applicationDeadline).toBeUndefined();
  });

  it("includes eligibleRegion as array of Place objects", () => {
    const result = buildScholarshipJsonLd({
      ...baseScholarship,
      eligibility_nationalities: ["BD", "IN"],
    });
    expect(result.eligibleRegion).toEqual([
      { "@type": "Place", name: "Bangladesh" },
      { "@type": "Place", name: "India" },
    ]);
  });

  it("excludes eligibleRegion when nationalities is null", () => {
    const result = buildScholarshipJsonLd({
      ...baseScholarship,
      eligibility_nationalities: null,
    });
    expect(result.eligibleRegion).toBeUndefined();
  });

  it("includes educationalLevel array when degree_levels present", () => {
    const result = buildScholarshipJsonLd({
      ...baseScholarship,
      degree_levels: ["masters", "phd"],
    });
    expect(result.educationalLevel).toEqual(["masters", "phd"]);
  });

  it("excludes educationalLevel when degree_levels is empty", () => {
    const result = buildScholarshipJsonLd({
      ...baseScholarship,
      degree_levels: [],
    });
    expect(result.educationalLevel).toBeUndefined();
  });

  it("includes amount as MonetaryAmount when award_amount_max present", () => {
    const result = buildScholarshipJsonLd({
      ...baseScholarship,
      award_amount_max: 50000,
      award_currency: "EUR",
    });
    expect(result.amount).toEqual({
      "@type": "MonetaryAmount",
      value: 50000,
      currency: "EUR",
    });
  });

  it("defaults currency to USD when award_currency is null", () => {
    const result = buildScholarshipJsonLd({
      ...baseScholarship,
      award_amount_max: 30000,
      award_currency: null,
    });
    expect((result.amount as Record<string, unknown>).currency).toBe("USD");
  });

  it("includes potentialAction with ApplyAction when application_url present", () => {
    const result = buildScholarshipJsonLd({
      ...baseScholarship,
      application_url: "https://example.com/apply",
    });
    expect(result.potentialAction).toEqual({
      "@type": "ApplyAction",
      target: "https://example.com/apply",
    });
  });

  it("uses slug for URL when available", () => {
    const result = buildScholarshipJsonLd({
      ...baseScholarship,
      slug: "test-scholarship-2026",
    });
    expect(result.url).toContain("/scholarships/test-scholarship-2026");
  });

  it("uses _id for URL when slug is null", () => {
    const result = buildScholarshipJsonLd({
      ...baseScholarship,
      slug: null,
    });
    expect(result.url).toContain("/scholarships/abc123");
  });

  it("includes areaServed from host_country", () => {
    const result = buildScholarshipJsonLd(baseScholarship);
    expect(result.areaServed).toEqual({
      "@type": "Place",
      name: "United States",
    });
  });

  it("includes dateModified from last_verified", () => {
    const ts = new Date("2026-03-01T12:00:00Z").getTime();
    const result = buildScholarshipJsonLd({
      ...baseScholarship,
      last_verified: ts,
    });
    expect(result.dateModified).toBe(new Date(ts).toISOString());
  });
});

describe("buildBreadcrumbJsonLd", () => {
  it("returns BreadcrumbList with numbered ListItem elements", () => {
    const result = buildBreadcrumbJsonLd([
      { name: "Home", url: "https://scholarhub.io" },
      { name: "Scholarships", url: "https://scholarhub.io/scholarships" },
      { name: "DAAD Scholarship", url: "https://scholarhub.io/scholarships/daad" },
    ]);
    expect(result["@context"]).toBe("https://schema.org");
    expect(result["@type"]).toBe("BreadcrumbList");
    expect(result.itemListElement).toHaveLength(3);
    expect(result.itemListElement[0]).toEqual({
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://scholarhub.io",
    });
    expect(result.itemListElement[2].position).toBe(3);
  });
});

describe("buildFaqJsonLd", () => {
  it("returns FAQPage with Question/Answer mainEntity", () => {
    const result = buildFaqJsonLd([
      { question: "How many scholarships?", answer: "Over 2400." },
      { question: "Are they free?", answer: "Yes, fully funded." },
    ]);
    expect(result["@context"]).toBe("https://schema.org");
    expect(result["@type"]).toBe("FAQPage");
    expect(result.mainEntity).toHaveLength(2);
    expect(result.mainEntity[0]).toEqual({
      "@type": "Question",
      name: "How many scholarships?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Over 2400.",
      },
    });
  });
});

describe("buildItemListJsonLd", () => {
  it("returns ItemList with ListItem elements and numberOfItems", () => {
    const result = buildItemListJsonLd([
      { name: "DAAD", url: "https://scholarhub.io/scholarships/daad", position: 1 },
      { name: "Erasmus", url: "https://scholarhub.io/scholarships/erasmus", position: 2 },
    ]);
    expect(result["@context"]).toBe("https://schema.org");
    expect(result["@type"]).toBe("ItemList");
    expect(result.numberOfItems).toBe(2);
    expect(result.itemListElement).toHaveLength(2);
    expect(result.itemListElement[0]).toEqual({
      "@type": "ListItem",
      position: 1,
      name: "DAAD",
      url: "https://scholarhub.io/scholarships/daad",
    });
  });
});

describe("buildOrganizationJsonLd", () => {
  it("returns Organization with ScholarHub name and url", () => {
    const result = buildOrganizationJsonLd();
    expect(result["@context"]).toBe("https://schema.org");
    expect(result["@type"]).toBe("Organization");
    expect(result.name).toBe("ScholarHub");
    expect(result.url).toBeTruthy();
    expect(result.description).toBeTruthy();
  });
});
