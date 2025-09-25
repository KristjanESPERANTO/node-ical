const fs = require('node:fs');
const ical = require('./ical.js');

/**
 * ICal event object.
 *
 * These two fields are always present:
 *  - type
 *  - params
 *
 * The rest of the fields may or may not be present depending on the input.
 * Do not assume any of these fields are valid and check them before using.
 * Most types are simply there as a general guide for IDEs and users.
 *
 * @typedef iCalEvent
 * @type {object}
 *
 * @property {string} type           - Type of event.
 * @property {Array} params          - Extra event parameters.
 *
 * @property {?object} start         - When this event starts.
 * @property {?object} end           - When this event ends.
 *
 * @property {?string} summary       - Event summary string.
 * @property {?string} description   - Event description.
 *
 * @property {?object} dtstamp       - DTSTAMP field of this event.
 *
 * @property {?object} created       - When this event was created.
 * @property {?object} lastmodified  - When this event was last modified.
 *
 * @property {?string} uid           - Unique event identifier.
 *
 * @property {?string} status        - Event status.
 *
 * @property {?string} sequence      - Event sequence.
 *
 * @property {?string} url           - URL of this event.
 *
 * @property {?string} location      - Where this event occurs.
 * @property {?{
 *     lat: number, lon: number
 * }} geo                            - Lat/lon location of this event.
 *
 * @property {?Array.<string>}       - Array of event catagories.
 */
/**
 * Object containing iCal events.
 * @typedef {Object.<string, iCalEvent>} iCalData
 */
/**
 * Callback for iCal parsing functions with error and iCal data as a JavaScript object.
 * @callback icsCallback
 * @param {Error} err
 * @param {iCalData} ics
 */
/**
 * A Promise that is undefined if a compatible callback is passed.
 * @typedef {(Promise.<iCalData>|undefined)} optionalPromise
 */

// utility to allow callbacks to be used for promises
function promiseCallback(fn, cb) {
  const promise = new Promise(fn);
  if (!cb) {
    return promise;
  }

  promise
    .then(returnValue => {
      cb(null, returnValue);
    })
    .catch(error => {
      cb(error, null);
    });
}

// Sync functions
const sync = {};
// Async functions
const async = {};
// Auto-detect functions for backwards compatibility.
const autodetect = {};

/**
 * Download an iCal file from the web and parse it.
 *
 * @param {string} url                - URL of file to request.
 * @param {Object|icsCallback} [opts] - Options to pass to fetch(). Supports headers and any standard RequestInit fields.
 *                                      Alternatively you can pass the callback function directly.
 *                                      If no callback is provided a promise will be returned.
 * @param {icsCallback} [cb]          - Callback function.
 *                                      If no callback is provided a promise will be returned.
 *
 * @returns {optionalPromise} Promise is returned if no callback is passed.
 */
async.fromURL = function (url, options, cb) {
  // Normalize overloads: (url, cb) or (url, options, cb)
  if (typeof options === 'function' && cb === undefined) {
    cb = options;
    options = undefined;
  }

  return promiseCallback((resolve, reject) => {
    const fetchOptions = (options && typeof options === 'object') ? {...options} : {};

    fetch(url, fetchOptions)
      .then(response => {
        if (!response.ok) {
          // Mimic previous error style
          throw new Error(`${response.status} ${response.statusText}`);
        }

        return response.text();
      })
      .then(data => {
        ical.parseICS(data, (error, ics) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(ics);
        });
      })
      .catch(error => {
        reject(error);
      });
  }, cb);
};

/**
 * Load iCal data from a file and parse it.
 *
 * @param {string} filename   - File path to load.
 * @param {icsCallback} [cb]  - Callback function.
 *                              If no callback is provided a promise will be returned.
 *
 * @returns {optionalPromise} Promise is returned if no callback is passed.
 */
