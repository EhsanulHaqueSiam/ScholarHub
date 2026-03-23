/** Map urgency level to badge variant */
export const urgencyVariantMap = {
  critical: "urgencyCritical",
  warning: "urgencyWarning",
  open: "urgencyOpen",
  closed: "urgencyClosed",
} as const;

/** Map urgency level to display label */
export const urgencyLabelMap = {
  critical: "Closing Soon",
  warning: "< 30 Days",
  open: "Open",
  closed: "Closed",
} as const;

/** Check if scholarship has limited info (title + URL only, no description) */
export function hasLimitedInfo(scholarship: {
  description?: string;
  fields_of_study?: string[] | null;
}): boolean {
  return !scholarship.description && !scholarship.fields_of_study?.length;
}

/** Format funding amount for display */
export function formatFundingAmount(scholarship: {
  award_amount_min?: number;
  award_amount_max?: number;
  award_currency?: string;
}): string | null {
  if (!scholarship.award_amount_max) return null;
  const currency = scholarship.award_currency ?? "USD";
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
  if (
    scholarship.award_amount_min &&
    scholarship.award_amount_min !== scholarship.award_amount_max
  ) {
    return `${formatter.format(scholarship.award_amount_min)} - ${formatter.format(scholarship.award_amount_max)}`;
  }
  return formatter.format(scholarship.award_amount_max);
}

/** Format funding type for display */
export function formatFundingType(type: string): string {
  const labels: Record<string, string> = {
    fully_funded: "Fully Funded",
    partial: "Partial",
    tuition_waiver: "Tuition Waiver",
    stipend_only: "Stipend Only",
  };
  return labels[type] ?? type;
}

/** Format scholarship type enum value for display */
export function formatScholarshipType(type: string | undefined): string | null {
  if (!type || type === "general") return null;
  const labels: Record<string, string> = {
    merit: "Merit-Based",
    need_based: "Need-Based",
    government: "Government",
    university: "University",
    country_specific: "Country-Specific",
    subject_specific: "Subject-Specific",
    research: "Research",
    athletic: "Athletic",
    general: "General",
  };
  return labels[type] ?? null;
}
