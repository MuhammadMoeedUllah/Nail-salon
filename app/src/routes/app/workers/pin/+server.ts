import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireOwner } from '$lib/server/guard';
import { generatePin } from '$lib/server/pins';

/** A fresh PIN for the form: random, not weak, not used by another active technician (UX-45). Nothing is saved here. */
export const GET: RequestHandler = async (event) => {
  const { salon } = requireOwner(event);
  const pin = await generatePin(salon.id, event.url.searchParams.get('except') ?? undefined);
  return json({ pin }, { headers: { 'cache-control': 'no-store' } });
};
