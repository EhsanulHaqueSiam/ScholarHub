import { createFileRoute } from "@tanstack/react-router";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";
import { generateSitemapXml } from "../../lib/seo/sitemap";

const SITE_URL = process.env.VITE_SITE_URL || "https://scholarhub.io";

export const Route = createFileRoute("/api/sitemap.xml")({
  server: {
    handlers: {
      HEAD: async () => {
        return new Response(null, {
          status: 200,
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
          },
        });
      },
      GET: async () => {
        try {
          const convexUrl = process.env.VITE_CONVEX_URL;
          if (!convexUrl) {
            return new Response(
              generateSitemapXml([{ loc: SITE_URL, priority: 1.0 }]),
              {
                status: 200,
                headers: {
                  "Content-Type": "application/xml",
                  "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
                },
              },
            );
          }

          const convex = new ConvexHttpClient(convexUrl);

          const sitemapData = await convex.query(api.seo.getSitemapData);

          const urls: {
            loc: string;
            lastmod?: string;
            changefreq?: string;
            priority?: number;
          }[] = [];

          // Static pages
          urls.push(
            { loc: SITE_URL, priority: 1.0, changefreq: "daily" },
            {
              loc: `${SITE_URL}/scholarships`,
              priority: 0.9,
              changefreq: "daily",
            },
            {
              loc: `${SITE_URL}/scholarships/closing-soon`,
              priority: 0.8,
              changefreq: "daily",
            },
            {
              loc: `${SITE_URL}/collections`,
              priority: 0.7,
              changefreq: "weekly",
            },
          );

          // Scholarship detail pages
          for (const s of sitemapData.slugs) {
            urls.push({
              loc: `${SITE_URL}/scholarships/${s.slug}`,
              lastmod: new Date(s.lastModified).toISOString().split("T")[0],
              changefreq: "weekly",
              priority: 0.8,
            });
          }

          // Country landing pages
          for (const c of sitemapData.topCountries) {
            urls.push({
              loc: `${SITE_URL}/scholarships/country/${c.code.toLowerCase()}`,
              changefreq: "weekly",
              priority: 0.7,
            });
          }

          // Degree landing pages
          for (const d of sitemapData.allDegrees) {
            urls.push({
              loc: `${SITE_URL}/scholarships/degree/${d.level}`,
              changefreq: "weekly",
              priority: 0.7,
            });
          }

          const xml = generateSitemapXml(urls);

          return new Response(xml, {
            status: 200,
            headers: {
              "Content-Type": "application/xml",
              "Cache-Control":
                "public, max-age=3600, stale-while-revalidate=86400",
            },
          });
        } catch (error) {
          // Fallback: return minimal sitemap on error
          const fallbackXml = generateSitemapXml([
            { loc: SITE_URL, priority: 1.0 },
            { loc: `${SITE_URL}/scholarships`, priority: 0.9 },
          ]);

          return new Response(fallbackXml, {
            status: 200,
            headers: {
              "Content-Type": "application/xml",
              "Cache-Control": "public, max-age=300",
            },
          });
        }
      },
    },
  },
});
