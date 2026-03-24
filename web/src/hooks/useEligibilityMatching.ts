import { useQuery } from "convex/react";
import { useMemo } from "react";
import { api } from "../../convex/_generated/api";
import { scoreAllScholarships } from "@/lib/eligibility/scoring";
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
  // Derive Convex query args from profile -- skip if incomplete
  const queryArgs = useMemo(() => {
    if (!profile || !profile.nationalities?.length || !profile.degreeLevel) return "skip" as const;
    return {
      nationalities: profile.nationalities,
      degreeLevels: [profile.degreeLevel] as Array<"bachelor" | "master" | "phd" | "postdoc">,
    };
  }, [profile?.nationalities?.join(","), profile?.degreeLevel]);

  // Server-side filtering via Convex
  const serverResults = useQuery(
    api.eligibility.getEligibleScholarships,
    queryArgs === "skip" ? "skip" : queryArgs,
  );

  // Client-side scoring -- useMemo avoids re-scoring on unrelated re-renders
  const results = useMemo((): Record<MatchTier, ScoredScholarship[]> | null => {
    if (!serverResults || !profile) return null;
    // Cast server results to EligibilitySummary[] for the scoring engine.
    // The Convex query returns the same shape but with Convex Id types for _id.
    return scoreAllScholarships(serverResults as unknown as EligibilitySummary[], profile as StudentProfile);
  }, [serverResults, profile]);

  const totalCount = useMemo(() => {
    if (!results) return 0;
    return Object.values(results).reduce((sum, arr) => sum + arr.length, 0);
  }, [results]);

  return {
    results,
    totalCount,
    isLoading: queryArgs !== "skip" && serverResults === undefined,
    isReady: results !== null,
  };
}
