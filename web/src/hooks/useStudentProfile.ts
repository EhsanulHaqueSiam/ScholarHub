import { useCallback, useEffect, useState } from "react";
import { profileStorage } from "@/lib/eligibility/profile-storage";
import type { StudentProfile } from "@/lib/eligibility/types";

/**
 * Manages student profile state with localStorage persistence (D-29, D-32).
 *
 * SSR-safe: profile is null on the server and during hydration.
 * The `hydrated` flag indicates when the client-side profile has loaded.
 *
 * Designed for the eligibility wizard and results page.
 * The underlying ProfileStorage interface can be swapped to Convex+Clerk later.
 */
export function useStudentProfile() {
  const [profile, setProfileState] = useState<Partial<StudentProfile> | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage on mount (SSR safe)
  useEffect(() => {
    const stored = profileStorage.getProfile();
    if (stored) setProfileState(stored);
    setHydrated(true);
  }, []);

  const updateProfile = useCallback((updates: Partial<StudentProfile>) => {
    setProfileState((prev) => {
      const next = {
        ...prev,
        ...updates,
        updatedAt: Date.now(),
        createdAt: prev?.createdAt ?? Date.now(),
      } as StudentProfile;
      profileStorage.saveProfile(next);
      return next;
    });
  }, []);

  const clearProfile = useCallback(() => {
    profileStorage.clearProfile();
    setProfileState(null);
  }, []);

  const hasExistingProfile = hydrated && profileStorage.hasProfile();

  return {
    profile,
    updateProfile,
    clearProfile,
    hasExistingProfile,
    hydrated,
  };
}
