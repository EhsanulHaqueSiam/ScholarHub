const SITE_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : (import.meta.env?.VITE_SITE_URL ?? "https://scholarhub.io");

/**
 * Build a canonical URL, stripping query parameters.
 */
export function buildCanonicalUrl(path: string): string {
  // Strip query params
  const cleanPath = path.split("?")[0];
  return `${SITE_URL}${cleanPath}`;
}

/**
 * Build Open Graph and Twitter Card meta tag objects.
 */
export function buildOgMeta(opts: {
  title: string;
  description: string;
  image?: string;
  url: string;
  type?: string;
}): Record<string, string>[] {
  const image = opts.image ?? `${SITE_URL}/api/og?type=default`;
  const type = opts.type ?? "website";

  return [
    { property: "og:title", content: opts.title },
    { property: "og:description", content: opts.description },
    { property: "og:image", content: image },
    { property: "og:url", content: opts.url },
    { property: "og:type", content: type },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: opts.title },
    { name: "twitter:description", content: opts.description },
    { name: "twitter:image", content: image },
  ];
}

/**
 * Build complete page meta tags and links for SEO.
 * Combines title, description, OG meta, canonical link, and hreflang.
 */
export function buildPageMeta(opts: {
  title: string;
  description: string;
  canonicalPath: string;
  ogImageUrl?: string;
}): { meta: Record<string, string>[]; links: Array<Record<string, string> & { hrefLang?: string }> } {
  const canonicalUrl = buildCanonicalUrl(opts.canonicalPath);

  const ogMeta = buildOgMeta({
    title: opts.title,
    description: opts.description,
    image: opts.ogImageUrl,
    url: canonicalUrl,
  });

  const meta: Record<string, string>[] = [
    { title: opts.title },
    { name: "description", content: opts.description },
    ...ogMeta,
  ];

  const links: Array<Record<string, string> & { hrefLang?: string }> = [
    { rel: "canonical", href: canonicalUrl },
    { rel: "alternate", hrefLang: "en", href: canonicalUrl },
  ];

  return { meta, links };
}
