import * as Dialog from "@radix-ui/react-dialog";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useScholarshipFilters } from "@/hooks/useScholarshipFilters";
import {
  DEGREE_LEVELS,
  FIELDS_OF_STUDY,
  FUNDING_TYPES,
  serializeCommaSeparated,
} from "@/lib/filters";
import { cn } from "@/lib/utils";

const PRESTIGE_TIERS = [
  {
    value: "gold",
    label: "Gold",
    colorClass: "bg-prestige-gold-badge text-black border-prestige-gold-border",
  },
  {
    value: "silver",
    label: "Silver",
    colorClass: "bg-prestige-silver-badge text-black border-prestige-silver-border",
  },
  {
    value: "bronze",
    label: "Bronze",
    colorClass: "bg-prestige-bronze-badge text-black border-prestige-bronze-border",
  },
] as const;

/**
 * FilterPanel: Left sidebar on desktop (280px, sticky), bottom sheet on mobile.
 * Contains: degree level, field of study, funding type, prestige tier, show closed toggle.
 */
export function FilterPanel() {
  const { filters, setFilter, activeFilterCount } = useScholarshipFilters();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-[280px] shrink-0 sticky top-[80px] self-start max-h-[calc(100vh-96px)] overflow-y-auto pr-2">
        <FilterContent filters={filters} setFilter={setFilter} />
      </aside>

      {/* Mobile bottom sheet trigger + dialog */}
      <div className="lg:hidden">
        <Dialog.Root>
          <Dialog.Trigger asChild>
            <Button variant="neutral" className="gap-2">
              <SlidersHorizontal className="size-4" />
              Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </Button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-overlay z-40" />
            <Dialog.Content className="fixed bottom-0 inset-x-0 z-50 bg-secondary-background border-t-2 border-border rounded-t-base max-h-[85vh] overflow-y-auto p-4 animate-in slide-in-from-bottom">
              <div className="flex items-center justify-between mb-4">
                <Dialog.Title className="font-heading text-lg">Filters</Dialog.Title>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    aria-label="Close filters"
                    className="p-1.5 rounded-base hover:bg-foreground/10 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <X className="size-5" />
                  </button>
                </Dialog.Close>
              </div>
              <FilterContent filters={filters} setFilter={setFilter} />
              <Dialog.Close asChild>
                <Button variant="default" className="w-full mt-4">
                  Apply Filters
                </Button>
              </Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </>
  );
}

// --- Shared filter content used by both sidebar and bottom sheet ---

interface FilterContentProps {
  filters: ReturnType<typeof useScholarshipFilters>["filters"];
  setFilter: ReturnType<typeof useScholarshipFilters>["setFilter"];
}

