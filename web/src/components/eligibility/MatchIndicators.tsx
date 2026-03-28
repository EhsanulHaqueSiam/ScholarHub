import { Check, ChevronDown, Minus, X } from "lucide-react";
import { useState } from "react";
import type { MatchBreakdown, MatchStatus } from "@/lib/eligibility/types";
import { cn } from "@/lib/utils";

interface MatchIndicatorsProps {
  breakdown: MatchBreakdown;
  className?: string;
}

const DIMENSIONS = [
  { key: "nationality" as const, label: "Nationality" },
  { key: "degree" as const, label: "Degree" },
  { key: "field" as const, label: "Field" },
  { key: "language" as const, label: "Language" },
] as const;

/**
 * Get the icon component, color class, and aria text for a match status.
 */
function getStatusDisplay(dimension: string, status: MatchStatus) {
  const iconMap: Record<MatchStatus, typeof Check> = {
    match: Check,
    partial: Check,
    no_match: X,
    unknown: Minus,
    not_required: Minus,
  };

  const colorMap: Record<MatchStatus, string> = {
    match: "text-match-check",
    partial: "text-match-check",
    no_match: "text-match-cross",
    unknown: "text-match-unknown",
    not_required: "text-match-unknown",
  };

  const ariaTextMap: Record<string, Record<MatchStatus, string>> = {
    nationality: {
      match: "Your nationality is eligible",
      partial: "Your nationality may be eligible",
      no_match: "Nationality not in eligibility list",
      unknown: "Nationality requirements not specified",
      not_required: "No nationality requirement",
    },
    degree: {
      match: "Degree level matches",
      partial: "Degree level partially matches",
      no_match: "Degree level not accepted",
      unknown: "Degree requirements not specified",
      not_required: "No degree requirement",
    },
    field: {
      match: "Field of study matches",
      partial: "Open to all fields of study",
      no_match: "Field of study not accepted",
      unknown: "Field requirements not specified",
      not_required: "No field requirement",
    },
    language: {
      match: "Language requirement met",
      partial: "Language requirement partially met",
      no_match: "Language requirement not met",
      unknown: "Language requirements not specified",
      not_required: "No language requirement",
    },
  };

  const ariaLabel =
    ariaTextMap[dimension]?.[status] ??
    `${dimension}: ${status.replace("_", " ")}`;

  return {
    Icon: iconMap[status],
    colorClass: colorMap[status],
    ariaLabel,
    statusText: ariaLabel,
  };
}

/**
 * Compact match indicators showing check/cross/dash for 4 eligibility dimensions.
 * Expandable to full breakdown with explanation text.
 */
export function MatchIndicators({ breakdown, className }: MatchIndicatorsProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn("", className)}>
      {/* Compact indicator row */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setExpanded((v) => !v);
        }}
        aria-expanded={expanded}
        aria-controls="match-breakdown-panel"
        className="group flex items-center gap-3 py-2 min-h-[44px] w-full cursor-pointer"
      >
        {DIMENSIONS.map(({ key, label }) => {
          const status = breakdown[key];
          const { Icon, colorClass, ariaLabel } = getStatusDisplay(key, status);
          return (
            <div key={key} className="flex flex-col items-center gap-0.5">
              <Icon
                className={cn("size-5", colorClass)}
                aria-label={`${label}: ${ariaLabel}`}
              />
              <span className="text-caption text-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity">
                {label}
              </span>
            </div>
          );
        })}
        <ChevronDown
          className={cn(
            "size-4 text-foreground/40 transition-transform duration-200 ms-auto",
            expanded && "rotate-180",
          )}
        />
      </button>

      {/* Expanded breakdown panel */}
      {expanded && (
        <div
          id="match-breakdown-panel"
          className="bg-secondary-background border-2 border-border p-4 mt-2 rounded-base space-y-3"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {DIMENSIONS.map(({ key, label }) => {
            const status = breakdown[key];
            const { Icon, colorClass, statusText } = getStatusDisplay(
              key,
              status,
            );
            return (
              <div key={key} className="flex items-start gap-3">
                <Icon className={cn("size-5 shrink-0 mt-0.5", colorClass)} />
                <div>
                  <p className="text-sm font-heading">{label}</p>
                  <p className="text-caption text-foreground/60">{statusText}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
