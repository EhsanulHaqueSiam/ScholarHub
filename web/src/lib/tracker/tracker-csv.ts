import { format } from "date-fns";
import type { TrackerEntry } from "./types";
import { STAGE_CONFIG } from "./types";
import { DOCUMENT_TYPES } from "./document-types";

/**
 * Escape a CSV field value. Wraps in double quotes if the value
 * contains a comma, double quote, or newline. Inner double quotes
 * are doubled per RFC 4180.
 */
function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Count how many document types are checked (true) for an entry.
 */
function countCheckedDocs(entry: TrackerEntry): number {
  let count = 0;
  for (const docType of DOCUMENT_TYPES) {
    if (entry.documentChecks[docType] === true) {
      count++;
    }
  }
  return count;
}

/**
 * Generate a CSV string from tracker entries.
 * Columns: Title, Stage, Deadline, Notes, Documents Completed, Date Added
 */
export function generateCSV(entries: TrackerEntry[]): string {
  const headers = "Title,Stage,Deadline,Notes,Documents Completed,Date Added";
  const rows = entries.map((entry) => {
    const title = escapeCSV(entry.scholarshipTitle);
    const stage = STAGE_CONFIG[entry.stage].label;
    const deadline = ""; // placeholder -- deadline resolution requires summaries
    const notes = escapeCSV(entry.notes ?? "");
    const docsCompleted = `${countCheckedDocs(entry)}/${DOCUMENT_TYPES.length}`;
    const dateAdded = format(new Date(entry.addedAt), "yyyy-MM-dd");

    return `${title},${stage},${deadline},${notes},${docsCompleted},${dateAdded}`;
  });

  return [headers, ...rows].join("\n");
}

/**
 * Create a Blob from CSV content and trigger a browser download.
 */
export function downloadCSV(
  csvContent: string,
  filename = "scholarhub-tracker.csv"
): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
