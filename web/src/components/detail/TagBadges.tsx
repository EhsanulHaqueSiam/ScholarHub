import * as Tooltip from "@radix-ui/react-tooltip";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { getTagDescription, getTagLabel } from "@/lib/tags";

interface TagBadgesProps {
  tags?: string[];
  maxVisible?: number;
}

/**
 * Clickable tag badges with description tooltips for the scholarship detail page.
 *
 * D-22: Show tags on detail page only, below badge row.
 * D-23: Tooltip with tag description on hover (200ms delay).
 * D-24: Click navigates to tag-filtered directory.
 * D-112: flex-wrap on mobile.
 */
export function TagBadges({ tags, maxVisible = 5 }: TagBadgesProps) {
  const [expanded, setExpanded] = useState(false);

  if (!tags || tags.length === 0) return null;

  const visibleTags = expanded ? tags : tags.slice(0, maxVisible);
  const hiddenCount = tags.length - maxVisible;

  return (
    <Tooltip.Provider delayDuration={200} skipDelayDuration={0}>
      <div className="flex flex-wrap gap-2">
        {visibleTags.map((tagId) => {
          const label = getTagLabel(tagId);
          const description = getTagDescription(tagId);

          const badge = (
            <Badge
              variant="neutral"
              className="cursor-pointer bg-transparent hover:bg-secondary-background transition-colors"
              asChild
            >
              <Link to="/scholarships" search={{ tags: tagId }}>
                {label}
              </Link>
            </Badge>
          );

          if (description) {
            return (
              <Tooltip.Root key={tagId}>
                <Tooltip.Trigger asChild>{badge}</Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    className="rounded-base border-2 border-border bg-secondary-background px-3 py-1.5 text-xs shadow-shadow max-w-[240px]"
                    sideOffset={4}
                  >
                    {description}
                    <Tooltip.Arrow className="fill-secondary-background" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            );
          }

          return <span key={tagId}>{badge}</span>;
        })}

        {/* Expand/collapse for overflow */}
        {hiddenCount > 0 && !expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="inline-flex items-center rounded-base border-2 border-border px-2.5 py-0.5 text-xs font-base hover:bg-secondary-background transition-colors"
          >
            +{hiddenCount} more
          </button>
        )}
        {expanded && tags.length > maxVisible && (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="inline-flex items-center rounded-base border-2 border-border px-2.5 py-0.5 text-xs font-base hover:bg-secondary-background transition-colors"
          >
            Show less
          </button>
        )}
      </div>
    </Tooltip.Provider>
  );
}
