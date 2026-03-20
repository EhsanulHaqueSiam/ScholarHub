import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { getAllCountries, getCountryFlag, getCountryName } from "@/lib/countries";
import { cn } from "@/lib/utils";

interface CountrySelectorProps {
  selected: string[];
  onChange: (codes: string[]) => void;
  placeholder: string;
  popularList: string[];
  maxSelections?: number;
}

export function CountrySelector({
  selected,
  onChange,
  placeholder,
  popularList,
  maxSelections,
}: CountrySelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const allCountries = useMemo(() => getAllCountries(), []);

  const filteredCountries = useMemo(() => {
    if (!search.trim()) return allCountries;
    const q = search.toLowerCase();
    return allCountries.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q),
    );
  }, [search, allCountries]);

  // Selected countries first, then the rest
  const sortedCountries = useMemo(() => {
    const selectedSet = new Set(selected);
    const selectedItems = filteredCountries.filter((c) => selectedSet.has(c.code));
    const unselectedItems = filteredCountries.filter((c) => !selectedSet.has(c.code));
    return [...selectedItems, ...unselectedItems];
  }, [filteredCountries, selected]);

  function toggleCountry(code: string) {
    if (selected.includes(code)) {
      onChange(selected.filter((c) => c !== code));
    } else {
      if (maxSelections && selected.length >= maxSelections) return;
      onChange([...selected, code]);
    }
  }

  function removeCountry(code: string, e: React.MouseEvent) {
    e.stopPropagation();
    onChange(selected.filter((c) => c !== code));
  }

  const atMax = maxSelections ? selected.length >= maxSelections : false;

  return (
    <Popover.Root
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (!newOpen) setSearch("");
      }}
    >
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={placeholder}
          aria-expanded={open}
          className={cn(
            "inline-flex items-center gap-1.5 border-2 border-border rounded-base bg-secondary-background px-3 py-2 min-h-[44px] text-sm font-base transition-colors",
            "hover:bg-main/5 focus:ring-2 focus:ring-ring focus:outline-none",
            selected.length === 0 && "text-foreground/60",
          )}
        >
          {selected.length === 0 ? (
            <span>{placeholder}</span>
          ) : (
            <span className="flex flex-wrap gap-1">
              {selected.map((code) => (
                <span
                  key={code}
                  className="inline-flex items-center gap-1 bg-main/10 border border-border rounded-base px-2 py-0.5 text-xs"
                >
                  {getCountryFlag(code)} {getCountryName(code)}
                  <button
                    type="button"
                    onClick={(e) => removeCountry(code, e)}
                    aria-label={`Remove ${getCountryName(code)}`}
                    className="ms-0.5 hover:text-foreground/80"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </span>
          )}
          <ChevronDown className="size-4 shrink-0 text-foreground/60" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={4}
          align="start"
          className="z-50 w-72 max-h-80 border-2 border-border rounded-base bg-secondary-background shadow-shadow overflow-hidden flex flex-col"
          onOpenAutoFocus={() => {
            // Focus the search input when opened
            setTimeout(() => searchInputRef.current?.focus(), 0);
          }}
        >
          {/* Search input */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 size-3.5 text-foreground/50 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                aria-label="Search countries"
                placeholder="Search countries..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-border rounded-base bg-background ps-8 pe-3 py-1.5 text-sm focus:ring-1 focus:ring-ring focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {/* Popular section */}
            {!search.trim() && popularList.length > 0 && (
              <div className="p-2 border-b border-border">
                <p className="text-xs font-heading text-foreground/60 mb-1.5 px-1">Popular</p>
                <div className="flex flex-wrap gap-1">
                  {popularList.map((code) => {
                    const isSelected = selected.includes(code);
                    return (
                      <button
                        key={code}
                        type="button"
                        disabled={!isSelected && atMax}
                        onClick={() => toggleCountry(code)}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-base border px-2 py-1 text-xs transition-colors min-h-[32px]",
                          isSelected
                            ? "bg-main text-main-foreground border-border"
                            : "bg-secondary-background border-border hover:bg-main/5",
                          !isSelected && atMax && "opacity-50 cursor-not-allowed",
                        )}
                      >
                        {getCountryFlag(code)} {getCountryName(code)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Full country list */}
            <ul role="listbox" className="py-1">
              {sortedCountries.map((country) => {
                const isSelected = selected.includes(country.code);
                return (
                  <li
                    key={country.code}
                    role="option"
                    aria-selected={isSelected}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 min-h-[44px] cursor-pointer text-sm",
                      isSelected ? "bg-main/10" : "hover:bg-main/5",
                      !isSelected && atMax && "opacity-50 cursor-not-allowed",
                    )}
                    onClick={() => {
                      if (!isSelected && atMax) return;
                      toggleCountry(country.code);
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base">{country.flag}</span>
                      <span>{country.name}</span>
                    </span>
                    <span
                      className={cn(
                        "size-4 rounded border-2 flex items-center justify-center shrink-0",
                        isSelected ? "bg-main border-main text-main-foreground" : "border-border",
                      )}
                    >
                      {isSelected && <Check className="size-3" />}
                    </span>
                  </li>
                );
              })}
              {sortedCountries.length === 0 && (
                <li className="px-3 py-4 text-center text-sm text-foreground/60">
                  No countries found
                </li>
              )}
            </ul>
          </div>

          {maxSelections && (
            <div className="px-3 py-2 border-t border-border text-xs text-foreground/60">
              {selected.length}/{maxSelections} selected
            </div>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
