# Phase 1: Foundation - Research

**Researched:** 2026-03-20
**Domain:** Monorepo scaffold, Convex schema, TanStack Router, Netlify deployment, Python scraping environment
**Confidence:** HIGH

## Summary

Phase 1 establishes the entire project skeleton: a monorepo with `web/` (TypeScript/React/Convex) and `scraping/` (Python/Scrapy) directories, a comprehensive Convex schema designed to support all downstream phases without breaking changes, a branded placeholder page deployed to Netlify, and a Python environment configured with uv that can communicate with Convex via its Python SDK.

The stack is well-documented and stable. Convex 1.33 provides robust schema definition with typed validators, compound indexes, and search indexes. TanStack Router v1.167 offers file-based routing with a Vite plugin. Tailwind CSS v4.2 integrates directly as a Vite plugin (no PostCSS/config file needed). The Convex Python SDK (0.7.0) supports query, mutation, action, and subscription methods. Biome 2.4 replaces ESLint+Prettier as a single tool. Ruff 0.15.7 handles Python linting with strict configuration.

**Primary recommendation:** Build the `web/` side first (Vite + React + Convex schema + TanStack Router + Tailwind + placeholder page), verify Netlify deployment, then scaffold the `scraping/` Python project with uv and validate Convex SDK connectivity.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Two top-level directories: `web/` (TanStack + React + Convex) and `scraping/` (Python pipeline)
- Convex lives inside `web/` -- the Convex dev server runs from `web/`, Python accesses Convex via its SDK (HTTP API)
- Minimal root config: README, .gitignore, shared .env (Convex keys), and a root package.json or Makefile with convenience scripts (dev, deploy). Each side manages its own tooling independently.
- Highly structured Convex fields -- individual typed fields for everything (funding_tuition, funding_living, funding_travel as booleans/amounts, eligibility_nationalities as array, degree_levels as array). Enables precise filtering and comparison.
- Separate tables for raw scraped records and canonical scholarships, linked via foreign key (nullable until matched). Source-level records preserved separately from canonical merged records.
- Rich source cataloging -- trust level, scrape frequency, last_scraped, consecutive_failures, plus source category, geographic coverage, data quality rating, notes field.
- Indexes defined for all planned filter combinations (country, degree level, field of study, funding type, nationality eligibility, deadline).
- Python package manager: uv
- Scrapy project structure inside `scraping/src/scholarhub_scraping/` with spiders/, pipelines/, items.py, settings.py, convex_client.py
- Convex Python SDK for Python-to-Convex communication (not raw HTTP)
- Strict Ruff linting -- type annotations enforced, docstrings required, import sorting, no Any types
- Branded "coming soon" placeholder page with ScholarHub name, tagline, neo-brutalism styling
- TanStack Router set up with route tree -- only `/` renders content, but routing foundation ready for later phases
- GitHub Actions on push to main: lint (Biome) -> type check (tsc) -> deploy to Netlify
- GitHub Actions on PR: lint + type check only
- Scraping CI deferred to Phase 3
- TypeScript: Biome (linting + formatting)
- Python: Ruff with strict configuration
- Full test strategy from Phase 1: Vitest for TypeScript, pytest for Python
- Coverage threshold: 80% minimum enforced in CI

### Claude's Discretion
- Convex environment strategy (dev vs prod deployments, env var management) -- Claude picks what works best for solo-dev-now, real-data-later situation
- Enum/union type approach for constrained fields (degree level, funding type, source category, trust levels) -- Claude picks what works best with Convex patterns

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFR-01 | Monorepo structure -- Python scraping + TypeScript web app in single repository | Monorepo layout with `web/` and `scraping/` directories, root config, each side with independent tooling. Covered by Standard Stack and Architecture Patterns sections. |
| INFR-02 | Convex backend with proper schema, indexes for all filter combinations | Convex schema validators (v.string, v.array, v.union, v.literal, v.optional, v.id), compound indexes, search indexes. Covered by Architecture Patterns and Code Examples sections. |
| INFR-03 | Netlify deployment for frontend | `npx convex deploy --cmd 'npm run build'`, CONVEX_DEPLOY_KEY env var, Netlify build settings. Covered by Architecture Patterns section. |

</phase_requirements>

## Standard Stack

