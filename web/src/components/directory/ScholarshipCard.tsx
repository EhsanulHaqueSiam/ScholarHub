import { Link } from "@tanstack/react-router";
import { Check, Copy } from "lucide-react";
import { memo, useCallback, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCountryFlag, getCountryName } from "@/lib/countries";
import { getDeadlineUrgency, isNew } from "@/lib/filters";
import type { PrestigeTier } from "@/lib/prestige";
import { getPrestigeLabel, getPrestigeTooltip } from "@/lib/prestige";
import {
  formatFundingAmount,
  formatFundingType,
  hasLimitedInfo,
  urgencyLabelMap,
  urgencyVariantMap,
} from "@/lib/shared";
import { cn } from "@/lib/utils";
import type { Doc } from "../../../convex/_generated/dataModel";

type Scholarship = Doc<"scholarships">;

export const ScholarshipCard = memo(function ScholarshipCard({
  scholarship,
  disableHover,
}: {
  scholarship: Scholarship;
  disableHover?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const prestigeTier = (scholarship.prestige_tier ?? "unranked") as PrestigeTier;
  const urgency = getDeadlineUrgency(scholarship.application_deadline);
  const isNewScholarship = isNew(scholarship._creationTime);
  const limitedInfo = hasLimitedInfo(scholarship);
  const slug = scholarship.slug ?? scholarship._id;

  const handleCopyLink = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const url = `${window.location.origin}/scholarships/${slug}`;
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    },
    [slug],
  );

  return (
    <Link
      to="/scholarships/$slug"
      params={{ slug }}
      className="block group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring rounded-base"
      aria-label={scholarship.title}
    >
      <Card
        prestige={prestigeTier}
        className={cn(
          "relative h-full",
          disableHover && "overflow-hidden",
          !disableHover &&
            "transition-transform motion-safe:hover:translate-x-boxShadowX motion-safe:hover:translate-y-boxShadowY hover:shadow-none",
        )}
      >
        {/* Host country flag badge - top right */}
        <div className="absolute top-3 end-3 z-10">
          <Badge variant="neutral" className="text-base">
            <span aria-label={getCountryName(scholarship.host_country)} role="img">
              {getCountryFlag(scholarship.host_country)}
            </span>
          </Badge>
        </div>

        {/* Header: Title + Provider */}
        <CardHeader className="pe-12">
          <CardTitle className="text-xl line-clamp-2">{scholarship.title}</CardTitle>
          <CardDescription className="truncate">
            {scholarship.provider_organization}
          </CardDescription>
        </CardHeader>

        {/* Badge row */}
        <CardContent className="flex flex-wrap gap-2">
          {prestigeTier !== "unranked" && (
            <Badge variant={prestigeTier} title={getPrestigeTooltip(prestigeTier)}>
              {getPrestigeLabel(prestigeTier)}
            </Badge>
          )}
          <Badge variant={urgencyVariantMap[urgency]}>{urgencyLabelMap[urgency]}</Badge>
          {isNewScholarship && <Badge variant="new">New</Badge>}
          {limitedInfo && <Badge variant="limitedInfo">Limited Info</Badge>}
        </CardContent>

        {/* Content: Description + Degrees + Funding */}
        <CardContent className="space-y-2 flex-1">
          {scholarship.description && (
            <p className="text-sm line-clamp-2">{scholarship.description}</p>
          )}
          {scholarship.degree_levels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {scholarship.degree_levels.map((level) => (
                <span
                  key={level}
                  className="inline-block rounded-base border border-border px-1.5 py-0.5 text-xs"
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <span className="font-heading text-xs">
              {formatFundingType(scholarship.funding_type)}
            </span>
            {formatFundingAmount(scholarship) && (
              <span className="text-xs">{formatFundingAmount(scholarship)}</span>
            )}
          </div>
        </CardContent>

        {/* Footer: Copy Link */}
        <CardFooter>
          <Button
            variant="neutral"
            size="sm"
            onClick={handleCopyLink}
            className="ms-auto text-xs"
            aria-label={copied ? "Link copied" : `Copy link to ${scholarship.title}`}
          >
            {copied ? (
              <>
                <Check className="size-3" />
                Link copied!
              </>
            ) : (
              <>
                <Copy className="size-3" />
                Copy Link
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
});
