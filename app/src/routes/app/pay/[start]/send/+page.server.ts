import { error, fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { requireUser } from '$lib/server/guard';
import { db } from '$lib/server/db';
import { payLines } from '$lib/server/db/schema';
import { getRun, hydrateLine } from '$lib/server/payrun';
import { signShare } from '$lib/server/auth';
import { recordEdit } from '$lib/server/audit';
import { nowIso, weekEnd } from '$lib/time';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export const load: PageServerLoad = async (event) => {
  const { salon, locale } = requireUser(event);
  const { start } = event.params;
  if (!DATE.test(start)) throw error(404);
  const run = await getRun(salon.id, start);
  if (!run || run.status === 'draft') throw redirect(303, `/app/pay/${start}`);
  return {
    locale,
    start,
    end: weekEnd(start),
    status: run.status,
    tz: salon.timezone,
    salonName: salon.name,
    lines: run.lines.map((l) => {
      const h = hydrateLine(l);
      return { lineId: l.id, workerId: l.workerId, name: h.worker.displayName, workerLocale: h.worker.locale as 'en' | 'vi', totalCents: h.result.totalCents, token: signShare(l.id), sentAt: l.statementSentAt, sentVia: l.statementSentVia };
    })
  };
};

export const actions: Actions = {
  /** Record that a statement went out, and how (share sheet, text message or copied link). */
  markSent: async (event) => {
    const { salon, user } = requireUser(event);
    const f = await event.request.formData();
    const lineId = String(f.get('lineId') ?? '');
    const via = String(f.get('via') ?? '');
    if (!['share', 'sms', 'copy'].includes(via)) return fail(400, { error: 'invalid' });
    const run = await getRun(salon.id, event.params.start);
    const line = run?.lines.find((l) => l.id === lineId);
    if (!run || !line) return fail(404, { error: 'not_found' });
    await db.update(payLines).set({ statementSentAt: nowIso(), statementSentVia: via }).where(and(eq(payLines.id, lineId), eq(payLines.payRunId, run.id)));
    await recordEdit({ salonId: salon.id, entity: 'pay_line', entityId: lineId, action: 'update', field: 'statement_sent', newValue: via, actor: { type: 'user', id: user.id, name: user.name } });
    return { ok: true, lineId };
  }
};
