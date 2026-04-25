import { Filter, Search, X } from "lucide-react";
import { ALL_TAGS, type ResourceTag } from "@/data/resources";
import { Button } from "@/components/ui/button";
import { TagChip } from "./TagChip";

interface ResourceFilterBarProps {
  query: string;
  onQuery: (q: string) => void;
  selectedTags: Set<ResourceTag>;
  onToggleTag: (t: ResourceTag) => void;
  onClear: () => void;
  totalShown: number;
  totalCategories: number;
  tagCounts: Record<ResourceTag, number>;
}

export function ResourceFilterBar({
  query,
  onQuery,
  selectedTags,
  onToggleTag,
  onClear,
  totalShown,
  totalCategories,
  tagCounts,
}: ResourceFilterBarProps) {
  const hasFilters = selectedTags.size > 0 || query.length > 0;

  return (
    <div className="sticky top-16 z-30 bg-background/95 backdrop-blur border-b-2 border-border">
      <div className="max-w-[1280px] mx-auto px-4 py-3 md:py-4 flex flex-col gap-3">
        {/* Top row: search + result count */}
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative flex-1 min-w-[200px]">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-foreground/50 pointer-events-none"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="Search 200+ tools — DAAD, IELTS, EBL, Yocket…"
              aria-label="Search resources"
              className="w-full h-10 pl-10 pr-3 border-2 border-border bg-secondary-background font-base text-sm placeholder:text-foreground/45 focus:outline-none focus:translate-x-[-2px] focus:translate-y-[-2px] focus:shadow-shadow motion-safe:transition-[transform,box-shadow]"
            />
          </label>

          <div className="flex items-center gap-2">
            <span className="hidden md:inline-flex items-center gap-1.5 font-mono text-caption text-foreground/65">
              <Filter className="size-3.5" aria-hidden />
              {totalShown} tools · {totalCategories} categories
            </span>
            {hasFilters ? (
              <Button variant="neutral" size="sm" onClick={onClear} className="gap-1">
                <X className="size-3" />
                Clear
              </Button>
            ) : null}
          </div>
        </div>

        {/* Tag row */}
        <div className="flex items-start gap-2 overflow-x-auto md:overflow-visible md:flex-wrap [scrollbar-width:thin] -mx-1 px-1">
          {ALL_TAGS.map((tag) => (
            <TagChip
              key={tag}
              tag={tag}
              active={selectedTags.has(tag)}
              onToggle={onToggleTag}
              size="md"
              count={tagCounts[tag]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
