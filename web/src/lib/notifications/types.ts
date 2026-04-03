export interface NotificationPreferences {
  deadlineReminders: boolean;
  newMatches: boolean;
  browserNotifications: boolean;
  reminderDaysBefore: number;
  _version: number;
  lastVisit: number;
}

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  deadlineReminders: true,
  newMatches: true,
  browserNotifications: false,
  reminderDaysBefore: 7,
  _version: 1,
  lastVisit: Date.now(),
};

export const NOTIFICATION_STORAGE_KEY = "scholarhub_notifications";
