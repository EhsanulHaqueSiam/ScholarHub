import { useState, useCallback, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { useTrackerStore, useTrackerHydration } from "@/hooks/useTrackerStore";
import { groupByStage } from "@/lib/tracker/tracker-engine";
import { STAGE_CONFIG, type TrackerStage } from "@/lib/tracker/types";
import { TrackerColumn } from "./TrackerColumn";
import { TrackerCard } from "./TrackerCard";
import { TrackerEmptyState } from "./TrackerEmptyState";
import { MobileStageSelector } from "./MobileStageSelector";

const STAGES = Object.keys(STAGE_CONFIG) as TrackerStage[];

function KanbanSkeleton() {
  return (
    <>
      {/* Desktop skeleton */}
      <div className="hidden lg:flex gap-8 overflow-x-auto" aria-hidden="true">
        {STAGES.map((stage) => (
          <div key={stage} className="w-[280px] shrink-0 border-2 border-border bg-secondary-background">
            <div className="px-4 py-3 border-b-2 border-border">
              <div className="animate-pulse bg-border/40 h-6 w-24" />
            </div>
            <div className="p-4 space-y-3">
              <div className="animate-pulse bg-secondary-background border-2 border-border h-24" />
              <div className="animate-pulse bg-secondary-background border-2 border-border h-24" />
            </div>
          </div>
        ))}
      </div>
      {/* Mobile skeleton */}
      <div className="lg:hidden space-y-3" aria-hidden="true">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {STAGES.map((stage) => (
            <div key={stage} className="animate-pulse bg-border/40 h-10 w-28 shrink-0" />
          ))}
        </div>
        <div className="animate-pulse bg-secondary-background border-2 border-border h-24" />
        <div className="animate-pulse bg-secondary-background border-2 border-border h-24" />
        <div className="animate-pulse bg-secondary-background border-2 border-border h-24" />
      </div>
    </>
  );
}

export function TrackerKanban() {
  const hydrated = useTrackerHydration();
  const entries = useTrackerStore((s) => s.entries);
  const moveToStage = useTrackerStore((s) => s.moveToStage);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileStage, setMobileStage] = useState<TrackerStage>("researching");

  const grouped = useMemo(() => groupByStage(entries), [entries]);

  const entryCounts = useMemo(() => {
    const counts = {} as Record<TrackerStage, number>;
    for (const stage of STAGES) {
      counts[stage] = grouped[stage].length;
    }
    return counts;
  }, [grouped]);

  const activeEntry = useMemo(
    () => (activeId ? entries.find((e) => e.scholarshipSlug === activeId) : undefined),
    [activeId, entries],
  );

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  });
  const keyboardSensor = useSensor(KeyboardSensor);
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 250, tolerance: 5 },
  });
  const sensors = useSensors(pointerSensor, keyboardSensor, touchSensor);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over) return;

      const slug = active.id as string;
      const targetStage = over.id as TrackerStage;

      // Only move if the stage is different
      const entry = entries.find((e) => e.scholarshipSlug === slug);
      if (!entry || entry.stage === targetStage) return;

      moveToStage(slug, targetStage);
      toast.success(`Moved to ${STAGE_CONFIG[targetStage].label}`);
    },
    [entries, moveToStage],
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  if (!hydrated) {
    return <KanbanSkeleton />;
  }

  if (entries.length === 0) {
    return <TrackerEmptyState />;
  }

  return (
    <div aria-label="Application tracker board">
      {/* Desktop: 5-column Kanban */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        accessibility={{
          announcements: {
            onDragStart({ active }) {
              const entry = entries.find((e) => e.scholarshipSlug === active.id);
              return entry
                ? `Picked up ${entry.scholarshipTitle}. Currently in ${STAGE_CONFIG[entry.stage].label}.`
                : "";
            },
            onDragOver({ active, over }) {
              if (!over) return "";
              const entry = entries.find((e) => e.scholarshipSlug === active.id);
              const targetLabel = STAGE_CONFIG[over.id as TrackerStage]?.label;
              return entry && targetLabel
                ? `${entry.scholarshipTitle} is over ${targetLabel}.`
                : "";
            },
            onDragEnd({ active, over }) {
              if (!over) return "";
              const entry = entries.find((e) => e.scholarshipSlug === active.id);
              const targetLabel = STAGE_CONFIG[over.id as TrackerStage]?.label;
              return entry && targetLabel
                ? `Moved ${entry.scholarshipTitle} to ${targetLabel}.`
                : "";
            },
            onDragCancel({ active }) {
              const entry = entries.find((e) => e.scholarshipSlug === active.id);
              return entry
                ? `Cancelled moving ${entry.scholarshipTitle}. Returned to original position.`
                : "";
            },
          },
        }}
      >
        <div className="hidden lg:flex gap-8 overflow-x-auto pb-4">
          {STAGES.map((stage) => (
            <TrackerColumn
              key={stage}
              stage={stage}
              entries={grouped[stage]}
            />
          ))}
        </div>

        <DragOverlay>
          {activeEntry ? (
            <TrackerCard entry={activeEntry} isDragOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Mobile: stage selector + cards for selected stage */}
      <div className="lg:hidden">
        <MobileStageSelector
          activeStage={mobileStage}
          onStageChange={setMobileStage}
          entryCounts={entryCounts}
        />

        <div className="mt-4 space-y-3">
          {grouped[mobileStage].length === 0 ? (
            <p className="text-caption text-foreground/60 text-center py-8">
              No applications in {STAGE_CONFIG[mobileStage].label}
            </p>
          ) : (
            grouped[mobileStage].map((entry) => (
              <TrackerCard
                key={entry.scholarshipSlug}
                entry={entry}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
