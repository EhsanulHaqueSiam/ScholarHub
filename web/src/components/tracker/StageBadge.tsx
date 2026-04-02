import { Search, FileEdit, Send, Users, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { STAGE_CONFIG, type TrackerStage } from "@/lib/tracker/types";

const STAGE_ICONS = {
  researching: Search,
  preparing: FileEdit,
  submitted: Send,
  interview: Users,
  result: Trophy,
} as const;

interface StageBadgeProps {
  stage: TrackerStage;
  className?: string;
}

export function StageBadge({ stage, className }: StageBadgeProps) {
  const config = STAGE_CONFIG[stage];
  const Icon = STAGE_ICONS[stage];

  return (
    <Badge
      className={className}
      style={{ backgroundColor: `var(--${config.colorToken})` }}
    >
      <Icon className="size-3" />
      <span className="text-caption">{config.label}</span>
    </Badge>
  );
}
