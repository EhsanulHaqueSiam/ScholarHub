---
phase: 01-foundation
plan: 01
subsystem: infra
tags: [vite, react, tanstack-router, tailwind-v4, convex, biome, vitest, scrapy, ruff, pytest, uv, monorepo]

requires:
  - phase: none
    provides: greenfield project
provides:
  - Monorepo structure with web/ (TypeScript) and scraping/ (Python)
  - Convex schema with 3 tables, 6 validators, compound indexes, search index
  - Vite + React + TanStack Router + Tailwind v4 web app scaffold
  - Python scraping environment with Scrapy, Convex SDK, Ruff, pytest
  - Biome linter/formatter for TypeScript
  - Vitest test infrastructure with jsdom
  - Neo-brutalism CSS theme with oklch colors
affects: [01-02, 02-source-discovery, 03-scraping-pipeline, 05-admin-dashboard, 06-public-directory]

tech-stack:
  added: [convex@1.33, react@19.2, tanstack-router@1.167, tailwindcss@4.2, vite@8.0, biome@2.4, vitest@4.1, scrapy@2.14, ruff@0.15, pytest@9.0, uv@0.10]
  patterns: [v.union(v.literal()) for Convex enums, Infer<> for TypeScript types, file-based routing with TanStack Router Vite plugin, CSS-only Tailwind v4 config via @theme directives]

key-files:
  created:
    - web/convex/schema.ts
    - web/vite.config.ts
    - web/vitest.config.ts
    - web/biome.json
    - web/src/main.tsx
    - web/src/index.css
    - web/src/routes/__root.tsx
    - web/src/routes/index.tsx
    - web/src/lib/utils.ts
    - web/src/tests/schema.test.ts
    - scraping/pyproject.toml
    - scraping/src/scholarhub_scraping/items.py
    - scraping/src/scholarhub_scraping/convex_client.py
    - scraping/src/scholarhub_scraping/settings.py
    - scraping/src/scholarhub_scraping/pipelines.py
    - .gitignore
    - package.json
  modified: []

key-decisions:
  - "Used v.union(v.literal()) for all Convex enum validators -- provides runtime validation + compile-time types via Infer<>"
  - "Excluded routeTree.gen.ts from Biome checks using negation pattern in includes"
  - "Added hatchling build system for Python package to enable proper imports"
  - "Removed ANN101/ANN102 from Ruff ignores since they were removed in ruff 0.15"

patterns-established:
  - "Convex validators: export const xValidator + export type X = Infer<typeof xValidator>"
  - "Tailwind v4 theming: CSS custom properties in :root + @theme inline block in index.css"
  - "Biome import organization: third-party first, then type imports, then value imports from same source"
  - "Python package layout: src/scholarhub_scraping/ with hatchling build system"

requirements-completed: [INFR-01, INFR-02]

duration: 11min
completed: 2026-03-20
---

# Phase 1 Plan 01: Monorepo Scaffold Summary

**Vite+React+TanStack Router+Tailwind v4+Convex web scaffold with 3-table schema (sources, raw_records, scholarships), Python/Scrapy scraping environment, and Vitest/Biome/Ruff tooling**

## Performance

- **Duration:** 11 min
- **Started:** 2026-03-19T20:19:29Z
- **Completed:** 2026-03-19T20:30:36Z
- **Tasks:** 4
- **Files modified:** 32

## Accomplishments
- Complete monorepo with web/ and scraping/ directories, root convenience scripts
- Convex schema with 6 exported validators, 6 TypeScript types, 3 tables, 14 compound indexes, 1 search index -- no v.any() anywhere
- Python scraping environment passes ruff check with strict rules (ANN, D, S, B, C4, T20, RUF)
- Schema validator unit tests pass with Vitest (3 tests: exports, default, type-check)
- All linting passes: Biome check (TypeScript), ruff check (Python), tsc --noEmit (TypeScript)

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold root monorepo and web app with all tooling** - `ae04941` (feat)
2. **Task 2: Define Convex schema with validators, tables, and indexes** - `e961732` (feat)
3. **Task 3: Scaffold Python scraping environment with uv, Scrapy, Ruff, and pytest** - `289f6c9` (feat)
4. **Task 4: Create schema validator unit tests** - `b19957e` (test)
5. **Fix: Resolve Biome linting errors** - `c17abf3` (fix)

