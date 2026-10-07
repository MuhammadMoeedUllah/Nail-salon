import { fail } from '@sveltejs/kit';
import { and, eq, gte, lte } from 'drizzle-orm';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { requireUser } from '$lib/server/guard';
import { db } from '$lib/server/db';
import { tickets, punches, breaks, services, workers } from '$lib/server/db/schema';
import { punchesInRange, punchMinutes, statusesFor } from '$lib/server/punches';
import { newId } from '$lib/server/auth';
import { recordEdit, recordDiff } from '$lib/server/audit';
import { localDate, localTime, localToIso, nowIso, addDays } from '$lib/time';
import { parseDollars } from '$lib/money';
import { computeSalonWeek } from '$lib/server/payrun';
import { weekStart } from '$lib/time';
import { applyPunch } from '$lib/server/punches';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export const load: PageServerLoad = async (event) => {
  const { salon, locale } = requireUser(event);
  const q = event.url.searchParams.get('date');
  const today = localDate(nowIso(), salon.timezone);
  const date = q && DATE.test(q) ? q : today;
  const ws = await db.select().from(workers).where(eq(workers.salonId, salon.id)).orderBy(workers.sortOrder, workers.displayName);
  const ps = await punchesInRange(salon.id, date, date);
  const ts = await db
    .select()
    .from(tickets)
    .where(and(eq(tickets.salonId, salon.id), eq(tickets.workDate, date)))
    .orderBy(tickets.ts);
  const svc = await db.select().from(services).where(and(eq(services.salonId, salon.id), eq(services.active, true))).orderBy(services.sortOrder);
  const st = await statusesFor(salon, ws.filter((w) => w.active).map((w) => w.id));
  const tz = salon.timezone;
  const wkStart = weekStart(date, salon.workweekStart);
  const week = await computeSalonWeek(salon, wkStart);
  const statuses = Object.values(st);
  return {
    week: {
      start: wkStart,
      owedCents: week.totals.owedCents,
      grossCents: week.totals.grossWagesCents,
      minutes: week.totals.minutes,
      salesCents: week.totals.salesCents,
      stillIn: statuses.filter((x) => x.state !== 'out').length,
      stale: statuses.filter((x) => x.staleOpen).length,
      flagged: week.lines.filter((l) => l.result.flags.some((f) => f === 'OPEN_PUNCH' || f === 'TICKETS_WITHOUT_HOURS')).length
    },
    locale,
    date,
    today,
    prev: addDays(date, -1),
    next: addDays(date, 1),
    tz,
    workers: ws.map((w) => ({ id: w.id, name: w.displayName, active: w.active, status: st[w.id] ?? null })),
    services: svc.map((s) => ({ id: s.id, en: s.nameEn, vi: s.nameVi ?? s.nameEn, price: s.defaultPriceCents })),
    punches: ps.map((p) => ({
      id: p.id,
      workerId: p.workerId,
      inLocal: localTime(p.tsIn, tz),
      outLocal: p.tsOut ? localTime(p.tsOut, tz) : null,
      minutes: p.tsOut ? punchMinutes(p, p.breaks) : null,
      breakMinutes: p.breaks.reduce((s, b) => s + (b.tsEnd ? Math.round((new Date(b.tsEnd).getTime() - new Date(b.tsStart).getTime()) / 60000) : 0), 0) + p.manualBreakMinutes,
      source: p.source,
      photoIn: p.photoInRef,
      photoOut: p.photoOutRef,
      note: p.note
    })),
    tickets: ts.map((t) => ({
      id: t.id,
      workerId: t.workerId,
      time: localTime(t.ts, tz),
      ticketNo: t.ticketNo,
      serviceName: t.serviceName,
      priceCents: t.priceCents,
      tipCardCents: t.tipCardCents,
      tipCashCents: t.tipCashCents,
      paymentMethod: t.paymentMethod,
      tipCardPaidOut: !!t.tipCardPaidOutAt,
      source: t.source,
      voidedAt: t.voidedAt,
      voidReason: t.voidReason
    }))
  };
};

const TicketSchema = z.object({
  date: z.string().regex(DATE),
  workerId: z.string().min(1),
  serviceName: z.string().trim().min(1).max(80),
  price: z.string(),
  tipCard: z.string().optional().default(''),
  tipCash: z.string().optional().default(''),
  paymentMethod: z.enum(['card', 'cash', 'other', '']).optional().default(''),
  ticketNo: z.string().trim().max(30).optional().default(''),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal(''))
});

