import type { TrackerEntry, TrackerStage } from "./types";
import { STAGE_CONFIG } from "./types";
import { DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS } from "./document-types";
import type { DocumentType } from "./document-types";
import type { ScholarshipSummary } from "@/lib/scholarship-summary";

/**
 * Group tracker entries by their current stage.
 * Returns all 5 stages with empty arrays for stages with no entries.
 */
export function groupByStage(
  entries: TrackerEntry[]
): Record<TrackerStage, TrackerEntry[]> {
  const result = {} as Record<TrackerStage, TrackerEntry[]>;

  for (const stage of Object.keys(STAGE_CONFIG) as TrackerStage[]) {
    result[stage] = [];
  }

  for (const entry of entries) {
    result[entry.stage].push(entry);
  }

  return result;
}

export interface DocumentMatrixRow {
  docType: DocumentType;
  label: string;
  scholarships: { slug: string; title: string; checked: boolean }[];
  checkedCount: number;
  totalCount: number;
}

/**
 * Build a document matrix: for each document type, list all tracked
 * scholarships and whether that document has been checked off.
 */
export function getDocumentMatrix(
  entries: TrackerEntry[]
): DocumentMatrixRow[] {
  return DOCUMENT_TYPES.map((docType) => {
    const scholarships = entries.map((entry) => ({
      slug: entry.scholarshipSlug,
      title: entry.scholarshipTitle,
      checked: entry.documentChecks[docType] === true,
    }));

    const checkedCount = scholarships.filter((s) => s.checked).length;

    return {
      docType,
      label: DOCUMENT_TYPE_LABELS[docType],
      scholarships,
      checkedCount,
      totalCount: entries.length,
    };
  });
}

/**
 * Find the application deadline for a tracked entry by looking up
 * the scholarship in a list of summaries.
 */
export function getDeadlineForEntry(
  slug: string,
  summaries: ScholarshipSummary[]
): number | null {
  const summary = summaries.find((s) => s.slug === slug);
  return summary?.application_deadline ?? null;
}
