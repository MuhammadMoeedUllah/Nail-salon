import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { activeWorkers, statusesFor } from '$lib/server/punches';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.salon) throw redirect(303, '/kiosk/pair');
  const ws = await activeWorkers(locals.salon.id);
  const st = await statusesFor(locals.salon, ws.map((w) => w.id));
  return {
    locale: locals.locale,
    salon: { name: locals.salon.name, timezone: locals.salon.timezone, photoOnPunch: locals.salon.photoOnPunch },
    isOwnerPreview: !!locals.user,
    workers: ws.map((w) => ({ id: w.id, name: w.displayName, locale: w.locale as 'en' | 'vi', status: st[w.id] }))
  };
};
