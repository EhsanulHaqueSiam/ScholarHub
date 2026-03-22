import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useCallback, useRef } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import { EditForm } from "./EditForm";
import { RevisionHistory } from "./RevisionHistory";

interface EditPanelProps {
  open: boolean;
  scholarshipId: Id<"scholarships"> | null;
  scholarshipTitle: string;
  onClose: () => void;
}

/**
 * EditPanel: Right slide-out sheet for editing a scholarship.
 * Uses Radix Dialog as a Sheet pattern per D-10 and UI-SPEC.
 * Width: 40% viewport, min 480px, max 640px.
 */
export function EditPanel({
  open,
  scholarshipId,
  scholarshipTitle,
  onClose,
}: EditPanelProps) {
  const isDirtyRef = useRef(false);
  const confirmingRef = useRef(false);

  const handleDirtyChange = useCallback((dirty: boolean) => {
    isDirtyRef.current = dirty;
  }, []);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        if (isDirtyRef.current && !confirmingRef.current) {
          confirmingRef.current = true;
          const discard = window.confirm(
            "You have unsaved changes. Discard and close?"
          );
          confirmingRef.current = false;
          if (!discard) return;
        }
        onClose();
      }
    },
    [onClose]
  );

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed inset-y-0 right-0 z-50 w-[40%] min-w-[480px] max-w-[640px] bg-secondary-background border-l-2 border-border shadow-[-4px_4px_0_0_var(--border)] flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right duration-300"
          aria-label={`Edit ${scholarshipTitle}`}
        >
          {/* Sticky header */}
          <div className="flex items-center justify-between p-6 border-b-2 border-border bg-secondary-background sticky top-0 z-10">
            <Dialog.Title className="text-xl font-heading">
              Edit Scholarship
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
            {scholarshipId && (
              <EditForm
                scholarshipId={scholarshipId}
                onSaved={onClose}
                onDirtyChange={handleDirtyChange}
              />
            )}
            {scholarshipId && (
              <RevisionHistory scholarshipId={scholarshipId} />
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
