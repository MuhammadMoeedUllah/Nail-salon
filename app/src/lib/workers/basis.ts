import type { makeT } from '$lib/i18n';

type T = ReturnType<typeof makeT>;
export type PayPlan = { payBasis: string; hourlyRateCents: number; dayRateCents: number; commissionPct: number; guaranteeCents: number };
export const BASES = ['guarantee_or_commission', 'day_rate_plus_commission', 'commission', 'day_rate', 'hourly'] as const;

/** $900 for whole dollars, $15.50 otherwise: easier to read in a sentence. */
export function money(cents: number): string {
  const whole = cents % 100 === 0;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 }).format(cents / 100);
}

/** The pay plan in the salon's words, e.g. "$900 a week or 60% commission, whichever is higher" (UX-43). */
export function basisSentence(w: PayPlan, t: T): string {
  const pct = w.commissionPct;
  switch (w.payBasis) {
    case 'hourly':
      return pct ? t('wk_b_hourly_plus', { rate: money(w.hourlyRateCents), pct }) : t('wk_b_hourly', { rate: money(w.hourlyRateCents) });
    case 'day_rate':
      return t('wk_b_day_rate', { rate: money(w.dayRateCents) });
    case 'commission':
      return t('wk_b_commission', { pct });
    case 'day_rate_plus_commission':
      return t('wk_b_day_plus', { rate: money(w.dayRateCents), pct });
    case 'guarantee_or_commission':
      return t('wk_b_guarantee', { rate: money(w.guaranteeCents), pct });
  }
  return w.payBasis;
}
