import { useRef, useState, useEffect, useCallback } from "react";
import { useQuery } from "convex/react";
import { anyApi } from "convex/server";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ScholarshipCard } from "./ScholarshipCard";
import { cn } from "@/lib/utils";

interface FeaturedRowProps {
  nationalities?: string[];
}

/**
 * Top Scholarships horizontal row.
 * Shows up to 6 Gold/Silver tier scholarships, personalized by nationality if set.
 * Static row with left/right scroll arrows (no auto-carousel).
 * Mobile: horizontal snap scroll. Desktop: overflow-hidden with arrow buttons.
 */
export function FeaturedRow({ nationalities }: FeaturedRowProps) {
  const featured = useQuery(
    anyApi.directory.getFeaturedScholarships,
    {
      nationalities: nationalities && nationalities.length > 0 ? nationalities : undefined,
      limit: 6,
    },
  );

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
    // Also update on resize
    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      resizeObserver.disconnect();
    };
  }, [updateScrollState, featured]);

  const scroll = useCallback(
    (direction: "left" | "right") => {
      const el = scrollRef.current;
      if (!el) return;
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      // Scroll by approximately one card width (280px + gap)
      const scrollAmount = 304;
      el.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    },
    [],
  );

  // Hide entire component if no featured scholarships
  if (!featured || featured.length === 0) {
    return null;
  }

  const heading =
    nationalities && nationalities.length > 0
      ? "Top Scholarships for You"
      : "Top Scholarships";

  return (
    <section aria-label={heading}>
      <h2 className="font-heading text-xl mb-4">{heading}</h2>
      <div className="relative">
        {/* Left scroll arrow */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scroll("left")}
            aria-label="Scroll left"
            className={cn(
              "absolute start-0 top-1/2 -translate-y-1/2 z-10",
              "bg-secondary-background border-2 border-border rounded-full p-2 shadow-shadow",
              "hover:bg-main/5 transition-colors",
              "hidden md:flex items-center justify-center",
            )}
          >
            <ChevronLeft className="size-5" />
          </button>
        )}

        {/* Scrollable card row */}
        <div
          ref={scrollRef}
          className={cn(
            "flex gap-6",
            // Mobile: horizontal snap scroll
            "overflow-x-auto snap-x snap-mandatory md:overflow-x-hidden",
            // Hide scrollbar on mobile
            "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
            // Padding for arrow overlap on desktop
            "md:px-0",
          )}
        >
          {featured.map((scholarship) => (
            <div
              key={scholarship._id}
              className="min-w-[280px] max-w-[320px] flex-shrink-0 snap-center"
            >
              <ScholarshipCard scholarship={scholarship} />
            </div>
          ))}
        </div>

        {/* Right scroll arrow */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scroll("right")}
            aria-label="Scroll right"
            className={cn(
              "absolute end-0 top-1/2 -translate-y-1/2 z-10",
              "bg-secondary-background border-2 border-border rounded-full p-2 shadow-shadow",
              "hover:bg-main/5 transition-colors",
              "hidden md:flex items-center justify-center",
            )}
          >
            <ChevronRight className="size-5" />
          </button>
        )}
      </div>
    </section>
  );
}
