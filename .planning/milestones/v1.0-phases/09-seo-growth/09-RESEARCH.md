# Phase 9: SEO & Growth - Research

**Researched:** 2026-03-23
**Domain:** SEO structured data, meta tags, sitemap generation, OG images, analytics
**Confidence:** HIGH

## Summary

Phase 9 enhances ScholarHub with comprehensive SEO infrastructure across four domains: (1) Schema.org structured data on all page types, (2) enriched auto-generated landing pages for countries and degrees with unique templated content, (3) technical SEO plumbing (sitemap.xml, robots.txt, canonical URLs, OG images), and (4) analytics tracking (GA4, Search Console).

The existing codebase already has a solid foundation: TanStack Router's `head()` function is used on all routes for meta tags, the scholarship detail page has a `buildScholarshipJsonLd()` function producing JSON-LD, and the country landing page already has full content sections (cost, visa, intakes, post-study work). The degree landing page is a placeholder awaiting this phase. The app uses TanStack Start with SSR on Netlify, meaning crawlers already receive server-rendered HTML -- a major SEO advantage. The primary work is extending existing patterns rather than building new infrastructure.

**Primary recommendation:** Use the established `head()` pattern with `meta`, `links`, and `scripts` arrays for all SEO metadata injection. Use `satori` + `@resvg/resvg-js` for OG image generation via a TanStack Start server route on Netlify. Generate sitemap.xml dynamically via a server route that queries Convex for all published scholarship slugs. Keep Schema.org types grounded in officially supported types (not the non-existent "Scholarship" type).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Full Schema.org suite -- Scholarship + BreadcrumbList on all pages, FAQPage on landing pages, ItemList on collection/directory pages, Organization on homepage
- **D-02:** Collection pages (/collections/$slug) get ItemList markup with scholarship entries; comparison pages get ItemList for compared items
- **D-03:** Landing pages (country/degree) get auto-generated FAQ structured data with 3-5 data-driven questions
- **D-04:** Scholarship detail page JSON-LD enhanced with: provider as Schema.org Organization, eligibleRegion + educationalLevel + eligibilityDescription, applicationDeadline + application URL, BreadcrumbList
- **D-05:** Dynamic stats + templated prose for content uniqueness
- **D-06:** Cross-link sections on all landing pages
- **D-07:** Page scope: Top 20 countries by scholarship count + all degree levels
- **D-08:** Sitemap.xml -- build-time static generation from Convex data during deploy
- **D-09:** Robots.txt -- allow all public pages, disallow admin routes, reference sitemap location
- **D-10:** Canonical URLs -- rel=canonical on all pages
- **D-11:** Open Graph + Twitter Cards -- dynamic per-page OG images
- **D-12:** Static HTML generation at build time for all landing pages
- **D-13:** Country URLs: /scholarships/country/germany (lowercase full names)
- **D-14:** Degree URLs: /scholarships/phd, /scholarships/masters, /scholarships/bachelors
- **D-15:** Each landing page gets: unique stat summary, templated intro, FAQ section, cross-links
- **D-16:** Auto-generated meta descriptions with data templates
- **D-17:** Lighthouse SEO score target: 90+
- **D-18:** Static HTML generation at build time for landing pages
- **D-19:** English-only, add hreflang="en" as future-proofing
- **D-20:** Google Search Console verification meta tag
- **D-21:** Google Analytics 4 setup
- **D-22:** Structured data validation monitoring
- **D-23:** Dynamic per-page OG images with scholarship-specific info

### Claude's Discretion
- OG image generation library choice (satori, @vercel/og, or alternative for Netlify/non-Vercel stack)
- Exact templated prose wording for landing page intros
- FAQ question selection algorithm
- Sitemap priority/changefreq values
- GA4 event tracking specifics beyond pageview

