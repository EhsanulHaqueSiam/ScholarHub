import type { ToolbarProps } from "react-big-calendar";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MonthNavigation({ date, onNavigate }: ToolbarProps) {
  return (
    <nav
      aria-label="Calendar navigation"
      className="flex items-center justify-between px-4 md:px-6 py-4"
    >
      <Button
        variant="neutral"
        size="icon"
        onClick={() => onNavigate("PREV")}
        aria-label="Previous month"
        className="min-w-[44px] min-h-[44px]"
      >
        <ChevronLeft className="size-5" />
      </Button>

      <span className="font-heading text-subhead">
        {format(date, "MMMM yyyy")}
      </span>

      <Button
        variant="neutral"
        size="icon"
        onClick={() => onNavigate("NEXT")}
        aria-label="Next month"
        className="min-w-[44px] min-h-[44px]"
      >
        <ChevronRight className="size-5" />
      </Button>
    </nav>
  );
}
