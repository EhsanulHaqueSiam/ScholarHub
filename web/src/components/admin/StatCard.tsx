import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
}

export function StatCard({ label, value, icon: Icon }: StatCardProps) {
  return (
    <div className="border-2 border-border border-t-4 border-t-main bg-accent/10 shadow-shadow p-6 rounded-base min-h-28 flex items-center gap-4">
      <Icon className="size-10 text-main shrink-0" />
      <div>
        <p className="text-3xl font-heading leading-tight">{value}</p>
        <p className="text-sm text-foreground/70 font-heading uppercase tracking-wide">{label}</p>
      </div>
    </div>
  );
}
