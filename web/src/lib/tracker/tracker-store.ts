import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { TrackerEntry, TrackerStage } from "./types";
import type { StorageError } from "@/lib/storage/types";

interface TrackerState {
  entries: TrackerEntry[];
  storageError: StorageError | null;

  addEntry: (slug: string, title: string) => void;
  removeEntry: (slug: string) => void;
  moveToStage: (slug: string, stage: TrackerStage) => void;
  updateNotes: (slug: string, notes: string) => void;
  toggleDocument: (slug: string, docType: string, checked: boolean) => void;
  isTracked: (slug: string) => boolean;
  getEntry: (slug: string) => TrackerEntry | undefined;
  clearAll: () => void;
}

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const useTrackerStore = create<TrackerState>()(
  persist(
    (set, get) => ({
      entries: [],
      storageError: null,

      addEntry: (slug: string, title: string) => {
        if (get().isTracked(slug)) return;
        const now = Date.now();
        const entry: TrackerEntry = {
          scholarshipSlug: slug,
          scholarshipTitle: title,
          stage: "researching",
          addedAt: now,
          updatedAt: now,
          documentChecks: {},
        };
        set((state) => ({ entries: [...state.entries, entry] }));
      },

      removeEntry: (slug: string) => {
        set((state) => ({
          entries: state.entries.filter((e) => e.scholarshipSlug !== slug),
        }));
      },

      moveToStage: (slug: string, stage: TrackerStage) => {
        set((state) => ({
          entries: state.entries.map((e) =>
            e.scholarshipSlug === slug
              ? { ...e, stage, updatedAt: Date.now() }
              : e
          ),
        }));
      },

      updateNotes: (slug: string, notes: string) => {
        const truncated = notes.slice(0, 500);
        set((state) => ({
          entries: state.entries.map((e) =>
            e.scholarshipSlug === slug
              ? { ...e, notes: truncated, updatedAt: Date.now() }
              : e
          ),
        }));
      },

      toggleDocument: (slug: string, docType: string, checked: boolean) => {
        set((state) => ({
          entries: state.entries.map((e) =>
            e.scholarshipSlug === slug
              ? {
                  ...e,
                  documentChecks: { ...e.documentChecks, [docType]: checked },
                  updatedAt: Date.now(),
                }
              : e
          ),
        }));
      },

      isTracked: (slug: string) => {
        return get().entries.some((e) => e.scholarshipSlug === slug);
      },

      getEntry: (slug: string) => {
        return get().entries.find((e) => e.scholarshipSlug === slug);
      },

      clearAll: () => {
        set({ entries: [] });
      },
    }),
    {
      name: "scholarhub_tracker",
      version: 1,
      skipHydration: true,
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : noopStorage
      ),
      migrate: (persistedState, version) => {
        // Version 1: initial schema, no migrations needed
        if (version === 0) {
          return persistedState as TrackerState;
        }
        return persistedState as TrackerState;
      },
      onRehydrateStorage: () => {
        return (_state, error) => {
          if (error) {
            useTrackerStore.setState({ storageError: "not_supported" });
          }
        };
      },
    }
  )
);
