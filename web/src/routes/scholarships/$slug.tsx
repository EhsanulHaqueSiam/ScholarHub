import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useRef } from "react";
import { z } from "zod";
import { AdmissionVisaSection } from "@/components/country/AdmissionVisaSection";
import { CostOfStudyingSection } from "@/components/country/CostOfStudyingSection";
import { IntakePeriodsSection } from "@/components/country/IntakePeriodsSection";
import { PostStudyWorkSection } from "@/components/country/PostStudyWorkSection";
import { ApplicationTipsSection } from "@/components/detail/ApplicationTipsSection";
import { DetailBreadcrumb } from "@/components/detail/Breadcrumb";
import { DetailSkeleton } from "@/components/detail/DetailSkeleton";
import { EligibilitySection } from "@/components/detail/EligibilitySection";
import { FundingSection } from "@/components/detail/FundingSection";
import { HeroSection } from "@/components/detail/HeroSection";
import { HowToApplySection } from "@/components/detail/HowToApplySection";
import { OverviewSection } from "@/components/detail/OverviewSection";
import { RelatedScholarships } from "@/components/detail/RelatedScholarships";
import { SourcesSection } from "@/components/detail/SourcesSection";
import { StickyBar } from "@/components/detail/StickyBar";
import { BackToTop } from "@/components/layout/BackToTop";
import { Navbar } from "@/components/layout/Navbar";
import { getCountryFlag, getCountryName, parseHostCountries } from "@/lib/countries";
import { buildStudyData, getCountryData } from "@/lib/country-data";
import { useIsHeroVisible } from "@/lib/deadline";
import { getDeadlineUrgency } from "@/lib/filters";
import type { PrestigeTier } from "@/lib/prestige";
import { buildBreadcrumbJsonLd, buildScholarshipJsonLd } from "@/lib/seo/json-ld";
import { buildPageMeta } from "@/lib/seo/meta";
import { formatFundingType } from "@/lib/shared";
import { api } from "../../../convex/_generated/api";
import type { ScholarshipType } from "../../../convex/schema";

/**
 * Search params schema for breadcrumb filter context.
 * These carry the referrer filter params so the breadcrumb
 * can link back to a filtered directory listing.
 */
const detailSearchSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  degree: z.string().optional(),
  field: z.string().optional(),
  funding: z.string().optional(),
  tier: z.string().optional(),
  sort: z.string().optional(),
  tags: z.string().optional(),
});

export const Route = createFileRoute("/scholarships/$slug")({
  validateSearch: (search) => detailSearchSchema.parse(search),
  head: ({ params }) => {
    const title = `${params.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} | ScholarHub`;
    const description = `View scholarship details for ${params.slug.replace(/-/g, " ")} on ScholarHub -- eligibility, funding, deadlines, and how to apply.`;
    const { meta, links } = buildPageMeta({
      title,
      description,
      canonicalPath: `/scholarships/${params.slug}`,
    });
    return { meta, links };
  },
  component: ScholarshipDetailPage,
});

/**
 * Build structured meta title for SEO.
 * Format: {Title} -- {Funding Type} {Degree} Scholarship in {Country} | ScholarHub
 * Fallback: {Title} | ScholarHub
 */
function buildMetaTitle(scholarship: {
  title: string;
  funding_type: string;
  degree_levels: string[];
  host_country: string;
}): string {
  const fundingLabel = formatFundingType(scholarship.funding_type);
  const degree =
    scholarship.degree_levels.length > 0
      ? scholarship.degree_levels[0].charAt(0).toUpperCase() + scholarship.degree_levels[0].slice(1)
      : null;
  const country = getCountryName(scholarship.host_country);

  if (degree && country) {
    return `${scholarship.title} -- ${fundingLabel} ${degree} Scholarship in ${country} | ScholarHub`;
  }
  return `${scholarship.title} | ScholarHub`;
}

const SITE_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : (import.meta.env?.VITE_SITE_URL ?? "https://scholarhub.io");

