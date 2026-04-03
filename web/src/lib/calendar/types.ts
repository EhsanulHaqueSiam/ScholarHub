export type UrgencyLevel = "critical" | "warning" | "open" | "closed";

export interface CalendarEvent {
  scholarshipSlug: string;
  scholarshipTitle: string;
  deadlineMs: number;
  source: "tracked";
  urgency: UrgencyLevel;
  prestigeTier: string | null;
  start: Date;
  end: Date;
  allDay: boolean;
  title: string;
}

export interface MonthData {
  year: number;
  month: number;
  events: CalendarEvent[];
  eventsByDay: Map<number, CalendarEvent[]>;
  totalDeadlines: number;
  isPeakSeason: boolean;
}
