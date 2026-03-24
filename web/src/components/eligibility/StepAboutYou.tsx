import { useEffect, useId } from "react";
import { CountrySelector } from "@/components/directory/CountrySelector";
import { useNationalityDetect } from "@/hooks/useNationalityDetect";
import type { Gender, StudentProfile } from "@/lib/eligibility/types";
import { cn } from "@/lib/utils";

const POPULAR_NATIONALITIES = [
  "BD", "IN", "PK", "NG", "GH", "KE", "ET", "NP", "LK", "VN", "PH", "EG",
];

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "non_binary", label: "Non-binary" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

interface StepAboutYouProps {
  data: {
    nationalities?: string[];
    age?: number;
    gender?: Gender;
  };
  onChange: (updates: Partial<StudentProfile>) => void;
}

export function StepAboutYou({ data, onChange }: StepAboutYouProps) {
  const ageId = useId();
  const genderGroupId = useId();
  const { detectedCountry } = useNationalityDetect();

  // Auto-detect nationality (D-09)
  useEffect(() => {
    if (
      detectedCountry &&
      (!data.nationalities || data.nationalities.length === 0)
    ) {
      onChange({ nationalities: [detectedCountry] });
    }
  }, [detectedCountry]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      {/* Step header */}
      <div>
        <h2 className="text-xl font-heading">About You</h2>
        <p className="text-sm text-foreground/60 mt-1">
          Tell us where you're from so we can find scholarships available to
          you.
        </p>
      </div>

      {/* Nationality (required, D-09) */}
      <div className="space-y-2">
        <label className="text-[13px] font-base block">
          Nationality{" "}
          <span className="font-heading text-destructive">*</span>
        </label>
        <CountrySelector
          selected={data.nationalities ?? []}
          onChange={(codes) => onChange({ nationalities: codes })}
          placeholder="Select your nationality"
          popularList={POPULAR_NATIONALITIES}
          maxSelections={3}
        />
        <p className="text-foreground/50 text-[13px]">
          Supports dual citizens -- select up to 3 nationalities.
        </p>
      </div>

      {/* Age (optional, D-08) */}
      <div className="space-y-2">
        <label htmlFor={ageId} className="text-[13px] font-base block">
          Age{" "}
          <span className="text-foreground/50 text-[13px]">(optional)</span>
        </label>
        <input
          id={ageId}
          type="number"
          min={15}
          max={60}
          value={data.age ?? ""}
          onChange={(e) => {
            const val = e.target.value;
            onChange({
              age: val ? Number.parseInt(val, 10) : undefined,
            });
          }}
          placeholder="e.g. 22"
          className="border-[3px] border-border bg-secondary-background h-14 px-4 text-base font-base shadow-shadow focus:translate-x-boxShadowX focus:translate-y-boxShadowY focus:shadow-none transition-all w-full max-w-[200px] min-h-[44px] outline-none"
          aria-required="false"
        />
      </div>

      {/* Gender (optional, D-14) */}
      <div className="space-y-2">
        <label id={genderGroupId} className="text-[13px] font-base block">
          Gender{" "}
          <span className="text-foreground/50 text-[13px]">(optional)</span>
        </label>
        <p className="text-foreground/50 text-[13px]">
          Some scholarships target specific groups -- answering helps us find
          more matches for you.
        </p>
        <div
          role="radiogroup"
          aria-labelledby={genderGroupId}
          aria-label="Gender"
          className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3"
        >
          {GENDER_OPTIONS.map((option) => {
            const isSelected = data.gender === option.value;
            const radioId = `${genderGroupId}-${option.value}`;
            return (
              <label
                key={option.value}
                htmlFor={radioId}
                className={cn(
                  "flex items-center gap-2 border-2 border-border px-4 py-3 cursor-pointer transition-all min-h-[44px] text-sm font-base select-none",
                  isSelected
                    ? "bg-main text-main-foreground shadow-none translate-x-boxShadowX translate-y-boxShadowY"
                    : "bg-secondary-background shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none",
                )}
              >
                <input
                  id={radioId}
                  type="radio"
                  name="gender"
                  value={option.value}
                  checked={isSelected}
                  onChange={() => onChange({ gender: option.value })}
                  className="sr-only"
                  aria-required="false"
                />
                <span
                  className={cn(
                    "size-4 rounded-full border-2 flex items-center justify-center shrink-0",
                    isSelected
                      ? "border-main-foreground"
                      : "border-border",
                  )}
                >
                  {isSelected && (
                    <span className="size-2 rounded-full bg-main-foreground" />
                  )}
                </span>
                {option.label}
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
