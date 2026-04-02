import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  LocalStorageProfileAdapter,
  profileStorage,
  PROFILE_VERSION,
} from "./profile-storage";
import type { StudentProfile } from "./types";

const STORAGE_KEY = "scholarhub_student_profile";

function makeProfile(overrides?: Partial<StudentProfile>): StudentProfile {
  return {
    nationalities: ["BD"],
    degreeLevel: "master",
    fieldsOfStudy: ["Computer Science"],
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  };
}

describe("LocalStorageProfileAdapter", () => {
  let adapter: LocalStorageProfileAdapter;

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    adapter = new LocalStorageProfileAdapter();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("getProfile", () => {
    it("returns null when storage is empty", () => {
      expect(adapter.getProfile()).toBeNull();
    });

    it("returns profile when valid JSON exists", () => {
      const profile = makeProfile();
      const stored = { ...profile, _version: PROFILE_VERSION };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

      const result = adapter.getProfile();
      expect(result).not.toBeNull();
      expect(result!.nationalities).toEqual(["BD"]);
      expect(result!.degreeLevel).toBe("master");
    });

    it("adds _version: 1 to unversioned stored data (lazy migration)", () => {
      // Store data WITHOUT _version (simulating pre-migration data)
      const profile = makeProfile();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));

      const result = adapter.getProfile();
      expect(result).not.toBeNull();
      expect((result as any)._version).toBe(1);

      // Verify the migrated data was written back to localStorage
      const storedAfter = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(storedAfter._version).toBe(1);
    });

    it("returns data as-is when _version already equals current", () => {
      const profile = makeProfile();
      const stored = { ...profile, _version: PROFILE_VERSION };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

      const result = adapter.getProfile();
      expect(result).not.toBeNull();
      expect((result as any)._version).toBe(PROFILE_VERSION);
    });

    it("returns null for corrupted JSON", () => {
      localStorage.setItem(STORAGE_KEY, "not-valid-json{");
      expect(adapter.getProfile()).toBeNull();
    });
  });

  describe("saveProfile", () => {
    it("stores data with _version: 1 field", () => {
      const profile = makeProfile();
      adapter.saveProfile(profile);

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored._version).toBe(PROFILE_VERSION);
      expect(stored.nationalities).toEqual(["BD"]);
    });

    it("returns { success: true } on success", () => {
      const profile = makeProfile();
      const result = adapter.saveProfile(profile);
      expect(result).toEqual({ success: true });
    });

    it('returns { success: false, error: "quota_exceeded" } when storage is full', () => {
      const quotaError = new DOMException(
        "Quota exceeded",
        "QuotaExceededError",
      );
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw quotaError;
      });

      const profile = makeProfile();
      const result = adapter.saveProfile(profile);
      expect(result).toEqual({ success: false, error: "quota_exceeded" });
    });

    it('returns { success: false, error: "security_error" } when storage is blocked', () => {
      const securityError = new DOMException(
        "Security error",
        "SecurityError",
      );
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw securityError;
      });

      const profile = makeProfile();
      const result = adapter.saveProfile(profile);
      expect(result).toEqual({ success: false, error: "security_error" });
    });

    it("saveProfile then getProfile round-trips correctly", () => {
      const profile = makeProfile();
      adapter.saveProfile(profile);
      const loaded = adapter.getProfile();
      expect(loaded).not.toBeNull();
      expect(loaded!.nationalities).toEqual(["BD"]);
      expect(loaded!.degreeLevel).toBe("master");
      expect(loaded!.fieldsOfStudy).toEqual(["Computer Science"]);
    });
  });

  describe("hasProfile", () => {
    it("returns false when storage is empty", () => {
      expect(adapter.hasProfile()).toBe(false);
    });

    it("returns true when profile exists", () => {
      adapter.saveProfile(makeProfile());
      expect(adapter.hasProfile()).toBe(true);
    });
  });

  describe("clearProfile", () => {
    it("removes the profile from storage", () => {
      adapter.saveProfile(makeProfile());
      expect(adapter.hasProfile()).toBe(true);

      adapter.clearProfile();
      expect(adapter.hasProfile()).toBe(false);
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });
});

describe("profileStorage singleton", () => {
  it("is an instance of LocalStorageProfileAdapter", () => {
    expect(profileStorage).toBeInstanceOf(LocalStorageProfileAdapter);
  });
});
