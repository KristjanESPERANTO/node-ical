/*
 * Example: Expanding recurring calendar events (using Luxon)
 *
 * This script shows how to turn VEVENTs (including recurring ones) into concrete
 * event instances within a given date range using Luxon for date handling. It demonstrates how to:
 *
 * - Expand RRULEs into individual dates within a range
 * - Apply per-date overrides (RECURRENCE-ID via `recurrences`)
 * - Skip exception dates (`exdate`)
 * - Print each instance with title, start/end time, and humanized duration
 *
 * Why Luxon? It provides immutable DateTime objects, excellent timezone support,
 * and a clean API for date manipulation without the bulk of moment.js.
 *
 * Why a date range? Recurring rules can describe infinite series. Limiting to a
 * fixed window (here: calendar year 2017) keeps expansion finite and practical.
 */

const path = require('node:path');
const {DateTime} = require('luxon');
const ical = require('../node-ical.js');

function formatLuxon(date) {
  return DateTime.fromJSDate(date).toLocaleString(DateTime.DATETIME_FULL, {locale: 'en'});
}

function durationLuxon(ms) {
  const d = DateTime.fromMillis(ms).diff(DateTime.fromMillis(0));
  return d.toFormat('h:mm') + ' hours';
}

// Load an example iCal file with various recurring events.
const data = ical.parseFile(path.join(__dirname, 'example-rrule.ics'));

const rangeStart = new Date('2017-01-01');
const rangeEnd = new Date('2017-12-31');
const instances = ical.expandRecurringEvents(data, rangeStart, rangeEnd);

for (const inst of instances) {
  console.log(`title:${inst.summary}`);
  console.log(`startDate:${formatLuxon(inst.start)}`);
  console.log(`endDate:${formatLuxon(inst.end)}`);
  console.log(`duration:${durationLuxon(inst.duration)}`);
  console.log();
}
