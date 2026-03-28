import * as Popover from "@radix-ui/react-popover";
import { useQuery } from "convex/react";
import { Plus, Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useCompare } from "@/components/comparison/CompareContext";
import { getCountryFlag } from "@/lib/countries";
import { api } from "../../../convex/_generated/api";

interface SearchToAddProps {
  onSelect?: (slug: string, title: string) => void;
}

export function SearchToAdd({ onSelect }: SearchToAddProps) {
  const { addToCompare, isSelected } = useCompare();
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchText);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Focus input when popover opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const suggestions = useQuery(
    api.directory.searchSuggestions,
    debouncedQuery.trim().length > 0 ? { query: debouncedQuery.trim() } : "skip",
  );

  const handleSelect = useCallback(
    (slug: string, title: string) => {
      addToCompare(slug, title);
      onSelect?.(slug, title);
      setSearchText("");
      setOpen(false);
    },
    [addToCompare, onSelect],
  );

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button variant="default" size="sm" className="text-xs gap-1">
          <Plus className="size-3" />
          Add scholarship
        </Button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="z-50 w-[300px] rounded-base border-2 border-border bg-secondary-background p-3 shadow-shadow"
          sideOffset={8}
          align="start"
          style={{ transformOrigin: 'var(--radix-popover-content-transform-origin)' }}
        >
          <div className="relative mb-2">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-foreground/50" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search scholarships..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full rounded-base border-2 border-border bg-background pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {suggestions && suggestions.length > 0 && (
            <ul className="max-h-[200px] overflow-y-auto space-y-1">
              {suggestions
                .filter((s) => !isSelected(s.slug ?? s._id))
                .map((s) => (
                  <li key={s._id}>
                    <button
                      type="button"
                      className="w-full text-left rounded-base px-2 py-1.5 text-sm hover:bg-background transition-colors flex items-center gap-2"
                      onClick={() => handleSelect(s.slug ?? s._id, s.title)}
                    >
                      <span className="shrink-0">{getCountryFlag(s.host_country)}</span>
                      <span className="truncate">{s.title}</span>
                    </button>
                  </li>
                ))}
            </ul>
          )}

          {suggestions && suggestions.length === 0 && debouncedQuery.trim().length > 0 && (
            <p className="text-xs text-foreground/50 text-center py-2">
              No scholarships found
            </p>
          )}

          {!suggestions && debouncedQuery.trim().length > 0 && (
            <p className="text-xs text-foreground/50 text-center py-2">Searching...</p>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
