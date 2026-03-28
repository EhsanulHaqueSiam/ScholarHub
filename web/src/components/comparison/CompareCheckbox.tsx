import * as Tooltip from "@radix-ui/react-tooltip";
import { Check } from "lucide-react";
import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { useCompare } from "./CompareContext";

interface CompareCheckboxProps {
  slug: string;
  title: string;
  variant: "card" | "detail" | "listItem";
}

export function CompareCheckbox({ slug, title, variant }: CompareCheckboxProps) {
  const { addToCompare, removeFromCompare, isSelected, isFull } = useCompare();
  const checked = isSelected(slug);
  const disabled = isFull && !checked;

  const toggle = useCallback(() => {
    if (disabled) return;
    if (checked) {
      removeFromCompare(slug);
    } else {
      addToCompare(slug, title);
    }
  }, [disabled, checked, removeFromCompare, addToCompare, slug, title]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toggle();
    },
    [toggle],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }
    },
    [toggle],
  );

  if (variant === "detail") {
    return (
      <button
        type="button"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label={checked ? `Remove ${title} from comparison` : `Add ${title} to comparison`}
        className={cn(
          "inline-flex items-center gap-2 rounded-base border-2 px-4 py-2 text-sm font-heading transition-colors",
          checked
            ? "bg-main border-main text-main-foreground"
            : "bg-secondary-background border-border hover:border-main",
          disabled && "opacity-50 cursor-not-allowed",
        )}
        disabled={disabled}
      >
        {checked ? (
          <>
            <Check className="size-4" />
            Added to Compare
          </>
        ) : (
          "Add to Compare"
        )}
      </button>
    );
  }

  const checkboxButton = (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={`Compare ${title}`}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "flex items-center justify-center rounded-base border-2 transition-colors",
        variant === "listItem" ? "size-5" : "size-6",
        checked
          ? "bg-main border-main text-main-foreground"
          : "bg-secondary-background border-border hover:border-main",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      {checked && <Check className={variant === "listItem" ? "size-3" : "size-4"} />}
    </button>
  );

  if (variant === "card") {
    return (
      <div
        className={cn(
          "absolute top-2 left-2 z-10",
          "opacity-0 group-hover:opacity-100 md:opacity-0 max-md:opacity-100 transition-opacity",
          checked && "opacity-100",
        )}
      >
        {disabled ? (
          <Tooltip.Provider delayDuration={200} skipDelayDuration={0}>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>{checkboxButton}</Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  className="rounded-base border-2 border-border bg-secondary-background px-3 py-1.5 text-xs shadow-shadow"
                  sideOffset={4}
                >
                  Maximum 3 scholarships can be compared at once
                  <Tooltip.Arrow className="fill-secondary-background" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
        ) : (
          checkboxButton
        )}
      </div>
    );
  }

  // variant === "listItem"
  return (
    <div
      className="shrink-0"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {disabled ? (
        <Tooltip.Provider delayDuration={200} skipDelayDuration={0}>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>{checkboxButton}</Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="rounded-base border-2 border-border bg-secondary-background px-3 py-1.5 text-xs shadow-shadow"
                sideOffset={4}
              >
                Maximum 3 scholarships can be compared at once
                <Tooltip.Arrow className="fill-secondary-background" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      ) : (
        checkboxButton
      )}
    </div>
  );
}
