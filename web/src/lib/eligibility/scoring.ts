import type {
  EligibilitySummary,
  MatchBreakdown,
  MatchStatus,
  MatchTier,
  ScoredScholarship,
  StudentProfile,
} from "./types";

export interface ScoringWeights {
  nationality: number;
  degree: number;
  fieldOfStudy: number;
  fundingType: number;
  demographics: number;
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  nationality: 35,
  degree: 25,
  fieldOfStudy: 20,
  fundingType: 10,
  demographics: 10,
};

interface DimensionResult {
  status: MatchStatus;
  earned: number;
  possible: number;
}

function scoreNationality(
  scholarship: EligibilitySummary,
  profile: StudentProfile,
  weight: number,
): DimensionResult {
  const restrictions = scholarship.eligibility_nationalities;

  // No nationality restrictions = open to all
  if (!restrictions || restrictions.length === 0) {
    return { status: "not_required", earned: weight, possible: weight };
  }

  // Check if any of the user's nationalities are in the eligibility list
  const normalizedRestrictions = restrictions.map((n) => n.toUpperCase());
  const hasMatch = profile.nationalities.some((n) =>
    normalizedRestrictions.includes(n.toUpperCase()),
  );

  if (hasMatch) {
    return { status: "match", earned: weight, possible: weight };
  }

  return { status: "no_match", earned: 0, possible: weight };
}

function scoreDegree(
  scholarship: EligibilitySummary,
  profile: StudentProfile,
  weight: number,
): DimensionResult {
  const degreeLevels = scholarship.degree_levels;

  // No degree data = unknown (still counts in denominator to penalize sparse data)
  if (!degreeLevels || degreeLevels.length === 0) {
    return { status: "unknown", earned: 0, possible: weight };
  }

  const normalizedLevels = degreeLevels.map((d) => d.toLowerCase());
  if (normalizedLevels.includes(profile.degreeLevel.toLowerCase())) {
    return { status: "match", earned: weight, possible: weight };
  }

  return { status: "no_match", earned: 0, possible: weight };
}

function scoreField(
  scholarship: EligibilitySummary,
  profile: StudentProfile,
  weight: number,
): DimensionResult {
  const fields = scholarship.fields_of_study;

  // No field data at all (undefined) = unknown (still counts in denominator)
  if (fields === undefined || fields === null) {
    return { status: "unknown", earned: 0, possible: weight };
  }

  // Empty array = open to all fields (partial match)
  if (fields.length === 0) {
    return { status: "partial", earned: Math.floor(weight / 2), possible: weight };
  }

  // Check if any user field matches
  const normalizedFields = fields.map((f) => f.toLowerCase());
  const hasMatch = profile.fieldsOfStudy.some((f) => normalizedFields.includes(f.toLowerCase()));

  if (hasMatch) {
    return { status: "match", earned: weight, possible: weight };
  }

  return { status: "no_match", earned: 0, possible: weight };
}

function scoreFunding(
  scholarship: EligibilitySummary,
  profile: StudentProfile,
  weight: number,
): DimensionResult {
  const fundingType = scholarship.funding_type;

  // No funding data = unknown (still counts in denominator)
  if (!fundingType) {
    return { status: "unknown", earned: 0, possible: weight };
  }

  // No user preference = partial credit
  if (!profile.fundingPreference) {
    return { status: "partial", earned: Math.floor(weight / 2), possible: weight };
  }

  if (fundingType.toLowerCase() === profile.fundingPreference.toLowerCase()) {
    return { status: "match", earned: weight, possible: weight };
  }

  return { status: "no_match", earned: 0, possible: weight };
}

