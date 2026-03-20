import { createFileRoute } from "@tanstack/react-router";
import { usePaginatedQuery } from "convex/react";
import { anyApi } from "convex/server";
import { scholarshipSearchSchema } from "@/lib/filters";
import { useScholarshipFilters } from "@/hooks/useScholarshipFilters";
import { ScholarshipCard } from "@/components/directory/ScholarshipCard";
import { ScholarshipListItem } from "@/components/directory/ScholarshipListItem";
import { SkeletonCard } from "@/components/directory/SkeletonCard";
import { EmptyState } from "@/components/directory/EmptyState";
import { FilterPanel } from "@/components/directory/FilterPanel";
import { FilterChips } from "@/components/directory/FilterChips";
import { SortPills } from "@/components/directory/SortPills";
import { ViewToggle } from "@/components/directory/ViewToggle";
import { Navbar } from "@/components/layout/Navbar";
import { BackToTop } from "@/components/layout/BackToTop";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/scholarships/closing-soon")({
  validateSearch: scholarshipSearchSchema,
  head: () => ({
    meta: [
      { title: "Closing Soon -- Scholarships with Upcoming Deadlines -- ScholarHub" },
      {
        name: "description",
        content:
          "Scholarships with upcoming deadlines. Apply before it's too late. Browse scholarships closing within the next 30 days.",
      },
      { property: "og:title", content: "Closing Soon -- Scholarships with Upcoming Deadlines -- ScholarHub" },
      {
        property: "og:description",
        content: "Scholarships with upcoming deadlines. Apply before it's too late.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ClosingSoonPage,
});

function ClosingSoonPage() {
  const { filters, queryArgs } = useScholarshipFilters();

  // Override: always show closing soon
  const closingSoonArgs = {
    ...queryArgs,
    closingSoon: true,
    paginationOpts: undefined,
  };

  const { results, status, loadMore, isLoading } = usePaginatedQuery(
    anyApi.directory.listScholarships,
    closingSoonArgs as any,
    { initialNumItems: 20 },
  );

  const isGridView = filters.view === "grid";
  const hasResults = results && results.length > 0;
  const isInitialLoading = isLoading && !results?.length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header (no hero section for closing-soon) */}
      <section className="pt-20 pb-8 md:pt-24 md:pb-10 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-heading text-[32px] md:text-[40px] leading-[1.1] text-foreground">
            Closing Soon
          </h1>
          <p className="font-base text-base text-foreground/80 mt-3">
            Scholarships with upcoming deadlines. Apply before it's too late.
          </p>
        </div>
      </section>

      <div className="max-w-[1280px] mx-auto px-4 pb-16">
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
          {hasResults && (
            <p className="text-sm font-base text-foreground/70">
              {results.length} scholarship{results.length === 1 ? "" : "s"} closing soon
            </p>
          )}
        </div>

        {/* Content: sidebar + results */}
        <div className="flex gap-8">
          <FilterPanel />

          <div className="flex-1 min-w-0">
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
            {!isInitialLoading && !hasResults && (
              <EmptyState mostRestrictiveFilter="Closing Soon" />
            )}

            {/* Results grid/list */}
            {hasResults && (
              <div
                className={cn(
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

            {/* Load More */}
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

            {/* No more results */}
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
          </div>
        </div>
      </div>

      <BackToTop />
    </div>
  );
}