## Files Created/Modified
- `.gitignore` - Monorepo gitignore covering web + scraping
- `package.json` - Root convenience scripts (dev, build, lint, test)
- `web/package.json` - Web app dependencies and scripts
- `web/vite.config.ts` - Vite with TanStack Router + React + Tailwind plugins
- `web/vitest.config.ts` - Vitest with jsdom, coverage thresholds at 80%
- `web/tsconfig.json` - Project references (app + node)
- `web/tsconfig.app.json` - Strict TypeScript for source code
- `web/tsconfig.node.json` - TypeScript for config files
- `web/biome.json` - Biome linting + formatting with recommended rules
- `web/index.html` - HTML entry with Archivo Black + Inter Google Fonts
- `web/src/index.css` - Full neo-brutalism theme with oklch colors, @theme inline, @layer base
- `web/src/main.tsx` - App entry with ConvexProvider + RouterProvider
- `web/src/routes/__root.tsx` - Root route with Outlet
- `web/src/routes/index.tsx` - Minimal placeholder homepage
- `web/src/routeTree.gen.ts` - Auto-generated route tree
- `web/src/lib/utils.ts` - cn() utility using clsx + tailwind-merge
- `web/tests/setup.ts` - Vitest setup with @testing-library/jest-dom
- `web/convex/schema.ts` - Complete schema with 3 tables, 6 validators, indexes
- `web/src/tests/schema.test.ts` - Unit tests for schema validator exports
- `scraping/pyproject.toml` - Python project config with dependencies and Ruff/pytest settings
- `scraping/.python-version` - Python 3.12
- `scraping/uv.lock` - Dependency lockfile
- `scraping/src/scholarhub_scraping/__init__.py` - Package init
- `scraping/src/scholarhub_scraping/spiders/__init__.py` - Spiders package init
- `scraping/src/scholarhub_scraping/items.py` - ScholarshipItem with all fields
- `scraping/src/scholarhub_scraping/settings.py` - Scrapy settings (ROBOTSTXT_OBEY, delays)
- `scraping/src/scholarhub_scraping/pipelines.py` - Default processing pipeline
- `scraping/src/scholarhub_scraping/convex_client.py` - Convex client wrapper loading from .env.local
- `scraping/tests/__init__.py` - Test package init
- `scraping/tests/conftest.py` - Shared pytest fixtures placeholder

## Decisions Made
- Used `v.union(v.literal())` for all Convex constrained fields -- idiomatic Convex pattern providing both runtime validation and compile-time TypeScript types via `Infer<>`
- Excluded auto-generated `routeTree.gen.ts` from Biome checks using negation pattern in includes
- Added hatchling build system for the Python package to enable proper `uv run python -c "import ..."` functionality
- Removed deprecated ANN101/ANN102 from Ruff ignore list since they were removed in ruff 0.15.x
- Skipped `npx convex dev --once` schema deployment (requires Convex account authentication) -- schema is structurally valid and TypeScript-verified

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Biome linting errors in web scaffold**
- **Found during:** Overall verification (after Task 4)
- **Issue:** Biome check failed: auto-generated routeTree.gen.ts had formatting issues, main.tsx had unsorted imports and non-null assertion, schema.test.ts had import order issues
- **Fix:** Excluded routeTree.gen.ts from Biome via negation pattern, sorted imports in main.tsx and schema.test.ts, replaced `!` non-null assertion with null check
- **Files modified:** web/biome.json, web/src/main.tsx, web/src/tests/schema.test.ts
- **Verification:** `bun biome check .` passes clean
- **Committed in:** c17abf3

**2. [Rule 3 - Blocking] Added hatchling build system for Python package**
- **Found during:** Task 3 (Python scaffold verification)
- **Issue:** `uv run python -c "from scholarhub_scraping..."` failed with ModuleNotFoundError -- uv init --app creates a flat layout without making the package installable
- **Fix:** Added `[build-system]` with hatchling and `[tool.hatch.build.targets.wheel]` to pyproject.toml
- **Files modified:** scraping/pyproject.toml
- **Verification:** `uv run python -c "from scholarhub_scraping.convex_client import get_convex_client; print('import ok')"` succeeds
- **Committed in:** 289f6c9 (part of Task 3 commit)

**3. [Rule 3 - Blocking] Removed deprecated Ruff rules ANN101/ANN102**
- **Found during:** Task 3 (ruff check)
- **Issue:** Ruff 0.15.7 emitted warnings that ANN101 and ANN102 have been removed
- **Fix:** Removed both from the ignore list in pyproject.toml
- **Files modified:** scraping/pyproject.toml
- **Verification:** `uv run ruff check .` passes with no warnings
- **Committed in:** 289f6c9 (part of Task 3 commit)

---

**Total deviations:** 3 auto-fixed (1 bug, 2 blocking)
**Impact on plan:** All auto-fixes necessary for correctness and clean CI. No scope creep.

## Issues Encountered
- `bun init` created default files (index.ts, README.md, CLAUDE.md) that were unnecessary and conflicted with the Vite-based setup. These were removed during Task 1.
- `uv init --app` created a main.py that failed ruff strict linting. Removed as it was not needed.
- Convex schema deployment (`npx convex dev --once`) was skipped as it requires Convex account authentication. This will be set up when the user configures their Convex account.

## User Setup Required
None for this plan. Convex account setup and deployment will be addressed in Plan 02 (Netlify deployment).

## Next Phase Readiness
- Web scaffold ready for Plan 02: branded placeholder page with neo-brutalism styling
- Schema ready for all downstream phases (scraping, aggregation, admin, public directory)
- Python environment ready for Phase 2 source discovery and Phase 3 scraping pipeline
- Test infrastructure ready for TDD from Phase 2 onwards

## Self-Check: PASSED

- All 15 key files verified present on disk
- All 5 commits verified in git history (ae04941, e961732, 289f6c9, b19957e, c17abf3)

---
*Phase: 01-foundation*
*Completed: 2026-03-20*
