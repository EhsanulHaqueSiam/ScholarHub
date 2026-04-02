import { useState, useEffect, useCallback } from "react";
import type { StorageError } from "@/lib/storage/types";
import { isQuotaExceededError, isSecurityError } from "@/lib/storage/errors";

/**
 * Generic hook that reads/writes a value to localStorage with a key.
 * Returns [value, setValue, error] — a 3-element tuple.
 *
 * - Existing [val, setVal] destructuring still works (third element ignored).
 * - `error` is null on success, or a StorageError string on write failure.
 * - Cross-tab sync: updates when another tab writes to the same key.
 * - SSR-safe: returns defaultValue with null error when window is undefined.
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
): [T, (value: T | ((prev: T) => T)) => void, StorageError | null] {
  const [value, setValueState] = useState<T>(() => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const [error, setError] = useState<StorageError | null>(null);

  // Persist to localStorage whenever value changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
      setError(null);
    } catch (err) {
      if (isQuotaExceededError(err)) {
        setError("quota_exceeded");
      } else if (isSecurityError(err)) {
        setError("security_error");
      } else {
        setError("not_supported");
      }
    }
  }, [key, value]);

  // Cross-tab sync via storage events
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = (e: StorageEvent) => {
      // Handle clear() from another tab — key is null means full cache invalidation
      if (e.key === null) {
        setValueState(defaultValue);
        return;
      }

      if (e.key === key && e.storageArea === localStorage) {
        try {
          setValueState(e.newValue ? JSON.parse(e.newValue) : defaultValue);
        } catch {
          setValueState(defaultValue);
        }
      }
    };

    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [key, defaultValue]);

  const setValue = useCallback(
    (updater: T | ((prev: T) => T)) => {
      setValueState(updater);
    },
    [],
  );

  return [value, setValue, error];
}
