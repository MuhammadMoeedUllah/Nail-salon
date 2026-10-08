import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireUser } from '$lib/server/guard';
import { computeSalonWeek, getRun, hydrateLine, approveRun, reopenRun, markPaid, lastPaidMethods, type WeekLine } from '$lib/server/payrun';
import { weekStart, weekEnd, localDate, nowIso } from '$lib/time';
import { parseDollars } from '$lib/money';
import { signShare } from '$lib/server/auth';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export const load: PageServerLoad = async (event) => {
  const { salon, locale } = requireUser(event);
  const start = event.params.start;
  if (!DATE.test(start)) throw error(404);
  const aligned = weekStart(start, salon.workweekStart);
  if (aligned !== start) throw redirect(303, `/app/pay/${aligned}`);
  const run = await getRun(salon.id, start);
  let lines: (WeekLine & { lineId?: string; paid?: { cash: number; check: number; payroll: number; on: string | null }; version?: number; sentAt?: string | null })[];
  let rules;
  if (run && run.status !== 'draft') {
    lines = run.lines.map(hydrateLine);
    rules = JSON.parse(run.rulesSnapshot ?? '[]');
  } else {
    const c = await computeSalonWeek(salon, start);
    lines = c.lines;
    rules = c.rules.entries;
  }
  const today = localDate(nowIso(), salon.timezone);
  return {
    locale,
    start,
    end: weekEnd(start),
    status: run?.status ?? 'draft',
    approvedAt: run?.approvedAt ?? null,
    paidOn: run?.paidOn ?? null,
    isCurrentWeek: weekStart(today, salon.workweekStart) === start,
    today,
    tz: salon.timezone,
    lastMethods: run && run.status === 'approved' ? await lastPaidMethods(salon.id, start) : {},
    rules,
    lines: lines.map((l) => ({
      ...l,
      shareToken: l.lineId ? signShare(l.lineId) : null
    })),
    totals: {
      gross: lines.reduce((s, l) => s + l.result.grossWagesCents, 0),
      owed: lines.reduce((s, l) => s + l.owedCents, 0),
      tipsCard: lines.reduce((s, l) => s + l.result.tipsCardCents, 0),
      tipsCash: lines.reduce((s, l) => s + l.result.tipsCashCents, 0),
      total: lines.reduce((s, l) => s + l.result.totalCents, 0),
      minutes: lines.reduce((s, l) => s + l.result.minutesWorked, 0)
    }
  };
};

export const actions: Actions = {
  approve: async (event) => {
    const { salon, user } = requireUser(event);
    if (user.role === 'bookkeeper') return fail(403, { error: 'owner_only' });
    // hours are unknown while a shift has no clock-out (UX-35)
    const c = await computeSalonWeek(salon, event.params.start);
    if (c.lines.some((l) => l.result.flags.includes('OPEN_PUNCH'))) return fail(400, { error: 'open_punch' });
    await approveRun(salon, event.params.start, { type: 'user', id: user.id, name: user.name }, user.id);
    return { ok: true };
  },
  reopen: async (event) => {
    const { salon, user } = requireUser(event);
    if (user.role === 'bookkeeper') return fail(403, { error: 'owner_only' });
    const f = await event.request.formData();
    const reason = String(f.get('reason') ?? '').trim();
    if (reason.length < 2) return fail(400, { error: 'reason_required' });
    await reopenRun(salon, event.params.start, reason, { type: 'user', id: user.id, name: user.name });
    return { ok: true };
  },
  pay: async (event) => {
    const { salon, user } = requireUser(event);
    if (user.role === 'bookkeeper') return fail(403, { error: 'owner_only' });
    const f = await event.request.formData();
    const paidOn = String(f.get('paidOn') ?? '');
    if (!DATE.test(paidOn)) return fail(400, { error: 'invalid' });
    const payments: { workerId: string; cashCents: number; checkCents: number; payrollCents: number }[] = [];
    for (const [k, v] of f.entries()) {
      const m = /^(cash|check|payroll)_(.+)$/.exec(k);
      if (!m) continue;
      const cents = parseDollars(String(v)) ?? 0;
      let p = payments.find((x) => x.workerId === m[2]);
      if (!p) payments.push((p = { workerId: m[2], cashCents: 0, checkCents: 0, payrollCents: 0 }));
      if (m[1] === 'cash') p.cashCents = cents;
      else if (m[1] === 'check') p.checkCents = cents;
      else p.payrollCents = cents;
    }
    await markPaid(salon, event.params.start, payments, paidOn, { type: 'user', id: user.id, name: user.name });
    return { ok: true };
  }
};
