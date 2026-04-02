# Phase 1: Storage Foundations - Research

**Researched:** 2026-04-03
**Domain:** localStorage infrastructure, versioned schema, cross-tab sync, error surfacing
**Confidence:** HIGH

## Summary

Phase 1 is a pure client-side infrastructure phase with no external dependencies. The existing codebase already has two distinct localStorage patterns: (1) a `ProfileStorage` interface + `LocalStorageProfileAdapter` class for the eligibility profile, and (2) a generic `useLocalStorage` hook used by shortlist, nationality detection, and filter persistence. Both patterns silently swallow errors. The shortlist route calls `useLocalStorage` directly in the component rather than going through a typed adapter.

The work decomposes cleanly into four independent concerns: surfacing `QuotaExceededError` to the user (STORE-01), adding `_version` fields with migration-on-read (STORE-02), wrapping shortlist in a typed `StorageAdapter` (STORE-03), and adding cross-tab sync via the native `storage` event (STORE-04). All four use only standard browser APIs -- no new npm dependencies are needed.

**Primary recommendation:** Fix `useLocalStorage` to propagate quota errors via a returned error state, build a reusable `StorageErrorBanner` component, add `_version` + migration-on-read to all adapters, create a `ShortlistStorageAdapter` matching the profile pattern, and wire a `storage` event listener into `useLocalStorage` for cross-tab reactivity. No new libraries required.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
None -- discuss was skipped; all implementation choices are at Claude's discretion.

### Claude's Discretion
All implementation choices are at Claude's discretion -- pure infrastructure phase. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

Key constraints from research:
- Existing `LocalStorageProfileAdapter` pattern is the correct Clerk migration seam
- All new storage must follow the same typed interface + adapter pattern
- No component should call `localStorage` directly after this phase
- `useLocalStorage` hook must surface QuotaExceededError visibly (error banner)
- All stored objects need `_version` field for schema migration
- Cross-tab `storage` event listener for data sync

### Deferred Ideas (OUT OF SCOPE)
None -- discuss phase skipped.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| STORE-01 | useLocalStorage hook surfaces QuotaExceededError to the user instead of silently swallowing it | QuotaExceededError detection pattern (code 22/1014, name checks); error banner component; useLocalStorage returns error state |
| STORE-02 | All localStorage objects (profile, shortlist, tracker, alerts) have a `_version` field for schema migration | Migration-on-read pattern with version registry; existing profile + shortlist need `_version: 1` added; tracker/alerts get skeleton types for future phases |
| STORE-03 | Existing shortlist uses a typed StorageAdapter interface (matching eligibility profile pattern) for Clerk migration readiness | `ShortlistStorageAdapter` class mirroring `LocalStorageProfileAdapter`; shortlist.tsx refactored to use adapter singleton instead of raw `useLocalStorage` |
| STORE-04 | Cross-tab storage event listener keeps data in sync across open tabs | Native `window.addEventListener("storage", ...)` in useLocalStorage; event fires only in OTHER tabs (not the originating one); StorageEvent provides key/newValue/oldValue |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **No auth:** All features must work with localStorage. Design data models so they can migrate to Clerk-backed user storage later.
- **Convex budget:** Static JSON remains primary read path. Minimize Convex function calls. (Not directly relevant to Phase 1 but constrains storage design -- localStorage-first.)
- **Design system:** Neo-brutalism must be maintained across all new features. Use existing tokens, Card/Badge primitives, accent color palette. (Applies to the error banner UI.)
- **GSD Workflow:** Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
- **Git commits:** Do NOT add `Co-Authored-By: Claude` line to commit messages.
- **Biome:** Linting via Biome 2.4 (`biome lint`).
- **Zod 4.3:** Validation library already in use.

## Standard Stack

### Core (Already Installed -- No New Dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.4 | UI framework | Already installed |
| Zod | 4.3.6 | Schema validation for stored objects | Already installed; used for eligibility types |
| Vitest | 4.1.0 | Testing (jsdom environment) | Already configured with setup file |
| TypeScript | 5.9.3 | Type safety | Already installed |

