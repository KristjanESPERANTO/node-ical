# Incremental PR Plan for Remaining Improvements

This document outlines remaining improvements to be implemented in small, reviewable Pull Requests.

---

## v1.0.0 Candidates

### PR3: parseICS/parseICSAsync API Split

**Branch:** `async`

**Context:** Issue #144 (uncatchable errors in async mode) was fixed in #462 via proper try-catch placement. What remains is the cleaner API split itself.

**Scope:**
- Split `parseICS(str, cb)` dual-mode into `parseICS(str)` (sync only) and `parseICSAsync(str, cb)` (async only)
- Update `node-ical.js` internal callers

**Breaking Changes:** Yes — callers using `ical.parseICS(data, callback)` must migrate to `parseICSAsync`.

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

### PR6: Fixture Renames & Directory Restructure

**Context:** Best done just before or during v1.0 to avoid merge conflicts with forks.

**Scope:**
- Create `test/fixtures/` directory
- Rename `test1.ics`…`test23.ics` to semantic names
- Add `FIXTURES.md` with descriptions
- Update all test files to use new paths

---

## Notes

- Keep each PR atomic and independently mergeable
- Near-term PRs must be fully backward compatible
- Run full test suite and linter before each PR
