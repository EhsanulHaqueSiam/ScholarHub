import { createFileRoute } from "@tanstack/react-router";

const SITE_URL = process.env.VITE_SITE_URL || "https://scholarhub.io";

export const Route = createFileRoute("/api/robots.txt")({
  server: {
    handlers: {
      HEAD: async () => {
        return new Response(null, {
          status: 200,
          headers: {
            "Content-Type": "text/plain",
            "Cache-Control": "public, max-age=86400",
          },
        });
      },
      GET: async () => {
        const body = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/

Sitemap: ${SITE_URL}/api/sitemap.xml
`;

        return new Response(body, {
          status: 200,
          headers: {
            "Content-Type": "text/plain",
            "Cache-Control": "public, max-age=86400",
          },
        });
      },
    },
  },
});
