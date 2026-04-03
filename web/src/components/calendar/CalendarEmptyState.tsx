import { Calendar as CalendarIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function CalendarEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto py-16">
      <CalendarIcon className="size-16 opacity-30 mb-6" />
      <h2 className="font-heading text-subhead mb-3">No upcoming deadlines</h2>
      <p className="text-body mb-6 opacity-70">
        Start tracking scholarships to see their deadlines here. Deadlines from
        your tracked scholarships will appear on the calendar.
      </p>
      <Button asChild>
        <Link to="/scholarships">Browse Scholarships</Link>
      </Button>
    </div>
  );
}
