import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo } from "react";
import { z } from "zod";
import { useCompare } from "@/components/comparison/CompareContext";
import { ComparisonTable } from "@/components/comparison/ComparisonTable";
import { BackToTop } from "@/components/layout/BackToTop";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { buildItemListJsonLd } from "@/lib/seo/json-ld";
import { buildPageMeta } from "@/lib/seo/meta";
import { api } from "../../../convex/_generated/api";

const SITE_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : (import.meta.env?.VITE_SITE_URL ?? "https://scholarhub.io");

const compareSearchSchema = z.object({
  s: z.string().optional(), // comma-separated slugs
});

export const Route = createFileRoute("/scholarships/compare")({
  validateSearch: compareSearchSchema,
  head: () => {
    const { meta, links } = buildPageMeta({
      title: "Compare Scholarships | ScholarHub",
      description:
        "Compare scholarships side by side. See how funding, eligibility, deadlines, and degree levels stack up across multiple scholarships.",
      canonicalPath: "/scholarships/compare",
    });
    return { meta, links };
  },
  component: ComparePage,
});

/** Neo-brutalism geometric comparison illustration */
function CompareIllustration() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="mx-auto"
    >
      {/* Two side-by-side cards */}
      <rect
        x="10"
        y="30"
        width="40"
        height="55"
        rx="3"
        stroke="currentColor"
        strokeWidth="2"
        fill="var(--main)"
        fillOpacity="0.15"
      />
      <rect
        x="70"
        y="30"
        width="40"
        height="55"
        rx="3"
        stroke="currentColor"
        strokeWidth="2"
        fill="var(--main)"
        fillOpacity="0.15"
      />
      {/* Lines inside cards */}
      <line x1="18" y1="45" x2="42" y2="45" stroke="currentColor" strokeWidth="2" />
      <line x1="18" y1="55" x2="38" y2="55" stroke="currentColor" strokeWidth="2" />
      <line x1="18" y1="65" x2="42" y2="65" stroke="currentColor" strokeWidth="2" />
      <line x1="78" y1="45" x2="102" y2="45" stroke="currentColor" strokeWidth="2" />
      <line x1="78" y1="55" x2="98" y2="55" stroke="currentColor" strokeWidth="2" />
      <line x1="78" y1="65" x2="102" y2="65" stroke="currentColor" strokeWidth="2" />
      {/* Arrows between cards */}
      <path d="M55 50 L65 50" stroke="currentColor" strokeWidth="2" markerEnd="url(#arrow)" />
      <path d="M65 60 L55 60" stroke="currentColor" strokeWidth="2" markerEnd="url(#arrow)" />
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6" fill="currentColor" />
        </marker>
      </defs>
      {/* Floating shapes */}
      <circle
        cx="100"
        cy="18"
        r="6"
        stroke="currentColor"
        strokeWidth="2"
        fill="var(--main)"
        fillOpacity="0.2"
      />
      <rect
        x="12"
        y="12"
        width="12"
        height="12"
        stroke="currentColor"
        strokeWidth="2"
        fill="var(--main)"
        fillOpacity="0.2"
      />
    </svg>
  );
}

