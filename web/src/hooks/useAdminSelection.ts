import { useCallback, useState } from "react";
import type { Id } from "../../convex/_generated/dataModel";

export function useAdminSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<Id<"scholarships">>>(new Set());

  const toggle = useCallback((id: Id<"scholarships">) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback((ids: Id<"scholarships">[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback(
    (id: Id<"scholarships">) => selectedIds.has(id),
    [selectedIds],
  );

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    toggle,
    selectAll,
    deselectAll,
    isSelected,
  };
}
