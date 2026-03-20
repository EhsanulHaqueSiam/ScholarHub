import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OverviewSectionProps {
  description: string | null | undefined;
}

export function OverviewSection({ description }: OverviewSectionProps) {
  return (
    <section aria-labelledby="overview-heading">
      <Card>
        <CardHeader>
          <CardTitle id="overview-heading" className="text-xl">
            Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {description ? (
            <p className="text-base leading-relaxed whitespace-pre-line">
              {description}
            </p>
          ) : (
            <p className="text-foreground/50 text-sm italic">
              No description available for this scholarship. Visit the official
              application page for more details.
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
