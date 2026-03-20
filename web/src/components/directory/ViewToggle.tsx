import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { LayoutGrid, List } from "lucide-react";
import { useScholarshipFilters } from "@/hooks/useScholarshipFilters";
import { cn } from "@/lib/utils";

/**
 * Grid/List icon toggle using Radix ToggleGroup (single-select).
 */
export function ViewToggle() {
  const { filters, setFilter } = useScholarshipFilters();

  const itemClass = (isActive: boolean) =>
    cn(
      "inline-flex items-center justify-center rounded-base border-2 p-2 transition-all min-h-[44px] min-w-[44px] shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none",
      isActive
        ? "bg-main text-main-foreground border-border"
        : "bg-secondary-background text-foreground border-border",
    );

  return (
    <ToggleGroup.Root
      type="single"
      value={filters.view}
      onValueChange={(value) => {
        if (value) {
          setFilter("view", value);
        }
      }}
      className="flex gap-1"
    >
      <ToggleGroup.Item value="grid" aria-label="Switch to grid view" className={itemClass(filters.view === "grid")}>
        <LayoutGrid className="size-4" />
      </ToggleGroup.Item>
      <ToggleGroup.Item value="list" aria-label="Switch to list view" className={itemClass(filters.view === "list")}>
        <List className="size-4" />
      </ToggleGroup.Item>
    </ToggleGroup.Root>
  );
}
