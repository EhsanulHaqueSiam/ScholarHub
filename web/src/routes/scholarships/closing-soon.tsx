import { createFileRoute } from "@tanstack/react-router";
import { usePaginatedQuery } from "convex/react";
import { EmptyState } from "@/components/directory/EmptyState";
import { FilterChips } from "@/components/directory/FilterChips";
import { FilterPanel } from "@/components/directory/FilterPanel";
import { ScholarshipCard } from "@/components/directory/ScholarshipCard";
import { ScholarshipListItem } from "@/components/directory/ScholarshipListItem";
import { SkeletonCard } from "@/components/directory/SkeletonCard";
import { SortPills } from "@/components/directory/SortPills";
import { ViewToggle } from "@/components/directory/ViewToggle";
import { BackToTop } from "@/components/layout/BackToTop";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { useScholarshipFilters } from "@/hooks/useScholarshipFilters";
import { scholarshipSearchSchema } from "@/lib/filters";
import { buildPageMeta } from "@/lib/seo/meta";
import { cn } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";

export const Route = createFileRoute("/scholarships/closing-soon")({
  validateSearch: scholarshipSearchSchema,
  head: () => {
    const { meta, links } = buildPageMeta({
      title: "Closing Soon -- Scholarships with Upcoming Deadlines | ScholarHub",
      description:
        "Scholarships with upcoming deadlines. Apply before it's too late. Browse scholarships closing within the next 30 days.",
      canonicalPath: "/scholarships/closing-soon",
    });
    return { meta, links };
  },
  component: ClosingSoonPage,
});

function ClosingSoonPage() {
  const { filters, queryArgs } = useScholarshipFilters();

  // Override: always show closing soon
  const closingSoonArgs = {
    ...queryArgs,
    closingSoon: true,
  };

  const { results, status, loadMore, isLoading } = usePaginatedQuery(
    api.directory.listScholarships,
    closingSoonArgs,
    { initialNumItems: 20 },
  );

  const isGridView = filters.view === "grid";
  const hasResults = results && results.length > 0;
  const isInitialLoading = isLoading && !results?.length;

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Header (no hero section for closing-soon) */}
      <section className="pt-20 pb-8 md:pt-24 md:pb-10 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-heading text-title md:text-display-sm leading-[1.1] text-foreground">
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
            <p className="text-sm font-base text-foreground/70" aria-live="polite">
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
                    <ScholarshipCard key={scholarship._id} scholarship={scholarship} />
                  ) : (
                    <ScholarshipListItem key={scholarship._id} scholarship={scholarship} />
                  ),
                )}
              </div>
            )}

            {/* Load More */}
            {status === "CanLoadMore" && (
              <div className="flex justify-center mt-8">
                <Button variant="neutral" size="lg" onClick={() => loadMore(20)}>
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
