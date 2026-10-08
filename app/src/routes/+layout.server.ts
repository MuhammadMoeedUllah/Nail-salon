import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => ({
  locale: locals.locale,
  user: locals.user ? { id: locals.user.id, name: locals.user.name, role: locals.user.role } : null,
  salon: locals.salon ? { id: locals.salon.id, name: locals.salon.name, state: locals.salon.state, timezone: locals.salon.timezone } : null,
  device: locals.device ? { id: locals.device.id, name: locals.device.name } : null
});
