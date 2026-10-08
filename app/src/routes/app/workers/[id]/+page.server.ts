import { error, fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { requireOwner } from '$lib/server/guard';
import { db } from '$lib/server/db';
import { workers } from '$lib/server/db/schema';
import { hashPin } from '$lib/server/auth';
import { recordDiff, recordEdit } from '$lib/server/audit';
import { WorkerSchema, toWorkerValues } from '$lib/server/workerForm';

export const load: PageServerLoad = async (event) => {
  const { locale, salon } = requireOwner(event);
  const w = await db.select().from(workers).where(and(eq(workers.id, event.params.id), eq(workers.salonId, salon.id))).get();
  if (!w) throw error(404);
  const { pinHash, ...worker } = w;
  return { locale, worker };
};

export const actions: Actions = {
  default: async (event) => {
    const { user, salon } = requireOwner(event);
    const w = await db.select().from(workers).where(and(eq(workers.id, event.params.id), eq(workers.salonId, salon.id))).get();
    if (!w) throw error(404);
    const raw = Object.fromEntries(await event.request.formData()) as Record<string, string>;
    const parsed = WorkerSchema.safeParse(raw);
    if (!parsed.success) return fail(400, { error: 'Please check the form.', values: raw });
    const v = toWorkerValues(parsed.data);
    const actor = { type: 'user' as const, id: user.id, name: user.name };
    await db.update(workers).set(v).where(eq(workers.id, w.id));
    await recordDiff({ salonId: salon.id, entity: 'worker', entityId: w.id, actor, reason: raw.reason || null }, w as any, v as any);
    if (parsed.data.pin) {
      await db.update(workers).set({ pinHash: await hashPin(salon.id, parsed.data.pin), pinFailedCount: 0, pinLockedUntil: null }).where(eq(workers.id, w.id));
      await recordEdit({ salonId: salon.id, entity: 'worker', entityId: w.id, action: 'update', field: 'pin', newValue: '(changed)', actor });
    }
    throw redirect(303, '/app/workers');
  }
};
