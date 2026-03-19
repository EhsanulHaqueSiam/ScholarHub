# Technology Stack

**Project:** ScholarHub - Scholarship Aggregation Platform
**Researched:** 2026-03-20

## Recommended Stack

### Core Frontend

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React | 19.x | UI framework | Already decided. Mature ecosystem, universal hiring pool |
| TanStack Router | ~1.166.x | File-based routing for SPA | Type-safe routing with automatic code splitting. Use as standalone SPA router with Vite — do NOT use TanStack Start (overkill for an SPA backed by Convex) |
| TanStack Query | 5.x | Server state management | Convex has a first-party TanStack Query integration (`@convex-dev/react-query`) that provides live-updating queries via WebSocket instead of polling |
| @convex-dev/react-query | latest | Convex + TanStack Query bridge | Gives `convexQuery()` options factory for `useQuery()` with automatic reactive updates and invalidation. No stale data, no manual refetching |
| Tailwind CSS | 4.2.x | Styling | Use `@tailwindcss/vite` plugin (not PostCSS). v4 is 5x faster full builds, 100x faster incremental |
| shadcn/ui | latest | Component library | Copy-paste components built on Radix + Tailwind. Own the code, full customization. Industry default in 2026 |
| TypeScript | 5.x | Type safety | Non-negotiable for a project this size |

**Confidence:** HIGH - All versions verified via npm registries and official docs.

### Build & Runtime

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vite | 8.x | Build tool + dev server | Ships with Rolldown (Rust-based bundler), 10-30x faster builds. Use with `@tanstack/router-plugin/vite` and `@tailwindcss/vite` |
| Bun | 1.3.x | Package manager + script runner | Fast installs, fast script startup. Use Bun as the package manager/runtime, Vite as the build tool. They complement each other |

**Confidence:** HIGH - Versions verified. Bun + Vite is the recommended 2026 default pattern.

### Backend & Database

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Convex (npm) | 1.33.x | Backend-as-a-service: database, server functions, real-time sync | Already decided. No ORM, no server to manage. Reactive queries update the UI automatically |
| Convex Python client | 0.7.0 | Bridge scraping output to Convex | Alpha but functional. Calls mutations directly from Python via `ConvexClient` |

**Confidence:** HIGH for npm package (verified). MEDIUM for Python client (pre-1.0 alpha, API may change).

### Scraping Infrastructure

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Scrapling | 0.4.2 | Primary scraping framework | Has its own spider framework with multi-session support (HTTP, dynamic, stealth in one spider). Built-in Cloudflare Turnstile bypass. Adaptive element tracking survives website changes. Replaces the need for Scrapy in most cases |
| Scrapy | 2.14.x | Heavy-duty crawling backup | Only if Scrapling's spider framework proves insufficient for 1000+ source crawls. Scrapy has a deeper plugin ecosystem (scrapy-redis for distributed crawling, deltafetch for incremental) |
| GitHub Actions | N/A | Scheduled scraping automation | Free for public repos, 2000 min/month for private. Cron-scheduled workflows run Python scrapers on Ubuntu runners |

**Confidence:** HIGH for Scrapling (verified v0.4.2 on PyPI, production-ready with 92% test coverage). MEDIUM for the Scrapy-is-unnecessary claim (Scrapling spider framework is newer, needs validation at scale).

### Hosting

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Netlify | N/A | Static SPA hosting | Already decided. Free tier: 100GB bandwidth, 300 build minutes, 125K serverless function invocations/month |

**Confidence:** HIGH

### Auth (Deferred)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Clerk | latest | User authentication | Already decided. Convex has official Clerk integration with webhook sync. Deferred to post-MVP |

**Confidence:** HIGH - Official integration exists.

### Analytics (Deferred)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Sentry | latest | Error tracking | Deferred |
| PostHog | latest | Usage analytics, heatmaps, retention | Deferred |

**Confidence:** HIGH - Standard choices, well-documented.

## Critical Architecture Decision: Scrapling vs Scrapy

**Recommendation: Start with Scrapling only. Add Scrapy only if needed.**

Scrapling v0.4 (Feb 2026) now includes its own spider/crawling framework with:
- Async spider API with `start_urls`, `parse` callbacks, concurrency control
- Multi-session routing: send protected pages through `StealthyFetcher`, fast-track others through `Fetcher`
- Built-in proxy rotation via `ProxyRotator`
- Checkpoint-based pause/resume for long crawls
- JSON/JSONL export built-in
- 92% test coverage, described as "battle tested"

