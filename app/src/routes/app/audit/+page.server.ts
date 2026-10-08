import { and, desc, eq, gte, inArray } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { requireUser } from '$lib/server/guard';
import { db } from '$lib/server/db';
import { edits, workers, punches, tickets, payLines, payRuns } from '$lib/server/db/schema';
import { addDays, localDate, nowIso } from '$lib/time';
import { retentionYears } from '$lib/rules';
import { makeT } from '$lib/i18n';
import { describeEdit, type Ctx } from '$lib/server/auditText';

const GROUPS = ['all', 'hours', 'tickets', 'team', 'pay', 'salon'] as const;
const short = (v: string | null) => (v && v.length > 160 ? v.slice(0, 157) + '…' : v);

export const load: PageServerLoad = async (event) => {
  const { salon, locale } = requireUser(event);
  const today = localDate(nowIso(), salon.timezone);
  const qShow = event.url.searchParams.get('show') ?? 'all';
  const show = (GROUPS as readonly string[]).includes(qShow) ? qShow : 'all';
  const tech = event.url.searchParams.get('tech') ?? '';

  const rows = await db.select().from(edits).where(and(eq(edits.salonId, salon.id), gte(edits.ts, addDays(today, -91) + 'T00:00:00'))).orderBy(desc(edits.ts)).limit(600);
  const ws = await db.select({ id: workers.id, name: workers.displayName, active: workers.active }).from(workers).where(eq(workers.salonId, salon.id)).orderBy(workers.sortOrder, workers.displayName);
  const ids = (entity: string) => [...new Set(rows.filter((e) => e.entity === entity).map((e) => e.entityId))];
  const pIds = ids('punch');
  const tIds = ids('ticket');
  const lIds = ids('pay_line');
  const rIds = ids('pay_run');
  const ps = pIds.length ? await db.select({ id: punches.id, workerId: punches.workerId, workDate: punches.workDate }).from(punches).where(inArray(punches.id, pIds)) : [];
  const ts = tIds.length ? await db.select({ id: tickets.id, workerId: tickets.workerId, workDate: tickets.workDate, serviceName: tickets.serviceName, priceCents: tickets.priceCents }).from(tickets).where(inArray(tickets.id, tIds)) : [];
  const ls = lIds.length ? await db.select({ id: payLines.id, workerId: payLines.workerId, payRunId: payLines.payRunId }).from(payLines).where(inArray(payLines.id, lIds)) : [];
  const runIds = [...new Set([...rIds, ...ls.map((l) => l.payRunId)])];
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
  const items = rows
    .map((e) => {
      const d = describeEdit(e, ctx);
      return { id: e.id, ts: e.ts, text: d.text, group: d.group, workerId: d.workerId, reason: e.reason, entity: e.entity, entityId: e.entityId, action: e.action, field: e.field, oldValue: short(e.oldValue), newValue: short(e.newValue) };
    })
    .filter((x) => (show === 'all' || x.group === show) && (!tech || x.workerId === tech));

  const firstOfMonth = today.slice(0, 8) + '01';
  const lastMonthEnd = addDays(firstOfMonth, -1);
  return {
    locale,
    tz: salon.timezone,
    today,
    show,
    tech,
    presets: {
      this_month: { from: firstOfMonth, to: today },
      last_month: { from: lastMonthEnd.slice(0, 8) + '01', to: lastMonthEnd },
      this_year: { from: today.slice(0, 4) + '-01-01', to: today }
    },
    workers: ws,
    items: items.slice(0, 200),
    total: items.length,
    retention: retentionYears(salon.state, today),
    state: salon.state
  };
};
