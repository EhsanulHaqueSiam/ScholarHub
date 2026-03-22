import { Link } from "@tanstack/react-router";
import { ExternalLink, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCompare } from "@/components/comparison/CompareContext";
import { SearchToAdd } from "@/components/comparison/SearchToAdd";
import { getCountryFlag, getCountryName } from "@/lib/countries";
import { getDeadlineUrgency } from "@/lib/filters";
import type { PrestigeTier } from "@/lib/prestige";
import { getPrestigeLabel } from "@/lib/prestige";
import { formatFundingAmount, formatFundingType, urgencyLabelMap, urgencyVariantMap } from "@/lib/shared";
import { cn } from "@/lib/utils";
import type { Doc } from "../../../convex/_generated/dataModel";

type Scholarship = Doc<"scholarships"> & {
  resolved_sources?: Array<{ name: string; url: string }>;
};

interface ComparisonTableProps {
  scholarships: Scholarship[];
}

/** Field definition for a row in the comparison table */
interface ComparisonField {
  key: string;
  label: string;
}

const COMPARISON_FIELDS: ComparisonField[] = [
  { key: "provider_organization", label: "Provider" },
  { key: "host_country", label: "Host Country" },
  { key: "degree_levels", label: "Degree Levels" },
  { key: "funding_type", label: "Funding Type" },
  { key: "award_amount", label: "Award Amount" },
  { key: "application_deadline", label: "Application Deadline" },
  { key: "eligibility_nationalities", label: "Eligible Nationalities" },
  { key: "fields_of_study", label: "Fields of Study" },
  { key: "prestige_tier", label: "Prestige Tier" },
  { key: "tags", label: "Tags" },
];

/**
 * Check if a field value differs across scholarships.
 * For arrays, uses sorted JSON.stringify comparison.
 * For simple values, uses strict equality.
 */
export function isDifferent(
  fieldKey: string,
  scholarship: Scholarship,
  allScholarships: Scholarship[],
): boolean {
  if (allScholarships.length < 2) return false;

  const getValue = (s: Scholarship): unknown => {
    switch (fieldKey) {
      case "award_amount":
        return formatFundingAmount(s);
      case "application_deadline":
        return s.application_deadline;
      default:
        return (s as Record<string, unknown>)[fieldKey];
    }
  };

  const thisValue = getValue(scholarship);
  const normalize = (v: unknown): string => {
    if (Array.isArray(v)) return JSON.stringify([...v].sort());
    if (v === null || v === undefined) return "";
    return String(v);
  };

  const thisNormalized = normalize(thisValue);
  return allScholarships.some((other) => {
    if (other._id === scholarship._id) return false;
    return normalize(getValue(other)) !== thisNormalized;
  });
}

/**
 * Render the appropriate content for a field in the comparison table.
 */
