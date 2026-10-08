// What needs the owner today (UX-30): forgotten clock-outs, tickets without hours, weeks to approve, pay or send.
import { and, count, desc, eq, inArray, isNull, lt, ne } from 'drizzle-orm';
import { db } from './db';
import { devices, payLines, payRuns, punches, tickets, workers, type salons } from './db/schema';
import { computeSalonWeek, type WeekComputation } from './payrun';
import { addDays, localDate, nowIso, weekStart } from '$lib/time';

type Salon = typeof salons.$inferSelect;

export type Todo =
  | { kind: 'open_punch'; name: string; date: string; href: string }
  | { kind: 'tickets_no_hours'; name: string; href: string }
  | { kind: 'unapproved'; start: string; payBy: string | null; href: string }
  | { kind: 'approved_unpaid'; start: string; payBy: string | null; href: string }
  | { kind: 'unsent'; start: string; n: number; href: string };

/** New York manual workers are paid weekly, no later than seven days after the workweek ends (Labor Law §191). */
export function payByDate(salon: Salon, periodStart: string): string | null {
  return salon.state === 'NY' ? addDays(periodStart, 13) : null;
}

export async function todosFor(salon: Salon, week: WeekComputation): Promise<Todo[]> {
  const today = localDate(nowIso(), salon.timezone);
  const out: Todo[] = [];
  const names = new Map((await db.select({ id: workers.id, name: workers.displayName }).from(workers).where(eq(workers.salonId, salon.id))).map((w) => [w.id, w.name]));

  const open = await db
    .select({ id: punches.id, workerId: punches.workerId, workDate: punches.workDate })
    .from(punches)
    .where(and(eq(punches.salonId, salon.id), isNull(punches.tsOut), isNull(punches.voidedAt), lt(punches.workDate, today)))
    .orderBy(punches.workDate);
  for (const p of open) out.push({ kind: 'open_punch', name: names.get(p.workerId) ?? '', date: p.workDate, href: `/app/today?date=${p.workDate}&focus=${p.id}` });

  for (const l of week.lines)
    if (l.result.flags.includes('TICKETS_WITHOUT_HOURS')) out.push({ kind: 'tickets_no_hours', name: l.worker.displayName, href: `/app/pay/${week.periodStart}?focus=${l.worker.id}` });

  const runs = await db.select().from(payRuns).where(eq(payRuns.salonId, salon.id)).orderBy(desc(payRuns.periodStart));
  const prevStart = addDays(weekStart(today, salon.workweekStart), -7);
  const prevRun = runs.find((r) => r.periodStart === prevStart);
  if (!prevRun || prevRun.status === 'draft') {
    const prev = await computeSalonWeek(salon, prevStart);
    if (prev.totals.minutes > 0 || prev.totals.salesCents > 0) out.push({ kind: 'unapproved', start: prevStart, payBy: payByDate(salon, prevStart), href: `/app/pay/${prevStart}` });
  }
  for (const r of runs.filter((r) => r.status === 'approved')) out.push({ kind: 'approved_unpaid', start: r.periodStart, payBy: payByDate(salon, r.periodStart), href: `/app/pay/${r.periodStart}` });

  const paid = runs.filter((r) => r.status === 'paid').slice(0, 3);
  if (paid.length) {
    const lines = await db.select({ payRunId: payLines.payRunId, sent: payLines.statementSentAt }).from(payLines).where(inArray(payLines.payRunId, paid.map((r) => r.id)));
    for (const r of paid) {
      const n = lines.filter((l) => l.payRunId === r.id && !l.sent).length;
      if (n) out.push({ kind: 'unsent', start: r.periodStart, n, href: `/app/pay/${r.periodStart}/send` });
    }
  }
  return out;
}

/** Setup checklist steps complete themselves from data (UX-31). */
export async function setupSteps(salon: Salon) {
  const one = async (q: Promise<{ n: number }[]>) => ((await q)[0]?.n ?? 0) > 0;
  const [techs, tablet, punch, ticket, week] = await Promise.all([
    one(db.select({ n: count() }).from(workers).where(and(eq(workers.salonId, salon.id), eq(workers.active, true)))),
    one(db.select({ n: count() }).from(devices).where(and(eq(devices.salonId, salon.id), isNull(devices.revokedAt)))),
    one(db.select({ n: count() }).from(punches).where(eq(punches.salonId, salon.id))),
    one(db.select({ n: count() }).from(tickets).where(eq(tickets.salonId, salon.id))),
    one(db.select({ n: count() }).from(payRuns).where(and(eq(payRuns.salonId, salon.id), ne(payRuns.status, 'draft'))))
  ]);
  return { techs, tablet, punch, ticket, week };
}
