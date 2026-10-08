import { fail, redirect } from '@sveltejs/kit';
import { count } from 'drizzle-orm';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users, salons, services } from '$lib/server/db/schema';
import { createSession, hashPassword, newId } from '$lib/server/auth';
import { env } from '$env/dynamic/private';
import { STATES, defaultTimezone, regionsFor } from '$lib/rules';
import { DEFAULT_SERVICES } from '$lib/services';
import { recordEdit } from '$lib/server/audit';

async function allowed() {
  const n = (await db.select({ c: count() }).from(users).get())?.c ?? 0;
  return env.ALLOW_SIGNUP === '1' || n === 0;
}

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) throw redirect(303, '/app/today');
  if (!(await allowed())) throw redirect(303, '/login');
  return { locale: locals.locale, states: STATES };
};

const Schema = z.object({
  salonName: z.string().trim().min(2).max(80),
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(200),
  state: z.string().length(2),
  region: z.string().optional(),
  locale: z.enum(['en', 'vi']).default('en')
});

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    if (!(await allowed())) return fail(403, { error: 'Sign-up is closed.', values: {} as Record<string, string> });
    const raw = Object.fromEntries(await request.formData()) as Record<string, string>;
    const parsed = Schema.safeParse(raw);
    if (!parsed.success) return fail(400, { error: 'Please check the form.', values: raw });
    const v = parsed.data;
    const regions = regionsFor(v.state);
    const region = regions.length && v.region && regions.some((r) => r.code === v.region) ? v.region : null;
    const salonId = newId();
    const userId = newId();
    try {
      await db.insert(salons).values({
        id: salonId,
        name: v.salonName,
        state: v.state,
        region,
        timezone: defaultTimezone(v.state),
        defaultLocale: v.locale
      });
      await db.insert(users).values({ id: userId, salonId, email: v.email, name: v.name, role: 'owner', passwordHash: await hashPassword(v.password), locale: v.locale });
      await db.insert(services).values(DEFAULT_SERVICES.map((s, i) => ({ id: newId(), salonId, nameEn: s.en, nameVi: s.vi, defaultPriceCents: s.price, sortOrder: i })));
      await recordEdit({ salonId, entity: 'salon', entityId: salonId, action: 'create', actor: { type: 'user', id: userId, name: v.name } });
    } catch (e: any) {
      if (String(e?.message).includes('UNIQUE')) return fail(400, { error: 'That email already has an account.', values: raw });
      throw e;
    }
    await createSession(userId, cookies);
    throw redirect(303, '/app/workers?welcome=1');
  }
};