### Deferred Ideas (OUT OF SCOPE)
- Multi-language content and full i18n routing
- PostHog analytics integration
- AI-generated unique content per landing page
- Social media auto-posting on new scholarships
- Google News / Discover optimization
- AMP pages for mobile search
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SEOG-01 | Each scholarship page has clean URL, proper meta tags, and Schema.org structured data | Existing `buildScholarshipJsonLd()` needs enhancement per D-04; `head()` pattern established; Schema.org Grant type with scholarship properties |
| SEOG-02 | Country landing pages auto-generated with unique meta descriptions | Country route exists at `/scholarships/country/$country.tsx` with content sections; needs stats enrichment, FAQ structured data, cross-links |
| SEOG-03 | Degree-level landing pages auto-generated | Degree route exists as placeholder at `/scholarships/degree/$degree.tsx`; needs full implementation with scholarship listings, stats, FAQ, cross-links |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| satori | 0.26.0 | JSX to SVG for OG images | Industry standard, React JSX support, works in Node.js serverless, used by Vercel OG under the hood |
| @resvg/resvg-js | 2.6.2 | SVG to PNG conversion | Native Rust-based SVG renderer, fast, pairs with satori for PNG output |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-start | 1.167.1 (installed) | SSR, server routes, head management | Already installed -- use server routes for sitemap.xml and OG image endpoints |
| @tanstack/react-router | 1.168.2 (installed) | File-based routing, head() for meta | Already installed -- extend existing head() with links, scripts arrays |
| convex | 1.33.1 (installed) | Backend queries for scholarship data | Already installed -- add new queries for landing page stats |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| satori + @resvg/resvg-js | og_edge (Deno-based @vercel/og port) | og_edge runs on Netlify Edge Functions (Deno) but is less maintained; satori in Node.js serverless is more portable and better documented |
| satori + @resvg/resvg-js | @vercel/og | Vercel-specific, not designed for Netlify; satori is the underlying lib anyway |
| Dynamic sitemap server route | TanStack Start prerender + crawlLinks | Prerender requires all pages to be linkable at build time; with 2400+ scholarship detail pages, dynamic generation via server route is more practical |

**Installation:**
```bash
cd web && npm install satori @resvg/resvg-js
```

**Version verification:** satori 0.26.0, @resvg/resvg-js 2.6.2 (verified via npm registry 2026-03-23).

## Architecture Patterns

### Recommended Project Structure
```
web/src/
  routes/
    scholarships/
      $slug.tsx              # Enhanced: richer JSON-LD, OG meta, canonical, breadcrumb structured data
      country/
        $country.tsx         # Enhanced: stats, FAQ structured data, cross-links, OG meta
      degree/
        $degree.tsx          # Rebuilt: full landing page with listings, stats, FAQ, cross-links
      compare.tsx            # Enhanced: ItemList structured data
    collections/
      $slug.tsx              # Enhanced: ItemList structured data
    __root.tsx               # Enhanced: global OG defaults, hreflang, Organization JSON-LD, canonical
    api/
      sitemap[.]xml.ts       # NEW: server route generating sitemap XML
      og.ts                  # NEW: server route generating OG images dynamically
  lib/
    seo/
      json-ld.ts             # NEW: JSON-LD builder functions (scholarship, breadcrumb, FAQ, ItemList, Organization)
      meta.ts                # NEW: meta tag builder helpers (OG, Twitter, canonical)
      og-image.tsx           # NEW: satori JSX templates for OG images
      sitemap.ts             # NEW: sitemap XML generation logic
      landing-content.ts     # NEW: templated content generation (stats, intros, FAQs)
  convex/
    seo.ts                   # NEW: queries for SEO data (all slugs, country stats, degree stats)
```

