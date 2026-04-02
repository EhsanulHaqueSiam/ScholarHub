import { describe, expect, it } from "vitest";
import { migrateData } from "./migrate";
import type { MigrationConfig, VersionedData } from "./types";

interface TestDataV3 extends VersionedData {
  name: string;
  email: string;
  role: string;
}

const threeStepConfig: MigrationConfig = {
  currentVersion: 3,
  migrations: {
    1: (old) => ({ ...old, name: old.name ?? "unknown" }),
    2: (old) => ({ ...old, email: `${old.name}@example.com` }),
    3: (old) => ({ ...old, role: "user" }),
  },
};

describe("migrateData", () => {
  it("runs sequential migrations from version 1 to version 3", () => {
    const input = { _version: 1, name: "Alice" };
    const result = migrateData<TestDataV3>(input, threeStepConfig);

    expect(result).not.toBeNull();
    expect(result!._version).toBe(3);
    expect(result!.name).toBe("Alice");
    expect(result!.email).toBe("Alice@example.com");
    expect(result!.role).toBe("user");
  });

  it("returns data unchanged when version matches currentVersion", () => {
    const input = { _version: 3, name: "Bob", email: "bob@test.com", role: "admin" };
    const result = migrateData<TestDataV3>(input, threeStepConfig);

    expect(result).toEqual(input);
  });

  it("returns null for null input", () => {
    expect(migrateData(null, threeStepConfig)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(migrateData(undefined, threeStepConfig)).toBeNull();
  });

  it("returns null for non-object input (string)", () => {
    expect(migrateData("invalid", threeStepConfig)).toBeNull();
  });

  it("returns null for non-object input (number)", () => {
    expect(migrateData(42, threeStepConfig)).toBeNull();
  });

  it("returns null for array input", () => {
    expect(migrateData([1, 2, 3], threeStepConfig)).toBeNull();
  });

  it("treats missing _version field as version 0 and runs all migrations", () => {
    const input = { name: "Charlie" };
    const config: MigrationConfig = {
      currentVersion: 2,
      migrations: {
        1: (old) => ({ ...old, added: true }),
        2: (old) => ({ ...old, finished: true }),
      },
    };
    const result = migrateData(input, config);

    expect(result).not.toBeNull();
    expect(result!._version).toBe(2);
    expect((result as Record<string, unknown>).added).toBe(true);
    expect((result as Record<string, unknown>).finished).toBe(true);
  });

  it("returns null when an intermediate migration is missing", () => {
    const config: MigrationConfig = {
      currentVersion: 3,
      migrations: {
        1: (old) => ({ ...old }),
        // migration 2 is missing!
        3: (old) => ({ ...old }),
      },
    };
    const input = { _version: 0, name: "Test" };
    expect(migrateData(input, config)).toBeNull();
  });

  it("sets _version to currentVersion on the output", () => {
    const config: MigrationConfig = {
      currentVersion: 2,
      migrations: {
        1: (old) => ({ ...old }),
        2: (old) => ({ ...old }),
      },
    };
    const input = { _version: 0 };
    const result = migrateData(input, config);

    expect(result).not.toBeNull();
    expect(result!._version).toBe(2);
  });

  it("returns null when _version is higher than currentVersion (future data)", () => {
    const config: MigrationConfig = {
      currentVersion: 2,
      migrations: {
        1: (old) => ({ ...old }),
        2: (old) => ({ ...old }),
      },
    };
    const input = { _version: 5, data: "future" };
    expect(migrateData(input, config)).toBeNull();
  });

  it("does not mutate the original input object", () => {
    const input = { _version: 1, name: "Original" };
    const original = { ...input };
    migrateData<TestDataV3>(input, threeStepConfig);

    expect(input).toEqual(original);
  });

  it("handles multi-step migration adding fields across 3 versions", () => {
    // v0: { name: "Test" }
    // v1: adds email field
    // v2: adds role field
    // v3: adds active field
    const config: MigrationConfig = {
      currentVersion: 3,
      migrations: {
        1: (old) => ({ ...old, email: "default@test.com" }),
        2: (old) => ({ ...old, role: "viewer" }),
        3: (old) => ({ ...old, active: true }),
      },
    };

    const input = { name: "Test" }; // no _version = treat as 0
    const result = migrateData(input, config);

    expect(result).not.toBeNull();
    expect(result!._version).toBe(3);
    expect((result as Record<string, unknown>).name).toBe("Test");
    expect((result as Record<string, unknown>).email).toBe("default@test.com");
    expect((result as Record<string, unknown>).role).toBe("viewer");
    expect((result as Record<string, unknown>).active).toBe(true);
  });
});
