export type EventName =
  | "wizard_started"
  | "step_completed"
  | "wizard_completed"
  | "results_viewed"
  | "scholarship_clicked_from_results"
  | "profile_edited"
  | "profile_cleared";

export interface AnalyticsProvider {
  track(event: EventName, properties?: Record<string, unknown>): void;
  identify(userId: string, traits?: Record<string, unknown>): void;
}

/**
 * Console-based analytics provider for development.
 * Logs events to console when running in dev mode.
 * Swap to PostHog later with a one-line change.
 */
class ConsoleAnalytics implements AnalyticsProvider {
  track(event: EventName, properties?: Record<string, unknown>): void {
    if (import.meta.env.DEV) {
      console.log(`[Analytics] ${event}`, properties);
    }
  }

  identify(userId: string, traits?: Record<string, unknown>): void {
    if (import.meta.env.DEV) {
      console.log(`[Analytics] identify`, userId, traits);
    }
  }
}

/** Singleton analytics instance */
export const analytics: AnalyticsProvider = new ConsoleAnalytics();