### Pattern 1: TanStack Router head() for All Meta Tags
**What:** Use route-level `head()` with `meta`, `links`, and `scripts` arrays
**When to use:** Every route that needs SEO metadata
**Example:**
```typescript
// Source: TanStack Router documentation + existing codebase pattern
export const Route = createFileRoute("/scholarships/country/$country")({
  head: ({ params }) => {
    const name = getCountryName(params.country);
    const canonicalUrl = `https://scholarhub.io/scholarships/country/${params.country}`;
    return {
      meta: [
        { title: `Scholarships in ${name} -- ScholarHub` },
        { name: "description", content: `Discover ${name} scholarships...` },
        { property: "og:title", content: `Scholarships in ${name} -- ScholarHub` },
        { property: "og:description", content: `Discover ${name} scholarships...` },
        { property: "og:image", content: `/api/og?type=country&id=${params.country}` },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [
        { rel: "canonical", href: canonicalUrl },
      ],
    };
  },
});
```

### Pattern 2: JSON-LD via Script Tag in Component Body (Existing Pattern)
**What:** Inject `<script type="application/ld+json">` in the component render
**When to use:** When JSON-LD needs data from Convex queries (not available in head())
**Why not use head() scripts for JSON-LD:** The `head()` function runs at route resolution time with only `params` and `search` available -- not loader data or Convex query results. Since all structured data depends on runtime Convex data (scholarship details, counts), JSON-LD must be injected in the component body where query results are available.

**Note:** TanStack Router does support `scripts` in head() for static JSON-LD, but ScholarHub's data is dynamic from Convex. The existing pattern of injecting JSON-LD in the component body is correct for this use case.

### Pattern 3: Server Route for Dynamic Endpoints
**What:** TanStack Start server routes for sitemap.xml and OG image generation
**When to use:** Non-HTML responses (XML, PNG) served from the same domain
**Example:**
```typescript
// web/src/routes/api/sitemap[.]xml.ts
// Note: the [.] escapes the dot in TanStack Router file-based routing
import { createServerFileRoute } from "@tanstack/react-start/server";

export const ServerRoute = createServerFileRoute("/api/sitemap.xml")
  .methods({
    GET: async ({ request }) => {
      // Fetch all published scholarship slugs from Convex
      // Generate XML sitemap
      return new Response(xml, {
        headers: { "Content-Type": "application/xml" },
      });
    },
  });
