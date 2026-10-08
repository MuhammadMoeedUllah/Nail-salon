import { and, eq, isNull, desc, gte, lte, inArray } from 'drizzle-orm';
import { db } from './db';
import { punches, breaks, workers, tickets, type Punch, type Break, type Salon } from './db/schema';
import { newId } from './auth';
import { recordEdit, type Actor } from './audit';
import { localDate, localToIso, minutesBetween, nowIso } from '$lib/time';

export type PunchAction = 'in' | 'out' | 'break_start' | 'break_end';

export interface WorkerStatus {
  workerId: string;
  state: 'out' | 'in' | 'break';
  since: string | null; // ISO
  openPunchId: string | null;
  staleOpen: boolean; // open for more than 16 hours
  minutesToday: number;
  ticketsToday: number;
}

const STALE_HOURS = 16;

export async function openPunchFor(workerId: string): Promise<(Punch & { breaks: Break[] }) | null> {
  const p = await db
    .select()
    .from(punches)
    .where(and(eq(punches.workerId, workerId), isNull(punches.tsOut), isNull(punches.voidedAt)))
    .orderBy(desc(punches.tsIn))
    .get();
  if (!p) return null;
  const b = await db.select().from(breaks).where(eq(breaks.punchId, p.id));
  return { ...p, breaks: b };
}

/** Minutes worked in a punch, unpaid breaks removed. Open punch counts up to `now`. */
export function punchMinutes(p: Punch, brs: Break[], now = nowIso()): number {
  const end = p.tsOut ?? now;
  let m = minutesBetween(p.tsIn, end);
  for (const b of brs) if (!b.paid) m -= minutesBetween(b.tsStart, b.tsEnd ?? end);
  m -= p.manualBreakMinutes ?? 0;
  return Math.max(0, m);
}

export async function statusesFor(salon: Salon, workerIds: string[]): Promise<Record<string, WorkerStatus>> {
  const out: Record<string, WorkerStatus> = {};
  if (workerIds.length === 0) return out;
  const today = localDate(nowIso(), salon.timezone);
  const rows = await db
    .select()
    .from(punches)
    .where(and(inArray(punches.workerId, workerIds), isNull(punches.voidedAt), gte(punches.workDate, today)))
    .orderBy(desc(punches.tsIn));
  const open = await db
    .select()
    .from(punches)
    .where(and(inArray(punches.workerId, workerIds), isNull(punches.voidedAt), isNull(punches.tsOut)));
  const all = [...rows, ...open.filter((o) => !rows.some((r) => r.id === o.id))];
  const brs = all.length ? await db.select().from(breaks).where(inArray(breaks.punchId, all.map((p) => p.id))) : [];
  const tk = await db
    .select({ workerId: tickets.workerId })
    .from(tickets)
    .where(and(inArray(tickets.workerId, workerIds), eq(tickets.workDate, today), isNull(tickets.voidedAt)));
  for (const id of workerIds) {
    const mine = all.filter((p) => p.workerId === id);
    const op = mine.find((p) => !p.tsOut) ?? null;
    const openBreak = op ? brs.find((b) => b.punchId === op.id && !b.tsEnd) : null;
    const minutesToday = mine.filter((p) => p.workDate === today).reduce((s, p) => s + punchMinutes(p, brs.filter((b) => b.punchId === p.id)), 0);
    out[id] = {
      workerId: id,
      state: op ? (openBreak ? 'break' : 'in') : 'out',
      since: openBreak?.tsStart ?? op?.tsIn ?? null,
      openPunchId: op?.id ?? null,
      staleOpen: !!op && minutesBetween(op.tsIn, nowIso()) > STALE_HOURS * 60,
      minutesToday,
      ticketsToday: tk.filter((x) => x.workerId === id).length
    };
  }
  return out;
}

export interface PunchResult {
  ok: boolean;
  action: PunchAction;
  ts: string;
  punchId: string;
  minutesToday: number;
  error?: string;
}

/**
 * Apply a clock action for a worker. `ts` defaults to now; an offline tablet may pass the time the
 * tap happened (bounded to the last 24 hours). `clientId` makes retries idempotent.
 */
