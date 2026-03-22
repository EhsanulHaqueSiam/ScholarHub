import { describe, expect, it } from "vitest";
import {
  normalizeTitle,
  computeMatchKey,
  hasDegreeLevelOverlap,
  getTrustRank,
  TRUST_RANK,
  resolveField,
  extractYear,
  shouldArchive,
  computeExpectedReopenMonth,
  toSlug,
  parseDeadlineToTimestamp,
} from "../../convex/aggregationHelpers";

describe("normalizeTitle", () => {
  it("strips scholarship suffixes", () => {
    const result = normalizeTitle("DAAD Scholarship");
    expect(result.toLowerCase()).not.toContain("scholarship");
  });

  it("strips programme/program", () => {
    const result = normalizeTitle("Erasmus Mundus Programme");
    expect(result.toLowerCase()).not.toContain("programme");
  });

  it("strips year references", () => {
    const result = normalizeTitle("DAAD 2025");
    expect(result).not.toContain("2025");
  });

  it("strips compound years", () => {
    const result = normalizeTitle("Chevening 2025/26");
    expect(result).not.toContain("2025");
    expect(result).not.toContain("26");
  });

  it("produces same key for equivalent titles", () => {
    expect(normalizeTitle("DAAD Scholarship 2025")).toBe(
      normalizeTitle("DAAD Scholarship Programme 2026"),
    );
  });

  it("preserves meaningful words", () => {
    const result = normalizeTitle("Engineering Excellence Award 2025");
    expect(result.toLowerCase()).toContain("engineering");
    expect(result.toLowerCase()).toContain("excellence");
  });

  it("collapses whitespace", () => {
    const result = normalizeTitle("DAAD  Scholarship   2025");
    expect(result).not.toContain("  ");
  });

  it("trims", () => {
    const result = normalizeTitle("  DAAD Scholarship 2025  ");
    expect(result).toBe(result.trim());
  });
});

describe("computeMatchKey", () => {
  it("produces deterministic key", () => {
    expect(computeMatchKey("test", "org", "US")).toBe(
      computeMatchKey("test", "org", "US"),
    );
  });

  it("different org produces different key", () => {
    expect(computeMatchKey("test", "orgA", "US")).not.toBe(
      computeMatchKey("test", "orgB", "US"),
    );
  });

  it("normalizes title within key", () => {
    expect(computeMatchKey("DAAD Scholarship 2025", "DAAD", "DE")).toBe(
      computeMatchKey("DAAD Scholarship 2026", "DAAD", "DE"),
    );
  });

  it("case insensitive", () => {
    expect(computeMatchKey("Test", "ORG", "US")).toBe(
      computeMatchKey("test", "org", "us"),
    );
  });
});

describe("hasDegreeLevelOverlap", () => {
  it("true when overlap exists", () => {
    expect(
      hasDegreeLevelOverlap(["bachelor", "master"], ["master", "phd"]),
    ).toBe(true);
  });

  it("false when no overlap", () => {
    expect(hasDegreeLevelOverlap(["bachelor"], ["phd"])).toBe(false);
  });

  it("handles empty arrays", () => {
    expect(hasDegreeLevelOverlap([], ["master"])).toBe(false);
  });
});

describe("getTrustRank", () => {
  it("government is 4", () => {
    expect(getTrustRank("government")).toBe(4);
  });

  it("official_program is 3", () => {
    expect(getTrustRank("official_program")).toBe(3);
  });

  it("foundation is 2", () => {
    expect(getTrustRank("foundation")).toBe(2);
  });

  it("aggregator is 1", () => {
    expect(getTrustRank("aggregator")).toBe(1);
  });

  it("unknown returns 0", () => {
    expect(getTrustRank("random")).toBe(0);
  });
});

