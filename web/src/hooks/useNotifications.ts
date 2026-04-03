import { useEffect, useRef } from "react";
import { useTrackerStore } from "./useTrackerStore";
import { useStaticData } from "./useStaticData";
import {
  loadPreferences,
  savePreferences,
  checkDeadlineReminders,
  checkNewMatches,
} from "@/lib/notifications/notification-engine";

export function useNotifications() {
  const entries = useTrackerStore((s) => s.entries);
  const { data } = useStaticData();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current || !data?.summaries) return;
    hasRun.current = true;

    const prefs = loadPreferences();

    // Check deadline reminders for tracked scholarships
    checkDeadlineReminders(entries, data.summaries, prefs);

    // Check for new scholarships since last visit
    checkNewMatches(data.summaries, prefs);

    // Update last visit timestamp
    savePreferences({ ...prefs, lastVisit: Date.now() });
  }, [entries, data?.summaries]);
}
