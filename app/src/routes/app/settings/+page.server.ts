import { fail } from '@sveltejs/kit';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { requireUser, requireOwner } from '$lib/server/guard';
import { db } from '$lib/server/db';
import { salons, devices, users } from '$lib/server/db/schema';
import { hashPassword, newId } from '$lib/server/auth';
import { recordDiff, recordEdit } from '$lib/server/audit';
import { STATES, regionsFor, ruleSetFor, retentionYears } from '$lib/rules';
import { localDate, nowIso } from '$lib/time';

export const load: PageServerLoad = async (event) => {
  const { salon, locale, user } = requireUser(event);
  const devs = await db.select().from(devices).where(and(eq(devices.salonId, salon.id), isNull(devices.revokedAt)));
  const us = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role }).from(users).where(eq(users.salonId, salon.id));
  const today = localDate(nowIso(), salon.timezone);
  const rules = ruleSetFor(salon.state, salon.region, today);
  return {
    locale,
    isOwner: user.role === 'owner',
    salon: { ...salon },
    states: STATES,
    regions: regionsFor(salon.state),
    devices: devs.map((d) => ({ id: d.id, name: d.name, createdAt: d.createdAt, lastSeenAt: d.lastSeenAt })),
    users: us,
    rules: rules.entries,
    retention: retentionYears(salon.state, today),
    timezones: ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Phoenix', 'America/Los_Angeles', 'America/Anchorage', 'Pacific/Honolulu']
  };
};

const SalonSchema = z.object({
  name: z.string().trim().min(2).max(80),
  licenseNo: z.string().trim().max(40).optional().default(''),
  address: z.string().trim().max(200).optional().default(''),
  state: z.string().length(2),
  region: z.string().optional().default(''),
  timezone: z.string().min(3),
  workweekStart: z.coerce.number().int().min(0).max(6),
  payFrequency: z.enum(['weekly', 'biweekly']),
  defaultLocale: z.enum(['en', 'vi']),
  photoOnPunch: z.string().optional(),
  kioskAutoClockIn: z.string().optional()
});

export const actions: Actions = {
  salon: async (event) => {
    const { salon, user } = requireOwner(event);
    const raw = Object.fromEntries(await event.request.formData()) as Record<string, string>;
    const p = SalonSchema.safeParse(raw);
    if (!p.success) return fail(400, { error: 'invalid', form: 'salon' });
    const v = p.data;
    const regions = regionsFor(v.state);
    const after = {
      name: v.name,
      licenseNo: v.licenseNo || null,
      address: v.address || null,
      state: v.state,
      region: regions.length ? (regions.some((r) => r.code === v.region) ? v.region : regions[0].code) : null,
      timezone: v.timezone,
      workweekStart: v.workweekStart,
      payFrequency: v.payFrequency,
      defaultLocale: v.defaultLocale,
      photoOnPunch: v.photoOnPunch === 'on',
      kioskAutoClockIn: v.kioskAutoClockIn === 'on'
    };
    await db.update(salons).set(after).where(eq(salons.id, salon.id));
    await recordDiff({ salonId: salon.id, entity: 'salon', entityId: salon.id, actor: { type: 'user', id: user.id, name: user.name } }, salon as any, after as any);
    return { ok: true, form: 'salon' };
  },
  revokeDevice: async (event) => {
    const { salon, user } = requireOwner(event);
    const f = await event.request.formData();
    const id = String(f.get('id') ?? '');
    const d = await db.select().from(devices).where(and(eq(devices.id, id), eq(devices.salonId, salon.id))).get();
    if (!d) return fail(404, { error: 'not_found', form: 'device' });
    await db.update(devices).set({ revokedAt: nowIso() }).where(eq(devices.id, id));
    await recordEdit({ salonId: salon.id, entity: 'device', entityId: id, action: 'revoke', oldValue: d.name, actor: { type: 'user', id: user.id, name: user.name } });
    return { ok: true, form: 'device' };
  },
  addUser: async (event) => {
    const { salon, user } = requireOwner(event);
    const f = await event.request.formData();
    const name = String(f.get('name') ?? '').trim();
    const email = String(f.get('email') ?? '').trim().toLowerCase();
    const password = String(f.get('password') ?? '');
    const role = String(f.get('role') ?? 'bookkeeper');
    if (!name || !/.+@.+\..+/.test(email) || password.length < 8 || !['owner', 'manager', 'bookkeeper'].includes(role)) return fail(400, { error: 'invalid', form: 'user' });
    try {
      const id = newId();
      await db.insert(users).values({ id, salonId: salon.id, name, email, role, passwordHash: await hashPassword(password), locale: salon.defaultLocale });
      await recordEdit({ salonId: salon.id, entity: 'salon', entityId: salon.id, action: 'create', field: 'user', newValue: { name, email, role }, actor: { type: 'user', id: user.id, name: user.name } });
    } catch (e: any) {
      if (String(e?.message).includes('UNIQUE')) return fail(400, { error: 'email_taken', form: 'user' });
      throw e;
    }
    return { ok: true, form: 'user' };
  },
  removeUser: async (event) => {
    const { salon, user } = requireOwner(event);
    const f = await event.request.formData();
    const id = String(f.get('id') ?? '');
    if (id === user.id) return fail(400, { error: 'self', form: 'user' });
    const u = await db.select().from(users).where(and(eq(users.id, id), eq(users.salonId, salon.id))).get();
    if (!u) return fail(404, { error: 'not_found', form: 'user' });
    const { sessions } = await import('$lib/server/db/schema');
    await db.delete(sessions).where(eq(sessions.userId, id));
    await db.delete(users).where(eq(users.id, id));
    await recordEdit({ salonId: salon.id, entity: 'salon', entityId: salon.id, action: 'revoke', field: 'user', oldValue: { name: u.name, email: u.email }, actor: { type: 'user', id: user.id, name: user.name } });
    return { ok: true, form: 'user' };
  }
};
