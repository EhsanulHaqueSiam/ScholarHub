import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod/v4";
import { CalendarPage } from "@/components/calendar/CalendarPage";

const calendarSearch = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
});

export const Route = createFileRoute("/calendar")({
  validateSearch: calendarSearch,
  head: () => ({
    meta: [
      { title: "Deadline Calendar | ScholarHub" },
      {
        name: "description",
        content:
          "View your scholarship deadlines in a monthly calendar.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CalendarPage,
});
