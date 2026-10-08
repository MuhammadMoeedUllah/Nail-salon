import type { LayoutServerLoad } from './$types';
import { requireUser } from '$lib/server/guard';

export const load: LayoutServerLoad = async (event) => {
  const { user, salon, locale } = requireUser(event);
  return { locale, user: { id: user.id, name: user.name, role: user.role }, salon: { id: salon.id, name: salon.name, state: salon.state, timezone: salon.timezone } };
};
