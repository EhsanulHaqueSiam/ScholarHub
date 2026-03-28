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
  const canAccess = useQuery(api.admin.getAdminAccess);
  const stats = useQuery(api.admin.getAdminStats, canAccess ? {} : "skip");

  // EditPanel state
  const [editingScholarship, setEditingScholarship] = useState<{
    id: Id<"scholarships">;
    title: string;
  } | null>(null);

  // Admin view switcher: queue, sources, collections, or tags
  const [adminView, setAdminView] = useState<"queue" | "sources" | "collections" | "tags">("queue");

  if (canAccess === undefined) {
    return <StatsBar stats={undefined} />;
  }

  if (!canAccess) {
    return (
      <div className="max-w-2xl rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
        <h1 className="font-heading text-2xl">Admin access required</h1>
        <p className="mt-3 text-sm text-foreground/80">
          This dashboard is protected. Sign in with an allowlisted admin account and ensure backend
          allowlists are configured.
        </p>
      </div>
    );
  }

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
              "px-4 py-2 text-sm font-heading border-2 border-border rounded-base transition-[transform,box-shadow,background-color] duration-150 ease-out-expo active:scale-[0.97]",
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
