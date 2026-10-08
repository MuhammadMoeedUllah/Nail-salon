import { error, fail } from '@sveltejs/kit';
import { and, eq, isNull } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { requireUser, requireOwner } from '$lib/server/guard';
import { db } from '$lib/server/db';
import { devices, salons } from '$lib/server/db/schema';
import { recordEdit } from '$lib/server/audit';
import { nowIso } from '$lib/time';

const SWITCHES = ['photoOnPunch', 'kioskAutoClockIn', 'kioskShowTickets', 'kioskSounds', 'kioskDimAfterClose'] as const;
type SwitchKey = (typeof SWITCHES)[number];

export const load: PageServerLoad = async (event) => {
  const { salon, locale, user } = requireUser(event);
  const devs = await db.select().from(devices).where(and(eq(devices.salonId, salon.id), isNull(devices.revokedAt))).orderBy(devices.createdAt);
  return {
    locale,
    tz: salon.timezone,
    isOwner: user.role === 'owner',
    canUnpair: user.role !== 'bookkeeper',
    origin: event.url.origin,
    devices: devs.map((d) => ({ id: d.id, name: d.name, createdAt: d.createdAt, lastSeenAt: d.lastSeenAt })),
    kiosk: Object.fromEntries(SWITCHES.map((k) => [k, !!salon[k]])) as Record<SwitchKey, boolean>,
    closingTime: salon.closingTime
  };
};

export const actions: Actions = {
  unpair: async (event) => {
    const { salon, user } = requireUser(event);
    if (user.role === 'bookkeeper') throw error(403, 'Owner or manager only');
    const f = await event.request.formData();
    const id = String(f.get('id') ?? '');
    const d = await db.select().from(devices).where(and(eq(devices.id, id), eq(devices.salonId, salon.id))).get();
    if (!d) return fail(404, { error: 'not_found' });
    await db.update(devices).set({ revokedAt: nowIso() }).where(eq(devices.id, id));
    await recordEdit({ salonId: salon.id, entity: 'device', entityId: id, action: 'revoke', oldValue: d.name, actor: { type: 'user', id: user.id, name: user.name } });
    return { ok: true, name: d.name };
  },
  // each tablet switch saves on its own; the toast offers Undo
  kiosk: async (event) => {
    const { salon, user } = requireOwner(event);
    const f = await event.request.formData();
    const key = String(f.get('key') ?? '') as SwitchKey;
    if (!SWITCHES.includes(key)) return fail(400, { error: 'invalid' });
    const value = f.get('value') === '1';
    if (!!salon[key] !== value) {
      await db.update(salons).set({ [key]: value }).where(eq(salons.id, salon.id));
      await recordEdit({ salonId: salon.id, entity: 'salon', entityId: salon.id, action: 'update', field: key, oldValue: !!salon[key], newValue: value, actor: { type: 'user', id: user.id, name: user.name } });
    }
    return { ok: true };
  }
};
