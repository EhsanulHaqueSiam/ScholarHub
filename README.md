# ScholarHub

A comprehensive scholarship discovery platform that aggregates international scholarships from 250+ sources, deduplicates them, and provides a fast, searchable directory for students worldwide.

**Live:** [thescholarhub.netlify.app](https://thescholarhub.netlify.app/)

---

## Screenshots

### Scholarship Directory
Browse, search, and filter scholarships by country, degree level, field of study, funding type, and prestige.

![Scholarship Directory](docs/screenshots/scholarships-listing.png)

### Search & Autocomplete
Full-text search with instant autocomplete results.

![Search](docs/screenshots/search-filter.png)

### Scholarship Detail
Detailed pages with eligibility, funding breakdown, application info, and related scholarships.

![Scholarship Detail](docs/screenshots/scholarship-detail.png)

### Closing Soon
Dedicated view for scholarships with upcoming deadlines.

![Closing Soon](docs/screenshots/closing-soon.png)

---

## Features

### Discovery & Search
- Full-text search with autocomplete
- Filter by country, degree level (Bachelor/Master's/PhD/Postdoc), field of study, funding type, and prestige tier
- Nationality-aware recommendations (suggests scholarships you're eligible for)
- Sort by deadline, prestige, newest, or award amount
- Grid and list view toggle
- Closing Soon page for upcoming deadlines

### Country & Degree Landing Pages
- Dedicated pages per country (e.g., `/scholarships/country/uk`) and degree level (e.g., `/scholarships/degree/master`)
- Pre-filtered results with SEO-optimized metadata

### Scholarship Detail Pages
- Eligibility criteria, funding details, application timeline
- Country-specific info (cost of living, visa requirements, admission process)
- Related scholarships
- Share and copy link

### Admin Dashboard
- Review queue for pending scholarships (approve/reject/edit)
- Source trust manager (auto-publish vs manual review per source)
- Collections manager (curated, filter-based scholarship collections)
- Tags manager
- Stats bar with counts by status

### SEO
- Dynamic Open Graph image generation (Satori)
- XML sitemap with scholarship, country, and degree pages
- JSON-LD structured data
- Canonical URLs, hreflang tags, robots.txt

### Scraping Pipeline
- **250+ source configs** across aggregators, government programs, official programs, and foundations
- 7 scraping methods: HTML (CSS selectors), API (JSON), RSS, JSON-LD, Scrapling (Cloudflare bypass), AJAX, Inertia.js
- Wave-based source scheduling (waves 1-7 by source type and priority)
- Automatic deduplication by match key (title + organization + country)
- Cycle detection for recurring annual scholarships
- Source health monitoring (consecutive failure tracking, yield analysis)
- Trust-based workflow: trusted sources auto-publish, others go to review queue

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 19 | UI framework |
| TanStack Start / Router | File-based routing with SSR |
| TanStack React Query | Data fetching and caching |
| Tailwind CSS 4 | Styling |
| Radix UI | Accessible components |
| Vite | Build tool |
| Netlify | Hosting with SSR via Netlify Functions |

### Backend
| Technology | Purpose |
|---|---|
| Convex | Real-time database, backend functions, full-text search |
| Satori | Server-side OG image generation |

### Scraping Pipeline
| Technology | Purpose |
|---|---|
| Python 3.12+ | Pipeline runtime |
| httpx | Async HTTP client |
| Scrapling | Cloudflare-protected site scraping |
| BeautifulSoup | HTML parsing |
| Click | CLI framework |
| structlog | Structured logging |
| Convex Python SDK | Direct database ingestion |

### Tooling
| Tool | Purpose |
|---|---|
| TypeScript | Type safety across frontend and backend |
| Vitest | Frontend tests |
| pytest | Pipeline tests |
| Ruff | Python linting and formatting |
| uv | Python package manager |
| Bun | JavaScript package manager |

---

## Project Structure

```
ScholarHub/
├── web/                              # Frontend application
│   ├── src/
│   │   ├── routes/                   # File-based routing (TanStack)
│   │   │   ├── scholarships/         # Directory, detail, country, degree pages
│   │   │   ├── admin/                # Admin dashboard
│   │   │   ├── collections/          # Curated collections
│   │   │   └── api/                  # OG images, sitemap, robots.txt
│   │   ├── components/               # React components
│   │   │   ├── admin/                # Review queue, tags manager
│   │   │   ├── directory/            # Search bar, filters, cards
│   │   │   ├── detail/               # Scholarship detail UI
│   │   │   └── comparison/           # Side-by-side comparison
│   │   ├── hooks/                    # Custom React hooks
│   │   └── lib/                      # Utilities, SEO helpers, filters
│   ├── convex/                       # Backend functions & schema
│   │   ├── schema.ts                 # Database schema
│   │   ├── directory.ts              # Scholarship queries
│   │   ├── aggregation.ts            # Deduplication & merging
│   │   ├── scraping.ts               # Pipeline ingestion endpoints
│   │   ├── admin.ts                  # Admin mutations
│   │   ├── collections.ts            # Collection CRUD
│   │   ├── seo.ts                    # Sitemap & OG data
│   │   └── tags.ts                   # Tag management
│   └── package.json
│
├── scraping/                         # Python scraping pipeline
│   ├── src/scholarhub_pipeline/
│   │   ├── cli.py                    # CLI entry point
│   │   ├── configs/                  # 250+ source configurations
│   │   ├── scrapers/                 # HTML, API, RSS, JSON-LD, Scrapling scrapers
│   │   ├── pipeline/                 # Runner, scheduler, buffer
│   │   ├── ingestion/                # Convex client, batch accumulator, dedup
│   │   └── monitoring/               # Health tracking, heartbeat, rot detection
│   ├── sources/                      # Source catalogs (JSON)
│   ├── tests/
│   └── pyproject.toml
│
└── README.md
```

---

## Pipeline Architecture

```
Source Configs (250+)
        │
        ▼
   ┌─────────┐     ┌──────────┐     ┌────────────┐
   │ Discover │────▶│ Schedule │────▶│   Scrape   │
   │ Configs  │     │ (Waves)  │     │ (7 methods)│
   └─────────┘     └──────────┘     └────────────┘
                                           │
                                           ▼
                                    ┌────────────┐
                                    │  Deduplicate│
                                    │  (per source)│
                                    └────────────┘
                                           │
                                           ▼
                                    ┌────────────┐
                                    │   Batch    │
                                    │  Ingest    │──────▶ Convex raw_records
                                    └────────────┘
                                           │
                                           ▼
                                    ┌────────────┐
                                    │ Aggregate  │
                                    │ & Merge    │──────▶ Convex scholarships
                                    └────────────┘
                                           │
                                           ▼
                                  ┌──────────────────┐
                                  │  Auto-publish or  │
                                  │  Review Queue     │
                                  └──────────────────┘
```

---

## Getting Started

### Prerequisites
- Node.js 20+ / Bun
- Python 3.12+ / uv
- Convex account

### Web App

```bash
cd web
bun install
npx convex dev    # Start Convex backend
bun run dev       # Start frontend dev server
```

### Scraping Pipeline

```bash
cd scraping
uv sync
uv run scholarhub scrape run --wave 1    # Run wave 1 sources
uv run scholarhub scrape run --source scholarshipportal  # Run single source
uv run scholarhub status                 # Check pipeline status
```

---

## License

All rights reserved.