function ScholarshipDetailPage() {
  const { slug } = Route.useParams();
  const search = Route.useSearch();
  const heroRef = useRef<HTMLDivElement>(null);
  const isHeroVisible = useIsHeroVisible(heroRef);
  const scholarship = useQuery(api.directory.getScholarshipDetail, { slug });
  const scholarshipCollections = useQuery(
    api.collections.getScholarshipCollections,
    scholarship ? { scholarshipId: scholarship._id } : "skip",
  );

  // Loading state
  if (scholarship === undefined) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-20 pb-16 px-4 md:px-6">
          <DetailSkeleton />
        </div>
      </div>
    );
  }

  // Not found state
  if (scholarship === null) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-20 px-4">
          <div className="max-w-3xl mx-auto text-center py-16">
            <h1 className="font-heading text-title mb-4">Scholarship Not Found</h1>
            <p className="text-foreground/70 mb-8">
              The scholarship you're looking for doesn't exist or has been removed.
            </p>
            <Link
              to="/scholarships"
              className="inline-flex items-center justify-center rounded-base border-2 border-border bg-main px-6 py-3 text-sm font-base text-main-foreground shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none transition-[transform,box-shadow] duration-150 ease-out-expo"
            >
              Browse All Scholarships
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Derive computed state
  const prestigeTier = (scholarship.prestige_tier ?? "unranked") as PrestigeTier;
  const urgency = getDeadlineUrgency(scholarship.application_deadline ?? undefined);
  const isExpired = urgency === "closed";
  const scholarshipSlug = scholarship.slug ?? scholarship._id;

  // Grant JSON-LD structured data (imported builder uses @type "Grant")
  const jsonLdString = JSON.stringify(buildScholarshipJsonLd(scholarship));

  // BreadcrumbList JSON-LD: Home > Scholarships > Country > Scholarship Title
  const countryName = getCountryName(scholarship.host_country);
  const countrySlug = scholarship.host_country.toLowerCase();
  const breadcrumbItems = [
    { name: "Home", url: SITE_URL },
    { name: "Scholarships", url: `${SITE_URL}/scholarships` },
    { name: countryName, url: `${SITE_URL}/scholarships/country/${countrySlug}` },
    { name: scholarship.title, url: `${SITE_URL}/scholarships/${scholarshipSlug}` },
  ];
  const breadcrumbJsonLdString = JSON.stringify(buildBreadcrumbJsonLd(breadcrumbItems));

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Sticky bar -- appears when hero scrolls out of view */}
      <StickyBar
        title={scholarship.title}
        slug={scholarshipSlug}
        applicationUrl={scholarship.application_url ?? undefined}
        visible={isHeroVisible}
        isExpired={isExpired}
      />

      {/* Schema.org Grant JSON-LD -- trusted DB content for SEO structured data */}
      <script type="application/ld+json">{jsonLdString}</script>

      {/* BreadcrumbList JSON-LD -- trusted breadcrumb data for SEO structured data */}
      <script type="application/ld+json">{breadcrumbJsonLdString}</script>

      {/* Page content */}
      <div className="pt-20 pb-16 px-4 md:px-6">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Breadcrumb navigation */}
          <DetailBreadcrumb scholarshipTitle={scholarship.title} searchParams={search} />

          {/* Hero section with IntersectionObserver ref */}
          <HeroSection
            ref={heroRef}
            title={scholarship.title}
            providerOrganization={scholarship.provider_organization}
            prestigeTier={prestigeTier}
            hostCountry={scholarship.host_country}
            applicationDeadline={scholarship.application_deadline ?? undefined}
            degreeLevels={scholarship.degree_levels}
            fundingType={scholarship.funding_type}
            applicationUrl={scholarship.application_url ?? undefined}
            tags={scholarship.tags}
            collections={scholarshipCollections ?? undefined}
            scholarshipType={
              (scholarship.scholarship_type ?? undefined) as ScholarshipType | undefined
            }
          />

          {/* Overview */}
          <OverviewSection description={scholarship.description} />

          {/* Eligibility */}
          <EligibilitySection
            nationalities={scholarship.eligibility_nationalities}
            degreeLevels={scholarship.degree_levels}
            fieldsOfStudy={scholarship.fields_of_study}
          />

          {/* Funding */}
          <FundingSection
            fundingType={scholarship.funding_type}
            fundingTuition={scholarship.funding_tuition ?? undefined}
            fundingLiving={scholarship.funding_living ?? undefined}
            fundingTravel={scholarship.funding_travel ?? undefined}
            fundingInsurance={scholarship.funding_insurance ?? undefined}
            fundingBooks={scholarship.funding_books ?? undefined}
            fundingResearch={scholarship.funding_research ?? undefined}
            awardAmountMin={scholarship.award_amount_min ?? undefined}
            awardAmountMax={scholarship.award_amount_max ?? undefined}
            awardCurrency={scholarship.award_currency ?? undefined}
            scholarshipType={
              (scholarship.scholarship_type ?? undefined) as ScholarshipType | undefined
            }
          />

          {/* Country Info -- per host country: cost, admission/visa, intakes, post-study work */}
          {(() => {
            let codes = parseHostCountries(scholarship.host_country);

            // Fallback: infer country from application URL TLD when host_country is unresolvable
            if (codes.length === 0 && scholarship.application_url) {
              try {
                const hostname = new URL(scholarship.application_url).hostname;
                const tld = hostname.split(".").pop()?.toUpperCase();
                const tldMap: Record<string, string> = {
                  AU: "AU",
                  UK: "GB",
                  DE: "DE",
                  JP: "JP",
                  CA: "CA",
                  FR: "FR",
                  NL: "NL",
                  SE: "SE",
                  CH: "CH",
                  KR: "KR",
                  SG: "SG",
                  NZ: "NZ",
                  IE: "IE",
                  DK: "DK",
                };
                if (tld && tldMap[tld]) codes = [tldMap[tld]];
              } catch {
                /* invalid URL */
              }
            }

            const studyInfo = scholarship.study_info as Record<string, string> | undefined;
            const countriesWithData = codes
              .map((code) => ({
                code,
                data: buildStudyData(studyInfo, getCountryData(code), code),
                name: getCountryName(code),
              }))
              .filter((c) => c.data !== null);

            // If no recognized countries but study_info exists, show generic section
            if (
              countriesWithData.length === 0 &&
              studyInfo &&
              Object.values(studyInfo).some(Boolean)
            ) {
              const genericData = buildStudyData(studyInfo, null, "XX");
              if (genericData) {
                countriesWithData.push({ code: "XX", data: genericData, name: "this country" });
              }
            }

            if (countriesWithData.length === 0) return null;

            const coverage = {
              fundingType: scholarship.funding_type,
              fundingTuition: scholarship.funding_tuition ?? undefined,
              fundingLiving: scholarship.funding_living ?? undefined,
              fundingTravel: scholarship.funding_travel ?? undefined,
              fundingInsurance: scholarship.funding_insurance ?? undefined,
              awardAmountMin: scholarship.award_amount_min ?? undefined,
              awardAmountMax: scholarship.award_amount_max ?? undefined,
              awardCurrency: scholarship.award_currency ?? undefined,
            };

            return countriesWithData.map((country) => (
              <div key={country.code} className="space-y-6">
                <h2 className="font-heading text-2xl flex items-center gap-2">
                  {getCountryFlag(country.code)} Studying in {country.name}
                </h2>
                <CostOfStudyingSection
                  data={country.data!}
                  countryName={country.name}
                  coverage={coverage}
                />
                <AdmissionVisaSection data={country.data!} countryName={country.name} />
                <IntakePeriodsSection data={country.data!} />
                <PostStudyWorkSection data={country.data!} countryName={country.name} />
              </div>
            ));
          })()}

          {/* Application Tips */}
          <ApplicationTipsSection
            scholarshipType={
              (scholarship.scholarship_type ?? undefined) as ScholarshipType | undefined
            }
            applicationTips={scholarship.application_tips ?? undefined}
          />

          {/* How to Apply */}
          <HowToApplySection
            applicationDeadline={scholarship.application_deadline ?? undefined}
            applicationUrl={scholarship.application_url ?? undefined}
            editorialNotes={scholarship.editorial_notes}
            expectedReopenMonth={scholarship.expected_reopen_month ?? undefined}
          />

          {/* Sources */}
          <SourcesSection
            resolvedSources={scholarship.resolved_sources}
            lastVerified={scholarship.last_verified ?? undefined}
            sourceCount={scholarship.source_ids.length}
          />

          {/* Similar Scholarships (DISC-03) */}
          <RelatedScholarships scholarshipId={scholarship._id} />
        </div>
      </div>

      {/* Scroll to top */}
      <BackToTop />
    </div>
  );
}
