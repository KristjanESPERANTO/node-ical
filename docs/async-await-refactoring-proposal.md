# Async/Await Refactoring Proposal for parseICS

## Issue Reference
- **GitHub Issue:** [#144 - Uncatchable exception "No toISOString function in exdate[name]"](https://github.com/jens-maus/node-ical/issues/144)
- **Created:** 2021
- **Status:** Open

## Problem Statement

When `parseICS()` is called with a callback (async mode), errors thrown during parsing occur inside `setImmediate()` callbacks, making them **uncatchable** via try-catch or the error callback parameter.

### Current Behavior (Broken)

```javascript
// This does NOT work - errors crash the process
ical.parseICS(malformedData, (err, data) => {
  if (err) {
    console.log('Error:', err); // Never called!
  }
});

// Even try-catch doesn't help
try {
  ical.parseICS(malformedData, callback);
} catch (e) {
  // Only catches synchronous errors in the first iteration
}
```

### Root Cause

The current implementation uses recursive `setImmediate()` calls without error handling:

```javascript
// Current code (ical.js lines 1123-1132)
if (cb) {
  if (i < lines.length) {
    setImmediate(() => {
      this.parseLines(lines, limit, ctx, stack, i + 1, cb);
      // ❌ No try-catch - errors escape to global handler
    });
  } else {
    setImmediate(() => {
      cb(null, ctx);
    });
  }
}
```

## Proposed Solution: Async/Await Refactoring

### New Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Public API                              │
├─────────────────────────────────────────────────────────────┤
│  parseICS(string)          → Sync (existing)                │
│  parseICS(string, cb)      → Callback wrapper (backward)    │
│  parseICSAsync(string)     → Promise (new, native)          │
│  fromURL(url)              → Promise (existing)             │
│  fromURL(url, cb)          → Callback wrapper (existing)    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Internal Implementation                    │
├─────────────────────────────────────────────────────────────┤
│  _parseICSAsync(string)    → Core async logic               │
│  _parseLine(line, ctx)     → Single line parser             │
│  _yieldToEventLoop()       → Event loop yielding            │
└─────────────────────────────────────────────────────────────┘
```

### Implementation

#### Core Async Parser

```javascript
/**
 * Asynchronous ICS parser with proper error propagation.
 * Yields to event loop periodically to prevent blocking.
 *
 * @param {string} string - Raw ICS content
 * @returns {Promise<CalendarResponse>} Parsed calendar data
 * @throws {Error} Propagates parsing errors to caller
 */
async parseICSAsync(string) {
  const lines = string.split(/\r?\n/);
  const limit = 2000; // Lines per event loop cycle

  let ctx = {};
  const stack = [];

  for (let i = 0; i < lines.length; i++) {
    // Yield to event loop every `limit` lines
    // This prevents blocking and allows other async operations to proceed
    if (i > 0 && i % limit === 0) {
      await this._yieldToEventLoop();
    }

    // Process single line - errors automatically propagate
    this._processLine(lines[i], ctx, stack);
  }

  // Cleanup
  delete ctx.type;
  delete ctx.params;

  return ctx;
}

/**
 * Yields execution to the event loop.
 * Equivalent to setImmediate but Promise-based.
 */
_yieldToEventLoop() {
  return new Promise(resolve => setImmediate(resolve));
}

/**
 * Process a single ICS line.
 * Extracted from parseLines for cleaner separation.
 */
_processLine(line, ctx, stack) {
  // ... existing line processing logic from parseLines ...
  // Errors thrown here will properly propagate up the async chain
}
```

#### Backward-Compatible Wrapper

```javascript
/**
 * Parse ICS string - supports both sync and async modes.
 *
 * @param {string} string - Raw ICS content
 * @param {Function} [cb] - Optional callback for async mode
 * @returns {CalendarResponse|void} Sync: returns data, Async: void
 *
 * @example
 * // Sync mode
 * const data = ical.parseICS(icsString);
 *
 * @example
 * // Async mode with callback (backward compatible)
 * ical.parseICS(icsString, (err, data) => {
 *   if (err) return handleError(err);
 *   processData(data);
 * });
 *
 * @example
 * // Async mode with Promise (new)
 * const data = await ical.parseICSAsync(icsString);
 */
parseICS(string, cb) {
  // Sync mode - no callback provided
  if (!cb) {
    return this.parseICSSync(string);
  }

  // Async mode - use Promise internally, expose via callback
  this.parseICSAsync(string)
    .then(result => {
      // Use setImmediate to maintain async behavior
      setImmediate(() => cb(null, result));
    })
    .catch(error => {
      // ✅ Errors now properly reach the callback!
      setImmediate(() => cb(error, null));
    });
}

/**
 * Synchronous ICS parser.
 * Renamed from current sync implementation for clarity.
 */
parseICSSync(string) {
  const lines = string.split(/\r?\n/);
  return this.parseLines(lines);
}
```

### Migration Path

#### Phase 1: Add async support (non-breaking)
1. Add `parseICSAsync()` as new method
2. Refactor `parseICS(string, cb)` to use Promise internally
3. Keep `parseICS(string)` sync behavior unchanged
4. All existing code continues to work

#### Phase 2: Encourage Promise usage (documentation)
1. Update README with Promise examples
2. Add TypeScript overloads for better IDE support
3. Mark callback usage as "legacy" in docs

#### Phase 3: Consider deprecation (future major version)
1. Deprecation warning for callback usage
2. Full migration to Promise-only API in v2.0

## Comparison

| Aspect | setImmediate (current) | async/await (proposed) |
|--------|------------------------|------------------------|
| Error Handling | ❌ Uncatchable | ✅ Automatic propagation |
| Code Readability | 🟡 Recursive, complex | ✅ Linear, clear |
| Testability | ❌ Hard to test | ✅ Easy with async/await |
| Stack Traces | ❌ Fragmented | ✅ Complete |
| Promise Support | ❌ Callback only | ✅ Native |
| Backward Compat | ✅ N/A | ✅ Via wrapper |
| Event Loop Yield | ✅ Every iteration | ✅ Every N lines (configurable) |
| Memory Usage | 🟡 Stack growth | ✅ Constant |

## Testing Strategy

### Unit Tests

```javascript
describe('parseICSAsync', () => {
  it('should parse valid ICS', async () => {
    const data = await ical.parseICSAsync(validICS);
    expect(data).toHaveProperty('vcalendar');
  });

  it('should propagate parsing errors', async () => {
    await expect(ical.parseICSAsync(malformedICS))
      .rejects.toThrow('No toISOString function');
  });

  it('should not block event loop for large files', async () => {
    const start = Date.now();
    let eventLoopTicks = 0;

    const interval = setInterval(() => eventLoopTicks++, 1);

    await ical.parseICSAsync(largeICS);

    clearInterval(interval);
    expect(eventLoopTicks).toBeGreaterThan(0);
  });
});

describe('parseICS with callback (backward compat)', () => {
  it('should call callback with error on malformed data', (done) => {
    ical.parseICS(malformedICS, (err, data) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toContain('toISOString');
      expect(data).toBeNull();
      done();
    });
  });

  it('should call callback with data on valid input', (done) => {
    ical.parseICS(validICS, (err, data) => {
      expect(err).toBeNull();
      expect(data).toHaveProperty('vcalendar');
      done();
    });
  });
});
```

### Integration Tests

```javascript
describe('Error recovery scenarios', () => {
  it('should handle EXDATE without toISOString', async () => {
    const ics = `BEGIN:VCALENDAR
BEGIN:VEVENT
DTSTART:invalid
RRULE:FREQ=DAILY
END:VEVENT
END:VCALENDAR`;

    await expect(ical.parseICSAsync(ics))
      .rejects.toThrow();
  });

  it('should handle partial parsing gracefully', async () => {
    // Future: could implement partial results with errors array
  });
});
```

## TypeScript Support

```typescript
// node-ical.d.ts additions

