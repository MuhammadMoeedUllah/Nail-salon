import { explainLine } from '$lib/pay/explain';
import pdfmake from 'pdfmake';
import type { TDocumentDefinitions, Content, TableCell } from 'pdfmake/interfaces';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { translate, type Locale, type MessageKey } from '$lib/i18n';
import { fmtCents, fmtDate, fmtDateLong, fmtHours, fmtMinutes, fmtRate, localTime, fmtDateTime } from '$lib/time';
import type { WeekLine } from './payrun';

function fontPath(file: string) {
  for (const c of [`./build/client/fonts/${file}`, `./static/fonts/${file}`, `../static/fonts/${file}`]) {
    const p = resolve(c);
    if (existsSync(p)) return p;
  }
  throw new Error(`font not found: ${file}`);
}

let fontsReady = false;
function ensureFonts() {
  if (fontsReady) return;
  const regular = fontPath('NotoSans-Regular.ttf');
  const bold = fontPath('NotoSans-Bold.ttf');
  const pm = pdfmake as unknown as {
    setFonts: (f: Record<string, Record<string, string>>) => void;
    setUrlAccessPolicy?: (p: (url: string) => boolean) => void;
    setLocalAccessPolicy?: (p: (path: string) => boolean) => void;
  };
  pm.setFonts({ NotoSans: { normal: regular, bold, italics: regular, bolditalics: bold } });
  // The documents we build embed no external images or files.
  pm.setUrlAccessPolicy?.(() => false);
  pm.setLocalAccessPolicy?.((p) => p.endsWith('.ttf'));
  fontsReady = true;
}

export async function renderPdf(def: TDocumentDefinitions): Promise<Buffer> {
  ensureFonts();
  const pm = pdfmake as unknown as { createPdf: (d: TDocumentDefinitions) => { getBuffer: () => Promise<Buffer> } };
  const doc = pm.createPdf({
    defaultStyle: { font: 'NotoSans', fontSize: 9 },
    pageSize: 'LETTER',
    pageMargins: [36, 40, 36, 40],
    footer: (page: number, total: number) => ({ text: `${page} / ${total}`, alignment: 'right', margin: [0, 10, 36, 0], fontSize: 8, color: '#777' }),
    ...def
  });
  return Buffer.from(await doc.getBuffer());
}

const th = (s: string, align: 'left' | 'right' = 'left'): TableCell => ({ text: s, bold: true, fillColor: '#f1f1ef', alignment: align });
const td = (s: string | number, align: 'left' | 'right' = 'left', extra: Record<string, unknown> = {}): TableCell => ({ text: String(s), alignment: align, ...extra });
const H = (s: string): Content => ({ text: s, bold: true, fontSize: 12, margin: [0, 10, 0, 4] });

export interface StatementCtx {
  locale: Locale;
  /** second language printed under each label (bilingual statements, UX-40) */
  second?: Locale | null;
  salon: { name: string; address?: string | null; licenseNo?: string | null };
  tz: string;
  period: { start: string; end: string };
  status: string;
  version: number;
  paid?: { cash: number; check: number; payroll: number; on: string | null } | null;
  generatedOn: string;
}

