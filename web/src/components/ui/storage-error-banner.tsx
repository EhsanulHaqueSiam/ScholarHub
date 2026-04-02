import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import type { StorageError } from "@/lib/storage/types";

const ERROR_MESSAGES: Record<StorageError, string> = {
  quota_exceeded:
    "Your browser storage is full. Some data may not be saved. Try clearing old data or using a different browser.",
  security_error:
    "Storage access is blocked. This may happen in private browsing mode. Your data will not persist.",
  not_supported:
    "Your browser does not support local storage. Your data will not persist between sessions.",
};

interface StorageErrorBannerProps {
  error: StorageError;
  onDismiss?: () => void;
}

export function StorageErrorBanner({ error, onDismiss }: StorageErrorBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      role="alert"
      className="border-3 border-border bg-[var(--accent-pink)] text-accent-foreground px-4 py-3 flex items-start gap-3 shadow-shadow"
    >
      <AlertTriangle className="size-5 shrink-0 mt-0.5" />
      <p className="text-sm font-base flex-1">{ERROR_MESSAGES[error]}</p>
      <button
        onClick={() => {
          setDismissed(true);
          onDismiss?.();
        }}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss storage error"
        type="button"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