```

### Pattern 4: Convex Queries for SEO Data
**What:** Dedicated lightweight queries that return only what SEO features need
**When to use:** Landing page stats, sitemap slug lists, OG image data
**Example:**
```typescript
// convex/seo.ts
export const getCountryStats = query({
  args: { countryCode: v.string() },
  handler: async (ctx, { countryCode }) => {
    const scholarships = await ctx.db
      .query("scholarships")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .filter((q) => q.eq(q.field("host_country"), countryCode))
      .take(5000);
    return {
      total: scholarships.length,
      fullyFunded: scholarships.filter(s => s.funding_type === "fully_funded").length,
      degreeLevels: [...new Set(scholarships.flatMap(s => s.degree_levels))],
      // ... more stats
    };
  },
});
```

### Anti-Patterns to Avoid
- **JSON-LD in head() with dynamic data:** head() only has access to params/search, not Convex query results. Keep JSON-LD in component body.
- **Using `@type: "Scholarship"` in Schema.org:** Schema.org has NO official "Scholarship" type. The existing code uses it but Google ignores unrecognized types. Use `Grant` or `EducationalOccupationalProgram` with relevant properties instead.
- **Generating OG images at build time for all 2400+ scholarships:** Would make builds extremely slow. Use on-demand server route generation with cache headers instead.
- **Hard-coded country/degree lists for sitemap:** Query Convex at request time for current data. Landing pages should only exist for countries/degrees that have published scholarships.

## Critical Finding: Schema.org "Scholarship" Type Does Not Exist

**Confidence: HIGH** (verified via schema.org search, no type found at schema.org/Scholarship)

Schema.org does NOT define a "Scholarship" type. The existing `buildScholarshipJsonLd()` uses `@type: "Scholarship"` which Google will silently ignore as an unrecognized type. This means the current structured data provides zero SEO value from Google's perspective.

**Recommended replacement approach:**
- Use `@type: "Grant"` (schema.org/Grant) -- closest official type for financial awards
- Supplement with `@type: "EducationalOccupationalProgram"` properties where applicable
- Keep `provider` as `@type: "Organization"` (already correct)
- Add `funder`, `fundedItem`, `amount` from Grant type
- Use `eligibleRegion`, `applicationDeadline` properties (valid on Grant via CreativeWork chain)

**Alternative:** Use `@type: ["Grant", "Thing"]` with additional custom properties. Google processes known properties and ignores unknown ones gracefully.

**Impact on D-01:** The user's decision says "Scholarship + BreadcrumbList." Since Scholarship doesn't exist, implement as Grant with scholarship-relevant properties. The intent (rich structured data for scholarships) is preserved; only the `@type` value changes.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OG image rendering | Canvas-based image generation | satori + @resvg/resvg-js | Handles text layout, emoji, fonts, produces consistent SVG/PNG |
| SVG to PNG | Custom ImageMagick/Sharp pipeline | @resvg/resvg-js | Rust-native, fast, handles all SVG features satori produces |
| Sitemap XML generation | String concatenation | Template literals with XML escaping | Sitemap XML is simple enough that a helper function suffices; no library needed |
| Country name resolution | Manual country code mapping | i18n-iso-countries (already installed) | Already used via `getCountryName()` / `getCountryFlag()` |
| Meta tag deduplication | Custom head management | TanStack Router head() | Built-in deduplication -- last occurrence wins for same name/property |

**Key insight:** The existing TanStack Start + Router stack already handles SSR, meta injection, and route-level head management. The SEO work is primarily about enriching data passed to these existing systems, not building new infrastructure.

## Common Pitfalls

### Pitfall 1: Schema.org Type Doesn't Exist
**What goes wrong:** Using `@type: "Scholarship"` which Schema.org doesn't define
**Why it happens:** The type name seems logical and is already in the codebase
**How to avoid:** Use `@type: "Grant"` with relevant properties from the Grant and CreativeWork type hierarchies
**Warning signs:** Google Rich Results Test shows no recognized structured data, Search Console reports 0 valid items

### Pitfall 2: OG Images Not Serving on Netlify
**What goes wrong:** satori requires font files as ArrayBuffer; fonts not found in serverless function
**Why it happens:** Netlify serverless functions run in a different filesystem context than the build
**How to avoid:** Bundle fonts with the server route using `included_files` in netlify.toml, or fetch fonts from a CDN URL at runtime
**Warning signs:** OG images show no text, or return 500 errors

### Pitfall 3: Sitemap Too Large for Single Response
**What goes wrong:** With 2400+ scholarships, sitemap.xml could exceed the 50,000 URL / 50MB limit
**Why it happens:** Google enforces strict sitemap size limits
**How to avoid:** Implement sitemap index pattern -- `/api/sitemap.xml` returns a sitemap index pointing to `/api/sitemap-scholarships.xml`, `/api/sitemap-pages.xml`, etc. For current scale (2400 scholarships), a single sitemap is fine, but the architecture should support splitting.
**Warning signs:** Google Search Console reports sitemap parsing errors

### Pitfall 4: Duplicate Content from Query Parameters
**What goes wrong:** Google indexes /scholarships?sort=prestige and /scholarships?sort=deadline as separate pages
**Why it happens:** Query params create unique URLs even though content is similar
**How to avoid:** Add `rel=canonical` pointing to the base URL (without query params) on all pages. Already specified in D-10.
**Warning signs:** Google Search Console shows duplicate pages with different canonical

### Pitfall 5: FAQPage Rich Results Restricted Since August 2023
**What goes wrong:** Implementing FAQPage structured data expecting rich results in Google SERP
**Why it happens:** Google restricted FAQ rich results to well-known government and health sites in August 2023
**How to avoid:** Still implement FAQPage structured data (it helps Google understand content and may be used by AI systems), but don't count on visible SERP rich results. The FAQ content itself provides user value and content uniqueness.
**Warning signs:** FAQ structured data validates in Rich Results Test but never appears in search results

### Pitfall 6: Degree URL Collision with $slug Route
**What goes wrong:** `/scholarships/phd` could match `$slug` route instead of dedicated degree page
**Why it happens:** TanStack Router matches routes by specificity -- static segments beat dynamic params, but only if defined as separate routes
**How to avoid:** The existing route structure already handles this: `scholarships/degree/$degree.tsx` is at a different path. Per D-14, degree URLs should be at `/scholarships/phd` not `/scholarships/degree/phd`. This requires a new route file at the `scholarships/` level (e.g., `scholarships/phd.tsx`) or a redirect. **Careful routing needed** -- a file like `scholarships/phd.tsx` is a static route that wins over `$slug.tsx` because static segments take priority in TanStack Router.
**Warning signs:** Navigating to /scholarships/phd shows the scholarship detail page instead of the degree landing page

### Pitfall 7: SSR JSON-LD Hydration Issues
**What goes wrong:** JSON-LD script tags rendered in SSR don't match client-side hydration
**Why it happens:** TanStack Router had a bug where script content was lost during client hydration (issue #6627)
**How to avoid:** Fixed in TanStack Router via PR #6653 (merged Feb 2026). Current installed version (1.168.2) includes this fix. Use the component-body pattern for JSON-LD as already established.
**Warning signs:** JSON-LD present in view-source but empty in DOM after hydration

### Pitfall 8: Font Loading for Satori
**What goes wrong:** Satori requires explicit font files (TTF/OTF/WOFF -- NOT WOFF2) and fails silently without them
**Why it happens:** Satori cannot use system fonts or auto-download fonts; they must be provided as ArrayBuffer
**How to avoid:** Bundle Inter (body) and Archivo Black (heading) font files with the OG image server route. Fetch from Google Fonts CDN or include as static assets.
**Warning signs:** OG images render with no visible text

## Code Examples

### Enhanced Scholarship JSON-LD (Grant Type)
```typescript
// Source: schema.org/Grant + existing buildScholarshipJsonLd pattern
function buildScholarshipJsonLd(scholarship: ScholarshipDetail) {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Grant",
    name: scholarship.title,
    description: scholarship.description,
    url: `https://scholarhub.io/scholarships/${scholarship.slug}`,
    provider: {
      "@type": "Organization",
      name: scholarship.provider_organization,
    },
    funder: {
      "@type": "Organization",
      name: scholarship.provider_organization,
    },
  };

  if (scholarship.application_deadline) {
    jsonLd.applicationDeadline = new Date(scholarship.application_deadline).toISOString();
  }
  if (scholarship.host_country) {
    jsonLd.areaServed = {
      "@type": "Place",
      name: getCountryName(scholarship.host_country),
    };
  }
  if (scholarship.eligibility_nationalities?.length) {
    jsonLd.eligibleRegion = scholarship.eligibility_nationalities.map(code => ({
      "@type": "Place",
      name: getCountryName(code),
    }));
  }
  if (scholarship.degree_levels?.length) {
    jsonLd.educationalLevel = scholarship.degree_levels;
  }
  if (scholarship.award_amount_max) {
    jsonLd.amount = {
      "@type": "MonetaryAmount",
      value: scholarship.award_amount_max,
      currency: scholarship.award_currency ?? "USD",
    };
  }
  if (scholarship.application_url) {
    jsonLd.url = scholarship.application_url;
    jsonLd.potentialAction = {
      "@type": "ApplyAction",
      target: scholarship.application_url,
    };
  }
  return jsonLd;
}
```

### BreadcrumbList JSON-LD
```typescript
// Source: schema.org/BreadcrumbList + Google BreadcrumbList documentation
function buildBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
```

### FAQPage JSON-LD
```typescript
// Source: schema.org/FAQPage + Google FAQ documentation
function buildFaqJsonLd(questions: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map(q => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  };
}
```

### ItemList JSON-LD (for collections/compare)
```typescript
// Source: schema.org/ItemList
function buildItemListJsonLd(items: { name: string; url: string; position: number }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: items.length,
    itemListElement: items.map(item => ({
      "@type": "ListItem",
      position: item.position,
      name: item.name,
      url: item.url,
    })),
  };
}
```

### Satori OG Image Template
```tsx
// Source: satori GitHub docs + Netlify Edge Functions guides
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";

