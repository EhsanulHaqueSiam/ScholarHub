#!/usr/bin/env node
/**
 * Convex quota readiness report.
 *
 * Checks:
 * - Static export files exist and are reasonably fresh.
 * - archiveExpired runKey is synchronized between cron and mutation.
 *
 * Usage:
 *   node scripts/quota-readiness-report.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const EXPORT_META_PATH = path.join(ROOT, "src", "data", "export-meta.json");
const EXPORT_DATA_PATH = path.join(ROOT, "src", "data", "scholarships.json");
const AGGREGATION_PATH = path.join(ROOT, "convex", "aggregation.ts");
const CRONS_PATH = path.join(ROOT, "convex", "crons.ts");

function info(msg) {
  console.log(`[INFO] ${msg}`);
}

function ok(msg) {
  console.log(`[OK] ${msg}`);
}

function warn(msg) {
  console.log(`[WARN] ${msg}`);
}

function fail(msg) {
  console.log(`[FAIL] ${msg}`);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf-8");
}

let hasHardFailure = false;

info("Running Convex quota readiness checks...");

// ---- Static export checks ----
if (!fs.existsSync(EXPORT_META_PATH) || !fs.existsSync(EXPORT_DATA_PATH)) {
  fail("Static export files are missing (src/data/export-meta.json or scholarships.json).");
  hasHardFailure = true;
} else {
  ok("Static export files exist.");

  try {
    const meta = readJson(EXPORT_META_PATH);
    const exportedAt = Number(meta.exportedAt);
    const count = Number(meta.scholarshipCount ?? 0);
    const ageHours = (Date.now() - exportedAt) / (1000 * 60 * 60);
    const sizeMb = (fs.statSync(EXPORT_DATA_PATH).size / (1024 * 1024)).toFixed(2);

    info(`Static dataset size: ${sizeMb} MB`);
    info(`Static scholarship count: ${count.toLocaleString()}`);
    info(`Static export age: ${ageHours.toFixed(2)} hours`);

    if (!Number.isFinite(exportedAt) || exportedAt <= 0) {
      fail("export-meta.json has invalid exportedAt.");
      hasHardFailure = true;
    } else if (ageHours > 24) {
      warn("Static export is older than 24h. Convex fallback traffic risk is higher.");
    } else {
      ok("Static export freshness is within 24h.");
    }
  } catch (error) {
    fail(`Could not parse static export metadata: ${error instanceof Error ? error.message : String(error)}`);
    hasHardFailure = true;
  }
}

// ---- archiveExpired runKey synchronization ----
if (!fs.existsSync(AGGREGATION_PATH) || !fs.existsSync(CRONS_PATH)) {
  fail("Could not find aggregation.ts or crons.ts.");
  hasHardFailure = true;
} else {
  const aggregationCode = readText(AGGREGATION_PATH);
  const cronsCode = readText(CRONS_PATH);

  const aggMatch = aggregationCode.match(/const\s+ARCHIVE_RUN_KEY\s*=\s*(\d+)/);
  const cronMatch = cronsCode.match(/archiveExpired[\s\S]*?\{\s*cursor:\s*null,\s*runKey:\s*(\d+)\s*\}/m);

  const aggRunKey = aggMatch ? Number(aggMatch[1]) : null;
  const cronRunKey = cronMatch ? Number(cronMatch[1]) : null;

  if (aggRunKey === null) {
    fail("ARCHIVE_RUN_KEY was not found in convex/aggregation.ts.");
    hasHardFailure = true;
  }
  if (cronRunKey === null) {
    fail("archive_expired cron runKey was not found in convex/crons.ts.");
    hasHardFailure = true;
  }

  if (aggRunKey !== null && cronRunKey !== null) {
    if (aggRunKey !== cronRunKey) {
      fail(`archiveExpired runKey mismatch: aggregation=${aggRunKey}, cron=${cronRunKey}`);
      hasHardFailure = true;
    } else {
      ok(`archiveExpired runKey is synchronized (${aggRunKey}).`);
    }
  }
}

info("Recommended post-deploy watchlist in Convex dashboard:");
info("- aggregation.archiveExpired");
info("- directory.listScholarships / directory.searchSuggestions");
info("- api-driven fallbacks: seo.getSitemapData, directory.getBySlug, seo.getCountryStats, seo.getDegreeStats");
info("- admin.getReviewQueue / admin.getAdminStats");
info("- shortlist.suggestUniversities / eligibility.getMatchCount / eligibility.getEligibleScholarships");

if (hasHardFailure) {
  process.exitCode = 1;
  fail("Quota readiness check failed.");
} else {
  ok("Quota readiness check passed.");
}
