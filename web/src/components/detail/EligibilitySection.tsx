import { useState } from "react";
import { Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCountryFlag, getCountryName } from "@/lib/countries";
import { groupByRegion } from "@/lib/regions";

interface EligibilitySectionProps {
  nationalities: string[] | null | undefined;
  degreeLevels: string[];
  fieldsOfStudy: string[] | null | undefined;
}

export function EligibilitySection({
  nationalities,
  degreeLevels,
  fieldsOfStudy,
}: EligibilitySectionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section aria-labelledby="eligibility-heading">
      <Card>
        <CardHeader>
          <CardTitle id="eligibility-heading" className="text-xl">
            Eligibility
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Nationalities sub-section */}
          <div>
            <h3 className="font-heading text-sm mb-2">Eligible Nationalities</h3>
            {nationalities === undefined || nationalities === null ? (
              <p className="text-foreground/50 text-sm">
                Eligibility information not available. Check the official
                application page for details.
              </p>
            ) : nationalities.length === 0 ? (
              <div className="bg-urgency-open/10 border-2 border-urgency-open rounded-base p-4">
                <div className="flex items-center gap-2">
                  <Globe className="size-5 text-urgency-open" />
                  <h3 className="font-heading text-sm">
                    Open to All Nationalities
                  </h3>
                </div>
                <p className="text-sm mt-1">
                  Students from any country are eligible to apply.
                </p>
              </div>
            ) : (
              <div>
                {/* Collapsed view: first 10 */}
                {!expanded && (
                  <div className="flex flex-wrap gap-2">
                    {nationalities.slice(0, 10).map((code) => (
                      <span
                        key={code}
                        className="inline-flex items-center gap-1 text-sm"
                      >
                        {getCountryFlag(code)} {getCountryName(code)}
                      </span>
                    ))}
                  </div>
                )}

                {/* Expanded view: grouped by region */}
                {expanded && (
                  <div className="space-y-4">
                    {Object.entries(groupByRegion(nationalities)).map(
                      ([region, codes]) => (
                        <div key={region}>
                          <h4 className="font-heading text-sm mb-1">
                            {region}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {codes.map((code) => (
                              <span
                                key={code}
                                className="inline-flex items-center gap-1 text-sm"
                              >
                                {getCountryFlag(code)} {getCountryName(code)}
                              </span>
                            ))}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}

                {/* Expand/collapse toggle */}
                {nationalities.length > 10 && (
                  <button
                    type="button"
                    onClick={() => setExpanded(!expanded)}
                    className="text-sm text-main underline underline-offset-4 mt-2"
                    aria-expanded={expanded}
                  >
                    {expanded
                      ? "Show fewer"
                      : `+ ${nationalities.length - 10} more countries`}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Degree Levels sub-section */}
          <div>
            <h3 className="font-heading text-sm mb-2">Degree Levels</h3>
            {degreeLevels.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {degreeLevels.map((level) => (
                  <Badge key={level} variant="neutral">
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-foreground/50 text-sm">Not specified</p>
            )}
          </div>

          {/* Fields of Study sub-section */}
          <div>
            <h3 className="font-heading text-sm mb-2">Fields of Study</h3>
            {fieldsOfStudy && fieldsOfStudy.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {fieldsOfStudy.map((field) => (
                  <Badge key={field} variant="neutral">
                    {field}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-foreground/50 text-sm">
                All fields eligible or not specified
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
