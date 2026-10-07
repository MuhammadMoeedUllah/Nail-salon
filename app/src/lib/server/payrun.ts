import { and, eq, gte, lte, isNull, inArray } from 'drizzle-orm';
import { db } from './db';
import { workers, tickets, payRuns, payLines, type Salon, type Worker, type Ticket, type PayRun, type PayLine } from './db/schema';
import { punchesInRange, punchMinutes } from './punches';
import { computeWeek, complianceOwedCents, type WeekResult, type DayInput, type PayBasis } from '$lib/pay/engine';
import { ruleSetFor } from '$lib/rules';
import { eachDay, weekEnd, minutesBetween, nowIso } from '$lib/time';
import { newId } from './auth';
import { recordEdit, type Actor } from './audit';

export interface DayDetail extends DayInput {
  firstIn: string | null;
  lastOut: string | null;
  punchCount: number;
}

export interface WeekLine {
  worker: Pick<Worker, 'id' | 'displayName' | 'legalName' | 'locale' | 'payBasis' | 'hourlyRateCents' | 'dayRateCents' | 'commissionPct' | 'guaranteeCents' | 'address' | 'occupation'>;
  result: WeekResult;
  days: DayDetail[];
  tickets: Pick<Ticket, 'id' | 'workDate' | 'ts' | 'ticketNo' | 'serviceName' | 'priceCents' | 'tipCardCents' | 'tipCashCents' | 'paymentMethod' | 'source'>[];
  owedCents: number;
}

export interface WeekComputation {
  periodStart: string;
  periodEnd: string;
  rules: ReturnType<typeof ruleSetFor>;
  lines: WeekLine[];
  totals: { grossWagesCents: number; owedCents: number; tipsCardCents: number; tipsCashCents: number; salesCents: number; minutes: number };
}

/** Compute the whole salon for the workweek starting on `periodStart` from live punches and tickets. */
export async function computeSalonWeek(salon: Salon, periodStart: string): Promise<WeekComputation> {
  const periodEnd = weekEnd(periodStart);
  const rules = ruleSetFor(salon.state, salon.region, periodStart);
  const ws = await db.select().from(workers).where(eq(workers.salonId, salon.id)).orderBy(workers.sortOrder, workers.displayName);
  const ps = await punchesInRange(salon.id, periodStart, periodEnd);
  const ts = await db
    .select()
    .from(tickets)
    .where(and(eq(tickets.salonId, salon.id), gte(tickets.workDate, periodStart), lte(tickets.workDate, periodEnd), isNull(tickets.voidedAt)))
    .orderBy(tickets.ts);
  const days = eachDay(periodStart, periodEnd);
  const now = nowIso();

  const lines: WeekLine[] = [];
  for (const w of ws) {
    const myP = ps.filter((p) => p.workerId === w.id);
    const myT = ts.filter((t) => t.workerId === w.id);
    if (!w.active && myP.length === 0 && myT.length === 0) continue;
    const dayDetails: DayDetail[] = days.map((date) => {
      const dp = myP.filter((p) => p.workDate === date);
      const closed = dp.filter((p) => p.tsOut);
      const minutes = closed.reduce((s, p) => s + punchMinutes(p, p.breaks, now), 0);
      const firstIn = dp.length ? dp.map((p) => p.tsIn).sort()[0] : null;
      const lastOut = closed.length ? closed.map((p) => p.tsOut!).sort().at(-1)! : null;
      return {
        date,
        minutes,
        spreadMinutes: firstIn && lastOut ? minutesBetween(firstIn, lastOut) : minutes,
        open: dp.some((p) => !p.tsOut),
        firstIn,
        lastOut,
        punchCount: dp.length
      };
    });
    const result = computeWeek(
      {
        workerId: w.id,
        payBasis: w.payBasis as PayBasis,
        hourlyRateCents: w.hourlyRateCents,
        dayRateCents: w.dayRateCents,
        commissionPct: w.commissionPct,
        guaranteeCents: w.guaranteeCents,
        days: dayDetails,
        salesCents: myT.reduce((s, t) => s + t.priceCents, 0),
        tipsCardCents: myT.reduce((s, t) => s + t.tipCardCents, 0),
        tipsCashCents: myT.reduce((s, t) => s + t.tipCashCents, 0),
        ticketCount: myT.length
      },
      rules
    );
    lines.push({
      worker: {
        id: w.id,
        displayName: w.displayName,
        legalName: w.legalName,
        locale: w.locale,
        payBasis: w.payBasis,
        hourlyRateCents: w.hourlyRateCents,
        dayRateCents: w.dayRateCents,
        commissionPct: w.commissionPct,
        guaranteeCents: w.guaranteeCents,
        address: w.address,
        occupation: w.occupation
      },
      result,
      days: dayDetails,
      tickets: myT.map((t) => ({ id: t.id, workDate: t.workDate, ts: t.ts, ticketNo: t.ticketNo, serviceName: t.serviceName, priceCents: t.priceCents, tipCardCents: t.tipCardCents, tipCashCents: t.tipCashCents, paymentMethod: t.paymentMethod, source: t.source })),
      owedCents: complianceOwedCents(result)
    });
  }
  const totals = lines.reduce(
    (a, l) => ({
      grossWagesCents: a.grossWagesCents + l.result.grossWagesCents,
      owedCents: a.owedCents + l.owedCents,
      tipsCardCents: a.tipsCardCents + l.result.tipsCardCents,
      tipsCashCents: a.tipsCashCents + l.result.tipsCashCents,
      salesCents: a.salesCents + l.result.salesCents,
      minutes: a.minutes + l.result.minutesWorked
    }),
    { grossWagesCents: 0, owedCents: 0, tipsCardCents: 0, tipsCashCents: 0, salesCents: 0, minutes: 0 }
  );
  return { periodStart, periodEnd, rules, lines, totals };
}

