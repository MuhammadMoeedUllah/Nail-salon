import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readPhoto } from '$lib/server/photos';

export const GET: RequestHandler = async ({ params, locals }) => {
  if (!locals.user || !locals.salon) throw error(401);
  const ref = params.ref;
  if (!ref.startsWith(locals.salon.id + '/')) throw error(403);
  const p = readPhoto(ref);
  if (!p) throw error(404);
  return new Response(new Uint8Array(p.buf), { headers: { 'content-type': p.type, 'cache-control': 'private, max-age=86400' } });
};