### Supporting (Browser APIs -- Zero Dependencies)

| API | Purpose | When to Use |
|-----|---------|-------------|
| `window.addEventListener("storage", ...)` | Cross-tab sync (STORE-04) | Detect changes from other tabs |
| `StorageEvent` interface | Event payload with key/oldValue/newValue | Parse which key changed and update state |
| `DOMException` (QuotaExceededError) | Detect localStorage full (STORE-01) | Catch in setItem calls, surface to user |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native storage event | Zustand persist + sync middleware | Zustand is planned for Phase 2; premature for Phase 1 which only has 2 stores |
| Manual migration-on-read | `zustand/middleware/persist` versioning | Same -- Phase 2 will adopt Zustand; Phase 1 builds the migration primitives that Zustand can wrap later |
| Custom error banner | sonner toasts | sonner is planned for Phase 9 (Alerts); an inline banner is more appropriate for quota errors that persist until resolved |
| BroadcastChannel | Native storage event | BroadcastChannel requires extra wiring; storage event fires automatically on localStorage changes and is universally supported (Baseline since April 2017) |

**No npm install needed for Phase 1.**

## Architecture Patterns

### Recommended Project Structure

```
src/
├── lib/
│   ├── storage/
│   │   ├── types.ts               # StorageAdapter interface, VersionedData<T>, migration types
│   │   ├── errors.ts              # isQuotaExceededError(), StorageError type
│   │   ├── migrate.ts             # runMigrations() generic migration-on-read engine
│   │   └── shortlist-storage.ts   # ShortlistStorageAdapter (matches profile-storage.ts pattern)
│   └── eligibility/
│       └── profile-storage.ts     # Updated: add _version field + migration support
├── hooks/
│   └── useLocalStorage.ts         # Updated: error state, cross-tab storage event listener
├── components/
│   └── ui/
│       └── storage-error-banner.tsx  # Dismissible error banner for QuotaExceededError
└── routes/
    └── shortlist.tsx              # Refactored: uses ShortlistStorageAdapter, not raw useLocalStorage
```

### Pattern 1: Typed Storage Adapter (Existing -- Extend)

**What:** Class implementing a `StorageAdapter<T>` interface with `load()`, `save()`, `clear()`, `has()` methods, SSR-safe, with try/catch around all localStorage calls.
**When to use:** Every distinct localStorage data domain (profile, shortlist, tracker, alerts).
**Why:** Clean Clerk migration seam -- swap the adapter implementation, keep the interface.

```typescript
// Source: existing pattern in src/lib/eligibility/profile-storage.ts
export interface StorageAdapter<T> {
  load(): T | null;
  save(data: T): StorageWriteResult;
  clear(): void;
  has(): boolean;
}

// StorageWriteResult surfaces errors instead of swallowing them
export type StorageWriteResult =
  | { success: true }
  | { success: false; error: "quota_exceeded" | "security_error" | "unknown" };
```

### Pattern 2: Migration-on-Read with Version Registry

**What:** Every stored object gets a `_version: number` field. On `load()`, the adapter checks the stored version against the current version and runs sequential migration functions.
**When to use:** Any stored object that may need schema changes in future releases.

```typescript
export interface VersionedData {
  _version: number;
}

export type Migration<T> = (old: unknown) => T;

export interface MigrationRegistry<T> {
  currentVersion: number;
  migrations: Record<number, Migration<T>>; // key = target version
}

// Usage: migrate({ _version: 1, ... }, registry) returns current-version data
function migrate<T extends VersionedData>(
  data: unknown,
  registry: MigrationRegistry<T>,
): T { /* ... */ }
```

### Pattern 3: Cross-Tab Sync via useLocalStorage

**What:** `useLocalStorage` listens for the `window` `storage` event and updates its state when another tab changes the same key.
**When to use:** Automatically for all `useLocalStorage` consumers.

```typescript
// Key behavior: storage event fires ONLY in other tabs, not the originating tab
// StorageEvent properties: key, oldValue, newValue, storageArea, url
useEffect(() => {
  const handler = (e: StorageEvent) => {
    if (e.key === key && e.storageArea === localStorage) {
      setValue(e.newValue ? JSON.parse(e.newValue) : defaultValue);
    }
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}, [key, defaultValue]);
```

