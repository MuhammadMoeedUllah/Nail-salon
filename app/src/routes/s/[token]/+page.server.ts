import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { payLines, payRuns, salons } from '$lib/server/db/schema';
import { verifyShare } from '$lib/server/auth';
import { hydrateLine } from '$lib/server/payrun';
import { localDate, nowIso } from '$lib/time';

export const load: PageServerLoad = async ({ params, url }) => {
  const id = verifyShare(params.token);
  if (!id) throw error(404);
  const line = await db.select().from(payLines).where(eq(payLines.id, id)).get();
  if (!line) throw error(404);
  const run = (await db.select().from(payRuns).where(eq(payRuns.id, line.payRunId)).get())!;
  const salon = (await db.select().from(salons).where(eq(salons.id, run.salonId)).get())!;
  const h = hydrateLine(line);
  const q = url.searchParams.get('lang');
  return {
    locale: q === 'vi' || q === 'en' ? q : (h.worker.locale as 'en' | 'vi'),
    salon: { name: salon.name, address: salon.address, licenseNo: salon.licenseNo, state: salon.state },
    tz: salon.timezone,
    line: h,
    period: { start: run.periodStart, end: run.periodEnd },
    status: run.status,
    generatedOn: localDate(nowIso(), salon.timezone),
    token: params.token
  };
};