export function statementContent(line: WeekLine, ctx: StatementCtx): Content[] {
  const t1 = (k: MessageKey, p?: Record<string, string | number>) => translate(ctx.locale, k, p);
  // bilingual: "Tổng lương / Gross wages"
  const t = (k: MessageKey, p?: Record<string, string | number>) => (ctx.second ? `${t1(k, p)} / ${translate(ctx.second, k, p)}` : t1(k, p));
  const r = line.result;
  const w = line.worker;
  const basis = (() => {
    switch (w.payBasis) {
      case 'hourly': return `${t1('hourly_rate')} ${fmtCents(w.hourlyRateCents)}${t1('per_hour')}${w.commissionPct ? ` + ${t1('commission')} ${w.commissionPct}%` : ''}`;
      case 'day_rate': return `${t1('day_rate')} ${fmtCents(w.dayRateCents)}${t1('per_day')}`;
      case 'commission': return `${t1('commission')} ${w.commissionPct}%`;
      case 'day_rate_plus_commission': return `${t1('day_rate')} ${fmtCents(w.dayRateCents)}${t1('per_day')} + ${t1('commission')} ${w.commissionPct}%`;
      default: return `${t1('guarantee')} ${fmtCents(w.guaranteeCents)}${t1('per_week')} / ${t1('commission')} ${w.commissionPct}%`;
    }
  })();
  const summary: TableCell[][] = [
    [td(`${t('hours')} (${t1('days')}: ${r.daysWorked})`), td(`${fmtMinutes(r.minutesWorked)} (${fmtHours(r.minutesWorked)} ${t('hours_unit')})`, 'right')],
    [td(`${t('regular_hours')} / ${t('overtime_hours')}`), td(`${fmtHours(r.regularMinutes)} / ${fmtHours(r.overtimeMinutes)}`, 'right')],
    [td(t('sales')), td(fmtCents(r.salesCents), 'right')]
  ];
  if (r.commissionCents || w.commissionPct) summary.push([td(`${t('commission')} (${w.commissionPct}%)`), td(fmtCents(r.commissionCents), 'right')]);
  if (r.baseCents) summary.push([td(w.payBasis === 'hourly' ? t('hourly_rate') : w.payBasis === 'guarantee_or_commission' ? t('guarantee') : t('day_rate')), td(fmtCents(r.baseCents), 'right')]);
  summary.push([td(t('regular_rate')), td(r.minutesWorked ? fmtRate(r.regularRate) : '—', 'right')]);
  if (r.minWageTopupCents) summary.push([td(t('min_wage_topup'), 'left', { color: '#b91c1c' }), td('+ ' + fmtCents(r.minWageTopupCents), 'right', { color: '#b91c1c' })]);
  if (r.overtimePremiumCents) summary.push([td(`${t('overtime_premium')} (${fmtHours(r.overtimeMinutes)} ${t1('hours_unit')} × ½ × ${fmtRate(r.regularRate)})`, 'left', { color: '#b91c1c' }), td('+ ' + fmtCents(r.overtimePremiumCents), 'right', { color: '#b91c1c' })]);
  if (r.spreadOfHoursCents) summary.push([td(t('spread_of_hours')), td('+ ' + fmtCents(r.spreadOfHoursCents), 'right')]);
  if (r.deductionsCents) summary.push([td(t('deductions')), td('− ' + fmtCents(r.deductionsCents), 'right')]);
  summary.push([td(t('gross_wages'), 'left', { bold: true }), td(fmtCents(r.grossWagesCents), 'right', { bold: true })]);
  summary.push([td(t('tip_card')), td(fmtCents(r.tipsCardCents), 'right')]);
  if (r.tipsCardPaidOutCents) {
    summary.push([td('   ' + t('tips_paid_out'), 'left', { color: '#555' }), td('− ' + fmtCents(r.tipsCardPaidOutCents), 'right', { color: '#555' })]);
    summary.push([td('   ' + t('card_tips_owed_label')), td(fmtCents(r.tipsCardOwedCents), 'right')]);
  }
  summary.push([td(t('tip_cash')), td(fmtCents(r.tipsCashCents), 'right')]);
  summary.push([td(t('total_pay'), 'left', { bold: true, fontSize: 11 }), td(fmtCents(r.totalCents), 'right', { bold: true, fontSize: 11 })]);
  if (ctx.paid && (ctx.paid.cash || ctx.paid.check || ctx.paid.payroll)) {
    const parts = [ctx.paid.cash ? `${t('cash')} ${fmtCents(ctx.paid.cash)}` : '', ctx.paid.check ? `${t('paid_check')} ${fmtCents(ctx.paid.check)}` : '', ctx.paid.payroll ? `${t('paid_payroll')} ${fmtCents(ctx.paid.payroll)}` : ''].filter(Boolean);
    summary.push([td(t('st_paid_by')), td(parts.join(' · '), 'right')]);
  }

  const days = line.days.filter((d) => d.minutes > 0 || d.open || d.punchCount);
  const dayRows: TableCell[][] = days.map((d) => [td(fmtDate(d.date, ctx.locale)), td(d.firstIn ? localTime(d.firstIn, ctx.tz) : '—'), td(d.lastOut ? localTime(d.lastOut, ctx.tz) : d.open ? t('still_in') : '—'), td(fmtMinutes(d.minutes), 'right')]);
  dayRows.push([td(t('total'), 'left', { bold: true, colSpan: 3 }), {}, {}, td(fmtMinutes(r.minutesWorked), 'right', { bold: true })]);

  const tkRows: TableCell[][] = line.tickets.map((tk) => [td(fmtDate(tk.workDate, ctx.locale)), td(localTime(tk.ts, ctx.tz)), td(tk.ticketNo ?? ''), td(tk.serviceName), td(fmtCents(tk.priceCents), 'right'), td(tk.tipCardCents ? fmtCents(tk.tipCardCents) : '', 'right'), td(tk.tipCashCents ? fmtCents(tk.tipCashCents) : '', 'right')]);
  tkRows.push([td(`${t('total')} (${line.tickets.length})`, 'left', { bold: true, colSpan: 4 }), {}, {}, {}, td(fmtCents(r.salesCents), 'right', { bold: true }), td(fmtCents(r.tipsCardCents), 'right', { bold: true }), td(fmtCents(r.tipsCashCents), 'right', { bold: true })]);

  // the calculation as sentences, never variable names (R29)
  const bdRows: TableCell[][] = r.breakdown.map((b, i) => [
    td(String(i + 1), 'left', { color: '#777' }),
    { stack: [{ text: explainLine(b, ctx.locale) }, ...(ctx.second ? [{ text: explainLine(b, ctx.second), color: '#666' }] : []), ...(b.rule ? [{ text: b.rule, color: '#888', fontSize: 7 }] : [])] }
  ]);

  return [
    {
      columns: [
        [
          { text: t('statement'), fontSize: 16, bold: true },
          { text: `${t('st_period')}: ${fmtDateLong(ctx.period.start, ctx.locale)} – ${fmtDateLong(ctx.period.end, ctx.locale)}`, margin: [0, 2, 0, 0] },
          { text: `${t('st_version')} ${ctx.version} · ${t(`pay_status_${ctx.status}` as MessageKey)}${ctx.paid?.on ? ` · ${t('pay_paid_on')} ${ctx.paid.on}` : ''}`, color: '#777', fontSize: 8 }
        ],
        { width: 'auto', alignment: 'right', stack: [{ text: t('st_employer'), bold: true }, { text: ctx.salon.name }, ...(ctx.salon.address ? [{ text: ctx.salon.address, color: '#555' }] : []), ...(ctx.salon.licenseNo ? [{ text: `Lic. ${ctx.salon.licenseNo}`, color: '#777', fontSize: 8 }] : [])] }
      ]
    },
    { canvas: [{ type: 'line', x1: 0, y1: 6, x2: 540, y2: 6, lineWidth: 0.5, lineColor: '#bbb' }], margin: [0, 0, 0, 8] },
    { columns: [[{ text: t('st_employee'), color: '#777', fontSize: 8 }, { text: w.legalName, bold: true, fontSize: 13 }, { text: `${w.displayName} · ${w.occupation}`, color: '#555' }], [{ text: t('pay_basis'), color: '#777', fontSize: 8 }, { text: basis, bold: true }]] },
    H(t('st_summary')),
    { table: { widths: ['*', 'auto'], body: summary }, layout: 'lightHorizontalLines' },
    { text: t('st_tips_note'), fontSize: 7, color: '#777', margin: [0, 2, 0, 0] },
    H(t('st_hours_by_day')),
    { table: { widths: ['*', 'auto', 'auto', 'auto'], headerRows: 1, body: [[th(t('date')), th(t('in')), th(t('out')), th(t('hours'), 'right')], ...dayRows] }, layout: 'lightHorizontalLines' },
    H(t('st_your_tickets')),
    line.tickets.length
      ? { table: { widths: ['auto', 'auto', 'auto', '*', 'auto', 'auto', 'auto'], headerRows: 1, body: [[th(t('date')), th(t('time')), th(t('ticket_no')), th(t('service')), th(t('price'), 'right'), th(t('tip_card'), 'right'), th(t('tip_cash'), 'right')], ...tkRows] }, layout: 'lightHorizontalLines', fontSize: 8 }
      : { text: t('no_tickets'), color: '#777' },
    H(t('st_how_computed')),
    { table: { widths: ['auto', '*'], body: bdRows }, layout: 'lightHorizontalLines', fontSize: 8 },
    ...(r.flags.length ? [{ text: `${t('flags')}: ${r.flags.map((f) => t(`flag_${f}` as MessageKey)).join(' · ')}`, fontSize: 8, margin: [0, 4, 0, 0] } as Content] : []),
    { text: t('st_questions', { date: ctx.generatedOn }), fontSize: 7, color: '#777', margin: [0, 14, 0, 0] },
    { text: t('not_legal_advice'), fontSize: 7, color: '#777' }
  ];
}

