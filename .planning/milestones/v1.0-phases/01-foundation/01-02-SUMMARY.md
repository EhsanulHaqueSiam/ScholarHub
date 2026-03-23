---
phase: 01-foundation
plan: 02
subsystem: infra
tags: [shadcn, neobrutalism, neo-brutalism, github-actions, ci-cd, netlify, convex-deploy, badge, card, button, vitest, testing-library]

requires:
  - phase: 01-foundation/01
    provides: Monorepo scaffold, Vite+React+TanStack Router+Tailwind v4, Convex schema, neo-brutalism CSS theme
provides:
  - Branded "Coming Soon" placeholder page with neo-brutalism Card, Badge, Button components
  - shadcn component infrastructure with neobrutalism.dev registry components
  - GitHub Actions CI workflow (lint + typecheck on PRs to main)
  - GitHub Actions deploy workflow (lint + typecheck + Convex deploy + Netlify build on push to main)
  - HomePage unit tests (4 assertions on rendered text content)
  - @ path alias configured in tsconfig and vite for component imports
affects: [02-source-discovery, 05-admin-dashboard, 06-public-directory]

tech-stack:
  added: [@radix-ui/react-slot, class-variance-authority, tw-animate-css]
  patterns: [shadcn component pattern with cva variants, @ path alias for src/ imports, neobrutalism component registry]

key-files:
  created:
    - web/src/components/ui/button.tsx
    - web/src/components/ui/card.tsx
    - web/src/components/ui/badge.tsx
    - web/components.json
    - web/src/tests/home.test.tsx
    - .github/workflows/ci.yml
    - .github/workflows/deploy.yml
  modified:
    - web/src/routes/index.tsx
    - web/tsconfig.app.json
    - web/vite.config.ts
    - web/vitest.config.ts

key-decisions:
  - "Created neobrutalism components manually from registry source (ekmas/neobrutalism-components) since shadcn CLI lacked --registry flag support"
  - "Added @ path alias in tsconfig.app.json and vite.config.ts for shadcn import conventions"
  - "Exported HomePage function from route file to enable direct import in unit tests"

patterns-established:
  - "shadcn UI components: src/components/ui/ with cva variants and cn() utility"
  - "Component imports use @/lib/utils alias (resolved via vite and tsconfig paths)"
  - "GitHub Actions: oven-sh/setup-bun@v2 + bun install --frozen-lockfile for CI"

requirements-completed: [INFR-03]

duration: 14min
completed: 2026-03-20
---

# Phase 1 Plan 02: Branded Placeholder & CI/CD Summary

**Neo-brutalism "Coming Soon" placeholder with shadcn Card/Badge/Button components, 4 HomePage unit tests, and GitHub Actions CI/CD (lint+typecheck on PRs, deploy on push to main)**

## Performance

- **Duration:** 14 min
- **Started:** 2026-03-19T20:35:55Z
- **Completed:** 2026-03-19T20:49:55Z
- **Tasks:** 4
- **Files modified:** 13

## Accomplishments
- Branded placeholder page renders centered white card on lavender background with "Coming Soon" badge, "ScholarHub" display heading, tagline, and body text
- Three neobrutalism UI components installed (button, card, badge) establishing the shadcn pattern for all future phases
- Four HomePage unit tests verify all rendered text content (heading, badge, tagline, body)
- GitHub Actions CI/CD: lint + typecheck on PRs, lint + typecheck + Convex deploy + Netlify build on push to main

## Task Commits

Each task was committed atomically:

1. **Task 1: Install shadcn components and build branded placeholder page** - `29cbc1d` (feat)
2. **Task 2: Create HomePage component unit tests** - `de58f25` (test)
3. **Task 3: Create GitHub Actions CI/CD workflows** - `0c21924` (chore)
4. **Task 4: Verify placeholder page renders correctly** - user-verified (human checkpoint, no commit)

Additional commit by user:
- **ConvexProvider conditional fix** - `08018ba` (fix) - Makes ConvexProvider conditional when VITE_CONVEX_URL is unset