### Pattern 4: Error Surfacing via useLocalStorage

**What:** `useLocalStorage` returns a third element: `error` (or `null`). When a `setItem` call throws `QuotaExceededError`, the error state is set instead of silently swallowing.
**When to use:** All components that write to localStorage.

```typescript
// Return type changes from [T, setter] to [T, setter, StorageError | null]
export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
): [T, (value: T | ((prev: T) => T)) => void, StorageError | null]
```

### Anti-Patterns to Avoid

- **Direct localStorage calls in components:** shortlist.tsx and collections/$slug.tsx both call localStorage directly. After Phase 1, all writes should go through adapters or the useLocalStorage hook.
- **Silently swallowing quota errors:** The current `catch {}` blocks hide failures. Every write must surface errors.
- **Unversioned data shapes:** Adding fields later without migration causes silent data corruption when users have old schema in their browser.
- **Listening for storage events on the originating tab:** The `storage` event does NOT fire on the tab that made the change. Only other tabs receive it. Don't try to use it for same-tab reactivity.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Schema validation | Manual type guards | Zod schemas for stored objects | Zod is already in the project; provides parse-or-fail with detailed errors |
| QuotaExceededError detection | Simple `instanceof` check | Multi-field check (code 22/1014, name QuotaExceededError/NS_ERROR_DOM_QUOTA_REACHED) | Different browsers throw different variants; Firefox uses code 1014 and name NS_ERROR_DOM_QUOTA_REACHED |
| Cross-tab communication | BroadcastChannel or polling | Native `storage` event on `window` | Fires automatically on localStorage changes; universally supported; zero setup |

**Key insight:** This phase is intentionally low-level browser API work. No libraries solve the problem better than the native APIs for this scope. The abstraction value is in the adapter pattern and migration engine, not in third-party packages.

## Common Pitfalls

### Pitfall 1: Storage Event Does Not Fire on the Originating Tab

**What goes wrong:** Developer adds `storage` event listener expecting it to fire when the same tab writes to localStorage. It doesn't.
**Why it happens:** The `storage` event by specification only fires in OTHER browsing contexts (tabs/iframes) sharing the same origin.
**How to avoid:** In `useLocalStorage`, the local state update handles the originating tab. The `storage` event handler handles other tabs. These are two separate code paths.
**Warning signs:** State updates work in the current tab but not in other tabs, or vice versa.

### Pitfall 2: StorageEvent.key is null on clear()

**What goes wrong:** `localStorage.clear()` fires a `storage` event where `key`, `oldValue`, and `newValue` are all `null`. Code that assumes `key` is always a string crashes.
**Why it happens:** The spec defines `key` as `DOMString?` (nullable).
**How to avoid:** In the storage event handler, check `if (e.key === null)` and treat it as a full cache invalidation -- reload all keys.
**Warning signs:** Calling `clear()` in one tab causes errors in another.

### Pitfall 3: QuotaExceededError Varies by Browser

**What goes wrong:** Detection code checks only `err.name === "QuotaExceededError"` and misses Firefox's `NS_ERROR_DOM_QUOTA_REACHED`.
**Why it happens:** Browsers standardized differently; Firefox historically used Mozilla-specific error codes.
**How to avoid:** Use the multi-check pattern: `err instanceof DOMException && (err.code === 22 || err.code === 1014 || err.name === "QuotaExceededError" || err.name === "NS_ERROR_DOM_QUOTA_REACHED")`.
**Warning signs:** Error banner works in Chrome but not Firefox.

### Pitfall 4: Private/Incognito Mode Storage Limitations

**What goes wrong:** In Safari private mode (older versions), `localStorage.setItem()` throws `QuotaExceededError` immediately even when storage is empty.
**Why it happens:** Safari < 11 treats private mode localStorage as read-only with zero quota.
**How to avoid:** The `isStorageSupported()` check at app startup detects this. Modern Safari (11+) supports localStorage in private mode with the same quota, so this is a diminishing concern but worth guarding against.
**Warning signs:** Error banner appears immediately on first use in private browsing.

