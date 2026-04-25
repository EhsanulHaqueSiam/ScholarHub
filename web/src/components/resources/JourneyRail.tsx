import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface JourneyStop {
  id: string;
  number: string;
  label: string;
}

interface JourneyRailProps {
  stops: JourneyStop[];
}

/** Vertical chapter indicator on large screens. Shows where the reader is in the journey. */
export function JourneyRail({ stops }: JourneyRailProps) {
  const [activeId, setActiveId] = useState(stops[0]?.id ?? "");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const targets = stops
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0];
        if (top?.target.id) setActiveId(top.target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    for (const t of targets) observer.observe(t);
    return () => observer.disconnect();
  }, [stops]);

  return (
    <nav
      aria-label="Page chapters"
      className="hidden xl:block fixed left-4 top-1/2 -translate-y-1/2 z-30"
    >
      <ol className="flex flex-col gap-1.5 border-2 border-border bg-secondary-background shadow-shadow p-2">
        {stops.map((stop) => {
          const active = stop.id === activeId;
          return (
            <li key={stop.id}>
              <a
                href={`#${stop.id}`}
                className={cn(
                  "flex items-center gap-2.5 px-2 py-1.5 motion-safe:transition-[background-color,transform] motion-safe:duration-150",
                  active
                    ? "bg-foreground text-background"
                    : "hover:bg-background text-foreground/70",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "font-mono text-[10px] tabular-nums w-6",
                    active ? "opacity-100" : "opacity-60",
                  )}
                >
                  {stop.number}
                </span>
                <span className="font-heading text-caption whitespace-nowrap">
                  {stop.label}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