### Core (web/)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| convex | 1.33.1 | Backend-as-a-service (DB, functions, real-time) | Project constraint; schema + functions + real-time in one |
| react | 19.2.4 | UI framework | Project constraint |
| @tanstack/react-router | 1.167.5 | File-based typesafe routing | Project constraint; type-safe routes with code splitting |
| @tanstack/router-plugin | 1.166.14 | Vite plugin for route tree generation | Required companion for file-based routing |
| vite | 8.0.1 | Build tool and dev server | Project constraint; fast HMR, plugin ecosystem |
| @vitejs/plugin-react | 6.0.1 | React support for Vite | Standard React Vite integration |
| tailwindcss | 4.2.2 | Utility-first CSS | Project constraint; neo-brutalism styling |
| @tailwindcss/vite | 4.2.2 | Tailwind v4 Vite plugin | Replaces PostCSS setup in Tailwind v4 |
| typescript | 5.9.3 | Type checking | Project constraint |

### Core (scraping/)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| scrapy | 2.14.2 | Web scraping framework | Project constraint; spider-based scraping |
| convex (Python) | 0.7.0 | Convex Python client | Project constraint; query/mutation/action from Python |
| python-dotenv | latest | Environment variable loading | Load .env files for Convex URL |
| ruff | 0.15.7 | Python linter + formatter | Project constraint; strict config |

### Dev Tools
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @biomejs/biome | 2.4.8 | TypeScript linting + formatting | All TypeScript code |
| vitest | 4.1.0 | TypeScript test runner | All web/ tests |
| @testing-library/react | 16.3.2 | React component testing | Component tests |
| @testing-library/jest-dom | 6.9.1 | DOM assertion matchers | Extend Vitest assertions |
| jsdom | 29.0.0 | Browser environment simulation | Vitest environment |
| pytest | 9.0.2 | Python test runner | All scraping/ tests |
| @tanstack/react-router-devtools | 1.166.9 | Router debugging | Development only |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @tailwindcss/vite | @tailwindcss/postcss | PostCSS requires extra config; Vite plugin is simpler for Vite projects |
| TanStack Router file-based | Code-based routing | File-based auto-generates route tree, less boilerplate for growing apps |
| Biome | ESLint + Prettier | Biome is 10-50x faster, single config, but smaller rule ecosystem |

**Installation (web/):**
```bash
cd web
bun add convex react react-dom @tanstack/react-router tailwindcss
bun add -d vite @vitejs/plugin-react @tanstack/router-plugin @tailwindcss/vite typescript @biomejs/biome vitest @testing-library/react @testing-library/jest-dom jsdom @tanstack/react-router-devtools @types/react @types/react-dom
```

**Installation (scraping/):**
```bash
cd scraping
uv init --app
uv add scrapy convex python-dotenv
uv add --group dev ruff pytest
```

## Architecture Patterns

### Recommended Project Structure
```
ScholarHub/
├── .github/
│   └── workflows/
│       ├── ci.yml              # PR checks: lint + typecheck
│       └── deploy.yml          # Push to main: lint + typecheck + deploy
├── web/
│   ├── convex/
│   │   ├── _generated/         # Auto-generated by Convex
│   │   ├── schema.ts           # Schema definition (tables, indexes)
│   │   └── README.md           # Convex function conventions
│   ├── src/
│   │   ├── routes/
│   │   │   ├── __root.tsx      # Root layout with providers
│   │   │   └── index.tsx       # Home page (placeholder)
│   │   ├── components/         # Shared components
│   │   ├── lib/                # Utilities
│   │   ├── main.tsx            # App entry point
│   │   └── index.css           # Tailwind import + neo-brutalism base
│   ├── tests/
│   │   └── setup.ts            # Vitest setup file
│   ├── index.html
│   ├── vite.config.ts
│   ├── vitest.config.ts
│   ├── tsconfig.json
│   ├── biome.json
│   └── package.json
├── scraping/
│   ├── src/
│   │   └── scholarhub_scraping/
│   │       ├── __init__.py
│   │       ├── spiders/
│   │       │   └── __init__.py
│   │       ├── pipelines.py
│   │       ├── items.py
│   │       ├── settings.py
│   │       └── convex_client.py
│   ├── tests/
│   │   ├── __init__.py
│   │   └── conftest.py
│   ├── pyproject.toml
│   ├── uv.lock
│   └── .python-version
├── .env.local                  # Convex dev URL (gitignored)
├── .gitignore
├── package.json                # Root convenience scripts
└── README.md
```