export function statementPdf(line: WeekLine, ctx: StatementCtx) {
  return renderPdf({ content: statementContent(line, ctx), info: { title: `${translate(ctx.locale, 'statement')} ${line.worker.legalName} ${ctx.period.start}` } });
}

export interface BinderCtx {
  locale: Locale;
  salon: { name: string; address?: string | null; licenseNo?: string | null; state: string; region?: string | null; workweekStart: number; timezone: string };
  from: string;
  to: string;
  generatedOn: string;
  retentionYears: number;
  workers: { legalName: string; displayName: string; address: string | null; birthDate: string | null; sex: string | null; occupation: string; payBasis: string; hourlyRateCents: number; dayRateCents: number; commissionPct: number; guaranteeCents: number; hiredOn: string | null; endedOn: string | null; active: boolean }[];
  weeks: { periodStart: string; periodEnd: string; status: string; approvedAt: string | null; paidOn: string | null; lines: WeekLine[]; paid?: Record<string, { cash: number; check: number; payroll: number; on: string | null }> }[];
  punches: { workerName: string; workDate: string; tsIn: string; tsOut: string | null; breakMinutes: number; minutes: number; source: string; voided: boolean }[];
  edits: { ts: string; text: string; entity: string; entityId: string; reason: string | null }[];
  rules: { key: string; value: string | number; effective_from: string; source_title: string; source_url: string; checked_on: string; jurisdiction: string; region?: string | null }[];
}

