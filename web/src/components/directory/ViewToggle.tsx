import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { LayoutGrid, List } from "lucide-react";
import { useScholarshipFilters } from "@/hooks/useScholarshipFilters";
import { cn } from "@/lib/utils";

/**
 * Grid/List icon toggle using Radix ToggleGroup (single-select).
 */
export function ViewToggle() {
  const { filters, setFilter } = useScholarshipFilters();

  return (
    <ToggleGroup.Root
      type="single"
      value={filters.view}
      onValueChange={(value) => {
        // Don't allow deselection
        if (value) {
          setFilter("view", value);
        }
      }}
      className="flex gap-1"
    >
      <ToggleGroup.Item
        value="grid"
        aria-label="Switch to grid view"
        className={cn(
          "inline-flex items-center justify-center rounded-base border-2 p-2 transition-all min-h-[44px] min-w-[44px]",
          filters.view === "grid"
            ? "bg-main text-main-foreground border-border shadow-shadow"
            : "bg-secondary-background text-foreground border-border hover:bg-main/5",
        )}
      >
        <LayoutGrid className="size-4" />
      </ToggleGroup.Item>
      <ToggleGroup.Item
        value="list"
        aria-label="Switch to list view"
        className={cn(
          "inline-flex items-center justify-center rounded-base border-2 p-2 transition-all min-h-[44px] min-w-[44px]",
          filters.view === "list"
            ? "bg-main text-main-foreground border-border shadow-shadow"
            : "bg-secondary-background text-foreground border-border hover:bg-main/5",
        )}
      >
        <List className="size-4" />
      </ToggleGroup.Item>
    </ToggleGroup.Root>
  );
}
