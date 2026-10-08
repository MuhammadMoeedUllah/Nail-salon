import { deserialize } from '$app/forms';
import { invalidateAll } from '$app/navigation';
import type { ActionResult } from '@sveltejs/kit';

/** Call a form action of the current page from code (Undo buttons, menus), then refresh the page data. */
export async function postAction(action: string, fields: Record<string, string>): Promise<ActionResult> {
  const body = new FormData();
  for (const [k, v] of Object.entries(fields)) body.set(k, v);
  const res = await fetch(action, { method: 'POST', body, headers: { 'x-sveltekit-action': 'true', accept: 'application/json' } });
  const result = deserialize(await res.text());
  await invalidateAll();
  return result;
}
