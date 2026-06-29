import { habitLogs } from '@/db/schema';

/** Returns YYYY-MM-DD for a Date, in local time (not UTC), so "today"
 *  matches what the user sees on their clock rather than shifting at UTC midnight. */
export function toDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

/** Given a sorted-desc list of date strings (YYYY-MM-DD) a habit was completed on,
 *  compute the current consecutive-day streak ending today or yesterday.
 *  A streak is "alive" if today or yesterday has a log; otherwise it's broken (0). */
export function computeStreak(dateKeys: string[]): number {
  if (dateKeys.length === 0) return 0;

  const set = new Set(dateKeys);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Determine the anchor: today if logged, else yesterday if logged, else streak is 0.
  let cursor = new Date(today);
  if (!set.has(toDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!set.has(toDateKey(cursor))) {
      return 0;
    }
  }

  let streak = 0;
  while (set.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Last N day-keys, oldest first, for rendering a week strip. */
export function lastNDays(n: number): string[] {
  const out: string[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(cursor);
    d.setDate(d.getDate() - i);
    out.push(toDateKey(d));
  }
  return out;
}

export type HabitLogRow = typeof habitLogs.$inferSelect;

// ---------------------------------------------------------------------------
// Week View helpers
// Weeks start on Monday. "weekStart" is always the Monday's date key for
// whatever week is being viewed, and is the identifier used to scope all
// week-view data (tasks, gym sessions, focus areas, reflections).
// ---------------------------------------------------------------------------

/** Returns the Monday of the week containing the given date, as YYYY-MM-DD. */
export function weekStartFor(d: Date): string {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay(); // 0 = Sunday, 1 = Monday, ...
  const diff = day === 0 ? -6 : 1 - day; // shift back to Monday
  date.setDate(date.getDate() + diff);
  return toDateKey(date);
}

export function currentWeekStart(): string {
  return weekStartFor(new Date());
}

/** Returns the 7 day-keys (Mon..Sun) for a given week, given its Monday key. */
export function daysInWeek(weekStart: string): string[] {
  const [y, m, d] = weekStart.split('-').map(Number);
  const monday = new Date(y, m - 1, d);
  const out: string[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(day.getDate() + i);
    out.push(toDateKey(day));
  }
  return out;
}

/** Shifts a weekStart key forward/backward by N weeks. */
export function shiftWeek(weekStart: string, deltaWeeks: number): string {
  const [y, m, d] = weekStart.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + deltaWeeks * 7);
  return toDateKey(date);
}

/** Human label like "Jun 23 – Jun 29, 2026" for a week given its Monday key. */
export function weekLabel(weekStart: string): string {
  const days = daysInWeek(weekStart);
  const start = new Date(days[0]);
  const end = new Date(days[6]);
  const fmt = (d: Date, withYear: boolean) =>
    d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: withYear ? 'numeric' : undefined,
    });
  return `${fmt(start, false)} – ${fmt(end, true)}`;
}

// ---------------------------------------------------------------------------
// Calendar (month grid) helpers
// ---------------------------------------------------------------------------

/** Returns a 6x7 grid (42 day-keys) covering the given month, starting on
 *  the Monday on/before the 1st and ending on the Sunday on/after the
 *  last day — enough to always fully tile a month with leading/trailing
 *  days from adjacent months included (shown dimmed in the UI). */
export function monthGrid(year: number, month: number): string[] {
  const firstOfMonth = new Date(year, month, 1);
  const startDay = firstOfMonth.getDay(); // 0=Sun..6=Sat
  const leadingDays = startDay === 0 ? 6 : startDay - 1; // back to Monday

  const gridStart = new Date(year, month, 1 - leadingDays);
  const days: string[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(d.getDate() + i);
    days.push(toDateKey(d));
  }
  return days;
}

export function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}
