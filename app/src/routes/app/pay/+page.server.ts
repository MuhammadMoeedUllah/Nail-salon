import type { PageServerLoad } from './$types';
import { requireUser } from '$lib/server/guard';
import { listWeeks, computeSalonWeek, getRun, hydrateLine } from '$lib/server/payrun';
import { localDate, nowIso, weekEnd, weekStart } from '$lib/time';

export const load: PageServerLoad = async (event) => {
  const { salon, locale } = requireUser(event);
  const weeks = await listWeeks(salon, 12);
  const current = weekStart(localDate(nowIso(), salon.timezone), salon.workweekStart);
  const rows = [];
  for (const w of weeks) {
    if (w.run && w.run.status !== 'draft') {
      const run = (await getRun(salon.id, w.periodStart))!;
      const lines = run.lines.map(hydrateLine);
      rows.push({
        periodStart: w.periodStart,
        periodEnd: weekEnd(w.periodStart),
        status: run.status,
        gross: lines.reduce((s, l) => s + l.result.grossWagesCents, 0),
        total: lines.reduce((s, l) => s + l.result.totalCents, 0),
        owed: lines.reduce((s, l) => s + l.owedCents, 0),
        minutes: lines.reduce((s, l) => s + l.result.minutesWorked, 0),
        workers: lines.filter((l) => l.result.minutesWorked > 0 || l.result.salesCents > 0).length,
        sent: run.lines.filter((l) => l.statementSentAt).length,
        lines: run.lines.length,
        current: w.periodStart === current
      });
    } else {
      const c = await computeSalonWeek(salon, w.periodStart);
      // older empty weeks are noise; keep the current week even when empty
      if (c.totals.minutes === 0 && c.totals.salesCents === 0 && w.periodStart !== current) continue;
      rows.push({
        periodStart: w.periodStart,
        periodEnd: c.periodEnd,
        status: 'draft',
        gross: c.totals.grossWagesCents,
        total: c.lines.reduce((s, l) => s + l.result.totalCents, 0),
        owed: c.totals.owedCents,
        minutes: c.totals.minutes,
        workers: c.lines.filter((l) => l.result.minutesWorked > 0 || l.result.salesCents > 0).length,
        sent: 0,
        lines: c.lines.length,
        current: w.periodStart === current
      });
    }
  }
  return { locale, rows };
};
