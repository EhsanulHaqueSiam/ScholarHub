import { useTrackerStore } from "@/hooks/useTrackerStore";
import {
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
  type DocumentType,
} from "@/lib/tracker/document-types";

interface DocumentChecklistProps {
  slug: string;
  documentChecks: Record<string, boolean>;
  customRequirements?: string[];
  readOnly?: boolean;
}

export function DocumentChecklist({
  slug,
  documentChecks,
  customRequirements,
  readOnly,
}: DocumentChecklistProps) {
  const toggleDocument = useTrackerStore((s) => s.toggleDocument);
  const docTypes = customRequirements ?? [...DOCUMENT_TYPES];

  const checkedCount = Object.values(documentChecks).filter(Boolean).length;

  return (
    <div className="space-y-1">
      {docTypes.map((docType) => {
        const checked = documentChecks[docType] ?? false;
        const label =
          DOCUMENT_TYPE_LABELS[docType as DocumentType] ?? docType;
        return (
          <div
            key={docType}
            className="flex items-center gap-3 px-3 min-h-[44px]"
          >
            <input
              type="checkbox"
              id={`doc-${slug}-${docType}`}
              checked={checked}
              disabled={readOnly}
              onChange={(e) =>
                toggleDocument(slug, docType, e.target.checked)
              }
              className="size-5 accent-main shrink-0"
            />
            <label
              htmlFor={`doc-${slug}-${docType}`}
              className="text-caption cursor-pointer flex-1"
            >
              {label}
            </label>
          </div>
        );
      })}
      <p className="text-caption text-foreground/60 px-3 pt-2">
        {checkedCount} of {docTypes.length} documents prepared
      </p>
    </div>
  );
}
