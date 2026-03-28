import { ArrowRight, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCountryFlag, getCountryName } from "@/lib/countries";
import type { StudentProfile } from "@/lib/eligibility/types";

interface WelcomeBackProps {
  profile: Partial<StudentProfile>;
  onViewResults: () => void;
  onUpdateProfile: () => void;
}

export function WelcomeBack({ profile, onViewResults, onUpdateProfile }: WelcomeBackProps) {
  const nationality = profile.nationalities?.[0];
  const degreeLabel = profile.degreeLevel
    ? profile.degreeLevel === "bachelor"
      ? "Bachelor's"
      : profile.degreeLevel === "master"
        ? "Master's"
        : profile.degreeLevel === "phd"
          ? "PhD"
          : "Postdoc"
    : null;
  const fieldCount = profile.fieldsOfStudy?.length ?? 0;

  return (
    <div className="pt-28 pb-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Custom card — avoids Card component's gap/padding to control accent stripe placement */}
        <div className="border-2 border-border bg-secondary-background shadow-shadow rounded-base overflow-hidden">
          {/* Pass 3: Accent stripe — adds warmth + visual anchor */}
          <div className="h-2 bg-accent" />

          <div className="p-6 space-y-5">
            {/* Pass 1: Header section */}
            <div>
              <h1 className="text-2xl font-heading leading-tight mb-1">
                Welcome back!
              </h1>
              <p className="text-sm text-foreground/60">
                We found your previous scholarship profile.
              </p>
            </div>

            {/* Pass 1: Profile summary badges */}
            <div className="flex flex-wrap items-center gap-2">
              {nationality && (
                <Badge variant="default">
                  {getCountryFlag(nationality)} {getCountryName(nationality)}
                </Badge>
              )}
              {degreeLabel && <Badge variant="neutral">{degreeLabel}</Badge>}
              {fieldCount > 0 && (
                <Badge variant="neutral">
                  {fieldCount} {fieldCount === 1 ? "field" : "fields"} of study
                </Badge>
              )}
            </div>

            {/* Pass 3: Divider — separates profile info from actions */}
            <div className="border-t-2 border-border" />

            {/* Pass 1+4: Action buttons — noShadow inside shadowed container prevents stacking */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="noShadow"
                size="lg"
                onClick={onViewResults}
                className="flex-1 hover:brightness-110 transition-[transform,filter] duration-150 ease-out-expo"
              >
                View My Results
                <ArrowRight className="size-4" />
              </Button>
              <Button
                variant="neutral"
                size="lg"
                onClick={onUpdateProfile}
                className="flex-1 shadow-none hover:translate-x-0 hover:translate-y-0"
              >
                <Pencil className="size-3.5" />
                Update Profile
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
