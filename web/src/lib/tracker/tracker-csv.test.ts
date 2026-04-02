import { describe, it, expect } from "vitest";
import { format } from "date-fns";
import type { TrackerEntry } from "./types";
import { generateCSV } from "./tracker-csv";

const timestamp = 1700000000000; // 2023-11-14

const makeEntry = (overrides: Partial<TrackerEntry> = {}): TrackerEntry => ({
  scholarshipSlug: "sch-a",
  scholarshipTitle: "Scholarship A",
  stage: "researching",
  addedAt: timestamp,
  updatedAt: timestamp,
  documentChecks: {},
  ...overrides,
});

describe("generateCSV", () => {
  it("with empty entries returns only headers row", () => {
    const csv = generateCSV([]);
    const lines = csv.trim().split("\n");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe(
      "Title,Stage,Deadline,Notes,Documents Completed,Date Added"
    );
  });

  it("with 1 entry produces headers + 1 data row", () => {
    const csv = generateCSV([makeEntry()]);
    const lines = csv.trim().split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe(
      "Title,Stage,Deadline,Notes,Documents Completed,Date Added"
    );
  });

  it("produces correct columns", () => {
    const entry = makeEntry({ notes: "test note" });
    const csv = generateCSV([entry]);
    const lines = csv.trim().split("\n");
    const dataLine = lines[1]!;
    const columns = dataLine.split(",");

    expect(columns[0]).toBe("Scholarship A"); // title
    expect(columns[1]).toBe("Researching"); // stage label
    expect(columns[2]).toBe(""); // deadline placeholder
    expect(columns[3]).toBe("test note"); // notes
    expect(columns[4]).toBe("0/6"); // documents completed
    expect(columns[5]).toBe(format(new Date(timestamp), "yyyy-MM-dd")); // date added
  });

  it("shows correct document count", () => {
    const entry = makeEntry({
      documentChecks: { transcripts: true, cv_resume: true, statement_of_purpose: false },
    });
    const csv = generateCSV([entry]);
    const lines = csv.trim().split("\n");
    const dataLine = lines[1]!;
    const columns = dataLine.split(",");
    expect(columns[4]).toBe("2/6");
  });

  it("escapes commas in notes by wrapping in quotes", () => {
    const entry = makeEntry({ notes: "hello, world" });
    const csv = generateCSV([entry]);
    expect(csv).toContain('"hello, world"');
  });

  it("escapes double quotes in notes by doubling them", () => {
    const entry = makeEntry({ notes: 'say "hello"' });
    const csv = generateCSV([entry]);
    expect(csv).toContain('"say ""hello"""');
  });

  it("formats date as YYYY-MM-DD", () => {
    const entry = makeEntry();
    const csv = generateCSV([entry]);
    const expectedDate = format(new Date(timestamp), "yyyy-MM-dd");
    expect(csv).toContain(expectedDate);
  });
});
