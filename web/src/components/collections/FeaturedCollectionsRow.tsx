import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";

/**
 * Horizontal scroll row of featured collections for the /scholarships directory page.
 * Shows up to 6 featured collections as compact cards (emoji + name + count).
 * Same ref+ResizeObserver+scroll arrow pattern as FeaturedRow.
 * Returns null during loading (no skeleton) and when no featured collections exist.
 */
export const FeaturedCollectionsRow = memo(function FeaturedCollectionsRow() {
  const featured = useQuery(api.collections.getFeaturedCollections);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      resizeObserver.disconnect();
    };
  }, [updateScrollState, featured]);

  const scroll = useCallback((direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const scrollAmount = 224; // ~200px card + gap
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, []);

  // Hide entire component if no featured collections
  if (!featured || featured.length === 0) {
    return null;
  }

  return (
    <section aria-label="Featured Collections">
      <div className="relative">
        {/* Left scroll arrow */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scroll("left")}
            aria-label="Scroll left"
            className={cn(
              "absolute -left-5 top-1/2 -translate-y-1/2 z-10",
              "bg-secondary-background border-2 border-border rounded-full p-2 shadow-[2px_2px_0px_0px_var(--border)]",
              "hover:shadow-none transition-all",
              "hidden md:flex items-center justify-center",
            )}
          >
            <ChevronLeft className="size-5" />
          </button>
        )}

        {/* Scrollable row */}
        <div
          ref={scrollRef}
          className={cn(
            "flex gap-4 items-stretch",
            "overflow-x-auto snap-x snap-mandatory",
            "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
          )}
        >
          {featured.map((collection) => (
            <Link
              key={collection._id}
              to="/collections/$slug"
              params={{ slug: collection.slug }}
              className={cn(
                "w-[200px] flex-shrink-0 snap-center",
                "flex items-center gap-3 p-4",
                "rounded-base border-2 border-border bg-secondary-background shadow-shadow",
                "transition-all",
                "motion-safe:hover:translate-x-boxShadowX motion-safe:hover:translate-y-boxShadowY hover:shadow-none",
                "focus-visible:ring-2 focus-visible:ring-main focus-visible:ring-offset-2 focus-visible:outline-none",
              )}
            >
              <span className="text-[32px] shrink-0" role="img" aria-hidden="true">
                {collection.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <span className="text-sm font-heading block truncate">
                  {collection.name}
                </span>
                <Badge variant="neutral" className="text-xs mt-1">
                  {collection.scholarship_count}
                </Badge>
              </div>
            </Link>
          ))}

          {/* "View all collections" link at end of row */}
          <div className="w-[200px] flex-shrink-0 snap-center flex items-center justify-center">
            <Link
              to="/collections"
              className="text-sm text-main hover:underline flex items-center gap-1 font-heading"
            >
              View all collections
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>

        {/* Right scroll arrow */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scroll("right")}
            aria-label="Scroll right"
            className={cn(
              "absolute -right-5 top-1/2 -translate-y-1/2 z-10",
              "bg-secondary-background border-2 border-border rounded-full p-2 shadow-[2px_2px_0px_0px_var(--border)]",
              "hover:shadow-none transition-all",
              "hidden md:flex items-center justify-center",
            )}
          >
            <ChevronRight className="size-5" />
          </button>
        )}
      </div>
    </section>
  );
});
