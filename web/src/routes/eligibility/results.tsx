import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { z } from "zod";
import { SkeletonCard } from "@/components/directory/SkeletonCard";
import { MatchIndicators } from "@/components/eligibility/MatchIndicators";
import { ProfileSummaryCard } from "@/components/eligibility/ProfileSummaryCard";
import { ResultsTierSection } from "@/components/eligibility/ResultsTierSection";
import { Navbar } from "@/components/layout/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEligibilityMatching } from "@/hooks/useEligibilityMatching";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { analytics } from "@/lib/analytics";
import { getCountryName, POPULAR_NATIONALITIES } from "@/lib/countries";
import type { MatchTier, ScoredScholarship, StudentProfile } from "@/lib/eligibility/types";
import { profileToUrlParams, urlParamsToProfile } from "@/lib/eligibility/url-params";
import { buildPageMeta } from "@/lib/seo/meta";
import { cn } from "@/lib/utils";

const eligibilityResultsSearchSchema = z.object({
  n: z.string().optional(), // nationalities: "BD,IN"
  d: z.string().optional(), // degree: "master"
  f: z.string().optional(), // fields: "cs,eng"
  dest: z.string().optional(), // destinations: "DE,NL"
  gpa: z.string().optional(), // "3.5:us_4"
  lang: z.string().optional(), // "ielts:7.5,toefl:100"
  fund: z.string().optional(), // funding preference
  age: z.string().optional(),
  gen: z.string().optional(), // gender
  sort: z.enum(["deadline", "prestige", "amount"]).optional(),
  ft: z.string().optional(), // filter funding type
  st: z.string().optional(), // filter scholarship type
});

/** Top 15 nationalities + TZ that should be indexed for SEO (D-35) */
const INDEXABLE_NATIONALITIES = new Set(POPULAR_NATIONALITIES);

export const Route = createFileRoute("/eligibility/results")({
  validateSearch: eligibilityResultsSearchSchema,
  head: ({ search }) => {
    const parts: string[] = [];
    const primaryNationality = search?.n?.split(",")[0];

    if (primaryNationality) {
      const countryName = getCountryName(primaryNationality);
      if (countryName) parts.push(countryName);
    }
    if (search?.d) {
      const degreeLabel =
        search.d === "bachelor"
          ? "Bachelor's"
          : search.d === "master"
            ? "Master's"
            : search.d === "phd"
              ? "PhD"
              : "Postdoc";
      parts.push(degreeLabel);
    }
    const suffix = parts.length > 0 ? ` for ${parts.join(" ")} Students` : "";
    const title = `Scholarship Matches${suffix} | ScholarHub`;

    const pageMeta = buildPageMeta({
      title,
      description:
        "Find scholarships matching your profile. Filtered by eligibility, degree level, and field of study.",
      canonicalPath: "/eligibility/results",
    });

    // D-35: noindex uncommon nationality combinations for SEO hygiene
    const shouldNoindex =
      primaryNationality && !INDEXABLE_NATIONALITIES.has(primaryNationality?.toUpperCase());

    if (shouldNoindex) {
      pageMeta.meta.push({ name: "robots", content: "noindex, follow" });
    }

    return pageMeta;
  },
  component: EligibilityResultsPage,
});

// ---------------------------------------------------------------------------
// Sort pills for eligibility results (self-contained, not coupled to directory)
// ---------------------------------------------------------------------------

const RESULTS_SORT_OPTIONS = [
  { value: "deadline", label: "Deadline" },
  { value: "prestige", label: "Prestige" },
  { value: "amount", label: "Amount" },
] as const;

function ResultsSortPills({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <ToggleGroup.Root
      type="single"
      value={value ?? ""}
      onValueChange={(v) => onChange(v || null)}
      className="flex flex-wrap gap-2"
    >
      {RESULTS_SORT_OPTIONS.map((option) => {
        const isActive = value === option.value;
        return (
          <ToggleGroup.Item
            key={option.value}
            value={option.value}
            aria-label={`Sort by ${option.label}${isActive ? ", currently active" : ""}`}
            className={cn(
              "inline-flex items-center rounded-base border-2 px-3 py-2 text-sm font-base transition-[transform,box-shadow,background-color] duration-150 ease-out-expo min-h-[44px] shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none",
              isActive
                ? "bg-main text-main-foreground border-border"
                : "bg-secondary-background text-foreground border-border",
            )}
          >
            {option.label}
          </ToggleGroup.Item>
        );
      })}
    </ToggleGroup.Root>
  );
}

// ---------------------------------------------------------------------------
// Filter chips for eligibility results (self-contained)
// ---------------------------------------------------------------------------

