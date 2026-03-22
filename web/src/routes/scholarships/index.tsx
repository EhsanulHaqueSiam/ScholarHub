import { createFileRoute } from "@tanstack/react-router";
import { usePaginatedQuery, useQuery } from "convex/react";
import { useCallback, useMemo, useState } from "react";
import { EligibilityFilterBar } from "@/components/directory/EligibilityFilterBar";
import { EmptyState } from "@/components/directory/EmptyState";
import { FeaturedRow } from "@/components/directory/FeaturedRow";
import { FilterChips } from "@/components/directory/FilterChips";
import { FilterPanel, MobileFilterTrigger } from "@/components/directory/FilterPanel";
import { NationalityBanner } from "@/components/directory/NationalityBanner";
import { DesktopPagination, MobileInfiniteScroll } from "@/components/directory/Pagination";
import { QuickFilters } from "@/components/directory/QuickFilters";
import { ScholarshipCard } from "@/components/directory/ScholarshipCard";
import { ScholarshipListItem } from "@/components/directory/ScholarshipListItem";
import { SearchBar } from "@/components/directory/SearchBar";
import { SkeletonCard } from "@/components/directory/SkeletonCard";
import { SortPills } from "@/components/directory/SortPills";
import { ViewToggle } from "@/components/directory/ViewToggle";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BackToTop } from "@/components/layout/BackToTop";
import { Navbar } from "@/components/layout/Navbar";
import { useScholarshipFilters } from "@/hooks/useScholarshipFilters";
import { getCountryFlag, getCountryName } from "@/lib/countries";
import { scholarshipSearchSchema } from "@/lib/filters";
import { cn } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";

// --- Helper functions for dynamic meta tags ---

function formatDegree(degreeParam: string | undefined): string {
  if (!degreeParam) return "";
  const labels: Record<string, string> = {
    bachelor: "Bachelor",
    master: "Master's",
    phd: "PhD",
    postdoc: "Postdoc",
  };
  return degreeParam
    .split(",")
    .map((d) => labels[d.trim()] ?? d.trim())
    .join(" & ");
}

function formatCountries(param: string | undefined): string {
  if (!param) return "";
  return param
    .split(",")
    .map((code) => getCountryName(code.trim()))
    .join(", ");
}

function formatNationalities(param: string | undefined): string {
  if (!param) return "";
  return param
    .split(",")
    .map((code) => getCountryName(code.trim()))
    .join(", ");
}

// --- Route definition ---

export const Route = createFileRoute("/scholarships/")({
  validateSearch: scholarshipSearchSchema,
  head: ({ search }) => {
    const s = search ?? {};
    const parts: string[] = [];
    if (s.degree) parts.push(formatDegree(s.degree));
    parts.push("Scholarships");
    if (s.to) parts.push(`in ${formatCountries(s.to)}`);
    if (s.from) parts.push(`for ${formatNationalities(s.from)} Students`);
    const title = parts.join(" ") + " -- ScholarHub";
    const description = `Browse international scholarships${s.to ? ` in ${formatCountries(s.to)}` : ""}. Filter by degree, funding, and eligibility.`;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
      ],
    };
  },
  component: ScholarshipsDirectory,
});

// --- Helper: format results count ---

function formatResultsCount(
  count: number | undefined,
  filters: ReturnType<typeof useScholarshipFilters>["filters"],
): string {
  if (count === undefined) return "Loading...";
  const parts: string[] = [`${count} scholarship${count === 1 ? "" : "s"}`];
  if (filters.from.length > 0) {
    const flags = filters.from.map((c) => getCountryFlag(c)).join("");
    parts.push(`for ${flags} ${filters.from.map((c) => getCountryName(c)).join(", ")}`);
  }
  if (filters.to.length > 0) {
    const flags = filters.to.map((c) => getCountryFlag(c)).join("");
    parts.push(`in ${flags} ${filters.to.map((c) => getCountryName(c)).join(", ")}`);
  }
  return parts.join(" ");
}

// --- Page component ---

