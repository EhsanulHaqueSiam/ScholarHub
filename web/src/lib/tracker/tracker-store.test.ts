import { describe, it, expect, beforeEach } from "vitest";
import { useTrackerStore } from "./tracker-store";

describe("useTrackerStore", () => {
  beforeEach(() => {
    useTrackerStore.setState({ entries: [], storageError: null });
  });

  describe("addEntry", () => {
    it("adds entry with stage researching, empty documentChecks, and timestamps", () => {
      const { addEntry } = useTrackerStore.getState();
      addEntry("sch-a", "Scholarship A");

      const { entries } = useTrackerStore.getState();
      expect(entries).toHaveLength(1);
      expect(entries[0]!.scholarshipSlug).toBe("sch-a");
      expect(entries[0]!.scholarshipTitle).toBe("Scholarship A");
      expect(entries[0]!.stage).toBe("researching");
      expect(entries[0]!.documentChecks).toEqual({});
      expect(typeof entries[0]!.addedAt).toBe("number");
      expect(typeof entries[0]!.updatedAt).toBe("number");
    });

    it("does not add duplicate if slug already exists", () => {
      const { addEntry } = useTrackerStore.getState();
      addEntry("sch-a", "Scholarship A");
      addEntry("sch-a", "Scholarship A Duplicate");

      const { entries } = useTrackerStore.getState();
      expect(entries).toHaveLength(1);
      expect(entries[0]!.scholarshipTitle).toBe("Scholarship A");
    });
  });

  describe("removeEntry", () => {
    it("removes the entry by slug", () => {
      const { addEntry } = useTrackerStore.getState();
      addEntry("sch-a", "Scholarship A");
      addEntry("sch-b", "Scholarship B");

      useTrackerStore.getState().removeEntry("sch-a");

      const { entries } = useTrackerStore.getState();
      expect(entries).toHaveLength(1);
      expect(entries[0]!.scholarshipSlug).toBe("sch-b");
    });
  });

  describe("moveToStage", () => {
    it("changes stage and updates updatedAt", () => {
      const { addEntry } = useTrackerStore.getState();
      addEntry("sch-a", "Scholarship A");

      const beforeMove = useTrackerStore.getState().entries[0]!.updatedAt;

      // Small delay to ensure timestamp difference
      useTrackerStore.getState().moveToStage("sch-a", "submitted");

      const { entries } = useTrackerStore.getState();
      expect(entries[0]!.stage).toBe("submitted");
      expect(entries[0]!.updatedAt).toBeGreaterThanOrEqual(beforeMove);
    });
  });

  describe("updateNotes", () => {
    it("sets notes field", () => {
      const { addEntry } = useTrackerStore.getState();
      addEntry("sch-a", "Scholarship A");

      useTrackerStore.getState().updateNotes("sch-a", "my notes");

      const { entries } = useTrackerStore.getState();
      expect(entries[0]!.notes).toBe("my notes");
    });

    it("truncates to 500 characters if longer", () => {
      const { addEntry } = useTrackerStore.getState();
      addEntry("sch-a", "Scholarship A");

      const longNote = "x".repeat(600);
      useTrackerStore.getState().updateNotes("sch-a", longNote);

      const { entries } = useTrackerStore.getState();
      expect(entries[0]!.notes).toHaveLength(500);
    });
  });

  describe("toggleDocument", () => {
    it("sets documentChecks.transcripts = true", () => {
      const { addEntry } = useTrackerStore.getState();
      addEntry("sch-a", "Scholarship A");

      useTrackerStore.getState().toggleDocument("sch-a", "transcripts", true);

      const { entries } = useTrackerStore.getState();
      expect(entries[0]!.documentChecks["transcripts"]).toBe(true);
    });

    it("sets documentChecks.transcripts = false", () => {
      const { addEntry } = useTrackerStore.getState();
      addEntry("sch-a", "Scholarship A");

      useTrackerStore.getState().toggleDocument("sch-a", "transcripts", true);
      useTrackerStore.getState().toggleDocument("sch-a", "transcripts", false);

      const { entries } = useTrackerStore.getState();
      expect(entries[0]!.documentChecks["transcripts"]).toBe(false);
    });
  });

  describe("isTracked", () => {
    it("returns true after addEntry", () => {
      useTrackerStore.getState().addEntry("sch-a", "Scholarship A");
      expect(useTrackerStore.getState().isTracked("sch-a")).toBe(true);
    });

    it("returns false after removeEntry", () => {
      useTrackerStore.getState().addEntry("sch-a", "Scholarship A");
      useTrackerStore.getState().removeEntry("sch-a");
      expect(useTrackerStore.getState().isTracked("sch-a")).toBe(false);
    });

    it("returns false for unknown slug", () => {
      expect(useTrackerStore.getState().isTracked("unknown")).toBe(false);
    });
  });

  describe("getEntry", () => {
    it("returns the entry for a known slug", () => {
      useTrackerStore.getState().addEntry("sch-a", "Scholarship A");
      const entry = useTrackerStore.getState().getEntry("sch-a");
      expect(entry).toBeDefined();
      expect(entry!.scholarshipSlug).toBe("sch-a");
    });

    it("returns undefined for unknown slug", () => {
      const entry = useTrackerStore.getState().getEntry("unknown");
      expect(entry).toBeUndefined();
    });
  });

  describe("clearAll", () => {
    it("empties the entries array", () => {
      useTrackerStore.getState().addEntry("sch-a", "Scholarship A");
      useTrackerStore.getState().addEntry("sch-b", "Scholarship B");

      useTrackerStore.getState().clearAll();

      const { entries } = useTrackerStore.getState();
      expect(entries).toHaveLength(0);
    });
  });

  describe("persist config", () => {
    it("has store name scholarhub_tracker and version 1", () => {
      // Access the persist API to verify config
      const persistApi = (useTrackerStore as unknown as {
        persist: { getOptions: () => { name: string; version: number } };
      }).persist;
      const options = persistApi.getOptions();
      expect(options.name).toBe("scholarhub_tracker");
      expect(options.version).toBe(1);
    });
  });
});
