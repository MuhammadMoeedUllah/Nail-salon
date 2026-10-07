/**
 * Weekly pay engine.
 *
 * Pure, deterministic, no I/O. Money is in integer cents, time in integer minutes.
 * The arithmetic follows the federal rules in 29 CFR part 778:
 *  - 778.109  regular rate = total straight-time pay for the week / total hours worked
 *  - 778.112  day rate: the day rate covers all hours worked that day; overtime is paid
 *             as an extra half of the regular rate for hours over 40
 *  - 778.117  commissions are included in the regular rate, whether paid weekly or not
 *  - 778.118  employee paid wholly on commission: regular rate = commission / hours
 *  - 778.107 / 29 CFR 531  the regular rate can never be below the applicable minimum wage;
 *             a top-up is owed first, then overtime is computed on the raised rate
 *  - 29 CFR 531.52  tips are the property of the employee and are never counted as wages
 *             here (no tip credit is applied unless the rule set turns it on)
 *
 * Every number the statement shows comes from the `breakdown` returned here so that the
 * record can be re-derived from its inputs years later.
 */

export type PayBasis =
  | 'hourly'
  | 'day_rate'
  | 'commission'
  | 'day_rate_plus_commission'
  | 'guarantee_or_commission';

export interface DayInput {
  /** local calendar date YYYY-MM-DD */
  date: string;
  /** minutes worked that day, breaks already removed */
  minutes: number;
  /** minutes between first clock-in and last clock-out that day (spread of hours) */
  spreadMinutes?: number;
  /** true when the day has a clock-in but no clock-out */
  open?: boolean;
}

export interface WorkerWeekInput {
  workerId: string;
  payBasis: PayBasis;
  hourlyRateCents: number;
  dayRateCents: number;
  /** whole percent, 0-100 */
  commissionPct: number;
  /** weekly guarantee for guarantee_or_commission */
  guaranteeCents: number;
  days: DayInput[];
  /** service sales on this worker's tickets (price only, tips excluded) */
  salesCents: number;
  tipsCardCents: number;
  tipsCashCents: number;
  /** itemised deductions already agreed in writing; engine subtracts but never creates them */
  deductionsCents?: number;
  /** tickets exist but no punches exist: used for a warning flag */
  ticketCount?: number;
}

export interface RuleSet {
  jurisdiction: string; // e.g. "NY-NYC"
  /** cents per hour */
  minWageCents: number;
  /** weekly overtime threshold in minutes (federal 2400 = 40h) */
  otWeeklyThresholdMinutes: number;
  /** optional daily overtime threshold in minutes (CA 480). null = none */
  otDailyThresholdMinutes?: number | null;
  /** optional daily double-time threshold (CA 720). null = none */
  dtDailyThresholdMinutes?: number | null;
  /** NY miscellaneous industries: one extra hour at minimum wage when spread > 10h */
  spreadOfHours?: boolean;
  /** multiplier for overtime premium, 0.5 = extra half-time on top of straight time already paid */
  otPremiumMultiplier?: number;
  /** cents: the tip credit the employer takes per hour; 0 = none (default) */
  tipCreditCents?: number;
  /** citations shown on the statement */
  sources?: { key: string; url: string; title: string; effectiveFrom: string }[];
}

export type Flag =
  | 'OT_OWED'
  | 'MIN_WAGE_TOPUP'
  | 'NO_HOURS'
  | 'TICKETS_WITHOUT_HOURS'
  | 'OPEN_PUNCH'
  | 'LONG_DAY'
  | 'SPREAD_OF_HOURS'
  | 'SECTION_7I_POSSIBLE'
  | 'GUARANTEE_APPLIED'
  | 'DAILY_OT';

export interface WeekResult {
  workerId: string;
  payBasis: PayBasis;
  minutesWorked: number;
  daysWorked: number;
  salesCents: number;
  baseCents: number;
  commissionCents: number;
  straightTimeCents: number; // base + commission (+ guarantee top-up)
  /** regular rate in cents per hour, unrounded */
  regularRate: number;
  regularRateCents: number; // rounded for display
  regularMinutes: number;
  overtimeMinutes: number;
  overtimePremiumCents: number;
  minWageTopupCents: number;
  spreadOfHoursCents: number;
  tipsCardCents: number;
  tipsCashCents: number;
  deductionsCents: number;
  grossWagesCents: number; // wages excluding tips
  totalCents: number; // gross wages + card tips owed to the worker
  flags: Flag[];
  breakdown: BreakdownLine[];
}

