import { forwardRef } from "react";
import { CollectionBadges } from "@/components/detail/CollectionBadges";
import { TagBadges } from "@/components/detail/TagBadges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCountryFlag, getCountryName } from "@/lib/countries";
import { useCountdown } from "@/lib/deadline";
import { getDeadlineUrgency } from "@/lib/filters";
import type { PrestigeTier } from "@/lib/prestige";
import { getPrestigeLabel, getPrestigeTooltip } from "@/lib/prestige";
import { formatFundingType, urgencyLabelMap, urgencyVariantMap } from "@/lib/shared";

interface HeroSectionProps {
  title: string;
  providerOrganization: string;
  prestigeTier: PrestigeTier;
  hostCountry: string;
  applicationDeadline?: number;
  degreeLevels: string[];
  fundingType: string;
  applicationUrl?: string;
  tags?: string[];
  collections?: Array<{ name: string; slug: string; emoji: string }>;
}

export const HeroSection = forwardRef<HTMLDivElement, HeroSectionProps>(function HeroSection(
  {
    title,
    providerOrganization,
    prestigeTier,
    hostCountry,
    applicationDeadline,
    degreeLevels,
    fundingType,
    applicationUrl,
    tags,
    collections,
  },
  ref,
) {
  const daysLeft = useCountdown(applicationDeadline);
  const urgency = getDeadlineUrgency(applicationDeadline);
  const isExpired = urgency === "closed";

  return (
    <div ref={ref}>
      <Card prestige={prestigeTier}>
        <CardContent className="p-6 md:p-8 space-y-4">
          {/* Badge row */}
          <div className="flex items-center gap-2 flex-wrap">
            {prestigeTier !== "unranked" && (
              <Badge variant={prestigeTier} title={getPrestigeTooltip(prestigeTier)}>
                {getPrestigeLabel(prestigeTier)}
              </Badge>
            )}
            <Badge variant="neutral" className="text-base">
              <span aria-label={getCountryName(hostCountry)} role="img">
                {getCountryFlag(hostCountry)}
              </span>{" "}
              {getCountryName(hostCountry)}
            </Badge>
            <Badge variant="neutral">{formatFundingType(fundingType)}</Badge>
          </div>

          {/* Title */}
          <h1 className="font-heading text-2xl md:text-[32px] leading-[1.2]">{title}</h1>

          {/* Provider */}
          <p className="text-sm text-foreground/70 font-base">{providerOrganization}</p>

          {/* Degree levels */}
          {degreeLevels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {degreeLevels.map((level) => (
                <span
                  key={level}
                  className="inline-block rounded-base border border-border px-1.5 py-0.5 text-xs"
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </span>
              ))}
            </div>
          )}

          {/* Tags (D-22: detail page only, below badge row) */}
          {tags && tags.length > 0 && <TagBadges tags={tags} />}

          {/* Collection membership (D-50: show which collections this scholarship belongs to) */}
          {collections && collections.length > 0 && <CollectionBadges collections={collections} />}

          {/* Deadline line */}
          {applicationDeadline && (
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={urgencyVariantMap[urgency]}>{urgencyLabelMap[urgency]}</Badge>
              <span className="text-sm">
                {new Intl.DateTimeFormat("en-US", {
                  dateStyle: "long",
                }).format(new Date(applicationDeadline))}
              </span>
              {daysLeft !== null && (
                <span className="text-sm text-foreground/70">
                  {isExpired
                    ? "Applications Closed"
                    : daysLeft === 0
                      ? "(Due today)"
                      : daysLeft === 1
                        ? "(1 day left)"
                        : `(${daysLeft} days left)`}
                </span>
              )}
            </div>
          )}

          {/* Apply Now button */}
          {applicationUrl && !isExpired ? (
            <Button variant="default" size="lg" className="w-full md:w-auto" asChild>
              <a
                href={applicationUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Apply to ${title} (opens in new tab)`}
              >
                Apply Now
              </a>
            </Button>
          ) : isExpired ? (
            <Button variant="default" size="lg" className="w-full md:w-auto" disabled>
              Applications Closed
            </Button>
          ) : (
            <Button variant="default" size="lg" className="w-full md:w-auto" disabled>
              Application Link Unavailable
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
});