async.parseFile = function (filename, cb) {
  return promiseCallback((resolve, reject) => {
    fs.readFile(filename, 'utf8', (error, data) => {
      if (error) {
        reject(error);
        return;
      }

      ical.parseICS(data, (error, ics) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(ics);
      });
    });
  }, cb);
};

/**
 * Parse iCal data from a string.
 *
 * @param {string} data       - String containing iCal data.
 * @param {icsCallback} [cb]  - Callback function.
 *                              If no callback is provided a promise will be returned.
 *
 * @returns {optionalPromise} Promise is returned if no callback is passed.
 */
async.parseICS = function (data, cb) {
  return promiseCallback((resolve, reject) => {
    ical.parseICS(data, (error, ics) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(ics);
    });
  }, cb);
};

/**
 * Load iCal data from a file and parse it.
 *
 * @param {string} filename   - File path to load.
 *
 * @returns {iCalData} Parsed iCal data.
 */
sync.parseFile = function (filename) {
  const data = fs.readFileSync(filename, 'utf8');
  return ical.parseICS(data);
};

/**
 * Parse iCal data from a string.
 *
 * @param {string} data - String containing iCal data.
 *
 * @returns {iCalData} Parsed iCal data.
 */
sync.parseICS = function (data) {
  return ical.parseICS(data);
};

/**
 * Load iCal data from a file and parse it.
 *
 * @param {string} filename   - File path to load.
 * @param {icsCallback} [cb]  - Callback function.
 *                              If no callback is provided this function runs synchronously.
 *
 * @returns {iCalData|undefined} Parsed iCal data or undefined if a callback is being used.
 */
autodetect.parseFile = function (filename, cb) {
  if (!cb) {
    return sync.parseFile(filename);
  }

  async.parseFile(filename, cb);
};

/**
 * Parse iCal data from a string.
 *
 * @param {string} data       - String containing iCal data.
 * @param {icsCallback} [cb]  - Callback function.
 *                              If no callback is provided this function runs synchronously.
 *
 * @returns {iCalData|undefined} Parsed iCal data or undefined if a callback is being used.
 */
autodetect.parseICS = function (data, cb) {
  if (!cb) {
    return sync.parseICS(data);
  }

  async.parseICS(data, cb);
};

/**
 * Expands recurring events (VEVENTs with RRULE, EXDATE, RECURRENCE-ID) into concrete instances within a date range.
 * Returns a sorted array of event instances with overrides applied and exception dates skipped.
 *
 * @param {Object} data - Parsed ICS data (output of parseFile/parseICS)
 * @param {Date} rangeStart - Inclusive start of the expansion window
 * @param {Date} rangeEnd - Inclusive end of the expansion window
 * @returns {Array} Array of expanded event instances
 */
function expandRecurringEvents(data, rangeStart, rangeEnd) {
  const events = Object.values(data).filter(item => item.type === 'VEVENT');
  const instances = [];

  for (const event of events) {
    if (!event.rrule) {
      instances.push(...expandSingleEvent(event, rangeStart, rangeEnd));
      continue;
    }

    instances.push(...expandRecurringComponent(event, rangeStart, rangeEnd));
  }

  return dedupeAndSort(instances);
}

/**
 * Expands a single (non-recurring) event when it falls within the requested range.
 *
 * @param {Object} event
 * @param {Date} rangeStart
 * @param {Date} rangeEnd
 * @returns {Array<Object>} Either one instance or an empty array when outside the range
 */
function expandSingleEvent(event, rangeStart, rangeEnd) {
  const start = new Date(event.start);
  if (start < rangeStart || start > rangeEnd) {
    return [];
  }

  const end = new Date(event.end);
  return [createInstance(event, start, end, end.getTime() - start.getTime())];
}

/**
 * Expands a recurring component by walking through every generated occurrence and applying overrides.
 *
 * @param {Object} event
 * @param {Date} rangeStart
 * @param {Date} rangeEnd
 * @returns {Array<Object>} Instances generated from the recurrence rule
 */
