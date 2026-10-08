import { and, eq, isNull } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { requireUser } from '$lib/server/guard';
import { db } from '$lib/server/db';
import { salons, tickets } from '$lib/server/db/schema';
import { computeSalonWeek } from '$lib/server/payrun';
import { activeWorkers, punchMinutes, punchesInRange, statusesFor } from '$lib/server/punches';
import { setupSteps, todosFor } from '$lib/server/todos';
import { addDays, localDate, nowIso, weekEnd, weekStart } from '$lib/time';

export const load: PageServerLoad = async (event) => {
  const { salon, locale } = requireUser(event);
  const now = nowIso();
  const today = localDate(now, salon.timezone);
  const start = weekStart(today, salon.workweekStart);
  const week = await computeSalonWeek(salon, start);
  const ws = await activeWorkers(salon.id);
  const st = await statusesFor(salon, ws.map((w) => w.id));
  const yesterday = addDays(today, -1);
  const yt = await db
    .select({ price: tickets.priceCents })
    .from(tickets)
    .where(and(eq(tickets.salonId, salon.id), eq(tickets.workDate, yesterday), isNull(tickets.voidedAt)));
  const yp = await punchesInRange(salon.id, yesterday, yesterday);
  const [todos, setup] = await Promise.all([todosFor(salon, week), salon.setupDismissedAt ? Promise.resolve(null) : setupSteps(salon)]);
  return {
    locale,
    now,
    today,
    week: {
      start,
      end: weekEnd(start),
      owedCents: week.totals.owedCents,
      grossCents: week.totals.grossWagesCents,
      minutes: week.totals.minutes,
      techs: week.lines.filter((l) => l.result.minutesWorked > 0 || l.result.salesCents > 0).length
    },
    people: ws.map((w) => ({ id: w.id, name: w.displayName, state: st[w.id]?.state ?? 'out', since: st[w.id]?.since ?? null })),
    todos,
    setup,
    yesterday: { sales: yt.reduce((s, x) => s + x.price, 0), tickets: yt.length, minutes: yp.reduce((s, p) => s + (p.tsOut ? punchMinutes(p, p.breaks) : 0), 0) }
  };
};

export const actions: Actions = {
  dismissSetup: async (event) => {
    const { salon } = requireUser(event);
    await db.update(salons).set({ setupDismissedAt: nowIso() }).where(eq(salons.id, salon.id));
    return { ok: true };
  }
};
