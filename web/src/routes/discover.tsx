import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod/v4";
import { Navbar } from "@/components/layout/Navbar";
import { BackToTop } from "@/components/layout/BackToTop";
import { DiscoverWizard } from "@/components/discover/DiscoverWizard";

const discoverSearch = z.object({
  step: z.string().optional(),
  tier: z.string().optional(),
  to: z.string().optional(),
  funding: z.string().optional(),
  degree: z.string().optional(),
});

export const Route = createFileRoute("/discover")({
  validateSearch: discoverSearch,
  head: () => ({
    meta: [
      { title: "Discover Scholarships | ScholarHub" },
      {
        name: "description",
        content:
          "Find scholarships that match your goals. Filter by prestige level, destination country, and funding type.",
      },
    ],
  }),
  component: DiscoverPage,
});

function DiscoverPage() {
  return (
    <>
      <Navbar />
      <DiscoverWizard />
      <BackToTop />
    </>
  );
}
