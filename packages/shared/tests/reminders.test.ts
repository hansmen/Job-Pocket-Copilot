import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeFollowUpAt, daysSince, selectNotificationsToSchedule } from '../src/reminders.ts';

const KYIV_WINTER = 120; // UTC+2

test('follow-up after 7 days at 10:00 local time', () => {
  // Mon 2026-11-16 12:00 UTC, 14:00 in Kyiv
  const from = Date.UTC(2026, 10, 16, 12, 0, 0);
  const at = computeFollowUpAt(from, { utcOffsetMinutes: KYIV_WINTER });
  // Mon 2026-11-23 10:00 Kyiv time = 08:00 UTC
  assert.equal(at, Date.UTC(2026, 10, 23, 8, 0, 0));
});

test('the local day is determined by the offset, not by UTC', () => {
  // 2026-11-16 23:30 UTC = 2026-11-17 01:30 in Kyiv; +1 day → 2026-11-18 10:00 Kyiv
  const from = Date.UTC(2026, 10, 16, 23, 30, 0);
  const at = computeFollowUpAt(from, { afterDays: 1, utcOffsetMinutes: KYIV_WINTER });
  assert.equal(at, Date.UTC(2026, 10, 18, 8, 0, 0));
});

test('skipWeekends moves Saturday and Sunday to Monday', () => {
  // Thu 2026-11-19 + 2 days = Sat 2026-11-21 → Mon 2026-11-23
  const thu = Date.UTC(2026, 10, 19, 9, 0, 0);
  const sat = computeFollowUpAt(thu, { afterDays: 2, utcOffsetMinutes: 0, skipWeekends: true });
  assert.equal(new Date(sat).getUTCDay(), 1);
  assert.equal(sat, Date.UTC(2026, 10, 23, 10, 0, 0));

  // Fri 2026-11-20 + 2 days = Sun 2026-11-22 → Mon 2026-11-23
  const fri = Date.UTC(2026, 10, 20, 9, 0, 0);
  const sun = computeFollowUpAt(fri, { afterDays: 2, utcOffsetMinutes: 0, skipWeekends: true });
  assert.equal(sun, Date.UTC(2026, 10, 23, 10, 0, 0));
});

test('without skipWeekends Saturday stays Saturday', () => {
  const thu = Date.UTC(2026, 10, 19, 9, 0, 0);
  const sat = computeFollowUpAt(thu, { afterDays: 2, utcOffsetMinutes: 0 });
  assert.equal(new Date(sat).getUTCDay(), 6);
});

test('selectNotificationsToSchedule picks the nearest upcoming ones and respects the limit', () => {
  const now = 1_000;
  const reminders = [
    { id: 'old', fireAt: 500 },
    { id: 'c', fireAt: 4_000 },
    { id: 'a', fireAt: 2_000 },
    { id: 'done', fireAt: 1_500, doneAt: 1_400 },
    { id: 'b', fireAt: 3_000 },
  ];
  const picked = selectNotificationsToSchedule(reminders, now, 2);
  assert.deepEqual(
    picked.map((r) => r.id),
    ['a', 'b'],
  );
});

test('selectNotificationsToSchedule does not mutate the input array', () => {
  const input = [
    { id: 'b', fireAt: 3 },
    { id: 'a', fireAt: 2 },
  ];
  selectNotificationsToSchedule(input, 0);
  assert.deepEqual(
    input.map((r) => r.id),
    ['b', 'a'],
  );
});

test('daysSince counts full days and is never negative', () => {
  const day = 24 * 60 * 60_000;
  assert.equal(daysSince(0, 5 * day + 1), 5);
  assert.equal(daysSince(10 * day, 5 * day), 0);
});
