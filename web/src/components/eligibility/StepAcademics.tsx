import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { useId, useMemo, useRef, useState } from "react";
import { GPA_SCALES } from "@/lib/eligibility/gpa-scales";
import type { GpaScale, StudentProfile } from "@/lib/eligibility/types";
import { DEGREE_LEVELS, FIELDS_OF_STUDY } from "@/lib/filters";
import { cn } from "@/lib/utils";

const MAX_FIELDS = 3;

const LANGUAGE_TESTS = [
  { key: "ielts" as const, label: "IELTS", min: 0, max: 9, step: 0.5 },
  { key: "toefl" as const, label: "TOEFL", min: 0, max: 120, step: 1 },
  { key: "pte" as const, label: "PTE", min: 10, max: 90, step: 1 },
];

interface StepAcademicsProps {
  data: {
    degreeLevel?: string;
    fieldsOfStudy?: string[];
    gpa?: { value: number; scale: GpaScale };
    languageScores?: { ielts?: number; toefl?: number; pte?: number };
  };
  onChange: (updates: Partial<StudentProfile>) => void;
}

export function StepAcademics({ data, onChange }: StepAcademicsProps) {
  const degreeId = useId();
  const fieldId = useId();
  const gpaScaleId = useId();
  const gpaValueId = useId();

  // Field of study search
  const [fieldSearch, setFieldSearch] = useState("");
  const [fieldPopoverOpen, setFieldPopoverOpen] = useState(false);
  const fieldSearchRef = useRef<HTMLInputElement>(null);

  // Language test selection
  const [selectedTests, setSelectedTests] = useState<Set<string>>(() => {
    const tests = new Set<string>();
    if (data.languageScores?.ielts != null) tests.add("ielts");
    if (data.languageScores?.toefl != null) tests.add("toefl");
    if (data.languageScores?.pte != null) tests.add("pte");
    return tests;
  });

  const filteredFields = useMemo(() => {
    if (!fieldSearch.trim()) return [...FIELDS_OF_STUDY];
    const q = fieldSearch.toLowerCase();
    return FIELDS_OF_STUDY.filter((f) => f.toLowerCase().includes(q));
  }, [fieldSearch]);

  const selectedFields = data.fieldsOfStudy ?? [];
  const atMaxFields = selectedFields.length >= MAX_FIELDS;

  function toggleField(field: string) {
    if (selectedFields.includes(field)) {
      onChange({
        fieldsOfStudy: selectedFields.filter((f) => f !== field),
      });
    } else if (!atMaxFields) {
      onChange({ fieldsOfStudy: [...selectedFields, field] });
    }
  }

  function removeField(field: string) {
    onChange({
      fieldsOfStudy: selectedFields.filter((f) => f !== field),
    });
  }

  // GPA scale handling
  const currentGpaScale = data.gpa?.scale
    ? GPA_SCALES.find((s) => s.key === data.gpa?.scale)
    : undefined;

  function handleGpaScaleChange(scaleKey: string) {
    const scale = GPA_SCALES.find((s) => s.key === scaleKey);
    if (scale) {
      onChange({
        gpa: {
          value: data.gpa?.value ?? scale.min,
          scale: scale.key,
        },
      });
    }
  }

  function handleGpaValueChange(value: string) {
    if (!data.gpa?.scale) return;
    const num = Number.parseFloat(value);
    if (!Number.isNaN(num)) {
      onChange({ gpa: { value: num, scale: data.gpa.scale } });
    }
  }

  // Language score handling
  function toggleTest(testKey: string) {
    setSelectedTests((prev) => {
      const next = new Set(prev);
      if (next.has(testKey)) {
        next.delete(testKey);
        // Clear the score
        const updated = { ...data.languageScores };
        delete updated[testKey as keyof typeof updated];
        onChange({
          languageScores: Object.keys(updated).length > 0 ? updated : undefined,
        });
      } else {
        next.add(testKey);
      }
      return next;
    });
  }

  function handleScoreChange(testKey: string, value: string) {
    const num = Number.parseFloat(value);
    if (Number.isNaN(num)) return;
    onChange({
      languageScores: {
        ...data.languageScores,
        [testKey]: num,
      },
    });
  }

  return (
    <div className="space-y-6">
      {/* Step header */}
      <div>
        <h2 className="text-xl font-heading">Academics</h2>
        <p className="text-sm text-foreground/60 mt-1">
          Your academic background helps us match degree and field requirements.
        </p>
      </div>

      {/* Degree Level (required, D-08) */}
      <div className="space-y-2">
        <label htmlFor={degreeId} className="text-[13px] font-base block">
          Degree Level{" "}
          <span className="font-heading text-destructive">*</span>
        </label>
        <select
          id={degreeId}
          value={data.degreeLevel ?? ""}
          onChange={(e) =>
            onChange({
              degreeLevel: e.target.value as StudentProfile["degreeLevel"],
            })
          }
          className="border-[3px] border-border bg-secondary-background h-14 px-4 text-base font-base shadow-shadow focus:translate-x-boxShadowX focus:translate-y-boxShadowY focus:shadow-none transition-all w-full min-h-[44px] outline-none appearance-none cursor-pointer"
          aria-required="true"
        >
          <option value="" disabled>
            Select degree level
          </option>
          {DEGREE_LEVELS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      {/* Field of Study (required, D-10) -- Searchable Multi-select */}
      <div className="space-y-2">
        <label id={fieldId} className="text-[13px] font-base block">
          Field of Study{" "}
          <span className="font-heading text-destructive">*</span>
        </label>

        <Popover.Root
          open={fieldPopoverOpen}
          onOpenChange={(open) => {
            setFieldPopoverOpen(open);
            if (!open) setFieldSearch("");
          }}
        >
          <Popover.Trigger asChild>
            <button
              type="button"
              aria-labelledby={fieldId}
              aria-expanded={fieldPopoverOpen}
              className={cn(
                "flex items-center justify-between w-full border-[3px] border-border bg-secondary-background h-14 px-4 text-base font-base shadow-shadow focus:translate-x-boxShadowX focus:translate-y-boxShadowY focus:shadow-none transition-all min-h-[44px] outline-none text-left",
                selectedFields.length === 0 && "text-foreground/50",
              )}
            >
              <span>
                {selectedFields.length === 0
                  ? "Select fields..."
                  : `${selectedFields.length} field${selectedFields.length > 1 ? "s" : ""} selected`}
              </span>
              <ChevronDown className="size-4 shrink-0 text-foreground/60" />
            </button>
          </Popover.Trigger>

          <Popover.Portal>
            <Popover.Content
              sideOffset={4}
              align="start"
              className="z-50 w-[var(--radix-popover-trigger-width)] max-h-80 border-2 border-border bg-secondary-background shadow-shadow overflow-hidden flex flex-col"
              onOpenAutoFocus={() => {
                setTimeout(() => fieldSearchRef.current?.focus(), 0);
              }}
            >
              {/* Search input */}
              <div className="p-2 border-b border-border">
                <div className="relative">
                  <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 size-3.5 text-foreground/50 pointer-events-none" />
                  <input
                    ref={fieldSearchRef}
                    type="text"
                    aria-label="Search fields of study"
                    placeholder="Search fields..."
                    value={fieldSearch}
                    onChange={(e) => setFieldSearch(e.target.value)}
                    className="w-full border-2 border-border bg-background ps-8 pe-3 py-1.5 text-sm focus:ring-1 focus:ring-ring focus:outline-none"
                  />
                </div>
              </div>

              {/* Scrollable list */}
              <ul className="overflow-y-auto flex-1 py-1" role="listbox">
                {filteredFields.map((field) => {
                  const isSelected = selectedFields.includes(field);
                  const isDisabled = !isSelected && atMaxFields;
                  return (
                    <li
                      key={field}
                      role="option"
                      aria-selected={isSelected}
                      className={cn(
                        "flex items-center justify-between px-3 py-2.5 min-h-[44px] text-sm cursor-pointer",
                        isSelected ? "bg-main/10" : "hover:bg-main/5",
                        isDisabled && "opacity-50 cursor-not-allowed",
                      )}
                      onClick={() => {
                        if (!isDisabled) toggleField(field);
                      }}
                    >
                      <span>{field}</span>
                      <span
                        className={cn(
                          "size-4 rounded border-2 flex items-center justify-center shrink-0",
                          isSelected
                            ? "bg-main border-main text-main-foreground"
                            : "border-border",
                        )}
                      >
                        {isSelected && <Check className="size-3" />}
                      </span>
                    </li>
                  );
                })}
                {filteredFields.length === 0 && (
                  <li className="px-3 py-4 text-center text-sm text-foreground/60">
                    No fields found
                  </li>
                )}
              </ul>

              {/* Footer with count */}
              <div className="px-3 py-2 border-t border-border text-xs text-foreground/60">
                {selectedFields.length}/{MAX_FIELDS} selected (max {MAX_FIELDS})
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>

        {/* Selected fields as badges */}
        {selectedFields.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedFields.map((field) => (
              <span
                key={field}
                className="inline-flex items-center gap-1 bg-main/10 border-2 border-border px-2 py-1 text-xs font-base"
              >
                {field}
                <button
                  type="button"
                  onClick={() => removeField(field)}
                  aria-label={`Remove ${field}`}
                  className="ms-0.5 hover:text-foreground/80"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* GPA (optional, D-12) */}
      <div className="space-y-2">
        <label className="text-[13px] font-base block">
          GPA{" "}
          <span className="text-foreground/50 text-[13px]">(optional)</span>
        </label>
        <div className="flex gap-3 flex-wrap">
          {/* GPA Scale selector */}
          <div className="flex-1 min-w-[200px]">
            <select
              id={gpaScaleId}
              value={data.gpa?.scale ?? ""}
              onChange={(e) => handleGpaScaleChange(e.target.value)}
              aria-label="Grading system"
              className="border-[3px] border-border bg-secondary-background h-14 px-4 text-base font-base shadow-shadow focus:translate-x-boxShadowX focus:translate-y-boxShadowY focus:shadow-none transition-all w-full min-h-[44px] outline-none appearance-none cursor-pointer"
            >
              <option value="" disabled>
                Select grading system
              </option>
              {GPA_SCALES.map((scale) => (
                <option key={scale.key} value={scale.key}>
                  {scale.label}
                </option>
              ))}
            </select>
          </div>

          {/* GPA Value input */}
          {currentGpaScale && (
            <div className="w-[140px]">
              <input
                id={gpaValueId}
                type="number"
                min={currentGpaScale.min}
                max={currentGpaScale.max}
                step={currentGpaScale.step}
                value={data.gpa?.value ?? ""}
                onChange={(e) => handleGpaValueChange(e.target.value)}
                placeholder={`${currentGpaScale.min} - ${currentGpaScale.max}`}
                aria-label="GPA value"
                className="border-[3px] border-border bg-secondary-background h-14 px-4 text-base font-base shadow-shadow focus:translate-x-boxShadowX focus:translate-y-boxShadowY focus:shadow-none transition-all w-full min-h-[44px] outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Language Scores (optional, D-11) */}
      <div className="space-y-3">
        <label className="text-[13px] font-base block">
          Language Scores{" "}
          <span className="text-foreground/50 text-[13px]">(optional)</span>
        </label>
        <p className="text-foreground/50 text-[13px]">
          Select which test(s) you have taken.
        </p>

        {/* Test checkboxes */}
        <div className="flex flex-wrap gap-3">
          {LANGUAGE_TESTS.map((test) => {
            const isChecked = selectedTests.has(test.key);
            const testCheckboxId = `lang-test-${test.key}`;
            return (
              <label
                key={test.key}
                htmlFor={testCheckboxId}
                className={cn(
                  "flex items-center gap-2 border-2 border-border px-4 py-3 cursor-pointer transition-all min-h-[44px] text-sm font-base select-none",
                  isChecked
                    ? "bg-main/10 border-border"
                    : "bg-secondary-background border-border hover:bg-main/5",
                )}
              >
                <input
                  id={testCheckboxId}
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleTest(test.key)}
                  className="size-5"
                />
                {test.label}
              </label>
            );
          })}
        </div>

        {/* Score inputs for selected tests */}
        {selectedTests.size > 0 && (
          <div className="flex flex-wrap gap-4 mt-2">
            {LANGUAGE_TESTS.filter((t) => selectedTests.has(t.key)).map(
              (test) => {
                const scoreId = `score-${test.key}`;
                return (
                  <div key={test.key} className="space-y-1">
                    <label
                      htmlFor={scoreId}
                      className="text-[13px] font-base block"
                    >
                      {test.label} Score
                    </label>
                    <input
                      id={scoreId}
                      type="number"
                      min={test.min}
                      max={test.max}
                      step={test.step}
                      value={
                        data.languageScores?.[
                          test.key as keyof NonNullable<
                            typeof data.languageScores
                          >
                        ] ?? ""
                      }
                      onChange={(e) =>
                        handleScoreChange(test.key, e.target.value)
                      }
                      placeholder={`${test.min}-${test.max}`}
                      className="border-[3px] border-border bg-secondary-background h-14 px-4 text-base font-base shadow-shadow focus:translate-x-boxShadowX focus:translate-y-boxShadowY focus:shadow-none transition-all w-[140px] min-h-[44px] outline-none"
                    />
                  </div>
                );
              },
            )}
          </div>
        )}
      </div>
    </div>
  );
}
