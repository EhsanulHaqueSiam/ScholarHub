import { describe, it, expect } from "vitest";
import type { TrackerEntry } from "./types";
import { groupByStage, getDocumentMatrix, getDeadlineForEntry } from "./tracker-engine";

const mockEntries: TrackerEntry[] = [
  {
    scholarshipSlug: "sch-a",
    scholarshipTitle: "Scholarship A",
    stage: "researching",
    addedAt: 1000,
    updatedAt: 1000,
    documentChecks: { transcripts: true },
  },
  {
    scholarshipSlug: "sch-b",
    scholarshipTitle: "Scholarship B",
    stage: "submitted",
    addedAt: 2000,
    updatedAt: 2000,
    documentChecks: {},
  },
];

describe("groupByStage", () => {
  it("returns Record<TrackerStage, TrackerEntry[]> with entries grouped correctly", () => {
    const grouped = groupByStage(mockEntries);
    expect(grouped.researching).toHaveLength(1);
    expect(grouped.researching[0]!.scholarshipSlug).toBe("sch-a");
    expect(grouped.submitted).toHaveLength(1);
    expect(grouped.submitted[0]!.scholarshipSlug).toBe("sch-b");
  });

  it("returns empty arrays for stages with no entries", () => {
    const grouped = groupByStage(mockEntries);
    expect(grouped.preparing).toHaveLength(0);
    expect(grouped.interview).toHaveLength(0);
    expect(grouped.result).toHaveLength(0);
  });

  it("handles empty entries array", () => {
    const grouped = groupByStage([]);
    expect(grouped.researching).toHaveLength(0);
    expect(grouped.preparing).toHaveLength(0);
    expect(grouped.submitted).toHaveLength(0);
    expect(grouped.interview).toHaveLength(0);
    expect(grouped.result).toHaveLength(0);
  });
});

describe("getDocumentMatrix", () => {
  it("returns all 6 document types", () => {
    const matrix = getDocumentMatrix(mockEntries);
    expect(matrix).toHaveLength(6);
    const docTypes = matrix.map((m) => m.docType);
    expect(docTypes).toContain("transcripts");
    expect(docTypes).toContain("recommendation_letters");
    expect(docTypes).toContain("statement_of_purpose");
    expect(docTypes).toContain("cv_resume");
    expect(docTypes).toContain("language_test_scores");
    expect(docTypes).toContain("financial_documents");
  });

  it("aggregates scholarship check states correctly", () => {
    const matrix = getDocumentMatrix(mockEntries);
    const transcriptsRow = matrix.find((m) => m.docType === "transcripts")!;
    expect(transcriptsRow.scholarships).toHaveLength(2);

    const schA = transcriptsRow.scholarships.find((s) => s.slug === "sch-a")!;
    expect(schA.checked).toBe(true);
    expect(schA.title).toBe("Scholarship A");

    const schB = transcriptsRow.scholarships.find((s) => s.slug === "sch-b")!;
    expect(schB.checked).toBe(false);
  });

  it("returns correct checkedCount and totalCount", () => {
    const matrix = getDocumentMatrix(mockEntries);
    const transcriptsRow = matrix.find((m) => m.docType === "transcripts")!;
    expect(transcriptsRow.checkedCount).toBe(1);
    expect(transcriptsRow.totalCount).toBe(2);

    const sopRow = matrix.find((m) => m.docType === "statement_of_purpose")!;
    expect(sopRow.checkedCount).toBe(0);
    expect(sopRow.totalCount).toBe(2);
  });

  it("includes label for each document type", () => {
    const matrix = getDocumentMatrix(mockEntries);
    const transcriptsRow = matrix.find((m) => m.docType === "transcripts")!;
    expect(transcriptsRow.label).toBe("Transcripts");

    const cvRow = matrix.find((m) => m.docType === "cv_resume")!;
    expect(cvRow.label).toBe("CV / Resume");
  });
});

describe("getDeadlineForEntry", () => {
  it("returns deadline from matching summary", () => {
    const summaries = [
      {
        _id: "1",
        _creationTime: 0,
        title: "Scholarship A",
        slug: "sch-a",
        provider_organization: "Org",
        host_country: "US",
        degree_levels: ["masters"],
        funding_type: "full",
        application_deadline: 1700000000000,
      },
    ];
    const deadline = getDeadlineForEntry("sch-a", summaries);
    expect(deadline).toBe(1700000000000);
  });

  it("returns null when no matching summary", () => {
    const deadline = getDeadlineForEntry("unknown", []);
    expect(deadline).toBeNull();
  });

  it("returns null when summary has no deadline", () => {
    const summaries = [
      {
        _id: "1",
        _creationTime: 0,
        title: "Scholarship A",
        slug: "sch-a",
        provider_organization: "Org",
        host_country: "US",
        degree_levels: ["masters"],
        funding_type: "full",
        application_deadline: null,
      },
    ];
    const deadline = getDeadlineForEntry("sch-a", summaries);
    expect(deadline).toBeNull();
  });
});