export function binderPdf(ctx: BinderCtx) {
  const t = (k: MessageKey, p?: Record<string, string | number>) => translate(ctx.locale, k, p);
  const L = ctx.locale;
  const basisLabel = (b: string) => t(`basis_${b}` as MessageKey);
  const content: Content[] = [
    { text: t('audit_title'), fontSize: 20, bold: true, margin: [0, 120, 0, 6] },
    { text: ctx.salon.name, fontSize: 14 },
    { text: ctx.salon.address ?? '', color: '#555' },
    { text: `${t('audit_from')} ${fmtDateLong(ctx.from, L)} ${t('audit_to').toLowerCase()} ${fmtDateLong(ctx.to, L)}`, margin: [0, 10, 0, 0] },
    { text: `${t('state')}: ${ctx.salon.state}${ctx.salon.region ? ' · ' + ctx.salon.region : ''} · ${t('settings_workweek')}: ${t(`weekday_${ctx.salon.workweekStart}` as MessageKey)} · ${t('settings_timezone')}: ${ctx.salon.timezone}` },
    { text: `${t('audit_retention')}: ${ctx.retentionYears} y · 29 CFR 516.5, 516.6`, color: '#555' },
    { text: `${t('st_questions', { date: ctx.generatedOn })}`, color: '#777', fontSize: 8, margin: [0, 20, 0, 0] },
    { text: t('not_legal_advice'), color: '#777', fontSize: 8 },
    { text: t('rules_used'), bold: true, fontSize: 12, margin: [0, 30, 0, 4] },
    { table: { widths: ['auto', 'auto', 'auto', 'auto', '*', 'auto'], headerRows: 1, body: [[th(t('state')), th('key'), th('value'), th(t('effective')), th(t('source')), th(t('checked'))], ...ctx.rules.map((e) => [td(`${e.jurisdiction}${e.region ? ' · ' + e.region : ''}`), td(e.key), td(e.key === 'min_wage' ? fmtCents(Number(e.value)) + t('per_hour') : String(e.value)), td(e.effective_from), td(`${e.source_title}\n${e.source_url}`, 'left', { fontSize: 7 }), td(e.checked_on)])] }, layout: 'lightHorizontalLines', fontSize: 8 },

    { text: t('workers_title'), fontSize: 14, bold: true, pageBreak: 'before', margin: [0, 0, 0, 6] },
    { text: '29 CFR 516.2(a)(1)-(4), (6)', color: '#777', fontSize: 8, margin: [0, 0, 0, 4] },
    { table: { widths: ['*', 'auto', '*', 'auto', 'auto', '*', 'auto'], headerRows: 1, body: [[th(t('legal_name')), th(t('display_name')), th(t('address')), th(t('birth_date')), th(t('occupation')), th(t('pay_basis')), th(t('hired_on'))], ...ctx.workers.map((w) => {
      const rate = w.payBasis === 'hourly' ? `${fmtCents(w.hourlyRateCents)}${t('per_hour')}` : w.payBasis === 'guarantee_or_commission' ? `${fmtCents(w.guaranteeCents)}${t('per_week')}` : w.dayRateCents ? `${fmtCents(w.dayRateCents)}${t('per_day')}` : '';
      return [td(w.legalName), td(w.displayName), td(w.address ?? ''), td(w.birthDate ?? ''), td(`${w.occupation}${w.sex ? ' · ' + w.sex : ''}`), td(`${basisLabel(w.payBasis)} ${rate}${w.commissionPct ? ` + ${w.commissionPct}%` : ''}`), td(`${w.hiredOn ?? ''}${w.endedOn ? ' → ' + w.endedOn : ''}${w.active ? '' : ' (' + t('inactive') + ')'}`)];
    })] }, layout: 'lightHorizontalLines', fontSize: 8 }
  ];

  // Pay by week
  content.push({ text: t('pay_title'), fontSize: 14, bold: true, pageBreak: 'before', margin: [0, 0, 0, 6] }, { text: '29 CFR 516.2(a)(5)-(12)', color: '#777', fontSize: 8, margin: [0, 0, 0, 4] });
  for (const wk of ctx.weeks) {
    content.push({ text: `${t('pay_week')} ${fmtDateLong(wk.periodStart, L)} – ${fmtDateLong(wk.periodEnd, L)} · ${t(`pay_status_${wk.status}` as MessageKey)}${wk.approvedAt ? ` · ${t('pay_status_approved')} ${wk.approvedAt.slice(0, 10)}` : ''}${wk.paidOn ? ` · ${t('pay_paid_on')} ${wk.paidOn}` : ''}`, bold: true, margin: [0, 8, 0, 3] });
    const body: TableCell[][] = [[th(t('technician')), th(t('days'), 'right'), th(t('hours'), 'right'), th(t('overtime_hours'), 'right'), th(t('sales'), 'right'), th(t('commission'), 'right'), th(t('day_rate'), 'right'), th(t('regular_rate'), 'right'), th(t('min_wage_topup'), 'right'), th(t('overtime_premium'), 'right'), th(t('gross_wages'), 'right'), th(t('tip_card'), 'right'), th(t('tip_cash'), 'right'), th(t('st_paid_by'))]];
    for (const l of wk.lines) {
      const r = l.result;
      const p = wk.paid?.[l.worker.id];
      body.push([td(l.worker.legalName), td(r.daysWorked, 'right'), td(fmtHours(r.minutesWorked), 'right'), td(fmtHours(r.overtimeMinutes), 'right'), td(fmtCents(r.salesCents), 'right'), td(fmtCents(r.commissionCents), 'right'), td(fmtCents(r.baseCents), 'right'), td(r.minutesWorked ? fmtRate(r.regularRate) : '', 'right'), td(fmtCents(r.minWageTopupCents), 'right'), td(fmtCents(r.overtimePremiumCents), 'right'), td(fmtCents(r.grossWagesCents), 'right', { bold: true }), td(fmtCents(r.tipsCardCents), 'right'), td(fmtCents(r.tipsCashCents), 'right'), td(p ? [p.cash ? `${t('cash')} ${fmtCents(p.cash)}` : '', p.check ? `${t('paid_check')} ${fmtCents(p.check)}` : '', p.payroll ? `${t('paid_payroll')} ${fmtCents(p.payroll)}` : ''].filter(Boolean).join(' ') + (p.on ? ` (${p.on})` : '') : '')]);
    }
    content.push({ table: { headerRows: 1, widths: ['*', ...Array(12).fill('auto'), 'auto'], body }, layout: 'lightHorizontalLines', fontSize: 7 });
  }

  // Hours by day
  content.push({ text: `${t('st_hours_by_day')} · 29 CFR 516.2(a)(7)`, fontSize: 14, bold: true, pageBreak: 'before', margin: [0, 0, 0, 6] });
  content.push({
    table: { headerRows: 1, widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'], body: [[th(t('technician')), th(t('date')), th(t('in')), th(t('out')), th(t('break_minutes'), 'right'), th(t('hours'), 'right'), th(t('source'))], ...ctx.punches.map((p) => [td(p.workerName), td(p.workDate), td(localTime(p.tsIn, ctx.salon.timezone)), td(p.tsOut ? localTime(p.tsOut, ctx.salon.timezone) : '—'), td(p.breakMinutes, 'right'), td(fmtMinutes(p.minutes), 'right'), td(p.voided ? `${p.source} (${t('voided')})` : p.source)])] },
    layout: 'lightHorizontalLines',
    fontSize: 7
  });

  // Edit history
  content.push({ text: t('audit_edit_history'), fontSize: 14, bold: true, pageBreak: 'before', margin: [0, 0, 0, 6] });
  content.push({
    // one readable sentence per change; the raw values are in the CSV export (edits.csv)
    table: { headerRows: 1, widths: ['auto', '*', 'auto', 'auto'], body: [[th(t('audit_when')), th(t('audit_what')), th(t('audit_why')), th('record')], ...ctx.edits.map((e) => [td(fmtDateTime(e.ts, ctx.salon.timezone, L)), td(e.text), td(e.reason ?? ''), td(`${e.entity} ${e.entityId.slice(0, 8)}`, 'left', { color: '#777' })])] },
    layout: 'lightHorizontalLines',
    fontSize: 7
  });

  return renderPdf({ pageOrientation: 'landscape', content, info: { title: `${t('audit_title')} ${ctx.salon.name} ${ctx.from} ${ctx.to}` } });
}
