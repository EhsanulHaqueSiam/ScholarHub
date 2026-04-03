import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { NotificationPreferences } from "@/lib/notifications/types";
import {
  loadPreferences,
  savePreferences,
  requestBrowserPermission,
} from "@/lib/notifications/notification-engine";
import { PermissionModal } from "./PermissionModal";

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer py-2">
      <span className="text-caption">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative w-10 h-6 rounded-base border-2 border-border transition-colors",
          checked ? "bg-main" : "bg-secondary-background",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 w-4 h-4 rounded-base bg-main-foreground border border-border transition-transform",
            checked ? "translate-x-4" : "translate-x-0",
          )}
        />
      </button>
    </label>
  );
}

export function NotificationPreferencesPanel() {
  const [prefs, setPrefs] = useState<NotificationPreferences>(loadPreferences);
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  const updatePref = useCallback(
    (key: keyof NotificationPreferences, value: boolean | number) => {
      setPrefs((prev) => {
        const next = { ...prev, [key]: value };
        savePreferences(next);
        return next;
      });
    },
    [],
  );

  const handleBrowserToggle = useCallback(
    async (enabled: boolean) => {
      if (enabled) {
        if ("Notification" in window && Notification.permission === "default") {
          setShowPermissionModal(true);
          return;
        }
        if ("Notification" in window && Notification.permission === "granted") {
          updatePref("browserNotifications", true);
          return;
        }
      }
      updatePref("browserNotifications", false);
    },
    [updatePref],
  );

  const handlePermissionAllow = useCallback(async () => {
    setShowPermissionModal(false);
    const granted = await requestBrowserPermission();
    updatePref("browserNotifications", granted);
  }, [updatePref]);

  return (
    <>
      {showPermissionModal && (
        <PermissionModal
          onAllow={handlePermissionAllow}
          onDecline={() => {
            setShowPermissionModal(false);
            updatePref("browserNotifications", false);
          }}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col">
          <Toggle
            checked={prefs.deadlineReminders}
            onChange={(v) => updatePref("deadlineReminders", v)}
            label="Deadline reminders"
          />
          <Toggle
            checked={prefs.newMatches}
            onChange={(v) => updatePref("newMatches", v)}
            label="New scholarship matches"
          />
          <Toggle
            checked={prefs.browserNotifications}
            onChange={handleBrowserToggle}
            label="Browser notifications"
          />

          <div className="mt-3 pt-3 border-t border-border">
            <label className="flex items-center justify-between gap-3">
              <span className="text-caption">Remind me before deadline</span>
              <select
                value={prefs.reminderDaysBefore}
                onChange={(e) =>
                  updatePref("reminderDaysBefore", Number(e.target.value))
                }
                className="border-2 border-border rounded-base bg-secondary-background px-2 py-1 text-caption"
              >
                <option value={3}>3 days</option>
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
              </select>
            </label>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
