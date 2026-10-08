import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { requireUser } from '$lib/server/guard';
import { db } from '$lib/server/db';
import { workers } from '$lib/server/db/schema';

export const load: PageServerLoad = async (event) => {
  const { salon, locale } = requireUser(event);
  const ws = await db.select().from(workers).where(eq(workers.salonId, salon.id)).orderBy(workers.sortOrder, workers.displayName);
  return { locale, workers: ws.filter((w) => w.active).map((w) => ({ id: w.id, displayName: w.displayName, legalName: w.legalName })) };
};
