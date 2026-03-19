# Architecture Research

**Domain:** Scholarship aggregation platform (scraping + admin + public directory)
**Researched:** 2026-03-20
**Confidence:** HIGH

## System Overview

```
                   SCRAPING LAYER (Python, GitHub Actions)
    ┌──────────────────────────────────────────────────────────┐
    │  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
    │  │ Scrapy   │  │ Scrapling│  │ API      │               │
    │  │ Spiders  │  │ Spiders  │  │ Clients  │               │
    │  └────┬─────┘  └────┬─────┘  └────┬─────┘               │
    │       └──────────────┼─────────────┘                     │
    │                      ▼                                   │
    │          ┌───────────────────────┐                        │
    │          │   Scrapy Pipelines    │                        │
    │          │  (clean, normalize,   │                        │
    │          │   deduplicate)        │                        │
    │          └───────────┬───────────┘                        │
    └──────────────────────┼───────────────────────────────────┘
                           │ Convex Python Client
                           ▼
    ┌──────────────────────────────────────────────────────────┐
    │                CONVEX BACKEND                             │
    │                                                          │
    │  ┌────────────────┐  ┌──────────────────┐                │
    │  │ HTTP Actions   │  │ Internal         │                │
    │  │ (ingestion     │  │ Mutations        │                │
    │  │  endpoints)    │  │ (batch upsert,   │                │
    │  └───────┬────────┘  │  dedup, merge)   │                │
    │          │           └────────┬─────────┘                │
    │          └────────────────────┤                           │
    │                               ▼                          │
    │  ┌────────────────────────────────────────────┐          │
    │  │              DATABASE TABLES                │          │
    │  │                                             │          │
    │  │  raw_scholarships   scholarships            │          │
    │  │  sources            scholarship_sources     │          │
    │  │  admin_actions      scrape_runs             │          │
    │  └───────────┬─────────────────────────────────┘          │
    │              │                                            │
    │  ┌───────────┴─────────────────────┐                     │
    │  │  Queries (public + admin)       │                     │
    │  │  - filtered listings            │                     │
    │  │  - search indexes               │                     │
    │  │  - admin review queues          │                     │
    │  └───────────┬─────────────────────┘                     │
    └──────────────┼───────────────────────────────────────────┘
                   │ Real-time subscriptions (useQuery)
                   ▼
    ┌──────────────────────────────────────────────────────────┐
    │            FRONTEND (React + TanStack Router)             │
    │                                                          │
    │  ┌────────────────┐  ┌──────────────────┐                │
    │  │ Public Pages   │  │ Admin Dashboard  │                │
    │  │ - Directory    │  │ - Review queue   │                │
    │  │ - Detail page  │  │ - Source mgmt    │                │
    │  │ - Filters      │  │ - Scrape status  │                │
    │  └────────────────┘  └──────────────────┘                │
    └──────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Scrapy Spiders | Crawl standard websites, extract scholarship data | One spider per source or source-family, yields structured items |
| Scrapling Spiders | Crawl Cloudflare-protected and JS-heavy sites | Scrapling fetcher with anti-bot bypass, feeds into same pipeline |
| API Clients | Pull from sources that offer APIs (e.g., aggregator APIs) | Python requests/httpx, same item schema output |
| Scrapy Pipelines | Clean, normalize, validate, and push data to Convex | Pipeline chain: validate -> clean -> normalize -> push |
| Convex HTTP Actions | Receive scraped data from Python, route to mutations | Authenticated endpoints at `*.convex.site`, call internal mutations |
| Convex Mutations | Write/update scholarship data with deduplication logic | Batch upsert, merge enrichment, status transitions |
| Convex Queries | Serve filtered, paginated, searchable data | Indexes + search indexes for efficient public/admin reads |
| Public Frontend | Searchable, filterable scholarship directory | TanStack Router pages with Convex `useQuery` subscriptions |
| Admin Frontend | Review, approve, reject, enrich scholarships | Protected routes, mutation calls for status changes |

## Recommended Project Structure

```
ScholarHub/
├── convex/                    # Convex backend (auto-deployed)
│   ├── schema.ts              # Database schema definition
│   ├── http.ts                # HTTP router for ingestion endpoints
│   ├── _generated/            # Convex codegen (gitignored)
│   ├── scholarships/          # Scholarship domain logic
│   │   ├── queries.ts         # Public + admin queries
│   │   ├── mutations.ts       # Status changes, enrichment
│   │   └── ingestion.ts       # Batch upsert from scraper
│   ├── sources/               # Source management
│   │   ├── queries.ts
│   │   └── mutations.ts
│   ├── admin/                 # Admin-specific functions
│   │   ├── queries.ts         # Review queue, stats
│   │   └── mutations.ts       # Approve, reject, edit
│   ├── scrapeRuns/            # Scrape run tracking
│   │   ├── queries.ts
│   │   └── mutations.ts
│   └── lib/                   # Shared helpers
│       ├── dedup.ts           # Deduplication logic
│       └── validators.ts      # Shared argument validators
│
├── src/                       # React frontend
│   ├── routes/                # TanStack Router file-based routes
│   │   ├── __root.tsx         # Root layout
│   │   ├── index.tsx          # Landing / directory page
│   │   ├── scholarships/
│   │   │   ├── index.tsx      # Filterable listing
│   │   │   └── $scholarshipId.tsx  # Detail page
│   │   └── admin/
│   │       ├── index.tsx      # Admin dashboard
│   │       ├── review.tsx     # Review queue
│   │       └── sources.tsx    # Source management
│   ├── components/            # Shared UI components
│   │   ├── ui/                # Base components (buttons, cards, etc.)
│   │   ├── scholarship/       # Scholarship-specific components
│   │   └── admin/             # Admin-specific components
│   ├── lib/                   # Frontend utilities
│   └── main.tsx               # App entry point
│
├── scraper/                   # Python scraping system (separate runtime)
│   ├── pyproject.toml         # Python project config
│   ├── scholarhub_scraper/
│   │   ├── spiders/           # Scrapy + Scrapling spiders
│   │   │   ├── base.py        # Base spider with common logic
│   │   │   ├── daad.py        # Example: DAAD spider
│   │   │   ├── erasmus.py     # Example: Erasmus spider
│   │   │   └── ...
│   │   ├── api_clients/       # API-based data fetchers
│   │   ├── pipelines/         # Scrapy item pipelines
│   │   │   ├── clean.py       # Data cleaning
│   │   │   ├── normalize.py   # Field normalization
│   │   │   ├── validate.py    # Schema validation
│   │   │   └── convex_push.py # Push to Convex via Python client
│   │   ├── items.py           # Scrapy item definitions
│   │   ├── settings.py        # Scrapy settings
│   │   └── middlewares.py     # Custom middlewares
│   └── tests/
│
├── .github/
│   └── workflows/
│       ├── scrape-daily.yml   # Daily scrape of high-priority sources
│       ├── scrape-weekly.yml  # Weekly scrape of lower-priority sources
│       └── scrape-manual.yml  # Manual trigger for specific sources
│
├── package.json               # Frontend + Convex deps (Bun)
├── convex.json                # Convex project config
├── tsconfig.json
└── .env.local                 # Convex URL, deploy key (gitignored)
```

### Structure Rationale

- **`convex/` at root:** Convex requires this directory at the project root. Organizing by domain (scholarships/, sources/, admin/) keeps related queries and mutations together rather than by function type.
- **`src/routes/` file-based:** TanStack Router's file-based routing makes the URL structure visible in the filesystem. Admin routes are grouped under `admin/` for logical separation.
- **`scraper/` as sibling directory:** The Python scraper is a completely separate runtime. It lives in the same repo for coordination but has its own dependency management (`pyproject.toml`), its own tests, and runs exclusively in GitHub Actions -- never on the frontend host.
- **`.github/workflows/` split by frequency:** Different sources need different scrape frequencies. Splitting workflows avoids hitting GitHub Actions time limits and makes failures isolated.

## Architectural Patterns

### Pattern 1: Two-Stage Ingestion (Raw then Canonical)

**What:** Scraped data lands in a `raw_scholarships` staging table first, then gets processed into the canonical `scholarships` table after deduplication and admin review.

**When to use:** Always. This is the core data flow pattern for the entire system.

**Trade-offs:**
- PRO: Raw data preserved for debugging and re-processing
- PRO: Admin can see exactly what was scraped vs. what was published
- PRO: Deduplication runs against raw records, not live data
- CON: Two tables to manage, slightly more storage

**Example:**
```typescript
// convex/scholarships/ingestion.ts
import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

