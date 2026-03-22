/**
 * Pure utility functions for scholarship data aggregation.
 *
 * These functions handle normalization, matching, merging, cycle detection,
 * and archival logic. They are pure (no Convex DB access) so they can be
 * unit-tested without convex-test overhead and reused across mutation boundaries.
 */

// ---- Trust Hierarchy (D-05) ----

export const TRUST_RANK: Record<string, number> = {
  government: 4,
  official_program: 3,
  foundation: 2,
  aggregator: 1,
};

/**
 * Returns the trust rank for a source category.
 * Higher rank = more trustworthy. Unknown categories return 0.
 */
export function getTrustRank(category: string): number {
  return TRUST_RANK[category] ?? 0;
}

// ---- Title Normalization (D-02) ----

/**
 * Normalizes a scholarship title for dedup matching.
 * Strips suffixes (scholarship, programme, grant, etc.), year references,
 * punctuation, and collapses whitespace.
 */
export function normalizeTitle(title: string): string {
  let result = title.toLowerCase();

  // Strip suffix words
  result = result.replace(
    /\b(scholarships?|programmes?|programs?|grants?|awards?|fellowships?)\b/gi,
    "",
  );

  // Strip year references (e.g., 2025, 2025/26, 2025-26)
  result = result.replace(/\b20\d{2}[-/]?\d{0,2}\b/g, "");

  // Replace non-word non-space chars with space
  result = result.replace(/[^\w\s]/g, " ");

  // Collapse whitespace
  result = result.replace(/\s+/g, " ");

  return result.trim();
}

// ---- Match Key (D-01) ----

/**
 * Computes a deterministic 3-field match key for dedup index lookup.
 * Format: normalizedTitle|org|country (all lowercase, trimmed).
 * Degree overlap is checked separately in code (Pitfall 4).
 */
export function computeMatchKey(
  title: string,
  org: string,
  country: string,
): string {
  return `${normalizeTitle(title)}|${org.toLowerCase().trim()}|${country.toLowerCase().trim()}`;
}

// ---- Degree Level Overlap (D-01) ----

/**
 * Checks if there is any overlap between two arrays of degree levels.
 * Used as a secondary dedup check after match key lookup.
 */
export function hasDegreeLevelOverlap(
  existing: string[],
  candidate: string[],
): boolean {
  return candidate.some((d) => existing.includes(d));
}

// ---- Field Resolution (D-05/D-06) ----

interface FieldCandidate<T> {
  value: T | undefined | null;
  category: string;
  scrapedAt: number;
}

/**
 * Resolves a field value from multiple source candidates.
 * Picks the highest-trust non-empty value; tiebreaks by most recent scrapedAt.
 * Returns undefined if all candidates have empty values.
 */
export function resolveField<T>(candidates: FieldCandidate<T>[]): T | undefined {
  // Filter out null/undefined/"" values
  const valid = candidates.filter(
    (c) => c.value !== undefined && c.value !== null && c.value !== "",
  );

  if (valid.length === 0) return undefined;

  // Sort by trust rank descending, then scrapedAt descending for tiebreak
  valid.sort((a, b) => {
    const trustDiff = getTrustRank(b.category) - getTrustRank(a.category);
    if (trustDiff !== 0) return trustDiff;
    return b.scrapedAt - a.scrapedAt;
  });

  return valid[0].value as T;
}

// ---- Year Extraction (D-09) ----

/**
 * Extracts the scholarship year from the title or deadline timestamp.
 * Title match takes precedence over deadline-derived year.
 * Returns null if neither source provides a year.
 */
export function extractYear(
  title: string,
  deadline?: number | null,
): number | null {
  // Try regex on title first
  const match = title.match(/\b(20\d{2})\b/);
  if (match) return Number.parseInt(match[1], 10);

  // Fall back to deadline timestamp
  if (deadline != null) {
    return new Date(deadline).getFullYear();
  }

  return null;
}

// ---- Auto-Archive (D-11) ----

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Determines if a scholarship should be auto-archived.
 * Returns true if the deadline is more than 30 days in the past.
 * Returns false for undefined/null deadlines or future deadlines.
 */
export function shouldArchive(
  deadline: number | undefined | null,
): boolean {
  if (deadline == null) return false;
  return Date.now() - deadline > THIRTY_DAYS_MS;
}

// ---- Cycle Detection (D-10) ----

/**
 * Computes the expected reopen month from historical deadline timestamps.
 * Returns the most frequent month (1-12), or null for an empty array.
 * Tiebreaks by first occurrence.
 */
export function computeExpectedReopenMonth(
  historicalDeadlines: number[],
): number | null {
  if (historicalDeadlines.length === 0) return null;

  const monthCounts = new Map<number, number>();

  for (const d of historicalDeadlines) {
    const month = new Date(d).getMonth() + 1; // 1-12
    monthCounts.set(month, (monthCounts.get(month) ?? 0) + 1);
  }

  let bestMonth = 0;
  let bestCount = 0;

  for (const [month, count] of monthCounts) {
    if (count > bestCount) {
      bestMonth = month;
      bestCount = count;
    }
  }

  return bestMonth;
}

// ---- Deadline Parsing ----

/**
 * Converts a date string (from raw_records.application_deadline) to epoch ms.
 * Returns undefined for undefined, null, empty, or invalid date strings.
 * Critical bridge: raw_records stores deadline as string, but extractYear()
 * and shouldArchive() expect numeric timestamps.
 */
export function parseDeadlineToTimestamp(
  deadline: string | undefined | null,
): number | undefined {
  if (deadline == null || deadline === "") return undefined;
  const parsed = Date.parse(deadline);
  if (Number.isNaN(parsed)) return undefined;
  return parsed;
}

// ---- Slug Generation ----

/**
 * Generates a URL-safe slug from a title.
 * Lowercase, replaces non-alphanumeric with hyphens, trims hyphens,
 * truncated to 80 characters.
 */
export function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}
