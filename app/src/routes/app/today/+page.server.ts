import { fail } from '@sveltejs/kit';
import { and, eq, gte, lte } from 'drizzle-orm';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { requireUser } from '$lib/server/guard';
import { db } from '$lib/server/db';
import { tickets, punches, services, workers } from '$lib/server/db/schema';
import { punchesInRange, punchMinutes, statusesFor, applyPunch } from '$lib/server/punches';
import { newId } from '$lib/server/auth';
import { recordEdit, recordDiff } from '$lib/server/audit';
import { localDate, localTime, localToIso, nowIso, addDays, minutesBetween, weekStart, weekEnd, eachDay } from '$lib/time';
import { parseDollars } from '$lib/money';
import { computeSalonWeek } from '$lib/server/payrun';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const STALE_MINUTES = 16 * 60;

export const load: PageServerLoad = async (event) => {
  const { salon, locale } = requireUser(event);
  const q = event.url.searchParams.get('date');
  const now = nowIso();
  const today = localDate(now, salon.timezone);
  const date = q && DATE.test(q) ? q : today;
  const tz = salon.timezone;
  const wkStart = weekStart(date, salon.workweekStart);
  const wkEnd = weekEnd(wkStart);

  const ws = await db.select().from(workers).where(eq(workers.salonId, salon.id)).orderBy(workers.sortOrder, workers.displayName);
  const ps = await punchesInRange(salon.id, date, date);
  const ts = await db.select().from(tickets).where(and(eq(tickets.salonId, salon.id), eq(tickets.workDate, date))).orderBy(tickets.ts);
  const svc = await db.select().from(services).where(and(eq(services.salonId, salon.id), eq(services.active, true))).orderBy(services.sortOrder);
  const st = await statusesFor(salon, ws.filter((w) => w.active).map((w) => w.id));

  // one dot per day of the workweek that has tickets or hours (day strip)
  const wkTickets = await db.select({ d: tickets.workDate }).from(tickets).where(and(eq(tickets.salonId, salon.id), gte(tickets.workDate, wkStart), lte(tickets.workDate, wkEnd)));
  const wkPunches = await db.select({ d: punches.workDate }).from(punches).where(and(eq(punches.salonId, salon.id), gte(punches.workDate, wkStart), lte(punches.workDate, wkEnd)));
  const busyDays = new Set([...wkTickets, ...wkPunches].map((r) => r.d));

  // the week's totals are slower to compute: stream them so the day renders first (UX-28)
  const week = computeSalonWeek(salon, wkStart).then((w) => ({ start: wkStart, owedCents: w.totals.owedCents, grossCents: w.totals.grossWagesCents }));

  return {
    locale,
    date,
    today,
    now,
    tz,
    closingTime: salon.closingTime,
    weekDays: eachDay(wkStart, wkEnd).map((d) => ({ date: d, busy: busyDays.has(d) })),
    week,
    workers: ws.map((w) => ({ id: w.id, name: w.displayName, active: w.active, status: st[w.id] ?? null })),
    services: svc.map((s) => ({ id: s.id, en: s.nameEn, vi: s.nameVi ?? s.nameEn, price: s.defaultPriceCents })),
    punches: ps.map((p) => {
      const tabletBreaks = p.breaks.reduce((s, b) => s + (b.tsEnd ? Math.round((new Date(b.tsEnd).getTime() - new Date(b.tsStart).getTime()) / 60000) : 0), 0);
      return {
        id: p.id,
        workerId: p.workerId,
        tsIn: p.tsIn,
        tsOut: p.tsOut,
        inLocal: localTime(p.tsIn, tz),
        outLocal: p.tsOut ? localTime(p.tsOut, tz) : null,
        minutes: punchMinutes(p, p.breaks, now),
        open: !p.tsOut,
        stale: !p.tsOut && minutesBetween(p.tsIn, now) > STALE_MINUTES,
        manualBreakMinutes: p.manualBreakMinutes,
        tabletBreakMinutes: tabletBreaks,
        onBreak: p.breaks.some((b) => !b.tsEnd),
        source: p.source,
        photoIn: p.photoInRef,
        photoOut: p.photoOutRef
      };
    }),
    tickets: ts.map((t) => ({
      id: t.id,
      workerId: t.workerId,
      ts: t.ts,
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

const userActor = (user: { id: string; name: string }) => ({ type: 'user' as const, id: user.id, name: user.name });

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
    await recordEdit({ salonId: salon.id, entity: 'ticket', entityId: id, action: 'create', newValue: { worker: w.displayName, service: v.serviceName, price, tipCard, tipCash }, actor: userActor(user) });
    return { ok: true, form: 'ticket', id, lastWorkerId: v.workerId };
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
    await recordEdit({ salonId: salon.id, entity: 'ticket', entityId: id, action: 'void', oldValue: { service: t.serviceName, price: t.priceCents }, reason, actor: userActor(user) });
    return { ok: true, form: 'void', id };
  },

  /** Undo of a void (UX-04): the ticket counts again; the trail keeps both steps. */
  unvoidTicket: async (event) => {
    const { salon, user } = requireUser(event);
    const id = String((await event.request.formData()).get('id') ?? '');
    const t = await db.select().from(tickets).where(and(eq(tickets.id, id), eq(tickets.salonId, salon.id))).get();
    if (!t || !t.voidedAt) return fail(404, { error: 'not_found', form: 'void' });
    await db.update(tickets).set({ voidedAt: null, voidReason: null }).where(eq(tickets.id, id));
    await recordEdit({ salonId: salon.id, entity: 'ticket', entityId: id, action: 'update', field: 'voided', oldValue: t.voidReason, newValue: null, reason: 'undo', actor: userActor(user) });
    return { ok: true, form: 'void', id };
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
    const actor = userActor(user);
    if (voidIt) {
      await db.update(punches).set({ voidedAt: nowIso() }).where(eq(punches.id, id));
      await recordEdit({ salonId: salon.id, entity: 'punch', entityId: id, action: 'void', oldValue: { tsIn: p.tsIn, tsOut: p.tsOut }, reason, actor });
      return { ok: true, form: 'punch', id, voided: true };
    }
    if (!/^\d{2}:\d{2}$/.test(inT) || (outT && !/^\d{2}:\d{2}$/.test(outT)) || !Number.isInteger(brk) || brk < 0 || brk > 600) return fail(400, { error: 'invalid', form: 'punch', id });
    const tsIn = localToIso(p.workDate, inT, salon.timezone);
    let tsOut: string | null = outT ? localToIso(p.workDate, outT, salon.timezone) : null;
    if (tsOut && tsOut <= tsIn) tsOut = localToIso(addDays(p.workDate, 1), outT, salon.timezone); // shift past midnight
    const before = { tsIn: p.tsIn, tsOut: p.tsOut, manualBreakMinutes: p.manualBreakMinutes };
    const after = { tsIn, tsOut, manualBreakMinutes: brk, voidedAt: null };
    await db.update(punches).set(after).where(eq(punches.id, id));
    await recordDiff({ salonId: salon.id, entity: 'punch', entityId: id, actor, reason }, before, { tsIn, tsOut, manualBreakMinutes: brk });
    return {
      ok: true,
      form: 'punch',
      id,
      before: { in: localTime(p.tsIn, salon.timezone), out: p.tsOut ? localTime(p.tsOut, salon.timezone) : '', breakMinutes: p.manualBreakMinutes, voided: !!p.voidedAt }
    };
  },

  /** Undo of "Clock out now": the shift is open again (only right after it was closed). */
  reopenPunch: async (event) => {
    const { salon, user } = requireUser(event);
    const id = String((await event.request.formData()).get('id') ?? '');
    const p = await db.select().from(punches).where(and(eq(punches.id, id), eq(punches.salonId, salon.id))).get();
    if (!p || !p.tsOut || minutesBetween(p.tsOut, nowIso()) > 15) return fail(409, { error: 'too_late', form: 'punch' });
    await db.update(punches).set({ tsOut: null }).where(eq(punches.id, id));
    await recordEdit({ salonId: salon.id, entity: 'punch', entityId: id, action: 'update', field: 'ts_out', oldValue: p.tsOut, newValue: null, reason: 'undo', actor: userActor(user) });
    return { ok: true, form: 'punch', id };
  },

  payOutTips: async (event) => {
    const { salon, user } = requireUser(event);
    const f = await event.request.formData();
    const workerId = String(f.get('workerId') ?? ''); // '*' = everyone that day
    const date = String(f.get('date') ?? '');
    const undo = f.get('undo') === '1';
    if (!DATE.test(date) || !workerId) return fail(400, { error: 'invalid', form: 'tips' });
    const rows = await db
      .select()
      .from(tickets)
      .where(workerId === '*' ? and(eq(tickets.salonId, salon.id), eq(tickets.workDate, date)) : and(eq(tickets.salonId, salon.id), eq(tickets.workerId, workerId), eq(tickets.workDate, date)));
    const target = rows.filter((t) => !t.voidedAt && t.tipCardCents > 0 && (undo ? !!t.tipCardPaidOutAt : !t.tipCardPaidOutAt));
    const now = nowIso();
    for (const t of target) await db.update(tickets).set({ tipCardPaidOutAt: undo ? null : now }).where(eq(tickets.id, t.id));
    const total = target.reduce((s, t) => s + t.tipCardCents, 0);
    await recordEdit({ salonId: salon.id, entity: 'ticket', entityId: `${workerId}:${date}`, action: 'update', field: 'tip_card_paid_out', oldValue: undo ? total : 0, newValue: undo ? 0 : total, reason: undo ? 'undo cash pay-out' : 'card tips handed over in cash', actor: userActor(user) });
    return { ok: true, form: 'tips', total, workerId };
  },

  clockOutNow: async (event) => {
    const { salon, user } = requireUser(event);
    const f = await event.request.formData();
    const workerId = String(f.get('workerId') ?? '');
    const w = await db.select().from(workers).where(and(eq(workers.id, workerId), eq(workers.salonId, salon.id))).get();
    if (!w) return fail(404, { error: 'not_found', form: 'punch' });
    const r = await applyPunch({ salon, workerId, action: 'out', actor: userActor(user) });
    if (!r.ok) return fail(409, { error: r.error, form: 'punch' });
    return { ok: true, form: 'punch', id: r.punchId, ts: r.ts };
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
    await recordEdit({ salonId: salon.id, entity: 'punch', entityId: id, action: 'create', newValue: { tsIn, tsOut, breakMinutes: brk, worker: w.displayName }, reason, actor: userActor(user) });
    return { ok: true, form: 'addPunch', id };
  }
};