export const ingestBatch = internalMutation({
  args: {
    items: v.array(v.object({
      sourceId: v.id("sources"),
      title: v.string(),
      url: v.string(),
      deadline: v.optional(v.string()),
      amount: v.optional(v.string()),
      country: v.optional(v.string()),
      degreeLevel: v.optional(v.array(v.string())),
      eligibility: v.optional(v.string()),
      description: v.optional(v.string()),
      scrapedAt: v.number(),
    })),
    scrapeRunId: v.id("scrapeRuns"),
  },
  handler: async (ctx, args) => {
    for (const item of args.items) {
      await ctx.db.insert("rawScholarships", {
        ...item,
        scrapeRunId: args.scrapeRunId,
        status: "pending",  // pending -> matched | new | rejected
        processedAt: undefined,
      });
    }
  },
});
```

### Pattern 2: Convex Python Client for Cross-Runtime Ingestion

**What:** The Python scraper calls Convex mutations directly using the official `convex` Python package, avoiding the need to build and maintain a separate REST API layer.

**When to use:** Every scrape run. The Python client calls internal mutations via HTTP, authenticated with a deploy key.

**Trade-offs:**
- PRO: No custom API to build or maintain
- PRO: Convex handles auth, validation, and transactions
- PRO: Same mutation logic whether called from Python or admin frontend
- CON: Convex Python client is less mature than the JS client
- CON: Batch size limited by Convex transaction limits (process in chunks)

**Example:**
```python
# scraper/scholarhub_scraper/pipelines/convex_push.py
from convex import ConvexClient
import os

