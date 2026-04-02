import { useQuery } from "convex/react";
import { useMemo } from "react";
import { api } from "../../convex/_generated/api";
import { useStaticData } from "@/hooks/useStaticData";
import { scoreAllScholarships } from "@/lib/eligibility/scoring";
import { filterScholarships } from "@/lib/static-data";
import type { EligibilitySummary, MatchTier, ScoredScholarship, StudentProfile } from "@/lib/eligibility/types";

/**
 * Orchestrates the hybrid compute model (D-20):
 * - Server (Convex): filters hard constraints (nationality, degree, expiry)
 * - Client: scores soft matches (field, funding, demographics) via scoring engine
 *
 * Returns tier-grouped results with loading states.
 * Skips the Convex query when profile is incomplete (no nationalities or degreeLevel).
 */
export function useEligibilityMatching(profile: StudentProfile | null) {
  const { data: staticData, isLoading: isStaticDataLoading } = useStaticData();

  // Derive Convex query args from profile -- skip if incomplete
  const queryArgs = useMemo(() => {
    if (!profile || !profile.nationalities?.length || !profile.degreeLevel) return "skip" as const;
    return {
      nationalities: profile.nationalities,
      degreeLevels: [profile.degreeLevel] as Array<"bachelor" | "master" | "phd" | "postdoc">,
    };
  }, [profile?.nationalities?.join(","), profile?.degreeLevel]);

  const staticResults = useMemo((): EligibilitySummary[] | null => {
    if (!staticData || !profile || queryArgs === "skip") return null;

    const matches = filterScholarships(staticData, {
      nationalities: profile.nationalities,
      showIneligible: false,
      degreeLevels: [profile.degreeLevel],
      showClosed: false,
      limit: staticData.summaries.length,
      offset: 0,
    }).scholarships;

    return matches.map((s) => ({
      _id: s._id,
      title: s.title,
      slug: s.slug ?? s._id,
      host_countries: [s.host_country],
      degree_levels: s.degree_levels ?? [],
      fields_of_study: s.fields_of_study ?? undefined,
      funding_type: s.funding_type,
      eligibility_nationalities: s.eligibility_nationalities ?? undefined,
      application_deadline: s.application_deadline ?? undefined,
      prestige_tier: s.prestige_tier ?? "unranked",
      scholarship_type: s.scholarship_type ?? undefined,
      funding_amount:
        s.award_amount_max != null
          ? `${s.award_currency ?? ""}${s.award_amount_max}`.trim()
          : undefined,
      language_requirements: undefined,
      gender_requirement: undefined,
      source_name: undefined,
    }));
  }, [staticData, profile, queryArgs]);

  const shouldUseConvex = queryArgs !== "skip" && !isStaticDataLoading && !staticData;
  // Server-side filtering via Convex
  const serverResults = useQuery(
    api.eligibility.getEligibleScholarships,
    shouldUseConvex && queryArgs !== "skip" ? queryArgs : "skip",
  );
  const resolvedResults = staticResults ?? serverResults;

  // Client-side scoring -- useMemo avoids re-scoring on unrelated re-renders
  const results = useMemo((): Record<MatchTier, ScoredScholarship[]> | null => {
    if (!resolvedResults || !profile) return null;
    // Cast server results to EligibilitySummary[] for the scoring engine.
    // The Convex query returns the same shape but with Convex Id types for _id.
    return scoreAllScholarships(resolvedResults as unknown as EligibilitySummary[], profile as StudentProfile);
  }, [resolvedResults, profile]);

  const totalCount = useMemo(() => {
    if (!results) return 0;
    return Object.values(results).reduce((sum, arr) => sum + arr.length, 0);
  }, [results]);

  return {
    results,
    totalCount,
    isLoading:
      queryArgs !== "skip" &&
      (isStaticDataLoading || (!staticData && shouldUseConvex && serverResults === undefined)),
    isReady: results !== null,
  };
}
