#!/usr/bin/env node
/**
 * Export all public scholarship data from Convex as static JSON.
 *
 * Run: node scripts/export-static-data.mjs
 *
 * Uses cursor-paginated queries to stay under Convex's return-value field limit
 * without offset re-scans (important for read/bandwidth quota).
 */

import { ConvexHttpClient } from "convex/browser";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR_SRC = path.join(__dirname, "..", "src", "data");
const OUTPUT_DIR_PUBLIC = path.join(__dirname, "..", "public", "data");

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
    // 1. Fetch metadata (collections + SEO caches) — 1 call
    const metadata = await client.query("export:getMetadata", {});
    console.log(`   Metadata: ${metadata.collections.length} collections, ${metadata.countryCaches.length} countries`);

    // 2. Fetch scholarships in cursor pages
    const allScholarships = [];
    const allSummaries = [];
    let pageCount = 0;
    let cursor = null;
    let legacyPage = 0;
    let done = false;
    let detectedPagingMode = null; // "cursor" | "page"

    while (!done) {
      let result;

      if (detectedPagingMode !== "page") {
        try {
          result = await client.query("export:getScholarshipsPage", {
            cursor,
            pageSize: 200,
          });
          detectedPagingMode = "cursor";
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          if (message.includes("required field `page`")) {
            detectedPagingMode = "page";
          } else {
            throw error;
          }
        }
      }

      if (detectedPagingMode === "page") {
        result = await client.query("export:getScholarshipsPage", { page: legacyPage });
        legacyPage += 1;
      }

      allScholarships.push(...result.scholarships);
      allSummaries.push(...result.summaries);

      if (detectedPagingMode === "cursor") {
        cursor = result.continueCursor ?? null;
        done = Boolean(result.isDone);
      } else {
        done = !result.hasMore;
      }

      pageCount++;
      process.stdout.write(`   Page ${pageCount}: ${allScholarships.length} scholarships\r`);
    }
    console.log(`   Fetched ${allScholarships.length} scholarships in ${pageCount} pages`);

    // 3. Build slug index client-side
    const slugIndex = {};
    for (let i = 0; i < allScholarships.length; i++) {
      const slug = allScholarships[i].slug;
      if (slug) slugIndex[slug] = i;
    }

    // 4. Assemble final data
    const data = {
      scholarships: allScholarships,
      summaries: allSummaries,
      slugIndex,
      collections: metadata.collections,
      taxonomy: metadata.taxonomy,
      countryCaches: metadata.countryCaches,
      degreeCaches: metadata.degreeCaches,
      exportedAt: Date.now(),
    };

    // 5. Write output
    fs.mkdirSync(OUTPUT_DIR_SRC, { recursive: true });
    fs.mkdirSync(OUTPUT_DIR_PUBLIC, { recursive: true });
    const jsonStr = JSON.stringify(data);
    const srcOutputPath = path.join(OUTPUT_DIR_SRC, "scholarships.json");
    const publicOutputPath = path.join(OUTPUT_DIR_PUBLIC, "scholarships.json");
    fs.writeFileSync(srcOutputPath, jsonStr);
    fs.writeFileSync(publicOutputPath, jsonStr);

    const sizeMB = (Buffer.byteLength(jsonStr) / 1024 / 1024).toFixed(2);
    console.log(`✅ Exported ${allSummaries.length} scholarships (${sizeMB} MB)`);
    console.log(`   Output: ${srcOutputPath}`);
    console.log(`   Public Output: ${publicOutputPath}`);

    const exportMeta = JSON.stringify({
      exportedAt: data.exportedAt,
      scholarshipCount: allSummaries.length,
      collectionCount: metadata.collections.length,
      pages: pageCount,
    });
    fs.writeFileSync(path.join(OUTPUT_DIR_SRC, "export-meta.json"), exportMeta);
    fs.writeFileSync(path.join(OUTPUT_DIR_PUBLIC, "export-meta.json"), exportMeta);
  } catch (err) {
    console.error("❌ Export failed:", err.message);
    fs.mkdirSync(OUTPUT_DIR_SRC, { recursive: true });
    fs.mkdirSync(OUTPUT_DIR_PUBLIC, { recursive: true });
    const fallbackJson = JSON.stringify({
      scholarships: [],
      summaries: [],
      slugIndex: {},
      collections: [],
      taxonomy: { topCountries: [], allDegrees: [] },
      countryCaches: [],
      degreeCaches: [],
      exportedAt: Date.now(),
    });
    fs.writeFileSync(
      path.join(OUTPUT_DIR_SRC, "scholarships.json"),
      fallbackJson,
    );
    fs.writeFileSync(path.join(OUTPUT_DIR_PUBLIC, "scholarships.json"), fallbackJson);
    console.log("⚠️  Wrote empty fallback — app will use Convex queries as fallback");
  }
}

main();
