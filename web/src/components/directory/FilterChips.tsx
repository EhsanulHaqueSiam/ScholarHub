import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useScholarshipFilters } from "@/hooks/useScholarshipFilters";
import { getCountryFlag, getCountryName } from "@/lib/countries";
import { DEGREE_LEVELS, FIELDS_OF_STUDY, FUNDING_TYPES, SCHOLARSHIP_TYPES } from "@/lib/filters";
import { getTagLabel } from "@/lib/tags";

/**
 * Active filter pills above results.
 * Shows a horizontal wrapping row of active filter pills with remove buttons.
 * Includes "Clear all" link at the end.
 */
export function FilterChips() {
  const { filters, removeFilter, clearFilters, activeFilterCount } = useScholarshipFilters();

  if (activeFilterCount === 0) return null;

  // Build list of active filter chips
  const chips: Array<{
    key: string;
    filterKey: string;
    value: string;
    label: string;
  }> = [];

  // Nationality chips
  for (const code of filters.from) {
    chips.push({
      key: `from-${code}`,
      filterKey: "from",
      value: code,
      label: `From: ${getCountryFlag(code)} ${getCountryName(code)}`,
    });
  }

  // Destination chips
  for (const code of filters.to) {
    chips.push({
      key: `to-${code}`,
      filterKey: "to",
      value: code,
      label: `To: ${getCountryFlag(code)} ${getCountryName(code)}`,
    });
  }

  // Degree chips
  for (const value of filters.degree) {
    const level = DEGREE_LEVELS.find((d) => d.value === value);
    chips.push({
      key: `degree-${value}`,
      filterKey: "degree",
      value,
      label: `Degree: ${level?.label ?? value}`,
    });
  }

  // Field chips
  for (const field of filters.field) {
    const match = FIELDS_OF_STUDY.find((f) => f.toLowerCase() === field.toLowerCase());
    chips.push({
      key: `field-${field}`,
      filterKey: "field",
      value: field,
      label: `Field: ${match ?? field}`,
    });
  }

  // Funding chips
  for (const value of filters.funding) {
    const type = FUNDING_TYPES.find((f) => f.value === value);
    chips.push({
      key: `funding-${value}`,
      filterKey: "funding",
      value,
      label: `Funding: ${type?.label ?? value}`,
    });
  }

  // Tier chips
  for (const value of filters.tier) {
    chips.push({
      key: `tier-${value}`,
      filterKey: "tier",
      value,
      label: `Tier: ${value.charAt(0).toUpperCase() + value.slice(1)}`,
    });
  }

  // Scholarship type chips
  for (const value of filters.type) {
    const typeOption = SCHOLARSHIP_TYPES.find((t) => t.value === value);
    chips.push({
      key: `type-${value}`,
      filterKey: "type",
      value,
      label: `Type: ${typeOption?.label ?? value}`,
    });
  }

  // Tag chips
  for (const tagId of filters.tags) {
    chips.push({
      key: `tags-${tagId}`,
      filterKey: "tags",
      value: tagId,
      label: `Tag: ${getTagLabel(tagId)}`,
    });
  }

  // Search query chip
  if (filters.q) {
    chips.push({
      key: "q",
      filterKey: "q",
      value: filters.q,
      label: `Search: "${filters.q}"`,
    });
  }

  // Closing soon chip
  if (filters.closingSoon) {
    chips.push({
      key: "closing_soon",
      filterKey: "closing_soon",
      value: "true",
      label: "Closing Soon",
    });
  }

  // Show closed chip
  if (filters.showClosed) {
    chips.push({
      key: "show_closed",
      filterKey: "show_closed",
      value: "true",
      label: "Including Closed",
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Badge key={chip.key} variant="neutral" className="gap-1 pe-1">
          <span className="text-xs">{chip.label}</span>
          <button
            type="button"
            aria-label={`Remove ${chip.label} filter`}
            onClick={() => {
              if (
                chip.filterKey === "q" ||
                chip.filterKey === "closing_soon" ||
                chip.filterKey === "show_closed"
              ) {
                // Boolean/string filters: set to undefined/false
                if (chip.filterKey === "q") {
                  // Need to use setFilter via clearFilters approach or specific removal
                  // For simplicity, remove by setting empty
                  removeFilter(chip.filterKey, chip.value);
                } else {
                  removeFilter(chip.filterKey, chip.value);
                }
              } else {
                removeFilter(chip.filterKey, chip.value);
              }
            }}
            className="ms-0.5 p-0.5 rounded hover:bg-foreground/10 min-h-[20px] min-w-[20px] flex items-center justify-center"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
      <button
        type="button"
        onClick={clearFilters}
        aria-label="Clear all filters"
        className="text-xs font-heading text-destructive hover:underline ms-1"
      >
        Clear all
      </button>
    </div>
  );
}
