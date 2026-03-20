import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  parseCommaSeparated,
  type ScholarshipSearch,
  serializeCommaSeparated,
} from "@/lib/filters";
import { useLocalStorage } from "./useLocalStorage";

/**
 * Hook bridging TanStack Router URL search params to Convex query arguments.
 *
 * Reads the current search params from the route, parses comma-separated values,
 * and returns:
 * - filters: The parsed filter state object with arrays instead of comma-separated strings
 * - queryArgs: The object shaped for the Convex listScholarships query args
 * - setFilter(key, value): Updates a specific filter in the URL
 * - clearFilters(): Removes all filters from URL
 * - removeFilter(key, value): Removes a specific value from a multi-select filter
 * - activeFilterCount: Number of active filters (for UI display)
 *
 * Persists nationality ("from") to localStorage for returning visitors.
 * Multi-select fundingTypes are passed as a full array to Convex query.
 */
export function useScholarshipFilters() {
  const search = useSearch({ strict: false }) as ScholarshipSearch;
  const navigate = useNavigate();
  const [savedNationality, setSavedNationality] = useLocalStorage<string | undefined>(
    "scholarhub_nationality",
    undefined,
  );

  // Parsed filter state
  const filters = {
    q: search.q,
    from: parseCommaSeparated(search.from ?? savedNationality),
    to: parseCommaSeparated(search.to),
    degree: parseCommaSeparated(search.degree),
    field: parseCommaSeparated(search.field),
    funding: parseCommaSeparated(search.funding),
    tier: parseCommaSeparated(search.tier),
    sort: search.sort ?? "deadline",
    view: search.view ?? "grid",
    showClosed: search.show_closed ?? false,
    showIneligible: search.show_ineligible ?? false,
    closingSoon: search.closing_soon ?? false,
  };

  // Convert to Convex query args
  // NOTE: fundingTypes is always an array (not single value) to support multi-select
  const queryArgs = {
    search: filters.q || undefined,
    status: "published" as const,
    hostCountries: filters.to.length > 0 ? filters.to : undefined,
    nationalities: filters.from.length > 0 && !filters.showIneligible ? filters.from : undefined,
    showIneligible: filters.showIneligible || undefined,
    degreeLevels:
      filters.degree.length > 0
        ? (filters.degree as Array<"bachelor" | "master" | "phd" | "postdoc">)
        : undefined,
    fieldsOfStudy: filters.field.length > 0 ? filters.field : undefined,
    fundingTypes:
      filters.funding.length > 0
        ? (filters.funding as Array<"fully_funded" | "partial" | "tuition_waiver" | "stipend_only">)
        : undefined, // ARRAY for multi-select
    prestigeTiers:
      filters.tier.length > 0
        ? (filters.tier as Array<"gold" | "silver" | "bronze" | "unranked">)
        : undefined,
    sort: filters.sort,
    showClosed: filters.showClosed || undefined,
    closingSoon: filters.closingSoon || undefined,
  };

  function setFilter(key: string, value: unknown) {
    // Persist nationality to localStorage
    if (key === "from" && typeof value === "string") {
      setSavedNationality(value || undefined);
    }
    navigate({
      search: (prev: Record<string, unknown>) => ({
        ...prev,
        [key]: value || undefined,
      }),
      replace: true,
      resetScroll: false,
    });
  }

  function clearFilters() {
    navigate({ search: {}, replace: true, resetScroll: false });
  }

  function removeFilter(key: string, valueToRemove: string) {
    const current = parseCommaSeparated(search[key as keyof ScholarshipSearch] as string);
    const updated = current.filter((v) => v !== valueToRemove);
    setFilter(key, serializeCommaSeparated(updated));
  }

  const activeFilterCount = [
    filters.from.length > 0,
    filters.to.length > 0,
    filters.degree.length > 0,
    filters.field.length > 0,
    filters.funding.length > 0,
    filters.tier.length > 0,
    filters.q,
    filters.showClosed,
    filters.closingSoon,
  ].filter(Boolean).length;

  return {
    filters,
    queryArgs,
    setFilter,
    clearFilters,
    removeFilter,
    activeFilterCount,
  };
}