function ScholarshipsDirectory() {
  const { filters, queryArgs, setFilter } = useScholarshipFilters();
  const [isFilterChanging, setIsFilterChanging] = useState(false);

  // Paginated scholarship results
  const { results, status, loadMore, isLoading } = usePaginatedQuery(
    api.directory.listScholarships,
    queryArgs,
    { initialNumItems: 20 },
  );

  // Total scholarship count for trust signal
  const totalCount = useQuery(api.directory.getScholarshipCount, {});

  // Handle search — fires on user Enter/submit (suggestions are already debounced in SearchBar)
  const handleSearch = useCallback(
    (query: string) => {
      setFilter("q", query || undefined);
    },
    [setFilter],
  );

  // Stabilize nationalities array reference for FeaturedRow memo
  const featuredNationalities = useMemo(
    () => (filters.from.length > 0 ? filters.from : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters.from.join()],
  );

  const isGridView = filters.view === "grid";
  const hasResults = results && results.length > 0;
  const isInitialLoading = isLoading && !results?.length;

  return (
    <div className="min-h-screen">
      {/* Skip to results link for keyboard/screen reader users */}
      <a
        href="#results"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:start-2 focus:z-50 bg-main text-main-foreground px-4 py-2 rounded-base"
      >
        Skip to results
      </a>

      <Navbar />

      {/* Hero Section */}
      <section className="pt-20 pb-12 md:pt-24 md:pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <h1 className="font-heading text-[32px] md:text-[48px] leading-[1.1] text-foreground">
            Browse{" "}
            {totalCount !== undefined ? (
              <span>{totalCount.toLocaleString()}+</span>
            ) : (
              <span>2,400+</span>
            )}{" "}
            International Scholarships
          </h1>
          <p className="font-base text-base md:text-lg text-foreground/80 max-w-2xl mx-auto">
            Find fully funded scholarships you qualify for. Filter by country, degree, and prestige.
          </p>
          <div className="max-w-xl mx-auto pt-2">
            <SearchBar onSearch={handleSearch} defaultValue={filters.q ?? ""} />
          </div>
        </div>
      </section>

      {/* Nationality Banner */}
      <div className="max-w-5xl mx-auto px-4 mb-4">
        <NationalityBanner />
      </div>

      {/* Eligibility Filter Bar */}
      <div className="max-w-5xl mx-auto px-4 mb-6">
        <EligibilityFilterBar />
      </div>

      {/* Directory Section */}
      <div className="max-w-[1280px] mx-auto px-4 pb-16">
        {/* Featured Row */}
        <div className="mb-8">
          <FeaturedRow nationalities={featuredNationalities} />
        </div>

        {/* Quick Filters */}
        <div className="mb-4">
          <QuickFilters />
        </div>

        {/* Filter Chips */}
        <div className="mb-4">
          <FilterChips />
        </div>

        {/* Mobile floating filter FAB — position:fixed, outside layout flow */}
        <MobileFilterTrigger />

        {/* Sort + View + Count row */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <SortPills />
            <ViewToggle />
          </div>
          <p
            className="text-sm font-heading text-foreground border-2 border-border rounded-base px-3 py-1.5 bg-secondary-background"
            aria-live="polite"
          >
            {totalCount !== undefined && !filters.q
              ? formatResultsCount(totalCount, filters)
              : status === "CanLoadMore"
                ? formatResultsCount(results?.length, filters) + "+"
                : formatResultsCount(results?.length, filters)}
          </p>
        </div>

        {/* Content: sidebar + results */}
        <div className="flex gap-8">
          {/* Filter Panel (desktop sidebar / mobile bottom sheet trigger) */}
          <FilterPanel />

          {/* Results area */}
          <div id="results" className="flex-1 min-w-0">
            <ErrorBoundary>
              {/* Initial loading skeleton */}
              {isInitialLoading && (
                <div
                  className={cn(
                    isGridView
                      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                      : "flex flex-col gap-4",
                  )}
                >
                  {Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!isInitialLoading && !hasResults && <EmptyState />}

              {/* Results grid/list */}
              {hasResults && (
                <div
                  className={cn(
                    "transition-opacity duration-200",
                    isFilterChanging ? "opacity-50" : "opacity-100",
                    isGridView
                      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                      : "flex flex-col gap-4",
                  )}
                >
                  {results.map((scholarship) =>
                    isGridView ? (
                      <ScholarshipCard key={scholarship._id} scholarship={scholarship} />
                    ) : (
                      <ScholarshipListItem key={scholarship._id} scholarship={scholarship} />
                    ),
                  )}
                </div>
              )}

              {/* Loading more skeleton (desktop only — mobile uses inline spinner) */}
              {status === "LoadingMore" && (
                <div
                  className={cn(
                    "mt-6 hidden lg:grid",
                    isGridView
                      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                      : "grid-cols-1 gap-4",
                  )}
                >
                  {Array.from({ length: 3 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              )}

              {/* Mobile: Infinite scroll with auto-loading sentinel */}
              <div className="lg:hidden">
                <MobileInfiniteScroll
                  totalLoaded={results?.length ?? 0}
                  status={status}
                  loadMore={loadMore}
                />
              </div>

              {/* Desktop: Numbered pagination */}
              <div className="hidden lg:block">
                <DesktopPagination
                  totalLoaded={results?.length ?? 0}
                  status={status}
                  loadMore={loadMore}
                />
                {status === "Exhausted" && hasResults && (
                  <p className="text-center text-sm text-foreground/60 mt-4">
                    You've seen all {results.length} matching scholarships
                  </p>
                )}
              </div>
            </ErrorBoundary>
          </div>
        </div>
      </div>

      <BackToTop />
    </div>
  );
}
