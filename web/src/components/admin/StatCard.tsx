import { Card } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
}

export function StatCard({ label, value, icon: Icon }: StatCardProps) {
  return (
    <Card
      prestige="unranked"
      className="min-h-24 p-6 border-l-4 border-l-main flex items-center gap-4"
    >
      <Icon className="size-8 text-main shrink-0" />
      <div>
        <p className="text-2xl font-heading leading-tight">{value}</p>
        <p className="text-xs text-foreground/70 font-base">{label}</p>
      </div>
    </Card>
  );
}
