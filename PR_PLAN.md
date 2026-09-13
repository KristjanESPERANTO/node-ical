# Incremental PR Plan for Remaining Improvements

This document tracks only work that is still open. Completed modernization work is intentionally omitted.

## PR3: Complete the `parseICS` / `parseICSAsync` API Split

**Branch:** `async`

Issue #144 (uncatchable async errors) was fixed in #462. The repository already has separate
`sync` and `async` namespaces, and `ical.async.parseICS()` already returns a Promise or accepts a
callback. The remaining work is to expose the dedicated API consistently at the top level, as
discussed in [#476](https://github.com/jens-maus/node-ical/issues/476).

### Step 1: Non-breaking

- Add public `parseICSAsync(str)` to the ESM export, CommonJS export, default export, and TypeScript declarations.
- Use the dedicated async function in internal async callers instead of relying on the callback overload of `ical.parseICS`.
- Keep `parseICS(str, callback)` working for compatibility and emit a deprecation warning when it is used.
- Keep `ical.async.parseICS()` as a compatibility alias or document it as the preferred namespaced form.
- Add runtime and TypeScript tests for Promise behavior, callback behavior, named exports, and the deprecation warning.
- Update README examples to use `parseICSAsync()` for new async string parsing code.

### Step 2: v1.0.0 breaking change

- Remove the callback overload from `parseICS`.
- Make `parseICS(str)` sync-only and direct callers using `parseICS(data, callback)` to `parseICSAsync(data)`.
- Remove the deprecation warning once the callback path is removed.

**Step 1 compatibility:** backward compatible apart from the new warning.

## PR4: Make Missing `DTEND` Behavior RFC-Compliant

The parser currently derives an implicit `end` for `VEVENT` and `VTODO` when a start exists
but no `DTEND` or `DUE` is present. That behavior is convenient but does not match RFC 5545.

### v1.0.0 scope

- Default to RFC-compliant behavior: leave `event.end` undefined when `DTEND` is absent.
- Preserve the existing derived-end behavior behind an explicit `options.legacyDtend` compatibility flag.
- Thread the option through all relevant entry points: sync parsing, async parsing, file parsing, URL parsing, and recurrence expansion where applicable.
- Define the option in the public TypeScript types and document its migration purpose.
- Add tests for `VEVENT` with and without `DTEND`, `VTODO` with and without `DUE`, date-only events, `DURATION`, and both values of `legacyDtend`.
- Verify that `VALARM`, `VJOURNAL`, `VFREEBUSY`, and other components are not accidentally affected.
- Review `expandRecurringEvent` behavior when an event has no end before changing the default.

This is a breaking behavior change and should be isolated from PR3. Before implementation,
confirm whether the compatibility option belongs in parser options, API options, or both.

## Delivery Rules

- Keep PR3 Step 1 and PR4 atomic and independently mergeable.
- Do not combine the PR4 behavior change with unrelated lint or formatting changes.
- Run `npm test` before each PR is opened.
- Verify both ESM and CommonJS package entry points for every public API change.
