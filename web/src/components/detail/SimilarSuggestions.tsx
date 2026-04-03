import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStaticData } from "@/hooks/useStaticData";
import type { ScholarshipSummary } from "@/lib/scholarship-summary";
import { parseHostCountries } from "@/lib/countries";
import { getCompetitivenessTier, COMPETITIVENESS_LABELS, COMPETITIVENESS_VARIANTS } from "@/lib/competitiveness";

const PRESTIGE_RANK: Record<string, number> = {
  gold: 3,
  silver: 2,
  bronze: 1,
  unranked: 0,
};

function findEasierAlternatives(
  current: ScholarshipSummary,
  all: ScholarshipSummary[],
  limit: number,
): ScholarshipSummary[] {
  const currentRank = PRESTIGE_RANK[current.prestige_tier ?? "unranked"] ?? 0;
  const currentCountries = new Set(parseHostCountries(current.host_country));
  const currentFields = new Set(
    (current.fields_of_study ?? []).map((f) => f.toLowerCase()),
  );

  return all
    .filter((s) => {
      if (s.slug === current.slug) return false;
      const rank = PRESTIGE_RANK[s.prestige_tier ?? "unranked"] ?? 0;
      if (rank >= currentRank) return false;
      // Same country
      const countries = parseHostCountries(s.host_country);
      if (!countries.some((c) => currentCountries.has(c))) return false;
      return true;
    })
    .sort((a, b) => {
      // Prioritize same field matches
      const aFields = new Set(
        (a.fields_of_study ?? []).map((f) => f.toLowerCase()),
      );
      const bFields = new Set(
        (b.fields_of_study ?? []).map((f) => f.toLowerCase()),
      );
      const aFieldMatch = [...aFields].some((f) => currentFields.has(f))
        ? 1
        : 0;
      const bFieldMatch = [...bFields].some((f) => currentFields.has(f))
        ? 1
        : 0;
      return bFieldMatch - aFieldMatch;
    })
    .slice(0, limit);
}

function findAlsoConsider(
  current: ScholarshipSummary,
  all: ScholarshipSummary[],
  limit: number,
): ScholarshipSummary[] {
  const currentRank = PRESTIGE_RANK[current.prestige_tier ?? "unranked"] ?? 0;
  const currentCountries = new Set(parseHostCountries(current.host_country));

  return all
    .filter((s) => {
      if (s.slug === current.slug) return false;
      const rank = PRESTIGE_RANK[s.prestige_tier ?? "unranked"] ?? 0;
      // Same or higher tier, different scholarship
      if (rank < currentRank) return false;
      // Allow same country or different for reach
      return true;
    })
    .sort((a, b) => {
      // Prioritize same country, then higher prestige
      const aCountries = parseHostCountries(a.host_country);
      const bCountries = parseHostCountries(b.host_country);
      const aSameCountry = aCountries.some((c) => currentCountries.has(c))
        ? 1
        : 0;
      const bSameCountry = bCountries.some((c) => currentCountries.has(c))
        ? 1
        : 0;
      if (aSameCountry !== bSameCountry) return bSameCountry - aSameCountry;
      const aRank = PRESTIGE_RANK[a.prestige_tier ?? "unranked"] ?? 0;
      const bRank = PRESTIGE_RANK[b.prestige_tier ?? "unranked"] ?? 0;
      return bRank - aRank;
    })
    .slice(0, limit);
}

function SuggestionItem({ scholarship }: { scholarship: ScholarshipSummary }) {
  const tier = getCompetitivenessTier(
    scholarship.prestige_tier,
    scholarship.funding_type,
  );
  return (
    <Link
      to="/scholarships/$slug"
      params={{ slug: scholarship.slug! }}
      className="flex items-center justify-between gap-3 p-3 rounded-base border-2 border-border hover:shadow-shadow hover:-translate-y-0.5 transition-all duration-150"
    >
      <div className="min-w-0 flex-1">
        <div className="font-heading text-caption truncate">
          {scholarship.title}
        </div>
        <div className="text-caption opacity-60">
          {scholarship.host_country} · {scholarship.funding_type.replace("_", " ")}
        </div>
      </div>
      <Badge variant={COMPETITIVENESS_VARIANTS[tier] as any} className="shrink-0">
        {COMPETITIVENESS_LABELS[tier]}
      </Badge>
      <ChevronRight className="size-4 opacity-40 shrink-0" />
    </Link>
  );
}

interface SimilarSuggestionsProps {
  currentScholarship: ScholarshipSummary;
}

export function SimilarSuggestions({
  currentScholarship,
}: SimilarSuggestionsProps) {
  const { data } = useStaticData();

  const easier = useMemo(
    () =>
      data?.summaries
        ? findEasierAlternatives(currentScholarship, data.summaries, 3)
        : [],
    [currentScholarship, data?.summaries],
  );

  const alsoConsider = useMemo(
    () =>
      data?.summaries
        ? findAlsoConsider(currentScholarship, data.summaries, 3)
        : [],
    [currentScholarship, data?.summaries],
  );

  if (easier.length === 0 && alsoConsider.length === 0) return null;

  return (
    <div className="flex flex-col gap-6">
      {easier.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Easier to Get</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {easier.map((s) => (
              <SuggestionItem key={s.slug} scholarship={s} />
            ))}
          </CardContent>
        </Card>
      )}

      {alsoConsider.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Also Consider</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {alsoConsider.map((s) => (
              <SuggestionItem key={s.slug} scholarship={s} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
