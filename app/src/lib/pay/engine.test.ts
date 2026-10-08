import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { computeWeek, complianceOwedCents, type RuleSet, type WorkerWeekInput } from './engine';

const FED: RuleSet = { jurisdiction: 'US', minWageCents: 725, otWeeklyThresholdMinutes: 2400 };
const NYC: RuleSet = { jurisdiction: 'NY-NYC', minWageCents: 1700, otWeeklyThresholdMinutes: 2400, spreadOfHours: true };

const days = (hoursPerDay: number[]) =>
  hoursPerDay.map((h, i) => ({ date: `2026-10-${String(5 + i).padStart(2, '0')}`, minutes: Math.round(h * 60) }));

const base = (over: Partial<WorkerWeekInput>): WorkerWeekInput => ({
  workerId: 'w1',
  payBasis: 'hourly',
  hourlyRateCents: 0,
  dayRateCents: 0,
  commissionPct: 0,
  guaranteeCents: 0,
  days: [],
  salesCents: 0,
  tipsCardCents: 0,
  tipsCashCents: 0,
  ...over
});

describe('computeWeek: federal worked examples', () => {
  it('DOL Fact Sheet 23 style: $12/h for 46h plus $46 bonus/commission', () => {
    // regular rate = (12*46 + 46)/46 = 13.00; OT premium = 6 * 0.5 * 13 = 39; total 637
    const r = computeWeek(
      base({ payBasis: 'hourly', hourlyRateCents: 1200, days: days([9.2, 9.2, 9.2, 9.2, 9.2]), salesCents: 4600, commissionPct: 100 }),
      FED
    );
    expect(r.minutesWorked).toBe(2760);
    expect(r.baseCents).toBe(55200);
    expect(r.commissionCents).toBe(4600);
    expect(r.regularRateCents).toBe(1300);
    expect(r.overtimeMinutes).toBe(360);
    expect(r.overtimePremiumCents).toBe(3900);
    expect(r.grossWagesCents).toBe(63700);
    expect(r.flags).toContain('OT_OWED');
  });

  it('day rate $120 x 6 days + 50% commission on $1,800 sales, 54 hours', () => {
    // base 720 + commission 900 = 1620 straight; rate = 1620/54 = 30.00; OT 14h * 0.5 * 30 = 210
    const r = computeWeek(
      base({ payBasis: 'day_rate_plus_commission', dayRateCents: 12000, commissionPct: 50, salesCents: 180000, days: days([9, 9, 9, 9, 9, 9]) }),
      NYC
    );
    expect(r.daysWorked).toBe(6);
    expect(r.baseCents).toBe(72000);
    expect(r.commissionCents).toBe(90000);
    expect(r.regularRateCents).toBe(3000);
    expect(r.overtimeMinutes).toBe(14 * 60);
    expect(r.overtimePremiumCents).toBe(21000);
    expect(r.minWageTopupCents).toBe(0);
    expect(r.grossWagesCents).toBe(183000);
    expect(complianceOwedCents(r)).toBe(21000);
  });

  it('commission only 60% on $1,000 sales, 48 hours: minimum wage top-up in NYC', () => {
    // commission 600 over 48h = 12.50/h < 17.00 → top-up (17*48 - 600) = 216; then OT 8h * 0.5 * 17 = 68
    const r = computeWeek(
      base({ payBasis: 'commission', commissionPct: 60, salesCents: 100000, days: days([8, 8, 8, 8, 8, 8]) }),
      NYC
    );
    expect(r.commissionCents).toBe(60000);
    expect(r.minWageTopupCents).toBe(21600);
    expect(r.regularRateCents).toBe(1700);
    expect(r.overtimePremiumCents).toBe(6800);
    expect(r.grossWagesCents).toBe(60000 + 21600 + 6800);
    expect(r.flags).toEqual(expect.arrayContaining(['MIN_WAGE_TOPUP', 'OT_OWED']));
  });

  it('pure commission, no overtime, above minimum wage: nothing extra is owed', () => {
    const r = computeWeek(
      base({ payBasis: 'commission', commissionPct: 60, salesCents: 200000, days: days([8, 8, 8, 8, 6]) }),
      NYC
    );
    expect(r.overtimeMinutes).toBe(0);
    expect(r.minWageTopupCents).toBe(0);
    expect(complianceOwedCents(r)).toBe(0);
    expect(r.grossWagesCents).toBe(120000);
  });

  it('guarantee or commission, whichever is higher', () => {
    const low = computeWeek(
      base({ payBasis: 'guarantee_or_commission', guaranteeCents: 90000, commissionPct: 60, salesCents: 100000, days: days([8, 8, 8, 8, 8]) }),
      NYC
    );
    expect(low.commissionCents).toBe(60000);
    expect(low.baseCents).toBe(30000);
    expect(low.straightTimeCents).toBe(90000);
    expect(low.flags).toContain('GUARANTEE_APPLIED');

    const high = computeWeek(
      base({ payBasis: 'guarantee_or_commission', guaranteeCents: 90000, commissionPct: 60, salesCents: 200000, days: days([8, 8, 8, 8, 8]) }),
      NYC
    );
    expect(high.baseCents).toBe(0);
    expect(high.straightTimeCents).toBe(120000);
  });

  it('card tips already paid out in cash are not owed again but stay reported', () => {
    const r = computeWeek(
      base({ payBasis: 'hourly', hourlyRateCents: 2000, days: days([8, 8, 8, 8, 8]), tipsCardCents: 30000, tipsCardPaidOutCents: 12000, tipsCashCents: 5000 }),
      NYC
    );
    expect(r.tipsCardCents).toBe(30000);
    expect(r.tipsCardPaidOutCents).toBe(12000);
    expect(r.tipsCardOwedCents).toBe(18000);
    expect(r.totalCents).toBe(r.grossWagesCents + 18000);
  });

  it('guarantee does not apply to a week with no hours and no tickets', () => {
    const r = computeWeek(base({ payBasis: 'guarantee_or_commission', guaranteeCents: 90000, commissionPct: 60, days: [] }), NYC);
    expect(r.baseCents).toBe(0);
    expect(r.grossWagesCents).toBe(0);
    expect(r.flags).not.toContain('GUARANTEE_APPLIED');
  });

  it('tips are reported but never counted as wages', () => {
    const r = computeWeek(
      base({ payBasis: 'commission', commissionPct: 50, salesCents: 100000, days: days([8, 8, 8, 8, 8]), tipsCardCents: 20000, tipsCashCents: 15000 }),
      NYC
    );
    // 500 over 40h = 12.50 < 17 → topup 180 even though tips would push take-home higher
    expect(r.minWageTopupCents).toBe(18000);
    expect(r.grossWagesCents).toBe(68000);
    expect(r.totalCents).toBe(68000 + 20000);
  });

  it('flags tickets without hours and open punches', () => {
    const r = computeWeek(base({ payBasis: 'commission', commissionPct: 60, salesCents: 50000, days: [], ticketCount: 5 }), NYC);
    expect(r.flags).toEqual(expect.arrayContaining(['NO_HOURS', 'TICKETS_WITHOUT_HOURS']));
    const o = computeWeek(base({ payBasis: 'hourly', hourlyRateCents: 2000, days: [{ date: '2026-10-05', minutes: 300, open: true }] }), NYC);
    expect(o.flags).toContain('OPEN_PUNCH');
  });

  it('NY spread of hours: a minimum-wage day spanning more than 10 hours adds one hour at minimum wage', () => {
    const r = computeWeek(
      base({ payBasis: 'hourly', hourlyRateCents: 1700, days: [{ date: '2026-10-05', minutes: 540, spreadMinutes: 660 }] }),
      NYC
    );
    expect(r.spreadOfHoursCents).toBe(1700);
    expect(r.flags).toContain('SPREAD_OF_HOURS');
    expect(r.grossWagesCents).toBe(1700 * 9 + 1700);
  });

  it('NY spread of hours: a worker paid well above minimum wage is owed nothing extra', () => {
    const r = computeWeek(
      base({ payBasis: 'hourly', hourlyRateCents: 3000, days: [{ date: '2026-10-05', minutes: 540, spreadMinutes: 660 }] }),
      NYC
    );
    expect(r.spreadOfHoursCents).toBe(0);
    expect(r.flags).not.toContain('SPREAD_OF_HOURS');
  });

  it('NY spread of hours: a worker slightly above minimum gets only the shortfall', () => {
    // 9h at $18 = $162; floor with spread = 17 × 10 = $170 → $8 owed
    const r = computeWeek(
      base({ payBasis: 'hourly', hourlyRateCents: 1800, days: [{ date: '2026-10-05', minutes: 540, spreadMinutes: 660 }] }),
      NYC
    );
    expect(r.spreadOfHoursCents).toBe(800);
  });

  it('surfaces a possible 7(i) exemption without applying it', () => {
    const r = computeWeek(
      base({ payBasis: 'commission', commissionPct: 60, salesCents: 400000, days: days([9, 9, 9, 9, 9, 5]) }),
      NYC
    );
    expect(r.flags).toContain('SECTION_7I_POSSIBLE');
    expect(r.overtimePremiumCents).toBeGreaterThan(0); // still computed
  });

  it('daily overtime (CA style) uses the larger of daily and weekly overtime', () => {
    const CA: RuleSet = { jurisdiction: 'CA', minWageCents: 1650, otWeeklyThresholdMinutes: 2400, otDailyThresholdMinutes: 480 };
    const r = computeWeek(base({ payBasis: 'hourly', hourlyRateCents: 2000, days: days([10, 10, 4, 4, 4]) }), CA);
    expect(r.minutesWorked).toBe(32 * 60);
    expect(r.overtimeMinutes).toBe(4 * 60);
    expect(r.flags).toContain('DAILY_OT');
  });
});

