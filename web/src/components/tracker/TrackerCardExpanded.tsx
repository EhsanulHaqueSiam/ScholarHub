import { useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useTrackerStore } from "@/hooks/useTrackerStore";
import { STAGE_CONFIG, type TrackerStage } from "@/lib/tracker/types";
import type { TrackerEntry } from "@/lib/tracker/types";
import { NotesEditor } from "./NotesEditor";
import { DocumentChecklist } from "./DocumentChecklist";

const STAGES = Object.keys(STAGE_CONFIG) as TrackerStage[];

interface TrackerCardExpandedProps {
  entry: TrackerEntry;
  onClose: () => void;
}

export function TrackerCardExpanded({
  entry,
  onClose,
}: TrackerCardExpandedProps) {
  const moveToStage = useTrackerStore((s) => s.moveToStage);
  const removeEntry = useTrackerStore((s) => s.removeEntry);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleStageChange = (stage: TrackerStage) => {
    if (stage === entry.stage) return;
    moveToStage(entry.scholarshipSlug, stage);
    toast.success(`Moved to ${STAGE_CONFIG[stage].label}`);
  };

  const handleRemove = () => {
    removeEntry(entry.scholarshipSlug);
    toast.success("Removed from tracker");
    onClose();
  };

  return (
    <div className="bg-secondary-background border-2 border-border shadow-shadow p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-body font-heading leading-snug">
          {entry.scholarshipTitle}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 p-1 hover:bg-border/30 transition-colors"
          aria-label="Close expanded view"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Stage selector */}
      <div className="space-y-2">
        <p className="text-caption font-heading uppercase tracking-wide">
          Stage
        </p>
        <div className="flex flex-wrap gap-2">
          {STAGES.map((stage) => {
            const config = STAGE_CONFIG[stage];
            const isActive = stage === entry.stage;
            return (
              <button
                key={stage}
                type="button"
                onClick={() => handleStageChange(stage)}
                className={`px-3 py-1.5 text-caption border-2 border-border transition-colors ${
                  isActive
                    ? "bg-[var(--main)] text-main-foreground"
                    : "bg-secondary-background hover:bg-border/20"
                }`}
              >
                {config.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Documents section */}
      <div className="space-y-2">
        <p className="text-caption font-heading uppercase tracking-wide">
          Documents
        </p>
        <DocumentChecklist
          slug={entry.scholarshipSlug}
          documentChecks={entry.documentChecks}
        />
      </div>

      {/* Notes section */}
      <div className="space-y-2">
        <p className="text-caption font-heading uppercase tracking-wide">
          Notes
        </p>
        <NotesEditor
          slug={entry.scholarshipSlug}
          initialNotes={entry.notes}
        />
      </div>

      {/* Footer: remove button */}
      <div className="pt-2">
        <Button variant="destructive" size="sm" onClick={handleRemove}>
          Remove from tracker
        </Button>
      </div>
    </div>
  );
}
