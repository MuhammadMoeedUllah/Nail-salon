import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { payLines, payRuns, salons } from '$lib/server/db/schema';
import { verifyShare } from '$lib/server/auth';
import { hydrateLine } from '$lib/server/payrun';
import { statementPdf } from '$lib/server/pdf';
import { localDate, nowIso } from '$lib/time';
import { statementLangs } from '$lib/statementLang';

export const GET: RequestHandler = async ({ params, url }) => {
  const id = verifyShare(params.token);
  if (!id) throw error(404);
  const line = await db.select().from(payLines).where(eq(payLines.id, id)).get();
  if (!line) throw error(404);
  const run = (await db.select().from(payRuns).where(eq(payRuns.id, line.payRunId)).get())!;
  const salon = (await db.select().from(salons).where(eq(salons.id, run.salonId)).get())!;
  const h = hydrateLine(line);
  const { locale, second } = statementLangs(url.searchParams.get('lang'), h.worker.locale as 'en' | 'vi');
  const pdf = await statementPdf(h, {
    locale,
    second,
    salon: { name: salon.name, address: salon.address, licenseNo: salon.licenseNo },
    tz: salon.timezone,
    period: { start: run.periodStart, end: run.periodEnd },
    status: run.status,
    version: h.version,
    paid: h.paid,
    generatedOn: localDate(nowIso(), salon.timezone)
  });
  const name = `statement-${h.worker.displayName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${run.periodStart}.pdf`;
  return new Response(new Uint8Array(pdf), { headers: { 'content-type': 'application/pdf', 'content-disposition': `inline; filename="${name}"`, 'cache-control': 'private, no-store' } });
};
