import { createFileRoute } from "@tanstack/react-router";
import { CoverageBreakdown } from "@/components/home/CoverageBreakdown";
import { HowToApplySteps } from "@/components/home/HowToApplySteps";
import { ScholarshipTimeline } from "@/components/home/ScholarshipTimeline";
import { BackToTop } from "@/components/layout/BackToTop";
import { Navbar } from "@/components/layout/Navbar";
import { buildPageMeta } from "@/lib/seo/meta";

export const Route = createFileRoute("/guide")({
  head: () => {
    const { meta, links } = buildPageMeta({
      title: "Scholarship Guide | ScholarHub",
      description:
        "Everything you need to know about finding, applying for, and planning your scholarship journey. Coverage breakdown, application steps, and timeline.",
      canonicalPath: "/guide",
    });
    return { meta, links };
  },
  component: GuidePage,
});

function GuidePage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="pt-20 pb-8 md:pt-24 md:pb-12 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <p className="font-heading text-xs uppercase tracking-[0.25em] text-foreground/60">
            Scholarship guide
          </p>
          <h1 className="font-heading text-title md:text-display leading-[1.1] text-foreground">
            New to <span className="text-accent-pink">scholarships</span>?
          </h1>
          <p className="font-base text-foreground/60 text-base md:text-lg max-w-lg mx-auto">
            Everything you need to know about finding, applying for, and planning your scholarship
            journey.
          </p>
        </div>
      </section>

      <CoverageBreakdown />
      <HowToApplySteps />
      <ScholarshipTimeline />

      <BackToTop />
    </div>
  );
}
