import { describe, it, expect } from 'vitest';
import { computeWeek } from './engine';
import { explainLine } from './explain';
import { ruleSetFor } from '$lib/rules';

describe('explainLine', () => {
  it('turns every breakdown line into a sentence without variable names, in both languages', () => {
    const r = computeWeek(
      { workerId: 'w', payBasis: 'guarantee_or_commission', hourlyRateCents: 0, dayRateCents: 0, commissionPct: 60, guaranteeCents: 90000, salesCents: 150000, tipsCardCents: 6000, tipsCashCents: 2000, days: [10, 10, 10, 10, 10, 7].map((h, i) => ({ date: `2026-09-${21 + i}`, minutes: h * 60, spanMinutes: h * 60 + 30, open: false })), ticketCount: 30 } as never,
      ruleSetFor('NY', 'NYC', '2026-09-21')
    );
    for (const locale of ['en', 'vi'] as const)
      for (const b of r.breakdown) {
        const s = explainLine(b, locale);
        expect(s).not.toMatch(/Cents|Minutes|Pct|undefined|NaN|\{/);
        expect(s.length).toBeGreaterThan(10);
      }
  });
});
