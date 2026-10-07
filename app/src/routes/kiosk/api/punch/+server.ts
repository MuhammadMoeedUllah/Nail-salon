import { json } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { findWorkerByPin } from '$lib/server/auth';
import { applyPunch, statusesFor } from '$lib/server/punches';
import { savePhoto } from '$lib/server/photos';

const Body = z.object({
  workerId: z.string().min(1),
  pin: z.string().regex(/^\d{4,6}$/),
  action: z.enum(['in', 'out', 'break_start', 'break_end', 'verify', 'undo']),
  punchId: z.string().optional(),
  clientTs: z.string().optional(),
  offline: z.boolean().optional(),
  clientId: z.string().max(64).optional(),
  photo: z.string().max(600_000).nullable().optional()
});

export const POST: RequestHandler = async ({ request, locals }) => {
  const salon = locals.salon;
  if (!salon) return json({ ok: false, error: 'not_paired' }, { status: 401 });
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ ok: false, error: 'bad_request' }, { status: 400 });
  const b = parsed.data;

  const pin = await findWorkerByPin(salon.id, b.pin, b.workerId);
  if (!pin.ok) return json({ ok: false, error: pin.reason }, { status: 403 });
  const worker = pin.worker;

  if (b.action === 'verify') {
    const st = await statusesFor(salon, [worker.id]);
    return json({ ok: true, worker: { id: worker.id, name: worker.displayName, locale: worker.locale }, status: st[worker.id] });
  }

  if (b.action === 'undo') {
    const { undoPunch } = await import('$lib/server/punches');
    const ok = await undoPunch(salon, worker.id, b.punchId ?? '', locals.device ? { type: 'device', id: locals.device.id, name: `${locals.device.name} · ${worker.displayName}` } : { type: 'user', id: locals.user?.id, name: locals.user?.name });
    const st = await statusesFor(salon, [worker.id]);
    return json({ ok, status: st[worker.id] }, { status: ok ? 200 : 409 });
  }

  const actor = locals.device
    ? { type: 'device' as const, id: locals.device.id, name: `${locals.device.name} · ${worker.displayName}` }
    : { type: 'user' as const, id: locals.user?.id, name: locals.user?.name };

  const r = await applyPunch({
    salon,
    workerId: worker.id,
    action: b.action,
    ts: b.offline ? b.clientTs : undefined,
    clientId: b.clientId,
    photo: salon.photoOnPunch ? (b.photo ?? null) : null,
    deviceId: locals.device?.id ?? null,
    actor,
    savePhoto: (id, kind, url) => savePhoto(salon.id, id, kind, url)
  });
  const st = await statusesFor(salon, [worker.id]);
  return json({ ...r, status: st[worker.id] }, { status: r.ok ? 200 : 409 });
};
