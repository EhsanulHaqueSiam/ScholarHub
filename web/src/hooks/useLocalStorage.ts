import { useState, useEffect } from "react";

/**
 * Generic hook that reads/writes a value to localStorage with a key.
 * Returns [value, setValue] like useState.
 * Handles SSR (returns default on server where localStorage doesn't exist).
 * Uses JSON.parse/JSON.stringify for serialization.
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // localStorage full or disabled
    }
  }, [key, value]);

  return [value, setValue];
}
