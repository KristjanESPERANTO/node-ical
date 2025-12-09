/*
 * Example: Expanding recurring calendar events (using moment-timezone)
 *
 * This script shows how to turn VEVENTs (including recurring ones) into concrete
 * event instances within a given date range. It demonstrates how to:
 *
 * - Expand RRULEs into individual dates within a range
 * - Apply per-date overrides (RECURRENCE-ID via `recurrences`)
 * - Skip exception dates (`exdate`)
 * - Print each instance with title, start/end time, and humanized duration
 *
 * Why a date range? Recurring rules can describe infinite series. Limiting to a
 * fixed window (here: calendar year 2017) keeps expansion finite and practical.
 */

const path = require('node:path');
const moment = require('moment-timezone');
const ical = require('../node-ical.js');

function formatLocalLong(date) {
  return moment(date).format('MMMM Do YYYY, h:mm:ss a');
}

function humanizeDuration(ms) {
  return moment.duration(ms).humanize();
}

// Load an example iCal file with various recurring events.
const data = ical.parseFile(path.join(__dirname, 'example-rrule.ics'));

const rangeStart = new Date('2017-01-01');
const rangeEnd = new Date('2017-12-31');
const instances = ical.expandRecurringEvents(data, rangeStart, rangeEnd);

for (const inst of instances) {
  console.log(`title:${inst.summary}`);
  console.log(`startDate:${formatLocalLong(inst.start)}`);
  console.log(`endDate:${formatLocalLong(inst.end)}`);
  console.log(`duration:${humanizeDuration(inst.duration)}`);
  console.log();
}
