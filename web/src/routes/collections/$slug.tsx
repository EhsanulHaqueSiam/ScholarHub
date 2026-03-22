import { Link, createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { LayoutGrid, List } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CollectionHeader } from "@/components/collections/CollectionHeader";
import { DesktopPagination } from "@/components/directory/Pagination";
import { ScholarshipCard } from "@/components/directory/ScholarshipCard";
import { ScholarshipListItem } from "@/components/directory/ScholarshipListItem";
import { SkeletonCard } from "@/components/directory/SkeletonCard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BackToTop } from "@/components/layout/BackToTop";
import { Navbar } from "@/components/layout/Navbar";
import { SORT_OPTIONS } from "@/lib/filters";
import { cn } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";

const PAGE_SIZE = 20;

export const Route = createFileRoute("/collections/$slug")({
  head: ({ params }) => ({
    meta: [
      {
        title: `${params.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} | ScholarHub`,
      },
    ],
  }),
  component: CollectionDetailPage,
});

/** Skeleton header for collection detail loading state */
function CollectionHeaderSkeleton() {
  return (
    <div className="flex flex-col items-center text-center gap-4 motion-safe:animate-pulse">
      <div className="w-20 h-20 rounded-full bg-border/20" />
      <div className="h-7 bg-border/20 rounded-base w-48" />
      <div className="h-4 bg-border/20 rounded-base w-64" />
      <div className="h-5 bg-border/20 rounded-base w-24" />
    </div>
  );
}

