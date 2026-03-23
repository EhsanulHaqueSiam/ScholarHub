# Phase 9: SEO & Growth - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-23
**Phase:** 09-seo-growth
**Areas discussed:** Structured Data Depth, Landing Page SEO Strategy, Technical SEO Infrastructure, Content Uniqueness, URL Structure & Slugs, OG Image Strategy, Performance & Crawl Budget, Multi-language / hreflang, Analytics & Tracking, Scholarship Detail SEO Gaps

---

## Structured Data Depth

| Option | Description | Selected |
|--------|-------------|----------|
| Full Schema.org suite | Scholarship + BreadcrumbList + FAQPage + ItemList + Organization. Max rich snippets | ✓ |
| Scholarship + Breadcrumbs only | Simpler, still effective | |
| You decide | Claude picks | |

**User's choice:** Full Schema.org suite
**Notes:** Also selected ItemList for collections/comparison pages and auto-generated FAQs for landing pages

---

## Landing Page SEO Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Dynamic stats + templated intros | Data-driven uniqueness per page | ✓ |
| Static curated copy | Hand-written, doesn't scale | |
| Minimal filtered list | Meta tags only | |

**User's choice:** Dynamic stats + templated intros with cross-link sections. Top 20 countries + all degrees.

---

## Technical SEO Infrastructure

**User selected all four options:**
- Sitemap.xml (build-time static generation)
- Robots.txt
- Canonical URLs
- Open Graph + Twitter Cards

---

## Content Uniqueness

| Option | Description | Selected |
|--------|-------------|----------|
| Stats + templated prose + FAQs | Rich per-page content | ✓ |
| Minimal stats only | Faster but thin content risk | |

**User's choice:** Full content approach with auto-generated meta descriptions

---

## URL Structure & Slugs

**Country URLs:** Lowercase full names (/scholarships/country/germany)
**Degree URLs:** Common search terms at top level (/scholarships/phd, /scholarships/masters)

---

## OG Image Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Static branded fallback | Simple, one image | |
| Dynamic per-page images | Unique OG per page with title + info overlay | ✓ |

**User's choice:** Dynamic per-page images

---

## Performance & Crawl Budget

**Rendering:** Static HTML generation at build time
**Performance target:** 90+ Lighthouse SEO score

---

## Multi-language / hreflang

| Option | Description | Selected |
|--------|-------------|----------|
| English-only | No hreflang | |
| Add hreflang prep | hreflang=en as future-proofing | ✓ |

---

## Analytics & Tracking

| Option | Description | Selected |
|--------|-------------|----------|
| GSC verification only | Minimal | |
| Full analytics setup | GSC + GA4 + structured data monitoring | ✓ |
| Skip analytics | Focus on markup only | |

---

## Scholarship Detail SEO Gaps

**User selected all enhancements:**
- Provider/organization info
- Eligibility & requirements
- Application details
- Breadcrumb structured data

---

## Claude's Discretion

- OG image generation library
- Templated prose wording
- FAQ question selection algorithm
- Sitemap priority/changefreq values
- GA4 event tracking specifics

## Deferred Ideas

- Multi-language content and full i18n routing
- PostHog analytics
- AI-generated unique content
- Social media auto-posting
- Google News / Discover optimization
- AMP pages
