import { Link } from "@tanstack/react-router";
import { Banknote, Check, Copy } from "lucide-react";
import { memo, useCallback, useState } from "react";
import { CompareCheckbox } from "@/components/comparison/CompareCheckbox";
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
import { getCountryFlag, getCountryName, parseHostCountries } from "@/lib/countries";
import { getDeadlineUrgency, isNew } from "@/lib/filters";
import type { PrestigeTier } from "@/lib/prestige";
import { getPrestigeLabel, getPrestigeTooltip } from "@/lib/prestige";
import {
  formatCoverageCompact,
  getCoveredItems,
  SCHOLARSHIP_TYPE_META,
} from "@/lib/scholarship-types";
import type { ScholarshipSummary } from "@/lib/scholarship-summary";
import { cn } from "@/lib/utils";
import type { ScholarshipType } from "../../../convex/schema";

const urgencyVariantMap = {
  critical: "urgencyCritical",
  warning: "urgencyWarning",
  open: "urgencyOpen",
  closed: "urgencyClosed",
} as const;

const urgencyLabelMap = {
  critical: "Closing Soon",
  warning: "< 30 Days",
  open: "Open",
  closed: "Closed",
} as const;

function hasLimitedInfo(scholarship: ScholarshipSummary): boolean {
  return !scholarship.description && !scholarship.fields_of_study?.length;
}

function formatFundingAmount(scholarship: ScholarshipSummary): string | null {
  if (!scholarship.award_amount_max) return null;
  const currency = scholarship.award_currency ?? "USD";
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
  if (
    scholarship.award_amount_min &&
    scholarship.award_amount_min !== scholarship.award_amount_max
  ) {
    return `${formatter.format(scholarship.award_amount_min)} - ${formatter.format(scholarship.award_amount_max)}`;
  }
  return formatter.format(scholarship.award_amount_max);
}

function formatFundingType(type: string): string {
  const labels: Record<string, string> = {
    fully_funded: "Fully Funded",
    partial: "Partial",
    tuition_waiver: "Tuition Waiver",
    stipend_only: "Stipend Only",
  };
  return labels[type] ?? type;
}

function formatDeadline(deadline: number | undefined): string | null {
  if (!deadline) return null;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(deadline));
}