function FilterContent({ filters, setFilter }: FilterContentProps) {
  const [fieldSearch, setFieldSearch] = useState("");

  function toggleMultiFilter(key: string, value: string) {
    const current =
      key === "degree"
        ? filters.degree
        : key === "funding"
          ? filters.funding
          : key === "tier"
            ? filters.tier
            : [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setFilter(key, serializeCommaSeparated(updated));
  }

  function toggleFieldOfStudy(field: string) {
    const updated = filters.field.includes(field)
      ? filters.field.filter((f) => f !== field)
      : [...filters.field, field];
    setFilter("field", serializeCommaSeparated(updated));
  }

  const filteredFields = useMemo(() => {
    if (!fieldSearch.trim()) return FIELDS_OF_STUDY;
    const q = fieldSearch.toLowerCase();
    return FIELDS_OF_STUDY.filter((f) => f.toLowerCase().includes(q));
  }, [fieldSearch]);

  return (
    <div>
      <h2 className="font-heading text-lg mb-4 hidden lg:block">Filters</h2>

      {/* Degree Level */}
      <section className="py-4 border-b border-border" aria-label="Filter by degree level">
        <h3 className="text-sm font-heading text-foreground/80 mb-2">Degree Level</h3>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Degree level options">
          {DEGREE_LEVELS.map((level) => {
            const isActive = filters.degree.includes(level.value);
            return (
              <button
                key={level.value}
                type="button"
                aria-pressed={isActive}
                aria-label={`Filter by ${level.label}`}
                onClick={() => toggleMultiFilter("degree", level.value)}
                className={cn(
                  "inline-flex items-center rounded-base border-2 border-border px-3 py-2 text-sm font-base transition-all min-h-[44px] shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none",
                  isActive
                    ? "bg-main text-main-foreground"
                    : "bg-secondary-background text-foreground",
                )}
              >
                {level.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Field of Study */}
      <section className="py-4 border-b border-border" aria-label="Filter by field of study">
        <h3 className="text-sm font-heading text-foreground/80 mb-2">Field of Study</h3>
        <div className="relative mb-2">
          <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 size-3.5 text-foreground/50 pointer-events-none" />
          <input
            type="text"
            aria-label="Search fields of study"
            placeholder="Search fields..."
            value={fieldSearch}
            onChange={(e) => setFieldSearch(e.target.value)}
            className="w-full border-2 border-border rounded-base bg-secondary-background ps-8 pe-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
          />
        </div>
        {/* Selected fields as removable pills */}
        {filters.field.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {filters.field.map((field) => (
              <span
                key={field}
                className="inline-flex items-center gap-1 bg-main text-main-foreground border-2 border-border rounded-base px-2 py-0.5 text-xs"
              >
                {field}
                <button
                  type="button"
                  onClick={() => toggleFieldOfStudy(field)}
                  aria-label={`Remove ${field} filter`}
                  className="ms-0.5 hover:text-foreground/80"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="max-h-40 overflow-y-auto">
          {filteredFields.map((field) => {
            const isActive = filters.field.includes(field);
            return (
              <button
                key={field}
                type="button"
                onClick={() => toggleFieldOfStudy(field)}
                className={cn(
                  "flex items-center w-full text-start px-2 py-2 text-sm rounded-base min-h-[40px]",
                  "border-2 transition-all",
                  isActive
                    ? "bg-main/10 font-heading border-border shadow-shadow"
                    : "border-transparent hover:bg-main/10 hover:border-border hover:shadow-shadow hover:translate-x-[-1px] hover:translate-y-[-1px]",
                )}
              >
                <span
                  className={cn(
                    "size-5 rounded-sm border-2 me-2.5 flex items-center justify-center shrink-0 transition-colors",
                    isActive
                      ? "bg-main border-border text-main-foreground"
                      : "bg-secondary-background border-border",
                  )}
                >
                  {isActive && (
                    <svg
                      className="size-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                {field}
              </button>
            );
          })}
        </div>
      </section>

      {/* Funding Type */}
      <section className="py-4 border-b border-border" aria-label="Filter by funding type">
        <h3 className="text-sm font-heading text-foreground/80 mb-2">Funding Type</h3>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Funding type options">
          {FUNDING_TYPES.map((type) => {
            const isActive = filters.funding.includes(type.value);
            return (
              <button
                key={type.value}
                type="button"
                aria-pressed={isActive}
                aria-label={`Filter by ${type.label}`}
                onClick={() => toggleMultiFilter("funding", type.value)}
                className={cn(
                  "inline-flex items-center rounded-base border-2 border-border px-3 py-2 text-sm font-base transition-all min-h-[44px] shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none",
                  isActive
                    ? "bg-main text-main-foreground"
                    : "bg-secondary-background text-foreground",
                )}
              >
                {type.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Prestige Tier */}
      <section className="py-4 border-b border-border" aria-label="Filter by prestige tier">
        <h3 className="text-sm font-heading text-foreground/80 mb-2">Prestige Tier</h3>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Prestige tier options">
          {PRESTIGE_TIERS.map((tier) => {
            const isActive = filters.tier.includes(tier.value);
            return (
              <button
                key={tier.value}
                type="button"
                aria-pressed={isActive}
                aria-label={`Filter by ${tier.label} prestige`}
                onClick={() => toggleMultiFilter("tier", tier.value)}
                className={cn(
                  "inline-flex items-center rounded-base border-2 border-border px-3 py-2 text-sm font-base transition-all min-h-[44px] shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none",
                  isActive ? tier.colorClass : "bg-secondary-background text-foreground",
                )}
              >
                {tier.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Show Closed */}
      <section className="py-4">
        <label className="flex items-center gap-2.5 cursor-pointer text-sm text-foreground/80">
          <span
            className={cn(
              "size-5 rounded-sm border-2 border-border flex items-center justify-center shrink-0 transition-colors",
              filters.showClosed ? "bg-main" : "bg-secondary-background",
            )}
          >
            {filters.showClosed && (
              <svg
                className="size-3 text-main-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </span>
          <input
            type="checkbox"
            checked={filters.showClosed}
            onChange={() => setFilter("show_closed", !filters.showClosed)}
            aria-label="Toggle show closed scholarships"
            className="sr-only"
          />
          Show closed scholarships
        </label>
      </section>
    </div>
  );
}
