import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { anyApi } from "convex/server";
import { Navbar } from "@/components/layout/Navbar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getCountryFlag, getCountryName } from "@/lib/countries";
import type { PrestigeTier } from "@/lib/prestige";
import { getPrestigeLabel, getPrestigeTooltip } from "@/lib/prestige";

export const Route = createFileRoute("/scholarships/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} -- ScholarHub` },
      {
        name: "description",
        content: `View scholarship details for ${params.slug} on ScholarHub.`,
      },
    ],
  }),
  component: ScholarshipDetailPage,
});

/** Build Schema.org JSON-LD structured data for a scholarship.
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
}) {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Scholarship",
    name: scholarship.title,
    provider: {
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
    jsonLd.applicationDeadline = new Date(scholarship.application_deadline).toISOString();
  }

  if (scholarship.eligibility_nationalities && scholarship.eligibility_nationalities.length > 0) {
    jsonLd.eligibleRegion = scholarship.eligibility_nationalities.map((code) => ({
      "@type": "Place",
      name: getCountryName(code),
    }));
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

  return jsonLd;
}

function ScholarshipDetailPage() {
  const { slug } = Route.useParams();
  const scholarship = useQuery(anyApi.directory.getBySlug, { slug });

  if (scholarship === undefined) {
    // Loading state
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 px-4">
          <div className="max-w-3xl mx-auto">
            <Card className="motion-safe:animate-pulse">
              <CardContent className="p-8 space-y-4">
                <div className="h-8 bg-border/20 rounded-base w-3/4" />
                <div className="h-5 bg-border/20 rounded-base w-1/2" />
                <div className="h-4 bg-border/20 rounded-base w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (scholarship === null) {
    // Not found
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 px-4">
          <div className="max-w-3xl mx-auto text-center py-16">
            <h1 className="font-heading text-[32px] mb-4">Scholarship Not Found</h1>
            <p className="text-foreground/70">
              The scholarship you're looking for doesn't exist or has been removed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const prestigeTier = (scholarship.prestige_tier ?? "unranked") as PrestigeTier;
  const jsonLdString = JSON.stringify(buildScholarshipJsonLd(scholarship));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Schema.org JSON-LD structured data
          Source: Convex database (trusted, admin-curated content -- safe for inline script) */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger -- Trusted DB content for SEO structured data
        dangerouslySetInnerHTML={{ __html: jsonLdString }}
      />

      <div className="pt-20 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <Card className="overflow-hidden">
            <CardContent className="p-6 md:p-8 space-y-4">
              {/* Prestige badge + country flag */}
              <div className="flex items-center gap-2 flex-wrap">
                {prestigeTier !== "unranked" && (
                  <Badge variant={prestigeTier} title={getPrestigeTooltip(prestigeTier)}>
                    {getPrestigeLabel(prestigeTier)}
                  </Badge>
                )}
                <Badge variant="neutral" className="text-base">
                  <span aria-label={getCountryName(scholarship.host_country)} role="img">
                    {getCountryFlag(scholarship.host_country)}
                  </span>{" "}
                  {getCountryName(scholarship.host_country)}
                </Badge>
              </div>

              {/* Title */}
              <h1 className="font-heading text-2xl md:text-[32px] leading-[1.2]">
                {scholarship.title}
              </h1>

              {/* Provider */}
              <p className="text-foreground/70 font-base">{scholarship.provider_organization}</p>

              {/* Placeholder message */}
              <div className="border-2 border-border rounded-base p-4 bg-secondary-background mt-6">
                <p className="text-sm text-foreground/60 text-center">
                  Full detail page coming in Phase 7
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
