export const PRESTIGE_TIERS = ["gold", "silver", "bronze", "unranked"] as const;
export type PrestigeTier = (typeof PRESTIGE_TIERS)[number];

export function getPrestigeLabel(tier: PrestigeTier): string {
  const labels: Record<PrestigeTier, string> = {
    gold: "Gold",
    silver: "Silver",
    bronze: "Bronze",
    unranked: "",
  };
  return labels[tier];
}

export function getPrestigeTooltip(tier: PrestigeTier): string {
  const tooltips: Record<PrestigeTier, string> = {
    gold: "Gold: Fully funded by a top-tier provider in a leading academic country",
    silver: "Silver: Strong funding from a reputable provider",
    bronze: "Bronze: Partial funding or smaller program",
    unranked: "",
  };
  return tooltips[tier];
}