export async function applyPunch(opts: {
  salon: Salon;
  workerId: string;
  action: PunchAction;
  ts?: string;
  clientId?: string;
  photo?: string | null;
  deviceId?: string | null;
  actor: Actor;
  savePhoto?: (punchId: string, kind: 'in' | 'out', dataUrl: string) => string | null;
}): Promise<PunchResult> {
  const { salon, workerId, action } = opts;
  let ts = nowIso();
  if (opts.ts) {
    const t = new Date(opts.ts).getTime();
    if (!Number.isNaN(t) && Date.now() - t < 24 * 3600_000 && t <= Date.now() + 60_000) ts = new Date(t).toISOString();
  }
  // Idempotency: the same clientId already applied → return the existing punch
  if (opts.clientId) {
    const existing = await db.select().from(punches).where(and(eq(punches.workerId, workerId), eq(punches.note, `client:${opts.clientId}`))).get();
    if (existing && action === 'in') {
      return { ok: true, action, ts: existing.tsIn, punchId: existing.id, minutesToday: 0 };
    }
  }
  const open = await openPunchFor(workerId);
  const openBreak = open?.breaks.find((b) => !b.tsEnd) ?? null;

  if (action === 'in') {
    if (open && minutesBetween(open.tsIn, ts) <= STALE_HOURS * 60) {
      return { ok: false, action, ts, punchId: open.id, minutesToday: 0, error: 'already_in' };
    }
    // A stale open punch stays open and flagged for the owner to fix; a new shift starts.
    const id = newId();
    const photoRef = opts.photo && opts.savePhoto ? opts.savePhoto(id, 'in', opts.photo) : null;
    await db.insert(punches).values({
      id,
      salonId: salon.id,
      workerId,
      workDate: localDate(ts, salon.timezone),
      tsIn: ts,
      photoInRef: photoRef,
      source: opts.ts ? 'tablet-offline' : opts.actor.type === 'device' ? 'tablet' : 'owner',
      deviceId: opts.deviceId ?? null,
      note: opts.clientId ? `client:${opts.clientId}` : null
    });
    await recordEdit({ salonId: salon.id, entity: 'punch', entityId: id, action: 'create', field: 'ts_in', newValue: ts, actor: opts.actor });
    return { ok: true, action, ts, punchId: id, minutesToday: 0 };
  }

  if (!open) return { ok: false, action, ts, punchId: '', minutesToday: 0, error: 'not_in' };

  if (action === 'break_start') {
    if (openBreak) return { ok: false, action, ts, punchId: open.id, minutesToday: 0, error: 'already_on_break' };
    const bid = newId();
    await db.insert(breaks).values({ id: bid, punchId: open.id, tsStart: ts });
    await recordEdit({ salonId: salon.id, entity: 'punch', entityId: open.id, action: 'update', field: 'break_start', newValue: ts, actor: opts.actor });
    return { ok: true, action, ts, punchId: open.id, minutesToday: punchMinutes(open, open.breaks, ts) };
  }
  if (action === 'break_end') {
    if (!openBreak) return { ok: false, action, ts, punchId: open.id, minutesToday: 0, error: 'not_on_break' };
    await db.update(breaks).set({ tsEnd: ts }).where(eq(breaks.id, openBreak.id));
    await recordEdit({ salonId: salon.id, entity: 'punch', entityId: open.id, action: 'update', field: 'break_end', newValue: ts, actor: opts.actor });
    return { ok: true, action, ts, punchId: open.id, minutesToday: punchMinutes(open, open.breaks.map((b) => (b.id === openBreak.id ? { ...b, tsEnd: ts } : b)), ts) };
  }
  // out
  if (openBreak) await db.update(breaks).set({ tsEnd: ts }).where(eq(breaks.id, openBreak.id));
  const photoRef = opts.photo && opts.savePhoto ? opts.savePhoto(open.id, 'out', opts.photo) : null;
  await db.update(punches).set({ tsOut: ts, photoOutRef: photoRef ?? open.photoOutRef }).where(eq(punches.id, open.id));
  await recordEdit({ salonId: salon.id, entity: 'punch', entityId: open.id, action: 'update', field: 'ts_out', newValue: ts, actor: opts.actor });
  const closedBreaks = open.breaks.map((b) => (b.tsEnd ? b : { ...b, tsEnd: ts }));
  return { ok: true, action, ts, punchId: open.id, minutesToday: punchMinutes({ ...open, tsOut: ts }, closedBreaks, ts) };
}

