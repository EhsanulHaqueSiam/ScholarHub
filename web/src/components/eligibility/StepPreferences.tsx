import { useId } from "react";
import { CountrySelector } from "@/components/directory/CountrySelector";
import type { StudentProfile } from "@/lib/eligibility/types";
import { FUNDING_TYPES } from "@/lib/filters";
import { cn } from "@/lib/utils";

const POPULAR_DESTINATIONS = [
  "US", "GB", "DE", "CA", "AU", "NL", "SE", "JP", "FR", "KR", "NZ", "IT",
];

interface StepPreferencesProps {
  data: {
    destinationCountries?: string[];
    fundingPreference?: string;
  };
  onChange: (updates: Partial<StudentProfile>) => void;
}

export function StepPreferences({ data, onChange }: StepPreferencesProps) {
  const fundingId = useId();

  return (
    <div className="space-y-6">
      {/* Step header */}
      <div>
        <h2 className="text-xl font-heading">Preferences</h2>
        <p className="text-sm text-foreground/60 mt-1">
          Where do you want to study? What kind of funding are you looking for?
        </p>
      </div>

      {/* Destination Countries (optional, D-13) */}
      <div className="space-y-2">
        <label className="text-caption font-base block">
          Destination Countries{" "}
          <span className="text-foreground/50 text-caption">(optional)</span>
        </label>
        <p id="destination-helper" className="text-foreground/50 text-caption">
          Where do you want to study? Pick up to 5 countries.
        </p>
        <CountrySelector
          selected={data.destinationCountries ?? []}
          onChange={(codes) => onChange({ destinationCountries: codes })}
          placeholder="Select destination countries"
          popularList={POPULAR_DESTINATIONS}
          maxSelections={5}
          aria-describedby="destination-helper"
        />
      </div>

      {/* Funding Type (optional) */}
      <div className="space-y-2">
        <label htmlFor={fundingId} className="text-caption font-base block">
          Funding Preference{" "}
          <span className="text-foreground/50 text-caption">(optional)</span>
        </label>
        <select
          id={fundingId}
          value={data.fundingPreference ?? ""}
          onChange={(e) =>
            onChange({
              fundingPreference:
                (e.target.value as StudentProfile["fundingPreference"]) ||
                undefined,
            })
          }
          className="border-[3px] border-border bg-secondary-background h-14 px-4 text-base font-base shadow-shadow focus:translate-x-boxShadowX focus:translate-y-boxShadowY focus:shadow-none transition-[transform,box-shadow] duration-150 ease-out-expo w-full min-h-[44px] outline-none appearance-none cursor-pointer"
        >
          <option value="">No preference</option>
          {FUNDING_TYPES.map((ft) => (
            <option key={ft.value} value={ft.value}>
              {ft.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
