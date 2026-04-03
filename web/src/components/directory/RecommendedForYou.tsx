import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { useStaticData } from "@/hooks/useStaticData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ScholarshipSummary } from "@/lib/scholarship-summary";
import { parseHostCountries } from "@/lib/countries";

function scoreMatch(
  s: ScholarshipSummary,
  profile: Partial<{ nationalities: string[]; degreeLevel: string; fieldsOfStudy: string[]; destinationCountries?: string[] }>,
): number {
  let score = 0;

  // Nationality match
  if (s.eligibility_nationalities && s.eligibility_nationalities.length > 0 && profile.nationalities?.length) {
    if (profile.nationalities.some((n) => s.eligibility_nationalities!.some((e) => e.toUpperCase() === n.toUpperCase()))) {
      score += 30;
    }
  } else {
    score += 15; // Open eligibility
  }

  // Degree match
  if (profile.degreeLevel) {
    const degrees = s.degree_levels.map((d) => d.toLowerCase());
    if (degrees.some((d) => d.includes(profile.degreeLevel!.toLowerCase()))) {
      score += 25;
    }
  }

  // Field match
  if (s.fields_of_study && s.fields_of_study.length > 0 && profile.fieldsOfStudy?.length) {
    if (profile.fieldsOfStudy.some((f) => s.fields_of_study!.some((sf) => sf.toLowerCase().includes(f.toLowerCase())))) {
      score += 25;
    }
  }

  // Country preference match
  if (profile.destinationCountries && profile.destinationCountries.length > 0) {
    const hostCodes = parseHostCountries(s.host_country);
    if (hostCodes.some((c) => profile.destinationCountries!.includes(c))) {
      score += 20;
    }
  }

  return score;
}

export function RecommendedForYou() {
  const { profile, hasExistingProfile, hydrated } = useStudentProfile();
  const { data } = useStaticData();

  const recommendations = useMemo(() => {
    if (!profile || !hasExistingProfile || !data?.summaries) return [];

    return data.summaries
      .filter((s) => s.slug && s.application_deadline && s.application_deadline > Date.now())
      .map((s) => ({ scholarship: s, score: scoreMatch(s, profile) }))
      .filter((r) => r.score >= 40)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((r) => r.scholarship);
  }, [profile, hasExistingProfile, data?.summaries]);

  if (!hydrated || !hasExistingProfile || recommendations.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="size-5 text-[var(--main)]" />
        <h2 className="font-heading text-lg">Recommended for You</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {recommendations.map((s) => (
          <Link
            key={s.slug}
            to="/scholarships/$slug"
            params={{ slug: s.slug! }}
            className="rounded-base border-2 border-border p-4 bg-secondary-background hover:shadow-shadow hover:-translate-y-0.5 transition-all duration-150"
          >
            <div className="font-heading text-sm truncate mb-1">
              {s.title}
            </div>
            <div className="text-caption opacity-60 mb-2">
              {s.host_country} · {s.funding_type.replace("_", " ")}
            </div>
            {s.prestige_tier && s.prestige_tier !== "unranked" && (
              <Badge
                variant={
                  s.prestige_tier === "gold"
                    ? "gold"
                    : s.prestige_tier === "silver"
                      ? "silver"
                      : "bronze"
                }
              >
                {s.prestige_tier}
              </Badge>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
