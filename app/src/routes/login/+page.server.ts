import { fail, redirect } from '@sveltejs/kit';
import { eq, count } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { createSession, verifyPassword } from '$lib/server/auth';
import { env } from '$env/dynamic/private';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) throw redirect(303, '/app/today');
  const n = (await db.select({ c: count() }).from(users).get())?.c ?? 0;
  return { locale: locals.locale, canSignup: env.ALLOW_SIGNUP === '1' || n === 0, hasDevice: !!locals.device };
};

const attempts = new Map<string, { n: number; until: number }>();

export const actions: Actions = {
  default: async ({ request, cookies, url, getClientAddress }) => {
    const form = await request.formData();
    const email = String(form.get('email') ?? '').trim().toLowerCase();
    const password = String(form.get('password') ?? '');
    const key = `${getClientAddress()}:${email}`;
    const a = attempts.get(key);
    if (a && a.until > Date.now()) return fail(429, { error: 'Too many attempts. Wait a minute.', email });
    const user = await db.select().from(users).where(eq(users.email, email)).get();
    const ok = user ? await verifyPassword(user.passwordHash, password) : false;
    if (!user || !ok) {
      const n = (a?.n ?? 0) + 1;
      attempts.set(key, { n, until: n >= 5 ? Date.now() + 60000 : 0 });
      return fail(400, { error: 'Wrong email or password.', email });
    }
    attempts.delete(key);
    await createSession(user.id, cookies);
    const next = url.searchParams.get('next');
    throw redirect(303, next && next.startsWith('/') ? next : '/app/today');
  }
};