### Pitfall 5: Migration Ordering Matters

**What goes wrong:** Migrations are applied out of order (e.g., v1->v3 skipping v2), leaving data in an inconsistent state.
**Why it happens:** Migration registry uses an object with numeric keys; iteration order is not guaranteed for non-sequential integer keys in all contexts.
**How to avoid:** Run migrations sequentially in a `for` loop from `stored._version + 1` to `currentVersion`. Never skip versions.
**Warning signs:** Data has fields from v3 but is missing fields added in v2.

### Pitfall 6: JSON.parse Failure on Corrupted Data

**What goes wrong:** A browser extension, manual edit, or partial write leaves invalid JSON in localStorage. `JSON.parse` throws.
**Why it happens:** localStorage has no transaction guarantee -- a crash during `setItem` could theoretically leave partial data.
**How to avoid:** Always wrap `JSON.parse` in try/catch (existing code already does this). After migration, validate with Zod schema before returning.
**Warning signs:** `getProfile()` returns `null` for a user who previously had a profile.

## Code Examples

### QuotaExceededError Detection

```typescript
// Source: https://mmazzarolo.com/blog/2022-06-25-local-storage-status/
// Adapted for this project's TypeScript conventions

export function isQuotaExceededError(err: unknown): boolean {
  return (
    err instanceof DOMException &&
    (err.code === 22 ||
      err.code === 1014 ||
      err.name === "QuotaExceededError" ||
      err.name === "NS_ERROR_DOM_QUOTA_REACHED")
  );
}
```

### Updated useLocalStorage with Error + Cross-Tab Sync

```typescript
export type StorageError = "quota_exceeded" | "security_error" | "not_supported";

export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
): [T, (value: T | ((prev: T) => T)) => void, StorageError | null] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const [error, setError] = useState<StorageError | null>(null);

  // Write to localStorage on value change
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      setError(null); // Clear error on successful write
    } catch (err) {
      if (isQuotaExceededError(err)) {
        setError("quota_exceeded");
      } else {
        setError("security_error");
      }
    }
  }, [key, value]);

  // Cross-tab sync via storage event (STORE-04)
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === key && e.storageArea === localStorage) {
        try {
          setValue(e.newValue ? JSON.parse(e.newValue) : defaultValue);
        } catch {
          setValue(defaultValue);
        }
      }
      // Handle clear() -- key is null
      if (e.key === null) {
        setValue(defaultValue);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [key, defaultValue]);

  return [value, setValue, error];
}
```

### Versioned Data + Migration Engine

```typescript
export interface VersionedData {
  _version: number;
}

export type MigrationFn = (old: Record<string, unknown>) => Record<string, unknown>;

export interface MigrationConfig {
  currentVersion: number;
  migrations: Record<number, MigrationFn>; // key = version being migrated TO
}

export function migrateData<T extends VersionedData>(
  raw: unknown,
  config: MigrationConfig,
): T | null {
  if (!raw || typeof raw !== "object") return null;

  const data = raw as Record<string, unknown>;
  let version = typeof data._version === "number" ? data._version : 0;
  let current = { ...data };

  // Apply migrations sequentially
  while (version < config.currentVersion) {
    const nextVersion = version + 1;
    const migrateFn = config.migrations[nextVersion];
    if (!migrateFn) {
      // Missing migration -- data cannot be upgraded safely
      return null;
    }
    current = migrateFn(current);
    current._version = nextVersion;
    version = nextVersion;
  }

  return current as T;
}
```

### StorageAdapter Interface (Generalized from Existing Pattern)

```typescript
// Generalized from src/lib/eligibility/profile-storage.ts
export interface StorageAdapter<T> {
  load(): T | null;
  save(data: T): StorageWriteResult;
  clear(): void;
  has(): boolean;
}

export type StorageWriteResult =
  | { success: true }
  | { success: false; error: StorageError };

export type StorageError = "quota_exceeded" | "security_error" | "not_supported";
```

