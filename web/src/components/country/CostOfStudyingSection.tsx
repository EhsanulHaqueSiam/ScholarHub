import { CheckCircle, GraduationCap, Home } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CountryData, TuitionRange } from "@/lib/country-data";

export interface ScholarshipCoverage {
  fundingType: string;
  fundingTuition?: boolean;
  fundingLiving?: boolean;
  fundingTravel?: boolean;
  fundingInsurance?: boolean;
  awardAmountMin?: number;
  awardAmountMax?: number;
  awardCurrency?: string;
}

interface CostOfStudyingSectionProps {
  data: CountryData;
  countryName: string;
  coverage?: ScholarshipCoverage;
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function TuitionRow({
  label,
  range,
  covered,
}: {
  label: string;
  range: TuitionRange;
  covered?: boolean;
}) {
  // Per-scholarship override: note-only display when min/max are 0
  const isOverride = range.note && range.min === 0 && range.max === 0;
  const display = isOverride
    ? range.note
    : range.min === range.max
      ? formatCurrency(range.max, range.currency)
      : `${formatCurrency(range.min, range.currency)} – ${formatCurrency(range.max, range.currency)}`;

  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-border/50 last:border-b-0">
      <span className="text-sm font-heading">{label}</span>
      <div className="text-end flex items-center gap-2">
        <span className={`text-sm ${covered ? "line-through text-foreground/40" : ""}`}>
          {display}
        </span>
        {covered && (
          <Badge variant="default" className="text-[10px] px-1.5 py-0">
            <CheckCircle className="size-3 mr-0.5" />
            Covered
          </Badge>
        )}
        {!isOverride && range.note && (
          <p className="text-xs text-foreground/60 mt-0.5 max-w-[240px]">{range.note}</p>
        )}
      </div>
    </div>
  );
}

export function CostOfStudyingSection({ data, countryName, coverage }: CostOfStudyingSectionProps) {
  const { tuitionRanges, livingCost } = data;
  const livingMin = formatCurrency(livingCost.monthlyMin, livingCost.currency);
  const livingMax = formatCurrency(livingCost.monthlyMax, livingCost.currency);
  const tuitionCovered = coverage?.fundingTuition === true;
  const livingCovered = coverage?.fundingLiving === true;

  return (
    <section aria-labelledby="cost-heading">
      <h3 className="text-lg font-heading mb-3 flex items-center gap-2">
        Cost of Studying in {countryName}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tuition ranges */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="size-5" />
              Tuition Fees (per year)
              {tuitionCovered && (
                <Badge variant="default" className="text-[10px] px-1.5 py-0 ml-auto">
                  Scholarship covers tuition
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TuitionRow
              label="Undergraduate"
              range={tuitionRanges.undergraduate}
              covered={tuitionCovered}
            />
            <TuitionRow
              label="Postgraduate"
              range={tuitionRanges.postgraduate}
              covered={tuitionCovered}
            />
            {tuitionRanges.phd && (
              <TuitionRow label="PhD" range={tuitionRanges.phd} covered={tuitionCovered} />
            )}
          </CardContent>
        </Card>

        {/* Living costs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Home className="size-5" />
              Living Costs (per month)
              {livingCovered && (
                <Badge variant="default" className="text-[10px] px-1.5 py-0 ml-auto">
                  Stipend included
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {livingCost.monthlyMin > 0 && livingCost.monthlyMax > 0 && (
              <p
                className={`text-base font-heading ${livingCovered ? "line-through text-foreground/40" : ""}`}
              >
                {livingMin} – {livingMax}
              </p>
            )}
            {livingCost.breakdown && livingCost.breakdown.length > 0 && (
              <div className="space-y-1.5">
                {livingCost.breakdown.map((item) => (
                  <div
                    key={item.item}
                    className="flex items-center justify-between text-sm py-1 border-b border-border/50 last:border-b-0"
                  >
                    <span className="text-foreground/70">{item.item}</span>
                    <span>{item.range}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