export function renderField(field: ComparisonField, scholarship: Scholarship): React.ReactNode {
  switch (field.key) {
    case "provider_organization":
      return <span className="text-sm">{scholarship.provider_organization}</span>;

    case "host_country": {
      const code = scholarship.host_country;
      if (!code) return <span className="text-sm text-foreground/50">--</span>;
      return (
        <span className="text-sm">
          {getCountryFlag(code)} {getCountryName(code)}
        </span>
      );
    }

    case "degree_levels": {
      const levels = scholarship.degree_levels;
      if (!levels || levels.length === 0) return <span className="text-sm text-foreground/50">--</span>;
      return (
        <span className="text-sm">
          {levels.map((l) => l.charAt(0).toUpperCase() + l.slice(1)).join(", ")}
        </span>
      );
    }

    case "funding_type":
      return <span className="text-sm">{formatFundingType(scholarship.funding_type)}</span>;

    case "award_amount": {
      const amount = formatFundingAmount(scholarship);
      if (!amount) return <span className="text-sm text-foreground/50">--</span>;
      return <span className="text-sm font-heading">{amount}</span>;
    }

    case "application_deadline": {
      if (!scholarship.application_deadline) return <span className="text-sm text-foreground/50">--</span>;
      const urgency = getDeadlineUrgency(scholarship.application_deadline);
      const date = new Date(scholarship.application_deadline);
      return (
        <div className="flex flex-col gap-1">
          <span className="text-sm">
            {date.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
          <Badge variant={urgencyVariantMap[urgency]} className="w-fit">
            {urgencyLabelMap[urgency]}
          </Badge>
        </div>
      );
    }

    case "eligibility_nationalities": {
      const nationalities = scholarship.eligibility_nationalities;
      if (!nationalities || nationalities.length === 0)
        return <span className="text-sm text-foreground/50">--</span>;
      const top3 = nationalities.slice(0, 3).map((c) => getCountryName(c));
      const remaining = nationalities.length - 3;
      return (
        <span className="text-sm">
          {nationalities.length} {nationalities.length === 1 ? "country" : "countries"}
          {top3.length > 0 && ` (${top3.join(", ")}${remaining > 0 ? "..." : ""})`}
        </span>
      );
    }

    case "fields_of_study": {
      const fields = scholarship.fields_of_study;
      if (!fields || fields.length === 0)
        return <span className="text-sm text-foreground/50">--</span>;
      const first3 = fields.slice(0, 3);
      const remaining = fields.length - 3;
      return (
        <span className="text-sm">
          {first3.join(", ")}
          {remaining > 0 && ` +${remaining} more`}
        </span>
      );
    }

    case "prestige_tier": {
      const tier = (scholarship.prestige_tier ?? "unranked") as PrestigeTier;
      if (tier === "unranked") return <span className="text-sm text-foreground/50">Unranked</span>;
      return <Badge variant={tier}>{getPrestigeLabel(tier)}</Badge>;
    }

    case "tags": {
      const tags = scholarship.tags;
      if (!tags || tags.length === 0)
        return <span className="text-sm text-foreground/50">--</span>;
      const first3 = tags.slice(0, 3);
      const remaining = tags.length - 3;
      return (
        <div className="flex flex-wrap gap-1">
          {first3.map((tag) => (
            <Badge key={tag} variant="neutral" className="text-xs">
              {tag}
            </Badge>
          ))}
          {remaining > 0 && (
            <span className="text-xs text-foreground/60">+{remaining}</span>
          )}
        </div>
      );
    }

    default:
      return <span className="text-sm text-foreground/50">--</span>;
  }
}

export function ComparisonTable({ scholarships }: ComparisonTableProps) {
  const { removeFromCompare } = useCompare();

  return (
    <div className="overflow-x-auto border-2 border-border rounded-base">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-border">
            <th
              scope="col"
              className="sticky left-0 z-10 bg-secondary-background p-4 lg:p-6 text-left text-sm font-heading min-w-[140px] border-r-2 border-border"
            >
              Field
            </th>
            {scholarships.map((s) => {
              const slug = s.slug ?? s._id;
              const tier = (s.prestige_tier ?? "unranked") as PrestigeTier;
              return (
                <th
                  key={s._id}
                  scope="col"
                  className="p-4 lg:p-6 text-left min-w-[200px] border-r border-border last:border-r-0"
                >
                  <div className="flex flex-col gap-2">
                    <Link
                      to="/scholarships/$slug"
                      params={{ slug }}
                      className="text-sm font-heading hover:underline line-clamp-2"
                    >
                      {s.title}
                    </Link>
                    {tier !== "unranked" && (
                      <Badge variant={tier} className="w-fit">
                        {getPrestigeLabel(tier)}
                      </Badge>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {s.application_url && (
                        <Button asChild variant="default" size="sm" className="text-xs">
                          <a
                            href={s.application_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="size-3" />
                            Apply Now
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="neutral"
                        size="sm"
                        onClick={() => removeFromCompare(slug)}
                        aria-label={`Remove ${s.title} from comparison`}
                        className="text-xs"
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                  </div>
                </th>
              );
            })}
            {scholarships.length < 3 && (
              <th scope="col" className="p-4 lg:p-6 min-w-[200px] align-top">
                <SearchToAdd />
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {COMPARISON_FIELDS.map((field) => (
            <tr key={field.key} className="border-b border-border last:border-b-0">
              <th
                scope="row"
                className="sticky left-0 z-10 bg-secondary-background p-4 lg:p-6 text-left text-sm font-heading border-r-2 border-border"
              >
                {field.label}
              </th>
              {scholarships.map((s) => (
                <td
                  key={s._id}
                  className={cn(
                    "p-4 lg:p-6 border-r border-border last:border-r-0",
                    isDifferent(field.key, s, scholarships) &&
                      "bg-[var(--compare-diff-bg)]",
                  )}
                >
                  {renderField(field, s)}
                </td>
              ))}
              {scholarships.length < 3 && (
                <td className="p-4 lg:p-6" />
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
