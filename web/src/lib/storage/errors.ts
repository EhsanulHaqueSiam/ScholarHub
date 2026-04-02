import type { StorageError } from "./types";

export function isQuotaExceededError(err: unknown): boolean {
  return (
    err instanceof DOMException &&
    (err.code === 22 ||
      err.code === 1014 ||
      err.name === "QuotaExceededError" ||
      err.name === "NS_ERROR_DOM_QUOTA_REACHED")
  );
}

export function isSecurityError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "SecurityError";
}

export function classifyStorageError(err: unknown): StorageError {
  if (isQuotaExceededError(err)) return "quota_exceeded";
  if (isSecurityError(err)) return "security_error";
  return "not_supported";
}
