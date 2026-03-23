import { createFileRoute } from "@tanstack/react-router";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

const SITE_URL = process.env.VITE_SITE_URL || "https://scholarhub.io";

// Module-level font cache
let interFont: ArrayBuffer | null = null;
let archivoFont: ArrayBuffer | null = null;

/**
 * Fetch a font from Google Fonts as TTF (not WOFF2).
 * Uses an old user-agent to force Google to serve TTF format.
 */
async function fetchGoogleFont(family: string): Promise<ArrayBuffer> {
  const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}`;
  const cssResponse = await fetch(cssUrl, {
    headers: {
      // IE9 user-agent forces Google Fonts to serve TTF instead of WOFF2
      "User-Agent":
        "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)",
    },
  });
  const css = await cssResponse.text();

  // Extract the first TTF/OTF URL from the CSS
  const urlMatch = css.match(/url\(([^)]+\.(?:ttf|otf))\)/i)
    ?? css.match(/url\(([^)]+)\)/);

  if (!urlMatch?.[1]) {
    throw new Error(`Could not find font URL for ${family}`);
  }

  const fontResponse = await fetch(urlMatch[1]);
  return fontResponse.arrayBuffer();
}

/**
 * Load fonts with module-level caching.
 */
async function loadFonts(): Promise<
  { name: string; data: ArrayBuffer; weight: number; style: string }[]
> {
  if (!interFont) {
    interFont = await fetchGoogleFont("Inter");
  }
  if (!archivoFont) {
    archivoFont = await fetchGoogleFont("Archivo Black");
  }

  return [
    { name: "Inter", data: interFont, weight: 400, style: "normal" },
    {
      name: "Archivo Black",
      data: archivoFont,
      weight: 400,
      style: "normal",
    },
  ];
}

/**
 * Create a satori-compatible element (React.createElement-style object).
 */
function el(
  type: string,
  props: Record<string, unknown> | null,
  ...children: unknown[]
): Record<string, unknown> {
  return {
    type,
    props: {
      ...(props ?? {}),
      children: children.length === 1 ? children[0] : children,
    },
  };
}

/**
 * Build the base layout wrapper for all OG images.
 */
function baseLayout(...children: unknown[]) {
  return el(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        backgroundColor: "#FFF4E0",
        border: "4px solid #000",
        padding: "60px",
        fontFamily: "Inter",
      },
    },
    ...children,
  );
}

/**
 * Build the "ScholarHub" subtitle element.
 */
function subtitle(text: string) {
  return el(
    "div",
    {
      style: {
        fontSize: "28px",
        color: "#666",
        marginBottom: "16px",
        fontFamily: "Inter",
      },
    },
    text,
  );
}

/**
 * Build a title element.
 */
function title(text: string, size = 48) {
  return el(
    "div",
    {
      style: {
        fontSize: `${size}px`,
        fontFamily: "Archivo Black",
        color: "#000",
        lineHeight: 1.2,
        overflow: "hidden",
        textOverflow: "ellipsis",
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        maxHeight: `${size * 1.2 * 2 + 4}px`,
      },
    },
    text,
  );
}

/**
 * Build an info line element.
 */
function infoLine(text: string) {
  return el(
    "div",
    {
      style: {
        fontSize: "24px",
        color: "#444",
        marginTop: "20px",
        fontFamily: "Inter",
      },
    },
    text,
  );
}

/**
 * Build OG image for a specific scholarship.
 */
async function buildScholarshipImage(
  convex: ConvexHttpClient | null,
  slug: string,
) {
  let scholarshipTitle = slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  let info = "";

  if (convex) {
    try {
      const data = await convex.query(api.directory.getBySlug, { slug });
      if (data) {
        scholarshipTitle = data.title;
        const parts: string[] = [];
        if (data.funding_type) {
          parts.push(
            data.funding_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          );
        }
        if (data.degree_levels?.length) {
          parts.push(
            data.degree_levels
              .map((d: string) => d.charAt(0).toUpperCase() + d.slice(1))
              .join(", "),
          );
        }
        if (data.host_country) {
          parts.push(data.host_country);
        }
        info = parts.join("  |  ");
      }
    } catch {
      // Use slug-derived fallback
    }
  }

  return baseLayout(
    subtitle("ScholarHub"),
    title(scholarshipTitle),
    info ? infoLine(info) : null,
  );
}

/**
 * Build OG image for a country landing page.
 */
async function buildCountryImage(
  convex: ConvexHttpClient | null,
  countryCode: string,
) {
  const code = countryCode.toUpperCase();
  // Derive country name from code (simple mapping for common countries)
  const countryName = code;
  let count = 0;

  if (convex) {
    try {
      const stats = await convex.query(api.seo.getCountryStats, {
        countryCode: code,
      });
      count = stats.total;
    } catch {
      // Use defaults
    }
  }

  return baseLayout(
    subtitle("ScholarHub"),
    title(`Scholarships in ${countryName}`),
    infoLine(
      count > 0
        ? `${count} scholarships available`
        : "Explore scholarship opportunities",
    ),
  );
}

/**
 * Build OG image for a degree landing page.
 */
async function buildDegreeImage(
  convex: ConvexHttpClient | null,
  degreeLevel: string,
) {
  const degreeName =
    degreeLevel.charAt(0).toUpperCase() + degreeLevel.slice(1);
  let count = 0;

  if (convex) {
    try {
      const stats = await convex.query(api.seo.getDegreeStats, {
        degreeLevel,
      });
      count = stats.total;
    } catch {
      // Use defaults
    }
  }

  return baseLayout(
    subtitle("ScholarHub"),
    title(`${degreeName} Scholarships`),
    infoLine(
      count > 0
        ? `${count} scholarships worldwide`
        : "Explore scholarship opportunities",
    ),
  );
}

/**
 * Build OG image for a collection page.
 */
function buildCollectionImage(collectionName: string) {
  return baseLayout(
    subtitle("ScholarHub Collection"),
    title(collectionName || "Scholarship Collection"),
  );
}

/**
 * Build the default ScholarHub branded OG image.
 */
function buildDefaultImage() {
  return baseLayout(
    title("ScholarHub", 56),
    el(
      "div",
      {
        style: {
          fontSize: "28px",
          color: "#444",
          marginTop: "16px",
          fontFamily: "Inter",
        },
      },
      "Find Your Scholarship",
    ),
    el(
      "div",
      {
        style: {
          fontSize: "24px",
          color: "#666",
          marginTop: "24px",
          fontFamily: "Inter",
        },
      },
      "2,400+ International Scholarships",
    ),
  );
}

// 1x1 transparent PNG for error fallback
const TRANSPARENT_PIXEL = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
  0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x62, 0x00, 0x00, 0x00, 0x02,
  0x00, 0x01, 0xe2, 0x21, 0xbc, 0x33, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45,
  0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);

export const Route = createFileRoute("/api/og")({
  server: {
    handlers: {
      HEAD: async () => {
        return new Response(null, {
          status: 200,
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
          },
        });
      },
      GET: async ({ request }) => {
        try {
          const [{ default: satori }, { Resvg }] = await Promise.all([
            import("satori"),
            import("@resvg/resvg-js"),
          ]);

          const url = new URL(request.url);
          const type = url.searchParams.get("type") || "default";
          const slug = url.searchParams.get("slug") || "";
          const id = url.searchParams.get("id") || "";

          // Initialize Convex client if URL is available
          const convexUrl = process.env.VITE_CONVEX_URL;
          const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null;

          // Build the element tree based on type
          let element: Record<string, unknown>;

          switch (type) {
            case "scholarship":
              element = await buildScholarshipImage(convex, slug);
              break;
            case "country":
              element = await buildCountryImage(convex, id);
              break;
            case "degree":
              element = await buildDegreeImage(convex, id);
              break;
            case "collection":
              element = buildCollectionImage(id);
              break;
            default:
              element = buildDefaultImage();
              break;
          }

          // Load fonts
          const fonts = await loadFonts();

          // Generate SVG with satori
          const svg = await satori(element as any, {
            width: 1200,
            height: 630,
            fonts,
          });

          // Convert SVG to PNG
          const resvg = new Resvg(svg, {
            fitTo: { mode: "width", value: 1200 },
          });
          const pngBuffer = resvg.render().asPng();

          return new Response(pngBuffer, {
            status: 200,
            headers: {
              "Content-Type": "image/png",
              "Cache-Control":
                "public, max-age=86400, stale-while-revalidate=604800",
            },
          });
        } catch (error) {
          console.error("OG image generation failed:", error);

          // Return 1x1 transparent PNG on error
          return new Response(TRANSPARENT_PIXEL, {
            status: 500,
            headers: {
              "Content-Type": "image/png",
              "Cache-Control": "no-cache",
            },
          });
        }
      },
    },
  },
});