## Files Created/Modified
- `web/src/components/ui/button.tsx` - Neo-brutalism button with cva variants (default, noShadow, neutral, reverse)
- `web/src/components/ui/card.tsx` - Neo-brutalism card with CardContent, CardHeader, CardFooter, CardTitle, CardDescription, CardAction
- `web/src/components/ui/badge.tsx` - Neo-brutalism badge with default (accent) and neutral variants
- `web/components.json` - shadcn configuration (style: default, base color: neutral, CSS variables)
- `web/src/routes/index.tsx` - Branded "Coming Soon" placeholder page with Card, Badge, centered layout
- `web/src/tests/home.test.tsx` - 4 unit tests for HomePage text content
- `web/tsconfig.app.json` - Added baseUrl and @ path alias
- `web/vite.config.ts` - Added @ resolve alias for src/
- `web/vitest.config.ts` - Added @ resolve alias for test imports
- `.github/workflows/ci.yml` - PR check workflow (lint + typecheck)
- `.github/workflows/deploy.yml` - Deploy workflow (lint + typecheck + Convex deploy + Netlify build)

## Decisions Made
- Created neobrutalism components manually from the `ekmas/neobrutalism-components` GitHub repo source code since the shadcn CLI `--registry` flag was not available in the installed version. Components are exact copies with Biome formatting applied.
- Added `@/` path alias (resolving to `src/`) in tsconfig.app.json, vite.config.ts, and vitest.config.ts to match shadcn's conventional import pattern (`@/lib/utils`).
- Exported `HomePage` function from the route file to enable direct import in unit tests (minimal one-word change: added `export` keyword).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] shadcn CLI --registry flag not supported**
- **Found during:** Task 1 (component installation)
- **Issue:** `npx shadcn@latest add button --registry https://neobrutalism.dev` failed with "unknown option '--registry'", and URL-based installs also failed with 404
- **Fix:** Fetched component source directly from `ekmas/neobrutalism-components` GitHub repo and wrote files manually, then ran Biome auto-fix for formatting
- **Files modified:** web/src/components/ui/button.tsx, web/src/components/ui/card.tsx, web/src/components/ui/badge.tsx
- **Verification:** `bun run build` succeeds, `bun biome check .` passes clean
- **Committed in:** 29cbc1d

**2. [Rule 3 - Blocking] Missing @ path alias for component imports**
- **Found during:** Task 1 (component files use `@/lib/utils`)
- **Issue:** Components import from `@/lib/utils` but no path alias was configured in tsconfig or vite
- **Fix:** Added `baseUrl` + `paths` to tsconfig.app.json, `resolve.alias` to vite.config.ts
- **Files modified:** web/tsconfig.app.json, web/vite.config.ts
- **Verification:** `bun tsc --noEmit` and `bun run build` both pass
- **Committed in:** 29cbc1d

**3. [Rule 3 - Blocking] Missing @ path alias in vitest config**
- **Found during:** Task 2 (test file imports components using @/ alias)
- **Issue:** vitest.config.ts lacked the `@/` resolve alias, so test imports of components that use `@/lib/utils` would fail
- **Fix:** Added `resolve.alias` to vitest.config.ts matching vite.config.ts
- **Files modified:** web/vitest.config.ts
- **Verification:** `bun vitest run src/tests/home.test.tsx` passes all 4 tests
- **Committed in:** de58f25

---

**Total deviations:** 3 auto-fixed (3 blocking)
**Impact on plan:** All auto-fixes necessary for build/test resolution. No scope creep.

## Issues Encountered
- shadcn CLI v4.1.0 did not support the `--registry` flag documented in the plan. Resolved by fetching source directly from the neobrutalism-components GitHub repository.
- User discovered ConvexProvider caused blank page when VITE_CONVEX_URL was unset. User committed fix independently (08018ba) making the provider conditional.

## User Setup Required

**External services require manual configuration for deployment.** The deploy workflow references these GitHub repository secrets:

| Secret | Source |
|--------|--------|
| CONVEX_DEPLOY_KEY | Convex Dashboard > Settings > Generate Production Deploy Key |
| NETLIFY_AUTH_TOKEN | Netlify Dashboard > User Settings > Applications > Personal access tokens |
| NETLIFY_SITE_ID | Netlify Dashboard > Site configuration > General > Site ID |

These must be configured in GitHub repository settings before the deploy workflow will succeed on push to main.

## Next Phase Readiness
- Phase 1 complete: monorepo, schema, placeholder page, CI/CD all in place
- shadcn component pattern established for future UI work (Phase 5+)
- CI pipeline validates lint + typecheck on every PR
- Deploy pipeline ready once Convex/Netlify secrets are configured
- Ready for Phase 2: Source Discovery (no remaining Phase 1 blockers)

## Self-Check: PASSED

- All 12 key files verified present on disk
- All 4 commits verified in git history (29cbc1d, de58f25, 0c21924, 08018ba)

---
*Phase: 01-foundation*
*Completed: 2026-03-20*
