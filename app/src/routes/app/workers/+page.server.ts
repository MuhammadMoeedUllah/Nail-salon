import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { requireUser } from '$lib/server/guard';
import { db } from '$lib/server/db';
import { workers } from '$lib/server/db/schema';

export const load: PageServerLoad = async (event) => {
  const { salon, locale } = requireUser(event);
  const rows = await db.select().from(workers).where(eq(workers.salonId, salon.id)).orderBy(workers.active, workers.sortOrder, workers.displayName);
  return { locale, workers: rows.map(({ pinHash, ...w }) => w), welcome: event.url.searchParams.has('welcome'), state: salon.state };
};
