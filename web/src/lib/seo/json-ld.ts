import { getCountryName } from "@/lib/countries";

const SITE_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : (import.meta.env?.VITE_SITE_URL ?? "https://scholarhub.io");

/**
 * Build Schema.org JSON-LD structured data for a scholarship.
 * Uses @type "Grant" (NOT "Scholarship" which does not exist in Schema.org).
 */
export function buildScholarshipJsonLd(scholarship: {
  _id: string;
  title: string;
  description?: string | null;
  provider_organization: string;
  host_country: string;
  application_deadline?: number | null;
  eligibility_nationalities?: string[] | null;
  award_amount_max?: number | null;
  award_currency?: string | null;
  application_url?: string | null;
  slug?: string | null;
  degree_levels: string[];
  fields_of_study?: string[] | null;
  last_verified?: number | null;
  funding_type: string;
}): Record<string, unknown> {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Grant",
    name: scholarship.title,
    url: `${SITE_URL}/scholarships/${scholarship.slug ?? scholarship._id}`,
    provider: {
      "@type": "Organization",
      name: scholarship.provider_organization,
    },
    funder: {
      "@type": "Organization",
      name: scholarship.provider_organization,
    },
  };

  if (scholarship.description) {
    jsonLd.description = scholarship.description;
  }

  if (scholarship.application_deadline) {
    jsonLd.applicationDeadline = new Date(
      scholarship.application_deadline,
    ).toISOString();
  }

  if (scholarship.host_country) {
    jsonLd.areaServed = {
      "@type": "Place",
      name: getCountryName(scholarship.host_country),
    };
  }

  if (
    scholarship.eligibility_nationalities &&
    scholarship.eligibility_nationalities.length > 0
  ) {
    jsonLd.eligibleRegion = scholarship.eligibility_nationalities.map(
      (code) => ({
        "@type": "Place",
        name: getCountryName(code),
      }),
    );
  }

  if (scholarship.degree_levels.length > 0) {
    jsonLd.educationalLevel = scholarship.degree_levels;
  }

  if (scholarship.award_amount_max) {
    jsonLd.amount = {
      "@type": "MonetaryAmount",
      value: scholarship.award_amount_max,
      currency: scholarship.award_currency ?? "USD",
    };
  }

  if (scholarship.application_url) {
    jsonLd.potentialAction = {
      "@type": "ApplyAction",
      target: scholarship.application_url,
    };
  }

  if (scholarship.last_verified) {
    jsonLd.dateModified = new Date(scholarship.last_verified).toISOString();
  }

  return jsonLd;
}

/**
 * Build BreadcrumbList JSON-LD structured data.
 */
export function buildBreadcrumbJsonLd(
  items: { name: string; url: string }[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Build FAQPage JSON-LD structured data.
 */
export function buildFaqJsonLd(
  questions: { question: string; answer: string }[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  };
}

/**
 * Build ItemList JSON-LD structured data.
 */
export function buildItemListJsonLd(
  items: { name: string; url: string; position: number }[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: items.length,
    itemListElement: items.map((item) => ({
      "@type": "ListItem",
      position: item.position,
      name: item.name,
      url: item.url,
    })),
  };
}

/**
 * Build Organization JSON-LD for the ScholarHub site.
 */
export function buildOrganizationJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ScholarHub",
    url: SITE_URL,
    description:
      "ScholarHub aggregates international scholarships from 1000+ sources worldwide, helping students discover fully funded study opportunities.",
  };
}
