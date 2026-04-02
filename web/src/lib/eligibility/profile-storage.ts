import type { StudentProfile } from "./types";
import type {
  VersionedData,
  MigrationConfig,
  StorageWriteResult,
} from "@/lib/storage/types";
import { migrateData } from "@/lib/storage/migrate";
import { isQuotaExceededError, isSecurityError } from "@/lib/storage/errors";

const STORAGE_KEY = "scholarhub_student_profile";

/** Current profile schema version */
export const PROFILE_VERSION = 1;

/** Profile data with version stamp */
export type VersionedStudentProfile = StudentProfile & VersionedData;

/** Migration config: upgrades unversioned (v0) data to v1 by stamping _version */
export const profileMigrations: MigrationConfig = {
  currentVersion: PROFILE_VERSION,
  migrations: {
    1: (old) => ({ ...old, _version: 1 }),
  },
};

/**
 * Interface for profile persistence.
 * Designed for easy swapping: localStorage now, Convex+Clerk later.
 */
export interface ProfileStorage {
  getProfile(): StudentProfile | null;
  saveProfile(profile: StudentProfile): StorageWriteResult;
  clearProfile(): void;
  hasProfile(): boolean;
}

/**
 * localStorage-based profile adapter with SSR safety and versioned migration.
 * Returns null when window is undefined (server-side rendering).
 * Handles corrupted data gracefully via try/catch.
 * Runs migration-on-read to upgrade unversioned profiles.
 */
export class LocalStorageProfileAdapter implements ProfileStorage {
  getProfile(): StudentProfile | null {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const parsed = JSON.parse(stored);

      // Run migration to ensure _version is present
      const migrated = migrateData<VersionedStudentProfile>(
        parsed,
        profileMigrations,
      );
      if (!migrated) return null;

      // Lazy migration: write back migrated data if version was upgraded
      if (
        typeof parsed._version !== "number" ||
        parsed._version < PROFILE_VERSION
      ) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        } catch {
          // Write-back failed -- continue with in-memory migrated data
        }
      }

      return migrated;
    } catch {
      return null;
    }
  }

  saveProfile(profile: StudentProfile): StorageWriteResult {
    if (typeof window === "undefined") return { success: true };
    try {
      const versioned: VersionedStudentProfile = {
        ...profile,
        _version: PROFILE_VERSION,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(versioned));
      return { success: true };
    } catch (err) {
      if (isQuotaExceededError(err)) {
        return { success: false, error: "quota_exceeded" };
      }
      if (isSecurityError(err)) {
        return { success: false, error: "security_error" };
      }
      return { success: false, error: "not_supported" };
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
