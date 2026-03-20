import { X } from "lucide-react";
import { useNationalityDetect } from "@/hooks/useNationalityDetect";
import { useScholarshipFilters } from "@/hooks/useScholarshipFilters";
import { getCountryFlag, getCountryName } from "@/lib/countries";

/**
 * Auto-detect suggestion banner.
 * Shows when nationality is detected via timezone but user hasn't set one yet.
 * Dismissible with X button, persists dismissal to localStorage.
 */
export function NationalityBanner() {
  const { detectedCountry, dismissed, dismiss } = useNationalityDetect();
  const { filters, setFilter } = useScholarshipFilters();

  // Only show when: detected country exists, not dismissed, and no nationality set
  if (!detectedCountry || dismissed || filters.from.length > 0) {
    return null;
  }

  function handleSetNationality() {
    setFilter("from", detectedCountry);
    dismiss();
  }

  return (
    <div className="bg-[var(--urgency-warning)]/20 border-2 border-[var(--urgency-warning)] rounded-base p-3 flex items-center justify-between gap-3">
      <p className="text-sm font-base text-foreground">
        It looks like you might be in{" "}
        <span className="font-heading">
          {getCountryFlag(detectedCountry)} {getCountryName(detectedCountry)}
        </span>
        .{" "}
        <button
          type="button"
          onClick={handleSetNationality}
          aria-label="Set as nationality"
          className="text-main font-heading hover:underline"
        >
          Set as nationality
        </button>
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss nationality suggestion"
        className="shrink-0 p-1.5 rounded-base hover:bg-foreground/10 min-h-[44px] min-w-[44px] flex items-center justify-center"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
