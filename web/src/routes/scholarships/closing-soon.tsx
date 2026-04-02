import { createFileRoute } from "@tanstack/react-router";
import { usePaginatedQuery } from "convex/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { EmptyState } from "@/components/directory/EmptyState";
import { FilterChips } from "@/components/directory/FilterChips";
import { FilterPanel } from "@/components/directory/FilterPanel";
import { DesktopPagination } from "@/components/directory/Pagination";
import { ScholarshipCard } from "@/components/directory/ScholarshipCard";
import { ScholarshipListItem } from "@/components/directory/ScholarshipListItem";
import { SkeletonCard } from "@/components/directory/SkeletonCard";
import { SortPills } from "@/components/directory/SortPills";
import { ViewToggle } from "@/components/directory/ViewToggle";
import { BackToTop } from "@/components/layout/BackToTop";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { useStaticData } from "@/hooks/useStaticData";
import { useScholarshipFilters } from "@/hooks/useScholarshipFilters";
import { scholarshipSearchSchema } from "@/lib/filters";
import { buildPageMeta } from "@/lib/seo/meta";
import { filterScholarships } from "@/lib/static-data";
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

const PAGE_SIZE = 20;

function ClosingSoonPage() {
  const { filters, queryArgs } = useScholarshipFilters();
  const { data: staticData, isLoading: isStaticDataLoading } = useStaticData();
  const [desktopPage, setDesktopPage] = useState(1);
  const [mobilePagesLoaded, setMobilePagesLoaded] = useState(1);
  const desktopLoadRequestRef = useRef<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Override: always show closing soon
  const closingSoonArgs = {
    ...queryArgs,
    closingSoon: true,
  };
  const querySignature = JSON.stringify(closingSoonArgs);

  const shouldUseConvex = !isStaticDataLoading && !staticData;
  const useStaticResults = !!staticData;
  const {
    results: convexResults,
    status: convexStatus,
    loadMore: loadMoreConvex,
    isLoading: isLoadingConvex,
  } = usePaginatedQuery(
    api.directory.listScholarships,
    shouldUseConvex ? closingSoonArgs : "skip",
    { initialNumItems: PAGE_SIZE },
  );
  const staticWindow = useMemo(() => {
    if (!staticData) return null;
    const limit = isDesktop ? PAGE_SIZE : mobilePagesLoaded * PAGE_SIZE;
    const offset = isDesktop ? (desktopPage - 1) * PAGE_SIZE : 0;
    return filterScholarships(staticData, {
      search: closingSoonArgs.search,
      hostCountries: closingSoonArgs.hostCountries,
      nationalities: closingSoonArgs.nationalities,
      showIneligible: closingSoonArgs.showIneligible,
      degreeLevels: closingSoonArgs.degreeLevels,
      fieldsOfStudy: closingSoonArgs.fieldsOfStudy,
      fundingTypes: closingSoonArgs.fundingTypes,
      prestigeTiers: closingSoonArgs.prestigeTiers,
      scholarshipTypes: closingSoonArgs.scholarshipTypes,
      tags: closingSoonArgs.tags,
      sort: closingSoonArgs.sort,
      showClosed: closingSoonArgs.showClosed,
      closingSoon: true,
      limit,
      offset,
    });
  }, [staticData, closingSoonArgs, isDesktop, mobilePagesLoaded, desktopPage]);

  useEffect(() => {
    setDesktopPage(1);
    setMobilePagesLoaded(1);
    desktopLoadRequestRef.current = null;
  }, [querySignature]);

  const totalAvailable = useStaticResults ? (staticWindow?.total ?? 0) : (convexResults?.length ?? 0);
  const loadedPages = Math.max(1, Math.ceil(totalAvailable / PAGE_SIZE));
  const desktopTotalPages = useStaticResults
    ? loadedPages
    : convexStatus === "CanLoadMore"
      ? loadedPages + 1
      : loadedPages;
  const mobileHasMore = useStaticResults
    ? mobilePagesLoaded * PAGE_SIZE < totalAvailable
    : convexStatus === "CanLoadMore";
  const hasUnknownRemaining =
    !useStaticResults && (convexStatus === "CanLoadMore" || convexStatus === "LoadingMore");
  const neededForDesktopPage = desktopPage * PAGE_SIZE;
  const isPageDataLoading =
    !useStaticResults &&
    isDesktop &&
    totalAvailable < neededForDesktopPage &&
    (convexStatus === "CanLoadMore" || convexStatus === "LoadingMore");

  useEffect(() => {
    if (useStaticResults) return;
    if (!isDesktop || convexStatus !== "CanLoadMore") return;
    if (totalAvailable >= neededForDesktopPage) return;
    const requestAmount = Math.max(PAGE_SIZE, neededForDesktopPage - totalAvailable);
    const requestKey = `${querySignature}:${desktopPage}:${totalAvailable}:${requestAmount}`;
    if (desktopLoadRequestRef.current === requestKey) return;
    desktopLoadRequestRef.current = requestKey;
    loadMoreConvex(requestAmount);
  }, [
    useStaticResults,
    isDesktop,
    convexStatus,
    totalAvailable,
    neededForDesktopPage,
    loadMoreConvex,
    querySignature,
    desktopPage,
  ]);
  useEffect(() => {
    setDesktopPage((page) => Math.min(page, desktopTotalPages));
  }, [desktopTotalPages]);

  const results = useMemo(() => {
    if (useStaticResults) return staticWindow?.scholarships;
    if (!convexResults) return undefined;
    if (isDesktop) {
      const pageSlice = convexResults.slice((desktopPage - 1) * PAGE_SIZE, desktopPage * PAGE_SIZE);
      if (pageSlice.length === 0 && isPageDataLoading) return undefined;
      return pageSlice;
    }
    return convexResults.slice(0, mobilePagesLoaded * PAGE_SIZE);
  }, [
    useStaticResults,
    staticWindow,
    convexResults,
    isDesktop,
    desktopPage,
    mobilePagesLoaded,
    isPageDataLoading,
  ]);

  const status = useStaticResults
    ? mobileHasMore
      ? "CanLoadMore"
      : "Exhausted"
    : convexStatus;
  const isLoading = useStaticResults ? false : isLoadingConvex;

  const isGridView = filters.view === "grid";
  const hasResults = !!results && results.length > 0;
  const isInitialLoading =
    (useStaticResults ? false : isStaticDataLoading || (isLoading && !results?.length)) ||
    isPageDataLoading;

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
              {hasUnknownRemaining ? `${totalAvailable}+` : totalAvailable} scholarship
              {totalAvailable === 1 ? "" : "s"} closing soon
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

            {/* Mobile: Load More */}
            {mobileHasMore && (
              <div className="lg:hidden flex justify-center mt-8">
                <Button
                  variant="neutral"
                  size="lg"
                  onClick={() => {
                    if (!useStaticResults) {
                      if (status !== "CanLoadMore") return;
                      loadMoreConvex(PAGE_SIZE);
                    }
                    setMobilePagesLoaded((page) => page + 1);
                  }}
                  disabled={!useStaticResults && status !== "CanLoadMore"}
                >
                  Load More Scholarships
                </Button>
              </div>
            )}

            {/* No more results */}
            {status === "Exhausted" && hasResults && !isDesktop && (
              <p className="text-center text-sm text-foreground/60 mt-8">
                You've seen all {results.length} matching scholarships
              </p>
            )}

            {/* Loading more skeleton */}
            {!useStaticResults && status === "LoadingMore" && (
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

            {/* Desktop: Numbered pagination */}
            <div className="hidden lg:block">
              <DesktopPagination
                currentPage={desktopPage}
                totalPages={desktopTotalPages}
                onPageChange={setDesktopPage}
              />
              {hasResults && (
                <p className="text-center text-sm text-foreground/60 mt-4">
                  Showing {results.length} of{" "}
                  {hasUnknownRemaining ? `${totalAvailable}+` : totalAvailable} matching
                  scholarships
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <BackToTop />
    </div>
  );
}
