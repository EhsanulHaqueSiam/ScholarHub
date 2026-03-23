import type { ScholarshipType } from "./schema";

/**
 * Classify a scholarship into a type based on available signals.
 * Signal priority: source category > tags > provider name > description keywords.
 * Returns "general" when no strong signal is found.
 */
export function classifyScholarshipType(
  sourceCategory: string | undefined,
  tags: string[] | undefined,
  providerOrg: string,
  description: string | undefined,
): ScholarshipType {
  const lowerTags = (tags ?? []).map((t) => t.toLowerCase());
  const lowerDesc = (description ?? "").toLowerCase();
  const lowerOrg = providerOrg.toLowerCase();

  // Source category is most reliable signal
  if (sourceCategory === "government") return "government";
  if (sourceCategory === "university") return "university";
  if (sourceCategory === "foundation") {
    if (lowerTags.some((t) => t.includes("need") || t.includes("financial"))) return "need_based";
    if (lowerTags.some((t) => t.includes("research") || t.includes("phd"))) return "research";
    return "merit";
  }

  // Tag-based signals
  if (lowerTags.some((t) => t.includes("merit") || t.includes("academic") || t.includes("excellence")))
    return "merit";
  if (lowerTags.some((t) => t.includes("need") || t.includes("financial"))) return "need_based";
  if (lowerTags.some((t) => t.includes("research") || t.includes("phd") || t.includes("doctoral")))
    return "research";
  if (lowerTags.some((t) => t.includes("athletic") || t.includes("sport"))) return "athletic";
  if (lowerTags.some((t) => t.includes("country_specific") || t.includes("region")))
    return "country_specific";
  if (lowerTags.some((t) => t.includes("subject") || t.includes("discipline")))
    return "subject_specific";

  // Provider name signals
  if (
    lowerOrg.includes("government") ||
    lowerOrg.includes("ministry") ||
    lowerOrg.includes("embassy")
  )
    return "government";
  if (lowerOrg.includes("university") || lowerOrg.includes("college")) return "university";

  // Description signals (lower confidence)
  if (
    lowerDesc.includes("based on financial need") ||
    lowerDesc.includes("demonstrated financial need")
  )
    return "need_based";
  if (lowerDesc.includes("research grant") || lowerDesc.includes("research fellowship"))
    return "research";
  if (lowerDesc.includes("academic merit") || lowerDesc.includes("academic excellence"))
    return "merit";

  return "general";
}
