import { useDroppable } from "@dnd-kit/core";
import { STAGE_CONFIG, type TrackerStage, type TrackerEntry } from "@/lib/tracker/types";
import { Badge } from "@/components/ui/badge";
import { TrackerCard } from "./TrackerCard";
import { cn } from "@/lib/utils";

interface TrackerColumnProps {
  stage: TrackerStage;
  entries: TrackerEntry[];
  onCardExpand?: (slug: string) => void;
}

export function TrackerColumn({ stage, entries, onCardExpand }: TrackerColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const config = STAGE_CONFIG[stage];

  return (
    <div
      className={cn(
        "w-[280px] shrink-0 border-2 border-border bg-secondary-background",
        isOver && "border-dashed border-2 border-main bg-background",
      )}
    >
      {/* Column header */}
      <div
        className="px-4 py-3 border-b-2 border-border flex items-center justify-between"
        style={{ backgroundColor: `var(--${config.colorToken})` }}
      >
        <h3 className="font-heading text-subhead">{config.label}</h3>
        <Badge variant="default">{entries.length}</Badge>
      </div>

      {/* Droppable card area */}
      <div
        ref={setNodeRef}
        className="min-h-[200px] space-y-3 p-4"
      >
        {entries.map((entry) => (
          <TrackerCard
            key={entry.scholarshipSlug}
            entry={entry}
            onExpand={onCardExpand}
          />
        ))}
      </div>
    </div>
  );
}
