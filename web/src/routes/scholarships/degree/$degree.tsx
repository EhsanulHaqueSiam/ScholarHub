import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";

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

export const Route = createFileRoute("/scholarships/degree/$degree")({
  head: ({ params }) => {
    const name = formatDegreeName(params.degree);
    return {
      meta: [
        { title: `${name} Scholarships -- ScholarHub` },
        {
          name: "description",
          content: `Browse ${name.toLowerCase()} scholarships worldwide. Find fully funded ${name.toLowerCase()} programs and funding opportunities.`,
        },
      ],
    };
  },
  component: DegreeLandingPage,
});

function DegreeLandingPage() {
  const { degree } = Route.useParams();
  const degreeName = formatDegreeName(degree);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-heading text-[32px] md:text-[40px] leading-[1.1] mt-8 mb-4">
            {degreeName} Scholarships
          </h1>
          <Card className="mt-8">
            <CardContent className="p-6">
              <p className="text-sm text-foreground/60">
                Degree-specific landing page coming in Phase 9
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
