import { createFileRoute } from "@tanstack/react-router";
import { usePaginatedQuery, useQuery } from "convex/react";
import { anyApi } from "convex/server";
import { Search } from "lucide-react";
import { useState, useCallback, type ErrorInfo, type ReactNode, Component } from "react";
import { scholarshipSearchSchema } from "@/lib/filters";
import { getCountryName, getCountryFlag } from "@/lib/countries";
import { useScholarshipFilters } from "@/hooks/useScholarshipFilters";
import { ScholarshipCard } from "@/components/directory/ScholarshipCard";
import { ScholarshipListItem } from "@/components/directory/ScholarshipListItem";
import { SkeletonCard } from "@/components/directory/SkeletonCard";
import { EmptyState } from "@/components/directory/EmptyState";
import { FeaturedRow } from "@/components/directory/FeaturedRow";
import { SearchBar } from "@/components/directory/SearchBar";
import { EligibilityFilterBar } from "@/components/directory/EligibilityFilterBar";
import { NationalityBanner } from "@/components/directory/NationalityBanner";
import { FilterPanel } from "@/components/directory/FilterPanel";
import { FilterChips } from "@/components/directory/FilterChips";
import { QuickFilters } from "@/components/directory/QuickFilters";
import { SortPills } from "@/components/directory/SortPills";
import { ViewToggle } from "@/components/directory/ViewToggle";
import { Navbar } from "@/components/layout/Navbar";
import { BackToTop } from "@/components/layout/BackToTop";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
    const parts: string[] = [];
    if (search.degree) parts.push(formatDegree(search.degree));
    parts.push("Scholarships");
    if (search.to) parts.push(`in ${formatCountries(search.to)}`);
    if (search.from) parts.push(`for ${formatNationalities(search.from)} Students`);
    const title = parts.join(" ") + " -- ScholarHub";
    const description = `Browse international scholarships${search.to ? ` in ${formatCountries(search.to)}` : ""}. Filter by degree, funding, and eligibility.`;

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

// --- Error boundary for results ---

interface ErrorBoundaryState {
  hasError: boolean;
}

class ResultsErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ResultsErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="border-2 border-[oklch(55%_0.22_25)] rounded-base p-6 text-center">
          <p className="text-sm font-base mb-3">
            Unable to load scholarships. Check your connection and try again.
          </p>
          <Button
            variant="default"
            size="sm"
            onClick={() => this.setState({ hasError: false })}
          >
            Retry
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

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
    anyApi.directory.listScholarships,
    { ...queryArgs, paginationOpts: undefined } as any,
    { initialNumItems: 20 },
  );

  // Total scholarship count for trust signal
  const totalCount = useQuery(anyApi.directory.getScholarshipCount, {});

  // Handle search
  const handleSearch = useCallback(
    (query: string) => {
      setFilter("q", query || undefined);
    },
    [setFilter],
  );

  const isGridView = filters.view === "grid";
  const hasResults = results && results.length > 0;
  const isInitialLoading = isLoading && !results?.length;

  return (
    <div className="min-h-screen bg-background">
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
            Find fully funded scholarships you qualify for. Filter by country,
            degree, and prestige.
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
          <FeaturedRow
            nationalities={
              filters.from.length > 0 ? filters.from : undefined
            }
          />
        </div>

        {/* Quick Filters */}
        <div className="mb-4">
          <QuickFilters />
        </div>

        {/* Filter Chips */}
        <div className="mb-4">
          <FilterChips />
        </div>

        {/* Sort + View + Count row */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <SortPills />
            <ViewToggle />
          </div>
          <p className="text-sm font-base text-foreground/70">
            {formatResultsCount(results?.length, filters)}
          </p>
        </div>

        {/* Content: sidebar + results */}
        <div className="flex gap-8">
          {/* Filter Panel (desktop sidebar / mobile bottom sheet trigger) */}
          <FilterPanel />

          {/* Results area */}
          <div className="flex-1 min-w-0">
            <ResultsErrorBoundary>
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
                      <ScholarshipCard
                        key={scholarship._id}
                        scholarship={scholarship}
                      />
                    ) : (
                      <ScholarshipListItem
                        key={scholarship._id}
                        scholarship={scholarship}
                      />
                    ),
                  )}
                </div>
              )}

              {/* Load More button */}
              {status === "CanLoadMore" && (
                <div className="flex justify-center mt-8">
                  <Button
                    variant="neutral"
                    size="lg"
                    onClick={() => loadMore(20)}
                  >
                    Load More Scholarships
                  </Button>
                </div>
              )}

              {/* No more results message */}
              {status === "Exhausted" && hasResults && (
                <p className="text-center text-sm text-foreground/60 mt-8">
                  You've seen all {results.length} matching scholarships
                </p>
              )}

              {/* Loading more skeleton */}
              {status === "LoadingMore" && (
                <div
                  className={cn(
                    "mt-6",
                    isGridView
                      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                      : "flex flex-col gap-4",
                  )}
                >
                  {Array.from({ length: 3 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              )}
            </ResultsErrorBoundary>
          </div>
        </div>
      </div>

      <BackToTop />
    </div>
  );
}
