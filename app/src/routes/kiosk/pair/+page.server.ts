import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { verifyPassword, pairDevice, destroySession } from '$lib/server/auth';
import { recordEdit } from '$lib/server/audit';

export const load: PageServerLoad = async ({ locals }) => ({
  locale: locals.locale,
  signedIn: !!locals.user,
  salonName: locals.salon?.name ?? null,
  alreadyPaired: !!locals.device
});

export const actions: Actions = {
  default: async ({ request, cookies, locals }) => {
    const form = await request.formData();
    const name = String(form.get('deviceName') ?? '').trim() || 'Tablet';
    let user = locals.user;
    if (!user) {
      const email = String(form.get('email') ?? '').trim().toLowerCase();
      const password = String(form.get('password') ?? '');
      const u = await db.select().from(users).where(eq(users.email, email)).get();
      if (!u || !(await verifyPassword(u.passwordHash, password))) return fail(400, { error: 'lg_wrong' });
      if (u.role === 'bookkeeper') return fail(403, { error: 'pr_role' });
      user = u;
    }
    const device = await pairDevice(user.salonId, name, user.id, cookies);
    await recordEdit({ salonId: user.salonId, entity: 'device', entityId: device.id, action: 'create', newValue: name, actor: { type: 'user', id: user.id, name: user.name } });
    // The tablet must not keep an owner session: it holds only the device cookie.
    await destroySession(cookies);
    throw redirect(303, '/kiosk');
  }
};