export async function getRun(salonId: string, periodStart: string): Promise<(PayRun & { lines: PayLine[] }) | null> {
  const run = await db.select().from(payRuns).where(and(eq(payRuns.salonId, salonId), eq(payRuns.periodStart, periodStart))).get();
  if (!run) return null;
  const lines = await db.select().from(payLines).where(eq(payLines.payRunId, run.id));
  return { ...run, lines };
}

/** Freeze the computed week into pay_lines and mark the run approved. */
export async function approveRun(salon: Salon, periodStart: string, actor: Actor, userId: string) {
  const comp = await computeSalonWeek(salon, periodStart);
  let run = await db.select().from(payRuns).where(and(eq(payRuns.salonId, salon.id), eq(payRuns.periodStart, periodStart))).get();
  const now = nowIso();
  if (!run) {
    const id = newId();
    await db.insert(payRuns).values({ id, salonId: salon.id, periodStart, periodEnd: comp.periodEnd, status: 'approved', approvedAt: now, approvedByUserId: userId, rulesSnapshot: JSON.stringify(comp.rules.entries) });
    run = (await db.select().from(payRuns).where(eq(payRuns.id, id)).get())!;
  } else {
    if (run.status === 'paid') throw new Error('already_paid');
    await db.update(payRuns).set({ status: 'approved', approvedAt: now, approvedByUserId: userId, rulesSnapshot: JSON.stringify(comp.rules.entries) }).where(eq(payRuns.id, run.id));
  }
  const existing = await db.select().from(payLines).where(eq(payLines.payRunId, run.id));
  for (const l of comp.lines) {
    const prev = existing.find((e) => e.workerId === l.worker.id);
    const r = l.result;
    const values = {
      payBasis: r.payBasis,
      hoursWorked: r.minutesWorked,
      daysWorked: r.daysWorked,
      salesCents: r.salesCents,
      baseCents: r.baseCents,
      commissionCents: r.commissionCents,
      regularRateCents: r.regularRateCents,
      overtimeMinutes: r.overtimeMinutes,
      overtimePremiumCents: r.overtimePremiumCents,
      minWageTopupCents: r.minWageTopupCents,
      tipsCardCents: r.tipsCardCents,
      tipsCashCents: r.tipsCashCents,
      deductionsCents: r.deductionsCents,
      grossWagesCents: r.grossWagesCents,
      totalCents: r.totalCents,
      flags: JSON.stringify(r.flags),
      breakdown: JSON.stringify({ result: r, days: l.days, tickets: l.tickets, worker: l.worker, rules: comp.rules })
    };
    if (prev) {
      await db.update(payLines).set({ ...values, version: prev.version + 1 }).where(eq(payLines.id, prev.id));
      if (prev.grossWagesCents !== r.grossWagesCents || prev.hoursWorked !== r.minutesWorked)
        await recordEdit({ salonId: salon.id, entity: 'pay_line', entityId: prev.id, action: 'approve', field: 'gross_wages_cents', oldValue: prev.grossWagesCents, newValue: r.grossWagesCents, actor });
    } else {
      const id = newId();
      await db.insert(payLines).values({ id, payRunId: run.id, workerId: l.worker.id, ...values });
    }
  }
  // lines for workers no longer in the computation are left in place (history), nothing is deleted
  await recordEdit({ salonId: salon.id, entity: 'pay_run', entityId: run.id, action: 'approve', newValue: { periodStart, gross: comp.totals.grossWagesCents, owed: comp.totals.owedCents }, actor });
  return run.id;
}

