import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { useMutation } from "convex/react";
import { X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ALL_TAGS, getTagLabel } from "@/lib/tags";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface BulkActionBarProps {
  selectedCount: number;
  selectedIds: Set<Id<"scholarships">>;
  onClear: () => void;
}

export function BulkActionBar({ selectedCount, selectedIds, onClear }: BulkActionBarProps) {
  const bulkApprove = useMutation(api.admin.bulkApprove);
  const bulkReject = useMutation(api.admin.bulkReject);
  const bulkAddTags = useMutation(api.tags.bulkAddTags);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState("");
  const [isTagging, setIsTagging] = useState(false);

  const filteredBulkTags = useMemo(() => {
    if (!tagSearch) return ALL_TAGS.slice(0, 15);
    const q = tagSearch.toLowerCase();
    return ALL_TAGS.filter((t) => t.label.toLowerCase().includes(q) || t.id.includes(q)).slice(
      0,
      15,
    );
  }, [tagSearch]);

  function toggleTag(tagId: string) {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId],
    );
  }

  async function handleBulkTag() {
    if (selectedTags.length === 0) return;
    setIsTagging(true);
    setResultMessage(null);
    try {
      const result = await bulkAddTags({
        scholarshipIds: Array.from(selectedIds),
        tags: selectedTags,
      });
      setResultMessage(`Tagged ${result.updated} scholarships`);
      setShowTagDropdown(false);
      setSelectedTags([]);
      setTagSearch("");
      setTimeout(() => {
        setResultMessage(null);
      }, 2000);
    } catch {
      setResultMessage("Failed to tag selections");
    } finally {
      setIsTagging(false);
    }
  }

  async function handleBulkApprove() {
    setIsApproving(true);
    setResultMessage(null);
    try {
      const result = await bulkApprove({
        scholarshipIds: Array.from(selectedIds),
      });
      setResultMessage(
        `Approved ${result.approved}${result.blocked > 0 ? `, ${result.blocked} blocked (duplicates)` : ""}`,
      );
      setTimeout(() => {
        setResultMessage(null);
        onClear();
      }, 2000);
    } catch {
      setResultMessage("Failed to approve selections");
    } finally {
      setIsApproving(false);
    }
  }

  async function handleBulkReject() {
    setIsRejecting(true);
    setResultMessage(null);
    try {
      const result = await bulkReject({
        scholarshipIds: Array.from(selectedIds),
      });
      setResultMessage(`Rejected ${result.rejected} scholarships`);
      setTimeout(() => {
        setResultMessage(null);
        onClear();
      }, 2000);
    } catch {
      setResultMessage("Failed to reject selections");
    } finally {
      setIsRejecting(false);
    }
  }

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-40 transition-transform duration-200 translate-y-0"
      role="toolbar"
      aria-label={`Bulk actions for ${selectedCount} selected scholarships`}
    >
      <div className="max-w-[1280px] mx-auto bg-foreground text-background border-t-2 border-border shadow-[0_-4px_0_0_var(--border)] h-14 flex items-center justify-between py-2 px-6">
        {/* Left: count */}
        <span className="text-sm">{resultMessage ?? `${selectedCount} scholarships selected`}</span>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleBulkApprove}
            disabled={isApproving || isRejecting}
            className="bg-main text-main-foreground border-background/30"
          >
            {isApproving ? "Approving..." : `Approve ${selectedCount} Selected`}
          </Button>

          <AlertDialog.Root>
            <AlertDialog.Trigger asChild>
              <Button variant="destructive" size="sm" disabled={isApproving || isRejecting}>
                Reject {selectedCount} Selected
              </Button>
            </AlertDialog.Trigger>
            <AlertDialog.Portal>
              <AlertDialog.Overlay className="fixed inset-0 bg-overlay z-50" />
              <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-secondary-background border-2 border-border rounded-base shadow-shadow p-6 w-full max-w-md">
                <AlertDialog.Title className="font-heading text-lg mb-2">
                  Reject {selectedCount} scholarships?
                </AlertDialog.Title>
                <AlertDialog.Description className="text-sm text-foreground/70 mb-4">
                  They will not be visible to students.
                </AlertDialog.Description>
                <div className="flex justify-end gap-2">
                  <AlertDialog.Cancel asChild>
                    <Button variant="neutral" size="sm">
                      Keep All
                    </Button>
                  </AlertDialog.Cancel>
                  <AlertDialog.Action asChild>
                    <Button variant="destructive" size="sm" onClick={handleBulkReject}>
                      Reject All
                    </Button>
                  </AlertDialog.Action>
                </div>
              </AlertDialog.Content>
            </AlertDialog.Portal>
          </AlertDialog.Root>

          {/* Tag Selected button + dropdown */}
          <div className="relative">
            <Button
              variant="neutral"
              size="sm"
              onClick={() => setShowTagDropdown((prev) => !prev)}
              disabled={isApproving || isRejecting || isTagging}
            >
              Tag Selected
            </Button>

            {showTagDropdown && (
              <div className="absolute bottom-full right-0 mb-2 w-72 bg-foreground text-background border-2 border-border rounded-base shadow-shadow p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-heading">Select tags to apply</span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTagDropdown(false);
                      setSelectedTags([]);
                      setTagSearch("");
                    }}
                    className="p-0.5 hover:bg-background/20 rounded-sm"
                    aria-label="Close tag dropdown"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>

                <input
                  type="text"
                  className="h-7 px-2 border border-background/30 rounded-base bg-background/10 text-background text-xs w-full mb-2 focus:outline-none focus:ring-1 focus:ring-background/40"
                  placeholder="Search tags..."
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                />

                <div className="max-h-40 overflow-y-auto space-y-1 mb-3">
                  {filteredBulkTags.map((tag) => (
                    <label
                      key={tag.id}
                      className="flex items-center gap-2 cursor-pointer text-xs hover:bg-background/10 p-1 rounded-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag.id)}
                        onChange={() => toggleTag(tag.id)}
                        className="size-3 accent-main"
                      />
                      {tag.label}
                    </label>
                  ))}
                </div>

                <Button
                  variant="default"
                  size="sm"
                  onClick={handleBulkTag}
                  disabled={selectedTags.length === 0 || isTagging}
                  className="w-full bg-main text-main-foreground"
                >
                  {isTagging
                    ? "Applying..."
                    : `Apply ${selectedTags.length} tag${selectedTags.length !== 1 ? "s" : ""} to ${selectedCount} scholarships`}
                </Button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClear}
            className="text-background/70 hover:text-background underline text-sm transition-colors"
          >
            Clear selection
          </button>
        </div>
      </div>
    </div>
  );
}
