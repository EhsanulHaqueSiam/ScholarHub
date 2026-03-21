import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

interface PaginationProps {
  /** Total number of results loaded so far */
  totalLoaded: number;
  /** Convex pagination status */
  status: "LoadingFirstPage" | "CanLoadMore" | "LoadingMore" | "Exhausted";
  /** Callback to load more results */
  loadMore: (numItems: number) => void;
}

type PageItem = { type: "page"; page: number } | { type: "ellipsis"; key: string };

/**
 * Desktop numbered pagination.
 *
 * Since Convex uses cursor-based pagination, we can only navigate forward.
 * This shows page indicators for loaded pages plus a "next" button to load more.
 * Clicking a loaded page number scrolls to that section of results.
 */
export function DesktopPagination({ totalLoaded, status, loadMore }: PaginationProps) {
  const totalPages = Math.ceil(totalLoaded / PAGE_SIZE);
  const isLoadingMore = status === "LoadingMore";
  const canLoadMore = status === "CanLoadMore";
  const isExhausted = status === "Exhausted";

  if (totalPages === 0) return null;

  const items = generatePageItems(totalPages, canLoadMore);

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-2 mt-10">
      {/* Previous page indicator (disabled since we always show from start) */}
      <button
        type="button"
        disabled
        className="inline-flex items-center justify-center size-10 rounded-base border-2 border-border bg-secondary-background text-foreground/30 cursor-not-allowed"
        aria-label="Previous page"
      >
        <ChevronLeft className="size-4" />
      </button>

      {/* Page numbers */}
      {items.map((item) => {
        if (item.type === "ellipsis") {
          return (
            <span
              key={item.key}
              className="inline-flex items-center justify-center size-10 text-foreground/60 font-heading text-sm select-none"
            >
              ...
            </span>
          );
        }

        const isCurrentPage = item.page === totalPages;
        return (
          <button
            key={item.page}
            type="button"
            onClick={() => {
              const resultsEl = document.getElementById("results");
              if (resultsEl) {
                const cardHeight = 340;
                const cardsPerRow =
                  window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1;
                const rowsPerPage = Math.ceil(PAGE_SIZE / cardsPerRow);
                const offset = (item.page - 1) * rowsPerPage * cardHeight;
                const targetY = resultsEl.offsetTop + offset;
                window.scrollTo({ top: targetY, behavior: "smooth" });
              }
            }}
            aria-label={`Page ${item.page}`}
            aria-current={isCurrentPage ? "page" : undefined}
            className={cn(
              "inline-flex items-center justify-center size-10 rounded-base border-2 border-border font-heading text-sm transition-all",
              isCurrentPage
                ? "bg-main text-main-foreground shadow-shadow"
                : "bg-secondary-background text-foreground shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none",
            )}
          >
            {item.page}
          </button>
        );
      })}

      {/* Next page / Load more button */}
      <button
        type="button"
        disabled={!canLoadMore || isLoadingMore}
        onClick={() => {
          if (canLoadMore) loadMore(PAGE_SIZE);
        }}
        aria-label={canLoadMore ? "Load next page" : "No more pages"}
        className={cn(
          "inline-flex items-center justify-center size-10 rounded-base border-2 border-border font-heading text-sm transition-all",
          canLoadMore && !isLoadingMore
            ? "bg-secondary-background text-foreground shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none"
            : "bg-secondary-background text-foreground/30 cursor-not-allowed",
        )}
      >
        {isLoadingMore ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <ChevronRight className="size-4" />
        )}
      </button>

      {/* Page info */}
      {isExhausted && totalPages > 0 && (
        <span className="ml-3 text-sm font-base text-foreground/60">
          {totalPages} {totalPages === 1 ? "page" : "pages"} total
        </span>
      )}
    </nav>
  );
}

/**
 * Mobile infinite scroll sentinel.
 *
 * Renders an invisible sentinel div that triggers `loadMore` when it enters
 * the viewport. Shows a loading spinner while more results are loading.
 */
export function MobileInfiniteScroll({ totalLoaded, status, loadMore }: PaginationProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isLoadingMore = status === "LoadingMore";
  const canLoadMore = status === "CanLoadMore";

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || status !== "CanLoadMore") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore(PAGE_SIZE);
        }
      },
      { rootMargin: "300px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [status, loadMore]);

  return (
    <div className="flex flex-col items-center mt-8 gap-4">
      {/* Sentinel element — invisible trigger point */}
      {canLoadMore && <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />}

      {/* Loading indicator */}
      {isLoadingMore && (
        <div className="flex items-center gap-3 py-4">
          <Loader2 className="size-5 animate-spin text-main" />
          <span className="text-sm font-base text-foreground/60">Loading more scholarships...</span>
        </div>
      )}

      {/* End of results */}
      {status === "Exhausted" && totalLoaded > 0 && (
        <p className="text-center text-sm text-foreground/60">
          You've seen all {totalLoaded} matching scholarships
        </p>
      )}
    </div>
  );
}

/**
 * Generate an array of page items with uniquely-keyed ellipsis markers.
 * e.g., [page(1), page(2), ellipsis("mid"), page(9), page(10), ellipsis("more")]
 */
function generatePageItems(totalPages: number, hasMore: boolean): PageItem[] {
  const maxVisible = 5;

  // Few enough pages to show all of them
  if (totalPages <= maxVisible) {
    const items: PageItem[] = Array.from({ length: totalPages }, (_, i) => ({
      type: "page" as const,
      page: i + 1,
    }));
    if (hasMore) {
      items.push({ type: "ellipsis", key: "ellipsis-more" });
    }
    return items;
  }

  if (totalPages <= maxVisible + 1) {
    const items: PageItem[] = Array.from({ length: totalPages }, (_, i) => ({
      type: "page" as const,
      page: i + 1,
    }));
    if (hasMore) {
      items.push({ type: "ellipsis", key: "ellipsis-more" });
    }
    return items;
  }

  // Many pages: show first 2, ellipsis, last 2, optional trailing ellipsis
  const items: PageItem[] = [
    { type: "page", page: 1 },
    { type: "page", page: 2 },
  ];

  if (totalPages > 4) {
    items.push({ type: "ellipsis", key: "ellipsis-mid" });
  }

  if (totalPages > 3) {
    items.push({ type: "page", page: totalPages - 1 });
  }
  items.push({ type: "page", page: totalPages });

  if (hasMore) {
    items.push({ type: "ellipsis", key: "ellipsis-more" });
  }

  return items;
}
