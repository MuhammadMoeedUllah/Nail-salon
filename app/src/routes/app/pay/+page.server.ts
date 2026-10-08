import type { PageServerLoad } from './$types';
import { requireUser } from '$lib/server/guard';
import { listWeeks, computeSalonWeek } from '$lib/server/payrun';
import { weekEnd } from '$lib/time';

export const load: PageServerLoad = async (event) => {
  const { salon, locale } = requireUser(event);
  const weeks = await listWeeks(salon, 12);
  const rows = [];
  for (const w of weeks) {
    if (w.run && w.run.status !== 'draft') {
      const { getRun, hydrateLine } = await import('$lib/server/payrun');
      const run = (await getRun(salon.id, w.periodStart))!;
      const lines = run.lines.map(hydrateLine);
      rows.push({
        periodStart: w.periodStart,
        periodEnd: weekEnd(w.periodStart),
        status: run.status,
        gross: lines.reduce((s, l) => s + l.result.grossWagesCents, 0),
        owed: lines.reduce((s, l) => s + l.owedCents, 0),
        minutes: lines.reduce((s, l) => s + l.result.minutesWorked, 0),
        workers: lines.length
      });
    } else {
      const c = await computeSalonWeek(salon, w.periodStart);
      if (c.totals.minutes === 0 && c.totals.salesCents === 0 && rows.length > 0 && w.periodStart < weeks[0].periodStart) continue;
      rows.push({ periodStart: w.periodStart, periodEnd: c.periodEnd, status: 'draft', gross: c.totals.grossWagesCents, owed: c.totals.owedCents, minutes: c.totals.minutes, workers: c.lines.length });
    }
  }
  return { locale, rows };
};
