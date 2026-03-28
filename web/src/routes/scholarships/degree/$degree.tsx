import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ArrowRight } from "lucide-react";
import { ScholarshipCard } from "@/components/directory/ScholarshipCard";
import { SkeletonCard } from "@/components/directory/SkeletonCard";
import { BackToTop } from "@/components/layout/BackToTop";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCountryName } from "@/lib/countries";
import { buildBreadcrumbJsonLd, buildFaqJsonLd } from "@/lib/seo/json-ld";
import { buildPageMeta } from "@/lib/seo/meta";
import {
  generateDegreeIntro,
  generateDegreeFaq,
  generateDegreeCrossLinks,
} from "@/lib/seo/landing-content";
import { api } from "../../../../convex/_generated/api";

const SITE_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : (import.meta.env?.VITE_SITE_URL ?? "https://scholarhub.io");

const DEGREE_LABELS: Record<string, string> = {
  bachelor: "Bachelor",
  masters: "Master's",
  master: "Master's",
  phd: "PhD",
  postdoc: "Postdoc",
};

function formatDegreeName(slug: string): string {
  return DEGREE_LABELS[slug.toLowerCase()] ?? slug.charAt(0).toUpperCase() + slug.slice(1);
}

function normalizeDegreeSlug(slug: string): string {
  const normalized = slug.trim().toLowerCase();
  return normalized === "masters" ? "master" : normalized;
}

export const Route = createFileRoute("/scholarships/degree/$degree")({
  head: ({ params }) => {
    const name = formatDegreeName(params.degree);
    const { meta, links } = buildPageMeta({
      title: `${name} Scholarships | ScholarHub`,
      description: `Explore ${name.toLowerCase()} scholarships worldwide. Find fully funded ${name.toLowerCase()} programs, eligibility requirements, and funding opportunities.`,
      canonicalPath: `/scholarships/degree/${params.degree}`,
    });
    return { meta, links };
  },
  component: DegreeLandingPage,
});

