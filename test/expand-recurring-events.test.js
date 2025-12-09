const assert = require('node:assert/strict');
const {describe, it} = require('mocha');
const ical = require('../node-ical.js');

const RANGE_START = new Date('2017-05-01T00:00:00Z');
const RANGE_END = new Date('2017-12-31T23:59:59Z');
const FIXTURE = './examples/example-rrule.ics';

function extractSummaries(instances) {
  return instances.map(instance => `${instance.summary}|${instance.start.toISOString()}`);
}

describe('expandRecurringEvents helpers', () => {
  it('expands VEVENTs with overrides and single events (sync)', () => {
    const data = ical.parseFile(FIXTURE);
    const instances = ical.expandRecurringEvents(data, RANGE_START, RANGE_END);

    assert.equal(instances.length, 8, 'includes override and single non-recurring events');

    const summaries = extractSummaries(instances);
    const overrideMatches = summaries.filter(item => item.startsWith('Last meeting in June moved to Monday July 3'));
    assert.equal(overrideMatches.length, 1, 'override should appear exactly once');

    const single = instances.find(event => event.summary === 'Single event on Dec 1');
    assert.ok(single, 'includes standalone event without RRULE');

    const uniqueKeys = new Set(summaries);
    assert.equal(uniqueKeys.size, summaries.length, 'no duplicate UID/start combinations');
  });

  it('expands VEVENTs when starting from a promise (async)', async () => {
    const dataPromise = ical.async.parseFile(FIXTURE);
    const instances = await ical.expandRecurringEventsAsync(dataPromise, RANGE_START, RANGE_END);

    assert.equal(instances.length, 8, 'async helper matches sync instance count');

    const syncInstances = ical.expandRecurringEvents(ical.parseFile(FIXTURE), RANGE_START, RANGE_END);
    const syncSummaries = extractSummaries(syncInstances);
    assert.deepEqual(extractSummaries(instances), syncSummaries, 'async helper matches sync ordering and values');
  });
});
