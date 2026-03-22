import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { StatsBar } from "@/components/admin/StatsBar";
import { api } from "../../../convex/_generated/api";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const stats = useQuery(api.admin.getAdminStats);

  return (
    <div className="space-y-12">
      {/* Stats bar (D-01) */}
      <StatsBar stats={stats} />

      {/* ReviewQueue placeholder - Plan 03 will fill this */}
      <div className="text-foreground text-sm font-base">
        Review queue loading...
      </div>
    </div>
  );
}