function DegreeLandingPage() {
  const { degree } = Route.useParams();
  const normalizedDegree = normalizeDegreeSlug(degree);
  const degreeName = formatDegreeName(normalizedDegree);

  // SEO data query (combined to reduce Convex call count)
  const landingData = useQuery(api.seo.getDegreeLandingData, { degreeLevel: normalizedDegree });
  const degreeStats = landingData?.stats;
  const scholarships = useQuery(api.directory.listScholarshipsBatch, {
    degreeLevels: [normalizedDegree],
    limit: 12,
  });

  // Generate SEO content when stats are loaded
  const statsForContent = degreeStats
    ? {
        total: degreeStats.total,
        fullyFunded: degreeStats.fullyFunded,
        topCountries: degreeStats.topCountries.map((code) => getCountryName(code)),
      }
    : null;

  const intro =
    statsForContent
      ? generateDegreeIntro(statsForContent, degreeName, new Date().getFullYear())
      : null;
  const faqs =
    statsForContent
      ? generateDegreeFaq(statsForContent, degreeName)
      : null;
  const crossLinks = landingData
    ? generateDegreeCrossLinks(
        normalizedDegree,
        landingData.topCountries.map((c) => getCountryName(c.code)),
        landingData.allDegrees.map((d) => d.level),
      )
    : null;

  // Breadcrumb JSON-LD
  const breadcrumbItems = [
    { name: "Home", url: SITE_URL },
    { name: "Scholarships", url: `${SITE_URL}/scholarships` },
    { name: `${degreeName} Scholarships`, url: `${SITE_URL}/scholarships/degree/${degree}` },
  ];

  const isLoadingScholarships = scholarships === undefined;
  const hasScholarships = scholarships && scholarships.length > 0;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-20 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Hero */}
          <div className="text-center mt-8 mb-8">
            <h1 className="font-heading text-title md:text-display-sm leading-[1.1] mb-3">
              {degreeName} Scholarships
            </h1>
            <p className="text-foreground/70 text-sm max-w-xl mx-auto">
              Find {degreeName.toLowerCase()} scholarships from universities and organizations
              worldwide. Fully funded and partial funding options available.
            </p>
          </div>

          {/* Dynamic stats bar */}
          {degreeStats && degreeStats.total > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              <Card>
                <CardContent className="py-4 text-center">
                  <p className="font-heading text-2xl">{degreeStats.total}</p>
                  <p className="text-xs text-foreground/60">Scholarships</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 text-center">
                  <p className="font-heading text-2xl">{degreeStats.fullyFunded}</p>
                  <p className="text-xs text-foreground/60">Fully Funded</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 text-center">
                  <p className="font-heading text-2xl">{degreeStats.topCountries.length}</p>
                  <p className="text-xs text-foreground/60">Countries</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Templated intro paragraph */}
          {intro && (
            <p className="text-sm text-foreground/80 mb-8 max-w-3xl mx-auto text-center leading-relaxed">
              {intro}
            </p>
          )}

          {/* Scholarship grid */}
          <section aria-labelledby="degree-scholarships-heading" className="mb-12">
            <h2 id="degree-scholarships-heading" className="font-heading text-xl mb-4">
              {degreeName} Scholarships
            </h2>

            {isLoadingScholarships && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}

            {!isLoadingScholarships && !hasScholarships && (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-sm text-foreground/60">
                    No {degreeName.toLowerCase()} scholarships found at this time. Check back soon as
                    our database is regularly updated.
                  </p>
                </CardContent>
              </Card>
            )}

            {hasScholarships && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {scholarships.map((scholarship) => (
                    <ScholarshipCard key={scholarship._id} scholarship={scholarship} />
                  ))}
                </div>
                <div className="mt-6 text-center">
                  <Link
                    to="/scholarships"
                    search={{ degree: normalizedDegree } as Record<string, unknown>}
                  >
                    <Button variant="neutral" size="lg">
                      View all {degreeName.toLowerCase()} scholarships
                      <ArrowRight className="size-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </section>

          {/* FAQ section */}
          {faqs && faqs.length > 0 && (
            <section className="mt-12" aria-labelledby="degree-faq-heading">
              <h2 id="degree-faq-heading" className="font-heading text-2xl mb-6">
                Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                {faqs.map((faq) => (
                  <details
                    key={faq.question}
                    className="border-2 border-border rounded-base overflow-hidden group"
                  >
                    <summary className="cursor-pointer px-4 py-3 font-heading text-sm bg-secondary-background hover:bg-secondary-background/80 transition-colors">
                      {faq.question}
                    </summary>
                    <p className="px-4 py-3 text-sm text-foreground/80 border-t-2 border-border">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          )}

          {/* Cross-links section */}
          {crossLinks && (
            <section className="mt-12" aria-labelledby="degree-cross-links-heading">
              <h2 id="degree-cross-links-heading" className="font-heading text-2xl mb-6">
                Explore More Scholarships
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                {crossLinks.countries.length > 0 && (
                  <div>
                    <h3 className="font-heading text-lg mb-3">
                      Top Countries for {degreeName} Scholarships
                    </h3>
                    <ul className="space-y-2">
                      {crossLinks.countries.map((c) => (
                        <li key={c.slug}>
                          <Link
                            to="/scholarships/country/$country"
                            params={{ country: c.slug }}
                            className="text-sm text-main hover:underline font-base"
                          >
                            Scholarships in {c.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {crossLinks.degrees.length > 0 && (
                  <div>
                    <h3 className="font-heading text-lg mb-3">Other Degree Levels</h3>
                    <ul className="space-y-2">
                      {crossLinks.degrees.map((d) => (
                        <li key={d.slug}>
                          <Link
                            to="/scholarships/degree/$degree"
                            params={{ degree: d.slug }}
                            className="text-sm text-main hover:underline font-base"
                          >
                            {d.name.charAt(0).toUpperCase() + d.name.slice(1)} Scholarships
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* BreadcrumbList JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(buildBreadcrumbJsonLd(breadcrumbItems))}
      </script>

      {/* FAQPage JSON-LD -- only render when stats are loaded */}
      {faqs && faqs.length > 0 && (
        <script type="application/ld+json">
          {JSON.stringify(buildFaqJsonLd(faqs))}
        </script>
      )}

      <BackToTop />
    </div>
  );
}
