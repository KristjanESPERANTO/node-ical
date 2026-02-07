# Incremental PR Plan for Remaining Improvements

This document outlines remaining improvements to be implemented in small, reviewable Pull Requests.

---

## Completed (Since October 2025)

### ✅ PR1: rrule-temporal Migration
**Merged:** PR #422, v0.23.0 (commit c97c7ca)
- Replaced `rrule` 2.8.1 with `rrule-temporal`
- Added `@js-temporal/polyfill` via npm overrides (#442)
- Fixes DST bugs in recurring events

### ✅ PR3: Event Expansion Helpers
**Merged:** PR #430, v0.24.0 (commit 028531f)
- Added `expandRecurringEvent()` API
- Handles RRULE, EXDATE, RECURRENCE-ID overrides
- DST-safe processing for full-day events

### ✅ Other Improvements (Not in original plan)
- RFC 5545 SEQUENCE support (#440)
- VCALENDAR handling and TypeScript support (#439)
- ParameterValue type for properties with params (#438)
- Google Calendar UNTIL timezone handling (#436)
- Async parseICS error handling (#446)
- Remove unused params field (#448)
- TypeScript required fields fix (#449)

---

## Proposed PR Sequence

---

### PR2: Fixture Renames & Directory Restructure
**Status:** Not started

**Scope:**
- Create `test/fixtures/` directory
- Rename numeric files with semantic names:
  - `test1.ics` → `lanyrd_conferences.ics`
  - `test2.ics` → `... (TBD based on content)`
  - etc.
- Add `FIXTURES.md` with mapping and descriptions
- Update all test files to use new paths
- Remove numeric fixtures from test root

**Acceptance:**
- All tests green
- Git recognizes renames where possible
- Only path changes + docs + file moves (no logic changes)

**Dependency:** None (can be done independently)

---

### PR3: Documentation Updates
**Status:** Not started

**Scope:**
- Add/update `CHANGELOG.md` with version history
- Create `ROADMAP.md` for future plans
- Update README examples and API documentation
- Document migration guides if needed
- Clean up `.npmignore`

**Acceptance:**
- No code/test changes
- Documentation is accurate and up-to-date

---

### PR4: Async/Await Refactoring (v0.30.0 Target)
**Status:** Designed, implementation ready (Branch: `async`)
**Target Version:** v0.30.0

**Scope:**
- Refactor `parseICS` async mode from callback+setImmediate to native async/await
- Add new `parseICSAsync()` Promise-based API
- Fix uncatchable exceptions in async mode (Issue #144)
- Maintain 100% backward compatibility with existing callback API
- Implement proper error propagation for large files (>2000 lines)

**Current Problem:**
```javascript
// Currently broken - errors crash process
ical.parseICS(malformedData, (err, data) => {
  if (err) console.log('Never called!'); // Uncatchable!
});
```

**New API:**
```javascript
// Modern Promise-based API
try {
  const data = await ical.parseICSAsync(largeICS);
} catch (err) {
  console.log('Error caught properly!'); // ✅ Works!
}

// Existing callback API still works (wrapper)
ical.parseICS(data, (err, data) => {
  if (err) console.log('Now works!'); // ✅ Fixed!
});
```

**Benefits:**
- **Fixes Issue #144**: Proper error propagation for async parsing
- **Modern API**: Native async/await support
- **Better control flow**: Flat async code vs callback hell
- **Event loop friendly**: Yields periodically to prevent blocking
- **Backward compatible**: Existing callback API remains unchanged
- **Optional features (Phase 2)**: AbortController support for cancellation

**Architecture Changes:**
- Core logic: `parseICS()` → internal `_parseICSAsync()`
- Event loop yielding every 2000 lines (configurable)
- Constant stack depth (no recursive setImmediate)
- Proper try-catch boundaries

**Breaking Changes:**
- None (fully backward compatible)
- Semantic versioning: v0.30.0 (major feature addition, no breaking changes)

**Acceptance:**
- All existing tests pass (146 tests)
- New async/await tests pass
- Callback API works via Promise wrapper
- Errors are catchable in both modes
- Performance parity or better

**Documentation:**
- Full proposal: `docs/async-await-refactoring-proposal.md`

**Why v0.30.0 (not v1.0.0)?**
- Major feature addition but no breaking changes
- Incremental semver approach
- Reserves v1.0.0 for when ESM migration is also complete
- Signals significant improvement without "v1.0 commitment"
- Follows existing version progression (0.23 → 0.24 → 0.25 → 0.30)

---

### PR5: Full ESM Migration with CJS Compatibility
**Status:** Not started

**Scope:**
- Convert source files to ESM (`ical.js` → `ical.mjs`, `tz-utils.js` → `tz-utils.mjs`)
- Set `"type": "module"` in `package.json`
- Add CJS wrapper for backward compatibility (generate CommonJS build or use dynamic wrapper)
- Configure `exports` field for dual ESM/CJS support:
  ```json
  "exports": {
    ".": {
      "import": "./ical.mjs",
      "require": "./dist/ical.cjs"
    }
  }
  ```
- Update all imports to use explicit `.mjs` extensions
- Migrate examples to ESM syntax
- Update TypeScript definitions to work with both module systems
- Update README with ESM-first examples (CJS as legacy option)

**Benefits:**
- Future-proof: ESM is the JavaScript standard
- Better tree-shaking and bundler optimization
- Native browser compatibility
- Clearer async/await patterns
- Backward compatible via CJS wrapper

**Breaking Changes:**
- None for users (dual export maintains compatibility)
- Developers contributing need ESM knowledge

**Acceptance:**
- `import ical from 'node-ical'` works in Node ESM (primary path)
- `require('node-ical')` still works via CJS wrapper
- All 146+ tests passing in ESM environment
- TypeScript definitions work for both import styles
- No regression in CJS compatibility

---

### PR6: Enhanced CI Matrix
**Status:** Not started

**Scope:**
- Expand CI matrix to test Node 18, 20, 22, 24
- Enable CodeQL analysis for JavaScript/TypeScript
- Update `engines` field in `package.json` if needed

**Acceptance:**
- CI runs green across all Node versions
- CodeQL job completes successfully
- No new security alerts

---

### PR7: Code Coverage
**Status:** Not started

**Scope:**
- Add code coverage tooling (`c8` or `nyc`)
- Generate coverage reports in CI
- Set reasonable baseline thresholds
- Add coverage badge to README

**Acceptance:**
- Coverage reports generated successfully
- No existing tests broken
- Baseline coverage documented

---

### PR8: RRULE Expansion Guards
**Status:** Not started

**Scope:**
- Add configurable upper bounds for recurrence expansion
- Prevent runaway expansions (e.g., max instances or time window)
- Provide sane defaults with per-call override options
- Document behavior when limits are hit

**Acceptance:**
- Existing tests remain green
- New tests cover guard thresholds
- No breaking changes to default behavior

---

## Dependency Graph

```
PR2 (fixtures) → independent
PR3 (docs) → independent
PR4 (async/await) → v0.30.0 release 🎯
PR5 (ESM) → v1.0.0 candidate (future)
PR6 (CI) → independent
PR7 (coverage) → independent
PR8 (guards) → independent
```

---

## Priority Recommendations

**v0.30.0 Roadmap (Next Major Release):**
1. **PR4 (async/await)** - Modern async API, fixes critical Issue #144
2. **PR3 (docs)** - Update for v0.30.0 changes
3. **PR2 (fixtures)** - Improves maintainability (optional)

**Rationale for v0.30.0:**
- Major feature: Modern async/await API
- Fixes critical bug: Issue #144 (open since 2021)
- Fully backward compatible
- Incremental semver: signals major improvement without v1.0 commitment
- Preserves v1.0.0 for ESM migration milestone

**Future v1.0.0 Roadmap:**
- PR5 (ESM migration) - Breaking module system change
- Signals complete modernization and stability
- "v1.0 = Modern ESM, async/await, TypeScript, Temporal"

**Medium Priority:**
2. **PR6 (CI)** - Enhanced testing
3. **PR2 (fixtures)** - If not in v0.30.0

**Low Priority (Nice to have):**
4. PR7-8 - Quality of life improvements

---

## Notes

- Keep each PR atomic and independently mergeable
- All PRs should maintain backward compatibility unless explicitly versioned as breaking
- Run full test suite and linter before each PR
- Update documentation in the same PR as code changes when applicable

---

(Updated: February 7, 2026)


