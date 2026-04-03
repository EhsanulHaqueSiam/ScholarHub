import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { MonthData } from "@/lib/calendar/types";

interface PeakSeasonBannerProps {
  monthData: MonthData;
  monthLabel: string;
}

export function PeakSeasonBanner({
  monthData,
  monthLabel,
}: PeakSeasonBannerProps) {
  if (!monthData.isPeakSeason) return null;

  const message =
    monthData.totalDeadlines >= 6
      ? `Very busy month — ${monthData.totalDeadlines} deadlines in ${monthLabel}. Consider prioritizing by urgency.`
      : `Busy month ahead — you have ${monthData.totalDeadlines} deadlines in ${monthLabel}.`;

  return (
    <Card className="border-l-4 border-l-[var(--main)] mb-4">
      <CardContent className="flex items-center gap-3">
        <AlertTriangle className="size-5 shrink-0 text-[var(--warning)]" />
        <span className="text-body">{message}</span>
      </CardContent>
    </Card>
  );
}
