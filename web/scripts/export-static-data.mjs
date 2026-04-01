#!/usr/bin/env node
/**
 * Export all public scholarship data from Convex as static JSON.
 *
 * Run: node scripts/export-static-data.mjs
 *
 * This is called during build (prebuild) or via GitHub Actions after scrape runs.
 * Produces a single JSON file that the frontend loads instead of querying Convex.
 *
 * Convex cost: exactly 1 function call per export.
 */

import { ConvexHttpClient } from "convex/browser";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, "..", "src", "data");

// Load env
const envPath = path.join(__dirname, "..", "..", ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^(\w+)=(.*)$/);
    if (match) process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

const CONVEX_URL =
  process.env.VITE_CONVEX_URL || process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("❌ CONVEX_URL not found in environment");
  process.exit(1);
}

async function main() {
  console.log("📦 Exporting static data from Convex...");
  const client = new ConvexHttpClient(CONVEX_URL);

  try {
    // Single Convex call to get everything
    const data = await client.query("export:getAllPublicData", {});

    // Ensure output directory exists
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    // Write the full dataset
    const jsonStr = JSON.stringify(data);
    const outputPath = path.join(OUTPUT_DIR, "scholarships.json");
    fs.writeFileSync(outputPath, jsonStr);

    const sizeMB = (Buffer.byteLength(jsonStr) / 1024 / 1024).toFixed(2);
    console.log(`✅ Exported ${data.summaries?.length ?? 0} scholarships (${sizeMB} MB)`);
    console.log(`   Collections: ${data.collections?.length ?? 0}`);
    console.log(`   Countries: ${Object.keys(data.countryCaches ?? {}).length}`);
    console.log(`   Degrees: ${Object.keys(data.degreeCaches ?? {}).length}`);
    console.log(`   Output: ${outputPath}`);

    // Also write a timestamp file for cache busting
    fs.writeFileSync(
      path.join(OUTPUT_DIR, "export-meta.json"),
      JSON.stringify({
        exportedAt: data.exportedAt,
        scholarshipCount: data.summaries?.length ?? 0,
        collectionCount: data.collections?.length ?? 0,
      }),
    );
  } catch (err) {
    console.error("❌ Export failed:", err.message);
    // Don't fail the build — write empty fallback so the app still works
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(
      path.join(OUTPUT_DIR, "scholarships.json"),
      JSON.stringify({
        scholarships: [],
        summaries: [],
        slugIndex: {},
        collections: [],
        taxonomy: { topCountries: [], allDegrees: [] },
        countryCaches: {},
        degreeCaches: {},
        exportedAt: Date.now(),
      }),
    );
    console.log("⚠️  Wrote empty fallback data — app will use Convex queries as fallback");
  }
}

main();
