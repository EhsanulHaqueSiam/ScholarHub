export type CompetitivenessTier =
  | "highly_competitive"
  | "competitive"
  | "moderate"
  | "accessible";

export function getCompetitivenessTier(
  prestigeTier: string | null | undefined,
  fundingType: string,
): CompetitivenessTier {
  if (prestigeTier === "gold" && fundingType === "fully_funded")
    return "highly_competitive";
  if (prestigeTier === "gold" || (prestigeTier === "silver" && fundingType === "fully_funded"))
    return "competitive";
  if (prestigeTier === "silver" || prestigeTier === "bronze")
    return "moderate";
  return "accessible";
}

export const COMPETITIVENESS_LABELS: Record<CompetitivenessTier, string> = {
  highly_competitive: "Highly Competitive",
  competitive: "Competitive",
  moderate: "Moderate",
  accessible: "Accessible",
};

export const COMPETITIVENESS_VARIANTS: Record<CompetitivenessTier, string> = {
  highly_competitive: "urgencyCritical",
  competitive: "urgencyWarning",
  moderate: "urgencyOpen",
  accessible: "neutral",
};
