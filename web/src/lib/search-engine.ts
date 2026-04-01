/**
 * Client-side search engine replacing Convex search index queries.
 *
 * Uses a simple trigram + token matching approach (no external deps).
 * Replaces api.directory.searchSuggestions and search-mode listScholarships.
 */

import type { ScholarshipSummary } from "./scholarship-summary";

interface SearchIndex {
  items: ScholarshipSummary[];
  tokenMap: Map<string, Set<number>>;
}

let _index: SearchIndex | null = null;

/** Tokenize text into lowercase words */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

/** Build a search index from scholarship summaries */
export function buildSearchIndex(items: ScholarshipSummary[]): void {
  const tokenMap = new Map<string, Set<number>>();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const text = [
      item.title,
      item.description,
      item.provider_organization,
      item.host_country,
      ...(item.eligibility_nationalities ?? []),
      ...(item.fields_of_study ?? []),
    ]
      .filter(Boolean)
      .join(" ");

    const tokens = tokenize(text);
    for (const token of tokens) {
      let set = tokenMap.get(token);
      if (!set) {
        set = new Set();
        tokenMap.set(token, set);
      }
      set.add(i);
    }
  }

  _index = { items, tokenMap };
}

/** Search scholarships by query string */
export function search(
  query: string,
  limit = 20,
): ScholarshipSummary[] {
  if (!_index || !query.trim()) return [];

  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  // Score each item by how many query tokens it matches
  const scores = new Map<number, number>();

  for (const token of queryTokens) {
    // Exact token match
    const exact = _index.tokenMap.get(token);
    if (exact) {
      for (const idx of exact) {
        scores.set(idx, (scores.get(idx) ?? 0) + 3);
      }
    }

    // Prefix match (for autocomplete)
    if (token.length >= 3) {
      for (const [key, indices] of _index.tokenMap) {
        if (key.startsWith(token) && key !== token) {
          for (const idx of indices) {
            scores.set(idx, (scores.get(idx) ?? 0) + 1);
          }
        }
      }
    }
  }

  // Sort by score descending
  const results = [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([idx]) => _index!.items[idx]);

  return results;
}

/** Get search suggestions (title + country + slug) */
export function searchSuggestions(
  query: string,
  limit = 5,
): Array<{ _id: string; title: string; host_country: string; slug?: string }> {
  const results = search(query, limit);
  return results.map((r) => ({
    _id: r._id,
    title: r.title,
    host_country: r.host_country,
    slug: r.slug,
  }));
}

/** Check if search index is ready */
export function isSearchReady(): boolean {
  return _index !== null;
}
