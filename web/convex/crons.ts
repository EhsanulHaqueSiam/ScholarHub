import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Daily cleanup of raw records older than 90 days (3:00 UTC)
crons.daily(
  "cleanup_old_records",
  { hourUTC: 3, minuteUTC: 0 },
  internal.maintenance.cleanupOldRecords,
);

// Daily cleanup of change log entries older than 90 days (3:30 UTC)
crons.daily(
  "cleanup_change_log",
  { hourUTC: 3, minuteUTC: 30 },
  internal.maintenance.cleanupChangeLog,
);

// Hourly heartbeat check to detect stalled pipeline
crons.hourly("heartbeat_check", { minuteUTC: 0 }, internal.monitoring.checkHeartbeat);

// Daily auto-archive of expired scholarships (4:00 UTC)
crons.daily("archive_expired", { hourUTC: 4, minuteUTC: 0 }, internal.aggregation.archiveExpired, {
  cursor: null,
});

export default crons;
