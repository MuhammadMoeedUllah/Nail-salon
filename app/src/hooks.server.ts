import type { Handle } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { salons, devices } from '$lib/server/db/schema';
import { userFromCookies, deviceFromCookies, LOCALE_COOKIE } from '$lib/server/auth';
import type { Locale } from '$lib/i18n';

export const handle: Handle = async ({ event, resolve }) => {
  const user = await userFromCookies(event.cookies);
  const device = user ? null : await deviceFromCookies(event.cookies);
  const salonId = user?.salonId ?? device?.salonId ?? null;
  const salon = salonId ? ((await db.select().from(salons).where(eq(salons.id, salonId)).get()) ?? null) : null;

  if (device && (!device.lastSeenAt || Date.now() - new Date(device.lastSeenAt).getTime() > 10 * 60000)) {
    await db.update(devices).set({ lastSeenAt: new Date().toISOString() }).where(eq(devices.id, device.id));
  }

  const cookieLocale = event.cookies.get(LOCALE_COOKIE);
  const locale: Locale =
    cookieLocale === 'vi' || cookieLocale === 'en'
      ? cookieLocale
      : ((user?.locale as Locale) ?? (salon?.defaultLocale as Locale) ?? 'en');

  event.locals.user = user;
  event.locals.salon = salon;
  event.locals.device = device;
  event.locals.locale = locale;

  return resolve(event, {
    transformPageChunk: ({ html }) => html.replace('%lang%', locale)
  });
};
