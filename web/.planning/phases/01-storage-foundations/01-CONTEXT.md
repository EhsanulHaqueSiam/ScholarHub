# Phase 1: Storage Foundations - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

Safe, versioned, cross-tab-synced localStorage infrastructure before any feature builds on it. Fix QuotaExceededError in useLocalStorage, add _version fields to all stored objects, wrap shortlist in typed StorageAdapter, and add cross-tab storage event listener.

Requirements: STORE-01, STORE-02, STORE-03, STORE-04

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

Key constraints from research:
- Existing `LocalStorageProfileAdapter` pattern is the correct Clerk migration seam
- All new storage must follow the same typed interface + adapter pattern
- No component should call `localStorage` directly after this phase
- `useLocalStorage` hook must surface QuotaExceededError visibly (error banner)
- All stored objects need `_version` field for schema migration
- Cross-tab `storage` event listener for data sync

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `web/src/lib/eligibility/profile-storage.ts` — LocalStorageProfileAdapter with typed interface
- `web/src/hooks/useLocalStorage.ts` — Current hook (silently swallows QuotaExceededError)
- `web/src/routes/shortlist.tsx` — Uses `useLocalStorage("scholarhub_shortlist")` directly (needs wrapping)

### Established Patterns
- Eligibility profile uses adapter pattern with `save()`, `load()`, `clear()` methods
- Static data hooks use module-level singletons for caching
- Zod for validation, TypeScript interfaces for type safety

### Integration Points
- Shortlist route needs to use new adapter
- Eligibility profile storage needs _version field added
- Future tracker/alerts/notifications will build on these adapters

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase. Follow existing adapter patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discuss phase skipped.

</deferred>
