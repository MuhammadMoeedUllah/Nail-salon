// Date and time helpers. Timestamps are ISO UTC strings; "local date" is YYYY-MM-DD in the salon's timezone.

export function nowIso(): string {
  return new Date().toISOString();
}

const dtfCache = new Map<string, Intl.DateTimeFormat>();
function dtf(tz: string): Intl.DateTimeFormat {
  let f = dtfCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    dtfCache.set(tz, f);
  }
  return f;
}

/** Local calendar date (YYYY-MM-DD) of an instant in a timezone. */
export function localDate(iso: string | Date, tz: string): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  const parts = Object.fromEntries(dtf(tz).formatToParts(d).map((p) => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

/** Local HH:MM of an instant in a timezone. */
export function localTime(iso: string | Date, tz: string): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  const parts = Object.fromEntries(dtf(tz).formatToParts(d).map((p) => [p.type, p.value]));
  return `${parts.hour}:${parts.minute}`;
}

/** Offset in minutes of a timezone at a given instant (local - UTC). */
function tzOffsetMinutes(date: Date, tz: string): number {
  const parts = Object.fromEntries(dtf(tz).formatToParts(date).map((p) => [p.type, p.value]));
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return (asUtc - date.getTime()) / 60000;
}

/** Convert a local date + time (YYYY-MM-DD, HH:MM) in a timezone to an ISO UTC instant. */
export function localToIso(date: string, time: string, tz: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  // first guess assuming UTC, then correct by the zone offset (two passes handle DST edges)
  let guess = new Date(Date.UTC(y, m - 1, d, hh, mm, 0));
  for (let i = 0; i < 2; i++) {
    const off = tzOffsetMinutes(guess, tz);
    guess = new Date(Date.UTC(y, m - 1, d, hh, mm, 0) - off * 60000);
  }
  return guess.toISOString();
}

export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
}

export function dayOfWeek(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Start date of the workweek containing `date`, given the salon's workweek start (0=Sun..6=Sat). */
export function weekStart(date: string, workweekStart: number): string {
  const dow = dayOfWeek(date);
  const diff = (dow - workweekStart + 7) % 7;
  return addDays(date, -diff);
}

export function weekEnd(start: string): string {
  return addDays(start, 6);
}

export function eachDay(start: string, end: string): string[] {
  const out: string[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
  return out;
}

export function minutesBetween(aIso: string, bIso: string): number {
  return Math.max(0, Math.round((new Date(bIso).getTime() - new Date(aIso).getTime()) / 60000));
}

export function fmtMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

export function fmtHours(min: number): string {
  return (min / 60).toFixed(2);
}

export function fmtCents(cents: number, locale: string = 'en-US'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export function fmtRate(centsPerHour: number): string {
  return `$${(centsPerHour / 100).toFixed(4)}/h`;
}

export function fmtDate(date: string, locale: 'en' | 'vi' = 'en'): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(dt);
}

export function fmtDateLong(date: string, locale: 'en' | 'vi' = 'en'): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(dt);
}

export function fmtDateTime(iso: string, tz: string, locale: 'en' | 'vi' = 'en'): string {
  return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
    timeZone: tz,
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(iso));
}

/** Wall-clock time of an instant in the salon's timezone, e.g. "9:06 AM" or "09:06". */
export function fmtClock(iso: string, tz: string, locale: 'en' | 'vi' = 'en'): string {
  return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
}

/** Weekday name for a local date, e.g. "Sunday" / "Chủ Nhật". */
export function fmtWeekday(date: string, locale: 'en' | 'vi' = 'en', style: 'long' | 'short' = 'long'): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', { timeZone: 'UTC', weekday: style }).format(new Date(Date.UTC(y, m - 1, d)));
}
