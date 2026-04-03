import { describe, it, expect } from "vitest";
import { computeUrgency, getMonthData } from "./deadline-engine";
import type { ScholarshipSummary } from "@/lib/scholarship-summary";

// Fixed reference: April 15, 2026 00:00:00 UTC
const NOW = new Date(2026, 3, 15).getTime();

function makeMs(year: number, month: number, day: number): number {
  return new Date(year, month, day).getTime();
}

function makeSummary(
  slug: string,
  title: string,
  deadlineMs: number | null,
  prestigeTier?: string,
): ScholarshipSummary {
  return {
    _id: slug,
    _creationTime: 0,
    title,
    slug,
    provider_organization: "Test Org",
    host_country: "US",
    degree_levels: ["Masters"],
    funding_type: "Full",
    application_deadline: deadlineMs,
    prestige_tier: prestigeTier ?? null,
  };
}

describe("computeUrgency", () => {
  it("returns 'critical' for deadline 5 days from now", () => {
    const dl = NOW + 5 * 24 * 60 * 60 * 1000;
    expect(computeUrgency(dl, NOW)).toBe("critical");
  });

  it("returns 'critical' for deadline exactly 7 days from now (boundary)", () => {
    const dl = NOW + 7 * 24 * 60 * 60 * 1000;
    expect(computeUrgency(dl, NOW)).toBe("critical");
  });

  it("returns 'warning' for deadline 8 days from now", () => {
    const dl = NOW + 8 * 24 * 60 * 60 * 1000;
    expect(computeUrgency(dl, NOW)).toBe("warning");
  });

  it("returns 'warning' for deadline 30 days from now (boundary)", () => {
    const dl = NOW + 30 * 24 * 60 * 60 * 1000;
    expect(computeUrgency(dl, NOW)).toBe("warning");
  });

  it("returns 'open' for deadline 31 days from now", () => {
    const dl = NOW + 31 * 24 * 60 * 60 * 1000;
    expect(computeUrgency(dl, NOW)).toBe("open");
  });

  it("returns 'closed' for deadline 1 day in the past", () => {
    const dl = NOW - 1 * 24 * 60 * 60 * 1000;
    expect(computeUrgency(dl, NOW)).toBe("closed");
  });

  it("returns 'critical' for deadline exactly now (0 diff)", () => {
    expect(computeUrgency(NOW, NOW)).toBe("critical");
  });
});

describe("getMonthData", () => {
  const trackedSlugs = new Set(["alpha", "beta", "gamma", "delta"]);

  const summaries: ScholarshipSummary[] = [
    makeSummary("alpha", "Alpha Scholarship", makeMs(2026, 3, 10)),
    makeSummary("beta", "Beta Scholarship", makeMs(2026, 3, 20)),
    makeSummary("gamma", "Gamma Scholarship", makeMs(2026, 3, 25)),
    makeSummary("delta", "Delta Award", makeMs(2026, 4, 5)), // May -- different month
    makeSummary("epsilon", "Epsilon Grant", makeMs(2026, 3, 12)), // Not tracked
    makeSummary("zeta", "Zeta Fund", null), // No deadline
  ];

  it("filters to only tracked slugs", () => {
    const data = getMonthData(summaries, trackedSlugs, 2026, 3, NOW);
    const slugs = data.events.map((e) => e.scholarshipSlug);
    expect(slugs).not.toContain("epsilon");
  });

  it("returns events only for the specified month", () => {
    const data = getMonthData(summaries, trackedSlugs, 2026, 3, NOW);
    const slugs = data.events.map((e) => e.scholarshipSlug);
    expect(slugs).not.toContain("delta"); // May deadline
    expect(slugs).toContain("alpha");
    expect(slugs).toContain("beta");
    expect(slugs).toContain("gamma");
  });

  it("isPeakSeason is true when 3+ deadlines in the target month", () => {
    const data = getMonthData(summaries, trackedSlugs, 2026, 3, NOW);
    expect(data.isPeakSeason).toBe(true);
    expect(data.totalDeadlines).toBe(3);
  });

  it("isPeakSeason is false when 0-2 deadlines in the target month", () => {
    const fewSlugs = new Set(["alpha"]);
    const data = getMonthData(summaries, fewSlugs, 2026, 3, NOW);
    expect(data.isPeakSeason).toBe(false);
    expect(data.totalDeadlines).toBe(1);
  });

  it("each CalendarEvent has start, end, allDay, and title fields", () => {
    const data = getMonthData(summaries, trackedSlugs, 2026, 3, NOW);
    for (const event of data.events) {
      expect(event.start).toBeInstanceOf(Date);
      expect(event.end).toBeInstanceOf(Date);
      expect(event.allDay).toBe(true);
      expect(typeof event.title).toBe("string");
      expect(event.title.length).toBeGreaterThan(0);
    }
  });

  it("eventsByDay groups events by day-of-month correctly", () => {
    const data = getMonthData(summaries, trackedSlugs, 2026, 3, NOW);
    expect(data.eventsByDay.get(10)?.length).toBe(1);
    expect(data.eventsByDay.get(10)?.[0].scholarshipSlug).toBe("alpha");
    expect(data.eventsByDay.get(20)?.length).toBe(1);
    expect(data.eventsByDay.get(25)?.length).toBe(1);
    expect(data.eventsByDay.has(15)).toBe(false);
  });

  it("scholarships without application_deadline are excluded", () => {
    const withNullSlugs = new Set(["alpha", "zeta"]);
    const data = getMonthData(summaries, withNullSlugs, 2026, 3, NOW);
    const slugs = data.events.map((e) => e.scholarshipSlug);
    expect(slugs).not.toContain("zeta");
    expect(slugs).toContain("alpha");
  });

  it("empty tracked set returns empty events and isPeakSeason false", () => {
    const data = getMonthData(summaries, new Set(), 2026, 3, NOW);
    expect(data.events).toHaveLength(0);
    expect(data.isPeakSeason).toBe(false);
    expect(data.totalDeadlines).toBe(0);
  });
});
