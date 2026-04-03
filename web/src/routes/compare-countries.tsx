import { createFileRoute } from "@tanstack/react-router";
import { CountryComparisonPage } from "@/components/compare-countries/CountryComparisonPage";

export const Route = createFileRoute("/compare-countries")({
  head: () => ({
    meta: [
      { title: "Compare Countries | ScholarHub" },
      {
        name: "description",
        content:
          "Compare study destinations side by side. See tuition costs, living expenses, post-study work rights, visa requirements, and scholarship availability.",
      },
    ],
  }),
  component: CountryComparisonPage,
});
