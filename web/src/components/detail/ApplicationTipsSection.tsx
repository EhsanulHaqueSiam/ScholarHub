import { Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getApplicationTip, SCHOLARSHIP_TYPE_META } from "@/lib/scholarship-types";
import type { ScholarshipType } from "../../../convex/schema";

interface ApplicationTipsSectionProps {
  scholarshipType?: ScholarshipType;
  applicationTips?: string;
}

export function ApplicationTipsSection({
  scholarshipType,
  applicationTips,
}: ApplicationTipsSectionProps) {
  const tip = getApplicationTip(scholarshipType, applicationTips);
  if (!tip) return null;

  const typeMeta =
    scholarshipType && scholarshipType !== "general"
      ? SCHOLARSHIP_TYPE_META[scholarshipType]
      : null;

  return (
    <section aria-labelledby="tips-heading">
      <Card>
        <CardHeader>
          <CardTitle id="tips-heading" className="text-xl flex items-center gap-2">
            <Lightbulb className="size-5" />
            Application Tips
            {typeMeta && (
              <span className="text-sm font-base text-foreground/60">
                for {typeMeta.label} scholarships
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {applicationTips ? (
            <>
              <p className="text-sm leading-relaxed">{applicationTips}</p>
              {/* Show static tip as supplementary when custom tips exist */}
              {typeMeta && (
                <div className="border-t-2 border-border pt-3">
                  <p className="text-xs text-foreground/60 mb-1 font-heading">
                    General tip for {typeMeta.label} scholarships:
                  </p>
                  <p className="text-sm text-foreground/70">{typeMeta.tip}</p>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm leading-relaxed">{tip}</p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
