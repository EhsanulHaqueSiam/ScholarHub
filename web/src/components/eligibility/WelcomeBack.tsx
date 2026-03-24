import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="max-w-md mx-auto mt-24 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Welcome back!</CardTitle>
          <p className="text-sm text-foreground/60">
            We found your previous scholarship profile.
          </p>
        </CardHeader>

        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            {nationality && (
              <Badge variant="default">
                {getCountryFlag(nationality)}{" "}
                {getCountryName(nationality)}
              </Badge>
            )}
            {degreeLabel && (
              <Badge variant="neutral">{degreeLabel}</Badge>
            )}
            {fieldCount > 0 && (
              <Badge variant="neutral">
                {fieldCount} {fieldCount === 1 ? "field" : "fields"} of study
              </Badge>
            )}
          </div>
        </CardContent>

        <CardFooter>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button
              variant="default"
              size="lg"
              onClick={onViewResults}
              className="flex-1"
            >
              View My Results
            </Button>
            <Button
              variant="neutral"
              size="lg"
              onClick={onUpdateProfile}
              className="flex-1"
            >
              Update Profile
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
