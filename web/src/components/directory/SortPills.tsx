import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { useScholarshipFilters } from "@/hooks/useScholarshipFilters";
import { SORT_OPTIONS } from "@/lib/filters";
import { cn } from "@/lib/utils";

/**
 * Sort option pill buttons using Radix ToggleGroup (single-select).
 * Options: Deadline (default, ASC), Prestige (DESC), Newest (DESC), Amount (DESC).
 */
export function SortPills() {
  const { filters, setFilter } = useScholarshipFilters();

  return (
    <ToggleGroup.Root
      type="single"
      value={filters.sort}
      onValueChange={(value) => {
        // Don't allow deselection -- always keep one sort active
        if (value) {
          setFilter("sort", value);
        }
      }}
      className="flex flex-wrap gap-2"
    >
      {SORT_OPTIONS.map((option) => {
        const isActive = filters.sort === option.value;
        return (
          <ToggleGroup.Item
            key={option.value}
            value={option.value}
            aria-label={`Sort by ${option.label}${isActive ? ", currently active" : ""}`}
            className={cn(
              "inline-flex items-center rounded-base border-2 px-3 py-2 text-sm font-base transition-[transform,box-shadow,border-color,background-color] duration-150 ease-out-expo min-h-[44px] shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none active:scale-[0.97]",
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
  );
}