describe('computeWeek: invariants', () => {
  const arbInput = fc.record({
    payBasis: fc.constantFrom('hourly', 'day_rate', 'commission', 'day_rate_plus_commission', 'guarantee_or_commission') as fc.Arbitrary<WorkerWeekInput['payBasis']>,
    hourlyRateCents: fc.integer({ min: 0, max: 5000 }),
    dayRateCents: fc.integer({ min: 0, max: 30000 }),
    commissionPct: fc.integer({ min: 0, max: 100 }),
    guaranteeCents: fc.integer({ min: 0, max: 200000 }),
    salesCents: fc.integer({ min: 0, max: 1000000 }),
    tipsCardCents: fc.integer({ min: 0, max: 100000 }),
    tipsCashCents: fc.integer({ min: 0, max: 100000 }),
    minutes: fc.array(fc.integer({ min: 0, max: 16 * 60 }), { minLength: 0, maxLength: 7 })
  });

  it('never pays below minimum wage for hours worked and never negative overtime', () => {
    fc.assert(
      fc.property(arbInput, (a) => {
        const r = computeWeek(base({ ...a, days: a.minutes.map((m, i) => ({ date: `d${i}`, minutes: m })) }), NYC);
        const hours = r.minutesWorked / 60;
        expect(r.overtimePremiumCents).toBeGreaterThanOrEqual(0);
        expect(r.minWageTopupCents).toBeGreaterThanOrEqual(0);
        if (hours > 0) {
          // straight time per hour is at least the minimum wage (within a cent of rounding)
          expect(r.straightTimeCents / hours).toBeGreaterThanOrEqual(NYC.minWageCents - 1);
        }
        expect(r.totalCents).toBe(r.grossWagesCents + r.tipsCardOwedCents);
      })
    );
  });

  it('overtime premium equals half the regular rate times overtime hours', () => {
    fc.assert(
      fc.property(arbInput, (a) => {
        const r = computeWeek(base({ ...a, days: a.minutes.map((m, i) => ({ date: `d${i}`, minutes: m })) }), FED);
        const expected = Math.round(r.regularRate * 0.5 * (r.overtimeMinutes / 60) + Number.EPSILON);
        expect(Math.abs(r.overtimePremiumCents - expected)).toBeLessThanOrEqual(1);
      })
    );
  });
});
