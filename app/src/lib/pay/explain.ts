// The engine's breakdown as plain sentences for statements, the pay week and the PDF (UX-35, UX-40).
import type { BreakdownLine } from './engine';
import { translate, type Locale, type MessageKey } from '$lib/i18n';
import { fmtCents, fmtHours } from '$lib/time';

const money = (c: number) => fmtCents(Math.round(c));

export function explainLine(b: BreakdownLine, locale: Locale): string {
  const t = (k: MessageKey, p?: Record<string, string | number>) => translate(locale, k, p);
  const i = b.inputs as Record<string, number>;
  const res = b.resultCents !== undefined ? money(b.resultCents) : b.resultRate !== undefined ? money(b.resultRate) : '';
  switch (b.key) {
    case 'commission':
      return t('ex_commission', { pct: i.commissionPct, sales: money(i.salesCents), result: res });
    case 'hourly_base':
      return t('ex_hourly_base', { rate: money(i.hourlyRateCents), hours: fmtHours(i.minutes), result: res });
    case 'day_rate_base':
      return t('ex_day_rate_base', { days: i.days, rate: money(i.dayRateCents), result: res });
    case 'guarantee':
      return (b.resultCents ?? 0) > 0
        ? t('ex_guarantee_applied', { guarantee: money(i.guaranteeCents), commission: money(i.commissionCents), result: res })
        : t('ex_guarantee_not', { guarantee: money(i.guaranteeCents), commission: money(i.commissionCents) });
    case 'regular_rate':
      return t('ex_regular_rate', { straight: money(i.straightTimeCents), hours: fmtHours(i.minutes), rate: money(b.resultRate ?? 0) });
    case 'min_wage_topup':
      return t('ex_min_wage_topup', { mw: money(i.minWageCents - (i.tipCreditCents ?? 0)), hours: fmtHours(i.minutes), result: res });
    case 'overtime_premium':
      return t('ex_overtime_premium', { ot: fmtHours(i.overtimeMinutes), mult: i.multiplier === 0.5 ? '½' : String(i.multiplier), rate: money(i.regularRate), result: res });
    case 'spread_of_hours':
      return t('ex_spread_of_hours', { days: i.days, result: res });
    case 'gross_wages':
      return t('ex_gross_wages', { straight: money(i.straightTimeCents), ot: money(i.overtimePremiumCents), spread: money(i.spreadOfHoursCents), ded: money(i.deductionsCents), result: res });
    case 'tips':
      return t('ex_tips', { card: money(i.tipsCardCents), cash: money(i.tipsCashCents) }) + (i.tipsCardPaidOutCents ? ` · ${t('ex_tips_paid_out', { amount: money(i.tipsCardPaidOutCents) })}` : '');
    default:
      return `${b.key}: ${res}`;
  }
}
