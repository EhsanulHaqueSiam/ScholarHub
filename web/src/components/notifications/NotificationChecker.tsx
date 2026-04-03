import { useNotifications } from "@/hooks/useNotifications";

export function NotificationChecker() {
  useNotifications();
  return null;
}
