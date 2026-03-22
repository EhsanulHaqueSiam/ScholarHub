import { useQuery } from "convex/react";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface RevisionHistoryProps {
  scholarshipId: Id<"scholarships">;
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }) +
    " " +
    date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
}

function truncateValue(value: string | undefined | null, maxLength = 100): string {
  if (!value) return "(empty)";
  if (value.length <= maxLength) return value;
  return value.slice(0, maxLength) + "...";
}

/**
 * RevisionHistory: Collapsible timeline of scholarship field changes.
 * Shows newest changes first, with a vertical timeline line and dots.
 */
export function RevisionHistory({ scholarshipId }: RevisionHistoryProps) {
  const revisions = useQuery(api.admin.getRevisionHistory, { scholarshipId });
  const [isOpen, setIsOpen] = useState(false);

  const revisionCount = revisions?.length ?? 0;

  return (
    <div className="mt-6 border-t-2 border-border pt-4">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm font-heading w-full text-left"
        aria-label={isOpen ? "Hide change history" : "Show change history"}
      >
        <ChevronDown
          className={cn(
            "size-4 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
        Change History ({revisionCount} revisions)
      </button>

      {isOpen && (
        <div className="mt-3 max-h-[300px] overflow-y-auto">
          {revisionCount === 0 ? (
            <p className="text-xs text-foreground/60">
              No changes recorded yet.
            </p>
          ) : (
            <div className="border-l-2 border-border ml-2">
              {revisions?.map((revision) => (
                <div
                  key={`${revision._id}`}
                  className="relative pl-4 pb-3"
                >
                  {/* Timeline dot */}
                  <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-main" />

                  {/* Content */}
                  <div className="ml-0">
                    <div className="text-xs text-foreground/60">
                      {formatTimestamp(revision.changed_at)}
                    </div>
                    <div className="text-xs font-heading mt-0.5">
                      {revision.field_name}
                    </div>
                    <div className="text-xs mt-0.5 text-foreground/80">
                      <span className="text-foreground/50">
                        {truncateValue(revision.old_value)}
                      </span>
                      <span className="mx-1">{"->"}</span>
                      <span>{truncateValue(revision.new_value)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
