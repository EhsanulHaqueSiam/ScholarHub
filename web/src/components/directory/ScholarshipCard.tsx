import { Link } from "@tanstack/react-router";
import { Copy, Check } from "lucide-react";
import { useState, useCallback } from "react";
import type { Doc } from "../../../convex/_generated/dataModel";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDeadlineUrgency, isNew } from "@/lib/filters";
import { getPrestigeLabel, getPrestigeTooltip } from "@/lib/prestige";
import { getCountryFlag, getCountryName } from "@/lib/countries";
import { cn } from "@/lib/utils";
import type { PrestigeTier } from "@/lib/prestige";

type Scholarship = Doc<"scholarships">;

/** Map urgency level to badge variant */
const urgencyVariantMap = {
  critical: "urgencyCritical",
  warning: "urgencyWarning",
  open: "urgencyOpen",
  closed: "urgencyClosed",
} as const;

/** Map urgency level to display label */
const urgencyLabelMap = {
  critical: "Closing Soon",
  warning: "< 30 Days",
  open: "Open",
  closed: "Closed",
} as const;

/** Check if scholarship has limited info (title + URL only, no description) */
function hasLimitedInfo(scholarship: Scholarship): boolean {
  return !scholarship.description && !scholarship.fields_of_study?.length;
}

/** Format funding amount for display */
function formatFundingAmount(scholarship: Scholarship): string | null {
  if (!scholarship.award_amount_max) return null;
  const currency = scholarship.award_currency ?? "USD";
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
  if (scholarship.award_amount_min && scholarship.award_amount_min !== scholarship.award_amount_max) {
    return `${formatter.format(scholarship.award_amount_min)} - ${formatter.format(scholarship.award_amount_max)}`;
  }
  return formatter.format(scholarship.award_amount_max);
}

/** Format funding type for display */
function formatFundingType(type: string): string {
  const labels: Record<string, string> = {
    fully_funded: "Fully Funded",
    partial: "Partial",
    tuition_waiver: "Tuition Waiver",
    stipend_only: "Stipend Only",
  };
  return labels[type] ?? type;
}

export function ScholarshipCard({ scholarship }: { scholarship: Scholarship }) {
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
          "relative h-[320px] md:h-[320px] sm:h-auto overflow-hidden transition-transform",
          "motion-safe:hover:translate-x-boxShadowX motion-safe:hover:translate-y-boxShadowY hover:shadow-none",
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
        <CardContent className="space-y-2">
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
            <span className="font-heading text-xs">{formatFundingType(scholarship.funding_type)}</span>
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
            aria-label={copied ? "Link copied" : "Copy scholarship link"}
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
}
