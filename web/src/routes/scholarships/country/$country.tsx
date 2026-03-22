import { createFileRoute } from "@tanstack/react-router";
import { Info } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { AdmissionVisaSection } from "@/components/country/AdmissionVisaSection";
import { CostOfStudyingSection } from "@/components/country/CostOfStudyingSection";
import { CountryScholarships } from "@/components/country/CountryScholarships";
import { IntakePeriodsSection } from "@/components/country/IntakePeriodsSection";
import { PostStudyWorkSection } from "@/components/country/PostStudyWorkSection";
import { getCountryData } from "@/lib/country-data";
import { getCountryFlag, getCountryName } from "@/lib/countries";

export const Route = createFileRoute("/scholarships/country/$country")({
  head: ({ params }) => {
    const name = getCountryName(params.country);
    return {
      meta: [
        { title: `Scholarships in ${name} -- ScholarHub` },
        {
          name: "description",
          content: `Browse international scholarships available in ${name}. Find tuition costs, visa requirements, intake periods, and post-study work opportunities in ${name}.`,
        },
      ],
    };
  },
  component: CountryLandingPage,
});

function CountryLandingPage() {
  const { country } = Route.useParams();
  const countryName = getCountryName(country);
  const flag = getCountryFlag(country);
  const countryData = getCountryData(country);

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
              Everything you need to know about studying in {countryName} — tuition costs, visa
              requirements, intake periods, and available scholarships.
            </p>
          </div>

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
        </div>
      </div>
    </div>
  );
}
