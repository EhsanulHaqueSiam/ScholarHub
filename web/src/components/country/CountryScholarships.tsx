import { useQuery } from "convex/react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ScholarshipCard } from "@/components/directory/ScholarshipCard";
import { useStaticData } from "@/hooks/useStaticData";
import { getCountryName } from "@/lib/countries";
import type { ScholarshipSummary } from "@/lib/scholarship-summary";
import { filterScholarships } from "@/lib/static-data";
import { api } from "../../../convex/_generated/api";

interface CountryScholarshipsProps {
  countryCode: string;
  scholarships?: ScholarshipSummary[];
  loadFromQuery?: boolean;
}

export function CountryScholarships({
  countryCode,
  scholarships,
  loadFromQuery = true,
}: CountryScholarshipsProps) {
  const { data: staticData, isLoading: isStaticDataLoading } = useStaticData();
  const staticScholarships = useMemo(() => {
    if (!loadFromQuery || !staticData) return null;
    return filterScholarships(staticData, {
      hostCountries: [countryCode],
      sort: "deadline",
      showClosed: true,
      limit: 12,
      offset: 0,
    }).scholarships;
  }, [loadFromQuery, staticData, countryCode]);
  const shouldUseConvexQuery = loadFromQuery && !isStaticDataLoading && !staticData;
  const queriedScholarships = useQuery(
    api.directory.listScholarshipsBatch,
    shouldUseConvexQuery ? { hostCountries: [countryCode], showClosed: true, limit: 12 } : "skip",
  );
  const resolvedScholarships = loadFromQuery
    ? (staticScholarships ?? queriedScholarships)
    : scholarships;

  const countryName = getCountryName(countryCode);

  if (resolvedScholarships === undefined) {
    // Loading state
    return (
      <section aria-labelledby="scholarships-heading">
        <h2 id="scholarships-heading" className="text-xl font-heading mb-4">
          Scholarships in {countryName}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 rounded-base border-2 border-border bg-secondary-background animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  if (resolvedScholarships.length === 0) {
    return (
      <section aria-labelledby="scholarships-heading">
        <h2 id="scholarships-heading" className="text-xl font-heading mb-4">
          Scholarships in {countryName}
        </h2>
        <p className="text-sm text-foreground/60">
          No scholarships found for {countryName} at this time. Check back soon as our database is
          regularly updated.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="scholarships-heading">
      <h2 id="scholarships-heading" className="text-xl font-heading mb-4">
        Scholarships in {countryName}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resolvedScholarships.map((scholarship) => (
          <ScholarshipCard key={scholarship._id} scholarship={scholarship} />
        ))}
      </div>
      <div className="mt-6 text-center">
        <Link
          to="/scholarships"
          search={{ to: countryCode } as Record<string, unknown>}
        >
          <Button variant="neutral" size="lg">
            View all scholarships in {countryName}
            <ArrowRight className="size-4 ml-1" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
