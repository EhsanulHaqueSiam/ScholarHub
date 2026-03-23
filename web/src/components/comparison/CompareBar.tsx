import { useNavigate } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCompare } from "./CompareContext";

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

export function CompareBar() {
  const { selected, removeFromCompare, clearCompare, announcement } =
    useCompare();
  const navigate = useNavigate();

  const handleCompare = useCallback(() => {
    const slugs = selected.map((s) => s.slug).join(",");
    navigate({ to: "/scholarships/compare", search: { s: slugs } });
  }, [selected, navigate]);

  if (selected.length === 0) return null;

  return (
    <>
      {/* ARIA live region for screen readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      <div
        className={cn(
          "fixed bottom-4 left-4 right-4 z-50",
          "md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-full md:max-w-[640px]",
          "rounded-base border-2 border-border bg-secondary-background shadow-shadow",
          "px-4 py-2",
          "motion-safe:animate-in motion-safe:slide-in-from-bottom",
        )}
        role="region"
        aria-label="Scholarship comparison bar"
      >
        <div className="flex items-center gap-3">
          {/* Selected scholarship chips */}
          <div className="flex flex-1 flex-wrap items-center gap-2 min-w-0">
            {selected.map((item) => (
              <span
                key={item.slug}
                className="inline-flex items-center gap-1 rounded-base border-2 border-border bg-background px-2 py-1 text-sm"
              >
                <span className="truncate max-w-[20ch]">
                  {truncate(item.title, 20)}
                </span>
                <button
                  type="button"
                  onClick={() => removeFromCompare(item.slug)}
                  className="shrink-0 rounded-base p-0.5 hover:bg-secondary-background transition-colors"
                  aria-label={`Remove ${item.title} from comparison`}
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {selected.length >= 3 && (
              <button
                type="button"
                onClick={clearCompare}
                className="text-xs text-foreground/70 underline hover:text-foreground transition-colors"
              >
                Clear all
              </button>
            )}
            <Button
              onClick={handleCompare}
              disabled={selected.length < 2}
              size="sm"
              className="whitespace-nowrap"
            >
              Compare Scholarships
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
