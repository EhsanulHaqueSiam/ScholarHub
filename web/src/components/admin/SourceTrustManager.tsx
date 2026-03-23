import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type TrustLevel = "auto_publish" | "needs_review" | "blocked";

const TRUST_BADGE_MAP: Record<TrustLevel, "urgencyOpen" | "urgencyWarning" | "urgencyCritical"> = {
  auto_publish: "urgencyOpen",
  needs_review: "urgencyWarning",
  blocked: "urgencyCritical",
};

const TRUST_LABELS: Record<TrustLevel, string> = {
  auto_publish: "Auto Publish",
  needs_review: "Needs Review",
  blocked: "Blocked",
};

const CATEGORY_LABELS: Record<string, string> = {
  official_program: "Official Program",
  government: "Government",
  aggregator: "Aggregator",
  foundation: "Foundation",
  university: "University",
};

export function SourceTrustManager() {
  const sources = useQuery(api.admin.getAllSources);
  const updateSourceTrust = useMutation(api.admin.updateSourceTrust);

  const [pendingChanges, setPendingChanges] = useState<Record<string, TrustLevel>>({});
  const [confirmingSource, setConfirmingSource] = useState<{
    id: Id<"sources">;
    name: string;
    newLevel: TrustLevel;
  } | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  const pendingCount = useQuery(
    api.admin.countAffectedScholarships,
    confirmingSource ? { sourceId: confirmingSource.id } : "skip",
  );

  if (!sources) {
    return <div className="text-foreground/60 text-sm py-8 text-center">Loading sources...</div>;
  }

  const filteredSources = showActiveOnly ? sources.filter((s) => s.is_active) : sources;

  function handleDropdownChange(sourceId: string, currentLevel: TrustLevel, newLevel: TrustLevel) {
    if (newLevel === currentLevel) {
      const next = { ...pendingChanges };
      delete next[sourceId];
      setPendingChanges(next);
    } else {
      setPendingChanges({ ...pendingChanges, [sourceId]: newLevel });
    }
  }

  function handleApplyClick(source: { _id: Id<"sources">; name: string; trust_level: string }) {
    const newLevel = pendingChanges[source._id];
    if (!newLevel) return;
    setConfirmingSource({ id: source._id, name: source.name, newLevel });
  }

  async function handleConfirmApply() {
    if (!confirmingSource) return;
    setIsApplying(true);
    try {
      await updateSourceTrust({
        sourceId: confirmingSource.id,
        trustLevel: confirmingSource.newLevel,
      });
      const next = { ...pendingChanges };
      delete next[confirmingSource.id];
      setPendingChanges(next);
      setConfirmingSource(null);
    } catch (err) {
      console.error("Failed to update source trust:", err);
    } finally {
      setIsApplying(false);
    }
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-foreground/60">
          {filteredSources.length} source{filteredSources.length !== 1 ? "s" : ""}
          {showActiveOnly && sources.length !== filteredSources.length && (
            <span> ({sources.length} total)</span>
          )}
        </p>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground/80">
          <input
            type="checkbox"
            checked={showActiveOnly}
            onChange={(e) => setShowActiveOnly(e.target.checked)}
            className="size-4"
          />
          <span className="font-base">Active only</span>
        </label>
      </div>

      {/* Table */}
      <div className="border-2 border-border rounded-base overflow-hidden shadow-shadow">
        {/* Header */}
        <div className="grid grid-cols-[1fr_140px_140px_160px] gap-4 px-4 py-4 bg-main text-main-foreground border-b-2 border-border">
          <span className="text-sm font-heading font-bold uppercase tracking-wide">
            Source Name
          </span>
          <span className="text-sm font-heading font-bold uppercase tracking-wide">Category</span>
          <span className="text-sm font-heading font-bold uppercase tracking-wide">
            Trust Level
          </span>
          <span className="text-sm font-heading font-bold uppercase tracking-wide">Actions</span>
        </div>

        {/* Rows */}
        {filteredSources.length === 0 ? (
          <div className="text-center py-12">
            <p className="font-heading text-lg text-foreground/80 mb-2">No sources found</p>
            <p className="text-sm text-foreground/60">
              Sources will appear here after the scraping pipeline is configured.
            </p>
          </div>
        ) : (
          filteredSources.map((source) => {
            const currentTrust = source.trust_level as TrustLevel;
            const pendingLevel = pendingChanges[source._id];
            const hasChange = pendingLevel !== undefined;

            return (
              <div
                key={source._id}
                className={cn(
                  "grid grid-cols-[1fr_140px_140px_160px] gap-4 px-4 py-4 border-b-2 border-border items-center hover:bg-accent/5 transition-colors",
                  !source.is_active && "opacity-50 grayscale",
                )}
              >
                {/* Source name */}
                <div className="min-w-0">
                  <span className="text-sm font-base truncate block">{source.name}</span>
                  {!source.is_active && (
                    <span className="text-xs text-foreground/40">Inactive</span>
                  )}
                </div>

                {/* Category badge */}
                <div>
                  <Badge variant="neutral">
                    {CATEGORY_LABELS[source.category] ?? source.category}
                  </Badge>
                </div>

                {/* Trust level with change dropdown */}
                <div className="flex items-center gap-2">
                  <select
                    value={pendingLevel ?? currentTrust}
                    onChange={(e) =>
                      handleDropdownChange(source._id, currentTrust, e.target.value as TrustLevel)
                    }
                    className="text-xs border-2 border-border rounded-base bg-background px-3 py-1.5 font-heading"
                  >
                    <option value="auto_publish">Auto Publish</option>
                    <option value="needs_review">Needs Review</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Badge variant={TRUST_BADGE_MAP[pendingLevel ?? currentTrust]}>
                    {TRUST_LABELS[pendingLevel ?? currentTrust]}
                  </Badge>
                  {hasChange && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleApplyClick(source)}
                      className="text-xs px-2 py-1 h-auto"
                    >
                      Apply
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation dialog */}
      <AlertDialog.Root
        open={!!confirmingSource}
        onOpenChange={(open) => {
          if (!open) setConfirmingSource(null);
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-overlay z-50" />
          <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-secondary-background border-2 border-border rounded-base shadow-shadow p-6 w-full max-w-md">
            <AlertDialog.Title className="font-heading text-lg mb-2">
              Change Trust Level
            </AlertDialog.Title>
            <AlertDialog.Description className="text-sm text-foreground/70 mb-4">
              {confirmingSource && (
                <>
                  Changing trust level to <strong>{TRUST_LABELS[confirmingSource.newLevel]}</strong>{" "}
                  for <strong>{confirmingSource.name}</strong>
                  {pendingCount !== undefined && pendingCount > 0
                    ? `. This will affect ${pendingCount} pending scholarship${pendingCount !== 1 ? "s" : ""}`
                    : pendingCount === 0
                      ? ". No pending scholarships will be affected"
                      : ""}
                  . Continue?
                </>
              )}
            </AlertDialog.Description>
            <div className="flex justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <Button variant="neutral" size="sm">
                  Cancel
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleConfirmApply}
                  disabled={isApplying}
                >
                  {isApplying ? "Applying..." : "Apply Change"}
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </section>
  );
}