export interface BreakdownLine {
  key: string;
  /** values used, in display units: cents, minutes, percent, or a ratio */
  inputs: Record<string, number | string>;
  resultCents?: number;
  /** cents per hour (may be fractional) */
  resultRate?: number;
  rule?: string;
}

const round = (n: number) => Math.round(n + Number.EPSILON);

export function computeWeek(input: WorkerWeekInput, rules: RuleSet): WeekResult {
  const flags: Flag[] = [];
  const breakdown: BreakdownLine[] = [];
  const otMult = rules.otPremiumMultiplier ?? 0.5;

  const minutesWorked = input.days.reduce((s, d) => s + Math.max(0, d.minutes | 0), 0);
  const daysWorked = input.days.filter((d) => d.minutes > 0).length;
  const hours = minutesWorked / 60;

  if (input.days.some((d) => d.open)) flags.push('OPEN_PUNCH');
  if (input.days.some((d) => d.minutes > 12 * 60)) flags.push('LONG_DAY');
  if (minutesWorked === 0) flags.push('NO_HOURS');
  if (minutesWorked === 0 && (input.ticketCount ?? 0) > 0) flags.push('TICKETS_WITHOUT_HOURS');

  // 1. Commission on sales
  const commissionCents =
    input.commissionPct > 0 && input.salesCents > 0
      ? round((input.salesCents * input.commissionPct) / 100)
      : 0;
  if (commissionCents > 0 || input.payBasis === 'commission' || input.payBasis === 'day_rate_plus_commission') {
    breakdown.push({
      key: 'commission',
      inputs: { salesCents: input.salesCents, commissionPct: input.commissionPct },
      resultCents: commissionCents,
      rule: '29 CFR 778.117'
    });
  }

  // 2. Base pay by basis
  let baseCents = 0;
  switch (input.payBasis) {
    case 'hourly':
      baseCents = round((input.hourlyRateCents * minutesWorked) / 60);
      breakdown.push({
        key: 'hourly_base',
        inputs: { hourlyRateCents: input.hourlyRateCents, minutes: minutesWorked },
        resultCents: baseCents,
        rule: '29 CFR 778.110'
      });
      break;
    case 'day_rate':
    case 'day_rate_plus_commission':
      baseCents = input.dayRateCents * daysWorked;
      breakdown.push({
        key: 'day_rate_base',
        inputs: { dayRateCents: input.dayRateCents, days: daysWorked },
        resultCents: baseCents,
        rule: '29 CFR 778.112'
      });
      break;
    case 'commission':
      baseCents = 0;
      break;
    case 'guarantee_or_commission': {
      // Worker gets the higher of the weekly guarantee or commission ("bao lương" with "ăn chia").
      // A week with no work at all earns no guarantee.
      const worked = daysWorked > 0 || (input.ticketCount ?? 0) > 0;
      if (worked && commissionCents < input.guaranteeCents) {
        baseCents = input.guaranteeCents - commissionCents;
        flags.push('GUARANTEE_APPLIED');
      }
      breakdown.push({
        key: 'guarantee',
        inputs: { guaranteeCents: input.guaranteeCents, commissionCents },
        resultCents: baseCents,
        rule: 'Agreed weekly guarantee; higher of guarantee or commission'
      });
      break;
    }
  }

  let straightTimeCents = baseCents + commissionCents;

  // 3. Regular rate and the minimum-wage floor
  let regularRate = hours > 0 ? straightTimeCents / hours : 0; // cents per hour
  breakdown.push({
    key: 'regular_rate',
    inputs: { straightTimeCents, minutes: minutesWorked },
    resultRate: regularRate,
    rule: '29 CFR 778.109'
  });

  let minWageTopupCents = 0;
  const floor = Math.max(0, rules.minWageCents - (rules.tipCreditCents ?? 0));
  if (hours > 0 && regularRate < floor) {
    minWageTopupCents = round(floor * hours - straightTimeCents);
    straightTimeCents += minWageTopupCents;
    regularRate = floor;
    flags.push('MIN_WAGE_TOPUP');
    breakdown.push({
      key: 'min_wage_topup',
      inputs: { minWageCents: rules.minWageCents, tipCreditCents: rules.tipCreditCents ?? 0, minutes: minutesWorked },
      resultCents: minWageTopupCents,
      rule: `${rules.jurisdiction} minimum wage; 29 CFR 778.107`
    });
  }

  // 4. Overtime: weekly threshold, plus optional daily thresholds (the larger of the two counts)
  let overtimeMinutes = Math.max(0, minutesWorked - rules.otWeeklyThresholdMinutes);
  if (rules.otDailyThresholdMinutes) {
    const daily = input.days.reduce((s, d) => s + Math.max(0, d.minutes - rules.otDailyThresholdMinutes!), 0);
    if (daily > overtimeMinutes) {
      overtimeMinutes = daily;
      flags.push('DAILY_OT');
    }
  }
  const overtimePremiumCents = overtimeMinutes > 0 ? round(regularRate * otMult * (overtimeMinutes / 60)) : 0;
  if (overtimeMinutes > 0) {
    flags.push('OT_OWED');
    breakdown.push({
      key: 'overtime_premium',
      inputs: { overtimeMinutes, regularRate, multiplier: otMult },
      resultCents: overtimePremiumCents,
      rule: '29 CFR 778.107, 778.112, 778.118'
    });
  }

  // 5. NY spread of hours (12 NYCRR 142-2.4). For miscellaneous industries the extra hour at
  //    minimum wage is owed only to the extent weekly pay falls below minimum wage for the hours
  //    worked plus one hour per long day; a worker paid well above minimum is already covered.
  let spreadOfHoursCents = 0;
  if (rules.spreadOfHours) {
    const longDays = input.days.filter((d) => (d.spreadMinutes ?? d.minutes) > 600).length;
    if (longDays > 0) {
      const floorWithSpread = round(rules.minWageCents * (hours + longDays));
      spreadOfHoursCents = Math.max(0, floorWithSpread - straightTimeCents);
      if (spreadOfHoursCents > 0) {
        flags.push('SPREAD_OF_HOURS');
        breakdown.push({
          key: 'spread_of_hours',
          inputs: { days: longDays, minWageCents: rules.minWageCents, minutes: minutesWorked, straightTimeCents },
          resultCents: spreadOfHoursCents,
          rule: '12 NYCRR 142-2.4'
        });
      }
    }
  }

  // 6. Section 7(i) hint: never applied, only surfaced
  const totalComp = straightTimeCents + overtimePremiumCents;
  if (
    overtimeMinutes > 0 &&
    commissionCents > 0 &&
    regularRate > 1.5 * rules.minWageCents &&
    commissionCents > totalComp / 2
  ) {
    flags.push('SECTION_7I_POSSIBLE');
  }

  const deductionsCents = input.deductionsCents ?? 0;
  const grossWagesCents = straightTimeCents + overtimePremiumCents + spreadOfHoursCents - deductionsCents;
  const totalCents = grossWagesCents + input.tipsCardCents;

  breakdown.push({
    key: 'gross_wages',
    inputs: { straightTimeCents, overtimePremiumCents, spreadOfHoursCents, deductionsCents },
    resultCents: grossWagesCents
  });
  breakdown.push({
    key: 'tips',
    inputs: { tipsCardCents: input.tipsCardCents, tipsCashCents: input.tipsCashCents },
    resultCents: input.tipsCardCents + input.tipsCashCents,
    rule: '29 CFR 531.52: tips belong to the employee and are not wages'
  });

  return {
    workerId: input.workerId,
    payBasis: input.payBasis,
    minutesWorked,
    daysWorked,
    salesCents: input.salesCents,
    baseCents,
    commissionCents,
    straightTimeCents,
    regularRate,
    regularRateCents: round(regularRate),
    regularMinutes: minutesWorked - overtimeMinutes,
    overtimeMinutes,
    overtimePremiumCents,
    minWageTopupCents,
    spreadOfHoursCents,
    tipsCardCents: input.tipsCardCents,
    tipsCashCents: input.tipsCashCents,
    deductionsCents,
    grossWagesCents,
    totalCents,
    flags,
    breakdown
  };
}

/** Sum of what is still owed as a result of the law rather than the agreed pay: the "red number". */
export function complianceOwedCents(r: WeekResult): number {
  return r.overtimePremiumCents + r.minWageTopupCents + r.spreadOfHoursCents;
}
