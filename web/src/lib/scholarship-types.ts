import type { ScholarshipType } from "../../convex/schema";

export interface ScholarshipTypeMeta {
  label: string;
  badgeVariant: string;
  tip: string;
  coverageTip: string;
}

export const SCHOLARSHIP_TYPE_META: Record<ScholarshipType, ScholarshipTypeMeta> = {
  government: {
    label: "Government",
    badgeVariant: "typeGovernment",
    tip: "Government scholarships often require embassy endorsement or nomination. Start your application 8-12 months before the deadline.",
    coverageTip:
      "Government scholarships typically cover most expenses. Check if there are separate allowances for settling-in costs.",
  },
  merit: {
    label: "Merit-Based",
    badgeVariant: "typeMerit",
    tip: "Merit scholarships weigh GPA and academic achievements heavily. Include official transcripts and strong recommendation letters from professors.",
    coverageTip:
      "Merit awards vary widely in coverage. If living expenses aren't included, budget for accommodation and food costs separately.",
  },
  need_based: {
    label: "Need-Based",
    badgeVariant: "typeNeedBased",
    tip: "Prepare comprehensive financial documents: family income statements, tax returns, bank statements, and employer letters.",
    coverageTip:
      "Need-based scholarships often adjust coverage based on demonstrated need. Provide thorough financial documentation for maximum support.",
  },
  university: {
    label: "University",
    badgeVariant: "typeUniversity",
    tip: "University scholarships may be automatic with admission or require a separate application. Check with the admissions office early.",
    coverageTip:
      "University awards frequently cover tuition but may not include living costs. Look for complementary grants or assistantships.",
  },
  research: {
    label: "Research",
    badgeVariant: "typeResearch",
    tip: "A strong research proposal is essential. Contact potential supervisors before applying and align your proposal with their lab's focus.",
    coverageTip:
      "Research fellowships often include a stipend and lab/conference budget. Ask about additional funding for fieldwork or equipment.",
  },
  country_specific: {
    label: "Country-Specific",
    badgeVariant: "typeCountrySpecific",
    tip: "These scholarships target students from specific countries or regions. Verify your eligibility nationality requirements carefully.",
    coverageTip:
      "Country-specific programs may include travel to/from your home country. Check if flight allowances are one-way or return.",
  },
  subject_specific: {
    label: "Subject-Specific",
    badgeVariant: "typeSubjectSpecific",
    tip: "Highlight your passion and experience in the specific field. Include relevant coursework, projects, or publications.",
    coverageTip:
      "Field-specific awards may include professional development funds. Ask about conference attendance and industry placement support.",
  },
  athletic: {
    label: "Athletic",
    badgeVariant: "typeAthletic",
    tip: "Compile competitive achievements, coach recommendations, and training history. Video highlights can strengthen your application.",
    coverageTip:
      "Athletic scholarships typically cover tuition and may include room and board. Understand the athletic commitment requirements.",
  },
  general: {
    label: "General",
    badgeVariant: "neutral",
    tip: "Apply to multiple scholarships to increase your chances. Tailor each application to the specific program's values and criteria.",
    coverageTip:
      "Review the full terms and conditions for details on what expenses are covered beyond tuition.",
  },
};

/** Get covered items as display strings from scholarship funding booleans */
export function getCoveredItems(scholarship: {
  funding_tuition?: boolean;
  funding_living?: boolean;
  funding_travel?: boolean;
  funding_insurance?: boolean;
  funding_books?: boolean;
  funding_research?: boolean;
}): string[] {
  const items: string[] = [];
  if (scholarship.funding_tuition) items.push("Tuition");
  if (scholarship.funding_living) items.push("Living");
  if (scholarship.funding_travel) items.push("Travel");
  if (scholarship.funding_insurance) items.push("Insurance");
  if (scholarship.funding_books) items.push("Books");
  if (scholarship.funding_research) items.push("Research");
  return items;
}

/** Format coverage as compact string for card display */
export function formatCoverageCompact(items: string[]): string | null {
  if (items.length === 0) return null;
  if (items.length <= 3) return `Covers: ${items.join(" + ")}`;
  return `Covers: ${items.slice(0, 2).join(" + ")} + ${items.length - 2} more`;
}

/** Get the static tip for a scholarship type, or return custom tips if provided */
export function getApplicationTip(
  scholarshipType: ScholarshipType | undefined,
  customTips: string | undefined,
): string | null {
  if (customTips) return customTips;
  if (!scholarshipType || scholarshipType === "general") return SCHOLARSHIP_TYPE_META.general.tip;
  return SCHOLARSHIP_TYPE_META[scholarshipType]?.tip ?? null;
}

/** Get coverage-aware contextual tip */
export function getCoverageTip(scholarshipType: ScholarshipType | undefined): string | null {
  if (!scholarshipType) return null;
  return SCHOLARSHIP_TYPE_META[scholarshipType]?.coverageTip ?? null;
}
