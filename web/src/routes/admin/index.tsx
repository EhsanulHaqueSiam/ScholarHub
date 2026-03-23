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

      {/* Admin view switcher */}
      <div className="flex gap-4 border-b-2 border-border">
        <button
          type="button"
          onClick={() => setAdminView("queue")}
          className={cn(
            "pb-2 text-sm font-heading -mb-[2px] transition-colors",
            adminView === "queue"
              ? "border-b-2 border-main text-foreground"
              : "text-foreground/60 hover:text-foreground",
          )}
        >
          Review Queue
        </button>
        <button
          type="button"
          onClick={() => setAdminView("sources")}
          className={cn(
            "pb-2 text-sm font-heading -mb-[2px] transition-colors",
            adminView === "sources"
              ? "border-b-2 border-main text-foreground"
              : "text-foreground/60 hover:text-foreground",
          )}
        >
          Source Trust
        </button>
        <button
          type="button"
          onClick={() => setAdminView("collections")}
          className={cn(
            "pb-2 text-sm font-heading -mb-[2px] transition-colors",
            adminView === "collections"
              ? "border-b-2 border-main text-foreground"
              : "text-foreground/60 hover:text-foreground",
          )}
        >
          Collections
        </button>
        <button
          type="button"
          onClick={() => setAdminView("tags")}
          className={cn(
            "pb-2 text-sm font-heading -mb-[2px] transition-colors",
            adminView === "tags"
              ? "border-b-2 border-main text-foreground"
              : "text-foreground/60 hover:text-foreground",
          )}
        >
          Tags
        </button>
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