export interface ParseOptions {
  /** Maximum lines to process per event loop cycle (default: 2000) */
  yieldInterval?: number;
  /** Whether to continue parsing after recoverable errors */
  lenient?: boolean;
}

export function parseICS(ics: string): CalendarResponse;
export function parseICS(ics: string, callback: NodeIcalCallback): void;
export function parseICSAsync(ics: string, options?: ParseOptions): Promise<CalendarResponse>;
```

## Performance Considerations

### Event Loop Yielding

The `yieldInterval` (default 2000 lines) balances:
- **Too low:** Excessive context switching, slower parsing
- **Too high:** Blocks event loop, poor responsiveness

Benchmarks suggest 2000 lines is optimal for most use cases.

### Memory Usage

The async/await approach has **constant stack depth** vs recursive setImmediate:

```
setImmediate (current):
  parseLines → setImmediate → parseLines → setImmediate → ...
  (Stack can grow with very long files on some engines)

async/await (proposed):
  parseICSAsync → for loop (flat)
  (Constant stack depth regardless of file size)
```

## Design Decisions

### 1. Partial results on error? → **No**

Keep simple fail-fast behavior.

**Rationale:**
- Increases API complexity significantly
- Users would need to always check the `errors` array
- "Half-parsed" data can lead to subtle bugs downstream
- Primary goal is **catchable errors**, not graceful degradation
- Can be added later as `{ lenient: true }` option if demand arises

### 2. Streaming API? → **No**

ICS format is not stream-friendly.

**Rationale:**
- Line folding: Long lines are split across multiple lines, requiring lookahead
- VEVENT blocks must be read completely before processing
- RRULE expansion needs the entire event context
- ICS files are rarely large enough to warrant streaming
- Complexity vs. benefit ratio is poor
- Workaround for huge files: HTTP streaming + chunked parsing in userland

### 3. AbortController support? → **Yes (Phase 2)**

Modern, standardized cancellation pattern.

**Rationale:**
- Standard Web API pattern, familiar to developers
- Fits perfectly with async/await
- Useful for:
  - Timeouts on large files
  - User-initiated cancellation in UIs
  - Resource cleanup on component unmount
- Easy to implement:
  ```javascript
  async parseICSAsync(string, { signal } = {}) {
    for (let i = 0; i < lines.length; i++) {
      if (signal?.aborted) {
        throw new DOMException('Parsing aborted', 'AbortError');
      }
      // ... parsing logic
    }
  }
  ```
- Non-breaking change (optional parameter)
- Aligns with `fetch()` API patterns

## References

- [Issue #144](https://github.com/jens-maus/node-ical/issues/144) - Original bug report
- [MDN: async/await](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Promises)
- [Node.js: setImmediate vs nextTick](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/)
