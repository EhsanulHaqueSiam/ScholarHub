import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useState } from "react";
import { CollectionsManager } from "@/components/admin/CollectionsManager";
import { EditPanel } from "@/components/admin/EditPanel";
import { ReviewQueue } from "@/components/admin/ReviewQueue";
import { SourceTrustManager } from "@/components/admin/SourceTrustManager";
import { StatsBar } from "@/components/admin/StatsBar";
import { TagsManager } from "@/components/admin/TagsManager";
import { cn } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const stats = useQuery(api.admin.getAdminStats);

  // EditPanel state
  const [editingScholarship, setEditingScholarship] = useState<{
    id: Id<"scholarships">;
    title: string;
  } | null>(null);

  // Admin view switcher: queue, sources, collections, or tags
  const [adminView, setAdminView] = useState<"queue" | "sources" | "collections" | "tags">("queue");

  return (
    <div className="space-y-12">
      {/* Stats bar (D-01) */}
      <StatsBar stats={stats} />

      {/* Admin view switcher — neo-brutalism pill tabs */}
      <div className="flex gap-3 flex-wrap">
        {(
          [
            { key: "queue", label: "Review Queue" },
            { key: "sources", label: "Source Trust" },
            { key: "collections", label: "Collections" },
            { key: "tags", label: "Tags" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setAdminView(tab.key)}
            className={cn(
              "px-4 py-2 text-sm font-heading border-2 border-border rounded-base transition-all",
              adminView === tab.key
                ? "bg-main text-main-foreground shadow-shadow"
                : "bg-secondary-background text-foreground shadow-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* View content */}
      {adminView === "queue" && (
        <ReviewQueue
          stats={stats}
          onEditScholarship={(id, title) => setEditingScholarship({ id, title })}
        />
      )}
      {adminView === "sources" && <SourceTrustManager />}
      {adminView === "collections" && <CollectionsManager />}
      {adminView === "tags" && <TagsManager />}

      {/* Edit panel (slide-out) */}
      <EditPanel
        open={!!editingScholarship}
        scholarshipId={editingScholarship?.id ?? null}
        scholarshipTitle={editingScholarship?.title ?? ""}
        onClose={() => setEditingScholarship(null)}
      />
    </div>
  );
}
