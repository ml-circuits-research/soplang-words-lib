// A repeating event's days (RFC 5545 RRULE; knowledge Q92): daily / weekly / monthly / yearly, every N, on weekdays,
// on a day of the month, until a date or a count, in a window.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { expandRecurrence as days } from '../tools/lib-under-test.mjs';

test('expandRecurrence: the common rules, the edge days, a window', () => {
  assert.deepEqual(days('FREQ=DAILY;COUNT=3', '2026-11-15'), ['2026-11-15', '2026-11-16', '2026-11-17']);
  assert.deepEqual(days('FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE;COUNT=5', '2026-11-16'), ['2026-11-16', '2026-11-18', '2026-11-30', '2026-12-02', '2026-12-14']);
  assert.deepEqual(days({ freq: 'weekly', byday: ['MO', 'TU', 'WE', 'TH', 'FR'], until: '2026-11-24' }, '2026-11-15'), ['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-23', '2026-11-24'], 'weekdays until a date; the start (a Sunday) is not one of them');
  assert.deepEqual(days('FREQ=MONTHLY;BYMONTHDAY=31;COUNT=4', '2026-01-31'), ['2026-01-31', '2026-03-31', '2026-05-31', '2026-07-31'], 'the 31st only in months that have it');
  assert.deepEqual(days('FREQ=YEARLY;COUNT=3', '2024-02-29'), ['2024-02-29', '2028-02-29', '2032-02-29'], '29 February only in leap years');
  assert.deepEqual(days('FREQ=MONTHLY;BYDAY=FR;COUNT=5', '2026-11-01'), ['2026-11-06', '2026-11-13', '2026-11-20', '2026-11-27', '2026-12-04']);
  assert.deepEqual(days('FREQ=DAILY', '2026-01-01', { from: '2026-03-01', to: '2026-03-03' }), ['2026-03-01', '2026-03-02', '2026-03-03'], 'an open rule in a window');
  assert.equal(days('FREQ=DAILY', '2026-01-01', { max: 10 }).length, 10);
  assert.deepEqual(days('FREQ=HOURLY;COUNT=2', '2026-01-01'), [], 'a frequency it does not expand');
});
