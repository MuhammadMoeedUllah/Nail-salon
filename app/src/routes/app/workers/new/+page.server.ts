import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireOwner } from '$lib/server/guard';
import { db } from '$lib/server/db';
import { workers } from '$lib/server/db/schema';
import { hashPin, newId } from '$lib/server/auth';
import { recordEdit } from '$lib/server/audit';
import { WorkerSchema, toWorkerValues } from '$lib/server/workerForm';

export const load: PageServerLoad = async (event) => {
  const { locale } = requireOwner(event);
  return { locale, worker: null };
};

export const actions: Actions = {
  default: async (event) => {
    const { user, salon } = requireOwner(event);
    const raw = Object.fromEntries(await event.request.formData()) as Record<string, string>;
    const parsed = WorkerSchema.safeParse(raw);
    if (!parsed.success || !parsed.data.pin) return fail(400, { error: 'Please check the form (a 4-digit PIN is required).', values: raw });
    const v = toWorkerValues(parsed.data);
    const id = newId();
    await db.insert(workers).values({ id, salonId: salon.id, ...v, pinHash: await hashPin(salon.id, parsed.data.pin), active: true });
    await recordEdit({ salonId: salon.id, entity: 'worker', entityId: id, action: 'create', newValue: { ...v }, actor: { type: 'user', id: user.id, name: user.name } });
    throw redirect(303, '/app/workers');
  }
};
