import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/Navbar";
import { BackToTop } from "@/components/layout/BackToTop";
import { TrackerKanban } from "@/components/tracker/TrackerKanban";

export const Route = createFileRoute("/tracker")({
  head: () => ({
    meta: [
      { title: "My Applications | ScholarHub" },
      { name: "description", content: "Track your scholarship applications across stages." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TrackerPage,
});

function TrackerPage() {
  return (
    <>
      <Navbar />
      <div className="pt-24 pb-12 px-4 md:px-6 max-w-7xl mx-auto">
        <h1 className="font-heading text-heading mb-6">My Applications</h1>
        <TrackerKanban />
      </div>
      <BackToTop />
    </>
  );
}
