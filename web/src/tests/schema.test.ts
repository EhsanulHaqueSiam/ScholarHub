import { describe, expect, it } from "vitest";
import type {
  DegreeLevel,
  FundingType,
  ScholarshipStatus,
  ScrapeMethod,
  SourceCategory,
  TrustLevel,
} from "../../convex/schema";
import schema, {
  degreeLevelValidator,
  fundingTypeValidator,
  scholarshipStatusValidator,
  scrapeMethodValidator,
  sourceCategoryValidator,
  trustLevelValidator,
} from "../../convex/schema";

describe("Convex schema validators", () => {
  it("exports all 6 validators", () => {
    expect(degreeLevelValidator).toBeDefined();
    expect(fundingTypeValidator).toBeDefined();
    expect(sourceCategoryValidator).toBeDefined();
    expect(trustLevelValidator).toBeDefined();
    expect(scholarshipStatusValidator).toBeDefined();
    expect(scrapeMethodValidator).toBeDefined();
  });

  it("exports the schema default", () => {
    expect(schema).toBeDefined();
  });

  it("type-checks validator types at compile time", () => {
    // These assignments verify the exported types are correct.
    // If the types are wrong, this file will fail tsc --noEmit.
    const _degree: DegreeLevel = "bachelor";
    const _funding: FundingType = "fully_funded";
    const _source: SourceCategory = "official_program";
    const _trust: TrustLevel = "auto_publish";
    const _status: ScholarshipStatus = "published";
    const _method: ScrapeMethod = "api";

    // Suppress unused variable warnings -- these exist for type checking
    expect(_degree).toBe("bachelor");
    expect(_funding).toBe("fully_funded");
    expect(_source).toBe("official_program");
    expect(_trust).toBe("auto_publish");
    expect(_status).toBe("published");
    expect(_method).toBe("api");
  });
});