function scoreDemographics(
  scholarship: EligibilitySummary,
  profile: StudentProfile,
  weight: number,
): DimensionResult {
  const genderReq = scholarship.gender_requirement;

  // No gender requirement = open to all, full points
  if (!genderReq) {
    return { status: "not_required", earned: weight, possible: weight };
  }

  // User prefers not to say and scholarship has a requirement = unknown
  if (profile.gender === "prefer_not_to_say") {
    return { status: "unknown", earned: 0, possible: weight };
  }

  // No gender info from user but scholarship has requirement = unknown
  if (!profile.gender) {
    return { status: "unknown", earned: 0, possible: weight };
  }

  // Check if user's gender matches the requirement
  if (genderReq.toLowerCase() === profile.gender.toLowerCase()) {
    return { status: "match", earned: weight, possible: weight };
  }

  return { status: "no_match", earned: 0, possible: weight };
}

function determineTier(score: number, unknownCount: number): MatchTier {
  // D-19: If 3+ dimensions have unknown status, force "possible"
  if (unknownCount >= 3) {
    return "possible";
  }

  if (score >= 80) return "strong";
  if (score >= 50) return "good";
  if (score >= 20) return "partial";
  return "possible";
}

/**
 * Score a single scholarship against a student profile.
 *
 * Each dimension is scored independently, tracking earned points and possible points.
 * The final score is a percentage (0-100) of earned/possible points.
 * Dimensions with unknown data are excluded from the denominator.
 * If 3+ dimensions are unknown, the tier is forced to "possible" per D-19.
 */
export function scoreScholarship(
  scholarship: EligibilitySummary,
  profile: StudentProfile,
  weights: ScoringWeights = DEFAULT_WEIGHTS,
): ScoredScholarship {
  const nationalityResult = scoreNationality(scholarship, profile, weights.nationality);
  const degreeResult = scoreDegree(scholarship, profile, weights.degree);
  const fieldResult = scoreField(scholarship, profile, weights.fieldOfStudy);
  const fundingResult = scoreFunding(scholarship, profile, weights.fundingType);
  const demographicsResult = scoreDemographics(scholarship, profile, weights.demographics);

  const dimensions = [
    nationalityResult,
    degreeResult,
    fieldResult,
    fundingResult,
    demographicsResult,
  ];

  // Count unknowns
  const unknownCount = dimensions.filter((d) => d.status === "unknown").length;

  // Calculate total earned and possible (unknown dimensions included in denominator to penalize sparse data)
  const totalEarned = dimensions.reduce((sum, d) => sum + d.earned, 0);
  const totalPossible = dimensions.reduce((sum, d) => sum + d.possible, 0);

  // Avoid division by zero -- if all dimensions are unknown, score is 0
  const score = totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : 0;

  const tier = determineTier(score, unknownCount);

  const breakdown: MatchBreakdown = {
    nationality: nationalityResult.status,
    degree: degreeResult.status,
    field: fieldResult.status,
    language: "unknown" as MatchStatus, // Language matching not yet implemented; tracked as unknown for now
  };

  return {
    scholarship,
    tier,
    score,
    breakdown,
  };
}

/**
 * Score all scholarships and group by tier.
 * Results within each tier are sorted by score descending.
 */
export function scoreAllScholarships(
  scholarships: EligibilitySummary[],
  profile: StudentProfile,
): Record<MatchTier, ScoredScholarship[]> {
  const results: Record<MatchTier, ScoredScholarship[]> = {
    strong: [],
    good: [],
    partial: [],
    possible: [],
  };

  for (const scholarship of scholarships) {
    const scored = scoreScholarship(scholarship, profile);
    results[scored.tier].push(scored);
  }

  // Sort each tier by score descending
  for (const tier of ["strong", "good", "partial", "possible"] as const) {
    results[tier].sort((a, b) => b.score - a.score);
  }

  return results;
}

/**
 * Check if a scholarship deadline is within the next 30 days.
 * Returns false for expired deadlines (deadline < now) and undefined deadlines.
 */
export function isClosingSoon(deadline: number | undefined): boolean {
  if (!deadline) return false;
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  return deadline > now && deadline - now < thirtyDays;
}
