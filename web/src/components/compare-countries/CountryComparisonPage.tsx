import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, X } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { BackToTop } from "@/components/layout/BackToTop";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useStaticData } from "@/hooks/useStaticData";
import {
  COUNTRY_DATA,
  type CountryData,
  getCountryData,
} from "@/lib/country-data";
import { getCountryFlag, getCountryName, parseHostCountries } from "@/lib/countries";

const AVAILABLE_COUNTRIES = Object.keys(COUNTRY_DATA);

function formatCurrencyRange(min: number, max: number, currency: string): string {
  const fmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
  return `${fmt.format(min)} - ${fmt.format(max)}`;
}

interface ComparisonRowProps {
  label: string;
  values: (string | null)[];
}

function ComparisonRow({ label, values }: ComparisonRowProps) {
  return (
    <tr className="border-b-2 border-border">
      <td className="font-heading text-caption py-3 pr-4 align-top whitespace-nowrap">
        {label}
      </td>
      {values.map((val, i) => (
        <td key={i} className="text-caption py-3 px-4 align-top">
          {val ?? <span className="opacity-40">N/A</span>}
        </td>
      ))}
    </tr>
  );
}

export function CountryComparisonPage() {
  const { data, isLoading } = useStaticData();
  const [selected, setSelected] = useState<string[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  const scholarshipCounts = useMemo(() => {
    if (!data?.summaries) return {};
    const counts: Record<string, number> = {};
    for (const s of data.summaries) {
      const codes = parseHostCountries(s.host_country);
      for (const code of codes) {
        counts[code] = (counts[code] ?? 0) + 1;
      }
    }
    return counts;
  }, [data?.summaries]);

  const countryDataList: (CountryData | null)[] = selected.map(getCountryData);

  function addCountry(code: string) {
    if (selected.length < 3 && !selected.includes(code)) {
      setSelected([...selected, code]);
      setShowPicker(false);
    }
  }

  function removeCountry(code: string) {
    setSelected(selected.filter((c) => c !== code));
  }

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="pt-24 pb-12 px-4 md:px-6 max-w-5xl mx-auto">
          <h1 className="font-heading text-heading mb-6">Compare Countries</h1>
          <div className="animate-pulse h-[400px] bg-secondary-background border-2 border-border" />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="pt-24 pb-12 px-4 md:px-6 max-w-5xl mx-auto">
        <h1 className="font-heading text-heading mb-2">Compare Countries</h1>
        <p className="text-body opacity-70 mb-6">
          Select 2-3 countries to compare study-abroad dimensions side by side.
        </p>

        {/* Country selector */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          {selected.map((code) => (
            <div
              key={code}
              className="flex items-center gap-2 bg-main text-main-foreground border-2 border-border rounded-base px-3 py-2 font-heading text-sm"
            >
              <span>{getCountryFlag(code)}</span>
              <span>{getCountryName(code)}</span>
              <button
                type="button"
                onClick={() => removeCountry(code)}
                aria-label={`Remove ${getCountryName(code)}`}
                className="ml-1 hover:opacity-70"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
          {selected.length < 3 && (
            <div className="relative">
              <Button
                variant="neutral"
                size="sm"
                onClick={() => setShowPicker(!showPicker)}
              >
                <Plus className="size-4 mr-1" /> Add Country
              </Button>
              {showPicker && (
                <div className="absolute top-full left-0 mt-2 z-20 bg-secondary-background border-2 border-border rounded-base shadow-shadow max-h-60 overflow-y-auto w-56">
                  {AVAILABLE_COUNTRIES.filter((c) => !selected.includes(c))
                    .sort((a, b) => getCountryName(a).localeCompare(getCountryName(b)))
                    .map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => addCountry(code)}
                        className="flex items-center gap-2 w-full text-left px-3 py-2.5 text-sm hover:bg-main/10 min-h-[44px]"
                      >
                        <span>{getCountryFlag(code)}</span>
                        <span>{getCountryName(code)}</span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Comparison table */}
        {selected.length >= 2 ? (
          <Card>
            <CardContent className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="text-left font-heading text-caption py-3 pr-4" />
                    {selected.map((code) => (
                      <th
                        key={code}
                        className="text-left font-heading text-sm py-3 px-4"
                      >
                        {getCountryFlag(code)} {getCountryName(code)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <ComparisonRow
                    label="Scholarships"
                    values={selected.map(
                      (c) => `${scholarshipCounts[c] ?? 0} scholarships`,
                    )}
                  />
                  <ComparisonRow
                    label="UG Tuition/yr"
                    values={countryDataList.map((d) =>
                      d
                        ? formatCurrencyRange(
                            d.tuitionRanges.undergraduate.min,
                            d.tuitionRanges.undergraduate.max,
                            d.tuitionRanges.undergraduate.currency,
                          )
                        : null,
                    )}
                  />
                  <ComparisonRow
                    label="PG Tuition/yr"
                    values={countryDataList.map((d) =>
                      d
                        ? formatCurrencyRange(
                            d.tuitionRanges.postgraduate.min,
                            d.tuitionRanges.postgraduate.max,
                            d.tuitionRanges.postgraduate.currency,
                          )
                        : null,
                    )}
                  />
                  <ComparisonRow
                    label="Living Cost/mo"
                    values={countryDataList.map((d) =>
                      d
                        ? formatCurrencyRange(
                            d.livingCost.monthlyMin,
                            d.livingCost.monthlyMax,
                            d.livingCost.currency,
                          )
                        : null,
                    )}
                  />
                  <ComparisonRow
                    label="Post-Study Work"
                    values={countryDataList.map((d) =>
                      d
                        ? `${d.postStudyWork.visaName} (${d.postStudyWork.duration})`
                        : null,
                    )}
                  />
                  <ComparisonRow
                    label="Work Rights Details"
                    values={countryDataList.map((d) =>
                      d ? d.postStudyWork.description : null,
                    )}
                  />
                  <ComparisonRow
                    label="Visa Requirements"
                    values={countryDataList.map((d) =>
                      d ? d.visaDocuments.slice(0, 3).join("; ") : null,
                    )}
                  />
                  <ComparisonRow
                    label="Language Tests"
                    values={countryDataList.map((d) =>
                      d
                        ? d.languageRequirements
                            .map((r) => `${r.test}: ${r.minScore}`)
                            .join(", ")
                        : null,
                    )}
                  />
                  <ComparisonRow
                    label="Main Intake"
                    values={countryDataList.map((d) => {
                      if (!d) return null;
                      const main = d.intakes.find((i) => i.isMain);
                      return main
                        ? `${main.name} (${main.months})`
                        : d.intakes[0]
                          ? `${d.intakes[0].name} (${d.intakes[0].months})`
                          : null;
                    })}
                  />
                </tbody>
              </table>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-body opacity-60">
                Select at least 2 countries above to see the comparison.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Quick links */}
        {selected.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {selected.map((code) => (
              <Button key={code} variant="neutral" size="sm" asChild>
                <Link
                  to="/scholarships/country/$country"
                  params={{ country: code.toLowerCase() }}
                >
                  {getCountryFlag(code)} View {getCountryName(code)} Scholarships
                </Link>
              </Button>
            ))}
          </div>
        )}
      </div>
      <BackToTop />
    </>
  );
}
