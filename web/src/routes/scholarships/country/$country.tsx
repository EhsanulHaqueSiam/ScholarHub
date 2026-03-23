import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Info } from "lucide-react";
import { BackToTop } from "@/components/layout/BackToTop";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { AdmissionVisaSection } from "@/components/country/AdmissionVisaSection";
import { CostOfStudyingSection } from "@/components/country/CostOfStudyingSection";
import { CountryScholarships } from "@/components/country/CountryScholarships";
import { IntakePeriodsSection } from "@/components/country/IntakePeriodsSection";
import { PostStudyWorkSection } from "@/components/country/PostStudyWorkSection";
import { getCountryData } from "@/lib/country-data";
import { getCountryFlag, getCountryName } from "@/lib/countries";
import { buildBreadcrumbJsonLd, buildFaqJsonLd } from "@/lib/seo/json-ld";
import { buildPageMeta } from "@/lib/seo/meta";
import {
  generateCountryIntro,
  generateCountryFaq,
  generateCountryCrossLinks,
} from "@/lib/seo/landing-content";
import { api } from "../../../../convex/_generated/api";

const SITE_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : (import.meta.env?.VITE_SITE_URL ?? "https://scholarhub.io");

export const Route = createFileRoute("/scholarships/country/$country")({
  head: ({ params }) => {
    const name = getCountryName(params.country);
    const { meta, links } = buildPageMeta({
      title: `Scholarships in ${name} | ScholarHub`,
      description: `Browse international scholarships available in ${name}. Find tuition costs, visa requirements, and funding opportunities in ${name}.`,
      canonicalPath: `/scholarships/country/${params.country}`,
    });
    return { meta, links };
  },
  component: CountryLandingPage,
});

function CountryLandingPage() {
  const { country } = Route.useParams();
  const countryName = getCountryName(country);
  const flag = getCountryFlag(country);
  const countryData = getCountryData(country);

  // SEO data query (combined to reduce Convex call count)
  const landingData = useQuery(api.seo.getCountryLandingData, { countryCode: country });
  const countryStats = landingData?.stats;

  // Generate SEO content when stats are loaded
  const intro =
    countryStats
      ? generateCountryIntro(countryStats, countryName, new Date().getFullYear())
      : null;
  const faqs =
    countryStats
      ? generateCountryFaq(countryStats, countryName)
      : null;
  const crossLinks = landingData
    ? generateCountryCrossLinks(
        country,
        landingData.topCountries.map((c) => getCountryName(c.code)),
        landingData.allDegrees.map((d) => d.level),
      )
    : null;

  // Breadcrumb JSON-LD
  const breadcrumbItems = [
    { name: "Home", url: SITE_URL },
    { name: "Scholarships", url: `${SITE_URL}/scholarships` },
    { name: countryName, url: `${SITE_URL}/scholarships/country/${country}` },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-20 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Hero */}
          <div className="text-center mt-8 mb-8">
            <h1 className="font-heading text-[32px] md:text-[40px] leading-[1.1] mb-3">
              <span className="text-[48px]">{flag}</span>
              <br />
              Study in {countryName}
            </h1>
            <p className="text-foreground/70 text-sm max-w-xl mx-auto">
              Everything you need to know about studying in {countryName} -- tuition costs, visa
              requirements, intake periods, and available scholarships.
            </p>
          </div>

          {/* Dynamic stats bar */}
          {countryStats && countryStats.total > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="py-4 text-center">
                  <p className="font-heading text-2xl">{countryStats.total}</p>
                  <p className="text-xs text-foreground/60">Scholarships</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 text-center">
                  <p className="font-heading text-2xl">{countryStats.fullyFunded}</p>
                  <p className="text-xs text-foreground/60">Fully Funded</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 text-center">
                  <p className="font-heading text-2xl">{countryStats.degreeLevels.length}</p>
                  <p className="text-xs text-foreground/60">Degree Levels</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 text-center">
                  <p className="font-heading text-2xl">{countryStats.closingSoon}</p>
                  <p className="text-xs text-foreground/60">Closing Soon</p>
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

          {countryData ? (
            <>
              {/* Disclaimer banner */}
              <Card className="mb-8 bg-secondary-background">
                <CardContent className="flex items-start gap-3 py-4">
                  <Info className="size-5 text-foreground/60 shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground/60">
                    Data is approximate and may change. Tuition and living costs vary by institution,
                    program, and personal lifestyle. Always verify with official university and
                    government sources before making decisions.
                  </p>
                </CardContent>
              </Card>

              {/* Info sections */}
              <div className="space-y-10">
                <CostOfStudyingSection data={countryData} countryName={countryName} />
                <AdmissionVisaSection data={countryData} countryName={countryName} />
                <IntakePeriodsSection data={countryData} />
                <PostStudyWorkSection data={countryData} countryName={countryName} />
                <CountryScholarships countryCode={country} />
              </div>
            </>
          ) : (
            <div className="space-y-10">
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-sm text-foreground/60">
                    Detailed country information for {countryName} is coming soon. In the meantime,
                    browse the scholarships available below.
                  </p>
                </CardContent>
              </Card>
              <CountryScholarships countryCode={country} />
            </div>
          )}

          {/* FAQ section */}
          {faqs && faqs.length > 0 && (
            <section className="mt-12" aria-labelledby="faq-heading">
              <h2 id="faq-heading" className="font-heading text-2xl mb-6">
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
            <section className="mt-12" aria-labelledby="cross-links-heading">
              <h2 id="cross-links-heading" className="font-heading text-2xl mb-6">
                Explore More Scholarships
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                {crossLinks.countries.length > 0 && (
                  <div>
                    <h3 className="font-heading text-lg mb-3">Scholarships in Other Countries</h3>
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
                    <h3 className="font-heading text-lg mb-3">Scholarships by Degree Level</h3>
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
