/**
 * Tag constants and categories for the scholarship tag system.
 *
 * Predefined tags across 5 categories with snake_case IDs,
 * human-readable labels, and descriptions for tooltips.
 */

export interface TagDefinition {
  id: string;
  label: string;
  description: string;
}

export interface TagCategory {
  key: string;
  label: string;
  tags: TagDefinition[];
}

export const TAG_CATEGORIES: Record<string, TagCategory> = {
  eligibility: {
    key: "eligibility",
    label: "Eligibility",
    tags: [
      {
        id: "no_gre",
        label: "No GRE",
        description: "GRE score is not required for application",
      },
      {
        id: "women_only",
        label: "Women Only",
        description: "Exclusively for women or female-identifying applicants",
      },
      {
        id: "developing_countries",
        label: "Developing Countries",
        description: "For students from developing or low-income nations",
      },
      {
        id: "open_to_all",
        label: "Open to All",
        description: "No nationality or demographic restrictions",
      },
      {
        id: "undergraduate_only",
        label: "Undergraduate Only",
        description: "Restricted to undergraduate-level applicants",
      },
    ],
  },
  subject: {
    key: "subject",
    label: "Subject",
    tags: [
      {
        id: "stem",
        label: "STEM",
        description: "Science, Technology, Engineering, and Mathematics fields",
      },
      {
        id: "arts_humanities",
        label: "Arts & Humanities",
        description: "Arts, humanities, literature, philosophy, and related fields",
      },
      {
        id: "business",
        label: "Business",
        description: "Business, management, finance, and economics",
      },
      {
        id: "social_sciences",
        label: "Social Sciences",
        description: "Sociology, political science, psychology, and related fields",
      },
      {
        id: "health_medical",
        label: "Health & Medical",
        description: "Medicine, nursing, public health, and biomedical sciences",
      },
    ],
  },
  duration: {
    key: "duration",
    label: "Duration",
    tags: [
      {
        id: "short_term",
        label: "Short Term",
        description: "Programs lasting less than one academic year",
      },
      {
        id: "full_degree",
        label: "Full Degree",
        description: "Covers the entire duration of a degree program",
      },
      {
        id: "summer_program",
        label: "Summer Program",
        description: "Summer school, internship, or research programs",
      },
      {
        id: "exchange",
        label: "Exchange",
        description: "Student exchange or semester abroad programs",
      },
    ],
  },
  funding: {
    key: "funding",
    label: "Funding",
    tags: [
      {
        id: "merit_based",
        label: "Merit Based",
        description: "Awarded based on academic achievement or merit",
      },
      {
        id: "need_based",
        label: "Need Based",
        description: "Awarded based on financial need",
      },
      {
        id: "research_grant",
        label: "Research Grant",
        description: "Funding for research, dissertations, or academic projects",
      },
    ],
  },
  region: {
    key: "region",
    label: "Region",
    tags: [
      {
        id: "europe",
        label: "Europe",
        description: "Scholarships for studying in European countries",
      },
      {
        id: "asia",
        label: "Asia",
        description: "Scholarships for studying in Asian countries",
      },
      {
        id: "americas",
        label: "Americas",
        description: "Scholarships for studying in North or South America",
      },
      {
        id: "africa",
        label: "Africa",
        description: "Scholarships for studying in African countries",
      },
      {
        id: "middle_east",
        label: "Middle East",
        description: "Scholarships for studying in Middle Eastern countries",
      },
      {
        id: "oceania",
        label: "Oceania",
        description: "Scholarships for studying in Australia, New Zealand, or Pacific Islands",
      },
    ],
  },
};

/** Flat array of all predefined tag definitions across all categories. */
export const ALL_TAGS: TagDefinition[] = Object.values(TAG_CATEGORIES).flatMap(
  (category) => category.tags,
);

/** Map of tag ID to its definition for quick lookup. */
const TAG_MAP = new Map<string, TagDefinition & { category: string }>(
  Object.entries(TAG_CATEGORIES).flatMap(([categoryKey, category]) =>
    category.tags.map((tag) => [tag.id, { ...tag, category: categoryKey }] as const),
  ),
);

/**
 * Get the human-readable label for a tag ID.
 * Falls back to title-cased version of the ID for freeform tags.
 */
export function getTagLabel(tagId: string): string {
  const tag = TAG_MAP.get(tagId);
  if (tag) return tag.label;
  // Fallback: convert snake_case to Title Case
  return tagId
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Get the description for a tag ID (used for tooltips).
 * Returns undefined for freeform tags without predefined descriptions.
 */
export function getTagDescription(tagId: string): string | undefined {
  return TAG_MAP.get(tagId)?.description;
}

/**
 * Get the category key for a tag ID.
 * Returns undefined for freeform tags not in any predefined category.
 */
export function getTagCategory(tagId: string): string | undefined {
  return TAG_MAP.get(tagId)?.category;
}

/**
 * Check if a tag is a region tag.
 */
export function isRegionTag(tagId: string): boolean {
  return TAG_MAP.get(tagId)?.category === "region";
}
