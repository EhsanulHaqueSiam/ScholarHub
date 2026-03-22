/**
 * Templated content generation for country and degree landing pages.
 * All content is generated from real stats for SEO-unique pages.
 */

/**
 * Generate intro paragraph for a country landing page.
 */
export function generateCountryIntro(
  stats: {
    total: number;
    fullyFunded: number;
    degreeLevels: string[];
    topFields: string[];
  },
  countryName: string,
  year: number,
): string {
  const degreeLevelText =
    stats.degreeLevels.length > 0
      ? stats.degreeLevels.join(", ")
      : "various";
  const topFieldsText =
    stats.topFields.length > 0
      ? stats.topFields.slice(0, 3).join(", ")
      : "multiple disciplines";

  return `Discover ${stats.total} scholarships in ${countryName} for ${year}. ${stats.fullyFunded} are fully funded, covering ${degreeLevelText} programs. Popular fields include ${topFieldsText}.`;
}

/**
 * Generate FAQ questions with data-driven answers for a country page.
 */
export function generateCountryFaq(
  stats: {
    total: number;
    fullyFunded: number;
    degreeLevels: string[];
    closingSoon: number;
  },
  countryName: string,
): { question: string; answer: string }[] {
  const faqs: { question: string; answer: string }[] = [
    {
      question: `How many scholarships are available in ${countryName}?`,
      answer: `There are currently ${stats.total} scholarships available in ${countryName} listed on ScholarHub.`,
    },
    {
      question: `Are there fully funded scholarships in ${countryName}?`,
      answer:
        stats.fullyFunded > 0
          ? `Yes, ${stats.fullyFunded} fully funded scholarships are available in ${countryName}, covering tuition, living expenses, and more.`
          : `Currently there are no fully funded scholarships listed for ${countryName}. Check back regularly as new scholarships are added.`,
    },
    {
      question: `What degree levels have scholarships in ${countryName}?`,
      answer:
        stats.degreeLevels.length > 0
          ? `Scholarships in ${countryName} are available for ${stats.degreeLevels.join(", ")} programs.`
          : `Scholarships in ${countryName} cover various degree levels. Browse the full list for details.`,
    },
  ];

  if (stats.closingSoon > 0) {
    faqs.push({
      question: `Are there scholarships closing soon in ${countryName}?`,
      answer: `Yes, ${stats.closingSoon} scholarships in ${countryName} have deadlines approaching within the next 30 days. Apply soon to avoid missing out.`,
    });
  }

  faqs.push({
    question: `How do I apply for scholarships in ${countryName}?`,
    answer: `Browse available scholarships in ${countryName} on ScholarHub, check eligibility requirements, and follow the application link on each scholarship page to apply directly.`,
  });

  return faqs;
}

/**
 * Generate intro paragraph for a degree landing page.
 */
export function generateDegreeIntro(
  stats: {
    total: number;
    fullyFunded: number;
    topCountries: string[];
  },
  degreeName: string,
  year: number,
): string {
  const countriesText =
    stats.topCountries.length > 0
      ? stats.topCountries.slice(0, 3).join(", ")
      : "countries worldwide";

  return `Explore ${stats.total} ${degreeName} scholarships for ${year}. ${stats.fullyFunded} are fully funded opportunities available in ${countriesText} and more.`;
}

/**
 * Generate FAQ questions with data-driven answers for a degree page.
 */
export function generateDegreeFaq(
  stats: {
    total: number;
    fullyFunded: number;
    topCountries: string[];
  },
  degreeName: string,
): { question: string; answer: string }[] {
  const faqs: { question: string; answer: string }[] = [
    {
      question: `How many ${degreeName} scholarships are available?`,
      answer: `ScholarHub lists ${stats.total} ${degreeName} scholarships from universities and organizations worldwide.`,
    },
    {
      question: `Are there fully funded ${degreeName} scholarships?`,
      answer:
        stats.fullyFunded > 0
          ? `Yes, ${stats.fullyFunded} fully funded ${degreeName} scholarships are currently available, covering tuition and living costs.`
          : `Currently there are no fully funded ${degreeName} scholarships listed. New scholarships are added regularly.`,
    },
    {
      question: `Which countries offer the most ${degreeName} scholarships?`,
      answer:
        stats.topCountries.length > 0
          ? `The top countries for ${degreeName} scholarships include ${stats.topCountries.slice(0, 5).join(", ")}.`
          : `${degreeName} scholarships are available in countries worldwide. Browse the full list for details.`,
    },
  ];

  faqs.push({
    question: `How do I apply for ${degreeName} scholarships?`,
    answer: `Browse ${degreeName} scholarships on ScholarHub, review eligibility criteria, and click the application link on each scholarship page to apply directly to the provider.`,
  });

  return faqs;
}

/**
 * Generate cross-links for a country page.
 * Returns related countries (top 5 excluding current) and degree levels.
 */
export function generateCountryCrossLinks(
  currentCountry: string,
  topCountries: string[],
  relatedDegrees: string[],
): {
  countries: { name: string; slug: string }[];
  degrees: { name: string; slug: string }[];
} {
  const countries = topCountries
    .filter((c) => c.toLowerCase() !== currentCountry.toLowerCase())
    .slice(0, 5)
    .map((name) => ({
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
    }));

  const degrees = relatedDegrees.map((name) => ({
    name,
    slug: name.toLowerCase().replace(/\s+/g, "-"),
  }));

  return { countries, degrees };
}

/**
 * Generate cross-links for a degree page.
 * Returns top countries and other degree levels (excluding current).
 */
export function generateDegreeCrossLinks(
  currentDegree: string,
  topCountries: string[],
  allDegrees: string[],
): {
  countries: { name: string; slug: string }[];
  degrees: { name: string; slug: string }[];
} {
  const countries = topCountries.slice(0, 5).map((name) => ({
    name,
    slug: name.toLowerCase().replace(/\s+/g, "-"),
  }));

  const degrees = allDegrees
    .filter((d) => d.toLowerCase() !== currentDegree.toLowerCase())
    .map((name) => ({
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
    }));

  return { countries, degrees };
}

/**
 * Generate a meta description for country or degree landing pages.
 */
export function generateMetaDescription(
  type: "country" | "degree",
  name: string,
  stats: {
    total: number;
    fullyFunded: number;
    degreeLevels?: string[];
  },
): string {
  const year = new Date().getFullYear();
  const degreeLevelText =
    stats.degreeLevels && stats.degreeLevels.length > 0
      ? stats.degreeLevels.join(", ")
      : "all levels";

  if (type === "country") {
    return `Discover ${stats.total} scholarships in ${name} for ${year}. ${stats.fullyFunded} fully funded options available for ${degreeLevelText}.`;
  }

  return `Explore ${stats.total} ${name} scholarships for ${year}. ${stats.fullyFunded} fully funded options from universities worldwide.`;
}