/** Punches (with breaks) for a salon in a local-date range. */
export async function punchesInRange(salonId: string, from: string, to: string) {
  const rows = await db
    .select()
    .from(punches)
    .where(and(eq(punches.salonId, salonId), gte(punches.workDate, from), lte(punches.workDate, to), isNull(punches.voidedAt)))
    .orderBy(punches.tsIn);
  const brs = rows.length ? await db.select().from(breaks).where(inArray(breaks.punchId, rows.map((p) => p.id))) : [];
  return rows.map((p) => ({ ...p, breaks: brs.filter((b) => b.punchId === p.id) }));
}

export async function activeWorkers(salonId: string) {
  return db.select().from(workers).where(and(eq(workers.salonId, salonId), eq(workers.active, true))).orderBy(workers.sortOrder, workers.displayName);
}

/** Void a clock-in made in the last two minutes by the same worker (the kiosk "Undo" button). */
export async function undoPunch(salon: Salon, workerId: string, punchId: string, actor: Actor): Promise<boolean> {
  const p = await db.select().from(punches).where(and(eq(punches.id, punchId), eq(punches.workerId, workerId), eq(punches.salonId, salon.id))).get();
  if (!p || p.voidedAt) return false;
  if (p.tsOut) {
    // undo a clock-out made in the last two minutes: the shift is open again
    if (minutesBetween(p.tsOut, nowIso()) > 2) return false;
    await db.update(punches).set({ tsOut: null, photoOutRef: null }).where(eq(punches.id, p.id));
    await recordEdit({ salonId: salon.id, entity: 'punch', entityId: p.id, action: 'update', field: 'ts_out', oldValue: p.tsOut, newValue: null, reason: 'undo on tablet', actor });
    return true;
  }
  if (minutesBetween(p.tsIn, nowIso()) > 2) return false;
  await db.update(punches).set({ voidedAt: nowIso() }).where(eq(punches.id, p.id));
  await recordEdit({ salonId: salon.id, entity: 'punch', entityId: p.id, action: 'void', oldValue: { tsIn: p.tsIn }, reason: 'undo on tablet', actor });
  return true;
}

/**
 * A technician who forgot to clock out confirms at the tablet when they left (UX-13). Only for a stale open shift;
 * the time is on the shift's own date and must be after it started. The edit trail records who confirmed it.
 */
export async function closeStalePunch(salon: Salon, workerId: string, punchId: string, time: string, actor: Actor): Promise<boolean> {
  const p = await db.select().from(punches).where(and(eq(punches.id, punchId), eq(punches.workerId, workerId), eq(punches.salonId, salon.id))).get();
  if (!p || p.tsOut || p.voidedAt) return false;
  if (minutesBetween(p.tsIn, nowIso()) <= STALE_HOURS * 60) return false;
  const out = localToIso(p.workDate, time, salon.timezone);
  if (new Date(out).getTime() <= new Date(p.tsIn).getTime() || new Date(out).getTime() > Date.now()) return false;
  const open = await db.select().from(breaks).where(and(eq(breaks.punchId, p.id), isNull(breaks.tsEnd)));
  for (const b of open) await db.update(breaks).set({ tsEnd: new Date(b.tsStart) < new Date(out) ? out : b.tsStart }).where(eq(breaks.id, b.id));
  await db.update(punches).set({ tsOut: out }).where(eq(punches.id, p.id));
  await recordEdit({ salonId: salon.id, entity: 'punch', entityId: p.id, action: 'update', field: 'ts_out', oldValue: null, newValue: out, reason: `Confirmed by the technician at the tablet: left at ${time}`, actor });
  return true;
}
