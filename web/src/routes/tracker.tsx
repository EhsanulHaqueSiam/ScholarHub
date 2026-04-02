import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/Navbar";
import { BackToTop } from "@/components/layout/BackToTop";
import { TrackerKanban } from "@/components/tracker/TrackerKanban";
import { DocumentMatrix } from "@/components/tracker/DocumentMatrix";
import { ExportCSVButton } from "@/components/tracker/ExportCSVButton";
import { StorageErrorBanner } from "@/components/ui/storage-error-banner";
import { useTrackerStore } from "@/hooks/useTrackerStore";

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
  const storageError = useTrackerStore((s) => s.storageError);

  return (
    <>
      <Navbar />
      <div className="pt-24 pb-12 px-4 md:px-6 max-w-7xl mx-auto">
        {storageError && <StorageErrorBanner error={storageError} />}

        <div className="flex items-center justify-between mb-6">
          <h1 className="font-heading text-heading">My Applications</h1>
          <ExportCSVButton />
        </div>

        <TrackerKanban />

        <div className="mt-12">
          <DocumentMatrix />
        </div>
      </div>
      <BackToTop />
    </>
  );
}
