import type { GpaScale, Gender, StudentProfile } from "./types";

/**
 * Short codes for fields of study -- keeps URLs compact.
 * Maps full field name to 2-3 character short code.
 */
export const FIELD_SHORT_CODES: Record<string, string> = {
  Agriculture: "agr",
  Architecture: "arc",
  "Arts & Humanities": "art",
  "Business & Management": "biz",
  "Computer Science": "cs",
  Economics: "eco",
  Education: "edu",
  Engineering: "eng",
  "Environmental Science": "env",
  "Health Sciences": "hsc",
  "International Relations": "ir",
  Law: "law",
  Mathematics: "math",
  "Media & Communication": "mec",
  Medicine: "med",
  "Natural Sciences": "nsc",
  Nursing: "nur",
  Pharmacy: "pha",
  Philosophy: "phi",
  "Political Science": "pol",
  Psychology: "psy",
  "Public Health": "ph",
  "Social Sciences": "ssc",
  Technology: "tec",
  "Veterinary Science": "vet",
};

/** Reverse mapping: short code -> full field name */
const FIELD_FROM_SHORT_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(FIELD_SHORT_CODES).map(([full, short]) => [short, full]),
);

/**
 * Encode a StudentProfile into compact URL search params.
 *
 * Short param keys:
 * - n: nationalities (comma-separated ISO codes)
 * - d: degree level
 * - f: fields of study (comma-separated short codes)
 * - dest: destination countries (comma-separated ISO codes)
 * - gpa: GPA as "value:scale"
 * - lang: language scores as "test:score,..."
 * - fund: funding preference
 * - age: age
 * - gen: gender
 */
export function profileToUrlParams(
  profile: StudentProfile,
): Record<string, string> {
  const params: Record<string, string> = {};

  // Required fields
  if (profile.nationalities.length > 0) {
    params.n = profile.nationalities.join(",");
  }
  params.d = profile.degreeLevel;
  if (profile.fieldsOfStudy.length > 0) {
    params.f = profile.fieldsOfStudy
      .map((field) => FIELD_SHORT_CODES[field] ?? field.toLowerCase())
      .join(",");
  }

  // Optional fields -- only include if present
  if (profile.destinationCountries && profile.destinationCountries.length > 0) {
    params.dest = profile.destinationCountries.join(",");
  }

  if (profile.gpa) {
    params.gpa = `${profile.gpa.value}:${profile.gpa.scale}`;
  }

  if (profile.languageScores) {
    const parts: string[] = [];
    if (profile.languageScores.ielts !== undefined) {
      parts.push(`ielts:${profile.languageScores.ielts}`);
    }
    if (profile.languageScores.toefl !== undefined) {
      parts.push(`toefl:${profile.languageScores.toefl}`);
    }
    if (profile.languageScores.pte !== undefined) {
      parts.push(`pte:${profile.languageScores.pte}`);
    }
    if (parts.length > 0) {
      params.lang = parts.join(",");
    }
  }

  if (profile.fundingPreference) {
    params.fund = profile.fundingPreference;
  }

  if (profile.age !== undefined) {
    params.age = String(profile.age);
  }

  if (profile.gender) {
    params.gen = profile.gender;
  }

  return params;
}

/**
 * Decode compact URL search params back into a partial StudentProfile.
 * Missing params produce undefined fields, not errors.
 */
export function urlParamsToProfile(
  params: Record<string, string | undefined>,
): Partial<StudentProfile> {
  const profile: Partial<StudentProfile> = {};

  if (params.n) {
    profile.nationalities = params.n.split(",").filter(Boolean);
  }

  if (params.d) {
    profile.degreeLevel = params.d as StudentProfile["degreeLevel"];
  }

  if (params.f) {
    profile.fieldsOfStudy = params.f
      .split(",")
      .map((code) => FIELD_FROM_SHORT_CODE[code] ?? code)
      .filter(Boolean);
  }

  if (params.dest) {
    profile.destinationCountries = params.dest.split(",").filter(Boolean);
  }

  if (params.gpa) {
    const [valueStr, scale] = params.gpa.split(":");
    const value = parseFloat(valueStr);
    if (!isNaN(value) && scale) {
      profile.gpa = { value, scale: scale as GpaScale };
    }
  }

  if (params.lang) {
    const scores: StudentProfile["languageScores"] = {};
    for (const part of params.lang.split(",")) {
      const [test, scoreStr] = part.split(":");
      const score = parseFloat(scoreStr);
      if (!isNaN(score)) {
        if (test === "ielts") scores.ielts = score;
        else if (test === "toefl") scores.toefl = score;
        else if (test === "pte") scores.pte = score;
      }
    }
    if (
      scores.ielts !== undefined ||
      scores.toefl !== undefined ||
      scores.pte !== undefined
    ) {
      profile.languageScores = scores;
    }
  }

  if (params.fund) {
    profile.fundingPreference =
      params.fund as StudentProfile["fundingPreference"];
  }

  if (params.age) {
    const age = parseInt(params.age, 10);
    if (!isNaN(age)) {
      profile.age = age;
    }
  }

  if (params.gen) {
    profile.gender = params.gen as Gender;
  }

  return profile;
}
