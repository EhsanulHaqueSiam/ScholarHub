import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PermissionModalProps {
  onAllow: () => void;
  onDecline: () => void;
}

export function PermissionModal({ onAllow, onDecline }: PermissionModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay">
      <Card className="max-w-md mx-4 relative">
        <button
          type="button"
          onClick={onDecline}
          className="absolute top-4 right-4 p-1 hover:opacity-70"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="size-5" />
            Enable Notifications?
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-body">
            ScholarHub can send you browser notifications for:
          </p>
          <ul className="list-disc list-inside text-caption space-y-1 opacity-80">
            <li>Upcoming scholarship deadlines</li>
            <li>New scholarships matching your profile</li>
          </ul>
          <p className="text-caption opacity-60">
            Notifications only appear when ScholarHub is open in your browser.
            No background push notifications, no email.
          </p>
          <div className="flex gap-3 mt-2">
            <Button onClick={onAllow} className="flex-1">
              Enable Notifications
            </Button>
            <Button variant="neutral" onClick={onDecline} className="flex-1">
              Not Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
