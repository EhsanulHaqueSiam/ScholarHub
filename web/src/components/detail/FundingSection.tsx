import { Check, Minus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFundingAmount, formatFundingType } from "@/lib/shared";

interface FundingSectionProps {
  fundingType: string;
  fundingTuition: boolean | undefined;
  fundingLiving: boolean | undefined;
  fundingTravel: boolean | undefined;
  fundingInsurance: boolean | undefined;
  awardAmountMin: number | undefined;
  awardAmountMax: number | undefined;
  awardCurrency: string | undefined;
}

const COVERAGE_ITEMS = [
  { key: "tuition", label: "Tuition" },
  { key: "living", label: "Living Allowance" },
  { key: "travel", label: "Travel" },
  { key: "insurance", label: "Insurance" },
] as const;

function CoverageIcon({ covered }: { covered: boolean | undefined }) {
  if (covered === true) {
    return <Check className="size-4 text-urgency-open" aria-label="Covered" />;
  }
  if (covered === false) {
    return (
      <X className="size-4 text-urgency-closed" aria-label="Not covered" />
    );
  }
  return (
    <Minus className="size-4 text-foreground/40" aria-label="Not specified" />
  );
}

export function FundingSection({
  fundingType,
  fundingTuition,
  fundingLiving,
  fundingTravel,
  fundingInsurance,
  awardAmountMin,
  awardAmountMax,
  awardCurrency,
}: FundingSectionProps) {
  const coverageValues: Record<string, boolean | undefined> = {
    tuition: fundingTuition,
    living: fundingLiving,
    travel: fundingTravel,
    insurance: fundingInsurance,
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
          <div className="space-y-2">
            {COVERAGE_ITEMS.map((item) => {
              const covered = coverageValues[item.key];
              return (
                <div key={item.key} className="flex items-center gap-2">
                  <CoverageIcon covered={covered} />
                  <span
                    className={`text-sm ${covered === undefined ? "text-foreground/50" : ""}`}
                  >
                    {item.label}
                    {covered === undefined ? " (Not specified)" : ""}
                  </span>
                </div>
              );
            })}
          </div>

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
