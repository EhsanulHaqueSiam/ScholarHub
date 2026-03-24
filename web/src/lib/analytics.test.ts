import { describe, it, expect, vi, beforeEach } from "vitest";
import { analytics } from "./analytics";
import type { AnalyticsProvider, EventName } from "./analytics";

describe("analytics", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("implements AnalyticsProvider interface", () => {
    const provider: AnalyticsProvider = analytics;
    expect(typeof provider.track).toBe("function");
    expect(typeof provider.identify).toBe("function");
  });

  it("track() logs to console in dev mode", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    analytics.track("wizard_started", { step: 1 });
    expect(spy).toHaveBeenCalledWith(
      "[Analytics] wizard_started",
      { step: 1 },
    );
  });

  it("identify() logs to console in dev mode", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    analytics.identify("user-123", { name: "Test" });
    expect(spy).toHaveBeenCalledWith(
      "[Analytics] identify",
      "user-123",
      { name: "Test" },
    );
  });

  it("fires for all 7 event names without errors", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const events: EventName[] = [
      "wizard_started",
      "step_completed",
      "wizard_completed",
      "results_viewed",
      "scholarship_clicked_from_results",
      "profile_edited",
      "profile_cleared",
    ];
    for (const event of events) {
      expect(() => analytics.track(event, {})).not.toThrow();
    }
    expect(spy).toHaveBeenCalledTimes(events.length);
  });
});
