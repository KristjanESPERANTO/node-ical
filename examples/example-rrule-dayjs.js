/*
 * Example: Expanding recurring calendar events (using Day.js)
 *
 * This script shows how to turn VEVENTs (including recurring ones) into concrete
 * event instances within a given date range using Day.js for date handling. It demonstrates how to:
 *
 * - Expand RRULEs into individual dates within a range
 * - Apply per-date overrides (RECURRENCE-ID via `recurrences`)
 * - Skip exception dates (`exdate`)
 * - Print each instance with title, start/end time, and humanized duration
 *
 * Why Day.js? It's a minimalist JavaScript date library with a familiar API similar
 * to moment.js but with a much smaller footprint (~2kB vs ~67kB for moment).
 * Perfect for environments where bundle size matters.
 *
 * Why a date range? Recurring rules can describe infinite series. Limiting to a
 * fixed window (here: calendar year 2017) keeps expansion finite and practical.
 */

const path = require('node:path');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const duration = require('dayjs/plugin/duration');
const relativeTime = require('dayjs/plugin/relativeTime');
const localizedFormat = require('dayjs/plugin/localizedFormat');
const ical = require('../node-ical.js');

// Extend Day.js with plugins for timezone and duration support
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

function formatDayjs(date) {
  return dayjs(date).format('LLLL');
}

function durationDayjs(ms) {
  const d = dayjs.duration(ms);
  return `${Math.floor(d.asHours())}:${String(d.minutes()).padStart(2, '0')} hours`;
}

// Load an example iCal file with various recurring events.
const data = ical.parseFile(path.join(__dirname, 'example-rrule.ics'));

const rangeStart = new Date('2017-01-01');
const rangeEnd = new Date('2017-12-31');
const instances = ical.expandRecurringEvents(data, rangeStart, rangeEnd);

for (const inst of instances) {
  console.log(`title:${inst.summary}`);
  console.log(`startDate:${formatDayjs(inst.start)}`);
  console.log(`endDate:${formatDayjs(inst.end)}`);
  console.log(`duration:${durationDayjs(inst.duration)}`);
  console.log();
}
