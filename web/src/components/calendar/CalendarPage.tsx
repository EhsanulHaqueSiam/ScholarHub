import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, type SlotInfo } from "react-big-calendar";
import { format } from "date-fns";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useTrackerHydration, useTrackerStore } from "@/hooks/useTrackerStore";
import { useStaticData } from "@/hooks/useStaticData";
import { getMonthData } from "@/lib/calendar/deadline-engine";
import { localizer } from "@/lib/calendar/localizer";
import type { CalendarEvent } from "@/lib/calendar/types";
import { Navbar } from "@/components/layout/Navbar";
import { BackToTop } from "@/components/layout/BackToTop";
import { StorageErrorBanner } from "@/components/ui/storage-error-banner";
import { MonthNavigation } from "./MonthNavigation";
import { DeadlineChip } from "./DeadlineChip";
import { DayHeader } from "./DayHeader";
import { DayDetailPanel } from "./DayDetailPanel";
import { PeakSeasonBanner } from "./PeakSeasonBanner";
import { CalendarEmptyState } from "./CalendarEmptyState";
import "./calendar-overrides.css";

const urgencyBg: Record<string, string> = {
  critical: "var(--urgency-critical)",
  warning: "var(--urgency-warning)",
  open: "var(--urgency-open)",
  closed: "var(--urgency-closed)",
};

function parseMonthParam(param: string | undefined): { year: number; month: number } {
  if (param) {
    const match = param.match(/^(\d{4})-(\d{2})$/);
    if (match) {
      return { year: Number(match[1]), month: Number(match[2]) - 1 };
    }
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

export function CalendarPage() {
  const hydrated = useTrackerHydration();
  const entries = useTrackerStore((s) => s.entries);
  const storageError = useTrackerStore((s) => s.storageError);
  const { data, isLoading } = useStaticData();
  const navigate = useNavigate();
  const search = useSearch({ from: "/calendar" });

  // SSR-safe nowMs: null on server, set in useEffect
  const [nowMs, setNowMs] = useState<number | null>(null);
  useEffect(() => {
    setNowMs(Date.now());
  }, []);

  const { year, month } = parseMonthParam(search.month);
  const currentDate = useMemo(() => new Date(year, month, 1), [year, month]);

  const trackedSlugs = useMemo(
    () => new Set(entries.map((e) => e.scholarshipSlug)),
    [entries],
  );

  const monthData = useMemo(() => {
    if (!data?.summaries || nowMs === null) return null;
    return getMonthData(data.summaries, trackedSlugs, year, month, nowMs);
  }, [data?.summaries, trackedSlugs, year, month, nowMs]);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const selectedDayEvents = useMemo(() => {
    if (!selectedDate || !monthData) return [];
    return monthData.eventsByDay.get(selectedDate.getDate()) ?? [];
  }, [selectedDate, monthData]);

  const handleNavigate = useCallback(
    (newDate: Date) => {
      const m = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, "0")}`;
      navigate({
        to: "/calendar",
        search: { month: m },
        replace: true,
      });
      setSelectedDate(null);
    },
    [navigate],
  );

  const handleSelectSlot = useCallback(
    (slotInfo: SlotInfo) => {
      const clickedDate = slotInfo.start;
      if (
        selectedDate &&
        selectedDate.getTime() === clickedDate.getTime()
      ) {
        setSelectedDate(null);
      } else {
        setSelectedDate(clickedDate);
      }
    },
    [selectedDate],
  );

  const eventPropGetter = useCallback((event: CalendarEvent) => {
    return {
      style: {
        backgroundColor: urgencyBg[event.urgency] ?? "var(--secondary-background)",
        color: event.urgency === "warning" ? "var(--accent-foreground)" : "var(--main-foreground)",
        borderColor: "var(--border)",
        borderLeft: "4px solid var(--main)",
      },
    };
  }, []);

  // Loading state
  if (!hydrated || isLoading || nowMs === null) {
    return (
      <>
        <Navbar />
        <div className="pt-24 pb-12 px-4 md:px-6 max-w-5xl mx-auto">
          <h1 className="font-heading text-heading mb-6">Deadline Calendar</h1>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-secondary-background border-2 border-border" />
            <div className="h-[400px] bg-secondary-background border-2 border-border" />
          </div>
        </div>
      </>
    );
  }

  // Empty state
  if (entries.length === 0) {
    return (
      <>
        <Navbar />
        <div className="pt-24 pb-12 px-4 md:px-6 max-w-5xl mx-auto">
          {storageError && <StorageErrorBanner error={storageError} />}
          <h1 className="font-heading text-heading mb-6">Deadline Calendar</h1>
          <CalendarEmptyState />
        </div>
        <BackToTop />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="pt-24 pb-12 px-4 md:px-6 max-w-5xl mx-auto">
        {storageError && <StorageErrorBanner error={storageError} />}

        <h1 className="font-heading text-heading mb-6">Deadline Calendar</h1>

        {monthData && (
          <PeakSeasonBanner
            monthData={monthData}
            monthLabel={format(currentDate, "MMMM")}
          />
        )}

        <Calendar<CalendarEvent>
          localizer={localizer}
          events={monthData?.events ?? []}
          views={["month"]}
          defaultView="month"
          date={currentDate}
          onNavigate={handleNavigate}
          onSelectEvent={(event) =>
            navigate({
              to: "/scholarships/$slug",
              params: { slug: event.scholarshipSlug },
            })
          }
          onSelectSlot={handleSelectSlot}
          selectable
          eventPropGetter={eventPropGetter}
          components={{
            toolbar: MonthNavigation,
            event: DeadlineChip,
            month: { dateHeader: DayHeader },
          }}
          style={{ minHeight: 500 }}
        />

        <DayDetailPanel
          selectedDate={selectedDate}
          events={selectedDayEvents}
          onClose={() => setSelectedDate(null)}
        />
      </div>
      <BackToTop />
    </>
  );
}