async function generateOgImage(props: {
  title: string;
  subtitle: string;
  flag?: string;
  stats?: string;
}) {
  const svg = await satori(
    <div style={{
      width: 1200, height: 630, display: "flex", flexDirection: "column",
      justifyContent: "center", padding: 60,
      backgroundColor: "#FFF4E0",
      fontFamily: "Inter",
    }}>
      <div style={{ fontSize: 28, color: "#666", marginBottom: 16 }}>
        ScholarHub
      </div>
      <div style={{
        fontSize: 56, fontWeight: 900, fontFamily: "Archivo Black",
        lineHeight: 1.1, color: "#000",
      }}>
        {props.flag && <span style={{ marginRight: 16 }}>{props.flag}</span>}
        {props.title}
      </div>
      {props.subtitle && (
        <div style={{ fontSize: 28, color: "#444", marginTop: 24 }}>
          {props.subtitle}
        </div>
      )}
      {props.stats && (
        <div style={{ fontSize: 24, color: "#888", marginTop: 16 }}>
          {props.stats}
        </div>
      )}
    </div>,
    {
      width: 1200, height: 630,
      fonts: [
        { name: "Inter", data: interFontBuffer, weight: 400, style: "normal" },
        { name: "Archivo Black", data: archivoFontBuffer, weight: 400, style: "normal" },
      ],
    }
  );

  const resvg = new Resvg(svg);
  return resvg.render().asPng();
}
```

### Sitemap XML Generation
```typescript
// Source: Google Sitemaps protocol
function generateSitemapXml(urls: { loc: string; lastmod?: string; changefreq?: string; priority?: number }[]): string {
  const entries = urls.map(url => `
  <url>
    <loc>${escapeXml(url.loc)}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ""}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ""}
    ${url.priority !== undefined ? `<priority>${url.priority}</priority>` : ""}
  </url>`).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;
}
```

### Head Pattern with Full SEO Meta
```typescript
// Source: TanStack Router head() docs + existing codebase patterns
head: ({ params }) => ({
  meta: [
    { title: "Page Title | ScholarHub" },
    { name: "description", content: "Page description." },
    // Open Graph
    { property: "og:title", content: "Page Title | ScholarHub" },
    { property: "og:description", content: "Page description." },
    { property: "og:image", content: `/api/og?type=page&id=${params.id}` },
    { property: "og:type", content: "website" },
    { property: "og:url", content: `https://scholarhub.io/page/${params.id}` },
    // Twitter Cards
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: "Page Title | ScholarHub" },
    { name: "twitter:description", content: "Page description." },
    { name: "twitter:image", content: `/api/og?type=page&id=${params.id}` },
  ],
  links: [
    { rel: "canonical", href: `https://scholarhub.io/page/${params.id}` },
    { rel: "alternate", hreflang: "en", href: `https://scholarhub.io/page/${params.id}` },
  ],
}),
```

## D-14 URL Structure: Degree Routes at /scholarships/phd

Per D-14, degree URLs should be at `/scholarships/phd`, `/scholarships/masters`, `/scholarships/bachelors` -- NOT at `/scholarships/degree/phd`. The existing placeholder is at `/scholarships/degree/$degree.tsx`.

**Implementation approach:** Create new static route files for each degree level (e.g., `scholarships/phd.tsx`, `scholarships/masters.tsx`, `scholarships/bachelors.tsx`, `scholarships/postdoc.tsx`). In TanStack Router, static route segments always take priority over dynamic `$slug` segments, so `/scholarships/phd` will match the static phd.tsx route, not the dynamic `$slug.tsx` route.

Alternatively, add redirect rules in the existing `degree/$degree.tsx` route from `/scholarships/degree/phd` -> `/scholarships/phd` if old URLs need to be preserved.

**Preferred approach:** Create individual static route files. Each degree page needs distinct content anyway, and static routes are simpler than dynamic routing with a whitelist.

**Alternative approach (recommended for less code duplication):** Create a shared component and have each static route file import it with a degree prop. Or use a catch-all pattern where the route file checks if the slug is a known degree level and renders accordingly.

## D-08/D-12: Sitemap and Static Generation Strategy

**D-08 says build-time sitemap generation.** This is challenging because:
1. Convex data is only accessible at runtime (via HTTP API), not at Vite build time
2. The scholarship catalog changes frequently (new scholarships added via scraping)

**Recommended approach:** Use a TanStack Start server route (`/api/sitemap.xml`) that queries Convex at request time. Add aggressive `Cache-Control` headers (e.g., `max-age=3600`) so it's effectively cached. This is semantically equivalent to build-time generation but stays current.

**For D-12 (static HTML for landing pages):** TanStack Start already does SSR for all pages. Crawlers receive fully rendered HTML on first request. True "static generation" would require TanStack Start's `prerender` config, but with Convex as a data source, the data isn't available at build time. The current SSR approach is sufficient -- Google's crawler handles SSR pages well.

## OG Image Strategy (Claude's Discretion)

**Recommendation: satori + @resvg/resvg-js via TanStack Start server route**

**Why satori over og_edge:**
- og_edge is a Deno port of @vercel/og, designed for Edge Functions
- satori works directly in Node.js serverless (what Netlify uses for TanStack Start server routes)
- satori is the underlying engine of @vercel/og anyway
- Better documented for non-Vercel deployments

**Font strategy:**
- Fetch Inter and Archivo Black from Google Fonts API at function cold-start
- Cache font data in module-level variables (persists across warm invocations)
- Fallback: bundle TTF files as base64 in the source (increases bundle but guarantees availability)

**Caching:**
- Return `Cache-Control: public, max-age=86400, stale-while-revalidate=604800`
- OG images change rarely (only when scholarship data updates)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| FAQPage rich results for all sites | Restricted to govt/health sites | Aug 2023 | Still implement FAQPage JSON-LD (helps AI understanding) but no SERP rich results |
| Breadcrumbs in mobile SERP | Removed from mobile, kept on desktop | Jan 2025 | Still implement BreadcrumbList (desktop value + structured data value) |
| createAPIFileRoute | createServerFileRoute | TanStack Start v1 migration | Use createServerFileRoute for server routes |
| @type: "Scholarship" | Not a real Schema.org type | Always | Use @type: "Grant" with relevant properties |

**Deprecated/outdated:**
- `createAPIFileRoute` replaced by `createServerFileRoute` in TanStack Start
- Google mobile breadcrumb display removed Jan 2025 (still useful for desktop + structured data)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | web/vitest.config.ts |
| Quick run command | `cd web && npx vitest run --reporter=verbose` |
| Full suite command | `cd web && npx vitest run --reporter=verbose` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SEOG-01 | Scholarship JSON-LD contains required Grant properties | unit | `cd web && npx vitest run src/__tests__/seo-jsonld.test.ts -x` | Wave 0 |
| SEOG-01 | Scholarship head() returns proper meta tags | unit | `cd web && npx vitest run src/__tests__/seo-meta.test.ts -x` | Wave 0 |
| SEOG-02 | Country landing page stats query returns correct counts | unit | `cd web && npx vitest run src/__tests__/seo-country.test.ts -x` | Wave 0 |
| SEOG-02 | Country FAQ generation produces valid FAQPage JSON-LD | unit | `cd web && npx vitest run src/__tests__/seo-jsonld.test.ts -x` | Wave 0 |
| SEOG-03 | Degree landing page renders scholarship listings | unit | `cd web && npx vitest run src/__tests__/seo-degree.test.ts -x` | Wave 0 |
| SEOG-01 | Sitemap XML contains valid URLs | unit | `cd web && npx vitest run src/__tests__/seo-sitemap.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd web && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd web && npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `web/src/__tests__/seo-jsonld.test.ts` -- tests for all JSON-LD builder functions (Grant, BreadcrumbList, FAQPage, ItemList)
- [ ] `web/src/__tests__/seo-meta.test.ts` -- tests for meta tag builder helpers
- [ ] `web/src/__tests__/seo-sitemap.test.ts` -- tests for sitemap XML generation
- [ ] `web/src/__tests__/seo-country.test.ts` -- tests for country stats query and landing content
- [ ] `web/src/__tests__/seo-degree.test.ts` -- tests for degree landing page content generation

