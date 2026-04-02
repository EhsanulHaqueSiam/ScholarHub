import type { MigrationConfig, VersionedData } from "./types";

/**
 * Migrate stored data from its current version to the latest version
 * by running sequential migration functions.
 *
 * Returns null if:
 * - Input is not a valid object
 * - A required migration function is missing
 * - Data version is higher than current (from newer app version)
 */
export function migrateData<T extends VersionedData>(
  raw: unknown,
  config: MigrationConfig,
): T | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;

  const data = raw as Record<string, unknown>;
  let version = typeof data._version === "number" ? data._version : 0;

  // Future data -- can't downgrade
  if (version > config.currentVersion) return null;

  // Already current -- return as-is
  if (version === config.currentVersion) return data as T;

  let current = { ...data };

  while (version < config.currentVersion) {
    const nextVersion = version + 1;
    const migrateFn = config.migrations[nextVersion];
    if (!migrateFn) {
      // Missing migration -- cannot upgrade safely
      return null;
    }
    current = migrateFn(current);
    current._version = nextVersion;
    version = nextVersion;
  }

  return current as T;
}
