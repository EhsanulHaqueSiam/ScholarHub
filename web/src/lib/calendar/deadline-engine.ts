import { startOfMonth, endOfMonth } from "date-fns";
import type { ScholarshipSummary } from "@/lib/scholarship-summary";
import type { UrgencyLevel, CalendarEvent, MonthData } from "./types";

export function computeUrgency(
  deadlineMs: number,
  nowMs: number,
): UrgencyLevel {
  const diffDays = Math.ceil((deadlineMs - nowMs) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "closed";
  if (diffDays <= 7) return "critical";
  if (diffDays <= 30) return "warning";
  return "open";
}

export function getMonthData(
  summaries: ScholarshipSummary[],
  trackedSlugs: Set<string>,
  year: number,
  month: number,
  nowMs: number,
): MonthData {
  const monthStart = startOfMonth(new Date(year, month)).getTime();
  const monthEnd = endOfMonth(new Date(year, month)).getTime();

  const events: CalendarEvent[] = [];

  for (const summary of summaries) {
    if (!summary.slug || !trackedSlugs.has(summary.slug)) continue;
    if (summary.application_deadline == null) continue;

    const dl = summary.application_deadline;
    if (dl < monthStart || dl > monthEnd) continue;

    const date = new Date(dl);
    events.push({
      scholarshipSlug: summary.slug,
      scholarshipTitle: summary.title,
      deadlineMs: dl,
      source: "tracked",
      urgency: computeUrgency(dl, nowMs),
      prestigeTier: summary.prestige_tier ?? null,
      start: date,
      end: date,
      allDay: true,
      title: summary.title,
    });
  }

  const eventsByDay = new Map<number, CalendarEvent[]>();
  for (const event of events) {
    const day = event.start.getDate();
    const existing = eventsByDay.get(day);
    if (existing) {
      existing.push(event);
    } else {
      eventsByDay.set(day, [event]);
    }
  }

  return {
    year,
    month,
    events,
    eventsByDay,
    totalDeadlines: events.length,
    isPeakSeason: events.length >= 3,
  };
}