export const actions: Actions = {
  addTicket: async (event) => {
    const { salon, user } = requireUser(event);
    const raw = Object.fromEntries(await event.request.formData()) as Record<string, string>;
    if (!raw.serviceName && raw.service_free) raw.serviceName = raw.service_free;
    const p = TicketSchema.safeParse(raw);
    const price = parseDollars(raw.price);
    const tipCard = parseDollars(raw.tipCard ?? '') ?? 0;
    const tipCash = parseDollars(raw.tipCash ?? '') ?? 0;
    if (!p.success || price === null || price < 0 || tipCard < 0 || tipCash < 0) return fail(400, { error: 'invalid', form: 'ticket', values: raw });
    const v = p.data;
    const w = await db.select().from(workers).where(and(eq(workers.id, v.workerId), eq(workers.salonId, salon.id))).get();
    if (!w) return fail(400, { error: 'invalid', form: 'ticket', values: raw });
    const today = localDate(nowIso(), salon.timezone);
    const ts = v.time ? localToIso(v.date, v.time, salon.timezone) : v.date === today ? nowIso() : localToIso(v.date, '12:00', salon.timezone);
    const id = newId();
    await db.insert(tickets).values({
      id,
      salonId: salon.id,
      workerId: v.workerId,
      workDate: v.date,
      ts,
      ticketNo: v.ticketNo || null,
      serviceName: v.serviceName,
      priceCents: price,
      tipCardCents: tipCard,
      tipCashCents: tipCash,
      paymentMethod: v.paymentMethod || null,
      source: 'manual',
      createdByUserId: user.id
    });
    await recordEdit({ salonId: salon.id, entity: 'ticket', entityId: id, action: 'create', newValue: { worker: w.displayName, service: v.serviceName, price, tipCard, tipCash }, actor: { type: 'user', id: user.id, name: user.name } });
    return { ok: true, form: 'ticket', lastWorkerId: v.workerId };
  },

  voidTicket: async (event) => {
    const { salon, user } = requireUser(event);
    const f = await event.request.formData();
    const id = String(f.get('id') ?? '');
    const reason = String(f.get('reason') ?? '').trim();
    if (!id || reason.length < 2) return fail(400, { error: 'reason_required', form: 'void', id });
    const t = await db.select().from(tickets).where(and(eq(tickets.id, id), eq(tickets.salonId, salon.id))).get();
    if (!t || t.voidedAt) return fail(404, { error: 'not_found', form: 'void' });
    await db.update(tickets).set({ voidedAt: nowIso(), voidReason: reason }).where(eq(tickets.id, id));
    await recordEdit({ salonId: salon.id, entity: 'ticket', entityId: id, action: 'void', oldValue: { service: t.serviceName, price: t.priceCents }, reason, actor: { type: 'user', id: user.id, name: user.name } });
    return { ok: true, form: 'void' };
  },

  fixPunch: async (event) => {
    const { salon, user } = requireUser(event);
    const f = await event.request.formData();
    const id = String(f.get('id') ?? '');
    const reason = String(f.get('reason') ?? '').trim();
    const inT = String(f.get('in') ?? '');
    const outT = String(f.get('out') ?? '');
    const brk = Number(f.get('breakMinutes') ?? 0);
    const voidIt = f.get('void') === '1';
    if (!id || reason.length < 2) return fail(400, { error: 'reason_required', form: 'punch', id });
    const p = await db.select().from(punches).where(and(eq(punches.id, id), eq(punches.salonId, salon.id))).get();
    if (!p) return fail(404, { error: 'not_found', form: 'punch' });
    const actor = { type: 'user' as const, id: user.id, name: user.name };
    if (voidIt) {
      await db.update(punches).set({ voidedAt: nowIso() }).where(eq(punches.id, id));
      await recordEdit({ salonId: salon.id, entity: 'punch', entityId: id, action: 'void', oldValue: { tsIn: p.tsIn, tsOut: p.tsOut }, reason, actor });
      return { ok: true, form: 'punch' };
    }
    if (!/^\d{2}:\d{2}$/.test(inT) || (outT && !/^\d{2}:\d{2}$/.test(outT)) || !Number.isInteger(brk) || brk < 0 || brk > 600) return fail(400, { error: 'invalid', form: 'punch', id });
    const tsIn = localToIso(p.workDate, inT, salon.timezone);
    let tsOut: string | null = outT ? localToIso(p.workDate, outT, salon.timezone) : null;
    if (tsOut && tsOut <= tsIn) tsOut = localToIso(addDays(p.workDate, 1), outT, salon.timezone); // shift past midnight
    const after = { tsIn, tsOut, manualBreakMinutes: brk };
    await db.update(punches).set(after).where(eq(punches.id, id));
    await recordDiff({ salonId: salon.id, entity: 'punch', entityId: id, actor, reason }, { tsIn: p.tsIn, tsOut: p.tsOut, manualBreakMinutes: p.manualBreakMinutes }, after);
    return { ok: true, form: 'punch' };
  },

  payOutTips: async (event) => {
    const { salon, user } = requireUser(event);
    const f = await event.request.formData();
    const workerId = String(f.get('workerId') ?? '');
    const date = String(f.get('date') ?? '');
    const undo = f.get('undo') === '1';
    if (!DATE.test(date) || !workerId) return fail(400, { error: 'invalid', form: 'tips' });
    const rows = await db
      .select()
      .from(tickets)
      .where(and(eq(tickets.salonId, salon.id), eq(tickets.workerId, workerId), eq(tickets.workDate, date)));
    const target = rows.filter((t) => !t.voidedAt && t.tipCardCents > 0 && (undo ? !!t.tipCardPaidOutAt : !t.tipCardPaidOutAt));
    const now = nowIso();
    for (const t of target) {
      await db.update(tickets).set({ tipCardPaidOutAt: undo ? null : now }).where(eq(tickets.id, t.id));
    }
    const total = target.reduce((s, t) => s + t.tipCardCents, 0);
    await recordEdit({ salonId: salon.id, entity: 'ticket', entityId: `${workerId}:${date}`, action: 'update', field: 'tip_card_paid_out', oldValue: undo ? total : 0, newValue: undo ? 0 : total, reason: undo ? 'undo cash pay-out' : 'card tips handed over in cash', actor: { type: 'user', id: user.id, name: user.name } });
    return { ok: true, form: 'tips' };
  },

  clockOutNow: async (event) => {
    const { salon, user } = requireUser(event);
    const f = await event.request.formData();
    const workerId = String(f.get('workerId') ?? '');
    const w = await db.select().from(workers).where(and(eq(workers.id, workerId), eq(workers.salonId, salon.id))).get();
    if (!w) return fail(404, { error: 'not_found', form: 'punch' });
    const r = await applyPunch({ salon, workerId, action: 'out', actor: { type: 'user', id: user.id, name: user.name } });
    if (!r.ok) return fail(409, { error: r.error, form: 'punch' });
    return { ok: true, form: 'punch' };
  },

  addPunch: async (event) => {
    const { salon, user } = requireUser(event);
    const f = await event.request.formData();
    const date = String(f.get('date') ?? '');
    const workerId = String(f.get('workerId') ?? '');
    const inT = String(f.get('in') ?? '');
    const outT = String(f.get('out') ?? '');
    const brk = Number(f.get('breakMinutes') ?? 0);
    const reason = String(f.get('reason') ?? '').trim();
    if (!DATE.test(date) || !workerId || !/^\d{2}:\d{2}$/.test(inT) || !/^\d{2}:\d{2}$/.test(outT) || reason.length < 2 || !Number.isInteger(brk) || brk < 0)
      return fail(400, { error: 'invalid', form: 'addPunch' });
    const w = await db.select().from(workers).where(and(eq(workers.id, workerId), eq(workers.salonId, salon.id))).get();
    if (!w) return fail(400, { error: 'invalid', form: 'addPunch' });
    const tsIn = localToIso(date, inT, salon.timezone);
    let tsOut = localToIso(date, outT, salon.timezone);
    if (tsOut <= tsIn) tsOut = localToIso(addDays(date, 1), outT, salon.timezone);
    const id = newId();
    await db.insert(punches).values({ id, salonId: salon.id, workerId, workDate: date, tsIn, tsOut, manualBreakMinutes: brk, source: 'owner' });
    await recordEdit({ salonId: salon.id, entity: 'punch', entityId: id, action: 'create', newValue: { tsIn, tsOut, breakMinutes: brk, worker: w.displayName }, reason, actor: { type: 'user', id: user.id, name: user.name } });
    return { ok: true, form: 'addPunch' };
  }
};
