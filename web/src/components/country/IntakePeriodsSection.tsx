import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CountryData } from "@/lib/country-data";

interface IntakePeriodsSectionProps {
  data: CountryData;
}

export function IntakePeriodsSection({ data }: IntakePeriodsSectionProps) {
  const { intakes, applicationTimeline } = data;

  return (
    <section aria-labelledby="intake-heading">
      <h2 id="intake-heading" className="text-xl font-heading mb-4 flex items-center gap-2">
        <Calendar className="size-5" />
        Intake Periods
      </h2>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-wrap gap-3">
            {intakes.map((intake) => (
              <div
                key={intake.name}
                className="flex items-center gap-2 rounded-base border-2 border-border px-4 py-3 bg-secondary-background"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-heading text-sm">{intake.name}</span>
                    {intake.isMain && <Badge variant="default">Main Intake</Badge>}
                  </div>
                  <span className="text-sm text-foreground/70">{intake.months}</span>
                </div>
              </div>
            ))}
          </div>
          {applicationTimeline && (
            <p className="text-sm text-foreground/70 border-t-2 border-border/50 pt-3">
              {applicationTimeline}
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
