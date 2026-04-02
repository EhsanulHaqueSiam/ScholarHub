import { Check } from "lucide-react";
import { useTrackerStore } from "@/hooks/useTrackerStore";
import { getDocumentMatrix } from "@/lib/tracker/tracker-engine";
import { DOCUMENT_TYPE_LABELS, type DocumentType } from "@/lib/tracker/document-types";

export function DocumentMatrix() {
  const entries = useTrackerStore((s) => s.entries);
  const matrix = getDocumentMatrix(entries);

  if (entries.length === 0) return null;

  // Abbreviate title to max 15 chars
  const abbreviate = (title: string) =>
    title.length > 15 ? `${title.slice(0, 15)}...` : title;

  // Find top 2 most common unchecked documents for summary
  const uncheckedSummary = matrix
    .map((row) => ({
      label: row.label,
      uncheckedCount: row.totalCount - row.checkedCount,
    }))
    .filter((item) => item.uncheckedCount > 0)
    .sort((a, b) => b.uncheckedCount - a.uncheckedCount)
    .slice(0, 2);

  return (
    <section>
      <h2 className="font-heading text-heading mb-6">Document Overview</h2>

      <div className="overflow-x-auto border-2 border-border">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 bg-secondary-background z-10 text-caption text-left px-3 py-2 border-2 border-border font-heading">
                Document
              </th>
              {entries.map((entry) => (
                <th
                  key={entry.scholarshipSlug}
                  className="text-caption text-center px-3 py-2 border-2 border-border font-heading"
                  title={entry.scholarshipTitle}
                >
                  {abbreviate(entry.scholarshipTitle)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row) => (
              <tr key={row.docType}>
                <td className="sticky left-0 bg-secondary-background z-10 text-caption px-3 py-2 border-2 border-border">
                  {DOCUMENT_TYPE_LABELS[row.docType as DocumentType] ??
                    row.docType}
                </td>
                {row.scholarships.map((sch) => (
                  <td
                    key={sch.slug}
                    className="text-caption text-center px-3 py-2 border-2 border-border"
                  >
                    {sch.checked ? (
                      <Check className="size-4 text-[var(--success)] mx-auto" />
                    ) : (
                      <span className="text-foreground/30">-</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {/* Summary row */}
            <tr>
              <td className="sticky left-0 bg-secondary-background z-10 text-caption font-heading px-3 py-2 border-2 border-border">
                Summary
              </td>
              {entries.map((entry) => {
                const checked = Object.values(entry.documentChecks).filter(
                  Boolean,
                ).length;
                return (
                  <td
                    key={entry.scholarshipSlug}
                    className="text-caption text-center px-3 py-2 border-2 border-border font-heading"
                  >
                    {checked}/{matrix.length}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Actionable summary for top unchecked documents */}
      {uncheckedSummary.length > 0 && (
        <div className="mt-4 space-y-1">
          {uncheckedSummary.map((item) => (
            <p key={item.label} className="text-caption text-foreground/70">
              You need {item.label} for {item.uncheckedCount} of your{" "}
              {entries.length} tracked scholarships
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
