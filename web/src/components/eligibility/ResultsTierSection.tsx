import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { MatchIndicators } from "@/components/eligibility/MatchIndicators";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCountryFlag, getCountryName, parseHostCountries } from "@/lib/countries";
import { getDeadlineUrgency } from "@/lib/filters";
import { getPrestigeLabel, getPrestigeTooltip } from "@/lib/prestige";
import type { PrestigeTier } from "@/lib/prestige";
import type { EligibilitySummary, MatchTier, ScoredScholarship } from "@/lib/eligibility/types";
import type { ScholarshipSummary } from "@/lib/scholarship-summary";
import {
  formatFundingType,
  formatFundingAmount,
  hasLimitedInfo,
  urgencyLabelMap,
  urgencyVariantMap,
} from "@/lib/shared";
import { analytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Tier display config
// ---------------------------------------------------------------------------

const TIER_CONFIG: Record<
  MatchTier,
  {
    label: string;
    bgClass: string;
    borderClass: string;
    badgeVariant: string;
  }
> = {
  strong: {
    label: "Strong Matches",
    bgClass: "bg-match-strong-bg",
    borderClass: "border-match-strong-border",
    badgeVariant: "matchStrong",
  },
  good: {
    label: "Good Matches",
    bgClass: "bg-match-good-bg",
    borderClass: "border-match-good-border",
    badgeVariant: "matchGood",
  },
  partial: {
    label: "Partial Matches",
    bgClass: "bg-match-partial-bg",
    borderClass: "border-match-partial-border",
    badgeVariant: "matchPartial",
  },
  possible: {
    label: "Possible Matches",
    bgClass: "bg-match-possible-bg",
    borderClass: "border-match-possible-border",
    badgeVariant: "matchPossible",
  },
};

// ---------------------------------------------------------------------------
// Map EligibilitySummary -> ScholarshipSummary for ScholarshipCard compat
// ---------------------------------------------------------------------------

function toScholarshipSummary(s: EligibilitySummary): ScholarshipSummary {
  return {
    _id: s._id,
    _creationTime: Date.now(),
    title: s.title,
    slug: s.slug,
    provider_organization: s.source_name ?? "",
    host_country: s.host_countries?.join(",") ?? "",
    degree_levels: s.degree_levels ?? [],
    funding_type: s.funding_type ?? "unknown",
    application_deadline: s.application_deadline ?? undefined,
    prestige_tier: s.prestige_tier ?? "unranked",
    scholarship_type: s.scholarship_type ?? undefined,
    eligibility_nationalities: s.eligibility_nationalities ?? undefined,
    fields_of_study: s.fields_of_study ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// ResultsTierSection
// ---------------------------------------------------------------------------

interface ResultsTierSectionProps {
  tier: MatchTier;
  scholarships: ScoredScholarship[];
  defaultOpen?: boolean;
}

export function ResultsTierSection({
  tier,
  scholarships,
  defaultOpen = true,
}: ResultsTierSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const config = TIER_CONFIG[tier];
  const sectionId = `tier-${tier}-body`;

  return (
    <section aria-label={`${config.label} section`}>
      {/* Collapsible header -- sticky on mobile per D-37 */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-controls={sectionId}
        className={cn(
          "w-full flex items-center justify-between rounded-base border-2 px-4 py-3 transition-colors cursor-pointer",
          "sticky top-16 z-40",
          config.bgClass,
          config.borderClass,
        )}
      >
        <span className="font-heading text-xl">
          {config.label} ({scholarships.length})
        </span>
        <ChevronDown
          className={cn(
            "size-5 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {/* Possible matches explanatory note */}
      {tier === "possible" && isOpen && (
        <p className="text-foreground/50 text-[13px] mt-2 px-1">
          Eligibility not confirmed -- these scholarships may match but we
          couldn't verify all criteria.
        </p>
      )}

      {/* Card grid */}
      {isOpen && (
        <div
          id={sectionId}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4"
        >
          {scholarships.map((scored) => (
            <ResultScholarshipCard
              key={scored.scholarship._id}
              scored={scored}
              tier={tier}
              badgeVariant={config.badgeVariant}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Individual scholarship card with match indicators
// ---------------------------------------------------------------------------

function ResultScholarshipCard({
  scored,
  tier,
  badgeVariant,
}: {
  scored: ScoredScholarship;
  tier: MatchTier;
  badgeVariant: string;
}) {
  const scholarship = toScholarshipSummary(scored.scholarship);
  const prestigeTier = (scholarship.prestige_tier ?? "unranked") as PrestigeTier;
  const urgency = getDeadlineUrgency(scholarship.application_deadline);
  const slug = scholarship.slug ?? scholarship._id;
  const codes = parseHostCountries(scholarship.host_country);
  const maxShow = 3;
  const visible = codes.slice(0, maxShow);
  const remaining = codes.length - maxShow;

  const handleClick = () => {
    analytics.track("scholarship_clicked_from_results", {
      scholarshipId: scholarship._id,
      tier,
    });
  };

  return (
    <Link
      to="/scholarships/$slug"
      params={{ slug }}
      className="block group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring rounded-base"
      aria-label={scholarship.title}
      onClick={handleClick}
    >
      <Card
        prestige={prestigeTier}
        className="relative h-full transition-transform motion-safe:hover:translate-x-boxShadowX motion-safe:hover:translate-y-boxShadowY hover:shadow-none motion-safe:hover:rotate-[-0.5deg]"
      >
        {/* Host country flags -- top right */}
        <div className="absolute top-3 end-3 z-10">
          <div className="flex items-center gap-1">
            {visible.map((code) => (
              <Badge key={code} variant="neutral" className="text-base px-1.5">
                <span aria-label={getCountryName(code)} role="img">
                  {getCountryFlag(code)}
                </span>
              </Badge>
            ))}
            {remaining > 0 && (
              <Badge variant="neutral" className="text-xs px-1.5">
                +{remaining}
              </Badge>
            )}
          </div>
        </div>

        {/* Header */}
        <CardHeader className="pe-20">
          <CardTitle className="text-xl line-clamp-2">
            {scholarship.title}
          </CardTitle>
          <CardDescription className="truncate">
            {scholarship.provider_organization}
          </CardDescription>
        </CardHeader>

        {/* Badge row */}
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant={badgeVariant as any}>
            {TIER_CONFIG[tier].label.replace(" Matches", "")}
          </Badge>
          {prestigeTier !== "unranked" && (
            <Badge
              variant={prestigeTier}
              title={getPrestigeTooltip(prestigeTier)}
            >
              {getPrestigeLabel(prestigeTier)}
            </Badge>
          )}
          <Badge variant={urgencyVariantMap[urgency]}>
            {urgencyLabelMap[urgency]}
          </Badge>
        </CardContent>

        {/* Content */}
        <CardContent className="space-y-2 flex-1">
          {scholarship.degree_levels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {scholarship.degree_levels.map((level) => (
                <span
                  key={level}
                  className="inline-block rounded-base border-2 border-border bg-secondary-background font-heading px-1.5 py-0.5 text-xs"
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </span>
              ))}
            </div>
          )}
          <div className="text-sm">
            <span className="font-heading text-xs">
              {formatFundingType(scholarship.funding_type)}
            </span>
            {formatFundingAmount(scholarship) && (
              <span className="text-sm font-heading ms-2">
                {formatFundingAmount(scholarship)}
              </span>
            )}
          </div>
        </CardContent>

        {/* Match indicators */}
        <CardContent>
          <MatchIndicators breakdown={scored.breakdown} />
        </CardContent>
      </Card>
    </Link>
  );
}
