import { fail } from '@sveltejs/kit';
import { and, desc, eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { requireOwner, requireUser } from '$lib/server/guard';
import { db } from '$lib/server/db';
import { workers } from '$lib/server/db/schema';
import { recordEdit } from '$lib/server/audit';

export const load: PageServerLoad = async (event) => {
  const { salon, locale, user } = requireUser(event);
  const rows = await db.select().from(workers).where(eq(workers.salonId, salon.id)).orderBy(desc(workers.active), workers.sortOrder, workers.displayName);
  const now = Date.now();
  return {
    locale,
    isOwner: user.role === 'owner',
    workers: rows.map(({ pinHash, pinFailedCount, pinLockedUntil, ...w }) => ({ ...w, locked: !!pinLockedUntil && new Date(pinLockedUntil).getTime() > now })),
    welcome: event.url.searchParams.has('welcome'),
    state: salon.state
  };
};

async function own(salonId: string, id: string) {
  return db.select().from(workers).where(and(eq(workers.id, id), eq(workers.salonId, salonId))).get();
}

export const actions: Actions = {
  // the Active switch saves at once; the toast offers Undo (UX-43)
  setActive: async (event) => {
    const { salon, user } = requireOwner(event);
    const f = await event.request.formData();
    const w = await own(salon.id, String(f.get('id') ?? ''));
    if (!w) return fail(404, { error: 'not_found' });
    const active = f.get('active') === '1';
    if (w.active !== active) {
      await db.update(workers).set({ active }).where(eq(workers.id, w.id));
      await recordEdit({ salonId: salon.id, entity: 'worker', entityId: w.id, action: 'update', field: 'active', oldValue: w.active, newValue: active, actor: { type: 'user', id: user.id, name: user.name } });
    }
    return { ok: true, name: w.displayName, active };
  },
  unlockPin: async (event) => {
    const { salon, user } = requireOwner(event);
    const f = await event.request.formData();
    const w = await own(salon.id, String(f.get('id') ?? ''));
    if (!w) return fail(404, { error: 'not_found' });
    await db.update(workers).set({ pinFailedCount: 0, pinLockedUntil: null }).where(eq(workers.id, w.id));
    await recordEdit({ salonId: salon.id, entity: 'worker', entityId: w.id, action: 'update', field: 'pin_lock', oldValue: 'locked', newValue: 'unlocked', actor: { type: 'user', id: user.id, name: user.name } });
    return { ok: true, name: w.displayName };
  }
};
