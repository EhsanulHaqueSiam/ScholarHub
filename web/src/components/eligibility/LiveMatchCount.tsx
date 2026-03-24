import { useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { StudentProfile } from "@/lib/eligibility/types";
import { cn } from "@/lib/utils";

interface LiveMatchCountProps {
  profile: Partial<StudentProfile>;
}

/**
 * Displays a live count of matching scholarships during the eligibility wizard (D-07).
 *
 * Three display states:
 * - Loading: "Checking..." with pulse animation
 * - Zero: "No matches yet -- keep filling in your details"
 * - Positive: "{count} scholarships match so far" with scale pulse on change
 *
 * Debounces query args by 500ms to avoid per-keystroke Convex queries (Pitfall 1).
 * Uses aria-live="polite" for screen reader announcements.
 * Respects prefers-reduced-motion via motion-safe: prefix.
 */
export function LiveMatchCount({ profile }: LiveMatchCountProps) {
  // Build debounced query args from current profile state
  // Debounce by 500ms to avoid per-keystroke queries (Pitfall 1 from RESEARCH.md)
  const [debouncedArgs, setDebouncedArgs] = useState<{
    nationalities?: string[];
    degreeLevels?: Array<"bachelor" | "master" | "phd" | "postdoc">;
    fieldsOfStudy?: string[];
  } | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const args: {
        nationalities?: string[];
        degreeLevels?: Array<"bachelor" | "master" | "phd" | "postdoc">;
        fieldsOfStudy?: string[];
      } = {};
      if (profile.nationalities?.length) args.nationalities = profile.nationalities;
      if (profile.degreeLevel) args.degreeLevels = [profile.degreeLevel];
      if (profile.fieldsOfStudy?.length) args.fieldsOfStudy = profile.fieldsOfStudy;
      setDebouncedArgs(Object.keys(args).length > 0 ? args : null);
    }, 500);
    return () => clearTimeout(timeoutRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // Use stable string keys to avoid object reference issues
    profile.nationalities?.join(","),
    profile.degreeLevel,
    profile.fieldsOfStudy?.join(","),
  ]);

  const result = useQuery(
    api.eligibility.getMatchCount,
    debouncedArgs ?? "skip",
  );

  // Track previous count for animation
  const [prevCount, setPrevCount] = useState<number | null>(null);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (result && result.count !== prevCount) {
      setAnimating(true);
      setPrevCount(result.count);
      const timer = setTimeout(() => setAnimating(false), 200);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.count]);

  // Determine display state
  const isLoading = debouncedArgs !== null && result === undefined;
  const count = result?.count ?? 0;
  const hasAnyInput = (profile.nationalities?.length ?? 0) > 0;

  return (
    <div className="text-center py-3" aria-live="polite">
      {!hasAnyInput ? null : isLoading ? (
        <span className="text-foreground/50 text-sm motion-safe:animate-pulse">
          Checking...
        </span>
      ) : count === 0 ? (
        <span className="text-foreground/50 text-sm">
          No matches yet -- keep filling in your details
        </span>
      ) : (
        <span className="text-sm">
          <span
            className={cn(
              "inline-flex items-center bg-accent text-accent-foreground border-2 border-border px-3 py-1 font-heading text-xl",
              "motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out",
              animating && "motion-safe:scale-110",
            )}
          >
            {count}
          </span>
          {" "}scholarships match so far
        </span>
      )}
    </div>
  );
}
