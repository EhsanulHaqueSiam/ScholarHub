import { Check, Lightbulb, Minus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCoverageTip } from "@/lib/scholarship-types";
import { formatFundingAmount, formatFundingType } from "@/lib/shared";
import type { ScholarshipType } from "../../../convex/schema";

interface FundingSectionProps {
  fundingType: string;
  fundingTuition: boolean | undefined;
  fundingLiving: boolean | undefined;
  fundingTravel: boolean | undefined;
  fundingInsurance: boolean | undefined;
  fundingBooks: boolean | undefined;
  fundingResearch: boolean | undefined;
  awardAmountMin: number | undefined;
  awardAmountMax: number | undefined;
  awardCurrency: string | undefined;
  scholarshipType?: ScholarshipType;
}

const COVERAGE_ITEMS = [
  { key: "tuition", label: "Tuition" },
  { key: "living", label: "Living Allowance" },
  { key: "travel", label: "Travel" },
  { key: "insurance", label: "Insurance" },
  { key: "books", label: "Books & Materials" },
  { key: "research", label: "Research Expenses" },
] as const;

function CoverageIcon({ covered }: { covered: boolean | undefined }) {
  if (covered === true) {
    return <Check className="size-4 text-urgency-open" aria-label="Covered" />;
  }
  if (covered === false) {
    return <X className="size-4 text-urgency-closed" aria-label="Not covered" />;
  }
  return <Minus className="size-4 text-foreground/40" aria-label="Not specified" />;
}

export function FundingSection({
  fundingType,
  fundingTuition,
  fundingLiving,
  fundingTravel,
  fundingInsurance,
  fundingBooks,
  fundingResearch,
  awardAmountMin,
  awardAmountMax,
  awardCurrency,
  scholarshipType,
}: FundingSectionProps) {
  const coverageValues: Record<string, boolean | undefined> = {
    tuition: fundingTuition,
    living: fundingLiving,
    travel: fundingTravel,
    insurance: fundingInsurance,
    books: fundingBooks,
    research: fundingResearch,
  };

  const amount = formatFundingAmount({
    award_amount_min: awardAmountMin,
    award_amount_max: awardAmountMax,
    award_currency: awardCurrency,
  });

  return (
    <section aria-labelledby="funding-heading">
      <Card>
        <CardHeader>
          <CardTitle id="funding-heading" className="text-xl">
            Funding
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Funding type badge */}
          <Badge variant="neutral">{formatFundingType(fundingType)}</Badge>

          {/* Coverage checklist */}
          <div className="grid grid-cols-2 gap-2">
            {COVERAGE_ITEMS.map((item) => {
              const covered = coverageValues[item.key];
              return (
                <div key={item.key} className="flex items-center gap-2">
                  <CoverageIcon covered={covered} />
                  <span className={`text-sm ${covered === undefined ? "text-foreground/50" : ""}`}>
                    {item.label}
                    {covered === undefined ? " (Not specified)" : ""}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Contextual coverage tip */}
          {(() => {
            const tip = getCoverageTip(scholarshipType);
            if (!tip) return null;
            return (
              <div className="flex items-start gap-2 rounded-base border border-border bg-secondary-background p-3">
                <Lightbulb className="size-4 text-type-merit-badge shrink-0 mt-0.5" />
                <p className="text-sm text-foreground/80">{tip}</p>
              </div>
            );
          })()}

          {/* Award amount */}
          {amount ? (
            <p className="text-base font-heading">{amount}</p>
          ) : (
            <p className="text-sm text-foreground/50">Varies by program</p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