### ShortlistStorageAdapter (New)

```typescript
// Mirrors the existing LocalStorageProfileAdapter pattern
const SHORTLIST_KEY = "scholarhub-shortlist";

export class ShortlistStorageAdapter implements StorageAdapter<ShortlistData> {
  load(): ShortlistData | null {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(SHORTLIST_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      return migrateData<VersionedShortlistData>(parsed, shortlistMigrations);
    } catch {
      return null;
    }
  }

  save(data: ShortlistData): StorageWriteResult {
    if (typeof window === "undefined") return { success: false, error: "not_supported" };
    try {
      const versioned = { ...data, _version: CURRENT_SHORTLIST_VERSION };
      localStorage.setItem(SHORTLIST_KEY, JSON.stringify(versioned));
      return { success: true };
    } catch (err) {
      if (isQuotaExceededError(err)) return { success: false, error: "quota_exceeded" };
      return { success: false, error: "security_error" };
    }
  }

  clear(): void { /* ... */ }
  has(): boolean { /* ... */ }
}
```

## Existing localStorage Key Inventory

| Key | Used By | Current Pattern | Phase 1 Action |
|-----|---------|-----------------|----------------|
| `scholarhub_student_profile` | `profile-storage.ts` (adapter singleton) | Class adapter, SSR-safe, silent error swallow | Add `_version: 1`, migration support, return errors from `save()` |
| `scholarhub-shortlist` | `shortlist.tsx` via `useLocalStorage` hook | Raw hook in component | Create `ShortlistStorageAdapter`, add `_version: 1`, refactor route |
| `scholarhub_nationality` | `useScholarshipFilters.ts` via `useLocalStorage` | Raw hook, write-only (string) | Simple scalar -- add cross-tab sync via useLocalStorage update; no adapter needed |
| `scholarhub_nationality_banner_dismissed` | `useNationalityDetect.ts` via `useLocalStorage` | Raw hook (boolean) | Simple scalar -- add cross-tab sync via useLocalStorage update; no adapter needed |
| `collection_view_${slug}` | `collections/$slug.tsx` direct localStorage | Raw `getItem`/`setItem` in component | View counter debounce -- ephemeral, no adapter needed, but should use try/catch pattern |
| `theme` | `__root.tsx`, `Navbar.tsx`, `admin/route.tsx` | Direct `localStorage.setItem` | Theme toggle -- ephemeral preference, no adapter needed, but should not crash on quota |

**Note:** `scholarhub_nationality` and `scholarhub_nationality_banner_dismissed` are simple scalar values used through `useLocalStorage`. They don't need dedicated adapters but will automatically get cross-tab sync and error surfacing when the hook is updated.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `localStorage.setItem` with empty catch | Return error state from hook/adapter | N/A (implementation choice) | Users see when their data fails to save |
| Unversioned JSON blobs | `_version` field with migration-on-read | N/A (implementation choice) | Future schema changes don't corrupt user data |
| Direct localStorage in components | Typed adapter classes per data domain | Phase 1 (this phase) | Clean Clerk migration seam; single point of change |
| No cross-tab sync | `storage` event listener in useLocalStorage | Phase 1 (this phase) | Multi-tab users see consistent data |

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 (jsdom) |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| STORE-01 | useLocalStorage surfaces QuotaExceededError as error state | unit | `npx vitest run src/hooks/useLocalStorage.test.ts -t "quota"` | No -- Wave 0 |
| STORE-01 | isQuotaExceededError detects all browser variants | unit | `npx vitest run src/lib/storage/errors.test.ts` | No -- Wave 0 |
| STORE-02 | migrateData runs migrations sequentially from old version to current | unit | `npx vitest run src/lib/storage/migrate.test.ts` | No -- Wave 0 |
| STORE-02 | Profile adapter adds _version field and migrates on load | unit | `npx vitest run src/lib/eligibility/profile-storage.test.ts -t "version"` | Partially (existing test file, but no version tests) |
| STORE-03 | ShortlistStorageAdapter save/load/clear/has work correctly | unit | `npx vitest run src/lib/storage/shortlist-storage.test.ts` | No -- Wave 0 |
| STORE-04 | useLocalStorage updates state when storage event fires | unit | `npx vitest run src/hooks/useLocalStorage.test.ts -t "cross-tab"` | No -- Wave 0 |

