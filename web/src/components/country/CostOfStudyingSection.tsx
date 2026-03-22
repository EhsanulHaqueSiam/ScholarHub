import { GraduationCap, Home } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CountryData, TuitionRange } from "@/lib/country-data";

interface CostOfStudyingSectionProps {
  data: CountryData;
  countryName: string;
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function TuitionRow({ label, range }: { label: string; range: TuitionRange }) {
  const min = formatCurrency(range.min, range.currency);
  const max = formatCurrency(range.max, range.currency);
  const display = range.min === range.max ? max : `${min} - ${max}`;

  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-border/50 last:border-b-0">
      <span className="text-sm font-heading">{label}</span>
      <div className="text-end">
        <span className="text-sm">{display}</span>
        {range.note && (
          <p className="text-xs text-foreground/60 mt-0.5 max-w-[240px]">{range.note}</p>
        )}
      </div>
    </div>
  );
}

export function CostOfStudyingSection({ data, countryName }: CostOfStudyingSectionProps) {
  const { tuitionRanges, livingCost } = data;
  const livingMin = formatCurrency(livingCost.monthlyMin, livingCost.currency);
  const livingMax = formatCurrency(livingCost.monthlyMax, livingCost.currency);

  return (
    <section aria-labelledby="cost-heading">
      <h2 id="cost-heading" className="text-xl font-heading mb-4 flex items-center gap-2">
        Cost of Studying in {countryName}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tuition ranges */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="size-5" />
              Tuition Fees (per year)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TuitionRow label="Undergraduate" range={tuitionRanges.undergraduate} />
            <TuitionRow label="Postgraduate" range={tuitionRanges.postgraduate} />
            {tuitionRanges.phd && <TuitionRow label="PhD" range={tuitionRanges.phd} />}
          </CardContent>
        </Card>

        {/* Living costs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Home className="size-5" />
              Living Costs (per month)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-base font-heading">
              {livingMin} - {livingMax}
            </p>
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
