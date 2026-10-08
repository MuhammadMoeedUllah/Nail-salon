import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireOwner } from '$lib/server/guard';
import { db } from '$lib/server/db';
import { workers } from '$lib/server/db/schema';
import { hashPin, newId } from '$lib/server/auth';
import { recordEdit } from '$lib/server/audit';
import { pinTaken } from '$lib/server/pins';
import { WorkerSchema, toWorkerValues, fieldErrors } from '$lib/server/workerForm';

export const load: PageServerLoad = async (event) => {
  const { locale, salon } = requireOwner(event);
  return { locale, worker: null, salonName: salon.name };
};

export const actions: Actions = {
  default: async (event) => {
    const { user, salon } = requireOwner(event);
    const raw = Object.fromEntries(await event.request.formData()) as Record<string, string>;
    const parsed = WorkerSchema.safeParse(raw);
    if (!parsed.success) return fail(400, { errors: fieldErrors(parsed.error.issues), values: raw });
    if (!parsed.data.pin) return fail(400, { errors: { pin: 'wk_pin_required' }, values: raw });
    if (await pinTaken(salon.id, parsed.data.pin)) return fail(400, { errors: { pin: 'wk_pin_taken' }, values: raw });
    const v = toWorkerValues(parsed.data);
    const id = newId();
    await db.insert(workers).values({ id, salonId: salon.id, ...v, pinHash: await hashPin(salon.id, parsed.data.pin), active: true });
    await recordEdit({ salonId: salon.id, entity: 'worker', entityId: id, action: 'create', newValue: { ...v }, actor: { type: 'user', id: user.id, name: user.name } });
    throw redirect(303, '/app/workers');
  }
};
