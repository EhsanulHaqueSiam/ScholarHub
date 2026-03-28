import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompareCheckbox } from "@/components/comparison/CompareCheckbox";
import { getCountryFlag, getCountryName } from "@/lib/countries";
import { getDeadlineUrgency } from "@/lib/filters";
import type { PrestigeTier } from "@/lib/prestige";
import { getPrestigeLabel } from "@/lib/prestige";
import { formatFundingType, urgencyLabelMap, urgencyVariantMap } from "@/lib/shared";
import { cn } from "@/lib/utils";

interface RelatedScholarshipsProps {
  scholarshipId: Id<"scholarships">;
}

/**
 * Similar Scholarships section for the detail page.
 *
 * D-73: Compact cards with title, country, deadline badge, funding badge, prestige badge.
 * D-74: "Similar Scholarships" heading with text-xl font-heading.
 * D-75: Placed after Sources section.
 * D-79: Compare checkbox on related cards.
 * D-80: Hidden when no related scholarships exist.
 */
export function RelatedScholarships({ scholarshipId }: RelatedScholarshipsProps) {
  const related = useQuery(api.related.getRelatedScholarships, { scholarshipId });

  // Loading skeleton
  if (related === undefined) {
    return (
      <section aria-label="Similar Scholarships">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Similar Scholarships</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="border-2 border-border rounded-base p-4 space-y-3 motion-safe:animate-pulse"
                >
                  <div className="h-4 bg-secondary-background rounded w-3/4" />
                  <div className="h-3 bg-secondary-background rounded w-1/2" />
                  <div className="flex gap-2">
                    <div className="h-5 bg-secondary-background rounded w-16" />
                    <div className="h-5 bg-secondary-background rounded w-16" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  // D-80: Hide entirely when no related scholarships
  if (related.length === 0) return null;

  return (
    <section aria-label="Similar Scholarships">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Similar Scholarships</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Mobile: horizontal scroll. Desktop: grid */}
          <div
            className={cn(
              "flex gap-4 overflow-x-auto snap-x snap-mandatory lg:grid lg:grid-cols-3 lg:overflow-visible",
              "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
            )}
          >
            {related.map((scholarship) => {
              const slug = scholarship.slug ?? scholarship._id;
              const prestigeTier = (scholarship.prestige_tier ?? "unranked") as PrestigeTier;
              const urgency = getDeadlineUrgency(scholarship.application_deadline ?? undefined);

              return (
                <div
                  key={scholarship._id}
                  className="relative w-[260px] flex-shrink-0 snap-center lg:w-auto group"
                >
                  {/* Compare checkbox (D-79) */}
                  <CompareCheckbox
                    slug={slug}
                    title={scholarship.title}
                    variant="card"
                  />

                  <Link
                    to="/scholarships/$slug"
                    params={{ slug }}
                    className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring rounded-base"
                  >
                    <div
                      className={cn(
                        "border-2 border-border rounded-base p-4 bg-secondary-background",
                        "shadow-shadow transition-[transform,box-shadow] duration-150 ease-out-expo h-full",
                        "active:scale-[0.98] hover:translate-x-[var(--box-shadow-x)] hover:translate-y-[var(--box-shadow-y)] hover:shadow-none",
                      )}
                    >
                      {/* Title */}
                      <h3 className="text-sm font-heading line-clamp-2 mb-2">
                        {scholarship.title}
                      </h3>

                      {/* Country */}
                      <p className="text-xs text-foreground/70 mb-3">
                        {getCountryFlag(scholarship.host_country)}{" "}
                        {getCountryName(scholarship.host_country)}
                      </p>

                      {/* Badge row */}
                      <div className="flex flex-wrap gap-1.5">
                        {/* Deadline urgency */}
                        {scholarship.application_deadline && (
                          <Badge variant={urgencyVariantMap[urgency]} className="text-caption px-1.5 py-0">
                            {urgencyLabelMap[urgency]}
                          </Badge>
                        )}

                        {/* Funding type */}
                        <Badge variant="neutral" className="text-caption px-1.5 py-0">
                          {formatFundingType(scholarship.funding_type)}
                        </Badge>

                        {/* Prestige tier */}
                        {prestigeTier !== "unranked" && (
                          <Badge variant={prestigeTier} className="text-caption px-1.5 py-0">
                            {getPrestigeLabel(prestigeTier)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
