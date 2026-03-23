import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQuery } from "convex/react";
import { X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { CollectionEditForm } from "./CollectionEditForm";

const STATUS_BADGE_MAP = {
  draft: "neutral",
  active: "urgencyOpen",
  archived: "urgencyClosed",
} as const;

/**
 * CollectionsManager: Admin tab for CRUD management of curated collections.
 * Table list with inline sort order editing, bulk archive/activate, and slide-out edit form.
 * D-81, D-82
 */
export function CollectionsManager() {
  const collections = useQuery(api.collections.getAdminCollections);
  const updateCollection = useMutation(api.collections.updateCollection);
  const deleteCollection = useMutation(api.collections.deleteCollection);
  const bulkUpdateStatus = useMutation(api.collections.bulkUpdateCollectionStatus);

  const [editingCollection, setEditingCollection] = useState<Id<"collections"> | "new" | null>(
    null,
  );
  const [selectedIds, setSelectedIds] = useState<Set<Id<"collections">>>(new Set());
  const [deletingId, setDeletingId] = useState<Id<"collections"> | null>(null);
  const [archivingId, setArchivingId] = useState<Id<"collections"> | null>(null);
  const [bulkAction, setBulkAction] = useState<"archive" | "activate" | null>(null);

  if (!collections) {
    return (
      <div className="text-foreground/60 text-sm py-8 text-center">Loading collections...</div>
    );
  }

  const editingDoc =
    editingCollection && editingCollection !== "new"
      ? (collections.find((c) => c._id === editingCollection) ?? undefined)
      : undefined;

  function toggleSelect(id: Id<"collections">) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === collections!.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(collections!.map((c) => c._id)));
    }
  }

  async function handleSortOrderChange(collectionId: Id<"collections">, value: string) {
    const sortOrder = Number.parseInt(value, 10) || 0;
    await updateCollection({
      collectionId,
      updates: { sort_order: Math.max(0, Math.min(999, sortOrder)) },
    });
  }

  async function handleArchive(id: Id<"collections">) {
    await updateCollection({ collectionId: id, updates: { status: "archived" } });
    setArchivingId(null);
  }

  async function handleActivate(id: Id<"collections">) {
    await updateCollection({ collectionId: id, updates: { status: "active" } });
  }

  async function handleDelete(id: Id<"collections">) {
    await deleteCollection({ collectionId: id });
    setDeletingId(null);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  async function handleBulkAction(action: "archive" | "activate") {
    await bulkUpdateStatus({
      collectionIds: Array.from(selectedIds),
      status: action === "archive" ? "archived" : "active",
    });
    setSelectedIds(new Set());
    setBulkAction(null);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-heading">Collections</h2>
        <Button variant="default" onClick={() => setEditingCollection("new")}>
          New Collection
        </Button>
      </div>

      {/* Table */}
      {collections.length === 0 ? (
        <div className="text-center py-12 text-foreground/60 text-sm">
          No collections yet. Create your first collection to get started.
        </div>
      ) : (
        <div className="border-2 border-border rounded-base overflow-hidden shadow-shadow">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-main text-main-foreground border-b-2 border-border">
                <th className="p-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === collections.length && collections.length > 0}
                    onChange={toggleSelectAll}
                    className="size-4"
                    aria-label="Select all collections"
                  />
                </th>
                <th className="p-3 text-left font-heading font-bold uppercase text-sm tracking-wide">
                  Name
                </th>
                <th className="p-3 text-left font-heading font-bold uppercase text-sm tracking-wide">
                  Status
                </th>
                <th className="p-3 text-right font-heading font-bold uppercase text-sm tracking-wide">
                  Scholarships
                </th>
                <th className="p-3 text-left font-heading font-bold uppercase text-sm tracking-wide w-24">
                  Sort Order
                </th>
                <th className="p-3 text-right font-heading font-bold uppercase text-sm tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {collections.map((collection) => (
                <tr
                  key={collection._id}
                  className="border-b border-border last:border-b-0 hover:bg-secondary-background/50 transition-colors"
                >
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(collection._id)}
                      onChange={() => toggleSelect(collection._id)}
                      className="size-4 accent-main"
                      aria-label={`Select ${collection.name}`}
                    />
                  </td>
                  <td className="p-3">
                    <span className="font-heading">
                      {collection.emoji} {collection.name}
                    </span>
                    {collection.is_featured && (
                      <Badge variant="default" className="ml-2 text-[10px]">
                        Featured
                      </Badge>
                    )}
                  </td>
                  <td className="p-3">
                    <Badge
                      variant={
                        STATUS_BADGE_MAP[collection.status as keyof typeof STATUS_BADGE_MAP] ??
                        "neutral"
                      }
                    >
                      {collection.status}
                    </Badge>
                  </td>
                  <td className="p-3 text-right tabular-nums">{collection.scholarship_count}</td>
                  <td className="p-3">
                    <input
                      type="number"
                      min={0}
                      max={999}
                      className="w-16 border-2 border-border rounded-base px-2 py-1 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      defaultValue={collection.sort_order}
                      onBlur={(e) => handleSortOrderChange(collection._id, e.target.value)}
                      aria-label={`Sort order for ${collection.name}`}
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="neutral"
                        size="sm"
                        onClick={() => setEditingCollection(collection._id)}
                      >
                        Edit
                      </Button>

                      {collection.status === "archived" ? (
                        <Button
                          variant="neutral"
                          size="sm"
                          onClick={() => handleActivate(collection._id)}
                        >
                          Activate
                        </Button>
                      ) : (
                        <AlertDialog.Root
                          open={archivingId === collection._id}
                          onOpenChange={(open) => setArchivingId(open ? collection._id : null)}
                        >
                          <AlertDialog.Trigger asChild>
                            <Button variant="neutral" size="sm">
                              Archive
                            </Button>
                          </AlertDialog.Trigger>
                          <AlertDialog.Portal>
                            <AlertDialog.Overlay className="fixed inset-0 bg-overlay z-50" />
                            <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-secondary-background border-2 border-border rounded-base shadow-shadow p-6 w-full max-w-md">
                              <AlertDialog.Title className="font-heading text-lg mb-2">
                                Archive collection?
                              </AlertDialog.Title>
                              <AlertDialog.Description className="text-sm text-foreground/70 mb-4">
                                Archive this collection? It will be hidden from public view but can
                                be reactivated later.
                              </AlertDialog.Description>
                              <div className="flex justify-end gap-2">
                                <AlertDialog.Cancel asChild>
                                  <Button variant="neutral" size="sm">
                                    Keep Collection
                                  </Button>
                                </AlertDialog.Cancel>
                                <AlertDialog.Action asChild>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleArchive(collection._id)}
                                  >
                                    Archive Collection
                                  </Button>
                                </AlertDialog.Action>
                              </div>
                            </AlertDialog.Content>
                          </AlertDialog.Portal>
                        </AlertDialog.Root>
                      )}

                      <a
                        href={`/collections/${collection.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-foreground/60 hover:text-foreground underline"
                      >
                        Preview
                      </a>

                      <AlertDialog.Root
                        open={deletingId === collection._id}
                        onOpenChange={(open) => setDeletingId(open ? collection._id : null)}
                      >
                        <AlertDialog.Trigger asChild>
                          <Button variant="destructive" size="sm">
                            Delete
                          </Button>
                        </AlertDialog.Trigger>
                        <AlertDialog.Portal>
                          <AlertDialog.Overlay className="fixed inset-0 bg-overlay z-50" />
                          <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-secondary-background border-2 border-border rounded-base shadow-shadow p-6 w-full max-w-md">
                            <AlertDialog.Title className="font-heading text-lg mb-2">
                              Delete collection?
                            </AlertDialog.Title>
                            <AlertDialog.Description className="text-sm text-foreground/70 mb-4">
                              This will permanently delete &ldquo;{collection.name}&rdquo;. This
                              action cannot be undone.
                            </AlertDialog.Description>
                            <div className="flex justify-end gap-2">
                              <AlertDialog.Cancel asChild>
                                <Button variant="neutral" size="sm">
                                  Keep Collection
                                </Button>
                              </AlertDialog.Cancel>
                              <AlertDialog.Action asChild>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(collection._id)}
                                >
                                  Delete Collection
                                </Button>
                              </AlertDialog.Action>
                            </div>
                          </AlertDialog.Content>
                        </AlertDialog.Portal>
                      </AlertDialog.Root>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40">
          <div className="max-w-[1280px] mx-auto bg-foreground text-background border-t-4 border-border shadow-[0_-6px_0_0_var(--border)] h-16 flex items-center justify-between py-2 px-6">
            <span className="text-sm">
              {selectedIds.size} collection{selectedIds.size > 1 ? "s" : ""} selected
            </span>
            <div className="flex items-center gap-2">
              <AlertDialog.Root
                open={bulkAction === "activate"}
                onOpenChange={(open) => setBulkAction(open ? "activate" : null)}
              >
                <AlertDialog.Trigger asChild>
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-main text-main-foreground border-background/30"
                  >
                    Activate Selected
                  </Button>
                </AlertDialog.Trigger>
                <AlertDialog.Portal>
                  <AlertDialog.Overlay className="fixed inset-0 bg-overlay z-50" />
                  <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-secondary-background border-2 border-border rounded-base shadow-shadow p-6 w-full max-w-md">
                    <AlertDialog.Title className="font-heading text-lg mb-2">
                      Activate {selectedIds.size} collection{selectedIds.size > 1 ? "s" : ""}?
                    </AlertDialog.Title>
                    <AlertDialog.Description className="text-sm text-foreground/70 mb-4">
                      These collections will become visible to students.
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
                          onClick={() => handleBulkAction("activate")}
                        >
                          Activate All
                        </Button>
                      </AlertDialog.Action>
                    </div>
                  </AlertDialog.Content>
                </AlertDialog.Portal>
              </AlertDialog.Root>

              <AlertDialog.Root
                open={bulkAction === "archive"}
                onOpenChange={(open) => setBulkAction(open ? "archive" : null)}
              >
                <AlertDialog.Trigger asChild>
                  <Button variant="destructive" size="sm">
                    Archive Selected
                  </Button>
                </AlertDialog.Trigger>
                <AlertDialog.Portal>
                  <AlertDialog.Overlay className="fixed inset-0 bg-overlay z-50" />
                  <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-secondary-background border-2 border-border rounded-base shadow-shadow p-6 w-full max-w-md">
                    <AlertDialog.Title className="font-heading text-lg mb-2">
                      Archive {selectedIds.size} collection{selectedIds.size > 1 ? "s" : ""}?
                    </AlertDialog.Title>
                    <AlertDialog.Description className="text-sm text-foreground/70 mb-4">
                      These collections will be hidden from public view but can be reactivated
                      later.
                    </AlertDialog.Description>
                    <div className="flex justify-end gap-2">
                      <AlertDialog.Cancel asChild>
                        <Button variant="neutral" size="sm">
                          Keep All
                        </Button>
                      </AlertDialog.Cancel>
                      <AlertDialog.Action asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleBulkAction("archive")}
                        >
                          Archive All
                        </Button>
                      </AlertDialog.Action>
                    </div>
                  </AlertDialog.Content>
                </AlertDialog.Portal>
              </AlertDialog.Root>

              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="text-background/70 hover:text-background underline text-sm transition-colors"
              >
                Clear selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit form slide-out */}
      <Dialog.Root
        open={editingCollection !== null}
        onOpenChange={(open) => {
          if (!open) setEditingCollection(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content
            className="fixed inset-y-0 right-0 z-50 w-[40%] min-w-[480px] max-w-[640px] bg-secondary-background border-l-2 border-border shadow-[-4px_4px_0_0_var(--border)] flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right duration-300"
            aria-label={editingCollection === "new" ? "Create collection" : "Edit collection"}
          >
            {/* Sticky header */}
            <div className="flex items-center justify-between p-6 border-b-2 border-border bg-secondary-background sticky top-0 z-10">
              <Dialog.Title className="text-xl font-heading">
                {editingCollection === "new" ? "New Collection" : "Edit Collection"}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="p-2 rounded-base hover:bg-background"
                  aria-label="Close panel"
                >
                  <X className="size-5" />
                </button>
              </Dialog.Close>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto p-6">
              <CollectionEditForm
                collection={editingDoc}
                onSave={() => setEditingCollection(null)}
                onCancel={() => setEditingCollection(null)}
              />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
