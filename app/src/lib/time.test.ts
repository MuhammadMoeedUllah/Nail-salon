import { describe, it, expect } from 'vitest';
import { localDate, localToIso, weekStart, addDays, localTime } from './time';

describe('time helpers', () => {
  it('converts local New York time to UTC across DST', () => {
    expect(localToIso('2026-07-01', '09:30', 'America/New_York')).toBe('2026-07-01T13:30:00.000Z');
    expect(localToIso('2026-01-15', '09:30', 'America/New_York')).toBe('2026-01-15T14:30:00.000Z');
  });
  it('round-trips local date and time', () => {
    const iso = localToIso('2026-10-05', '21:15', 'America/Los_Angeles');
    expect(localDate(iso, 'America/Los_Angeles')).toBe('2026-10-05');
    expect(localTime(iso, 'America/Los_Angeles')).toBe('21:15');
  });
  it('late-night punches belong to the local day, not the UTC day', () => {
    const iso = localToIso('2026-10-05', '22:30', 'America/New_York'); // 02:30Z next day
    expect(localDate(iso, 'America/New_York')).toBe('2026-10-05');
  });
  it('computes workweek start', () => {
    expect(weekStart('2026-10-07', 1)).toBe('2026-10-05'); // Wed → Mon
    expect(weekStart('2026-10-07', 0)).toBe('2026-10-04'); // Wed → Sun
    expect(weekStart('2026-10-07', 3)).toBe('2026-10-07'); // Wed → Wed
    expect(weekStart('2026-10-06', 3)).toBe('2026-09-30');
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
  });
});
