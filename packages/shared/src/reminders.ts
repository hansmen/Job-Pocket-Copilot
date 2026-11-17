/**
 * Reminder logic, platform-independent.
 *
 * All times are epoch ms in UTC. The time zone is passed as an offset in minutes from UTC
 * (e.g. +120 for Kyiv in winter). The offset is taken at call time, so around a
 * DST change the reminder may shift by an hour: this is acceptable.
 */

export interface FollowUpOptions {
  /** How many days until the reminder. Defaults to 7. */
  afterDays?: number;
  /** Hour of day in local time. Defaults to 10. */
  hourLocal?: number;
  /** Local time offset from UTC in minutes. */
  utcOffsetMinutes: number;
  /** If the date falls on a weekend, move it to Monday. */
  skipWeekends?: boolean;
}

const MINUTE = 60_000;

export function computeFollowUpAt(fromMs: number, opts: FollowUpOptions): number {
  const afterDays = opts.afterDays ?? 7;
  const hour = opts.hourLocal ?? 10;
  const offset = opts.utcOffsetMinutes * MINUTE;

  // "Local" wall-clock date, represented as a UTC instant.
  const local = new Date(fromMs + offset);
  let target = Date.UTC(
    local.getUTCFullYear(),
    local.getUTCMonth(),
    local.getUTCDate() + afterDays,
    hour,
    0,
    0,
    0,
  );

  if (opts.skipWeekends) {
    const dow = new Date(target).getUTCDay(); // 0 = Sunday, 6 = Saturday
    if (dow === 6) target += 2 * 24 * 60 * MINUTE;
    if (dow === 0) target += 24 * 60 * MINUTE;
  }

  return target - offset;
}

/**
 * iOS allows only a limited number of scheduled local notifications (about 64).
 * Schedule the nearest ones and reschedule the rest when the app is opened.
 */
export const DEFAULT_NOTIFICATION_LIMIT = 60;

export function selectNotificationsToSchedule<T extends { fireAt: number; doneAt?: number | null }>(
  reminders: readonly T[],
  nowMs: number,
  limit: number = DEFAULT_NOTIFICATION_LIMIT,
): T[] {
  return reminders
    .filter((r) => r.fireAt > nowMs && !r.doneAt)
    .sort((a, b) => a.fireAt - b.fireAt)
    .slice(0, limit);
}

/** How many full days have passed since `fromMs` (for "applied 5 days ago"). */
export function daysSince(fromMs: number, nowMs: number): number {
  return Math.max(0, Math.floor((nowMs - fromMs) / (24 * 60 * MINUTE)));
}
