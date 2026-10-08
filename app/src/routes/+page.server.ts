import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) throw redirect(303, '/app/today');
  if (locals.device) throw redirect(303, '/kiosk');
  throw redirect(303, '/login');
};
