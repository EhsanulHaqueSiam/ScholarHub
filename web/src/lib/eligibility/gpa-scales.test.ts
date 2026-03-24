import { describe, it, expect } from "vitest";
import { normalizeGpa, GPA_SCALES } from "./gpa-scales";

describe("GPA_SCALES", () => {
  it("contains all 6 scale definitions", () => {
    expect(GPA_SCALES).toHaveLength(6);
    const keys = GPA_SCALES.map((s) => s.key);
    expect(keys).toContain("us_4");
    expect(keys).toContain("uk_class");
    expect(keys).toContain("percentage");
    expect(keys).toContain("german");
    expect(keys).toContain("australian");
    expect(keys).toContain("indian_10");
  });

  it("each scale has label, min, max, and step", () => {
    for (const scale of GPA_SCALES) {
      expect(scale.label).toBeTruthy();
      expect(typeof scale.min).toBe("number");
      expect(typeof scale.max).toBe("number");
      expect(typeof scale.step).toBe("number");
      expect(scale.max).toBeGreaterThan(scale.min);
    }
  });
});

describe("normalizeGpa", () => {
  it("normalizes US 4.0 scale: 3.5 -> 87.5", () => {
    expect(normalizeGpa(3.5, "us_4")).toBe(87.5);
  });

  it("normalizes UK classification: 70 -> 70", () => {
    expect(normalizeGpa(70, "uk_class")).toBe(70);
  });

  it("normalizes percentage: 85 -> 85", () => {
    expect(normalizeGpa(85, "percentage")).toBe(85);
  });

  it("normalizes German scale (inverted): 1.5 -> 87.5", () => {
    expect(normalizeGpa(1.5, "german")).toBe(87.5);
  });

  it("normalizes Australian GPA: 6.0 -> ~85.7", () => {
    const result = normalizeGpa(6.0, "australian");
    expect(result).toBeCloseTo(85.71, 1);
  });

  it("normalizes Indian CGPA: 8.5 -> 85", () => {
    expect(normalizeGpa(8.5, "indian_10")).toBe(85);
  });

  it("clamps values at 0 minimum", () => {
    expect(normalizeGpa(-1, "us_4")).toBeGreaterThanOrEqual(0);
  });

  it("clamps values at 100 maximum", () => {
    expect(normalizeGpa(5.0, "us_4")).toBeLessThanOrEqual(100);
  });
});
