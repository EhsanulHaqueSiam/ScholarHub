import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStaticData } from "@/hooks/useStaticData";
import { getDeadlineForEntry } from "@/lib/tracker/tracker-engine";
import { DOCUMENT_TYPES } from "@/lib/tracker/document-types";
import { getDeadlineUrgency } from "@/lib/filters";
import { urgencyVariantMap, urgencyLabelMap } from "@/lib/shared";
import type { TrackerEntry } from "@/lib/tracker/types";

interface TrackerCardProps {
  entry: TrackerEntry;
  onExpand?: (slug: string) => void;
  isDragOverlay?: boolean;
}

export function TrackerCard({ entry, onExpand, isDragOverlay }: TrackerCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useDraggable({
      id: entry.scholarshipSlug,
      disabled: isDragOverlay,
    });

  const { data } = useStaticData();

  const deadline = getDeadlineForEntry(
    entry.scholarshipSlug,
    data?.summaries ?? [],
  );
  const urgency = getDeadlineUrgency(deadline ?? undefined);

  const docsChecked = Object.values(entry.documentChecks).filter(Boolean).length;
  const docsTotal = DOCUMENT_TYPES.length;

  const notesPreview =
    entry.notes && entry.notes.length > 80
      ? `${entry.notes.slice(0, 80)}...`
      : entry.notes;

  const style = isDragOverlay
    ? { opacity: 0.9 }
    : {
        transform: CSS.Transform.toString(transform),
        transition,
      };

  return (
    <Card
      ref={isDragOverlay ? undefined : setNodeRef}
      style={style}
      className="cursor-pointer p-0 gap-0"
      onClick={() => onExpand?.(entry.scholarshipSlug)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onExpand?.(entry.scholarshipSlug);
        }
      }}
    >
      <div className="flex items-start gap-2 p-4">
        {/* Drag handle -- desktop only */}
        <button
          type="button"
          className="hidden lg:flex items-center justify-center shrink-0 mt-0.5 cursor-grab active:cursor-grabbing touch-none min-w-[24px] min-h-[44px]"
          aria-label="Drag to reorder"
          {...listeners}
          {...attributes}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="size-5 text-foreground/50" />
        </button>

        <div className="flex flex-col gap-2 min-w-0 flex-1">
          {/* Title */}
          <p className="text-body font-base line-clamp-2 leading-snug">
            {entry.scholarshipTitle}
          </p>

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Deadline badge */}
            <Badge
              variant={
                urgencyVariantMap[urgency] as
                  | "urgencyCritical"
                  | "urgencyWarning"
                  | "urgencyOpen"
                  | "urgencyClosed"
              }
            >
              {deadline
                ? urgencyLabelMap[urgency]
                : "No deadline"}
            </Badge>

            {/* Document status */}
            <Badge variant="neutral">
              <span className="text-caption">
                {docsChecked}/{docsTotal} docs
              </span>
            </Badge>
          </div>

          {/* Notes preview */}
          {notesPreview && (
            <p className="text-caption text-foreground/70 line-clamp-1">
              {notesPreview}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
