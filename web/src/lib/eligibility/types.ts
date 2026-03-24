export type GpaScale =
  | "us_4"
  | "uk_class"
  | "percentage"
  | "german"
  | "australian"
  | "indian_10";

export type MatchTier = "strong" | "good" | "partial" | "possible";

export type MatchStatus =
  | "match"
  | "partial"
  | "no_match"
  | "unknown"
  | "not_required";

export type Gender = "male" | "female" | "non_binary" | "prefer_not_to_say";

export interface StudentProfile {
  nationalities: string[]; // ISO 2-letter codes per D-09
  age?: number; // optional per D-08
  gender?: Gender; // optional per D-14

  degreeLevel: "bachelor" | "master" | "phd" | "postdoc"; // required per D-08
  fieldsOfStudy: string[]; // 1-3 from FIELDS_OF_STUDY per D-10
  gpa?: { value: number; scale: GpaScale }; // optional per D-12
  languageScores?: {
    // optional per D-11
    ielts?: number; // 0-9
    toefl?: number; // 0-120
    pte?: number; // 10-90
  };

  destinationCountries?: string[]; // ISO codes, 1-5 per D-13
  fundingPreference?:
    | "fully_funded"
    | "partial"
    | "tuition_waiver"
    | "stipend_only";

  createdAt: number;
  updatedAt: number;
}

export interface MatchBreakdown {
  nationality: MatchStatus;
  degree: MatchStatus;
  field: MatchStatus;
  language: MatchStatus;
}

export interface EligibilitySummary {
  _id: string;
  title: string;
  slug: string;
  host_countries: string[];
  degree_levels: string[];
  fields_of_study?: string[];
  funding_type?: string;
  eligibility_nationalities?: string[];
  application_deadline?: number;
  prestige_tier: string;
  scholarship_type?: string;
  funding_amount?: string;
  language_requirements?: string;
  gender_requirement?: string;
  source_name?: string;
}

export interface ScoredScholarship {
  scholarship: EligibilitySummary;
  tier: MatchTier;
  score: number; // 0-100
  breakdown: MatchBreakdown;
}
