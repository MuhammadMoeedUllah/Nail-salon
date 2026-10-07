import Papa from 'papaparse';
import type { WeekLine } from './payrun';
import { dollars } from '$lib/money';

const h2 = (min: number) => (min / 60).toFixed(2);
const splitName = (legal: string) => {
  const parts = legal.trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: '' };
  return { first: parts.slice(0, -1).join(' '), last: parts.at(-1)! };
};

/**
 * Gusto CSV upload. Columns are matched by header name. Overtime is exported as a dollar
 * earnings line ("Overtime premium") because Gusto would otherwise re-price OT hours at 1.5x
 * an hourly rate that commission and day-rate workers do not have. The salon creates custom
 * earning types named exactly like these headers once (Gusto: Custom earnings types).
 */
export function gustoCsv(lines: WeekLine[], periodStart: string, periodEnd: string): string {
  const rows = lines.map((l) => {
    const n = splitName(l.worker.legalName);
    const r = l.result;
    return {
      'Legal first name': n.first,
      'Last name': n.last,
      'Regular hours': h2(r.minutesWorked),
      'Overtime hours': '0.00',
      'Double overtime hours': '0.00',
      Commission: dollars(r.commissionCents),
      'Day rate': dollars(r.baseCents),
      'Overtime premium': dollars(r.overtimePremiumCents),
      'Minimum wage top-up': dollars(r.minWageTopupCents + r.spreadOfHoursCents),
      Bonus: '0.00',
      'Paycheck tips': dollars(r.tipsCardCents),
      'Cash tips': dollars(r.tipsCashCents),
      workweeks: `${periodStart} - ${periodEnd}`
    };
  });
  return Papa.unparse(rows);
}

/** ADP RUN paydata layout. Co Code and File # must be filled by the salon's bookkeeper. */
export function adpCsv(lines: WeekLine[]): string {
  const rows = lines.map((l) => {
    const r = l.result;
    return {
      'Co Code': '',
      'Batch ID': '',
      'File #': '',
      'Employee Name': l.worker.legalName,
      'Reg Hours': h2(r.minutesWorked),
      'O/T Hours': '0.00',
      'Hours 3 Code': '',
      'Hours 3 Amount': '',
      'Earnings 3 Code': 'C',
      'Earnings 3 Amount': dollars(r.commissionCents + r.baseCents),
      'Earnings 4 Code': 'O',
      'Earnings 4 Amount': dollars(r.overtimePremiumCents + r.minWageTopupCents + r.spreadOfHoursCents),
      'Earnings 5 Code': 'T',
      'Earnings 5 Amount': dollars(r.tipsCardCents)
    };
  });
  return Papa.unparse(rows);
}

/** Human-readable sheet the owner or CPA can key into any payroll product. */
export function genericCsv(lines: WeekLine[], periodStart: string, periodEnd: string): string {
  const rows = lines.map((l) => {
    const r = l.result;
    return {
      'Period start': periodStart,
      'Period end': periodEnd,
      'Legal name': l.worker.legalName,
      'Name on tablet': l.worker.displayName,
      'Pay basis': r.payBasis,
      'Days worked': r.daysWorked,
      'Hours worked': h2(r.minutesWorked),
      'Regular hours': h2(r.regularMinutes),
      'Overtime hours': h2(r.overtimeMinutes),
      'Service sales': dollars(r.salesCents),
      'Commission %': l.worker.commissionPct,
      Commission: dollars(r.commissionCents),
      'Day rate / hourly / guarantee': dollars(r.baseCents),
      'Regular rate ($/h)': (r.regularRate / 100).toFixed(4),
      'Minimum wage top-up': dollars(r.minWageTopupCents),
      'Overtime premium': dollars(r.overtimePremiumCents),
      'Spread of hours (NY)': dollars(r.spreadOfHoursCents),
      Deductions: dollars(r.deductionsCents),
      'Gross wages': dollars(r.grossWagesCents),
      'Card tips (paycheck tips)': dollars(r.tipsCardCents),
      'Cash tips (already received)': dollars(r.tipsCashCents),
      'Total to pay': dollars(r.totalCents),
      Flags: r.flags.join(' ')
    };
  });
  return Papa.unparse(rows);
}
