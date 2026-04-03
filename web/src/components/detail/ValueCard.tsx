import { DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCountryData } from "@/lib/country-data";

interface ValueCardProps {
  fundingType: string;
  fundingTuition?: boolean;
  fundingLiving?: boolean;
  fundingTravel?: boolean;
  fundingInsurance?: boolean;
  fundingBooks?: boolean;
  fundingResearch?: boolean;
  awardAmountMin?: number;
  awardAmountMax?: number;
  awardCurrency?: string;
  hostCountryCode?: string;
  degreeLevel?: string;
}

interface ValueLine {
  label: string;
  value: string;
  estimated: boolean;
}

function estimateValue(props: ValueCardProps): {
  lines: ValueLine[];
  totalEstimate: string | null;
  coveragePercent: number | null;
  disclaimer: string | null;
} {
  const lines: ValueLine[] = [];
  const currency = props.awardCurrency ?? "USD";
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);

  // Award amount
  if (props.awardAmountMax) {
    const amountStr =
      props.awardAmountMin && props.awardAmountMin !== props.awardAmountMax
        ? `${fmt(props.awardAmountMin)} - ${fmt(props.awardAmountMax)}`
        : fmt(props.awardAmountMax);
    lines.push({ label: "Award Amount", value: amountStr, estimated: false });
  }

  // Coverage breakdown
  const covers: string[] = [];
  if (props.fundingTuition) covers.push("Tuition");
  if (props.fundingLiving) covers.push("Living expenses");
  if (props.fundingTravel) covers.push("Travel");
  if (props.fundingInsurance) covers.push("Insurance");
  if (props.fundingBooks) covers.push("Books/Materials");
  if (props.fundingResearch) covers.push("Research costs");

  if (covers.length > 0) {
    lines.push({
      label: "Covers",
      value: covers.join(", "),
      estimated: false,
    });
  }

  // Funding type
  const typeLabels: Record<string, string> = {
    fully_funded: "Fully Funded",
    partial: "Partial Funding",
    tuition_waiver: "Tuition Waiver",
    stipend_only: "Stipend Only",
  };
  lines.push({
    label: "Funding Type",
    value: typeLabels[props.fundingType] ?? props.fundingType,
    estimated: false,
  });

  // Estimate coverage percentage against country costs
  let coveragePercent: number | null = null;
  let disclaimer: string | null = null;

  if (props.hostCountryCode && props.awardAmountMax) {
    const countryData = getCountryData(props.hostCountryCode);
    if (countryData) {
      const isUG = props.degreeLevel === "bachelor";
      const tuition = isUG
        ? countryData.tuitionRanges.undergraduate
        : countryData.tuitionRanges.postgraduate;

      // Estimate annual cost (tuition avg + 12 months living avg)
      const avgTuition = (tuition.min + tuition.max) / 2;
      const avgLiving =
        ((countryData.livingCost.monthlyMin + countryData.livingCost.monthlyMax) / 2) * 12;

      // Only compare if same currency or both USD
      if (
        tuition.currency === currency ||
        (tuition.currency === "USD" && currency === "USD")
      ) {
        const totalCost = avgTuition + avgLiving;
        const awardAvg =
          props.awardAmountMin && props.awardAmountMin !== props.awardAmountMax
            ? (props.awardAmountMin + props.awardAmountMax) / 2
            : props.awardAmountMax;

        coveragePercent = Math.round((awardAvg / totalCost) * 100);
        if (coveragePercent > 100) coveragePercent = 100;

        lines.push({
          label: "Est. Coverage",
          value: `Covers approximately ${coveragePercent}% of total expenses`,
          estimated: true,
        });
      } else {
        disclaimer = `Award in ${currency}, costs in ${tuition.currency} — direct comparison not available`;
      }
    }
  }

  const hasAnyData = lines.length > 1; // more than just funding type
  const totalEstimate = props.awardAmountMax ? fmt(props.awardAmountMax) : null;

  return {
    lines,
    totalEstimate,
    coveragePercent,
    disclaimer: disclaimer ?? (hasAnyData ? null : "Estimated based on available data"),
  };
}

export function ValueCard(props: ValueCardProps) {
  const { lines, coveragePercent, disclaimer } = estimateValue(props);

  if (lines.length <= 1 && !props.awardAmountMax) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="size-5" />
            Value Estimate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-caption opacity-60">
            Estimated based on available data — detailed value breakdown not yet available for this scholarship.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="size-5" />
          Value Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {lines.map((line) => (
          <div
            key={line.label}
            className="flex items-start justify-between gap-4 py-2 border-b border-border/50 last:border-b-0"
          >
            <span className="font-heading text-caption opacity-70">
              {line.label}
            </span>
            <span className="text-caption text-right">
              {line.value}
              {line.estimated && " *"}
            </span>
          </div>
        ))}

        {coveragePercent !== null && (
          <div className="mt-2">
            <div className="h-3 bg-secondary-background border-2 border-border rounded-base overflow-hidden">
              <div
                className="h-full bg-main transition-all duration-300"
                style={{ width: `${coveragePercent}%` }}
              />
            </div>
          </div>
        )}

        {disclaimer && (
          <p className="text-caption opacity-50 mt-2 italic">{disclaimer}</p>
        )}
      </CardContent>
    </Card>
  );
}