export async function reopenRun(salon: Salon, periodStart: string, reason: string, actor: Actor) {
  const run = await db.select().from(payRuns).where(and(eq(payRuns.salonId, salon.id), eq(payRuns.periodStart, periodStart))).get();
  if (!run) return;
  await db.update(payRuns).set({ status: 'draft' }).where(eq(payRuns.id, run.id));
  await recordEdit({ salonId: salon.id, entity: 'pay_run', entityId: run.id, action: 'reopen', oldValue: run.status, newValue: 'draft', reason, actor });
}

export async function markPaid(
  salon: Salon,
  periodStart: string,
  payments: { workerId: string; cashCents: number; checkCents: number; payrollCents: number }[],
  paidOn: string,
  actor: Actor
) {
  const run = await getRun(salon.id, periodStart);
  if (!run || run.status === 'draft') throw new Error('not_approved');
  for (const p of payments) {
    const line = run.lines.find((l) => l.workerId === p.workerId);
    if (!line) continue;
    await db.update(payLines).set({ paidCashCents: p.cashCents, paidCheckCents: p.checkCents, paidPayrollCents: p.payrollCents, paidOn }).where(eq(payLines.id, line.id));
    await recordEdit({ salonId: salon.id, entity: 'pay_line', entityId: line.id, action: 'pay', newValue: { cash: p.cashCents, check: p.checkCents, payroll: p.payrollCents, paidOn }, actor });
  }
  await db.update(payRuns).set({ status: 'paid', paidOn }).where(eq(payRuns.id, run.id));
  await recordEdit({ salonId: salon.id, entity: 'pay_run', entityId: run.id, action: 'pay', newValue: paidOn, actor });
}

/** Lines of an approved run, hydrated from the frozen breakdown. */
export function hydrateLine(line: PayLine): WeekLine & { lineId: string; paid: { cash: number; check: number; payroll: number; on: string | null }; version: number } {
  const b = JSON.parse(line.breakdown ?? '{}');
  return {
    lineId: line.id,
    worker: b.worker,
    result: b.result,
    days: b.days,
    tickets: b.tickets,
    owedCents: complianceOwedCents(b.result),
    paid: { cash: line.paidCashCents, check: line.paidCheckCents, payroll: line.paidPayrollCents, on: line.paidOn },
    version: line.version
  };
}

/** List workweeks that have any punches, tickets or a run, newest first. */
export async function listWeeks(salon: Salon, limit = 26): Promise<{ periodStart: string; run: PayRun | null }[]> {
  const runs = await db.select().from(payRuns).where(eq(payRuns.salonId, salon.id));
  const starts = new Set<string>(runs.map((r) => r.periodStart));
  const { weekStart, localDate, addDays } = await import('$lib/time');
  const today = localDate(nowIso(), salon.timezone);
  const current = weekStart(today, salon.workweekStart);
  // include the last `limit` weeks regardless, so the owner can open any recent week
  for (let i = 0; i < limit; i++) starts.add(addDays(current, -7 * i));
  return [...starts]
    .sort()
    .reverse()
    .slice(0, limit + runs.length)
    .map((s) => ({ periodStart: s, run: runs.find((r) => r.periodStart === s) ?? null }));
}

export async function workerTicketsInRange(salonId: string, from: string, to: string) {
  return db
    .select()
    .from(tickets)
    .where(and(eq(tickets.salonId, salonId), gte(tickets.workDate, from), lte(tickets.workDate, to)))
    .orderBy(tickets.ts);
}

export { inArray };
