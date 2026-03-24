import { describe, it, expect, beforeEach } from "vitest";
import { LocalStorageProfileAdapter, profileStorage } from "./profile-storage";
import type { StudentProfile } from "./types";

const makeProfile = (
  overrides?: Partial<StudentProfile>,
): StudentProfile => ({
  nationalities: ["BD"],
  degreeLevel: "master",
  fieldsOfStudy: ["Computer Science"],
  createdAt: 1000,
  updatedAt: 1000,
  ...overrides,
});

describe("LocalStorageProfileAdapter", () => {
  let adapter: LocalStorageProfileAdapter;

  beforeEach(() => {
    localStorage.clear();
    adapter = new LocalStorageProfileAdapter();
  });

  it("getProfile() returns null when no profile saved", () => {
    expect(adapter.getProfile()).toBeNull();
  });

  it("saveProfile() then getProfile() returns the saved profile", () => {
    const profile = makeProfile();
    adapter.saveProfile(profile);
    const loaded = adapter.getProfile();
    expect(loaded).toEqual(profile);
  });

  it("clearProfile() removes saved profile", () => {
    adapter.saveProfile(makeProfile());
    expect(adapter.getProfile()).not.toBeNull();
    adapter.clearProfile();
    expect(adapter.getProfile()).toBeNull();
  });

  it("hasProfile() returns false initially, true after save, false after clear", () => {
    expect(adapter.hasProfile()).toBe(false);
    adapter.saveProfile(makeProfile());
    expect(adapter.hasProfile()).toBe(true);
    adapter.clearProfile();
    expect(adapter.hasProfile()).toBe(false);
  });

  it("handles corrupted localStorage gracefully", () => {
    localStorage.setItem("scholarhub_student_profile", "not-valid-json{{{");
    expect(adapter.getProfile()).toBeNull();
  });
});

describe("profileStorage singleton", () => {
  it("is an instance of LocalStorageProfileAdapter", () => {
    expect(profileStorage).toBeInstanceOf(LocalStorageProfileAdapter);
  });
});