This means you do NOT need both Scrapy and Scrapling. Scrapling handles:
- Simple HTTP scraping (Fetcher) - fastest
- JavaScript-rendered pages (DynamicFetcher) - Playwright-based
- Cloudflare/anti-bot protected sites (StealthyFetcher) - built-in bypass

**When you would add Scrapy:**
- If you need distributed crawling across multiple machines (scrapy-redis)
- If you need Scrapy's mature middleware ecosystem (e.g., AutoThrottle, HttpCache)
- If Scrapling's scheduler can't handle 1000+ sources efficiently

**When you would NOT need Scrapy:**
- Single-machine crawling with concurrency control (Scrapling handles this)
- Mixed protection levels across sources (Scrapling's multi-session routing)
- Checkpoint/resume for failed crawls (Scrapling has this built-in)

## Critical Architecture Decision: Python-to-Convex Bridge

**Two options, use both strategically:**

### Option A: Convex Python Client (for scraping scripts)
```python
from convex import ConvexClient
client = ConvexClient("https://your-deployment.convex.cloud")
client.mutation("scholarships:upsert", {
    "title": "DAAD Scholarship",
    "country": "Germany",
    ...
})
```
- Direct mutation calls from Python
- Uses deploy key for admin auth
- Simple, no HTTP endpoint setup needed
- **Limitation:** Pre-1.0 alpha, no built-in bulk insert, each mutation is a separate call

### Option B: Convex HTTP API (for bulk ingestion)
```python
import requests
url = "https://your-deployment.convex.cloud/api/mutation"
headers = {
    "Authorization": "Convex <deploy_key>",
    "Content-Type": "application/json"
}
body = {
    "path": "scholarships:bulkUpsert",
    "args": {"scholarships": batch_of_scholarships},
    "format": "json"
}
requests.post(url, headers=headers, json=body)
```
- Call any Convex mutation via HTTP POST
- Can batch items into a single mutation call (up to 16,000 documents written per transaction)
- More control over request/response handling

**Recommendation:** Use the HTTP API approach with batched mutations. Write a Convex mutation that accepts an array and inserts/updates in a loop (single transaction). Call it from Python with `requests`. This avoids the alpha Python client dependency and gives you bulk insert in one transaction.

## Convex Limits to Design Around

| Limit | Value | Implication |
|-------|-------|-------------|
| Document size | 1 MiB | Scholarship entries are small, no issue |
| Documents written per transaction | 16,000 | Batch up to 16K scholarships per mutation call |
| Data written per transaction | 16 MiB | ~16K small documents fit easily |
| Documents scanned per query | 32,000 | Use indexes for all filtered queries |
| Function execution (query/mutation) | 1 second | Keep mutations fast, offload heavy work to actions |
| Function execution (action) | 10 minutes | Enough for bulk processing |
| Indexes per table | 32 | Plan indexes carefully for scholarship filters |
| Free tier function calls | 1M/month | Monitor usage with real-time queries |
| Free tier storage | 0.5 GiB | Plenty for text-only scholarship data |
| Array elements per document | 8,192 | Don't store unbounded arrays in documents |
| Outstanding scheduled functions | 1M | Plenty for periodic scraping triggers |

## Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-query-devtools | 5.x | Query debugging | Development only |
| @tanstack/router-devtools | ~1.166.x | Route debugging | Development only |
| date-fns | 4.x | Date manipulation | Deadline parsing, expiry calculations |
| lucide-react | latest | Icons | UI icons throughout the app |
| clsx + tailwind-merge | latest | Class name utilities | Conditional Tailwind classes (shadcn uses these) |
| zod | 3.x | Schema validation | Form validation, API response validation |
| convex-helpers | latest | Convex utility functions | Validators, custom functions, migrations |

**Confidence:** HIGH for core libraries. MEDIUM for specific version numbers (check at install time).

## What NOT to Use

| Technology | Why Not |
|------------|---------|
| TanStack Start | Overkill. This is an SPA with Convex backend, not an SSR app. Use TanStack Router standalone with Vite |
| Next.js / Remix | Same reason. Convex handles the backend; you just need a static SPA shell |
| Prisma / Drizzle / any ORM | Convex IS the database + backend. No ORM needed or possible |
| Express / Fastify / any server framework | Convex server functions replace API routes |
| Redux / Zustand | TanStack Query + Convex reactive queries handle server state. Use React state/context for client state |
| Axios | Use native `fetch` or `requests` (Python). No need for a wrapper |
| BeautifulSoup | Scrapling's parser is faster and has adaptive element tracking |
| Selenium / Puppeteer | Scrapling's StealthyFetcher replaces these with better anti-detection |
| cloudscraper | Deprecated against modern Cloudflare. Scrapling's StealthyFetcher is the current solution |
| Playwright directly | Scrapling wraps Playwright with stealth hardening. Use Scrapling's DynamicFetcher/StealthyFetcher instead |
| MongoDB / PostgreSQL | Convex replaces external databases entirely |

## Installation

### Frontend (Bun)
```bash
# Core
bun add react react-dom convex @convex-dev/react-query @tanstack/react-query @tanstack/react-router

# UI
bun add tailwindcss @tailwindcss/vite clsx tailwind-merge lucide-react

# Utilities
bun add date-fns zod convex-helpers

# Dev dependencies
bun add -D vite @vitejs/plugin-react @tanstack/router-plugin typescript @types/react @types/react-dom @tanstack/react-query-devtools @tanstack/react-router-devtools
```

### Scraping (Python / pip or uv)
```bash
# Core scraping
pip install "scrapling[fetchers]"
scrapling install  # Downloads browsers

# Convex bridge (pick one approach)
pip install convex  # Option A: Python client
pip install requests  # Option B: HTTP API (likely already installed)

# Utilities
pip install python-dateutil  # Date parsing from varied formats
```

### Vite Config
```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
});
```

## GitHub Actions Workflow Pattern

```yaml
# .github/workflows/scrape.yml
name: Scholarship Scraper
on:
  schedule:
    - cron: '0 6,18 * * *'  # Twice daily at 6 AM and 6 PM UTC
  workflow_dispatch:  # Manual trigger with up to 25 inputs

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.13'
          cache: 'pip'
      - run: pip install -r requirements.txt
      - run: scrapling install
      - run: python scraper/run.py
        env:
          CONVEX_URL: ${{ secrets.CONVEX_URL }}
          CONVEX_DEPLOY_KEY: ${{ secrets.CONVEX_DEPLOY_KEY }}
```

**Free tier:** 2,000 minutes/month for private repos. Each scraping run ~5-15 minutes. At twice daily = ~300-900 min/month. Well within limits.

## Sources

- [Convex Best Practices](https://docs.convex.dev/understanding/best-practices/)
- [Convex Index Performance](https://docs.convex.dev/database/reading-data/indexes/indexes-and-query-perf)
- [Convex Limits](https://docs.convex.dev/production/state/limits)
- [Convex HTTP API](https://docs.convex.dev/http-api/)
- [Convex HTTP Actions](https://docs.convex.dev/functions/http-actions)
- [Convex Python Client](https://github.com/get-convex/convex-py)
- [Convex with TanStack Query](https://docs.convex.dev/client/tanstack/tanstack-query/)
- [Convex Full Text Search](https://docs.convex.dev/search/text-search)
- [Convex Pagination](https://docs.convex.dev/database/pagination)
- [TanStack Router with Vite](https://tanstack.com/router/latest/docs/installation/with-vite)
- [TanStack Start with Convex](https://docs.convex.dev/client/tanstack/tanstack-start/)
- [Scrapling PyPI](https://pypi.org/project/scrapling/)
- [Scrapling GitHub](https://github.com/D4Vinci/Scrapling)
- [Scrapling Docs - Fetcher Choice](https://scrapling.readthedocs.io/en/latest/fetching/choosing.html)
- [Scrapling Docs - Spider Architecture](https://scrapling.readthedocs.io/en/latest/spiders/architecture.html)
- [Scrapy Release Notes](https://docs.scrapy.org/en/latest/news.html)
- [Tailwind CSS v4](https://tailwindcss.com/blog/tailwindcss-v4)
- [Vite 8 Announcement](https://vite.dev/blog/announcing-vite8)
- [shadcn/ui](https://ui.shadcn.com)
- [Netlify Pricing](https://www.netlify.com/pricing/)
- [GitHub Actions Billing](https://docs.github.com/en/actions/concepts/billing-and-usage)
- [Convex Pricing](https://www.convex.dev/pricing)
