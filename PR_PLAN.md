# Incremental PR Plan for Remaining Improvements

This document outlines remaining improvements to be implemented in small, reviewable Pull Requests.

---

## v1.0.0 Candidates

### PR3: parseICS/parseICSAsync API Split

**Branch:** `async`

**Context:** Issue #144 (uncatchable errors in async mode) was fixed in #462 via proper try-catch
placement. What remains is the cleaner API split itself — see [#476](https://github.com/jens-maus/node-ical/issues/476) for the full motivation.

**Step 1 — non-breaking (do now):**
- Add `parseICSAsync(str)` as a dedicated async function
- Keep `parseICS(str, cb)` working but emit a deprecation warning when called with a callback
- Update `node-ical.js` internal callers to use `parseICSAsync` where appropriate
- Update TypeScript definitions

**Step 2 — breaking (v1.0.0):**
- Remove the callback path from `parseICS` entirely
- `parseICS(str)` becomes sync-only
- Callers using `ical.parseICS(data, callback)` must migrate to `parseICSAsync`

**Breaking Changes:** Step 1: none. Step 2: yes.

---

### PR4: RFC-Compliant DTEND Handling

**Context:** The parser auto-calculates `end` when `DTEND` is absent, which deviates from RFC 5545.

**Scope:**
- v1.0.0: Change default behavior to RFC-compliant (`end` is `undefined` when absent)
- Provide `options.legacyDtend` flag to restore old behavior during migration
- Add tests for both presence/absence of `DTEND`

---

### PR5: Full ESM Migration with CJS Compatibility

**Scope:**
- Convert to ESM with dual `exports` field (`import` + `require`)
- Update TypeScript definitions for both module systems
- README: ESM-first examples, CJS as legacy

**Breaking Changes:** None for users (dual export). Contributors need ESM knowledge.

---

## Notes

- Keep each PR atomic and independently mergeable
- Near-term PRs must be fully backward compatible
- Run full test suite and linter before each PR
