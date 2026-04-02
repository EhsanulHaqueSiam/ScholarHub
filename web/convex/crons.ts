import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// ── Absolute minimum for free plan ──
// Only 1 cron: auto-archive expired scholarships.
// Everything else handled by: static JSON export (reads), Python direct mode (writes).
// Cache refreshes, cleanups, count recomputes — all redundant with direct mode + static export.

crons.weekly(
  "archive_expired",
  { dayOfWeek: "sunday", hourUTC: 4, minuteUTC: 0 },
  internal.aggregation.archiveExpired,
  // Keep in sync with ARCHIVE_RUN_KEY in aggregation.ts.
  { cursor: null, runKey: 2 },
);

export default crons;
