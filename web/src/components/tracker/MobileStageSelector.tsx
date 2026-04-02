import { STAGE_CONFIG, type TrackerStage } from "@/lib/tracker/types";
import { cn } from "@/lib/utils";

interface MobileStageSelectorProps {
  activeStage: TrackerStage;
  onStageChange: (stage: TrackerStage) => void;
  entryCounts: Record<TrackerStage, number>;
}

const STAGES = Object.keys(STAGE_CONFIG) as TrackerStage[];

export function MobileStageSelector({
  activeStage,
  onStageChange,
  entryCounts,
}: MobileStageSelectorProps) {
  return (
    <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
      {STAGES.map((stage) => {
        const config = STAGE_CONFIG[stage];
        const isActive = stage === activeStage;

        return (
          <button
            key={stage}
            type="button"
            onClick={() => onStageChange(stage)}
            className={cn(
              "shrink-0 px-3 py-2 text-caption font-heading border-2 whitespace-nowrap min-h-[44px] transition-colors duration-150",
              isActive
                ? "bg-[var(--main)] text-main-foreground border-border"
                : "bg-secondary-background border-border",
            )}
          >
            {config.label} ({entryCounts[stage]})
          </button>
        );
      })}
    </div>
  );
}