class ConvexPushPipeline:
    def __init__(self):
        self.client = ConvexClient(os.environ["CONVEX_URL"])
        self.client.set_auth(os.environ["CONVEX_DEPLOY_KEY"])
        self.batch = []
        self.batch_size = 50  # Items per mutation call

    def process_item(self, item, spider):
        self.batch.append(dict(item))
        if len(self.batch) >= self.batch_size:
            self._flush(spider)
        return item

    def close_spider(self, spider):
        if self.batch:
            self._flush(spider)

    def _flush(self, spider):
        self.client.mutation(
            "scholarships/ingestion:ingestBatch",
            {
                "items": self.batch,
                "scrapeRunId": spider.scrape_run_id,
            }
        )
        self.batch = []
```

### Pattern 3: Index-Driven Filtering (No Post-Query Filtering)

**What:** Every filter the user can apply on the public directory maps to a Convex database index or search index. No `.filter()` calls on unindexed fields.

**When to use:** All public-facing queries and admin review queue queries.

**Trade-offs:**
- PRO: Consistently fast queries regardless of dataset size
- PRO: Avoids Convex's 1024-document scan limit on search queries
- CON: Requires upfront index planning; adding new filter dimensions means new indexes
- CON: Limited to 32 indexes per table (plenty for this use case)

**Example:**
```typescript
// convex/scholarships/queries.ts
import { query } from "../_generated/server";
import { v } from "convex/values";