function ResultsFilterChips({
  label,
  options,
  active,
  onToggle,
}: {
  label: string;
  options: string[];
  active: string | null;
  onToggle: (value: string) => void;
}) {
  if (options.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-heading text-foreground/60">{label}:</span>
      <div className="flex flex-wrap gap-1">
        {options.map((opt) => {
          const isActive = active === opt;
          const displayLabel = opt.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onToggle(opt)}
              className={cn(
                "inline-flex items-center rounded-base border-2 px-2 py-1 text-xs font-base transition-colors min-h-[32px]",
                isActive
                  ? "bg-main text-main-foreground border-border"
                  : "bg-secondary-background text-foreground border-border hover:bg-main/5",
              )}
            >
              {displayLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton for results
// ---------------------------------------------------------------------------

function ResultsSkeleton() {
  return (
    <div className="space-y-8 mt-8">
      {/* Mock "Strong Matches" header */}
      <div>
        <div className="h-12 bg-match-strong-bg border-2 border-match-strong-border rounded-base mb-4 flex items-center px-4">
          <div className="h-5 w-40 bg-border/20 rounded-base" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={`strong-${i}`} />
          ))}
        </div>
      </div>
      {/* Mock "Good Matches" header */}
      <div>
        <div className="h-12 bg-match-good-bg border-2 border-match-good-border rounded-base mb-4 flex items-center px-4">
          <div className="h-5 w-36 bg-border/20 rounded-base" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={`good-${i}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state for no matches
// ---------------------------------------------------------------------------

function EmptyResultsState({ profile }: { profile: StudentProfile | null }) {
  // Build directory link with nationality + degree pre-filled
  const directorySearch: Record<string, string> = {};
  if (profile?.nationalities?.length) {
    directorySearch.from = profile.nationalities.join(",");
  }
  if (profile?.degreeLevel) {
    directorySearch.degree = profile.degreeLevel;
  }

  return (
    <div className="flex flex-col items-center text-center py-12 px-4">
      {/* Neo-brutalism illustration */}
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="mx-auto"
      >
        <g transform="rotate(-15 60 55)">
          <circle
            cx="52"
            cy="48"
            r="28"
            stroke="currentColor"
            strokeWidth="2"
            fill="var(--main)"
            fillOpacity="0.2"
          />
          <line
            x1="72"
            y1="68"
            x2="95"
            y2="91"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
        <circle
          cx="98"
          cy="22"
          r="8"
          stroke="currentColor"
          strokeWidth="2"
          fill="var(--main)"
          fillOpacity="0.2"
        />
        <polygon
          points="20,28 10,44 30,44"
          stroke="currentColor"
          strokeWidth="2"
          fill="var(--main)"
          fillOpacity="0.2"
          strokeLinejoin="round"
        />
      </svg>

      <h2 className="font-heading text-xl mt-8">No scholarships match your criteria</h2>
      <p className="text-sm text-foreground/60 mt-3 max-w-md">
        Your filters might be too specific. Try selecting more fields of study or additional
        destination countries.
      </p>
      <Link to="/scholarships" search={directorySearch} className="mt-6">
        <Button variant="neutral" size="lg">
          Browse All Scholarships
        </Button>
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

function EligibilityResultsPage() {
  const search = Route.useSearch();
  const { profile, updateProfile, clearProfile } = useStudentProfile();
  const navigate = useNavigate();

  // Reconstruct profile from URL params (for shared links) or localStorage
  const activeProfile = useMemo(() => {
    // URL params take precedence (for shared links)
    if (search.n || search.d) {
      const fromUrl = urlParamsToProfile(search as Record<string, string | undefined>);
      return { ...profile, ...fromUrl } as StudentProfile;
    }
    return profile as StudentProfile;
  }, [search, profile]);

  const { results, totalCount, isLoading, isReady } = useEligibilityMatching(activeProfile);

  // Track results_viewed
  useEffect(() => {
    if (isReady) {
      analytics.track("results_viewed", { totalCount });
    }
  }, [isReady, totalCount]);

  // Handle profile edit inline
  const handleProfileEdit = (updates: Partial<StudentProfile>) => {
    updateProfile(updates);
    // Update URL params to reflect changes
    const newParams = profileToUrlParams({
      ...activeProfile,
      ...updates,
    } as StudentProfile);
    navigate({
      to: "/eligibility/results",
      search: newParams as any,
      replace: true,
    });
  };

  // --- Sort and filter state (D-25) ---
  const activeSort = search.sort ?? null;
  const activeFundingType = search.ft ?? null;
  const activeScholarshipType = search.st ?? null;

  // Apply client-side sort and filters to tier results
  const sortedResults = useMemo(() => {
    if (!results) return null;
    const sorted: Record<MatchTier, ScoredScholarship[]> = {
      strong: [...results.strong],
      good: [...results.good],
      partial: [...results.partial],
      possible: [...results.possible],
    };

    // Apply funding type filter (D-25)
    if (activeFundingType) {
      for (const tier of ["strong", "good", "partial", "possible"] as const) {
        sorted[tier] = sorted[tier].filter((s) => s.scholarship.funding_type === activeFundingType);
      }
    }

    // Apply scholarship type filter (D-25)
    if (activeScholarshipType) {
      for (const tier of ["strong", "good", "partial", "possible"] as const) {
        sorted[tier] = sorted[tier].filter(
          (s) => s.scholarship.scholarship_type === activeScholarshipType,
        );
      }
    }

    // Apply sort within each tier (D-25)
    if (activeSort) {
      const compareFn = (a: ScoredScholarship, b: ScoredScholarship) => {
        if (activeSort === "deadline") {
          const aD = a.scholarship.application_deadline ?? Infinity;
          const bD = b.scholarship.application_deadline ?? Infinity;
          return (aD as number) - (bD as number);
        }
        if (activeSort === "prestige") {
          const prestigeOrder: Record<string, number> = {
            s: 0,
            a: 1,
            b: 2,
            c: 3,
            unranked: 4,
          };
          const aP = prestigeOrder[a.scholarship.prestige_tier] ?? 4;
          const bP = prestigeOrder[b.scholarship.prestige_tier] ?? 4;
          return aP - bP;
        }
        if (activeSort === "amount") {
          const parseAmount = (s: string | undefined) => {
            if (!s) return 0;
            const num = parseInt(s.replace(/[^0-9]/g, ""), 10);
            return isNaN(num) ? 0 : num;
          };
          return (
            parseAmount(b.scholarship.funding_amount) - parseAmount(a.scholarship.funding_amount)
          );
        }
        return 0;
      };
      for (const tier of ["strong", "good", "partial", "possible"] as const) {
        sorted[tier].sort(compareFn);
      }
    }

    return sorted;
  }, [results, activeSort, activeFundingType, activeScholarshipType]);

  const filteredTotalCount = useMemo(() => {
    if (!sortedResults) return 0;
    return Object.values(sortedResults).reduce((sum, arr) => sum + arr.length, 0);
  }, [sortedResults]);

  // Handlers to update sort/filter via URL search params
  const handleSortChange = (sort: string | null) => {
    navigate({
      to: "/eligibility/results",
      search: { ...search, sort: sort as any },
      replace: true,
    });
  };

  const handleFilterChange = (key: "ft" | "st", value: string | null) => {
    navigate({
      to: "/eligibility/results",
      search: { ...search, [key]: value ?? undefined },
      replace: true,
    });
  };

  // Derive available filter options from unfiltered results
  const filterOptions = useMemo(() => {
    if (!results) return { fundingTypes: [] as string[], scholarshipTypes: [] as string[] };
    const allScholarships = Object.values(results).flat();
    const fundingTypes = [
      ...new Set(allScholarships.map((s) => s.scholarship.funding_type).filter(Boolean)),
    ] as string[];
    const scholarshipTypes = [
      ...new Set(allScholarships.map((s) => s.scholarship.scholarship_type).filter(Boolean)),
    ] as string[];
    return { fundingTypes, scholarshipTypes };
  }, [results]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-20 px-4 pb-8 max-w-7xl mx-auto">
        <h1 className="text-heading font-heading leading-[1.15] text-center mb-2">
          Your Scholarship Matches
        </h1>
        {isReady && (
          <p className="text-center text-foreground/60 text-sm mb-8">
            {filteredTotalCount} scholarships matched your profile
          </p>
        )}

        {/* Profile summary card (D-26) */}
        <ProfileSummaryCard
          profile={activeProfile}
          onEdit={handleProfileEdit}
          onStartOver={() => {
            clearProfile();
            navigate({ to: "/eligibility" });
          }}
        />

        {/* Loading skeleton */}
        {isLoading && <ResultsSkeleton />}

        {/* Empty state (D-27) */}
        {isReady && totalCount === 0 && <EmptyResultsState profile={activeProfile} />}

        {/* Sort and filter controls (D-25) -- above tier sections */}
        {isReady && totalCount > 0 && (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <ResultsSortPills value={activeSort} onChange={handleSortChange} />
            {filterOptions.fundingTypes.length > 0 && (
              <ResultsFilterChips
                label="Funding"
                options={filterOptions.fundingTypes}
                active={activeFundingType}
                onToggle={(val) => handleFilterChange("ft", val === activeFundingType ? null : val)}
              />
            )}
            {filterOptions.scholarshipTypes.length > 0 && (
              <ResultsFilterChips
                label="Type"
                options={filterOptions.scholarshipTypes}
                active={activeScholarshipType}
                onToggle={(val) =>
                  handleFilterChange("st", val === activeScholarshipType ? null : val)
                }
              />
            )}
          </div>
        )}

        {/* Tier sections (D-23) */}
        {isReady && sortedResults && (
          <div className="space-y-8 mt-8">
            {(["strong", "good", "partial", "possible"] as const).map(
              (tier) =>
                sortedResults[tier].length > 0 && (
                  <ResultsTierSection
                    key={tier}
                    tier={tier}
                    scholarships={sortedResults[tier]}
                    defaultOpen={
                      tier !== "possible" || filteredTotalCount === sortedResults.possible.length
                    }
                  />
                ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}