### Sampling Rate

- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/hooks/useLocalStorage.test.ts` -- covers STORE-01 (error surfacing) and STORE-04 (cross-tab sync)
- [ ] `src/lib/storage/errors.test.ts` -- covers STORE-01 (isQuotaExceededError detection)
- [ ] `src/lib/storage/migrate.test.ts` -- covers STORE-02 (migration engine)
- [ ] `src/lib/storage/shortlist-storage.test.ts` -- covers STORE-03 (adapter correctness)
- [ ] Update `src/lib/eligibility/profile-storage.test.ts` -- covers STORE-02 (_version + migration for profile)

## Open Questions

1. **Should `collection_view_${slug}` and `theme` writes be updated for error handling?**
   - What we know: These are ephemeral writes (view counter debounce, theme toggle). They don't need adapters or versioning.
   - What's unclear: Whether silently failing on these is acceptable or if they should also surface errors.
   - Recommendation: Wrap in try/catch but DON'T surface errors to the user for ephemeral writes. A failed view counter or theme save is not user-facing. This is cleanup work, not a STORE requirement.

2. **Should the `useLocalStorage` hook return signature change break existing consumers?**
   - What we know: 4 existing consumers use `const [val, setVal] = useLocalStorage(...)`. Adding a third return element (`error`) is backward-compatible with array destructuring -- unused elements are simply ignored.
   - What's unclear: Nothing -- this is safe.
   - Recommendation: Add error as third element. Existing `[val, setVal]` destructuring continues to work.

3. **Adapter for shortlist: class singleton vs. hook-based?**
   - What we know: Profile uses a class singleton (`profileStorage`). Shortlist currently uses `useLocalStorage` inside a component with React state.
   - What's unclear: Whether shortlist should be a class singleton (like profile) or stay as a hook that wraps the adapter.
   - Recommendation: Create class singleton `shortlistStorage` matching the profile pattern. Create a `useShortlist()` hook that wraps it with React state + cross-tab sync, similar to how `useStudentProfile()` wraps `profileStorage`. This keeps the adapter pattern consistent and makes the Clerk migration seam clean.

## Sources

### Primary (HIGH confidence)

- [MDN: Window storage event](https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event) -- cross-tab behavior, event properties, browser compatibility (Baseline since April 2017)
- [MDN: StorageEvent](https://developer.mozilla.org/en-US/docs/Web/API/StorageEvent) -- key/oldValue/newValue/storageArea/url properties
- [MDN: Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) -- 5 MiB limit per origin for localStorage
- Existing codebase: `src/lib/eligibility/profile-storage.ts` -- adapter pattern, SSR safety, singleton export
- Existing codebase: `src/hooks/useLocalStorage.ts` -- current hook implementation, silent error swallowing

### Secondary (MEDIUM confidence)

- [Handling localStorage errors (Matteo Mazzarolo)](https://mmazzarolo.com/blog/2022-06-25-local-storage-status/) -- QuotaExceededError detection function with multi-browser coverage (verified against MDN)
- [Zustand cross-tab sync discussion](https://github.com/pmndrs/zustand/discussions/1141) -- confirms Zustand persist does NOT include cross-tab sync by default; separate middleware needed for Phase 2+

### Tertiary (LOW confidence)

None -- all findings verified with primary or secondary sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies; all browser APIs are Baseline-supported
- Architecture: HIGH -- extending existing proven patterns (profile adapter) to shortlist; well-understood migration-on-read pattern
- Pitfalls: HIGH -- QuotaExceededError browser variance and storage event cross-tab behavior are well-documented on MDN
- Migration engine: MEDIUM -- pattern is standard but the exact Zod integration for migration validation will need to be validated during implementation

**Research date:** 2026-04-03
**Valid until:** 2026-05-03 (stable browser APIs; 30-day validity)
