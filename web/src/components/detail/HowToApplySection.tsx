import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCountdown, formatDeadlineDisplay } from "@/lib/deadline";
import { getDeadlineUrgency } from "@/lib/filters";
import { urgencyLabelMap, urgencyVariantMap } from "@/lib/shared";
import { EditorialTips } from "./EditorialTips";

interface HowToApplySectionProps {
  applicationDeadline?: number;
  applicationUrl?: string;
  editorialNotes?: string | null;
  expectedReopenMonth?: number;
}

export function HowToApplySection({
  applicationDeadline,
  applicationUrl,
  editorialNotes,
  expectedReopenMonth,
}: HowToApplySectionProps) {
  const urgency = getDeadlineUrgency(applicationDeadline);
  const daysLeft = useCountdown(applicationDeadline);
  const isExpired = urgency === "closed";

  // Client-only timezone display to avoid SSR hydration mismatch
  const [timezoneInfo, setTimezoneInfo] = useState<{
    formattedDate: string;
    userTimezone: string;
  } | null>(null);

  useEffect(() => {
    if (applicationDeadline) {
      setTimezoneInfo(formatDeadlineDisplay(applicationDeadline));
    }
  }, [applicationDeadline]);

  return (
    <section aria-labelledby="how-to-apply-heading">
      <Card>
        <CardHeader>
          <CardTitle id="how-to-apply-heading" className="text-xl">
            How to Apply
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Deadline sub-section */}
          <div className="space-y-1">
            <h3 className="font-heading text-sm">Application Deadline</h3>
            {applicationDeadline ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={urgencyVariantMap[urgency]}>
                    {urgencyLabelMap[urgency]}
                  </Badge>
                  <span className="text-sm">
                    {new Intl.DateTimeFormat("en-US", {
                      dateStyle: "long",
                    }).format(new Date(applicationDeadline))}
                  </span>
                </div>

                {/* Countdown */}
                {daysLeft !== null && !isExpired && (
                  <p className="text-sm text-foreground/70">
                    {daysLeft === 0
                      ? "(Due today)"
                      : daysLeft === 1
                        ? "(1 day left)"
                        : `(${daysLeft} days left)`}
                  </p>
                )}

                {/* Expired state */}
                {isExpired && (
                  <div className="space-y-1">
                    <p className="text-sm">Applications Closed</p>
                    {expectedReopenMonth && (
                      <p className="text-sm text-foreground/70">
                        Expected to reopen:{" "}
                        {new Date(0, expectedReopenMonth - 1).toLocaleString(
                          "en-US",
                          { month: "long" },
                        )}{" "}
                        {new Date().getFullYear() +
                          (expectedReopenMonth <= new Date().getMonth() + 1
                            ? 1
                            : 0)}
                      </p>
                    )}
                  </div>
                )}

                {/* Timezone line (client-only) */}
                {timezoneInfo && (
                  <p className="text-sm text-foreground/50">
                    Your time: {timezoneInfo.formattedDate} (
                    {timezoneInfo.userTimezone})
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-foreground/50">
                No deadline specified -- check official application page
              </p>
            )}
          </div>

          {/* Apply button */}
          {applicationUrl && !isExpired ? (
            <Button
              variant="default"
              size="lg"
              className="w-full md:w-auto"
              asChild
            >
              <a
                href={applicationUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Apply now (opens in new tab)"
              >
                Apply Now
              </a>
            </Button>
          ) : isExpired ? (
            <Button
              variant="default"
              size="lg"
              className="w-full md:w-auto"
              disabled
            >
              Applications Closed
            </Button>
          ) : (
            <Button
              variant="default"
              size="lg"
              className="w-full md:w-auto"
              disabled
            >
              Application Link Unavailable
            </Button>
          )}

          {/* Editorial tips */}
          <EditorialTips notes={editorialNotes} />
        </CardContent>
      </Card>
    </section>
  );
}
