import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CalendarEvent } from "@/lib/calendar/types";

const urgencyVariant = {
  critical: "urgencyCritical",
  warning: "urgencyWarning",
  open: "urgencyOpen",
  closed: "urgencyClosed",
} as const;

interface DayDetailPanelProps {
  selectedDate: Date | null;
  events: CalendarEvent[];
  onClose: () => void;
}

export function DayDetailPanel({
  selectedDate,
  events,
  onClose,
}: DayDetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  if (!selectedDate || events.length === 0) return null;

  const navigate = useNavigate();

  return (
    <div
      ref={panelRef}
      aria-live="polite"
      className="mt-4 motion-safe:animate-in motion-safe:slide-in-from-top-2 motion-safe:duration-150 md:max-w-full max-h-[50vh] md:max-h-none overflow-y-auto"
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-body">
            {format(selectedDate, "EEEE, MMMM d, yyyy")} — {events.length}{" "}
            deadline{events.length !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {events.map((event) => (
            <div
              key={event.scholarshipSlug}
              className="flex items-start justify-between gap-3 border-b-2 border-border pb-3 last:border-b-0 last:pb-0"
            >
              <div className="flex flex-col gap-1 min-w-0">
                <Badge variant={urgencyVariant[event.urgency]}>
                  {event.urgency}
                </Badge>
                <span className="text-body font-heading truncate">
                  {event.scholarshipTitle}
                </span>
                <span className="text-caption opacity-70">
                  Deadline: {format(event.start, "MMMM d, yyyy")}
                </span>
              </div>
              <Button
                variant="neutral"
                size="sm"
                className="shrink-0"
                onClick={() =>
                  navigate({
                    to: "/scholarships/$slug",
                    params: { slug: event.scholarshipSlug },
                  })
                }
              >
                View
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
