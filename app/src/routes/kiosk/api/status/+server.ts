import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { activeWorkers, statusesFor } from '$lib/server/punches';

export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.salon) return json({ error: 'not_paired' }, { status: 401 });
  const ws = await activeWorkers(locals.salon.id);
  const st = await statusesFor(locals.salon, ws.map((w) => w.id));
  return json({
    now: new Date().toISOString(),
    workers: ws.map((w) => ({ id: w.id, name: w.displayName, locale: w.locale, status: st[w.id] }))
  });
};
