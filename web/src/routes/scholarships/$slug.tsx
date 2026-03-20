import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useRef } from "react";
import { z } from "zod";
import { api } from "../../../convex/_generated/api";
import { Navbar } from "@/components/layout/Navbar";
import { BackToTop } from "@/components/layout/BackToTop";
import { HeroSection } from "@/components/detail/HeroSection";
import { StickyBar } from "@/components/detail/StickyBar";
import { DetailBreadcrumb } from "@/components/detail/Breadcrumb";
import { OverviewSection } from "@/components/detail/OverviewSection";
import { EligibilitySection } from "@/components/detail/EligibilitySection";
import { FundingSection } from "@/components/detail/FundingSection";
import { HowToApplySection } from "@/components/detail/HowToApplySection";
import { SourcesSection } from "@/components/detail/SourcesSection";
import { DetailSkeleton } from "@/components/detail/DetailSkeleton";
import { useIsHeroVisible } from "@/lib/deadline";
import { formatFundingType } from "@/lib/shared";
import { getCountryName } from "@/lib/countries";
import { getDeadlineUrgency } from "@/lib/filters";
import type { PrestigeTier } from "@/lib/prestige";

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
});

export const Route = createFileRoute("/scholarships/$slug")({
  validateSearch: (search) => detailSearchSchema.parse(search),
  head: ({ params }) => ({
    meta: [
      {
        title: `${params.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} | ScholarHub`,
      },
      {
        name: "description",
        content: `View scholarship details for ${params.slug.replace(/-/g, " ")} on ScholarHub -- eligibility, funding, deadlines, and how to apply.`,
      },
    ],
  }),
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
      ? scholarship.degree_levels[0].charAt(0).toUpperCase() +
        scholarship.degree_levels[0].slice(1)
      : null;
  const country = getCountryName(scholarship.host_country);

  if (degree && country) {
    return `${scholarship.title} -- ${fundingLabel} ${degree} Scholarship in ${country} | ScholarHub`;
  }
  return `${scholarship.title} | ScholarHub`;
}

/**
 * Build Schema.org JSON-LD structured data for a scholarship.
 *
 * All data comes from the Convex database (trusted source, not user-generated content).
 * The JSON is stringified and embedded as a script tag for search engine consumption.
 */
function buildScholarshipJsonLd(scholarship: {
  title: string;
  description?: string | null;
  provider_organization: string;
  host_country: string;
  application_deadline?: number | null;
  eligibility_nationalities?: string[] | null;
  award_amount_max?: number | null;
  award_currency?: string | null;
  application_url?: string | null;
  slug?: string | null;
  _id: string;
  degree_levels: string[];
  fields_of_study?: string[] | null;
  last_verified?: number | null;
}) {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Scholarship",
    name: scholarship.title,
    provider: {
      "@type": "Organization",
      name: scholarship.provider_organization,
    },
    funder: {
      "@type": "Organization",
      name: scholarship.provider_organization,
    },
    url:
      scholarship.application_url ??
      `${typeof window !== "undefined" ? window.location.origin : ""}/scholarships/${scholarship.slug ?? scholarship._id}`,
  };

  if (scholarship.description) {
    jsonLd.description = scholarship.description;
  }

  if (scholarship.application_deadline) {
    jsonLd.applicationDeadline = new Date(
      scholarship.application_deadline,
    ).toISOString();
  }

  if (
    scholarship.eligibility_nationalities &&
    scholarship.eligibility_nationalities.length > 0
  ) {
    jsonLd.eligibleRegion = scholarship.eligibility_nationalities.map(
      (code) => ({
        "@type": "Place",
        name: getCountryName(code),
      }),
    );
  }

  if (scholarship.host_country) {
    jsonLd.studyLocation = {
      "@type": "Place",
      name: getCountryName(scholarship.host_country),
    };
  }

  if (scholarship.award_amount_max) {
    jsonLd.amount = {
      "@type": "MonetaryAmount",
      value: scholarship.award_amount_max,
      currency: scholarship.award_currency ?? "USD",
    };
  }

  // Expanded fields per 07-UI-SPEC SEO contract
  if (scholarship.degree_levels.length > 0) {
    jsonLd.educationalLevel = scholarship.degree_levels;
  }

  if (scholarship.fields_of_study && scholarship.fields_of_study.length > 0) {
    jsonLd.occupationalCategory = scholarship.fields_of_study;
  }

  if (scholarship.last_verified) {
    jsonLd.dateModified = new Date(scholarship.last_verified).toISOString();
  }

  return jsonLd;
}

function ScholarshipDetailPage() {
  const { slug } = Route.useParams();
  const search = Route.useSearch();
  const heroRef = useRef<HTMLDivElement>(null);
  const isHeroVisible = useIsHeroVisible(heroRef);
  const scholarship = useQuery(api.directory.getScholarshipDetail, { slug });

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
            <h1 className="font-heading text-[32px] mb-4">
              Scholarship Not Found
            </h1>
            <p className="text-foreground/70 mb-8">
              The scholarship you're looking for doesn't exist or has been
              removed.
            </p>
            <Link
              to="/scholarships"
              className="inline-flex items-center justify-center rounded-base border-2 border-border bg-main px-6 py-3 text-sm font-base text-white shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none transition-all"
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
  const urgency = getDeadlineUrgency(
    scholarship.application_deadline ?? undefined,
  );
  const isExpired = urgency === "closed";
  const scholarshipSlug = scholarship.slug ?? scholarship._id;

  const jsonLdString = JSON.stringify(buildScholarshipJsonLd(scholarship));

  // Client-side meta title update
  const metaTitle = buildMetaTitle(scholarship);
  if (typeof document !== "undefined") {
    document.title = metaTitle;
  }

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

      {/* Schema.org JSON-LD structured data
          Source: Convex database (trusted, admin-curated content -- safe for inline script) */}
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Trusted DB content for SEO structured data
        dangerouslySetInnerHTML={{ __html: jsonLdString }}
      />

      {/* Page content */}
      <div className="pt-20 pb-16 px-4 md:px-6">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Breadcrumb navigation */}
          <DetailBreadcrumb
            scholarshipTitle={scholarship.title}
            searchParams={search}
          />

          {/* Hero section with IntersectionObserver ref */}
          <HeroSection
            ref={heroRef}
            title={scholarship.title}
            providerOrganization={scholarship.provider_organization}
            prestigeTier={prestigeTier}
            hostCountry={scholarship.host_country}
            applicationDeadline={
              scholarship.application_deadline ?? undefined
            }
            degreeLevels={scholarship.degree_levels}
            fundingType={scholarship.funding_type}
            applicationUrl={scholarship.application_url ?? undefined}
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
            awardAmountMin={scholarship.award_amount_min ?? undefined}
            awardAmountMax={scholarship.award_amount_max ?? undefined}
            awardCurrency={scholarship.award_currency ?? undefined}
          />

          {/* How to Apply */}
          <HowToApplySection
            applicationDeadline={
              scholarship.application_deadline ?? undefined
            }
            applicationUrl={scholarship.application_url ?? undefined}
            editorialNotes={scholarship.editorial_notes}
            expectedReopenMonth={
              scholarship.expected_reopen_month ?? undefined
            }
          />

          {/* Sources */}
          <SourcesSection
            resolvedSources={scholarship.resolved_sources}
            lastVerified={scholarship.last_verified ?? undefined}
            sourceCount={scholarship.source_ids.length}
          />
        </div>
      </div>

      {/* Scroll to top */}
      <BackToTop />
    </div>
  );
}
