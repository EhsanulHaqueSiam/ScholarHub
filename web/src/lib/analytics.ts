/**
 * Analytics provider that forwards events to all configured tracking pixels.
 *
 * Events flow to: GA4, Meta Pixel, TikTok, Twitter, LinkedIn, Pinterest,
 * Snapchat, Bing UET — plus console logging in dev mode.
 *
 * Usage:
 *   import { analytics } from "@/lib/analytics";
 *   analytics.track("scholarship_viewed", { slug: "chevening-2026", country: "GB" });
 */

export type EventName =
  | "wizard_started"
  | "step_completed"
  | "wizard_completed"
  | "results_viewed"
  | "scholarship_clicked_from_results"
  | "profile_edited"
  | "profile_cleared"
  // Scholarship engagement events
  | "scholarship_viewed"
  | "scholarship_apply_clicked"
  | "scholarship_shared"
  | "scholarship_compared"
  // Search & filter events
  | "search_performed"
  | "filter_applied"
  | "collection_viewed"
  | "country_page_viewed"
  | "degree_page_viewed"
  // Conversion events
  | "eligibility_check_completed"
  | "shortlist_added";

export interface AnalyticsProvider {
  track(event: EventName, properties?: Record<string, unknown>): void;
  identify(userId: string, traits?: Record<string, unknown>): void;
}

// GA4 event name mapping (GA4 has naming conventions)
const GA4_EVENT_MAP: Partial<Record<EventName, string>> = {
  scholarship_viewed: "view_item",
  scholarship_apply_clicked: "begin_checkout",
  search_performed: "search",
  scholarship_shared: "share",
  wizard_completed: "generate_lead",
  eligibility_check_completed: "sign_up",
};

// Meta Pixel standard event mapping
const META_EVENT_MAP: Partial<Record<EventName, string>> = {
  scholarship_viewed: "ViewContent",
  scholarship_apply_clicked: "Lead",
  search_performed: "Search",
  wizard_completed: "CompleteRegistration",
  eligibility_check_completed: "Subscribe",
  collection_viewed: "ViewContent",
};

class MultiPixelAnalytics implements AnalyticsProvider {
  track(event: EventName, properties?: Record<string, unknown>): void {
    if (typeof window === "undefined") return;

    // Dev console
    if (import.meta.env.DEV) {
      console.log(`[Analytics] ${event}`, properties);
    }

    // GA4
    if (typeof window.gtag === "function") {
      const ga4Event = GA4_EVENT_MAP[event] ?? event;
      window.gtag("event", ga4Event, {
        event_category: this._category(event),
        ...properties,
      });
    }

    // Meta Pixel
    if (typeof window.fbq === "function") {
      const metaEvent = META_EVENT_MAP[event];
      if (metaEvent) {
        window.fbq("track", metaEvent, properties);
      } else {
        window.fbq("trackCustom", event, properties);
      }
    }

    // TikTok
    if (typeof window.ttq !== "undefined") {
      window.ttq.track(event, properties);
    }

    // Twitter
    if (typeof window.twq === "function") {
      window.twq("track", event, properties);
    }

    // LinkedIn (only tracks page views, not custom events via insight tag)

    // Pinterest
    if (typeof window.pintrk === "function") {
      window.pintrk("track", "custom", { event_name: event, ...properties });
    }

    // Snapchat
    if (typeof window.snaptr === "function") {
      window.snaptr("track", event.toUpperCase(), properties);
    }

    // Bing UET
    if (typeof window.uetq !== "undefined") {
      window.uetq.push("event", event, { event_category: this._category(event), ...properties });
    }
  }

  identify(userId: string, traits?: Record<string, unknown>): void {
    if (typeof window === "undefined") return;

    if (import.meta.env.DEV) {
      console.log(`[Analytics] identify`, userId, traits);
    }

    // GA4 user properties
    if (typeof window.gtag === "function") {
      window.gtag("set", "user_properties", { user_id: userId, ...traits });
    }

    // Meta Pixel advanced matching
    if (typeof window.fbq === "function" && traits?.email) {
      window.fbq("init", import.meta.env.VITE_META_PIXEL_ID, { em: traits.email });
    }
  }

  private _category(event: EventName): string {
    if (event.startsWith("wizard_") || event.startsWith("step_") || event.startsWith("profile_"))
      return "eligibility";
    if (event.startsWith("scholarship_")) return "engagement";
    if (event.startsWith("search") || event.startsWith("filter")) return "discovery";
    return "general";
  }
}

/** Singleton analytics instance — forwards to all configured pixels */
export const analytics: AnalyticsProvider = new MultiPixelAnalytics();
