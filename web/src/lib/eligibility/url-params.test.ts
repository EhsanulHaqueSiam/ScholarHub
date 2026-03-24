import { describe, it, expect } from "vitest";
import {
  profileToUrlParams,
  urlParamsToProfile,
  FIELD_SHORT_CODES,
} from "./url-params";
import type { StudentProfile } from "./types";

const makeProfile = (overrides?: Partial<StudentProfile>): StudentProfile => ({
  nationalities: ["BD"],
  degreeLevel: "master",
  fieldsOfStudy: ["Computer Science"],
  createdAt: 1000,
  updatedAt: 1000,
  ...overrides,
});

describe("FIELD_SHORT_CODES", () => {
  it("maps all 25 fields of study to short codes", () => {
    expect(Object.keys(FIELD_SHORT_CODES)).toHaveLength(25);
    expect(FIELD_SHORT_CODES["Computer Science"]).toBe("cs");
    expect(FIELD_SHORT_CODES["Engineering"]).toBe("eng");
    expect(FIELD_SHORT_CODES["Arts & Humanities"]).toBe("art");
  });
});

describe("profileToUrlParams", () => {
  it("encodes basic profile to compact params", () => {
    const params = profileToUrlParams(
      makeProfile({
        nationalities: ["BD"],
        degreeLevel: "master",
        fieldsOfStudy: ["Computer Science", "Engineering"],
      }),
    );
    expect(params.n).toBe("BD");
    expect(params.d).toBe("master");
    expect(params.f).toBe("cs,eng");
  });

  it("encodes multiple nationalities", () => {
    const params = profileToUrlParams(
      makeProfile({ nationalities: ["BD", "IN"] }),
    );
    expect(params.n).toBe("BD,IN");
  });

  it("encodes destination countries", () => {
    const params = profileToUrlParams(
      makeProfile({ destinationCountries: ["DE", "NL"] }),
    );
    expect(params.dest).toBe("DE,NL");
  });

  it("encodes GPA as value:scale", () => {
    const params = profileToUrlParams(
      makeProfile({ gpa: { value: 3.5, scale: "us_4" } }),
    );
    expect(params.gpa).toBe("3.5:us_4");
  });

  it("encodes language scores", () => {
    const params = profileToUrlParams(
      makeProfile({ languageScores: { ielts: 7.5, toefl: 100 } }),
    );
    expect(params.lang).toBe("ielts:7.5,toefl:100");
  });

  it("encodes age and gender", () => {
    const params = profileToUrlParams(
      makeProfile({ age: 25, gender: "female" }),
    );
    expect(params.age).toBe("25");
    expect(params.gen).toBe("female");
  });

  it("encodes funding preference", () => {
    const params = profileToUrlParams(
      makeProfile({ fundingPreference: "fully_funded" }),
    );
    expect(params.fund).toBe("fully_funded");
  });

  it("omits undefined/empty optional fields", () => {
    const params = profileToUrlParams(makeProfile());
    expect(params.dest).toBeUndefined();
    expect(params.gpa).toBeUndefined();
    expect(params.lang).toBeUndefined();
    expect(params.age).toBeUndefined();
    expect(params.gen).toBeUndefined();
    expect(params.fund).toBeUndefined();
  });
});

describe("urlParamsToProfile", () => {
  it("decodes basic params to partial profile", () => {
    const profile = urlParamsToProfile({
      n: "BD,IN",
      d: "master",
      f: "cs,eng",
      dest: "DE,NL",
    });
    expect(profile.nationalities).toEqual(["BD", "IN"]);
    expect(profile.degreeLevel).toBe("master");
    expect(profile.fieldsOfStudy).toEqual([
      "Computer Science",
      "Engineering",
    ]);
    expect(profile.destinationCountries).toEqual(["DE", "NL"]);
  });

  it("decodes GPA param", () => {
    const profile = urlParamsToProfile({ gpa: "3.5:us_4" });
    expect(profile.gpa).toEqual({ value: 3.5, scale: "us_4" });
  });

  it("decodes language scores", () => {
    const profile = urlParamsToProfile({ lang: "ielts:7.5,toefl:100" });
    expect(profile.languageScores).toEqual({ ielts: 7.5, toefl: 100 });
  });

  it("decodes age and gender", () => {
    const profile = urlParamsToProfile({ age: "25", gen: "non_binary" });
    expect(profile.age).toBe(25);
    expect(profile.gender).toBe("non_binary");
  });

  it("empty/missing params produce undefined fields, not errors", () => {
    const profile = urlParamsToProfile({});
    expect(profile.nationalities).toBeUndefined();
    expect(profile.degreeLevel).toBeUndefined();
    expect(profile.fieldsOfStudy).toBeUndefined();
    expect(profile.gpa).toBeUndefined();
    expect(profile.languageScores).toBeUndefined();
  });
});

describe("round-trip encoding/decoding", () => {
  it("reconstructs original profile fields through encode then decode", () => {
    const original = makeProfile({
      nationalities: ["BD", "IN"],
      degreeLevel: "master",
      fieldsOfStudy: ["Computer Science", "Engineering"],
      gpa: { value: 3.5, scale: "us_4" },
      languageScores: { ielts: 7.5, toefl: 100 },
      destinationCountries: ["DE", "NL"],
      fundingPreference: "fully_funded",
      age: 25,
      gender: "male",
    });
    const params = profileToUrlParams(original);
    const decoded = urlParamsToProfile(params);

    expect(decoded.nationalities).toEqual(original.nationalities);
    expect(decoded.degreeLevel).toBe(original.degreeLevel);
    expect(decoded.fieldsOfStudy).toEqual(original.fieldsOfStudy);
    expect(decoded.gpa).toEqual(original.gpa);
    expect(decoded.languageScores).toEqual(original.languageScores);
    expect(decoded.destinationCountries).toEqual(
      original.destinationCountries,
    );
    expect(decoded.fundingPreference).toBe(original.fundingPreference);
    expect(decoded.age).toBe(original.age);
    expect(decoded.gender).toBe(original.gender);
  });

  it("produces compact URLs under 200 chars for common profiles", () => {
    const params = profileToUrlParams(
      makeProfile({
        nationalities: ["BD"],
        degreeLevel: "master",
        fieldsOfStudy: ["Computer Science", "Engineering"],
        destinationCountries: ["DE", "NL", "US"],
        fundingPreference: "fully_funded",
      }),
    );
    const queryString = new URLSearchParams(
      params as Record<string, string>,
    ).toString();
    expect(queryString.length).toBeLessThan(200);
  });
});
