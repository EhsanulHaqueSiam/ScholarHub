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

// Daily fallback refresh of cached scholarship counts by status.
// Most updates should be event-driven; this acts as reconciliation.
crons.daily(
  "refresh scholarship count cache",
  { hourUTC: 2, minuteUTC: 45 },
  internal.directory.refreshScholarshipCountCacheInternal,
  {},
);

// Hourly refresh of homepage featured cache to keep top rows cheap and fresh.
crons.hourly("refresh homepage cache", { minuteUTC: 20 }, internal.directory.refreshHomepageCache, {});

// Daily refresh of SEO landing caches to avoid expensive per-request full scans.
crons.daily("refresh seo caches", { hourUTC: 2, minuteUTC: 15 }, internal.seo.refreshSeoCaches, {});

// Daily legacy raw payload compaction to control bytes-read costs.
crons.daily(
  "trim raw payloads",
  { hourUTC: 2, minuteUTC: 30 },
  internal.maintenance.trimRawPayloads,
  { cursor: undefined, processed: 0 },
);

// Daily auto-archive of expired scholarships (4:00 UTC)
crons.daily("archive_expired", { hourUTC: 4, minuteUTC: 0 }, internal.aggregation.archiveExpired, {
  cursor: null,
});

// Recompute collection scholarship counts (eventual consistency, D-90)
crons.daily(
  "recompute collection counts",
  { hourUTC: 5, minuteUTC: 0 },
  internal.collections.recomputeAllCounts,
  { cursor: undefined },
);

// Refresh reverse related_ids (Pitfall 1: reverse updates via daily cron)
crons.daily(
  "refresh related ids",
  { hourUTC: 6, minuteUTC: 0 },
  internal.related.refreshAllRelatedIds,
  { cursor: undefined },
);

export default crons;
