import { redirect, error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

/** Owner, manager or bookkeeper session required. */
export function requireUser(event: RequestEvent) {
  if (!event.locals.user || !event.locals.salon) throw redirect(303, `/login?next=${encodeURIComponent(event.url.pathname)}`);
  return { user: event.locals.user, salon: event.locals.salon, locale: event.locals.locale };
}

/** Paired tablet (or a signed-in owner previewing the kiosk). */
export function requireDeviceOrUser(event: RequestEvent) {
  if (!event.locals.salon) throw redirect(303, '/kiosk/pair');
  return { salon: event.locals.salon, device: event.locals.device, user: event.locals.user, locale: event.locals.locale };
}

export function requireOwner(event: RequestEvent) {
  const ctx = requireUser(event);
  if (ctx.user.role !== 'owner') throw error(403, 'Owner only');
  return ctx;
}