## Open Questions

1. **Site domain for canonical URLs and sitemap**
   - What we know: The site is deployed on Netlify, but the production domain isn't confirmed in the codebase
   - What's unclear: Is it scholarhub.io, scholarhub.com, or a Netlify subdomain?
   - Recommendation: Use an environment variable (e.g., `VITE_SITE_URL`) for the canonical domain. Default to `https://scholarhub.io` and make it configurable.

2. **Google Analytics 4 Measurement ID**
   - What we know: D-21 requires GA4 setup
   - What's unclear: Whether a GA4 property has already been created
   - Recommendation: Add GA4 script injection to `__root.tsx` using an env var (`VITE_GA4_ID`). Leave it empty in dev, set in production Netlify environment.

3. **Google Search Console verification method**
   - What we know: D-20 requires verification meta tag
   - What's unclear: Whether verification has been initiated
   - Recommendation: Add a meta tag slot in `__root.tsx` controlled by env var (`VITE_GSC_VERIFICATION`). Site owner adds the verification code in Netlify env vars.

4. **Degree URL routing strategy (D-14)**
   - What we know: D-14 wants /scholarships/phd, existing code is at /scholarships/degree/$degree
   - What's unclear: Whether to create individual static route files or use a different routing approach
   - Recommendation: Create individual static route files (phd.tsx, masters.tsx, bachelors.tsx, postdoc.tsx) that share a common component. Static routes take priority over dynamic $slug in TanStack Router. Keep the old /scholarships/degree/ routes as redirects.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `$slug.tsx`, `country/$country.tsx`, `degree/$degree.tsx`, `__root.tsx` -- established head() patterns, JSON-LD injection, SSR setup
