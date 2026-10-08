import { error } from '@sveltejs/kit';
import { and, asc, eq, gte, lte, inArray } from 'drizzle-orm';
import { zipSync, strToU8 } from 'fflate';
import Papa from 'papaparse';
import type { RequestHandler } from './$types';
import { requireUser } from '$lib/server/guard';
import { db } from '$lib/server/db';
import { edits, workers, payRuns, payLines, tickets, punches, breaks } from '$lib/server/db/schema';
import { hydrateLine, computeSalonWeek, type WeekLine } from '$lib/server/payrun';
import { binderPdf } from '$lib/server/pdf';
import { describeEdits } from '$lib/server/auditHistory';
import { punchMinutes } from '$lib/server/punches';
import { ruleSetFor, retentionYears } from '$lib/rules';
import { addDays, localDate, nowIso, weekStart, localTime } from '$lib/time';
import { dollars } from '$lib/money';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export const GET: RequestHandler = async (event) => {
  const { salon, locale } = requireUser(event);
  const from = event.url.searchParams.get('from') ?? '';
  const to = event.url.searchParams.get('to') ?? '';
  const format = event.url.searchParams.get('format') ?? 'pdf';
  const q = event.url.searchParams.get('lang');
  const L = q === 'vi' || q === 'en' ? q : locale;
  if (!DATE.test(from) || !DATE.test(to) || from > to) throw error(400, 'bad range');
  const tz = salon.timezone;

  const ws = await db.select().from(workers).where(eq(workers.salonId, salon.id)).orderBy(workers.sortOrder, workers.displayName);
  const nameOf = new Map(ws.map((w) => [w.id, w.displayName]));

  // weeks overlapping the range
  const weeks: { periodStart: string; periodEnd: string; status: string; approvedAt: string | null; paidOn: string | null; lines: WeekLine[]; paid?: Record<string, { cash: number; check: number; payroll: number; on: string | null }> }[] = [];
  const first = weekStart(from, salon.workweekStart);
  for (let s = first; s <= to; s = addDays(s, 7)) {
    const run = await db.select().from(payRuns).where(and(eq(payRuns.salonId, salon.id), eq(payRuns.periodStart, s))).get();
    if (run && run.status !== 'draft') {
      const ls = await db.select().from(payLines).where(eq(payLines.payRunId, run.id));
      const hyd = ls.map(hydrateLine);
      weeks.push({ periodStart: s, periodEnd: addDays(s, 6), status: run.status, approvedAt: run.approvedAt, paidOn: run.paidOn, lines: hyd, paid: Object.fromEntries(hyd.map((h) => [h.worker.id, h.paid])) });
    } else {
      const c = await computeSalonWeek(salon, s);
      if (c.totals.minutes || c.totals.salesCents) weeks.push({ periodStart: s, periodEnd: c.periodEnd, status: 'draft', approvedAt: null, paidOn: null, lines: c.lines });
    }
  }

  const ps = await db.select().from(punches).where(and(eq(punches.salonId, salon.id), gte(punches.workDate, from), lte(punches.workDate, to))).orderBy(asc(punches.workDate), asc(punches.tsIn));
  const brs = ps.length ? await db.select().from(breaks).where(inArray(breaks.punchId, ps.map((p) => p.id))) : [];
  const punchRows = ps.map((p) => {
    const b = brs.filter((x) => x.punchId === p.id);
    return {
      workerName: nameOf.get(p.workerId) ?? p.workerId,
      workDate: p.workDate,
      tsIn: p.tsIn,
      tsOut: p.tsOut,
      breakMinutes: b.reduce((s, x) => s + (x.tsEnd ? Math.round((new Date(x.tsEnd).getTime() - new Date(x.tsStart).getTime()) / 60000) : 0), 0) + p.manualBreakMinutes,
      minutes: p.tsOut ? punchMinutes(p, b) : 0,
      source: p.source,
      voided: !!p.voidedAt
    };
  });
  const eds = await db.select().from(edits).where(and(eq(edits.salonId, salon.id), gte(edits.ts, from + 'T00:00:00'), lte(edits.ts, to + 'T23:59:59.999Z'))).orderBy(asc(edits.ts));
  const today = localDate(nowIso(), tz);
  const rules = ruleSetFor(salon.state, salon.region, from).entries;
  const base = `${salon.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-binder-${from}-${to}`;

  if (format === 'pdf') {
    const pdf = await binderPdf({
      locale: L,
      salon: { name: salon.name, address: salon.address, licenseNo: salon.licenseNo, state: salon.state, region: salon.region, workweekStart: salon.workweekStart, timezone: tz },
      from,
      to,
      generatedOn: today,
      retentionYears: retentionYears(salon.state, today),
      workers: ws,
      weeks,
      punches: punchRows,
      edits: (await describeEdits(eds, salon, L)).map((e) => ({ ts: e.ts, text: e.text, entity: e.entity, entityId: e.entityId, reason: e.reason })),
      rules
    });
    return new Response(new Uint8Array(pdf), { headers: { 'content-type': 'application/pdf', 'content-disposition': `attachment; filename="${base}.pdf"` } });
  }

  // CSV zip
  const tks = await db.select().from(tickets).where(and(eq(tickets.salonId, salon.id), gte(tickets.workDate, from), lte(tickets.workDate, to))).orderBy(asc(tickets.ts));
  const files: Record<string, Uint8Array> = {};
  const csv = (rows: object[]) => strToU8('﻿' + Papa.unparse(rows));
  files['workers.csv'] = csv(ws.map((w) => ({ legal_name: w.legalName, name_on_tablet: w.displayName, address: w.address, birth_date: w.birthDate, sex: w.sex, occupation: w.occupation, classification: w.classification, pay_basis: w.payBasis, hourly_rate: dollars(w.hourlyRateCents), day_rate: dollars(w.dayRateCents), commission_pct: w.commissionPct, weekly_guarantee: dollars(w.guaranteeCents), hired_on: w.hiredOn, ended_on: w.endedOn, active: w.active })));
  files['hours_by_day.csv'] = csv(punchRows.map((p) => ({ technician: p.workerName, work_date: p.workDate, clock_in: localTime(p.tsIn, tz), clock_out: p.tsOut ? localTime(p.tsOut, tz) : '', clock_in_utc: p.tsIn, clock_out_utc: p.tsOut ?? '', unpaid_break_minutes: p.breakMinutes, minutes_worked: p.minutes, hours_worked: (p.minutes / 60).toFixed(2), source: p.source, voided: p.voided })));
  files['tickets.csv'] = csv(tks.map((t) => ({ technician: nameOf.get(t.workerId) ?? t.workerId, work_date: t.workDate, time: localTime(t.ts, tz), ticket_no: t.ticketNo, service: t.serviceName, price: dollars(t.priceCents), tip_card: dollars(t.tipCardCents), tip_cash: dollars(t.tipCashCents), payment_method: t.paymentMethod, source: t.source, voided_at: t.voidedAt, void_reason: t.voidReason })));
  files['pay_by_week.csv'] = csv(
    weeks.flatMap((wk) =>
      wk.lines.map((l) => {
        const r = l.result;
        const p = wk.paid?.[l.worker.id];
        return { period_start: wk.periodStart, period_end: wk.periodEnd, status: wk.status, approved_at: wk.approvedAt, technician: l.worker.legalName, pay_basis: r.payBasis, days: r.daysWorked, hours: (r.minutesWorked / 60).toFixed(2), regular_hours: (r.regularMinutes / 60).toFixed(2), overtime_hours: (r.overtimeMinutes / 60).toFixed(2), sales: dollars(r.salesCents), commission: dollars(r.commissionCents), base_pay: dollars(r.baseCents), straight_time: dollars(r.straightTimeCents), regular_rate: (r.regularRate / 100).toFixed(4), min_wage_topup: dollars(r.minWageTopupCents), overtime_premium: dollars(r.overtimePremiumCents), spread_of_hours: dollars(r.spreadOfHoursCents), deductions: dollars(r.deductionsCents), gross_wages: dollars(r.grossWagesCents), tips_card: dollars(r.tipsCardCents), tips_cash: dollars(r.tipsCashCents), total: dollars(r.totalCents), paid_cash: p ? dollars(p.cash) : '', paid_check: p ? dollars(p.check) : '', paid_payroll: p ? dollars(p.payroll) : '', paid_on: p?.on ?? wk.paidOn ?? '', flags: r.flags.join(' ') };
      })
    )
  );
  // Monthly tips per technician (employee tip report; $20/month threshold is the worker's reporting duty)
  const tipMonths = new Map<string, { technician: string; month: string; tips_card: number; tips_cash: number }>();
  for (const t of tks) {
    if (t.voidedAt) continue;
    const k = `${t.workerId}|${t.workDate.slice(0, 7)}`;
    const e = tipMonths.get(k) ?? { technician: nameOf.get(t.workerId) ?? t.workerId, month: t.workDate.slice(0, 7), tips_card: 0, tips_cash: 0 };
    e.tips_card += t.tipCardCents;
    e.tips_cash += t.tipCashCents;
    tipMonths.set(k, e);
  }
  files['tips_by_month.csv'] = csv([...tipMonths.values()].map((e) => ({ ...e, tips_card: dollars(e.tips_card), tips_cash: dollars(e.tips_cash), tips_total: dollars(e.tips_card + e.tips_cash) })));
  files['edit_history.csv'] = csv((await describeEdits(eds, salon, L)).map((e) => ({ when_utc: e.ts, when_local: localTime(e.ts, tz), what_happened: e.text, who: e.actorName ?? e.actorType, actor_type: e.actorType, entity: e.entity, entity_id: e.entityId, action: e.action, field: e.field, before: e.oldValue, after: e.newValue, reason: e.reason })));
  files['rules_in_effect.csv'] = csv(rules.map((r) => ({ jurisdiction: r.jurisdiction, region: r.region, key: r.key, value: r.value, unit: r.unit, effective_from: r.effective_from, effective_to: r.effective_to, source_title: r.source_title, source_url: r.source_url, checked_on: r.checked_on })));
  files['README.txt'] = strToU8(`Audit binder export\nSalon: ${salon.name}\nRange: ${from} to ${to}\nGenerated: ${today}\nFiles: workers, hours_by_day (29 CFR 516.2(a)(7)), tickets (basic records, 516.6), pay_by_week (516.2(a)(6)-(12)), tips_by_month, edit_history, rules_in_effect.\nThis export keeps records and shows arithmetic. It is not legal advice.\n`);
  const zip = zipSync(files, { level: 6 });
  return new Response(new Uint8Array(zip), { headers: { 'content-type': 'application/zip', 'content-disposition': `attachment; filename="${base}.zip"` } });
};
