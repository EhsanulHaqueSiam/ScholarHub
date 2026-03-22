import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function DuplicateBadge() {
  return (
    <Badge variant="urgencyWarning" className="gap-1">
      <AlertTriangle className="size-3" />
      Possible duplicate
    </Badge>
  );
}
