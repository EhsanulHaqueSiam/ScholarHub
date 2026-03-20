import type { PrestigeTier } from "./schema";

// Default weights (admin-configurable later via Convex table)
export const DEFAULT_WEIGHTS = {
  funding_level: 0.4,
  provider_reputation: 0.3,
  country_rank: 0.2,
  competitiveness: 0.1,
};

// ~60 prestigious providers (hardcoded seed list)
export const PRESTIGIOUS_PROVIDERS: string[] = [
  "Fulbright",
  "Rhodes Trust",
  "DAAD",
  "Chevening",
  "Erasmus Mundus",
  "Gates Cambridge",
  "MEXT",
  "CSC",
  "Schwarzman Scholars",
  "Knight-Hennessy",
  "Marshall Scholarship",
  "Mitchell Scholarship",
  "Clarendon Fund",
  "Commonwealth Scholarship",
  "Australia Awards",
  "Vanier Canada",
  "Swiss Government Excellence",
  "Eiffel Excellence",
  "KAIST",
  "Korea Foundation",
  "Monbukagakusho",
  "Rotary Foundation",
  "Aga Khan Foundation",
  "Ford Foundation",
  "Mastercard Foundation",
  "World Bank Scholarship",
  "ADB-Japan Scholarship",
  "OFID Scholarship",
  "Islamic Development Bank",
  "OPCW",
  "IMF",
  "WHO",
  "Wellcome Trust",
  "SOAS",
  "Clarendon",
  "Jardine Foundation",
  "Said Foundation",
  "Skoll Scholarship",
  "Weidenfeld-Hoffmann",
  "Denning Scholarship",
  "Reach Oxford",
  "Felix Scholarship",
  "Chevening/GREAT",
  "Turkiye Burslari",
  "Stipendium Hungaricum",
  "CEEPUS",
  "Visegrad Fund",
  "Konrad-Adenauer-Stiftung",
  "Friedrich-Ebert-Stiftung",
  "Heinrich-Boll-Stiftung",
  "Rosa-Luxemburg-Stiftung",
  "Studienstiftung",
  "KAAD",
  "Catholic Academic Exchange Service",
  "VLIR-UOS",
  "NUFFIC",
  "Lester B. Pearson",
  "University of Toronto Scholars",
  "ETH Zurich Excellence",
];

// Country academic tiers (static constants)
export const COUNTRY_ACADEMIC_TIERS = {
  A: [
    "US",
    "GB",
    "DE",
    "JP",
    "CA",
    "AU",
    "FR",
    "CH",
    "NL",
    "SE",
    "SG",
    "KR",
    "DK",
    "NO",
    "FI",
    "AT",
    "BE",
    "IE",
    "HK",
    "NZ",
  ],
  B: [
    "CN",
    "IT",
    "ES",
    "IL",
    "TW",
    "CZ",
    "PT",
    "PL",
    "BR",
    "IN",
    "MX",
    "RU",
    "ZA",
    "AR",
    "CL",
    "TH",
    "MY",
    "TR",
    "HU",
    "GR",
  ],
  C: [] as string[], // Everything else defaults to C
};

/** Score funding type: fully_funded=100, partial=60, tuition_waiver=40, stipend_only=20 */
export function scoreFunding(fundingType: string): number {
  const scores: Record<string, number> = {
    fully_funded: 100,
    partial: 60,
    tuition_waiver: 40,
    stipend_only: 20,
  };
  return scores[fundingType] ?? 0;
}

/** Score provider reputation: match against prestigious providers list (case-insensitive substring) */
export function scoreProvider(providerOrganization: string): number {
  const lower = providerOrganization.toLowerCase();
  for (const provider of PRESTIGIOUS_PROVIDERS) {
    if (lower.includes(provider.toLowerCase())) {
      return 100;
    }
  }
  return 0;
}

/** Score host country academic tier: A=100, B=60, C/unknown=30 */
export function scoreCountry(hostCountry: string): number {
  const upper = hostCountry.toUpperCase();
  if (COUNTRY_ACADEMIC_TIERS.A.includes(upper)) return 100;
  if (COUNTRY_ACADEMIC_TIERS.B.includes(upper)) return 60;
  return 30;
}

/** Score competitiveness from tags */
export function scoreCompetitiveness(tags: string[]): number {
  if (tags.includes("highly_competitive")) return 100;
  return 50; // neutral default
}

/** Calculate composite prestige score (0-100 integer) */
export function calculatePrestigeScore(scholarship: {
  funding_type: string;
  provider_organization: string;
  host_country: string;
  tags: string[];
}): number {
  const funding = scoreFunding(scholarship.funding_type);
  const provider = scoreProvider(scholarship.provider_organization);
  const country = scoreCountry(scholarship.host_country);
  const competitive = scoreCompetitiveness(scholarship.tags);

  const weighted =
    funding * DEFAULT_WEIGHTS.funding_level +
    provider * DEFAULT_WEIGHTS.provider_reputation +
    country * DEFAULT_WEIGHTS.country_rank +
    competitive * DEFAULT_WEIGHTS.competitiveness;

  return Math.round(weighted);
}

/** Map numeric score to prestige tier */
export function scoreTier(score: number): PrestigeTier {
  if (score >= 75) return "gold";
  if (score >= 50) return "silver";
  if (score >= 25) return "bronze";
  return "unranked";
}

/** Build denormalized search text from scholarship fields */
export function buildSearchText(scholarship: {
  title: string;
  description?: string | null;
  eligibility_nationalities?: string[] | null;
}): string {
  const parts = [
    scholarship.title,
    scholarship.description ?? "",
    ...(scholarship.eligibility_nationalities ?? []),
  ];
  return parts.filter(Boolean).join(" ");
}
