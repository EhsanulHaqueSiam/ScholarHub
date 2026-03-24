import type { GpaScale } from "./types";

export interface GpaScaleDefinition {
  key: GpaScale;
  label: string;
  min: number;
  max: number;
  step: number;
}

export const GPA_SCALES: GpaScaleDefinition[] = [
  { key: "us_4", label: "US 4.0 Scale", min: 0, max: 4.0, step: 0.1 },
  { key: "uk_class", label: "UK Classification", min: 0, max: 100, step: 1 },
  { key: "percentage", label: "Percentage", min: 0, max: 100, step: 1 },
  {
    key: "german",
    label: "German Scale (1.0-5.0)",
    min: 1.0,
    max: 5.0,
    step: 0.1,
  },
  {
    key: "australian",
    label: "Australian GPA (7.0)",
    min: 0,
    max: 7.0,
    step: 0.1,
  },
  {
    key: "indian_10",
    label: "Indian CGPA (10.0)",
    min: 0,
    max: 10.0,
    step: 0.1,
  },
];

/**
 * Normalize a GPA value from any scale to a 0-100 percentage range.
 *
 * Formulas:
 * - us_4: (value / 4.0) * 100
 * - uk_class: value (already percentage)
 * - percentage: value (identity)
 * - german: ((5.0 - value) / 4.0) * 100 (inverted scale: 1.0 = best)
 * - australian: (value / 7.0) * 100
 * - indian_10: (value / 10.0) * 100
 */
export function normalizeGpa(value: number, scale: GpaScale): number {
  let normalized: number;

  switch (scale) {
    case "us_4":
      normalized = (value / 4.0) * 100;
      break;
    case "uk_class":
      normalized = value;
      break;
    case "percentage":
      normalized = value;
      break;
    case "german":
      normalized = ((5.0 - value) / 4.0) * 100;
      break;
    case "australian":
      normalized = (value / 7.0) * 100;
      break;
    case "indian_10":
      normalized = (value / 10.0) * 100;
      break;
  }

  // Clamp to 0-100 range
  return Math.min(100, Math.max(0, normalized));
}
