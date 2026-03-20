import { useEffect, useState } from "react";

/**
 * Client-only countdown hook. Returns null during SSR, numeric daysLeft after hydration.
 * Updates every 60 seconds. Avoids hydration mismatch by initializing to null.
 */
export function useCountdown(deadlineMs: number | undefined): number | null {
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!deadlineMs) return;
    const calculate = () => {
      const diff = deadlineMs - Date.now();
      setDaysLeft(Math.ceil(diff / (1000 * 60 * 60 * 24)));
    };
    calculate();
    const interval = setInterval(calculate, 60 * 1000);
    return () => clearInterval(interval);
  }, [deadlineMs]);

  return daysLeft;
}

/**
 * Format deadline date in user's local timezone with timezone label.
 * Returns object with formattedDate and userTimezone strings.
 * SSR-safe: returns generic format when Intl is unavailable.
 */
export function formatDeadlineDisplay(deadlineMs: number): {
  formattedDate: string;
  userTimezone: string;
} {
  const date = new Date(deadlineMs);
  const userTz =
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "UTC";

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: userTz,
  }).format(date);

  return { formattedDate, userTimezone: userTz };
}

/**
 * Format last verified timestamp as relative + absolute string.
 * Returns null if timestamp is undefined.
 * isStale is true when >30 days since verification.
 */
export function formatLastVerified(timestampMs: number | undefined): {
  relative: string;
  absolute: string;
  isStale: boolean;
} | null {
  if (!timestampMs) return null;

  const now = Date.now();
  const diffMs = now - timestampMs;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const isStale = diffDays > 30;

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const relative = rtf.format(-diffDays, "day");

  const dtf = new Intl.DateTimeFormat("en-US", { dateStyle: "long" });
  const absolute = dtf.format(new Date(timestampMs));

  return { relative, absolute, isStale };
}

/**
 * IntersectionObserver hook for sticky bar visibility.
 * Returns true when the observed element (hero) is visible in viewport.
 * Defaults to true (hero visible) to avoid flash on initial render.
 */
export function useIsHeroVisible(
  heroRef: React.RefObject<HTMLElement | null>,
): boolean {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [heroRef]);

  return isVisible;
}
