import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DesktopPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * Desktop numbered pagination with neo-brutalism style.
 * Client-side only — no Convex calls, just slices the loaded results array.
 */
export function DesktopPagination({
  currentPage,
  totalPages,
  onPageChange,
}: DesktopPaginationProps) {
  if (totalPages <= 1) return null;

  const pages = generatePageNumbers(currentPage, totalPages);

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-2 mt-10">
      {/* Previous */}
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => {
          onPageChange(currentPage - 1);
          document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
        }}
        aria-label="Previous page"
        className={cn(
          "inline-flex items-center justify-center size-10 rounded-base border-2 border-border font-heading text-sm transition-all",
          currentPage <= 1
            ? "bg-secondary-background text-foreground/30 cursor-not-allowed"
            : "bg-secondary-background text-foreground shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none",
        )}
      >
        <ChevronLeft className="size-4" />
      </button>

      {/* Page numbers */}
      {pages.map((item, idx) => {
        if (item === "...") {
          return (
            <span
              key={`ellipsis-${idx}`}
              className="inline-flex items-center justify-center size-10 text-foreground/60 font-heading text-sm select-none"
            >
              ...
            </span>
          );
        }

        const page = item as number;
        const isCurrent = page === currentPage;

        return (
          <button
            key={page}
            type="button"
            onClick={() => {
              onPageChange(page);
              document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
            }}
            aria-label={`Page ${page}`}
            aria-current={isCurrent ? "page" : undefined}
            className={cn(
              "inline-flex items-center justify-center size-10 rounded-base border-2 border-border font-heading text-sm transition-all",
              isCurrent
                ? "bg-main text-main-foreground shadow-shadow"
                : "bg-secondary-background text-foreground shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none",
            )}
          >
            {page}
          </button>
        );
      })}

      {/* Next */}
      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => {
          onPageChange(currentPage + 1);
          document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
        }}
        aria-label="Next page"
        className={cn(
          "inline-flex items-center justify-center size-10 rounded-base border-2 border-border font-heading text-sm transition-all",
          currentPage >= totalPages
            ? "bg-secondary-background text-foreground/30 cursor-not-allowed"
            : "bg-secondary-background text-foreground shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none",
        )}
      >
        <ChevronRight className="size-4" />
      </button>

      {/* Page info */}
      <span className="ml-3 text-sm font-base text-foreground/60">
        Page {currentPage} of {totalPages}
      </span>
    </nav>
  );
}

/**
 * Generate page numbers with ellipsis: [1, 2, "...", 9, 10]
 */
function generatePageNumbers(
  current: number,
  total: number,
): Array<number | "..."> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: Array<number | "..."> = [];

  // Always show first page
  pages.push(1);

  if (current > 3) {
    pages.push("...");
  }

  // Pages around current
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push("...");
  }

  // Always show last page
  if (total > 1) {
    pages.push(total);
  }

  return pages;
}