function expandRecurringComponent(event, rangeStart, rangeEnd) {
  const dates = event.rrule.between(rangeStart, rangeEnd, true, () => true);
  const results = [];

  for (const date of dates) {
    const occurrence = resolveOccurrence(event, date);
    if (!occurrence) {
      continue;
    }

    const {source, start, duration} = occurrence;
    const end = new Date(start.getTime() + duration);
    if (end < rangeStart || start > rangeEnd) {
      continue;
    }

    results.push(createInstance(source, start, end, duration));
  }

  return results;
}

/**
 * Resolves the concrete data for a single recurrence date, taking overrides and EXDATE entries into account.
 *
 * @param {Object} event
 * @param {Date} date
 * @returns {{source: Object, start: Date, duration: number}|undefined}
 */
function resolveOccurrence(event, date) {
  const override = findOverride(event, date);
  if (override === null) {
    return undefined;
  }

  if (override) {
    const start = new Date(override.start);
    return {
      source: override,
      start,
      duration: calculateDuration(override.start, override.end),
    };
  }

  const start = new Date(date);
  return {
    source: event,
    start,
    duration: calculateDuration(event.start, event.end),
  };
}

function findOverride(event, date) {
  const keys = buildDateKeys(date);

  if (event.exdate && keys.some(key => event.exdate[key])) {
    return null;
  }

  if (!event.recurrences) {
    return undefined;
  }

  for (const key of keys) {
    if (event.recurrences[key]) {
      return event.recurrences[key];
    }
  }

  return undefined;
}

function buildDateKeys(date) {
  const isoKey = date.toISOString();
  const compactIsoKey = isoKey.replaceAll(/[-:]/g, '');
  const dayKey = isoKey.slice(0, 10);
  const compactDayKey = dayKey.replaceAll('-', '');

  return [isoKey, dayKey, compactIsoKey, compactDayKey];
}

function calculateDuration(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return endDate.getTime() - startDate.getTime();
}

/**
 * Creates a normalized instance object consumers can work with.
 *
 * @param {Object} event - Source VEVENT (original or override)
 * @param {Date} start
 * @param {Date} end
 * @param {number} duration - Duration in milliseconds
 * @returns {{summary: string, start: Date, end: Date, duration: number, uid: string, original: Object}}
 */
function createInstance(event, start, end, duration) {
  return {
    summary: event.summary,
    start: new Date(start),
    end: new Date(end),
    duration,
    uid: event.uid,
    original: event,
  };
}

/**
 * Deduplicates instances by UID+start while preferring overrides, then sorts chronologically.
 *
 * @param {Array<Object>} instances
 * @returns {Array<Object>}
 */
function dedupeAndSort(instances) {
  const seen = new Map();

  for (const inst of instances) {
    const key = `${inst.uid}|${inst.start.toISOString()}`;
    if (!seen.has(key) || isOverrideInstance(inst)) {
      seen.set(key, inst);
    }
  }

  return Array.from(seen.values()).sort((a, b) => a.start - b.start);
}

function isOverrideInstance(inst) {
  if (!inst.original) {
    return false;
  }

  const {original} = inst;
  return Boolean(original.RECURRENCE_ID || original.recurrenceid || original.recurrenceId);
}

/**
 * Async version of expandRecurringEvents. Accepts a promise for parsed data.
 */
async function expandRecurringEventsAsync(dataPromise, rangeStart, rangeEnd) {
  const data = await dataPromise;
  return expandRecurringEvents(data, rangeStart, rangeEnd);
}

// Export api functions
module.exports = {
  // Autodetect
  fromURL: async.fromURL,
  parseFile: autodetect.parseFile,
  parseICS: autodetect.parseICS,
  // Sync
  sync,
  // Async
  async,
  // Other backwards compat things
  objectHandlers: ical.objectHandlers,
  handleObject: ical.handleObject,
  parseLines: ical.parseLines,
  // Event expansion
  expandRecurringEvents,
  expandRecurringEventsAsync,
};
