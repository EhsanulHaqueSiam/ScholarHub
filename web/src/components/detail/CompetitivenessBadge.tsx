import { Badge } from "@/components/ui/badge";
import {
  getCompetitivenessTier,
  COMPETITIVENESS_LABELS,
  COMPETITIVENESS_VARIANTS,
} from "@/lib/competitiveness";

interface CompetitivenessBadgeProps {
  prestigeTier: string | null | undefined;
  fundingType: string;
}

export function CompetitivenessBadge({
  prestigeTier,
  fundingType,
}: CompetitivenessBadgeProps) {
  const tier = getCompetitivenessTier(prestigeTier, fundingType);
  const variant = COMPETITIVENESS_VARIANTS[tier] as any;

  return (
    <Badge variant={variant}>
      {COMPETITIVENESS_LABELS[tier]}
    </Badge>
  );
}
