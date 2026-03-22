import * as Tooltip from "@radix-ui/react-tooltip";
import { useMutation } from "convex/react";
import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getTagLabel } from "@/lib/tags";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface SuggestedTag {
  tag: string;
  reason: string;
  suggested_at: number;
}

interface SuggestedTagReviewProps {
  scholarshipId: Id<"scholarships">;
  suggestedTags: SuggestedTag[];
}

/**
 * SuggestedTagReview: Accept/reject suggested tags with reason tooltip.
 * Each tag shown as amber Badge with accept (check) and reject (X) buttons.
 * Matched text snippet displayed in tooltip on hover (200ms delay).
 * D-37: No confirmation for reject -- immediate action, low-stakes, reversible.
 */
export function SuggestedTagReview({ scholarshipId, suggestedTags }: SuggestedTagReviewProps) {
  const acceptTag = useMutation(api.tags.acceptSuggestedTag);
  const rejectTag = useMutation(api.tags.rejectSuggestedTag);

  if (suggestedTags.length === 0) return null;

  return (
    <Tooltip.Provider delayDuration={200}>
      <div className="flex flex-wrap gap-2">
        {suggestedTags.map((suggested) => (
          <Tooltip.Root key={suggested.tag}>
            <Tooltip.Trigger asChild>
              <span className="inline-flex items-center gap-1">
                <Badge variant="tagSuggested">
                  {getTagLabel(suggested.tag)}
                </Badge>
                <button
                  type="button"
                  onClick={() => acceptTag({ scholarshipId, tag: suggested.tag })}
                  className="p-0.5 rounded-sm hover:bg-urgency-open/20 text-urgency-open transition-colors"
                  aria-label={`Accept tag ${getTagLabel(suggested.tag)}`}
                >
                  <Check className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => rejectTag({ scholarshipId, tag: suggested.tag })}
                  className="p-0.5 rounded-sm hover:bg-destructive/20 text-destructive transition-colors"
                  aria-label={`Reject tag ${getTagLabel(suggested.tag)}`}
                >
                  <X className="size-3.5" />
                </button>
              </span>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="bg-foreground text-background text-xs rounded-base px-3 py-2 max-w-xs shadow-shadow border-2 border-border z-50"
                sideOffset={5}
              >
                {suggested.reason}
                <Tooltip.Arrow className="fill-foreground" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        ))}
      </div>
    </Tooltip.Provider>
  );
}