function CollectionDetailPage() {
  const { slug } = Route.useParams();

  // Collection metadata
  const collection = useQuery(api.collections.getCollectionBySlug, { slug });

  // Local state
  const [sort, setSort] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);

  // Derive effective sort from collection default or user override
  const effectiveSort = sort ?? collection?.default_sort ?? "deadline";

  // Collection scholarships query
  const scholarshipData = useQuery(
    api.collections.getCollectionScholarships,
    collection
      ? {
          slug,
          sort: effectiveSort,
          limit: PAGE_SIZE,
          offset: (currentPage - 1) * PAGE_SIZE,
        }
      : "skip",
  );

  // Update page title once collection name is loaded
  useEffect(() => {
    if (collection && typeof document !== "undefined") {
      document.title = `${collection.name} | ScholarHub`;
    }
  }, [collection]);

  // View counter with localStorage debounce (once per 30 minutes per collection)
  const recordView = useMutation(api.collections.recordCollectionView);
  useEffect(() => {
    if (!collection) return;
    const key = `collection_view_${slug}`;
    const lastView = localStorage.getItem(key);
    const thirtyMinutes = 30 * 60 * 1000;
    if (!lastView || Date.now() - Number(lastView) > thirtyMinutes) {
      localStorage.setItem(key, String(Date.now()));
      recordView({ slug });
    }
  }, [slug, collection, recordView]);

  // Reset page when sort changes
  const handleSortChange = useCallback((value: string) => {
    if (value) {
      setSort(value);
      setCurrentPage(1);
    }
  }, []);

  const isLoading = collection === undefined;
  const isNotFound = collection === null;
  const scholarships = scholarshipData?.scholarships;
  const total = scholarshipData?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasResults = scholarships && scholarships.length > 0;
  const isGridView = view === "grid";

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-20 pb-16 px-4">
          <div className="max-w-[1280px] mx-auto space-y-8">
            <CollectionHeaderSkeleton />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not found / error state
  if (isNotFound) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-20 px-4">
          <div className="max-w-3xl mx-auto text-center py-16">
            <h1 className="font-heading text-[32px] mb-4">Collection Not Found</h1>
            <p className="text-foreground/70 mb-8">
              This collection could not be loaded. It may have been archived or removed.
            </p>
            <Link
              to="/collections"
              className="inline-flex items-center justify-center rounded-base border-2 border-border bg-main px-6 py-3 text-sm font-base text-main-foreground shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none transition-all"
            >
              Browse All Collections
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-20 pb-16 px-4">
        <div className="max-w-[1280px] mx-auto space-y-8">
          {/* Collection header */}
          <CollectionHeader collection={collection} />

          {/* Sort pills + View toggle */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Sort pills */}
              <ToggleGroup.Root
                type="single"
                value={effectiveSort}
                onValueChange={handleSortChange}
                className="flex flex-wrap gap-2"
              >
                {SORT_OPTIONS.map((option) => {
                  const isActive = effectiveSort === option.value;
                  return (
                    <ToggleGroup.Item
                      key={option.value}
                      value={option.value}
                      aria-label={`Sort by ${option.label}${isActive ? ", currently active" : ""}`}
                      className={cn(
                        "inline-flex items-center rounded-base border-2 px-3 py-2 text-sm font-base transition-all min-h-[44px] shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none",
                        isActive
                          ? "bg-main text-main-foreground border-border"
                          : "bg-secondary-background text-foreground border-border",
                      )}
                    >
                      {option.label}
                    </ToggleGroup.Item>
                  );
                })}
              </ToggleGroup.Root>

              {/* View toggle */}
              <ToggleGroup.Root
                type="single"
                value={view}
                onValueChange={(v) => {
                  if (v === "grid" || v === "list") setView(v);
                }}
                className="flex gap-1"
              >
                <ToggleGroup.Item
                  value="grid"
                  aria-label="Switch to grid view"
                  className={cn(
                    "inline-flex items-center justify-center rounded-base border-2 p-2 transition-all min-h-[44px] min-w-[44px] shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none",
                    view === "grid"
                      ? "bg-main text-main-foreground border-border"
                      : "bg-secondary-background text-foreground border-border",
                  )}
                >
                  <LayoutGrid className="size-4" />
                </ToggleGroup.Item>
                <ToggleGroup.Item
                  value="list"
                  aria-label="Switch to list view"
                  className={cn(
                    "inline-flex items-center justify-center rounded-base border-2 p-2 transition-all min-h-[44px] min-w-[44px] shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none",
                    view === "list"
                      ? "bg-main text-main-foreground border-border"
                      : "bg-secondary-background text-foreground border-border",
                  )}
                >
                  <List className="size-4" />
                </ToggleGroup.Item>
              </ToggleGroup.Root>
            </div>

            {/* Results count */}
            <p
              className="text-sm font-heading text-foreground border-2 border-border rounded-base px-3 py-1.5 bg-secondary-background"
              aria-live="polite"
            >
              {total} scholarship{total === 1 ? "" : "s"}
            </p>
          </div>

          {/* Scholarship listing */}
          <ErrorBoundary>
            {/* Loading skeleton for scholarship data */}
            {scholarshipData === undefined && (
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
            {scholarshipData && !hasResults && (
              <div className="flex flex-col items-center text-center py-12 px-4">
                <h2 className="font-heading text-xl">No scholarships in this collection</h2>
                <p className="text-sm mt-3 max-w-md">
                  Check back later as new scholarships are added regularly.
                </p>
                <Link
                  to="/scholarships"
                  className="mt-6 inline-flex items-center justify-center rounded-base border-2 border-border bg-main px-6 py-3 text-sm font-base text-main-foreground shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none transition-all"
                >
                  Browse All Scholarships
                </Link>
              </div>
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
                {scholarships.map((scholarship) =>
                  isGridView ? (
                    <ScholarshipCard key={scholarship._id} scholarship={scholarship} />
                  ) : (
                    <ScholarshipListItem key={scholarship._id} scholarship={scholarship} />
                  ),
                )}
              </div>
            )}

            {/* Pagination */}
            <DesktopPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
            {hasResults && totalPages > 1 && (
              <p className="text-center text-sm text-foreground/60 mt-4">
                Showing {scholarships.length} of {total} scholarships
              </p>
            )}
          </ErrorBoundary>
        </div>
      </div>

      <BackToTop />
    </div>
  );
}
