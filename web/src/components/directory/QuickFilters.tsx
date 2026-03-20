import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { useScholarshipFilters } from "@/hooks/useScholarshipFilters";
import { serializeCommaSeparated } from "@/lib/filters";
import { cn } from "@/lib/utils";

const QUICK_FILTER_OPTIONS = [
  { value: "open_now", label: "Open Now" },
  { value: "closing_soon", label: "Closing Soon" },
  { value: "fully_funded", label: "Fully Funded" },
  { value: "gold_tier", label: "Gold Tier" },
] as const;

/**
 * Quick filter toggle tabs for common filter presets.
 * Uses Radix ToggleGroup (type="multiple") for AND logic.
 * "Open Now" = default (absence of closing_soon and show_closed).
 */
export function QuickFilters() {
  const { filters, setFilter } = useScholarshipFilters();

  // Derive active quick filters from current filter state
  const activeValues: string[] = [];

  // "Open Now" is active when NOT closing soon and NOT showing closed
  const isOpenNow = !filters.closingSoon && !filters.showClosed;
  if (isOpenNow) activeValues.push("open_now");

  if (filters.closingSoon) activeValues.push("closing_soon");
  if (filters.funding.includes("fully_funded")) activeValues.push("fully_funded");
  if (filters.tier.includes("gold")) activeValues.push("gold_tier");

  function handleValueChange(newValues: string[]) {
    const wasOpenNow = activeValues.includes("open_now");
    const isNowOpenNow = newValues.includes("open_now");

    // Handle "Open Now" toggle
    if (!wasOpenNow && isNowOpenNow) {
      // Turning on "Open Now" turns off "Closing Soon"
      setFilter("closing_soon", false);
      setFilter("show_closed", false);
      return;
    }

    // Handle "Closing Soon" toggle
    const wasClosingSoon = activeValues.includes("closing_soon");
    const isNowClosingSoon = newValues.includes("closing_soon");
    if (wasClosingSoon !== isNowClosingSoon) {
      setFilter("closing_soon", isNowClosingSoon ? true : undefined);
    }

    // Handle "Fully Funded" toggle
    const wasFullyFunded = activeValues.includes("fully_funded");
    const isNowFullyFunded = newValues.includes("fully_funded");
    if (wasFullyFunded !== isNowFullyFunded) {
      if (isNowFullyFunded) {
        // Add fully_funded to funding filter
        const updated = filters.funding.includes("fully_funded")
          ? filters.funding
          : [...filters.funding, "fully_funded"];
        setFilter("funding", serializeCommaSeparated(updated));
      } else {
        // Remove fully_funded from funding filter
        const updated = filters.funding.filter((f) => f !== "fully_funded");
        setFilter("funding", serializeCommaSeparated(updated));
      }
    }

    // Handle "Gold Tier" toggle
    const wasGoldTier = activeValues.includes("gold_tier");
    const isNowGoldTier = newValues.includes("gold_tier");
    if (wasGoldTier !== isNowGoldTier) {
      if (isNowGoldTier) {
        const updated = filters.tier.includes("gold")
          ? filters.tier
          : [...filters.tier, "gold"];
        setFilter("tier", serializeCommaSeparated(updated));
      } else {
        const updated = filters.tier.filter((t) => t !== "gold");
        setFilter("tier", serializeCommaSeparated(updated));
      }
    }
  }

  return (
    <ToggleGroup.Root
      type="multiple"
      value={activeValues}
      onValueChange={handleValueChange}
      className="flex flex-wrap gap-2"
    >
      {QUICK_FILTER_OPTIONS.map((option) => {
        const isActive = activeValues.includes(option.value);
        return (
          <ToggleGroup.Item
            key={option.value}
            value={option.value}
            aria-pressed={isActive}
            className={cn(
              "inline-flex items-center rounded-base border-2 px-3 py-2 text-sm font-base transition-all min-h-[44px]",
              isActive
                ? "bg-main text-main-foreground border-border shadow-shadow"
                : "bg-secondary-background text-foreground border-border hover:bg-main/5",
            )}
          >
            {option.label}
          </ToggleGroup.Item>
        );
      })}
    </ToggleGroup.Root>
  );
}
