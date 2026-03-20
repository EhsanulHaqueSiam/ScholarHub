import { useMemo } from "react";
import { TIMEZONE_TO_COUNTRY } from "@/lib/countries";
import { useLocalStorage } from "./useLocalStorage";

/**
 * Detects the user's likely country from browser timezone.
 * Returns detected country code, dismissed state, and dismiss function.
 *
 * - Uses Intl.DateTimeFormat().resolvedOptions().timeZone for IANA timezone
 * - Looks up in TIMEZONE_TO_COUNTRY mapping from countries.ts
 * - Stores dismissed state in localStorage
 * - SSR-safe: returns null on server
 */
export function useNationalityDetect() {
  const [dismissed, setDismissed] = useLocalStorage(
    "scholarhub_nationality_banner_dismissed",
    false,
  );

  const detectedCountry = useMemo(() => {
    if (typeof window === "undefined") return null;
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return TIMEZONE_TO_COUNTRY[tz] ?? null;
    } catch {
      return null;
    }
  }, []);

  return {
    detectedCountry,
    dismissed,
    dismiss: () => setDismissed(true),
  };
}
