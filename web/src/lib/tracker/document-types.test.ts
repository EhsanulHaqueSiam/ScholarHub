import { describe, it, expect } from "vitest";
import { DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS } from "./document-types";
import { STAGE_CONFIG } from "./types";

describe("DOCUMENT_TYPES", () => {
  it("has exactly 6 entries", () => {
    expect(DOCUMENT_TYPES).toHaveLength(6);
  });

  it("contains all required document types", () => {
    expect(DOCUMENT_TYPES).toContain("transcripts");
    expect(DOCUMENT_TYPES).toContain("recommendation_letters");
    expect(DOCUMENT_TYPES).toContain("statement_of_purpose");
    expect(DOCUMENT_TYPES).toContain("cv_resume");
    expect(DOCUMENT_TYPES).toContain("language_test_scores");
    expect(DOCUMENT_TYPES).toContain("financial_documents");
  });
});

describe("DOCUMENT_TYPE_LABELS", () => {
  it("maps all 6 types to human-readable labels", () => {
    expect(Object.keys(DOCUMENT_TYPE_LABELS)).toHaveLength(6);
  });

  it("maps transcripts correctly", () => {
    expect(DOCUMENT_TYPE_LABELS["transcripts"]).toBe("Transcripts");
  });

  it("maps recommendation_letters correctly", () => {
    expect(DOCUMENT_TYPE_LABELS["recommendation_letters"]).toBe(
      "Recommendation Letters"
    );
  });

  it("maps cv_resume correctly", () => {
    expect(DOCUMENT_TYPE_LABELS["cv_resume"]).toBe("CV / Resume");
  });

  it("maps statement_of_purpose correctly", () => {
    expect(DOCUMENT_TYPE_LABELS["statement_of_purpose"]).toBe(
      "Statement of Purpose"
    );
  });

  it("maps language_test_scores correctly", () => {
    expect(DOCUMENT_TYPE_LABELS["language_test_scores"]).toBe(
      "Language Test Scores"
    );
  });

  it("maps financial_documents correctly", () => {
    expect(DOCUMENT_TYPE_LABELS["financial_documents"]).toBe(
      "Financial Documents"
    );
  });
});

describe("STAGE_CONFIG", () => {
  it("has exactly 5 entries for all stages", () => {
    const stages = Object.keys(STAGE_CONFIG);
    expect(stages).toHaveLength(5);
    expect(stages).toContain("researching");
    expect(stages).toContain("preparing");
    expect(stages).toContain("submitted");
    expect(stages).toContain("interview");
    expect(stages).toContain("result");
  });

  it("each entry has label, colorToken, and icon fields", () => {
    for (const [, config] of Object.entries(STAGE_CONFIG)) {
      expect(config).toHaveProperty("label");
      expect(config).toHaveProperty("colorToken");
      expect(config).toHaveProperty("icon");
      expect(typeof config.label).toBe("string");
      expect(typeof config.colorToken).toBe("string");
      expect(typeof config.icon).toBe("string");
    }
  });
});
