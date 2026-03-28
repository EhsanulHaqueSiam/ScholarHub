import * as Popover from "@radix-ui/react-popover";
import { Pencil } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CountrySelector } from "@/components/directory/CountrySelector";
import {
  getCountryFlag,
  getCountryName,
  POPULAR_NATIONALITIES,
  POPULAR_DESTINATIONS,
} from "@/lib/countries";
import { DEGREE_LEVELS, FIELDS_OF_STUDY, FUNDING_TYPES } from "@/lib/filters";
import type { StudentProfile } from "@/lib/eligibility/types";
import { analytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ProfileSummaryCardProps {
  profile: StudentProfile;
  onEdit: (updates: Partial<StudentProfile>) => void;
  onStartOver: () => void;
}

// ---------------------------------------------------------------------------
// Inline editable field with Popover
// ---------------------------------------------------------------------------

function EditableField({
  label,
  children,
  editor,
  fieldName,
}: {
  label: string;
  children: React.ReactNode;
  editor: React.ReactNode;
  fieldName: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover.Root
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (!newOpen) {
          analytics.track("profile_edited", { field: fieldName });
        }
      }}
    >
      <Popover.Trigger asChild>
        <button
          type="button"
          className="group inline-flex items-center gap-1 border-b border-dashed border-foreground/20 hover:border-foreground/40 transition-colors cursor-pointer"
        >
          {children}
          <Pencil className="size-3 opacity-0 group-hover:opacity-50 transition-opacity" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={8}
          align="start"
          className="z-50 border-2 border-border bg-secondary-background shadow-shadow p-4 rounded-base min-w-[240px] max-w-[320px]"
          style={{ transformOrigin: 'var(--radix-popover-content-transform-origin)' }}
        >
          <p className="text-caption font-base text-foreground/60 mb-2">
            {label}
          </p>
          {editor}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

// ---------------------------------------------------------------------------
// Degree selector editor
// ---------------------------------------------------------------------------

function DegreeEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (degree: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {DEGREE_LEVELS.map((level) => (
        <button
          key={level.value}
          type="button"
          onClick={() => onChange(level.value)}
          className={cn(
            "text-start px-3 py-2 rounded-base border-2 text-sm min-h-[44px] transition-colors",
            value === level.value
              ? "bg-main text-main-foreground border-border"
              : "bg-secondary-background text-foreground border-border hover:bg-main/5",
          )}
        >
          {level.label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fields of study editor (searchable multi-select)
// ---------------------------------------------------------------------------

function FieldsEditor({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (fields: string[]) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = search.trim()
    ? FIELDS_OF_STUDY.filter((f) =>
        f.toLowerCase().includes(search.toLowerCase()),
      )
    : FIELDS_OF_STUDY;

  const toggleField = (field: string) => {
    if (selected.includes(field)) {
      onChange(selected.filter((f) => f !== field));
    } else if (selected.length < 3) {
      onChange([...selected, field]);
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Search fields..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border-2 border-border rounded-base bg-background px-3 py-1.5 text-sm mb-2 focus:ring-1 focus:ring-ring focus:outline-none"
      />
      <div className="max-h-48 overflow-y-auto space-y-1">
        {filtered.map((field) => {
          const isSelected = selected.includes(field);
          return (
            <button
              key={field}
              type="button"
              onClick={() => toggleField(field)}
              disabled={!isSelected && selected.length >= 3}
              className={cn(
                "w-full text-start px-2 py-1.5 rounded-base text-sm transition-colors",
                isSelected
                  ? "bg-main/10 font-heading"
                  : "hover:bg-main/5",
                !isSelected &&
                  selected.length >= 3 &&
                  "opacity-50 cursor-not-allowed",
              )}
            >
              {isSelected ? "* " : ""}
              {field}
            </button>
          );
        })}
      </div>
      <p className="text-caption text-foreground/50 mt-1.5">
        {selected.length}/3 selected
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Funding preference editor
// ---------------------------------------------------------------------------

function FundingEditor({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (funding: string | undefined) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {FUNDING_TYPES.map((type) => (
        <button
          key={type.value}
          type="button"
          onClick={() =>
            onChange(value === type.value ? undefined : type.value)
          }
          className={cn(
            "text-start px-3 py-2 rounded-base border-2 text-sm min-h-[44px] transition-colors",
            value === type.value
              ? "bg-main text-main-foreground border-border"
              : "bg-secondary-background text-foreground border-border hover:bg-main/5",
          )}
        >
          {type.label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ProfileSummaryCard
// ---------------------------------------------------------------------------

export function ProfileSummaryCard({
  profile,
  onEdit,
  onStartOver,
}: ProfileSummaryCardProps) {
  if (!profile) return null;

  const degreeLabel =
    DEGREE_LEVELS.find((d) => d.value === profile.degreeLevel)?.label ??
    profile.degreeLevel;

  const handleStartOver = () => {
    if (
      window.confirm(
        "This will clear your saved profile and start fresh. Continue?",
      )
    ) {
      analytics.track("profile_cleared");
      onStartOver();
    }
  };

  return (
    <Card prestige="unranked" className="bg-secondary-background">
      <CardHeader>
        <CardTitle className="text-lg">Your Profile</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="flex flex-wrap items-center gap-3">
          {/* Nationality */}
          {profile.nationalities?.length > 0 && (
            <EditableField
              label="Nationality"
              fieldName="nationality"
              editor={
                <CountrySelector
                  selected={profile.nationalities}
                  onChange={(codes) => onEdit({ nationalities: codes })}
                  placeholder="Select nationalities"
                  popularList={POPULAR_NATIONALITIES}
                  maxSelections={5}
                />
              }
            >
              <div className="flex items-center gap-1">
                {profile.nationalities.map((code) => (
                  <Badge key={code} variant="neutral" className="gap-1">
                    <span role="img" aria-label={getCountryName(code)}>
                      {getCountryFlag(code)}
                    </span>
                    {getCountryName(code)}
                  </Badge>
                ))}
              </div>
            </EditableField>
          )}

          {/* Degree */}
          {profile.degreeLevel && (
            <EditableField
              label="Degree Level"
              fieldName="degree"
              editor={
                <DegreeEditor
                  value={profile.degreeLevel}
                  onChange={(d) =>
                    onEdit({
                      degreeLevel: d as StudentProfile["degreeLevel"],
                    })
                  }
                />
              }
            >
              <Badge variant="default">{degreeLabel}</Badge>
            </EditableField>
          )}

          {/* Fields of study */}
          {profile.fieldsOfStudy?.length > 0 && (
            <EditableField
              label="Fields of Study"
              fieldName="fieldsOfStudy"
              editor={
                <FieldsEditor
                  selected={profile.fieldsOfStudy}
                  onChange={(fields) => onEdit({ fieldsOfStudy: fields })}
                />
              }
            >
              <div className="flex items-center gap-1">
                {profile.fieldsOfStudy.map((field) => (
                  <Badge key={field} variant="neutral">
                    {field}
                  </Badge>
                ))}
              </div>
            </EditableField>
          )}

          {/* Destinations */}
          {profile.destinationCountries &&
            profile.destinationCountries.length > 0 && (
              <EditableField
                label="Destination Countries"
                fieldName="destinations"
                editor={
                  <CountrySelector
                    selected={profile.destinationCountries}
                    onChange={(codes) =>
                      onEdit({ destinationCountries: codes })
                    }
                    placeholder="Select destinations"
                    popularList={POPULAR_DESTINATIONS}
                    maxSelections={5}
                  />
                }
              >
                <div className="flex items-center gap-1">
                  {profile.destinationCountries.map((code) => (
                    <Badge key={code} variant="neutral" className="gap-1">
                      <span role="img" aria-label={getCountryName(code)}>
                        {getCountryFlag(code)}
                      </span>
                      {getCountryName(code)}
                    </Badge>
                  ))}
                </div>
              </EditableField>
            )}

          {/* Funding preference */}
          {profile.fundingPreference && (
            <EditableField
              label="Funding Preference"
              fieldName="funding"
              editor={
                <FundingEditor
                  value={profile.fundingPreference}
                  onChange={(f) =>
                    onEdit({
                      fundingPreference:
                        f as StudentProfile["fundingPreference"],
                    })
                  }
                />
              }
            >
              <Badge variant="neutral">
                {FUNDING_TYPES.find(
                  (t) => t.value === profile.fundingPreference,
                )?.label ?? profile.fundingPreference}
              </Badge>
            </EditableField>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between">
        <p className="text-caption text-foreground/50">
          Edit your profile to update results
        </p>
        <Button
          variant="destructive"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            handleStartOver();
          }}
        >
          Start Over
        </Button>
      </CardFooter>
    </Card>
  );
}
