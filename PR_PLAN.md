# Incremental PR Plan for Remaining Improvements

This document outlines remaining improvements to be implemented in small, reviewable Pull Requests.

---

## Current State (October 2025)

### In Progress
- **rrule-temporal Migration** (Branch: `temporal`)
  - Migration from `rrule` 2.8.1 to `rrule-temporal`
  - Introduces `@js-temporal/polyfill` as runtime dependency
  - Adds `RRuleCompatWrapper` for backward compatibility
  - Fixes DST bugs in recurring events ([#100](https://github.com/jens-maus/node-ical/issues/100))
  - All 72 tests passing
  - Documentation: `RRULE_TEMPORAL_MIGRATION.md`

---

## Proposed PR Sequence

### PR1: rrule-temporal Migration
**Branch:** `testing`

**Scope:**
- Replace `rrule` 2.8.1 with `rrule-temporal` (uses TC39 Temporal API)
- Add `@js-temporal/polyfill` ^0.5.1 as runtime dependency
- Implement `RRuleCompatWrapper` to maintain backward compatibility (Temporal.ZonedDateTime → Date)
- Use `Intl.DateTimeFormat` for timezone-aware date component extraction
- Update TypeScript definitions (`node-ical.d.ts`)

**Benefits:**
- Fixes DST bugs in recurring events (jens-maus/node-ical#100)
- Future-proof: Based on TC39 Temporal standard
- Better timezone handling across DST transitions
- Support for non-gregorian calendars (RFC 7529)

**Breaking Changes:**
- None (100% backward compatible via wrapper)

**Bundle Size Impact:**
- Current: ~40 KB (rrule 2.8.1)
- After migration: ~140 KB (rrule-temporal + Temporal polyfill)
- Future: ~40 KB (when Temporal is native in JavaScript engines)

**Acceptance:**
- All 72 tests passing
- No breaking changes to existing API
- Linter passing (npm run lintfix: Exit Code 0)

**Status:** Ready for review
- Branch rebased on master 0.22.1
- Code review completed
- Documentation complete

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

### PR3: Event Expansion Helpers
**Status:** Ready (Branch: `recurring`)

**Scope:**
- Add `expandRecurringEvents(data, rangeStart, rangeEnd)` helper function
- Add `expandRecurringEventsAsync(dataPromise, rangeStart, rangeEnd)` async version
- Simplify example scripts (reduce boilerplate from ~100 to ~30 lines)
- Add unit tests for helpers
- Update README with helper documentation

**Benefits:**
- Saves users from writing complex RRULE + EXDATE + RECURRENCE-ID handling
- Tested, production-ready expansion logic
- Deduplicates overrides, respects exclusions
- Returns clean array of instances with `{summary, start, end, duration, uid, original}`

**Acceptance:**
- All tests green (70 passing)
- Helper functions well-documented
- Examples demonstrate usage with different date libraries

**Status:** Branch rebased on master, ready for review

**Dependency:** None (can be merged independently of rrule-temporal)

---

### PR4 (Optional): Documentation Updates
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

### PR5 (Optional): Full ESM Migration with CJS Compatibility
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
- All 72+ tests passing in ESM environment
- TypeScript definitions work for both import styles
- No regression in CJS compatibility

---

### PR6 (Optional): Enhanced CI Matrix
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

### PR7 (Optional): Code Coverage
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

### PR8 (Optional): RRULE Expansion Guards
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
PR1 (rrule-temporal) ─┐
                      ├─→ PR4 (docs)
PR3 (expand helpers) ─┘

PR2 (fixtures) → independent

PR5 (ESM) → independent
PR6 (CI) → independent
PR7 (coverage) → independent
PR8 (guards) → independent
```

---

## Priority Recommendations

**High Priority:**
1. **PR1 (rrule-temporal)** - Fixes real bugs, future-proof architecture
2. **PR3 (expand helpers)** - High value for users, reduces boilerplate

**Medium Priority:**
3. **PR2 (fixtures)** - Improves maintainability
4. **PR4 (docs)** - Helps users understand changes

**Low Priority (Nice to have):**
5. PR5-8 - Quality of life improvements

---

## Notes

- Keep each PR atomic and independently mergeable
- All PRs should maintain backward compatibility unless explicitly versioned as breaking
- Run full test suite and linter before each PR
- Update documentation in the same PR as code changes when applicable

---

(Updated: October 25, 2025)

