import { z } from "zod";

/** URL search params schema for TanStack Router validateSearch */
export const scholarshipSearchSchema = z.object({
  q: z.string().optional(),
  from: z.string().optional(), // comma-separated ISO codes: "BD,IN"
  to: z.string().optional(), // comma-separated ISO codes: "DE,GB,US"
  degree: z.string().optional(), // comma-separated: "phd,masters"
  field: z.string().optional(), // comma-separated: "engineering,medicine"
  funding: z.string().optional(), // comma-separated: "fully_funded,partial"
  tier: z.string().optional(), // comma-separated: "gold,silver"
  sort: z.enum(["deadline", "prestige", "newest", "amount"]).optional(),
  view: z.enum(["grid", "list"]).optional(),
  show_closed: z.coerce.boolean().optional(),
  show_ineligible: z.coerce.boolean().optional(),
  closing_soon: z.coerce.boolean().optional(),
});

export type ScholarshipSearch = z.infer<typeof scholarshipSearchSchema>;

/** Parse comma-separated string into array */
export function parseCommaSeparated(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Serialize array into comma-separated string */
export function serializeCommaSeparated(
  values: string[],
): string | undefined {
  if (values.length === 0) return undefined;
  return values.join(",");
}

/** Degree level options */
export const DEGREE_LEVELS = [
  { value: "bachelor", label: "Bachelor" },
  { value: "master", label: "Master's" },
  { value: "phd", label: "PhD" },
  { value: "postdoc", label: "Postdoc" },
] as const;

/** Fields of study (25 broad categories) */
export const FIELDS_OF_STUDY = [
  "Agriculture",
  "Architecture",
  "Arts & Humanities",
  "Business & Management",
  "Computer Science",
  "Economics",
  "Education",
  "Engineering",
  "Environmental Science",
  "Health Sciences",
  "International Relations",
  "Law",
  "Mathematics",
  "Media & Communication",
  "Medicine",
  "Natural Sciences",
  "Nursing",
  "Pharmacy",
  "Philosophy",
  "Political Science",
  "Psychology",
  "Public Health",
  "Social Sciences",
  "Technology",
  "Veterinary Science",
] as const;

/** Funding type options */
export const FUNDING_TYPES = [
  { value: "fully_funded", label: "Fully Funded" },
  { value: "partial", label: "Partial" },
  { value: "tuition_waiver", label: "Tuition Waiver" },
  { value: "stipend_only", label: "Stipend Only" },
] as const;

/** Sort options */
export const SORT_OPTIONS = [
  { value: "deadline", label: "Deadline" },
  { value: "prestige", label: "Prestige" },
  { value: "newest", label: "Newest" },
  { value: "amount", label: "Amount" },
] as const;

/** Deadline urgency classification */
export function getDeadlineUrgency(
  deadline: number | undefined,
): "critical" | "warning" | "open" | "closed" {
  if (!deadline) return "open"; // No deadline = always open
  const now = Date.now();
  const diff = deadline - now;
  if (diff < 0) return "closed";
  if (diff < 7 * 24 * 60 * 60 * 1000) return "critical"; // < 7 days
  if (diff < 30 * 24 * 60 * 60 * 1000) return "warning"; // < 30 days
  return "open";
}

/** Check if scholarship was published in last 7 days */
export function isNew(creationTime: number): boolean {
  return Date.now() - creationTime < 7 * 24 * 60 * 60 * 1000;
}
