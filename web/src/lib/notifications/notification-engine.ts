import { toast } from "sonner";
import type { NotificationPreferences } from "./types";
import { DEFAULT_PREFERENCES, NOTIFICATION_STORAGE_KEY } from "./types";
import type { ScholarshipSummary } from "@/lib/scholarship-summary";
import type { TrackerEntry } from "@/lib/tracker/types";

export function loadPreferences(): NotificationPreferences {
  try {
    const raw = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES, lastVisit: Date.now() };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch {
    return { ...DEFAULT_PREFERENCES, lastVisit: Date.now() };
  }
}

export function savePreferences(prefs: NotificationPreferences): void {
  try {
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Quota exceeded — fail silently
  }
}

export function checkDeadlineReminders(
  entries: TrackerEntry[],
  summaries: ScholarshipSummary[],
  prefs: NotificationPreferences,
): void {
  if (!prefs.deadlineReminders) return;

  const now = Date.now();
  const reminderMs = prefs.reminderDaysBefore * 24 * 60 * 60 * 1000;

  for (const entry of entries) {
    const summary = summaries.find((s) => s.slug === entry.scholarshipSlug);
    if (!summary?.application_deadline) continue;

    const deadline = summary.application_deadline;
    const daysUntil = Math.ceil((deadline - now) / (24 * 60 * 60 * 1000));

    if (daysUntil > 0 && daysUntil <= prefs.reminderDaysBefore) {
      const title = summary.title;
      const message = `${title} deadline in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}`;

      toast.warning(message, {
        duration: 8000,
        id: `deadline-${entry.scholarshipSlug}`,
      });

      if (prefs.browserNotifications && "Notification" in window && Notification.permission === "granted") {
        new Notification("ScholarHub Deadline Reminder", { body: message });
      }
    }
  }
}

export function checkNewMatches(
  summaries: ScholarshipSummary[],
  prefs: NotificationPreferences,
): number {
  if (!prefs.newMatches) return 0;

  const newSince = summaries.filter(
    (s) => s._creationTime > prefs.lastVisit,
  );

  if (newSince.length > 0) {
    toast.info(`${newSince.length} new scholarship${newSince.length !== 1 ? "s" : ""} since your last visit`, {
      duration: 6000,
      id: "new-matches",
    });
  }

  return newSince.length;
}

export async function requestBrowserPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  const result = await Notification.requestPermission();
  return result === "granted";
}
