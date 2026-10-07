import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { LOCALE_COOKIE } from '$lib/server/auth';

export const GET: RequestHandler = async ({ url, cookies }) => {
  const l = url.searchParams.get('l') === 'vi' ? 'vi' : 'en';
  cookies.set(LOCALE_COOKIE, l, { path: '/', sameSite: 'lax', maxAge: 365 * 86400 });
  const next = url.searchParams.get('next') ?? '/';
  throw redirect(303, next.startsWith('/') ? next : '/');
};
