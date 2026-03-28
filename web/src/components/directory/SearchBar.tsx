import * as Popover from "@radix-ui/react-popover";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { getCountryFlag } from "@/lib/countries";
import { FIELDS_OF_STUDY, parseCommaSeparated, serializeCommaSeparated } from "@/lib/filters";
import { cn } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";

interface SearchBarProps {
  onSearch: (query: string) => void;
  defaultValue?: string;
}

export function SearchBar({ onSearch, defaultValue = "" }: SearchBarProps) {
  const [inputValue, setInputValue] = useState(defaultValue);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  // Debounce the search query
  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (value.trim().length >= 2) {
        setDebouncedQuery(value.trim());
        setIsOpen(true);
      } else {
        setDebouncedQuery("");
        setIsOpen(false);
      }
    }, 300);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Keep input value in sync when URL-backed search changes externally.
  useEffect(() => {
    setInputValue(defaultValue);
  }, [defaultValue]);

  // Fetch suggestions from Convex (reactive query)
  const suggestions = useQuery(
    api.directory.searchSuggestions,
    debouncedQuery.length >= 2 ? { query: debouncedQuery } : "skip",
  );

  // Check if query matches a field of study for category suggestions
  const matchingFields =
    debouncedQuery.length >= 2
      ? FIELDS_OF_STUDY.filter((f) => f.toLowerCase().includes(debouncedQuery.toLowerCase())).slice(
          0,
          2,
        )
      : [];

  // Combine suggestions: scholarship titles + category suggestions
  const combinedSuggestions: Array<
    | { type: "scholarship"; _id: string; title: string; host_country: string; slug: string }
    | { type: "category"; field: string }
  > = [];

  if (matchingFields.length > 0) {
    for (const field of matchingFields) {
      combinedSuggestions.push({ type: "category", field });
    }
  }

  if (suggestions) {
    for (const s of suggestions.slice(0, 5 - matchingFields.length)) {
      combinedSuggestions.push({
        type: "scholarship",
        _id: s._id,
        title: s.title,
        host_country: s.host_country,
        slug: s.slug,
      });
    }
  }

  const showDropdown = isOpen && combinedSuggestions.length > 0;
  const listboxId = "search-suggestions-listbox";

  function handleSubmit() {
    setIsOpen(false);
    onSearch(inputValue.trim());
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < combinedSuggestions.length) {
        handleSuggestionClick(combinedSuggestions[activeIndex]);
      } else {
        handleSubmit();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < combinedSuggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : combinedSuggestions.length - 1));
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  }

  function handleSuggestionClick(suggestion: (typeof combinedSuggestions)[number]) {
    setIsOpen(false);
    setActiveIndex(-1);
    if (suggestion.type === "scholarship") {
      navigate({ to: `/scholarships/${suggestion.slug}` });
    } else {
      // Category suggestion: add/merge with existing "field" URL filter.
      navigate({
        search: (prev: Record<string, unknown>) => {
          const current = parseCommaSeparated(
            typeof prev.field === "string" ? prev.field : undefined,
          );
          const next = current.includes(suggestion.field)
            ? current
            : [...current, suggestion.field];
          return {
            ...prev,
            q: undefined,
            field: serializeCommaSeparated(next),
          };
        },
        replace: true,
        resetScroll: false,
      });
      setInputValue("");
      setDebouncedQuery("");
    }
  }

  return (
    <Popover.Root open={showDropdown} onOpenChange={setIsOpen}>
      <Popover.Anchor asChild>
        <div className="relative w-full">
          <Search
            className="absolute start-4 top-1/2 -translate-y-1/2 size-5 text-foreground/60 pointer-events-none"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-label="Search scholarships"
            aria-expanded={showDropdown}
            aria-controls={showDropdown ? listboxId : undefined}
            aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
            aria-autocomplete="list"
            placeholder="Search scholarships..."
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (debouncedQuery.length >= 2 && combinedSuggestions.length > 0) {
                setIsOpen(true);
              }
            }}
            className="border-[3px] border-border rounded-base bg-secondary-background h-14 px-4 ps-12 w-full text-base font-base shadow-shadow focus:ring-2 focus:ring-ring focus:outline-none transition-[transform,box-shadow] duration-150 ease-out-expo focus:translate-x-boxShadowX focus:translate-y-boxShadowY focus:shadow-none placeholder:text-foreground/40 placeholder:font-heading"
          />
        </div>
      </Popover.Anchor>
      <Popover.Portal>
        <Popover.Content
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          sideOffset={4}
          align="start"
          className="z-50 w-[var(--radix-popover-trigger-width)] border-[3px] border-border rounded-base bg-secondary-background shadow-shadow overflow-hidden"
          style={{ transformOrigin: 'var(--radix-popover-content-transform-origin)' }}
        >
          <ul id={listboxId} role="listbox" className="py-1">
            {combinedSuggestions.map((suggestion, index) => (
              <li
                key={suggestion.type === "scholarship" ? suggestion._id : `cat-${suggestion.field}`}
                id={`suggestion-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                className={cn(
                  "flex items-center justify-between px-4 py-3 min-h-[44px] cursor-pointer text-sm",
                  index === activeIndex ? "bg-main/10" : "hover:bg-main/5",
                )}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSuggestionClick(suggestion);
                }}
                onMouseEnter={() => setActiveIndex(index)}
              >
                {suggestion.type === "scholarship" ? (
                  <>
                    <span className="truncate font-base">{suggestion.title}</span>
                    <span className="ms-2 shrink-0 text-base">
                      {getCountryFlag(suggestion.host_country)}
                    </span>
                  </>
                ) : (
                  <span className="font-base text-foreground/70">
                    <span className="text-main font-heading text-xs uppercase me-1.5">
                      Filter by:
                    </span>
                    {suggestion.field}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
