import { Pencil } from "lucide-react";
import { useState } from "react";
import { useScholarshipFilters } from "@/hooks/useScholarshipFilters";
import {
  getCountryFlag,
  getCountryName,
  POPULAR_DESTINATIONS,
  POPULAR_NATIONALITIES,
} from "@/lib/countries";
import { serializeCommaSeparated } from "@/lib/filters";
import { cn } from "@/lib/utils";
import { CountrySelector } from "./CountrySelector";

/**
 * Smart nationality + destination filter bar.
 * States: Empty (full two-line layout), Populated (selections shown), Compact (single line after both set).
 */
export function EligibilityFilterBar() {
  const { filters, setFilter } = useScholarshipFilters();
  const [forceExpanded, setForceExpanded] = useState(false);

  const hasNationality = filters.from.length > 0;
  const hasDestinations = filters.to.length > 0;
  const isCompact = hasNationality && hasDestinations && !forceExpanded;

  function handleNationalityChange(codes: string[]) {
    setFilter("from", serializeCommaSeparated(codes));
  }

  function handleDestinationChange(codes: string[]) {
    setFilter("to", serializeCommaSeparated(codes));
  }

  function handlePopularDestinationClick(code: string) {
    if (filters.to.includes(code)) {
      // Remove if already selected
      handleDestinationChange(filters.to.filter((c) => c !== code));
    } else {
      handleDestinationChange([...filters.to, code]);
    }
  }

  function handleIneligibleToggle() {
    setFilter("show_ineligible", !filters.showIneligible);
  }

  if (isCompact) {
    return (
      <div
        className="bg-secondary-background border-2 border-border rounded-base py-2 px-4"
        aria-expanded={false}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-base min-w-0">
            <span className="flex items-center gap-1 shrink-0">
              {filters.from.map((code) => (
                <span key={code} title={getCountryName(code)}>
                  {getCountryFlag(code)}
                </span>
              ))}
              <span className="ms-1 text-foreground/80">
                {filters.from.map((c) => getCountryName(c)).join(", ")}
              </span>
            </span>
            <span className="text-foreground/50 mx-1" aria-hidden="true">
              &rarr;
            </span>
            <span className="flex items-center gap-1 truncate">
              {filters.to.map((code) => (
                <span key={code} title={getCountryName(code)}>
                  {getCountryFlag(code)}
                </span>
              ))}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setForceExpanded(true)}
            className="inline-flex items-center gap-1.5 text-sm font-base text-main hover:underline shrink-0 min-h-[44px]"
            aria-label="Edit nationality and destination filters"
            aria-expanded={false}
          >
            <Pencil className="size-3.5" />
            Edit
          </button>
        </div>

        {/* Ineligible toggle in compact mode */}
        <div className="flex items-center gap-2 mt-1.5">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground/70">
            <input
              type="checkbox"
              checked={filters.showIneligible}
              onChange={handleIneligibleToggle}
              aria-label="Toggle show ineligible scholarships"
              className="rounded border-border"
            />
            Also show scholarships you may not qualify for
          </label>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-secondary-background border-2 border-border rounded-base p-4"
      aria-expanded={true}
    >
      <div className="flex flex-col gap-3">
        {/* Top line: nationality */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-base text-foreground/80 shrink-0">I'm from</span>
          <CountrySelector
            selected={filters.from}
            onChange={handleNationalityChange}
            placeholder="Select nationality"
            popularList={POPULAR_NATIONALITIES}
            maxSelections={3}
          />
          <span className="text-sm font-base text-foreground/80 shrink-0">looking to study in</span>
          <CountrySelector
            selected={filters.to}
            onChange={handleDestinationChange}
            placeholder="Select destinations"
            popularList={POPULAR_DESTINATIONS}
          />
        </div>

        {/* Popular destinations chips */}
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_DESTINATIONS.slice(0, 15).map((code) => {
            const isSelected = filters.to.includes(code);
            return (
              <button
                key={code}
                type="button"
                onClick={() => handlePopularDestinationClick(code)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-base border px-2 py-1 text-xs transition-colors min-h-[32px]",
                  isSelected
                    ? "bg-main text-main-foreground border-border"
                    : "bg-secondary-background border-border hover:bg-main/5",
                )}
              >
                {getCountryFlag(code)} {getCountryName(code)}
              </button>
            );
          })}
        </div>

        {/* Ineligible toggle */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground/70">
            <input
              type="checkbox"
              checked={filters.showIneligible}
              onChange={handleIneligibleToggle}
              aria-label="Toggle show ineligible scholarships"
              className="rounded border-border"
            />
            Also show scholarships you may not qualify for
          </label>
          {forceExpanded && hasNationality && hasDestinations && (
            <button
              type="button"
              onClick={() => setForceExpanded(false)}
              className="text-xs text-main hover:underline"
            >
              Collapse
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