- [Schema.org/Grant](https://schema.org/Grant) -- Grant type properties for structured data
- [Schema.org/BreadcrumbList](https://schema.org/BreadcrumbList) -- breadcrumb structured data
- [Google BreadcrumbList documentation](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb) -- implementation requirements
- [Google FAQPage documentation](https://developers.google.com/search/docs/appearance/structured-data/faqpage) -- eligibility restrictions since Aug 2023
- [satori GitHub](https://github.com/vercel/satori) -- JSX to SVG library, CSS subset support, font requirements
- [TanStack Router head() documentation](https://tanstack.com/router/v1/docs/framework/react/guide/document-head-management) -- meta, links, scripts arrays
- [TanStack Start SEO guide](https://tanstack.com/start/latest/docs/framework/react/guide/seo) -- server routes for sitemap, prerender configuration
- [TanStack Start server routes](https://tanstack.com/start/latest/docs/framework/react/guide/server-routes) -- createServerFileRoute API
- npm registry: satori 0.26.0, @resvg/resvg-js 2.6.2 (verified 2026-03-23)

### Secondary (MEDIUM confidence)
- [Netlify TanStack Start guide](https://docs.netlify.com/build/frameworks/framework-setup-guides/tanstack-start/) -- Netlify deployment specifics
- [Netlify OG image generation guide](https://developers.netlify.com/guides/generate-dynamic-open-graph-images-using-netlify-edge-functions/) -- satori + Netlify functions pattern
- [Google FAQ schema changes (Aug 2023)](https://developers.google.com/search/blog/2023/08/howto-faq-changes) -- restrictions on FAQ rich results
- [TanStack Router issue #6627](https://github.com/TanStack/router/issues/6627) -- JSON-LD hydration bug (fixed in current version)

### Tertiary (LOW confidence)
- Schema.org "Scholarship" type -- verified as NOT existing via exhaustive search of schema.org. Multiple searches returned only Grant, FundingScheme, EducationalOccupationalProgram as closest alternatives.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- satori and resvg-js are well-established, versions verified from npm registry
- Architecture: HIGH -- patterns derived from existing codebase with TanStack Router/Start documentation
- Pitfalls: HIGH -- Schema.org type verified as non-existent, FAQPage restrictions verified from Google docs, font loading requirements from satori docs
- SEO implementation: HIGH -- all patterns verified against existing codebase + official documentation

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (30 days -- SEO standards and TanStack Start are stable)
