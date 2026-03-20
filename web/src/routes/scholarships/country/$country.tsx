import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { getCountryFlag, getCountryName } from "@/lib/countries";

export const Route = createFileRoute("/scholarships/country/$country")({
  head: ({ params }) => {
    const name = getCountryName(params.country);
    return {
      meta: [
        { title: `Scholarships in ${name} -- ScholarHub` },
        {
          name: "description",
          content: `Browse international scholarships available in ${name}. Find funding opportunities for studying in ${name}.`,
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

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-20 pb-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-heading text-[32px] md:text-[40px] leading-[1.1] mt-8 mb-4">
            <span className="text-[48px]">{flag}</span>
            <br />
            Scholarships in {countryName}
          </h1>
          <Card className="mt-8">
            <CardContent className="p-6">
              <p className="text-sm text-foreground/60">
                Country-specific landing page coming in Phase 9
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
