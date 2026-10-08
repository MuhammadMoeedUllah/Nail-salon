import { fail } from '@sveltejs/kit';
import { and, eq, gte, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { requireOwner, requireUser } from '$lib/server/guard';
import { db } from '$lib/server/db';
import { services, tickets } from '$lib/server/db/schema';
import { newId } from '$lib/server/auth';
import { recordEdit } from '$lib/server/audit';
import { parseDollars } from '$lib/money';
import { addDays, localDate, nowIso } from '$lib/time';

const key = (s: string | null | undefined) => (s ?? '').trim().toLowerCase();

async function list(salonId: string) {
  return db.select().from(services).where(eq(services.salonId, salonId)).orderBy(services.sortOrder, services.nameEn);
}

/** Tickets per service name in the last 30 days; tickets keep the name in whichever language it was entered. */
async function usage(salonId: string, tz: string) {
  const since = addDays(localDate(nowIso(), tz), -30);
  const rows = await db
    .select({ name: tickets.serviceName, n: sql<number>`count(*)` })
    .from(tickets)
    .where(and(eq(tickets.salonId, salonId), gte(tickets.workDate, since), isNull(tickets.voidedAt)))
    .groupBy(tickets.serviceName);
  const m = new Map<string, number>();
  for (const r of rows) m.set(key(r.name), (m.get(key(r.name)) ?? 0) + Number(r.n));
  return (s: { nameEn: string; nameVi: string | null }) => (m.get(key(s.nameEn)) ?? 0) + (s.nameVi && key(s.nameVi) !== key(s.nameEn) ? (m.get(key(s.nameVi)) ?? 0) : 0);
}

async function writeOrder(salonId: string, ids: string[]) {
  const mine = new Set((await list(salonId)).map((s) => s.id));
  db.transaction((tx) => {
    ids.filter((id) => mine.has(id)).forEach((id, i) => tx.update(services).set({ sortOrder: i }).where(eq(services.id, id)).run());
  });
}

export const load: PageServerLoad = async (event) => {
  const { salon, locale, user } = requireUser(event);
  const rows = await list(salon.id);
  const used = await usage(salon.id, salon.timezone);
  return { locale, isOwner: user.role === 'owner', services: rows.map((s) => ({ ...s, used: used(s) })) };
};

const ServiceSchema = z.object({
  id: z.string().optional().default(''),
  nameEn: z.string().trim().min(1).max(60),
  nameVi: z.string().trim().max(60).optional().default(''),
  price: z.string().optional().default('')
});

export const actions: Actions = {
  save: async (event) => {
    const { salon, user } = requireOwner(event);
    const raw = Object.fromEntries(await event.request.formData()) as Record<string, string>;
    const p = ServiceSchema.safeParse(raw);
    if (!p.success) return fail(400, { errors: { nameEn: 'sv_name_required' }, values: raw });
    const v = { nameEn: p.data.nameEn, nameVi: p.data.nameVi || null, defaultPriceCents: parseDollars(p.data.price) ?? 0 };
    const actor = { type: 'user' as const, id: user.id, name: user.name };
    if (p.data.id) {
      const s = (await list(salon.id)).find((x) => x.id === p.data.id);
      if (!s) return fail(404, { errors: { form: 'something_wrong' }, values: raw });
      await db.update(services).set(v).where(eq(services.id, s.id));
      await recordEdit({ salonId: salon.id, entity: 'salon', entityId: salon.id, action: 'update', field: 'service', oldValue: { name: s.nameEn, nameVi: s.nameVi, price: s.defaultPriceCents }, newValue: { name: v.nameEn, nameVi: v.nameVi, price: v.defaultPriceCents }, actor });
      return { ok: true, name: v.nameEn, added: false };
    }
    const all = await list(salon.id);
    const id = newId();
    await db.insert(services).values({ id, salonId: salon.id, ...v, sortOrder: all.length ? Math.max(...all.map((s) => s.sortOrder)) + 1 : 0 });
    await recordEdit({ salonId: salon.id, entity: 'salon', entityId: salon.id, action: 'create', field: 'service', newValue: { name: v.nameEn, nameVi: v.nameVi, price: v.defaultPriceCents }, actor });
    return { ok: true, name: v.nameEn, added: true };
  },
  setActive: async (event) => {
    const { salon, user } = requireOwner(event);
    const f = await event.request.formData();
    const s = (await list(salon.id)).find((x) => x.id === String(f.get('id') ?? ''));
    if (!s) return fail(404, { error: 'not_found' });
    const active = f.get('active') === '1';
    if (s.active !== active) {
      await db.update(services).set({ active }).where(eq(services.id, s.id));
      await recordEdit({ salonId: salon.id, entity: 'salon', entityId: salon.id, action: 'update', field: 'service_shown', oldValue: { name: s.nameEn, shown: s.active }, newValue: { name: s.nameEn, shown: active }, actor: { type: 'user', id: user.id, name: user.name } });
    }
    return { ok: true };
  },
  move: async (event) => {
    const { salon } = requireOwner(event);
    const f = await event.request.formData();
    const ids = (await list(salon.id)).map((s) => s.id);
    const i = ids.indexOf(String(f.get('id') ?? ''));
    const j = i + (f.get('dir') === 'up' ? -1 : 1);
    if (i < 0 || j < 0 || j >= ids.length) return { ok: true, before: ids };
    const before = [...ids];
    [ids[i], ids[j]] = [ids[j], ids[i]];
    await writeOrder(salon.id, ids);
    return { ok: true, before };
  },
  // drag and drop, and Undo, send the whole order
  reorder: async (event) => {
    const { salon } = requireOwner(event);
    const f = await event.request.formData();
    const before = (await list(salon.id)).map((s) => s.id);
    const ids = String(f.get('ids') ?? '').split(',').filter(Boolean);
    await writeOrder(salon.id, [...ids, ...before.filter((id) => !ids.includes(id))]);
    return { ok: true, before };
  },
  sortByUse: async (event) => {
    const { salon } = requireOwner(event);
    const rows = await list(salon.id);
    const used = await usage(salon.id, salon.timezone);
    const before = rows.map((s) => s.id);
    const ids = rows
      .map((s, i) => ({ id: s.id, n: used(s), i, active: s.active }))
      .sort((a, b) => Number(b.active) - Number(a.active) || b.n - a.n || a.i - b.i)
      .map((x) => x.id);
    await writeOrder(salon.id, ids);
    return { ok: true, before };
  }
};