describe("resolveField", () => {
  it("picks highest trust", () => {
    const result = resolveField([
      { value: "A", category: "government", scrapedAt: 1000 },
      { value: "B", category: "aggregator", scrapedAt: 1000 },
    ]);
    expect(result).toBe("A");
  });

  it("tiebreaks by recency", () => {
    const result = resolveField([
      { value: "old", category: "aggregator", scrapedAt: 1000 },
      { value: "new", category: "aggregator", scrapedAt: 2000 },
    ]);
    expect(result).toBe("new");
  });

  it("skips empty values", () => {
    const result = resolveField([
      { value: undefined, category: "government", scrapedAt: 1000 },
      { value: "B", category: "aggregator", scrapedAt: 1000 },
    ]);
    expect(result).toBe("B");
  });

  it("returns undefined when all empty", () => {
    const result = resolveField([
      { value: undefined, category: "government", scrapedAt: 1000 },
      { value: undefined, category: "aggregator", scrapedAt: 1000 },
    ]);
    expect(result).toBeUndefined();
  });
});

describe("extractYear", () => {
  it("extracts from title", () => {
    expect(extractYear("DAAD 2025")).toBe(2025);
  });

  it("falls back to deadline", () => {
    expect(extractYear("DAAD", new Date("2025-10-15").getTime())).toBe(2025);
  });

  it("title takes precedence", () => {
    expect(extractYear("DAAD 2025", new Date("2026-10-15").getTime())).toBe(
      2025,
    );
  });

  it("returns null when neither", () => {
    expect(extractYear("DAAD", undefined)).toBeNull();
  });
});

describe("shouldArchive", () => {
  it("true when > 30 days past", () => {
    expect(shouldArchive(Date.now() - 31 * 24 * 60 * 60 * 1000)).toBe(true);
  });

  it("false when < 30 days past", () => {
    expect(shouldArchive(Date.now() - 29 * 24 * 60 * 60 * 1000)).toBe(false);
  });

  it("false when undefined", () => {
    expect(shouldArchive(undefined)).toBe(false);
  });

  it("false for future deadline", () => {
    expect(shouldArchive(Date.now() + 86400000)).toBe(false);
  });
});

describe("computeExpectedReopenMonth", () => {
  it("returns most frequent month", () => {
    // 3 October deadlines
    const oct1 = new Date("2023-10-15").getTime();
    const oct2 = new Date("2024-10-20").getTime();
    const oct3 = new Date("2025-10-10").getTime();
    expect(computeExpectedReopenMonth([oct1, oct2, oct3])).toBe(10);
  });

  it("returns null for empty", () => {
    expect(computeExpectedReopenMonth([])).toBeNull();
  });

  it("handles single deadline", () => {
    const march = new Date("2025-03-15").getTime();
    expect(computeExpectedReopenMonth([march])).toBe(3);
  });
});

describe("toSlug", () => {
  it("basic slug", () => {
    expect(toSlug("Hello World")).toBe("hello-world");
  });

  it("strips special chars", () => {
    const result = toSlug("DAAD (Germany)");
    expect(result).not.toContain("(");
    expect(result).not.toContain(")");
  });

  it("no leading/trailing hyphens", () => {
    expect(toSlug("--test--")).toBe("test");
  });

  it("max 80 chars", () => {
    expect(toSlug("a".repeat(200)).length).toBeLessThanOrEqual(80);
  });
});

describe("parseDeadlineToTimestamp", () => {
  it("parses ISO date string", () => {
    const result = parseDeadlineToTimestamp("2025-10-15");
    expect(result).toBeTypeOf("number");
    expect(result).toBeGreaterThan(0);
  });

  it("returns undefined for undefined input", () => {
    expect(parseDeadlineToTimestamp(undefined)).toBeUndefined();
  });

  it("returns undefined for empty string", () => {
    expect(parseDeadlineToTimestamp("")).toBeUndefined();
  });

  it("returns undefined for invalid date", () => {
    expect(parseDeadlineToTimestamp("not-a-date")).toBeUndefined();
  });

  it("handles ISO datetime strings", () => {
    const result = parseDeadlineToTimestamp("2025-10-15T23:59:00Z");
    expect(result).toBeTypeOf("number");
    expect(result).toBeGreaterThan(0);
  });
});
