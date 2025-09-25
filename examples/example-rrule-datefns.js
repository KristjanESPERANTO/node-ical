/*
 * Example: Expanding recurring calendar events (using date-fns)
 *
 * This script shows how to turn VEVENTs (including recurring ones) into concrete
 * event instances within a given date range using date-fns for date handling. It demonstrates how to:
 *
 * - Expand RRULEs into individual dates within a range
 * - Apply per-date overrides (RECURRENCE-ID via `recurrences`)
 * - Skip exception dates (`exdate`)
 * - Print each instance with title, start/end time, and humanized duration
 *
 * Why date-fns? It is a modern, modular date library for JavaScript with a functional API and tree-shakable design.
 *
 * Why a date range? Recurring rules can describe infinite series. Limiting to a
 * fixed window (here: calendar year 2017) keeps expansion finite and practical.
 */

const path = require('node:path');
const {format} = require('date-fns');
const ical = require('../node-ical.js');

function durationDateFns(ms) {
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  return `${hours}:${String(minutes).padStart(2, '0')} hours`;
}

// Load an example iCal file with various recurring events.
const data = ical.parseFile(path.join(__dirname, 'example-rrule.ics'));

const rangeStart = new Date('2017-01-01T00:00:00.000Z');
const rangeEnd = new Date('2017-12-31T23:59:59.999Z');
const instances = ical.expandRecurringEvents(data, rangeStart, rangeEnd);

for (const inst of instances) {
  console.log(`title:${inst.summary}`);
  console.log(`startDate:${format(inst.start, 'eeee, MMMM d, yyyy HH:mm')}`);
  console.log(`endDate:${format(inst.end, 'eeee, MMMM d, yyyy HH:mm')}`);
  console.log(`duration:${durationDateFns(inst.duration)}`);
  console.log();
}