function ComparePage() {
  const { s } = Route.useSearch();
  const { addToCompare, selected } = useCompare();

  // Parse slugs from URL search params
  const slugs = useMemo(() => {
    if (!s) return [];
    return s
      .split(",")
      .map((slug) => slug.trim())
      .filter(Boolean)
      .slice(0, 3);
  }, [s]);

  // Fetch comparison data
  const scholarships = useQuery(
    api.comparison.getComparisonScholarships,
    slugs.length > 0 ? { slugs } : "skip",
  );

  // Sync URL slugs with CompareContext on mount
  useEffect(() => {
    if (scholarships && scholarships.length > 0) {
      for (const s of scholarships) {
        const slug = s.slug ?? s._id;
        addToCompare(slug, s.title);
      }
    }
    // Only sync on initial load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scholarships !== undefined]);

  // Update document.title when data loads
  useEffect(() => {
    if (scholarships && scholarships.length > 0 && typeof document !== "undefined") {
      const names = scholarships.map((s) => s.title);
      document.title = `${names.join(" vs ")} Scholarship Comparison | ScholarHub`;
    }
  }, [scholarships]);

  const isLoading = slugs.length > 0 && scholarships === undefined;
  const hasPartialData =
    scholarships !== undefined && scholarships.length > 0 && scholarships.length < slugs.length;

  // --- Empty state: no slugs ---
  if (slugs.length === 0) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-20 pb-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div role="status" className="flex flex-col items-center text-center py-16 px-4">
              <CompareIllustration />
              <h1 className="font-heading text-xl mt-8">Compare scholarships side-by-side</h1>
              <p className="text-sm mt-3 max-w-md">
                Select 2-3 scholarships from the directory to see how they stack up. Look for the
                compare checkbox on any scholarship card.
              </p>
              <Button asChild variant="default" className="mt-6">
                <Link to="/scholarships">Browse Scholarships</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Loading state ---
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-20 pb-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <Link
                to="/scholarships"
                className="inline-flex items-center gap-1 text-sm font-heading hover:underline"
              >
                <ArrowLeft className="size-3.5" />
                Back to scholarships
              </Link>
            </div>
            <h1 className="font-heading text-2xl mb-8">Compare Scholarships</h1>
            {/* Skeleton table */}
            <div className="border-2 border-border rounded-base overflow-hidden">
              <div className="grid grid-cols-4 gap-0">
                {/* Header row */}
                <div className="bg-secondary-background p-4 lg:p-6 border-b-2 border-border border-r-2">
                  <div className="h-4 w-16 bg-border/20 rounded motion-safe:animate-pulse" />
                </div>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="p-4 lg:p-6 border-b-2 border-border border-r border-border last:border-r-0"
                  >
                    <div className="space-y-2">
                      <div className="h-4 w-full bg-border/20 rounded motion-safe:animate-pulse" />
                      <div className="h-3 w-2/3 bg-border/20 rounded motion-safe:animate-pulse" />
                      <div className="h-8 w-20 bg-border/20 rounded motion-safe:animate-pulse" />
                    </div>
                  </div>
                ))}
                {/* Field rows */}
                {Array.from({ length: 10 }).map((_, row) => (
                  <div key={row} className="contents">
                    <div className="bg-secondary-background p-4 lg:p-6 border-b border-border border-r-2">
                      <div className="h-4 w-24 bg-border/20 rounded motion-safe:animate-pulse" />
                    </div>
                    {Array.from({ length: 3 }).map((_, col) => (
                      <div
                        key={col}
                        className="p-4 lg:p-6 border-b border-border border-r last:border-r-0"
                      >
                        <div className="h-4 w-full bg-border/20 rounded motion-safe:animate-pulse" />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Error state ---
  if (scholarships !== undefined && scholarships.length === 0) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-20 pb-16 px-4">
          <div className="max-w-7xl mx-auto text-center py-16">
            <h1 className="font-heading text-xl mb-4">
              Failed to load comparison data. Please try again.
            </h1>
            <Button asChild variant="default">
              <Link to="/scholarships">Browse Scholarships</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // --- Data loaded ---
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-20 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Back link */}
          <div className="mb-6">
            <Link
              to="/scholarships"
              className="inline-flex items-center gap-1 text-sm font-heading hover:underline"
            >
              <ArrowLeft className="size-3.5" />
              Back to scholarships
            </Link>
          </div>

          <h1 className="font-heading text-2xl mb-8">Compare Scholarships</h1>

          {/* Partial data warning */}
          {hasPartialData && (
            <div className="bg-urgency-warning/10 border border-urgency-warning text-foreground p-3 rounded-base text-sm mb-6">
              Some scholarships could not be loaded. Showing available results.
            </div>
          )}

          {/* Comparison table */}
          {scholarships && scholarships.length > 0 && (
            <ComparisonTable scholarships={scholarships} />
          )}
        </div>
      </div>

      {/* ItemList JSON-LD for compared scholarships */}
      {scholarships && scholarships.length > 0 && (
        <script type="application/ld+json">
          {JSON.stringify(
            buildItemListJsonLd(
              scholarships.map((s, i) => ({
                name: s.title,
                url: `${SITE_URL}/scholarships/${s.slug ?? s._id}`,
                position: i + 1,
              })),
            ),
          )}
        </script>
      )}

      <BackToTop />
    </div>
  );
}
