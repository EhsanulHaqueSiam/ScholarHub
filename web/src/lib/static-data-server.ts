import fs from "node:fs/promises";
import path from "node:path";
import type { StaticData } from "./static-data";

/**
 * Server-only static data loader.
 * Isolated in its own module so client bundles can fully tree-shake JSON imports.
 */
export async function loadStaticDataFromModule(): Promise<StaticData | null> {
  const candidates = [
    // Dev (source tree)
    path.resolve(process.cwd(), "src/data/scholarships.json"),
    path.resolve(process.cwd(), "public/data/scholarships.json"),
    // Build output (SSR runtime)
    path.resolve(process.cwd(), "dist/client/data/scholarships.json"),
  ];

  for (const filePath of candidates) {
    try {
      const raw = await fs.readFile(filePath, "utf-8");
      return JSON.parse(raw) as StaticData;
    } catch {
      // Try next candidate path.
    }
  }

  return null;
}
