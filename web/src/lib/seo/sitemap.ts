/**
 * Sitemap XML generation utility.
 * Produces valid sitemap XML from URL entries.
 */

/**
 * Escape special XML characters in a string.
 */
export function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Generate a sitemap XML string from URL entries.
 */
export function generateSitemapXml(
  urls: {
    loc: string;
    lastmod?: string;
    changefreq?: string;
    priority?: number;
  }[],
): string {
  const urlEntries = urls
    .map((entry) => {
      let xml = `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>`;
      if (entry.lastmod) {
        xml += `\n    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`;
      }
      if (entry.changefreq) {
        xml += `\n    <changefreq>${escapeXml(entry.changefreq)}</changefreq>`;
      }
      if (entry.priority !== undefined) {
        xml += `\n    <priority>${entry.priority}</priority>`;
      }
      xml += "\n  </url>";
      return xml;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}
