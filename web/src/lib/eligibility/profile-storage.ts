import type { StudentProfile } from "./types";

const STORAGE_KEY = "scholarhub_student_profile";

/**
 * Interface for profile persistence.
 * Designed for easy swapping: localStorage now, Convex+Clerk later.
 */
export interface ProfileStorage {
  getProfile(): StudentProfile | null;
  saveProfile(profile: StudentProfile): void;
  clearProfile(): void;
  hasProfile(): boolean;
}

/**
 * localStorage-based profile adapter with SSR safety.
 * Returns null when window is undefined (server-side rendering).
 * Handles corrupted data gracefully via try/catch.
 */
export class LocalStorageProfileAdapter implements ProfileStorage {
  getProfile(): StudentProfile | null {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      return JSON.parse(stored) as StudentProfile;
    } catch {
      return null;
    }
  }

  saveProfile(profile: StudentProfile): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // localStorage full or disabled -- silently fail
    }
  }

  clearProfile(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage disabled -- silently fail
    }
  }

  hasProfile(): boolean {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(STORAGE_KEY) !== null;
    } catch {
      return false;
    }
  }
}

/** Singleton profile storage instance */
export const profileStorage: ProfileStorage = new LocalStorageProfileAdapter();
