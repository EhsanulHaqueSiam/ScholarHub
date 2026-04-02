export type StorageError = "quota_exceeded" | "security_error" | "not_supported";

export type StorageWriteResult =
  | { success: true }
  | { success: false; error: StorageError };

export interface StorageAdapter<T> {
  load(): T | null;
  save(data: T): StorageWriteResult;
  clear(): void;
  has(): boolean;
}

export interface VersionedData {
  _version: number;
}

export type MigrationFn = (old: Record<string, unknown>) => Record<string, unknown>;

export interface MigrationConfig {
  currentVersion: number;
  migrations: Record<number, MigrationFn>;
}