export const listPublished = query({
  args: {
    country: v.optional(v.string()),
    degreeLevel: v.optional(v.string()),
    paginationOpts: v.object({
      cursor: v.optional(v.string()),
      numItems: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("scholarships")
      .withIndex("by_status_country_degree", (q) => {
        let indexed = q.eq("status", "published");
        if (args.country) indexed = indexed.eq("country", args.country);
        if (args.degreeLevel) indexed = indexed.eq("degreeLevel", args.degreeLevel);
        return indexed;
      });
    return await q.paginate(args.paginationOpts);
  },
});
```

### Pattern 4: Fingerprint-Based Deduplication

**What:** Each scraped scholarship gets a fingerprint (hash of normalized title + source URL or canonical URL). Dedup matches fingerprints before creating new canonical records.

**When to use:** During the raw-to-canonical processing stage.

**Trade-offs:**
- PRO: Fast exact-match deduplication
- PRO: Deterministic -- same input always produces same fingerprint
- CON: Won't catch near-duplicates (slightly different titles for same scholarship)
- MITIGATION: Admin review catches near-duplicates; fuzzy matching can be added later

**How it works:**
1. Scraper normalizes title (lowercase, strip whitespace, remove special chars)
2. Compute fingerprint: `hash(normalized_title + "|" + canonical_domain)`
3. On ingestion, check if fingerprint exists in `rawScholarships` or `scholarships`
4. If match: link to existing canonical record, merge any new fields
5. If no match: create new raw record for admin review

## Data Flow

### Primary Data Flow: Scrape to Public

```
GitHub Actions (cron trigger)
    |
    v
Python Scraper (Scrapy/Scrapling)
    |  Spiders extract data from 1000+ sources
    v
Scrapy Pipelines (Python)
    |  1. Validate: required fields present?
    |  2. Clean: strip HTML, normalize whitespace
    |  3. Normalize: standardize country names, degree levels, dates
    |  4. Fingerprint: compute dedup hash
    v
Convex Python Client
    |  Calls internal mutation in batches of ~50
    v
raw_scholarships table (Convex)
    |  Status: "pending"
    v
Admin reviews OR auto-post rules evaluate
    |
    ├── Match found (fingerprint) ──> Update existing scholarship
    |                                  Merge richer data from new scrape
    |
    ├── New scholarship ──> Admin reviews ──> "published" or "rejected"
    |
    └── Auto-post source ──> Automatically set to "published"
    |
    v
scholarships table (Convex)
    |  Status: "published", with merged data from all sources
    v
Convex Queries (with indexes + search)
    |
    v
React Frontend (useQuery real-time subscription)
    |  Filterable directory + detail pages
    v
Student sees scholarship
```

### Admin Review Flow

```
Admin opens dashboard
    |
    v
Convex query: rawScholarships where status = "pending"
    |  Sorted by source trust level, then date
    v
Admin sees scraped data alongside any existing match
    |
    ├── Approve ──> mutation creates/updates scholarship, sets status "published"
    ├── Reject  ──> mutation marks raw record "rejected"
    ├── Enrich  ──> Admin adds tips, corrects data, then approves
    └── Merge   ──> Admin manually links to existing scholarship
```

### Deadline Management Flow

```
Convex Cron Job (daily)
    |
    v
Query: scholarships where deadline < today AND status = "published"
    |
    v
Mutation: set status to "expired"
    |
    v
Query: scholarships where deadline is within next cycle window
    |  (e.g., annual scholarship, next year's deadline approaching)
    v
Mutation: set status to "upcoming" or create new cycle record
```

### Key Data Flows

1. **Ingestion flow:** GitHub Actions triggers scraper -> Scrapy pipelines clean data -> Convex Python client calls batch mutation -> data lands in raw_scholarships table
2. **Review flow:** Admin queries pending raw records -> approves/rejects/enriches -> mutation creates or updates canonical scholarship record
3. **Public read flow:** Student visits directory -> Convex query with indexes filters by country/degree/status -> real-time results via useQuery
4. **Expiry flow:** Daily Convex cron checks deadlines -> marks expired scholarships -> optionally resurfaces for next cycle

## Data Model

### Core Tables

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Canonical scholarship records (public-facing)
  scholarships: defineTable({
    title: v.string(),
    slug: v.string(),
    description: v.string(),
    country: v.string(),            // Standardized country name
    hostInstitution: v.optional(v.string()),
    degreeLevel: v.string(),        // "bachelors" | "masters" | "phd" | "any"
    amount: v.optional(v.string()), // Free text: "Full tuition + stipend"
    deadline: v.optional(v.number()),  // Unix timestamp
    applicationUrl: v.string(),
    eligibility: v.optional(v.string()),
    adminNotes: v.optional(v.string()),  // Tips added by admin
    status: v.string(),             // "draft" | "published" | "expired" | "rejected"
    fingerprint: v.string(),        // Dedup hash
    isRecurring: v.boolean(),       // Annual scholarship?
    category: v.string(),           // "international" | "domestic"
    lastVerified: v.number(),       // When last confirmed by scrape
  })
    .index("by_status_country_degree", ["status", "country", "degreeLevel"])
    .index("by_status_deadline", ["status", "deadline"])
    .index("by_fingerprint", ["fingerprint"])
    .index("by_slug", ["slug"])
    .index("by_category_status", ["category", "status"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["status", "country", "degreeLevel", "category"],
    }),

  // Raw scraped data (staging)
  rawScholarships: defineTable({
    sourceId: v.id("sources"),
    scrapeRunId: v.id("scrapeRuns"),
    title: v.string(),
    url: v.string(),
    deadline: v.optional(v.string()),
    amount: v.optional(v.string()),
    country: v.optional(v.string()),
    degreeLevel: v.optional(v.string()),
    eligibility: v.optional(v.string()),
    description: v.optional(v.string()),
    fingerprint: v.string(),
    status: v.string(),  // "pending" | "matched" | "new" | "approved" | "rejected"
    matchedScholarshipId: v.optional(v.id("scholarships")),
    scrapedAt: v.number(),
    processedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_fingerprint", ["fingerprint"])
    .index("by_source_status", ["sourceId", "status"])
    .index("by_scrapeRun", ["scrapeRunId"]),

  // Scholarship sources (websites/APIs being scraped)
  sources: defineTable({
    name: v.string(),
    url: v.string(),
    type: v.string(),             // "website" | "api" | "aggregator"
    scraperType: v.string(),      // "scrapy" | "scrapling" | "api"
    spiderName: v.string(),       // Maps to Python spider class
    trustLevel: v.string(),       // "auto_post" | "review_required"
    scrapeFrequency: v.string(),  // "daily" | "weekly" | "monthly"
    isActive: v.boolean(),
    lastScrapedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
  })
    .index("by_active_frequency", ["isActive", "scrapeFrequency"])
    .index("by_spider", ["spiderName"]),

  // Many-to-many: which sources contributed to which scholarship
  scholarshipSources: defineTable({
    scholarshipId: v.id("scholarships"),
    sourceId: v.id("sources"),
    sourceUrl: v.string(),        // Specific URL on that source
    lastSeenAt: v.number(),
  })
    .index("by_scholarship", ["scholarshipId"])
    .index("by_source", ["sourceId"]),

  // Scrape run tracking
  scrapeRuns: defineTable({
    sourceId: v.id("sources"),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    status: v.string(),           // "running" | "completed" | "failed"
    itemsScraped: v.number(),
    itemsNew: v.number(),
    itemsUpdated: v.number(),
    errorMessage: v.optional(v.string()),
    triggeredBy: v.string(),      // "cron" | "manual"
  })
    .index("by_source_date", ["sourceId", "startedAt"])
    .index("by_status", ["status"]),
});
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-5K scholarships | Current architecture is more than sufficient. Single Convex deployment, simple indexes, all queries fast. |
| 5K-50K scholarships | Add pagination everywhere. Ensure compound indexes cover all filter combinations users actually use. Consider denormalizing popular filter counts. |
| 50K+ scholarships | Shard scraping workflows across multiple GitHub Actions jobs. Consider Convex search indexes for free-text discovery. May need to archive expired scholarships to a separate table to keep active table lean. |

### Scaling Priorities

1. **First bottleneck: Scraping time.** With 1000+ sources, a single GitHub Actions run will exceed the 6-hour limit. Split into multiple workflows by frequency tier (daily/weekly/monthly) and parallelize within each.
2. **Second bottleneck: Ingestion throughput.** Convex mutations are transactional. Batch sizes of ~50 items per mutation call avoid transaction timeouts. If throughput matters, run multiple mutation calls concurrently from the Python client.
3. **Third bottleneck: Query performance on filter combinations.** With many filter dimensions, you need composite indexes. Plan indexes around the 3-4 most common filter combinations rather than trying to index every permutation (32 index limit per table is generous but finite).

## Anti-Patterns

### Anti-Pattern 1: Scraper Writes Directly to Canonical Table

**What people do:** Skip the raw/staging layer and have the scraper write directly to the public-facing scholarships table.
**Why it's wrong:** Bad scrape data goes live immediately. No admin review. No way to debug or replay. Deduplication errors corrupt the public dataset.
**Do this instead:** Always stage in `rawScholarships` first. Even auto-posted sources should go through the staging table with auto-approval -- the audit trail matters.

### Anti-Pattern 2: Running Scrapy Inside Convex Actions

**What people do:** Try to run the Python scraper as a Convex action or serverless function.
**Why it's wrong:** Convex actions have time limits. Scraping is slow, unpredictable, and requires Python-specific libraries (Scrapy, Scrapling, browser automation). Convex runs Node.js, not Python.
**Do this instead:** Keep scraping in Python on GitHub Actions (free, generous limits, full Python ecosystem). Use the Convex Python client to push results.

### Anti-Pattern 3: Using `.filter()` Instead of Indexes for Public Queries

**What people do:** Query all scholarships then filter in JavaScript/TypeScript code.
**Why it's wrong:** Convex loads all matching documents into memory before filtering. With thousands of scholarships, this is slow and hits the 1024-document collect limit.
**Do this instead:** Define compound indexes for every filter combination used in the UI. Use `.withIndex()` for exact matches and `.withSearchIndex()` for text search.

### Anti-Pattern 4: Storing All Scholarship Data in a Single Flat Record

**What people do:** Stuff every piece of information (source URLs, scrape history, admin notes, all versions) into one scholarship document.
**Why it's wrong:** Documents become bloated. Unrelated updates conflict. Source attribution gets tangled with canonical data.
**Do this instead:** Separate concerns: `scholarships` for canonical data, `scholarshipSources` for source attribution, `rawScholarships` for scrape history, `scrapeRuns` for operational tracking.

### Anti-Pattern 5: Building a Custom REST API Between Scraper and Convex

**What people do:** Create a separate Express/FastAPI server to receive scraper output and forward to Convex.
**Why it's wrong:** Unnecessary infrastructure to deploy, monitor, and maintain. Adds latency and failure points.
**Do this instead:** Use Convex HTTP Actions for webhook-style ingestion, or (even simpler) use the Convex Python client to call mutations directly. Zero additional infrastructure.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| GitHub Actions | Cron-triggered workflow runs Python scraper | Free for public repos. 6-hour max per job. Split large scrape sets across multiple workflows. Disable after 60 days of inactivity -- add a keep-alive commit or manual trigger. |
| Convex Cloud | Convex Python client (`convex` PyPI package) | Deploy key stored as GitHub Actions secret. Batch mutations in groups of ~50 items. Python client handles type conversion automatically. |
| Clerk (future) | Convex Clerk integration | Only needed when student accounts are added. Admin auth can use a simple shared secret or Convex dashboard auth initially. |
| Netlify | Deploys frontend from repo, Convex deploys backend separately | Standard Vite + React build. Environment variables for Convex URL. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Scraper -> Convex | Convex Python client calling internal mutations | One-way data push. Scraper never reads from Convex (stateless). Authentication via deploy key. |
| Convex -> Frontend | Real-time useQuery subscriptions + useMutation calls | Convex's reactive model means the frontend auto-updates when data changes. No polling needed. |
| Public pages <-> Admin pages | Same Convex deployment, different queries/mutations | Admin mutations are `internal` functions called via authenticated actions. Public queries only return `status: "published"` records. |
| rawScholarships -> scholarships | Convex mutations triggered by admin actions or auto-post rules | The "bridge" between staging and canonical. Dedup logic runs here. |

## Build Order (Dependencies)

The architecture has clear dependency chains that dictate build order:

1. **Convex schema + basic mutations first.** Everything depends on the data model. Define the schema, set up the Convex project, deploy. Without this, nothing else can work.

2. **Scraper infrastructure second.** Build 2-3 spiders for well-known sources (DAAD, Erasmus, one aggregator). Set up the Scrapy pipeline chain and Convex push pipeline. Prove the scrape-to-Convex flow works end-to-end.

3. **Admin dashboard third.** The admin needs to review what the scraper produced. Build the review queue, approve/reject flow, and enrichment UI. This validates the two-stage ingestion pattern.

4. **Public directory fourth.** Once there is reviewed, published data in the system, build the public-facing filterable directory and detail pages.

5. **Scale scraping fifth.** With the pipeline proven, add spiders for more sources. Set up GitHub Actions cron workflows. Build source management UI in admin.

6. **Deadline management sixth.** Implement the Convex cron job for expiry and recurring scholarship cycle handling.

This order ensures each phase has testable, usable output and avoids building frontend for data that does not yet exist.

## Sources

- [Convex HTTP Actions documentation](https://docs.convex.dev/functions/http-actions)
- [Convex Python Client (GitHub)](https://github.com/get-convex/convex-py)
- [Convex Best Practices](https://docs.convex.dev/understanding/best-practices/)
- [Convex Relationship Structures](https://stack.convex.dev/relationship-structures-let-s-talk-about-schemas)
- [Convex Full Text Search](https://docs.convex.dev/search/text-search)
- [Convex Indexes and Query Performance](https://docs.convex.dev/database/reading-data/indexes/indexes-and-query-perf)
- [Convex Cron Jobs](https://docs.convex.dev/scheduling/cron-jobs)
- [Convex Schemas](https://docs.convex.dev/database/schemas)
- [Scrapy Architecture Overview](https://docs.scrapy.org/en/latest/topics/architecture.html)
- [Scrapy Item Pipeline](https://docs.scrapy.org/en/latest/topics/item-pipeline.html)
- [Scrapling on PyPI](https://pypi.org/project/scrapling/)
- [TanStack Router File-Based Routing](https://tanstack.com/router/latest/docs/routing/file-based-routing)
- [GitHub Actions Scheduled Workflows](https://dylanbritz.dev/writing/scheduled-cron-jobs-github/)
- [Dedupe Python Library](https://github.com/dedupeio/dedupe)

---
*Architecture research for: ScholarHub scholarship aggregation platform*
*Researched: 2026-03-20*
