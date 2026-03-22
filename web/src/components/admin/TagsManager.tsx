import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { useMutation, useQuery } from "convex/react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TAG_CATEGORIES, ALL_TAGS, getTagLabel, getTagCategory } from "@/lib/tags";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { SuggestedTagReview } from "./SuggestedTagReview";

/**
 * TagsManager: Admin tab for managing tags.
 * Three sections: grouped tag list, pending suggested tag review, filter-then-tag bulk interface.
 * D-34 through D-39
 */
export function TagsManager() {
  const allTags = useQuery(api.tags.getAllTags);
  const deleteTagMut = useMutation(api.tags.deleteTagPublic);
  const renameTagMut = useMutation(api.tags.renameTagPublic);
  const addTag = useMutation(api.tags.addTagToScholarship);
  const bulkAddTags = useMutation(api.tags.bulkAddTags);

  // Section 1: Grouped tag list state
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["eligibility"]));
  const [renamingTag, setRenamingTag] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deletingTag, setDeletingTag] = useState<string | null>(null);
  const [newTagInputs, setNewTagInputs] = useState<Record<string, string>>({});

  // Section 2: Suggested tags state
  const [expandedScholarshipId, setExpandedScholarshipId] = useState<Id<"scholarships"> | null>(null);

  // Section 3: Filter-then-tag state
  const [searchQuery, setSearchQuery] = useState("");
  const [showUntaggedOnly, setShowUntaggedOnly] = useState(false);
  const [selectedBulkTags, setSelectedBulkTags] = useState<string[]>([]);
  const [selectedScholarshipIds, setSelectedScholarshipIds] = useState<Set<Id<"scholarships">>>(new Set());
  const [bulkApplying, setBulkApplying] = useState(false);

  // Get scholarships with suggested tags for Section 2
  const reviewQueue = useQuery(api.admin.getReviewQueue, { status: "published" as any, limit: 200 });

  // Get all published scholarships for filter-then-tag
  const allScholarships = useQuery(api.admin.getReviewQueue, { limit: 200 });

  // Build tag count map
  const tagCountMap = useMemo(() => {
    const map = new Map<string, number>();
    if (allTags) {
      for (const t of allTags) {
        map.set(t.tag, t.count);
      }
    }
    return map;
  }, [allTags]);

  // Custom/freeform tags (not in predefined categories)
  const customTags = useMemo(() => {
    if (!allTags) return [];
    return allTags.filter((t) => !getTagCategory(t.tag) && t.count > 0);
  }, [allTags]);

  // Scholarships with suggested tags
  const scholarshipsWithSuggestions = useMemo(() => {
    if (!reviewQueue) return [];
    return reviewQueue.filter((s: any) => s.suggested_tags && s.suggested_tags.length > 0);
  }, [reviewQueue]);

  // Filtered scholarships for Section 3
  const filteredScholarships = useMemo(() => {
    if (!allScholarships) return [];
    let results = [...allScholarships] as any[];

    if (showUntaggedOnly) {
      results = results.filter((s) => !s.tags || s.tags.length === 0);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter((s: any) => s.title.toLowerCase().includes(q));
    }

    return results.slice(0, 50);
  }, [allScholarships, searchQuery, showUntaggedOnly]);

  function toggleCategory(key: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function startRename(tagId: string) {
    setRenamingTag(tagId);
    setRenameValue(getTagLabel(tagId));
  }

  async function handleRename(oldTag: string) {
    if (renameValue.trim() && renameValue !== getTagLabel(oldTag)) {
      const newTag = renameValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, "");
      await renameTagMut({ oldTag, newTag });
    }
    setRenamingTag(null);
    setRenameValue("");
  }

  async function handleDeleteTag(tag: string) {
    await deleteTagMut({ tag });
    setDeletingTag(null);
  }

  function handleNewTagKey(category: string, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      const value = newTagInputs[category]?.trim();
      if (value) {
        const tagId = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_|_$/g, "");
        // D-35: Create by adding to a scholarship (tag is created implicitly)
        // For now, just clear the input -- tag will exist when added to a scholarship
        setNewTagInputs((prev) => ({ ...prev, [category]: "" }));
      }
    }
  }

  function toggleBulkTag(tagId: string) {
    setSelectedBulkTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId],
    );
  }

  function toggleScholarshipSelect(id: Id<"scholarships">) {
    setSelectedScholarshipIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleBulkApplyTags() {
    if (selectedBulkTags.length === 0 || selectedScholarshipIds.size === 0) return;
    setBulkApplying(true);
    try {
      await bulkAddTags({
        scholarshipIds: Array.from(selectedScholarshipIds),
        tags: selectedBulkTags,
      });
      setSelectedBulkTags([]);
      setSelectedScholarshipIds(new Set());
    } catch (error) {
      console.error("Failed to bulk apply tags:", error);
    } finally {
      setBulkApplying(false);
    }
  }

  if (!allTags) {
    return <div className="text-foreground/60 text-sm py-8 text-center">Loading tags...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Section 1: Grouped Tag List */}
      <div>
        <h2 className="text-xl font-heading mb-4">Tag List</h2>

        {Object.entries(TAG_CATEGORIES).map(([categoryKey, category]) => (
          <div key={categoryKey} className="border-2 border-border rounded-base mb-2 overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center justify-between p-3 hover:bg-secondary-background/50 transition-colors"
              onClick={() => toggleCategory(categoryKey)}
            >
              <span className="font-heading text-sm">{category.label}</span>
              {expandedCategories.has(categoryKey) ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronRight className="size-4" />
              )}
            </button>

            {expandedCategories.has(categoryKey) && (
              <div className="border-t-2 border-border p-3 space-y-2">
                {category.tags.map((tagDef) => (
                  <div key={tagDef.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {renamingTag === tagDef.id ? (
                        <input
                          type="text"
                          className="h-7 px-2 border-2 border-border rounded-base bg-background text-xs w-40 focus:outline-none focus:ring-2 focus:ring-ring"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={() => handleRename(tagDef.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRename(tagDef.id);
                            if (e.key === "Escape") setRenamingTag(null);
                          }}
                          autoFocus
                        />
                      ) : (
                        <Badge variant="tag">{tagDef.label}</Badge>
                      )}
                      <span className="text-xs text-foreground/50 tabular-nums">
                        {tagCountMap.get(tagDef.id) ?? 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startRename(tagDef.id)}
                        className="text-xs text-foreground/50 hover:text-foreground underline"
                      >
                        Rename
                      </button>
                      <AlertDialog.Root
                        open={deletingTag === tagDef.id}
                        onOpenChange={(open) => setDeletingTag(open ? tagDef.id : null)}
                      >
                        <AlertDialog.Trigger asChild>
                          <button
                            type="button"
                            className="text-xs text-destructive/70 hover:text-destructive underline"
                          >
                            Delete
                          </button>
                        </AlertDialog.Trigger>
                        <AlertDialog.Portal>
                          <AlertDialog.Overlay className="fixed inset-0 bg-overlay z-50" />
                          <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-secondary-background border-2 border-border rounded-base shadow-shadow p-6 w-full max-w-md">
                            <AlertDialog.Title className="font-heading text-lg mb-2">
                              Delete tag &ldquo;{tagDef.label}&rdquo;?
                            </AlertDialog.Title>
                            <AlertDialog.Description className="text-sm text-foreground/70 mb-4">
                              This tag is used by {tagCountMap.get(tagDef.id) ?? 0} scholarships. It will be removed from all of them.
                            </AlertDialog.Description>
                            <div className="flex justify-end gap-2">
                              <AlertDialog.Cancel asChild>
                                <Button variant="neutral" size="sm">Keep Tag</Button>
                              </AlertDialog.Cancel>
                              <AlertDialog.Action asChild>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteTag(tagDef.id)}
                                >
                                  Delete Tag
                                </Button>
                              </AlertDialog.Action>
                            </div>
                          </AlertDialog.Content>
                        </AlertDialog.Portal>
                      </AlertDialog.Root>
                    </div>
                  </div>
                ))}

                {/* Inline new tag creation */}
                <div className="pt-2 border-t border-border/50">
                  <input
                    type="text"
                    className="h-7 px-2 border-2 border-border rounded-base bg-background text-xs w-full focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="New tag + Enter"
                    value={newTagInputs[categoryKey] ?? ""}
                    onChange={(e) => setNewTagInputs((prev) => ({ ...prev, [categoryKey]: e.target.value }))}
                    onKeyDown={(e) => handleNewTagKey(categoryKey, e)}
                  />
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Custom tags section */}
        {customTags.length > 0 && (
          <div className="border-2 border-border rounded-base mb-2 overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center justify-between p-3 hover:bg-secondary-background/50 transition-colors"
              onClick={() => toggleCategory("custom")}
            >
              <span className="font-heading text-sm">Custom</span>
              {expandedCategories.has("custom") ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronRight className="size-4" />
              )}
            </button>

            {expandedCategories.has("custom") && (
              <div className="border-t-2 border-border p-3 space-y-2">
                {customTags.map((t) => (
                  <div key={t.tag} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="tag">{getTagLabel(t.tag)}</Badge>
                      <span className="text-xs text-foreground/50 tabular-nums">{t.count}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startRename(t.tag)}
                        className="text-xs text-foreground/50 hover:text-foreground underline"
                      >
                        Rename
                      </button>
                      <AlertDialog.Root
                        open={deletingTag === t.tag}
                        onOpenChange={(open) => setDeletingTag(open ? t.tag : null)}
                      >
                        <AlertDialog.Trigger asChild>
                          <button
                            type="button"
                            className="text-xs text-destructive/70 hover:text-destructive underline"
                          >
                            Delete
                          </button>
                        </AlertDialog.Trigger>
                        <AlertDialog.Portal>
                          <AlertDialog.Overlay className="fixed inset-0 bg-overlay z-50" />
                          <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-secondary-background border-2 border-border rounded-base shadow-shadow p-6 w-full max-w-md">
                            <AlertDialog.Title className="font-heading text-lg mb-2">
                              Delete tag &ldquo;{getTagLabel(t.tag)}&rdquo;?
                            </AlertDialog.Title>
                            <AlertDialog.Description className="text-sm text-foreground/70 mb-4">
                              This tag is used by {t.count} scholarships. It will be removed from all of them.
                            </AlertDialog.Description>
                            <div className="flex justify-end gap-2">
                              <AlertDialog.Cancel asChild>
                                <Button variant="neutral" size="sm">Keep Tag</Button>
                              </AlertDialog.Cancel>
                              <AlertDialog.Action asChild>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteTag(t.tag)}
                                >
                                  Delete Tag
                                </Button>
                              </AlertDialog.Action>
                            </div>
                          </AlertDialog.Content>
                        </AlertDialog.Portal>
                      </AlertDialog.Root>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 2: Pending Suggested Tags */}
      <div>
        <h2 className="text-xl font-heading mb-4" id="suggested-tags-review">
          Pending Suggested Tags
        </h2>

        {scholarshipsWithSuggestions.length === 0 ? (
          <p className="text-sm text-foreground/60">No pending suggested tags to review.</p>
        ) : (
          <div className="border-2 border-border rounded-base overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary-background border-b-2 border-border">
                  <th className="p-3 text-left font-heading">Scholarship</th>
                  <th className="p-3 text-right font-heading">Suggested Tags</th>
                </tr>
              </thead>
              <tbody>
                {scholarshipsWithSuggestions.map((scholarship: any) => (
                  <tr key={scholarship._id} className="border-b border-border last:border-b-0">
                    <td className="p-3" colSpan={expandedScholarshipId === scholarship._id ? 2 : 1}>
                      <button
                        type="button"
                        className="text-left font-heading text-sm hover:underline w-full"
                        onClick={() =>
                          setExpandedScholarshipId((prev) =>
                            prev === scholarship._id ? null : scholarship._id,
                          )
                        }
                      >
                        {expandedScholarshipId === scholarship._id ? (
                          <ChevronDown className="size-3.5 inline mr-1" />
                        ) : (
                          <ChevronRight className="size-3.5 inline mr-1" />
                        )}
                        {scholarship.title}
                      </button>

                      {expandedScholarshipId === scholarship._id && (
                        <div className="mt-3 pl-5">
                          <SuggestedTagReview
                            scholarshipId={scholarship._id}
                            suggestedTags={scholarship.suggested_tags}
                          />
                        </div>
                      )}
                    </td>
                    {expandedScholarshipId !== scholarship._id && (
                      <td className="p-3 text-right tabular-nums">
                        {scholarship.suggested_tags?.length ?? 0}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 3: Filter-Then-Tag Bulk Interface */}
      <div>
        <h2 className="text-xl font-heading mb-4">Bulk Tagging</h2>

        {/* Tag selection */}
        <div className="mb-4">
          <span className="text-xs font-heading uppercase tracking-wide block mb-2">Tags to Apply</span>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {ALL_TAGS.slice(0, 15).map((tag) => (
              <label
                key={tag.id}
                className="flex items-center gap-1.5 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedBulkTags.includes(tag.id)}
                  onChange={() => toggleBulkTag(tag.id)}
                  className="size-3.5 accent-main"
                />
                <span className="text-xs">{tag.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Search + filter controls */}
        <div className="flex items-center gap-3 mb-4">
          <input
            type="text"
            className="h-10 px-3 border-2 border-border rounded-base bg-background text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Search scholarships..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <label className="flex items-center gap-2 text-sm cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={showUntaggedOnly}
              onChange={(e) => setShowUntaggedOnly(e.target.checked)}
              className="size-4 accent-main"
            />
            Show only untagged
          </label>
        </div>

        {/* Results */}
        <div className="border-2 border-border rounded-base overflow-hidden max-h-[400px] overflow-y-auto">
          {filteredScholarships.length === 0 ? (
            <div className="p-4 text-sm text-foreground/60 text-center">
              No scholarships match the current filter.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-secondary-background">
                <tr className="border-b-2 border-border">
                  <th className="p-2 text-left w-8">
                    <input
                      type="checkbox"
                      checked={selectedScholarshipIds.size === filteredScholarships.length && filteredScholarships.length > 0}
                      onChange={() => {
                        if (selectedScholarshipIds.size === filteredScholarships.length) {
                          setSelectedScholarshipIds(new Set());
                        } else {
                          setSelectedScholarshipIds(new Set(filteredScholarships.map((s: any) => s._id)));
                        }
                      }}
                      className="size-3.5 accent-main"
                      aria-label="Select all"
                    />
                  </th>
                  <th className="p-2 text-left font-heading">Scholarship</th>
                  <th className="p-2 text-left font-heading">Tags</th>
                </tr>
              </thead>
              <tbody>
                {filteredScholarships.map((scholarship: any) => (
                  <tr
                    key={scholarship._id}
                    className="border-b border-border last:border-b-0 hover:bg-secondary-background/50"
                  >
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={selectedScholarshipIds.has(scholarship._id)}
                        onChange={() => toggleScholarshipSelect(scholarship._id)}
                        className="size-3.5 accent-main"
                      />
                    </td>
                    <td className="p-2 truncate max-w-[300px]">{scholarship.title}</td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-1">
                        {(scholarship.tags ?? []).map((tag: string) => (
                          <Badge key={tag} variant="tag" className="text-[10px] px-1.5 py-0">
                            {getTagLabel(tag)}
                          </Badge>
                        ))}
                        {(!scholarship.tags || scholarship.tags.length === 0) && (
                          <span className="text-xs text-foreground/40">No tags</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Apply button */}
        {selectedBulkTags.length > 0 && selectedScholarshipIds.size > 0 && (
          <div className="mt-3">
            <Button
              variant="default"
              onClick={handleBulkApplyTags}
              disabled={bulkApplying}
            >
              {bulkApplying
                ? "Applying..."
                : `Apply ${selectedBulkTags.length} tag${selectedBulkTags.length > 1 ? "s" : ""} to ${selectedScholarshipIds.size} scholarship${selectedScholarshipIds.size > 1 ? "s" : ""}`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
