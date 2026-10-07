import { describe, it, expect } from 'vitest';
import { ruleSetFor, findRule, RULES } from './index';

describe('rules lookup', () => {
  it('uses NYC rate for NYC region and state rate elsewhere', () => {
    expect(ruleSetFor('NY', 'NYC', '2026-10-05').minWageCents).toBe(1700);
    expect(ruleSetFor('NY', 'REST', '2026-10-05').minWageCents).toBe(1600);
    expect(ruleSetFor('NY', 'NYC', '2025-06-01').minWageCents).toBe(1650);
  });
  it('falls back to the federal floor where the state rate is lower or missing', () => {
    expect(ruleSetFor('GA', null, '2026-10-05').minWageCents).toBe(725);
    expect(ruleSetFor('ZZ', null, '2026-10-05').minWageCents).toBe(725);
  });
  it('applies daily overtime only in California', () => {
    expect(ruleSetFor('CA', null, '2026-10-05').otDailyThresholdMinutes).toBe(480);
    expect(ruleSetFor('NY', 'NYC', '2026-10-05').otDailyThresholdMinutes).toBeNull();
  });
  it('spread of hours only in NY', () => {
    expect(ruleSetFor('NY', 'NYC', '2026-10-05').spreadOfHours).toBe(true);
    expect(ruleSetFor('CT', null, '2026-10-05').spreadOfHours).toBe(false);
  });
  it('Florida steps up on Sep 30 2026', () => {
    expect(ruleSetFor('FL', null, '2026-09-29').minWageCents).toBe(1400);
    expect(ruleSetFor('FL', null, '2026-09-30').minWageCents).toBe(1500);
  });
  it('every entry carries a source and a checked-on date', () => {
    for (const e of RULES) {
      expect(e.source_url).toMatch(/^https?:\/\//);
      expect(e.checked_on).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    expect(findRule('US', null, 'min_wage', '2026-01-01')?.value).toBe(725);
  });
});
