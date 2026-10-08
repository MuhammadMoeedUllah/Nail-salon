import { eq, inArray } from 'drizzle-orm';
import { db } from './db';
import { workers, punches, tickets, payLines, payRuns } from './db/schema';
import { makeT, type Locale } from '$lib/i18n';
import { describeEdit, type Ctx, type EditRow, type Group } from './auditText';

/** Sentences for a batch of edit rows, with the look-ups they need done in a handful of queries. */
export async function describeEdits<R extends EditRow>(rows: R[], salon: { id: string; timezone: string }, locale: Locale): Promise<(R & { text: string; group: Group; workerId: string | null })[]> {
  const ids = (entity: string) => [...new Set(rows.filter((e) => e.entity === entity).map((e) => e.entityId))];
  const pIds = ids('punch');
  const tIds = ids('ticket');
  const lIds = ids('pay_line');
  const ws = await db.select({ id: workers.id, name: workers.displayName }).from(workers).where(eq(workers.salonId, salon.id));
  const ps = pIds.length ? await db.select({ id: punches.id, workerId: punches.workerId, workDate: punches.workDate }).from(punches).where(inArray(punches.id, pIds)) : [];
  const ts = tIds.length ? await db.select({ id: tickets.id, workerId: tickets.workerId, workDate: tickets.workDate, serviceName: tickets.serviceName, priceCents: tickets.priceCents }).from(tickets).where(inArray(tickets.id, tIds)) : [];
  const ls = lIds.length ? await db.select({ id: payLines.id, workerId: payLines.workerId, payRunId: payLines.payRunId }).from(payLines).where(inArray(payLines.id, lIds)) : [];
  const runIds = [...new Set([...ids('pay_run'), ...ls.map((l) => l.payRunId)])];
  const rs = runIds.length ? await db.select({ id: payRuns.id, periodStart: payRuns.periodStart }).from(payRuns).where(inArray(payRuns.id, runIds)) : [];
  const runStart = new Map(rs.map((r) => [r.id, r.periodStart]));
  const ctx: Ctx = {
    t: makeT(locale),
    locale,
    tz: salon.timezone,
    worker: new Map(ws.map((w) => [w.id, w.name])),
    punch: new Map(ps.map((p) => [p.id, p])),
    ticket: new Map(ts.map((x) => [x.id, x])),
    line: new Map(ls.map((l) => [l.id, { workerId: l.workerId, periodStart: runStart.get(l.payRunId) ?? '' }])),
    run: new Map(rs.map((r) => [r.id, { periodStart: r.periodStart }]))
  };
  return rows.map((e) => ({ ...e, ...describeEdit(e, ctx) }));
}
