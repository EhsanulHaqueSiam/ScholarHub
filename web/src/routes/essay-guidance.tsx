import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/Navbar";
import { BackToTop } from "@/components/layout/BackToTop";
import { EssayGuidancePage } from "@/components/guide/EssayGuidance";

export const Route = createFileRoute("/essay-guidance")({
  head: () => ({
    meta: [
      { title: "Essay & SOP Guidance | ScholarHub" },
      {
        name: "description",
        content:
          "Actionable guidance for writing scholarship essays and statements of purpose by scholarship type. Common prompts, reviewer expectations, and tips.",
      },
    ],
  }),
  component: () => (
    <>
      <Navbar />
      <EssayGuidancePage />
      <BackToTop />
    </>
  ),
});
