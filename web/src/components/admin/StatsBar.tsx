import { Activity, CheckCircle, Clock, FileText } from "lucide-react";
import { StatCard } from "./StatCard";

interface AdminStats {
  total: number;
  pending: number;
  published: number;
  rejected: number;
  publishedToday: number;
  sourceHealth: { healthy: number; degraded: number; failing: number };
}

export function StatsBar({ stats }: { stats: AdminStats | undefined }) {
  if (!stats) {
    return (
      <div className="grid grid-cols-4 gap-8">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-24 bg-secondary-background border-2 border-border rounded-base animate-pulse"
          />
        ))}
      </div>
    );
  }

  const totalSources =
    stats.sourceHealth.healthy +
    stats.sourceHealth.degraded +
    stats.sourceHealth.failing;
  const sourceHealthLabel = `${stats.sourceHealth.healthy}/${totalSources} healthy`;

  return (
    <div className="grid grid-cols-4 gap-8">
      <StatCard label="Total Scholarships" value={stats.total} icon={FileText} />
      <StatCard label="Pending Review" value={stats.pending} icon={Clock} />
      <StatCard
        label="Published Today"
        value={stats.publishedToday}
        icon={CheckCircle}
      />
      <StatCard label="Source Health" value={sourceHealthLabel} icon={Activity} />
    </div>
  );
}
