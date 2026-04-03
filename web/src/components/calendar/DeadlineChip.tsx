import type { EventProps } from "react-big-calendar";
import { useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import type { CalendarEvent } from "@/lib/calendar/types";

const urgencyClasses: Record<string, string> = {
  critical: "bg-urgency-critical text-main-foreground border-urgency-critical",
  warning: "bg-urgency-warning text-accent-foreground border-urgency-warning",
  open: "bg-urgency-open text-main-foreground border-urgency-open",
  closed: "bg-urgency-closed text-main-foreground border-urgency-closed",
};

export function DeadlineChip({ event }: EventProps<CalendarEvent>) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className={`w-full text-left border-l-4 border-l-[var(--main)] truncate ${urgencyClasses[event.urgency] ?? ""}`}
      style={{ borderRadius: 0, fontSize: "inherit", padding: "inherit" }}
      onClick={(e) => {
        e.stopPropagation();
        navigate({
          to: "/scholarships/$slug",
          params: { slug: event.scholarshipSlug },
        });
      }}
      aria-label={`${event.scholarshipTitle} — deadline ${format(event.start, "MMMM d, yyyy")}`}
    >
      <span className="hidden md:inline">{event.title.length > 20 ? `${event.title.slice(0, 20)}…` : event.title}</span>
      <span className="md:hidden">●</span>
    </button>
  );
}
