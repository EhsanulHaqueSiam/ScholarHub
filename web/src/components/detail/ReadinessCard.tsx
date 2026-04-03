import { CheckCircle, AlertCircle, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { StudentProfile } from "@/lib/eligibility/types";
import { cn } from "@/lib/utils";

interface ReadinessGap {
  field: string;
  status: "met" | "gap" | "unknown";
  detail: string;
  action?: string;
}

interface ReadinessCardProps {
  profile: StudentProfile;
  scholarship: {
    eligibility_nationalities?: string[] | null;
    degree_levels: string[];
    fields_of_study?: string[] | null;
    language_requirements?: string;
  };
}

function analyzeReadiness(
  profile: StudentProfile,
  scholarship: ReadinessCardProps["scholarship"],
): ReadinessGap[] {
  const gaps: ReadinessGap[] = [];

  // Nationality check
  const eligNats = scholarship.eligibility_nationalities;
  if (eligNats && eligNats.length > 0) {
    const match = profile.nationalities.some((n) =>
      eligNats.some((e) => e.toUpperCase() === n.toUpperCase()),
    );
    gaps.push({
      field: "Nationality",
      status: match ? "met" : "gap",
      detail: match
        ? "Your nationality is eligible"
        : "Your nationality may not be listed as eligible",
      action: match ? undefined : "Check if your country qualifies under regional eligibility",
    });
  }

  // Degree level check
  const degreeLevels = scholarship.degree_levels.map((d) => d.toLowerCase());
  const profileDegree = profile.degreeLevel.toLowerCase();
  const degreeMatch = degreeLevels.some(
    (d) =>
      d.includes(profileDegree) ||
      profileDegree.includes(d) ||
      (profileDegree === "master" && d.includes("postgraduate")) ||
      (profileDegree === "phd" && d.includes("doctoral")),
  );
  gaps.push({
    field: "Degree Level",
    status: degreeMatch ? "met" : "gap",
    detail: degreeMatch
      ? `Your ${profile.degreeLevel} level matches`
      : `Requires ${scholarship.degree_levels.join(" or ")}`,
    action: degreeMatch ? undefined : "Consider if your program aligns with the required level",
  });

  // Field of study check
  if (scholarship.fields_of_study && scholarship.fields_of_study.length > 0) {
    const fieldMatch = profile.fieldsOfStudy.some((f) =>
      scholarship.fields_of_study!.some(
        (sf) => sf.toLowerCase().includes(f.toLowerCase()) || f.toLowerCase().includes(sf.toLowerCase()),
      ),
    );
    gaps.push({
      field: "Field of Study",
      status: fieldMatch ? "met" : "gap",
      detail: fieldMatch
        ? "Your field of study matches"
        : `Requires: ${scholarship.fields_of_study.slice(0, 3).join(", ")}`,
      action: fieldMatch ? undefined : "Check if a related field is accepted",
    });
  }

  // Language check
  if (profile.languageScores) {
    const langDetail: string[] = [];
    if (profile.languageScores.ielts) {
      langDetail.push(`IELTS ${profile.languageScores.ielts}`);
    }
    if (profile.languageScores.toefl) {
      langDetail.push(`TOEFL ${profile.languageScores.toefl}`);
    }
    gaps.push({
      field: "Language",
      status: langDetail.length > 0 ? "met" : "unknown",
      detail:
        langDetail.length > 0
          ? `Your scores: ${langDetail.join(", ")}`
          : "Add language scores to check eligibility",
      action:
        langDetail.length > 0
          ? undefined
          : "Take IELTS or TOEFL to meet language requirements",
    });
  } else {
    gaps.push({
      field: "Language",
      status: "unknown",
      detail: "No language scores in your profile",
      action: "Add language test scores to check if you meet requirements",
    });
  }

  return gaps;
}

const statusIcon = {
  met: <CheckCircle className="size-4 text-[var(--success)]" />,
  gap: <AlertCircle className="size-4 text-[var(--urgency-critical)]" />,
  unknown: <HelpCircle className="size-4 text-[var(--urgency-closed)]" />,
};

export function ReadinessCard({ profile, scholarship }: ReadinessCardProps) {
  const gaps = analyzeReadiness(profile, scholarship);
  const metCount = gaps.filter((g) => g.status === "met").length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Readiness Check</span>
          <Badge variant={metCount === gaps.length ? "default" : "neutral"}>
            {metCount}/{gaps.length} met
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {gaps.map((gap) => (
          <div
            key={gap.field}
            className={cn(
              "flex items-start gap-3 p-3 rounded-base border-2",
              gap.status === "met"
                ? "border-[var(--success)]/30 bg-[var(--success)]/5"
                : gap.status === "gap"
                  ? "border-[var(--urgency-critical)]/30 bg-[var(--urgency-critical)]/5"
                  : "border-border/50 bg-secondary-background",
            )}
          >
            <div className="mt-0.5">{statusIcon[gap.status]}</div>
            <div className="flex-1 min-w-0">
              <div className="font-heading text-caption">{gap.field}</div>
              <div className="text-caption opacity-70">{gap.detail}</div>
              {gap.action && (
                <div className="text-caption mt-1 opacity-60 italic">
                  {gap.action}
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