export const ScholarshipListItem = memo(function ScholarshipListItem({
  scholarship,
}: {
  scholarship: ScholarshipSummary;
}) {
  const [copied, setCopied] = useState(false);
  const prestigeTier = (scholarship.prestige_tier ?? "unranked") as PrestigeTier;
  const urgency = getDeadlineUrgency(scholarship.application_deadline);
  const isNewScholarship = isNew(scholarship._creationTime);
  const limitedInfo = hasLimitedInfo(scholarship);
  const scholarshipType = scholarship.scholarship_type as ScholarshipType | undefined;
  const typeMeta =
    scholarshipType && scholarshipType !== "general"
      ? SCHOLARSHIP_TYPE_META[scholarshipType]
      : null;
  const coveredItems = getCoveredItems(scholarship);
  const coverageText = formatCoverageCompact(coveredItems);
  const countryCodes = parseHostCountries(scholarship.host_country);
  const slug = scholarship.slug ?? scholarship._id;
  const deadlineText = formatDeadline(scholarship.application_deadline);

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
          "relative overflow-hidden transition-[transform,box-shadow] duration-150 ease-out-expo",
          "active:scale-[0.98] motion-safe:hover:translate-x-boxShadowX motion-safe:hover:translate-y-boxShadowY hover:shadow-none",
        )}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          {/* Compare checkbox - inline left */}
          <div className="hidden md:flex items-start pt-6 ps-4">
            <CompareCheckbox slug={slug} title={scholarship.title} variant="listItem" />
          </div>

          {/* Left: Main content */}
          <div className="flex-1 min-w-0">
            <CardHeader>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="md:hidden">
                  <CompareCheckbox slug={slug} title={scholarship.title} variant="listItem" />
                </div>
                <CardTitle className="text-xl">{scholarship.title}</CardTitle>
                {countryCodes.slice(0, 5).map((code) => (
                  <Badge key={code} variant="neutral" className="text-base px-1.5">
                    <span aria-label={getCountryName(code)} role="img">
                      {getCountryFlag(code)}
                    </span>
                  </Badge>
                ))}
                {countryCodes.length > 5 && (
                  <Badge variant="neutral" className="text-xs px-1.5">
                    +{countryCodes.length - 5}
                  </Badge>
                )}
              </div>
              <CardDescription>{scholarship.provider_organization}</CardDescription>
            </CardHeader>

            {/* Badge row */}
            <CardContent className="flex flex-wrap gap-2">
              {prestigeTier !== "unranked" && (
                <Badge variant={prestigeTier} title={getPrestigeTooltip(prestigeTier)}>
                  {getPrestigeLabel(prestigeTier)}
                </Badge>
              )}
              <Badge variant={urgencyVariantMap[urgency]}>
                {urgencyLabelMap[urgency]}
                {deadlineText && ` - ${deadlineText}`}
              </Badge>
              {isNewScholarship && <Badge variant="new">New</Badge>}
              {limitedInfo && <Badge variant="limitedInfo">Limited Info</Badge>}
              {typeMeta && (
                <Badge variant={typeMeta.badgeVariant as any} className="text-xs">
                  {typeMeta.label}
                </Badge>
              )}
            </CardContent>

            {/* Description - expanded in list view */}
            <CardContent className="space-y-3">
              {scholarship.description && (
                <p className="text-sm line-clamp-4">{scholarship.description}</p>
              )}

              {/* Eligibility nationalities */}
              {scholarship.eligibility_nationalities &&
                scholarship.eligibility_nationalities.length > 0 && (
                  <p className="text-xs text-foreground/70">
                    <span className="font-heading">Eligibility:</span>{" "}
                    {scholarship.eligibility_nationalities.length > 5
                      ? `${scholarship.eligibility_nationalities.slice(0, 5).join(", ")} +${scholarship.eligibility_nationalities.length - 5} more`
                      : scholarship.eligibility_nationalities.join(", ")}
                  </p>
                )}

              {/* Degree levels + Fields of study */}
              <div className="flex flex-wrap gap-3 text-sm">
                {scholarship.degree_levels.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {scholarship.degree_levels.map((level) => (
                      <span
                        key={level}
                        className="inline-block rounded-base border-2 border-border px-1.5 py-0.5 text-xs"
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </span>
                    ))}
                  </div>
                )}
                {scholarship.fields_of_study && scholarship.fields_of_study.length > 0 && (
                  <span className="text-xs text-foreground/70">
                    {scholarship.fields_of_study.slice(0, 3).join(", ")}
                    {scholarship.fields_of_study.length > 3 &&
                      ` +${scholarship.fields_of_study.length - 3} more`}
                  </span>
                )}
              </div>
            </CardContent>
          </div>

          {/* Right: Funding info + Copy link */}
          <div className="flex flex-row md:flex-col items-center md:items-end gap-3 px-6 md:py-6 pb-0">
            <div className="text-end">
              <div className="font-heading text-sm">
                {formatFundingType(scholarship.funding_type)}
              </div>
              {coverageText && (
                <span className="text-xs text-foreground/70 block text-end">{coverageText}</span>
              )}
              {formatFundingAmount(scholarship) && (
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  <Banknote className="size-3.5 text-foreground/70 shrink-0" />
                  <span className="text-sm font-heading">{formatFundingAmount(scholarship)}</span>
                </div>
              )}
            </div>
            <Button
              variant="neutral"
              size="sm"
              onClick={handleCopyLink}
              className="text-xs"
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
          </div>
        </div>
      </Card>
    </Link>
  );
});