### Pattern 1: Convex Schema with Reusable Validators

**What:** Define enum-like validators as exported constants, compose them into table definitions, and use `Infer<>` for TypeScript types.
**When to use:** Any constrained field that has a fixed set of values (degree level, funding type, trust level, etc.)

**Recommendation (Claude's Discretion -- Enum Approach):** Use `v.union(v.literal(...))` for all constrained fields. This is the idiomatic Convex pattern -- it provides both runtime validation (Convex rejects invalid values) and compile-time TypeScript types via `Infer<>`. Define validators in a shared file (`convex/schema.ts` or `convex/validators.ts`) and export them for reuse in functions.

```typescript
// Source: https://stack.convex.dev/types-cookbook
// convex/validators.ts
import { v, Infer } from "convex/values";

export const degreeLevelValidator = v.union(
  v.literal("bachelor"),
  v.literal("master"),
  v.literal("phd"),
  v.literal("postdoc"),
);
export type DegreeLevel = Infer<typeof degreeLevelValidator>;

export const fundingTypeValidator = v.union(
  v.literal("fully_funded"),
  v.literal("partial"),
  v.literal("tuition_waiver"),
  v.literal("stipend_only"),
);
export type FundingType = Infer<typeof fundingTypeValidator>;

export const sourceCategoryValidator = v.union(
  v.literal("official_program"),
  v.literal("university"),
  v.literal("aggregator"),
  v.literal("government"),
  v.literal("foundation"),
);
export type SourceCategory = Infer<typeof sourceCategoryValidator>;

export const trustLevelValidator = v.union(
  v.literal("auto_publish"),
  v.literal("needs_review"),
  v.literal("blocked"),
);
export type TrustLevel = Infer<typeof trustLevelValidator>;
```

### Pattern 2: Convex Schema with Compound Indexes

**What:** Define compound indexes where the first field(s) use `.eq()` and the last field can use range operators (`.gt()`, `.lt()`).
**When to use:** Any query that filters by multiple fields.

```typescript
// Source: https://docs.convex.dev/database/reading-data/indexes/
// Index field order MATTERS:
// - Fields you .eq() on come first
// - The field you do range queries on (.gt/.lt) comes last
// - _creationTime is auto-appended as tiebreaker

// Example: "find scholarships in Germany for PhD, sorted by deadline"
.index("by_country_degree_deadline", ["host_country", "degree_levels", "application_deadline"])

// Query pattern:
const results = await ctx.db
  .query("scholarships")
  .withIndex("by_country_degree_deadline", (q) =>
    q.eq("host_country", "Germany")
     .eq("degree_levels", "phd")  // Note: array fields need special handling
  )
  .collect();
```

**Important Convex index constraint:** You must step through fields in index order. You cannot skip a field -- if your index is `["a", "b", "c"]`, you must `.eq("a")` before filtering on `b` or `c`. Plan indexes around your actual query patterns.

### Pattern 3: Convex + TanStack Router Provider Wiring

**What:** Wire ConvexReactClient into the app via ConvexProvider, with TanStack Router's RouterProvider.
**When to use:** App entry point setup.

```typescript
// Source: https://docs.convex.dev/client/react
// web/src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

const convex = new ConvexReactClient(
  import.meta.env.VITE_CONVEX_URL as string,
);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConvexProvider client={convex}>
      <RouterProvider router={router} />
    </ConvexProvider>
  </React.StrictMode>,
);
```

### Pattern 4: Netlify + Convex Deployment

**What:** Netlify builds the frontend and deploys Convex functions in one command.
**When to use:** Production deployment.

```
# Netlify Build Settings:
#   Base directory: web
#   Build command: npx convex deploy --cmd 'npm run build'
#   Publish directory: web/dist
#
# Netlify Environment Variables:
#   CONVEX_DEPLOY_KEY = (from Convex dashboard > Settings > Generate Production Deploy Key)
```

The `npx convex deploy --cmd 'npm run build'` command:
1. Reads `CONVEX_DEPLOY_KEY` from environment
2. Sets `CONVEX_URL` pointing to production deployment
3. Runs `npm run build` (Vite build, which reads `CONVEX_URL` via `import.meta.env.VITE_CONVEX_URL`)
4. Pushes Convex functions to production

### Pattern 5: Convex Environment Strategy

**Recommendation (Claude's Discretion -- Environment Strategy):** Use the standard Convex dev/prod split:
- **Development:** `npx convex dev` from `web/` creates a personal dev deployment, writes `CONVEX_DEPLOYMENT` to `.env.local`. This file is gitignored.
- **Production:** Netlify uses `CONVEX_DEPLOY_KEY` env var to deploy to the shared production deployment on push to main.
- **Shared .env:** The root `.env.local` holds `CONVEX_URL` for the Python scraping side during development. The Python SDK reads this via `python-dotenv`.
- **Solo dev simplification:** With one developer, you only have one dev deployment. No need for preview deployments initially. Add them if/when collaborators join.

### Pattern 6: TanStack Router File-Based Routing

**What:** Routes are files in `src/routes/`, auto-discovered by the Vite plugin.
**When to use:** All routing.

```typescript
// Source: https://tanstack.com/router/latest/docs/installation/with-vite
// web/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [
    TanStackRouterVite({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
});
```

```typescript
// web/src/routes/__root.tsx
import { createRootRoute, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => <Outlet />,
});
```

```typescript
// web/src/routes/index.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return <div>ScholarHub - Coming Soon</div>;
}
```

### Anti-Patterns to Avoid
- **Hand-building route configuration:** Use TanStack Router's Vite plugin -- it generates `routeTree.gen.ts` automatically. Never write route trees manually.
- **Storing Convex URL in code:** Always use environment variables (`VITE_CONVEX_URL` for Vite, `.env.local` for Python). Never hardcode deployment URLs.
- **Flat index for multi-field queries:** Each query pattern needs its own compound index. A single-field index on `country` does not help a query that also filters by `degree_level`.
- **Using `.filter()` instead of `.withIndex()`:** `.filter()` scans every document in the table. Always use `.withIndex()` for equality/range queries on indexed fields; `.filter()` is only for post-index refinement.
- **Using `tailwind.config.js` with Tailwind v4:** Tailwind v4 uses CSS-based configuration. The old JavaScript config file is deprecated. Use `@theme` directives in CSS instead.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Route tree management | Manual route config object | TanStack Router Vite plugin | Auto-generates typesafe route tree from file structure |
| TypeScript linting + formatting | ESLint + Prettier configs | Biome | Single tool, 10-50x faster, one config file |
| Python linting + formatting | Flake8 + Black + isort | Ruff | Single tool, 100x faster, handles all rules |
| Python dependency management | pip + requirements.txt | uv with pyproject.toml | Lockfile, fast resolution, venv management |
| Convex function deployment | Manual API calls | `npx convex deploy` | Handles schema push, function deployment, env vars |
| CSS utility framework config | PostCSS + autoprefixer + tailwind.config.js | @tailwindcss/vite plugin | Tailwind v4 native Vite integration, no config file |
| Real-time data subscriptions | WebSocket boilerplate | Convex `useQuery` / Python `client.subscribe` | Built into Convex SDK, automatic reactivity |

**Key insight:** This phase is infrastructure setup -- every piece has well-established tooling. The complexity is in wiring things together correctly, not in building custom solutions.

## Common Pitfalls

### Pitfall 1: Convex Index Field Order Mismatch
**What goes wrong:** Defining indexes with fields in the wrong order for your queries, leading to full table scans.
**Why it happens:** Convex requires stepping through index fields in order -- you cannot skip fields. An index `["country", "degree", "deadline"]` cannot be used for a query that only filters on `deadline`.
**How to avoid:** Design indexes by listing your actual query patterns first, then creating indexes that match. Equality fields first, range field last.
**Warning signs:** Slow queries, or Convex errors about index field order.

### Pitfall 2: Convex Array Field Indexing Limitations
**What goes wrong:** Trying to index on array fields (like `eligibility_nationalities`) for equality matching and expecting it to work like SQL `IN`.
**Why it happens:** Convex indexes work on scalar values. An array field in an index creates an entry per array element (not per document).
**How to avoid:** For filtering by array membership, use `.filter()` after a primary index, or design the schema so the most-queried dimension is a scalar field. Alternatively, use a search index with filter fields for complex array-based filtering.
**Warning signs:** Unexpected query results when filtering on array fields via index.

### Pitfall 3: Tailwind v4 Migration Confusion
**What goes wrong:** Installing Tailwind v4 but using v3 patterns (tailwind.config.js, @tailwind directives, PostCSS setup).
**Why it happens:** Most online tutorials still reference Tailwind v3.
**How to avoid:** Use `@tailwindcss/vite` plugin (no PostCSS), use `@import "tailwindcss"` in CSS (not `@tailwind base/components/utilities`), use `@theme` in CSS for customization (not tailwind.config.js).
**Warning signs:** "Unknown at rule @tailwind" errors, empty output CSS.

### Pitfall 4: Convex Schema Too Loose Early
**What goes wrong:** Using `v.any()` or `v.optional()` everywhere "because we'll tighten later." Later never comes, and downstream phases build on loose types.
**Why it happens:** Desire to move fast without thinking about data shapes.
**How to avoid:** Design the full schema now based on DTLP and PDIR requirements. Use `v.optional()` only for genuinely optional fields (editorial notes, travel funding). Use `v.union(v.literal(...))` for enums.
**Warning signs:** `v.any()` appearing anywhere in the schema.

### Pitfall 5: Missing `VITE_` Prefix on Environment Variables
**What goes wrong:** Environment variables not accessible in client-side code.
**Why it happens:** Vite only exposes env vars prefixed with `VITE_` to client code for security.
**How to avoid:** Always use `VITE_CONVEX_URL` (not `CONVEX_URL`) in Vite client code. The Convex deploy command handles this mapping automatically.
**Warning signs:** `undefined` when accessing `import.meta.env.CONVEX_URL`.

### Pitfall 6: Bun vs npm Confusion in CI
**What goes wrong:** Using `bun install` locally but CI uses `npm install`, causing lockfile mismatches.
**Why it happens:** Project uses Bun as runtime, but CI images may not have Bun.
**How to avoid:** Use Bun consistently: `bun install` locally and in CI. Add `oven-sh/setup-bun` action in GitHub Actions. Use `bun.lockb` (not `package-lock.json`).
**Warning signs:** Different dependency versions in CI vs local.

## Code Examples

### Convex Schema for ScholarHub

This is the most critical code artifact of Phase 1 -- it must support all downstream requirements.

```typescript
// Source: Synthesized from https://docs.convex.dev/database/schemas
//         and https://stack.convex.dev/types-cookbook
// web/convex/schema.ts

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// ---- Reusable Validators ----

export const degreeLevelValidator = v.union(
  v.literal("bachelor"),
  v.literal("master"),
  v.literal("phd"),
  v.literal("postdoc"),
);

export const fundingTypeValidator = v.union(
  v.literal("fully_funded"),
  v.literal("partial"),
  v.literal("tuition_waiver"),
  v.literal("stipend_only"),
);

export const sourceCategoryValidator = v.union(
  v.literal("official_program"),
  v.literal("university"),
  v.literal("aggregator"),
  v.literal("government"),
  v.literal("foundation"),
);

export const trustLevelValidator = v.union(
  v.literal("auto_publish"),
  v.literal("needs_review"),
  v.literal("blocked"),
);

export const scholarshipStatusValidator = v.union(
  v.literal("draft"),
  v.literal("pending_review"),
  v.literal("published"),
  v.literal("rejected"),
  v.literal("archived"),
);

export const scrapeMethodValidator = v.union(
  v.literal("api"),
  v.literal("scrape"),
  v.literal("scrapling"),
);

// ---- Schema Definition ----

export default defineSchema({
  // Source catalog -- where scholarship data comes from
  sources: defineTable({
    name: v.string(),
    url: v.string(),
    category: sourceCategoryValidator,
    scrape_method: scrapeMethodValidator,
    trust_level: trustLevelValidator,
    scrape_frequency_hours: v.number(),
    last_scraped: v.optional(v.number()),          // timestamp
    consecutive_failures: v.number(),
    geographic_coverage: v.optional(v.array(v.string())),
    data_quality_rating: v.optional(v.number()),   // 1-5
    notes: v.optional(v.string()),
    is_active: v.boolean(),
  })
    .index("by_category", ["category"])
    .index("by_trust_level", ["trust_level"])
    .index("by_active_category", ["is_active", "category"]),

  // Raw scraped records -- staging area before aggregation
  raw_records: defineTable({
    source_id: v.id("sources"),
    external_id: v.optional(v.string()),           // ID from source site
    title: v.string(),
    description: v.optional(v.string()),
    provider_organization: v.optional(v.string()),
    host_country: v.optional(v.string()),
    eligibility_nationalities: v.optional(v.array(v.string())),
    degree_levels: v.optional(v.array(degreeLevelValidator)),
    fields_of_study: v.optional(v.array(v.string())),
    funding_type: v.optional(fundingTypeValidator),
    funding_tuition: v.optional(v.boolean()),
    funding_living: v.optional(v.boolean()),
    funding_travel: v.optional(v.boolean()),
    funding_insurance: v.optional(v.boolean()),
    award_amount: v.optional(v.string()),          // raw text, may include currency
    award_currency: v.optional(v.string()),
    application_deadline: v.optional(v.string()),  // raw text, parsed later
    application_url: v.optional(v.string()),
    source_url: v.string(),                        // page scraped from
    scraped_at: v.number(),                        // timestamp
    raw_data: v.optional(v.string()),              // JSON blob of full scraped content
    canonical_id: v.optional(v.id("scholarships")),// linked after aggregation
    scrape_run_id: v.optional(v.string()),         // batch identifier
  })
    .index("by_source", ["source_id"])
    .index("by_canonical", ["canonical_id"])
    .index("by_source_external", ["source_id", "external_id"])
    .index("by_scrape_run", ["scrape_run_id"]),

  // Canonical scholarships -- merged, deduplicated, publishable
  scholarships: defineTable({
    title: v.string(),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),           // rich text
    provider_organization: v.string(),
    host_country: v.string(),
    eligibility_nationalities: v.optional(v.array(v.string())),
    degree_levels: v.array(degreeLevelValidator),
    fields_of_study: v.optional(v.array(v.string())),
    funding_type: fundingTypeValidator,
    funding_tuition: v.optional(v.boolean()),
    funding_living: v.optional(v.boolean()),
    funding_travel: v.optional(v.boolean()),
    funding_insurance: v.optional(v.boolean()),
    award_amount_min: v.optional(v.number()),
    award_amount_max: v.optional(v.number()),
    award_currency: v.optional(v.string()),
    application_deadline: v.optional(v.number()),  // timestamp
    application_deadline_text: v.optional(v.string()), // human-readable
    application_url: v.optional(v.string()),
    status: scholarshipStatusValidator,
    editorial_notes: v.optional(v.string()),       // admin tips, rich text
    source_ids: v.array(v.id("sources")),          // which sources contributed
    last_verified: v.optional(v.number()),         // timestamp
    previous_cycle_id: v.optional(v.id("scholarships")), // cyclical linking
    expected_reopen_month: v.optional(v.number()), // 1-12
    tags: v.optional(v.array(v.string())),         // for curated collections
  })
    .index("by_status", ["status"])
    .index("by_country_status", ["host_country", "status"])
    .index("by_funding_status", ["funding_type", "status"])
    .index("by_deadline", ["application_deadline"])
    .index("by_status_deadline", ["status", "application_deadline"])
    .index("by_country_deadline", ["host_country", "application_deadline"])
    .index("by_slug", ["slug"])
    .searchIndex("search_title_description", {
      searchField: "title",
      filterFields: ["status", "host_country", "funding_type"],
    }),
});
```

### Biome Configuration

```json
// Source: https://biomejs.dev/guides/configure-biome/
// web/biome.json
{
  "$schema": "https://biomejs.dev/schemas/2.4.8/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "includes": ["src/**/*.ts", "src/**/*.tsx", "convex/**/*.ts"]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "semicolons": "always"
    }
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedImports": "error",
        "noUnusedVariables": "error"
      },
      "style": {
        "useConst": "error",
        "noNonNullAssertion": "warn"
      }
    }
  }
}
```

### Ruff Configuration (Python)

```toml
# Source: https://docs.astral.sh/ruff/configuration/
# scraping/pyproject.toml (relevant sections)

[tool.ruff]
target-version = "py312"
line-length = 100
src = ["src"]

[tool.ruff.lint]
select = [
    "E",    # pycodestyle errors
    "W",    # pycodestyle warnings
    "F",    # pyflakes
    "I",    # isort
    "N",    # pep8-naming
    "D",    # pydocstyle
    "ANN",  # flake8-annotations (type annotations required)
    "S",    # flake8-bandit (security)
    "B",    # flake8-bugbear
    "A",    # flake8-builtins
    "C4",   # flake8-comprehensions
    "T20",  # flake8-print
    "RUF",  # ruff-specific rules
]
ignore = [
    "D100",   # module docstring (not always needed)
    "D104",   # package docstring
    "ANN101", # self annotation (deprecated in ruff)
    "ANN102", # cls annotation (deprecated in ruff)
]

[tool.ruff.lint.pydocstyle]
convention = "google"

[tool.ruff.lint.per-file-ignores]
"tests/**/*.py" = ["S101", "D103", "ANN"]
```

### Python Convex Client Utility

```python
# Source: https://pypi.org/project/convex/
# scraping/src/scholarhub_scraping/convex_client.py
"""Convex client wrapper for the scraping pipeline."""

import os

from convex import ConvexClient
from dotenv import load_dotenv


def get_convex_client() -> ConvexClient:
    """Create and return a configured Convex client.

    Reads the CONVEX_URL from environment variables.
    Loads from .env.local at repo root if present.

    Returns:
        ConvexClient: Configured client instance.

    Raises:
        ValueError: If CONVEX_URL is not set.
    """
    # Load from repo root .env.local
    load_dotenv(os.path.join(os.path.dirname(__file__), "../../../.env.local"))

    convex_url = os.getenv("CONVEX_URL")
    if not convex_url:
        msg = "CONVEX_URL environment variable is not set"
        raise ValueError(msg)

    return ConvexClient(convex_url)
```

### Vitest Configuration

```typescript
// web/vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "tests/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
      },
    },
  },
});
```

### GitHub Actions CI Workflow

```yaml
# .github/workflows/ci.yml
name: CI
on:
  pull_request:
    branches: [main]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - name: Install web dependencies
        run: cd web && bun install --frozen-lockfile
      - name: Lint (Biome)
        run: cd web && bun biome check .
      - name: Type check
        run: cd web && bun tsc --noEmit
```

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - name: Install web dependencies
        run: cd web && bun install --frozen-lockfile
      - name: Lint (Biome)
        run: cd web && bun biome check .
      - name: Type check
        run: cd web && bun tsc --noEmit
      - name: Deploy to Netlify
        run: cd web && npx convex deploy --cmd 'bun run build'
        env:
          CONVEX_DEPLOY_KEY: ${{ secrets.CONVEX_DEPLOY_KEY }}
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind v3 + PostCSS + tailwind.config.js | Tailwind v4 + @tailwindcss/vite + CSS-only config | Jan 2025 | No JS config, no PostCSS, `@import "tailwindcss"` replaces `@tailwind` directives |
| ESLint + Prettier | Biome 2.x | Stable since 2024 | Single binary, 10-50x faster, one config file |
| pip + requirements.txt | uv + pyproject.toml + uv.lock | Stable since mid-2024 | Cross-platform lockfile, 10-100x faster dependency resolution |
| React Router v6 | TanStack Router v1 | Stable since late 2024 | Type-safe routes, file-based routing, auto code splitting |
| Convex environment variables via .env | `npx convex deploy --cmd` pattern | Convex standard | Handles dev/prod URL switching automatically |

**Deprecated/outdated:**
- `tailwind.config.js` -- replaced by CSS `@theme` directives in v4
- `@tailwind base; @tailwind components; @tailwind utilities;` -- replaced by `@import "tailwindcss";`
- `postcss.config.js` for Tailwind in Vite projects -- replaced by `@tailwindcss/vite` plugin
- Python `pip install` + `requirements.txt` -- replaced by `uv add` + `pyproject.toml`

## Open Questions

1. **Convex array field filtering for nationality eligibility**
   - What we know: Convex indexes work well for scalar equality. The `eligibility_nationalities` field is an array.
   - What's unclear: Whether `.withIndex()` can efficiently filter "scholarships where this nationality is eligible" on an array field, or if a search index with filter field is needed, or if a separate join table is better.
   - Recommendation: Start with the array field + `.filter()` approach for Phase 1 schema. If performance is an issue in Phase 6 when implementing PDIR-06, add a search index or denormalize. The schema supports both approaches without breaking changes.

2. **Bun compatibility with Convex CLI**
   - What we know: Convex CLI is invoked via `npx convex dev` / `npx convex deploy`. Project uses Bun as runtime.
   - What's unclear: Whether `bunx convex` works identically to `npx convex` in all cases (especially the `--cmd` flag for Netlify deployment).
   - Recommendation: Use `npx convex` for Convex CLI commands (it works regardless of runtime). Use `bun` for everything else (install, run, build).

3. **Netlify deployment with monorepo base directory**
   - What we know: Netlify needs `base directory: web` since Convex and the frontend live there.
   - What's unclear: Whether `npx convex deploy --cmd 'bun run build'` works correctly when Netlify's base directory is set to `web/`.
   - Recommendation: Set Netlify base directory to `web`. The build command runs relative to base, so `npx convex deploy --cmd 'bun run build'` should work. Test this during initial deployment.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework (TS) | Vitest 4.1.0 |
| Framework (Python) | pytest 9.0.2 |
| Config file (TS) | `web/vitest.config.ts` (Wave 0) |
| Config file (Python) | `scraping/pyproject.toml` [tool.pytest.ini_options] (Wave 0) |
| Quick run command (TS) | `cd web && bun vitest run --reporter=verbose` |
| Quick run command (Python) | `cd scraping && uv run pytest -x -v` |
| Full suite command | `cd web && bun vitest run --coverage && cd ../scraping && uv run pytest -x -v` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFR-01 | Monorepo directories exist, both sides have configs | smoke | `test -f web/package.json && test -f scraping/pyproject.toml` | N/A (shell check) |
| INFR-02 | Convex schema deploys without errors | integration | `cd web && npx convex dev --once` | Wave 0 |
| INFR-02 | Schema validators reject invalid data | unit | `cd web && bun vitest run src/tests/schema.test.ts -x` | Wave 0 |
| INFR-03 | Frontend builds successfully | smoke | `cd web && bun run build` | N/A (build check) |
| INFR-03 | Placeholder page renders | unit | `cd web && bun vitest run src/tests/home.test.tsx -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd web && bun vitest run --reporter=verbose`
- **Per wave merge:** Full suite (TS + Python)
- **Phase gate:** Full suite green + successful Netlify deploy before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `web/vitest.config.ts` -- Vitest configuration with jsdom environment
- [ ] `web/tests/setup.ts` -- Testing library setup (@testing-library/jest-dom)
- [ ] `scraping/tests/conftest.py` -- pytest shared fixtures
- [ ] Framework install: `cd web && bun add -d vitest @testing-library/react @testing-library/jest-dom jsdom` and `cd scraping && uv add --group dev pytest`

## Sources

### Primary (HIGH confidence)
- [Convex Schemas](https://docs.convex.dev/database/schemas) -- defineSchema, defineTable, validator syntax
- [Convex Indexes](https://docs.convex.dev/database/reading-data/indexes/) -- compound indexes, query patterns, limits (32 per table, 16 fields)
- [Convex Search](https://docs.convex.dev/search/text-search) -- searchIndex definition, withSearchIndex queries
- [Convex Python SDK](https://pypi.org/project/convex/) -- v0.7.0, ConvexClient API, type mapping
- [Convex Types Cookbook](https://stack.convex.dev/types-cookbook) -- reusable validators, Infer pattern
- [Convex Netlify Hosting](https://docs.convex.dev/production/hosting/netlify) -- deploy key, build command, preview deployments
- [Convex Production](https://docs.convex.dev/production) -- dev vs prod deployments, environment strategy
- [TanStack Router Installation (Vite)](https://tanstack.com/router/latest/docs/installation/with-vite) -- plugin setup, file-based routing
- [Tailwind CSS v4](https://tailwindcss.com/blog/tailwindcss-v4) -- Vite plugin, CSS-only config
- [Biome Configuration](https://biomejs.dev/guides/configure-biome/) -- biome.json structure, rules
- [Ruff Configuration](https://docs.astral.sh/ruff/configuration/) -- pyproject.toml setup, rule selection
- [uv Projects](https://docs.astral.sh/uv/guides/projects/) -- init, add, lockfile management

### Secondary (MEDIUM confidence)
- [Convex Best Practices Gist](https://gist.github.com/srizvi/966e583693271d874bf65c2a95466339) -- opinionated schema design guidelines
- [Convex React Client](https://docs.convex.dev/client/react) -- ConvexProvider, ConvexReactClient setup

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all versions verified against npm/PyPI registries on 2026-03-20
- Architecture: HIGH -- patterns sourced from official Convex, TanStack, and Tailwind docs
- Pitfalls: HIGH -- drawn from official documentation constraints and verified behavior
- Schema design: MEDIUM -- schema is comprehensive but array field indexing for nationality eligibility needs validation during implementation

**Research date:** 2026-03-20
**Valid until:** 2026-04-20 (stable stack, 30-day validity)
